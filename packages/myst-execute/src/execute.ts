import { select, selectAll } from 'unist-util-select';
import type { Logger } from 'myst-cli-utils';
import type { PageFrontmatter, KernelSpec } from 'myst-frontmatter';
import type { Kernel, KernelMessage, Session, SessionManager } from '@jupyterlab/services';
import type { Block, Code, InlineExpression, Output, Outputs } from 'myst-spec-ext';
import type { IOutput } from '@jupyterlab/nbformat';
import type { GenericNode, GenericParent, IExpressionResult, IExpressionError } from 'myst-common';
import { NotebookCell, NotebookCellTags, fileError } from 'myst-common';
import type { VFile } from 'vfile';
import path from 'node:path';
import assert from 'node:assert';
import { createHash } from 'node:crypto';
import type { Plugin } from 'unified';
import type { ICache } from './cache.js';

/**
 * Interpret an IOPub message as an IOutput object
 *
 * @param msg IOPub message
 */
function IOPubAsOutput(msg: KernelMessage.IIOPubMessage): IOutput {
  return {
    output_type: msg.header.msg_type,
    ...msg.content,
  };
}

/**
 * Execute a code string in the given kernel, returning any outputs.
 *
 * @param kernel connection to an active kernel
 * @param code code to execute
 */
async function executeCode(kernel: Kernel.IKernelConnection, code: string) {
  const future = kernel.requestExecute({
    code: code,
  });

  const outputs: IOutput[] = [];
  future.onIOPub = (msg) => {
    // Only listen for replies to this execution
    if (
      (msg.parent_header as any).msg_id !== future.msg.header.msg_id ||
      (msg.parent_header as any).msg_type !== 'execute_request'
    ) {
      return;
    }
    switch (msg.header.msg_type) {
      case 'stream':
      case 'execute_result':
      case 'error':
      case 'display_data':
        outputs.push(IOPubAsOutput(msg));
        break;
      default:
        return;
    }
  };
  let status: 'abort' | 'error' | 'ok' | undefined;
  future.onReply = (msg: KernelMessage.IExecuteReplyMsg) => {
    status = msg.content.status;
  };
  await future.done;
  assert(status !== undefined);
  return { status, outputs };
}

/**
 * Evaluate an expression string in the given kernel, returning the singular result.
 *
 * @param kernel connection to an active kernel
 * @param code code to execute
 */
async function evaluateExpression(kernel: Kernel.IKernelConnection, expr: string) {
  // TODO: batch user expressions by cell?
  const future = kernel.requestExecute({
    code: '',
    user_expressions: {
      expr: expr,
    },
  });
  let result: IExpressionResult | undefined;
  future.onReply = (msg: KernelMessage.IExecuteReplyMsg) => {
    switch (msg.content.status) {
      case 'ok':
        // Pull out expr
        result = (msg.content.user_expressions as unknown as Record<string, IExpressionResult>)[
          'expr'
        ];
        break;
      case 'error':
        assert(false); // We shouldn't hit this, because we don't evaluate expressions AND code simultaneously.
        break;
      default:
        break;
    }
  };
  await future.done;
  // It doesn't make sense for this to be undefined instead of an error
  assert(result !== undefined);
  return { status: result.status, result };
}

/**
 * Build a cache key from an array of executable nodes
 *
 * @param nodes array of executable nodes
 */
function buildCacheKey(kernelSpec: KernelSpec, nodes: (CodeBlock | InlineExpression)[]): string {
  // Build an array of hashable items from an array of nodes
  const hashableItems: {
    kind: string;
    content: string;
    raisesException: boolean;
  }[] = [];
  for (const node of nodes) {
    if (isCellBlock(node)) {
      hashableItems.push({
        kind: node.type,
        content: (select('code', node) as Code).value,
        raisesException: codeBlockRaisesException(node),
      });
    } else {
      assert(isInlineExpression(node));
      hashableItems.push({
        kind: node.type,
        content: node.value,
        raisesException: false,
      });
    }
  }

  // Build a hash from notebook state
  return createHash('md5')
    .update(kernelSpec.name)
    .update(JSON.stringify(hashableItems))
    .digest('hex');
}

/**
 * Type narrowing Output to contain IOutput data
 *
 * TODO: lift this to the myst-spec definition
 */
type CodeBlockOutput = Output & {
  data: IOutput[];
};

/**
 * Type narrowing Block to contain code-cells and code-cell outputs
 *
 * TODO: lift this to the myst-spec definition
 */

type CodeBlock = Block & {
  kind: 'code';
  data?: {
    tags?: string[];
  };
  children: (Code | CodeBlockOutput)[];
};

/**
 * Return true if the given node is a block over a code node and output node
 *
 * @param node node to test
 */
function isCellBlock(node: GenericNode): node is CodeBlock {
  return node.type === 'block' && select('code', node) !== null && select('outputs', node) !== null;
}

/**
 * Return true if the given code block is expected to raise an exception
 *
 * @param node block to test
 */
function codeBlockRaisesException(node: CodeBlock) {
  return !!node.data?.tags?.includes?.(NotebookCellTags.raisesException);
}
/**
 * Return true if the given code block should not be executed
 *
 * @param node block to test
 */
function codeBlockSkipsExecution(node: CodeBlock) {
  return !!node.data?.tags?.includes?.(NotebookCellTags.skipExecution);
}

/**
 * Return true if the given node is an inlineExpression node
 *
 * @param node node to test
 */
function isInlineExpression(node: GenericNode): node is InlineExpression {
  return node.type === 'inlineExpression';
}

/**
 * For each executable node, perform a kernel execution request and return the results.
 * Return an additional boolean indicating whether an error occurred.
 *
 * @param kernel
 * @param nodes
 * @param vfile
 */
async function computeExecutableNodes(
  kernel: Kernel.IKernelConnection,
  nodes: (CodeBlock | InlineExpression)[],
  opts: { vfile: VFile },
): Promise<{
  results: (IOutput[] | IExpressionResult)[];
  errorOccurred: boolean;
}> {
  let errorOccurred = false;

  const results: (IOutput[] | IExpressionResult)[] = [];
  for (const matchedNode of nodes) {
    if (isCellBlock(matchedNode)) {
      // Pull out code to execute
      const code = select('code', matchedNode) as Code;
      const { status, outputs } = await executeCode(kernel, code.value);
      // Cache result
      results.push(outputs);

      // Check for errors
      const allowErrors = codeBlockRaisesException(matchedNode);
      if (status === 'error' && !allowErrors) {
        const errorMessage = outputs
          .map((item) => item.traceback)
          .flat()
          .join('\n');
        fileError(
          opts.vfile,
          `An exception occurred during code execution, halting further execution:\n\n${errorMessage}`,
          {
            node: matchedNode,
          },
        );
        // Make a note of the failure
        errorOccurred = true;
        break;
      }
    } else if (isInlineExpression(matchedNode)) {
      // Directly evaluate the expression
      const { status, result } = await evaluateExpression(kernel, matchedNode.value);

      // Check for errors
      if (status === 'error') {
        const errorMessage = (result as IExpressionError).traceback.join('\n');
        fileError(
          opts.vfile,
          `An exception occurred during expression evaluation, halting further execution:\n\n${errorMessage}`,
          { node: matchedNode },
        );
        // Make a note of the failure
        errorOccurred = true;
        break;
      }
      // Cache result
      results.push(result);
    } else {
      assert(false);
    }
  }
  return { results, errorOccurred };
}

/**
 * Apply computed outputs (MIME bundles, stdout, etc.) to MDAST.
 * If an unanticipated error occurred during execution, the length of
 * `computedResult` may not correspond to that of `nodes` (it may be shorter)
 *
 * @param nodes executable MDAST nodes
 * @param computedResult computed results for each node
 */
function applyComputedOutputsToNodes(
  nodes: (CodeBlock | InlineExpression)[],
  computedResult: (IOutput[] | IExpressionResult)[],
) {
  for (const matchedNode of nodes) {
    // Pull out the result for this node
    const thisResult = computedResult.shift();

    if (isCellBlock(matchedNode)) {
      const rawOutputData = (thisResult as IOutput[]) ?? [];
      // Pull out outputs to set data
      const outputs = select('outputs', matchedNode) as Outputs;
      // Ensure that whether this fails or succeeds, we write to `children` (e.g. due to a kernel error)
      outputs.children = rawOutputData.map((data) => {
        return { type: 'output', children: [], jupyter_data: data as any };
      });
    } else if (isInlineExpression(matchedNode)) {
      const rawOutputData = thisResult as Record<string, unknown> | undefined;
      // Set data of expression to the result, or empty if we don't have one
      matchedNode.result = rawOutputData;
    } else {
      // This should never happen
      throw new Error('Node must be either code block or inline expression.');
    }
  }
}

export type Options = {
  basePath: string;
  cache: ICache<(IExpressionResult | IOutput[])[]>;
  sessionFactory: () => Promise<SessionManager | undefined>;
  frontmatter: PageFrontmatter;
  ignoreCache?: boolean;
  errorIsFatal?: boolean;
  log?: Logger;
};

/**
 * Transform an AST to include the outputs of executing the given notebook
 *
 * @param tree
 * @param vfile
 * @param opts
 */
export async function kernelExecutionTransform(tree: GenericParent, vfile: VFile, opts: Options) {
  const log = opts.log ?? console;

  // Pull out code-like nodes
  const executableNodes = (
    selectAll(`block[kind=${NotebookCell.code}],inlineExpression`, tree) as (
      | CodeBlock
      | InlineExpression
    )[]
  )
    // Filter out nodes that skip execution
    .filter((node) => !(isCellBlock(node) && codeBlockSkipsExecution(node)));

  // Only do something if we have any nodes!
  if (executableNodes.length === 0) {
    return;
  }

  // We need the kernelspec to proceed
  if (opts.frontmatter.kernelspec === undefined) {
    return fileError(
      vfile,
      `Notebook does not declare the necessary 'kernelspec' frontmatter key required for execution`,
    );
  }

  // See if we already cached this execution
  const cacheKey = buildCacheKey(opts.frontmatter.kernelspec, executableNodes);
  let cachedResults: (IExpressionResult | IOutput[])[] | undefined = opts.cache.get(cacheKey);

  // Do we need to re-execute notebook?
  if (opts.ignoreCache || cachedResults === undefined) {
    log.info(
      `💿 Executing Notebook (${vfile.path}) ${
        opts.ignoreCache ? '[cache ignored]' : '[no execution cache found]'
      }`,
    );
    const sessionManager = await opts.sessionFactory();
    // Do we not have a working session?
    if (sessionManager === undefined) {
      fileError(vfile, `Could not load Jupyter session manager to run executable nodes`, {
        fatal: opts.errorIsFatal,
      });
    }
    // Otherwise, boot up a kernel, and execute each cell
    else {
      let sessionConnection: Session.ISessionConnection | undefined;
      const sessionOpts = {
        path: path.relative(opts.basePath, vfile.path),
        type: 'notebook',
        name: path.basename(vfile.path),
        kernel: {
          name: opts.frontmatter.kernelspec.name,
        },
      };
      await sessionManager
        .startNew(sessionOpts)
        .catch((err) => {
          log.debug((err as Error).stack);
          log.error(`Jupyter Connection Error: ${(err as Error).message}`);
        })
        .then(async (conn) => {
          if (!conn) return;
          sessionConnection = conn;
          assert(conn.kernel);
          log.debug(`Connected to kernel ${conn.kernel.name}`);
          // Execute notebook
          const { results, errorOccurred } = await computeExecutableNodes(
            conn.kernel,
            executableNodes,
            { vfile },
          );
          // Populate cache if things were successful
          if (!errorOccurred) {
            opts.cache.set(cacheKey, results);
          }
          // Refer to these computed results
          cachedResults = results;
        })
        // Ensure that we shut-down the kernel
        .finally(async () => sessionConnection !== undefined && sessionConnection.shutdown());
    }
  } else {
    // We found the cache, adding them in below!
    log.info(`💾 Adding Cached Notebook Outputs (${vfile.path})`);
  }

  if (cachedResults) {
    // Apply results to tree
    applyComputedOutputsToNodes(executableNodes, cachedResults);
  }
}

export const kernelExecutionPlugin: Plugin<[Options], GenericParent, GenericParent> =
  (opts) => async (tree, file) => {
    await kernelExecutionTransform(tree, file, opts);
  };
