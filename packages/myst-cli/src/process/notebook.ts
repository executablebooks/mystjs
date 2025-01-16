import { NotebookCell, RuleId, fileWarn } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { nanoid } from 'nanoid';
import type {
  IAttachments,
  ICell,
  IMimeBundle,
  INotebookContent,
  INotebookMetadata,
  IOutput,
  MultilineString,
} from '@jupyterlab/nbformat';
import { CELL_TYPES, ensureString } from 'nbtx';
import { VFile } from 'vfile';
import { logMessagesFromVFile } from '../utils/logging.js';
import type { ISession } from '../session/types.js';
import { BASE64_HEADER_SPLIT } from '../transforms/images.js';
import { parseMyst } from './myst.js';
import type { Code, InlineExpression } from 'myst-spec-ext';
import type { IUserExpressionMetadata } from '../transforms/inlineExpressions.js';
import { findExpression, metadataSection } from '../transforms/inlineExpressions.js';
import { frontmatterValidationOpts } from '../frontmatter.js';

import { filterKeys } from 'simple-validators';
import {
  validatePageFrontmatter,
  PAGE_FRONTMATTER_KEYS,
  FRONTMATTER_ALIASES,
} from 'myst-frontmatter';
import type { PageFrontmatter } from 'myst-frontmatter';

function blockParent(cell: ICell, children: GenericNode[]) {
  const kind = cell.cell_type === CELL_TYPES.code ? NotebookCell.code : NotebookCell.content;
  return { type: 'block', kind, data: JSON.parse(JSON.stringify(cell.metadata)), children };
}

/**
 *  mdast transform to move base64 cell attachments directly to image nodes
 *
 * The image transform subsequently handles writing this in-line base64 to file.
 */
function replaceAttachmentsTransform(
  session: ISession,
  mdast: GenericParent,
  attachments: IAttachments,
  file: string,
) {
  const vfile = new VFile();
  vfile.path = file;
  const imageNodes = selectAll('image', mdast);
  imageNodes.forEach((image: GenericNode) => {
    if (!image.url) return;
    const attachmentKey = (image.url as string).match(/^attachment:(.*)$/)?.[1];
    if (!attachmentKey) return;
    try {
      const attachment = Object.entries(attachments[attachmentKey] as IMimeBundle)[0];
      const mimeType = attachment[0];
      const attachmentVal = ensureString(attachment[1] as MultilineString);
      if (!attachmentVal) {
        fileWarn(vfile, `Unrecognized attachment name in ${file}: ${attachmentKey}`, {
          ruleId: RuleId.notebookAttachmentsResolve,
        });
      } else if (attachmentVal.includes(BASE64_HEADER_SPLIT)) {
        image.url = attachmentVal;
      } else {
        image.url = `data:${mimeType}${BASE64_HEADER_SPLIT}${attachmentVal}`;
      }
    } catch {
      fileWarn(vfile, `Unable to resolve attachment in ${file}: ${attachmentKey}`, {
        ruleId: RuleId.notebookAttachmentsResolve,
      });
    }
  });
  logMessagesFromVFile(session, vfile);
}

export async function processNotebook(
  session: ISession,
  file: string,
  content: string,
): Promise<GenericParent> {
  const { mdast } = await processNotebookFull(session, file, content);
  return mdast;
}

export async function processNotebookFull(
  session: ISession,
  file: string,
  content: string,
): Promise<{ mdast: GenericParent; frontmatter: PageFrontmatter; widgets: Record<string, any> }> {
  const { log } = session;
  const { metadata, cells } = JSON.parse(content) as INotebookContent;
  // notebook will be empty, use generateNotebookChildren, generateNotebookOrder here if we want to populate those

  const language = metadata?.kernelspec?.language ?? 'python';
  log.debug(`Processing Notebook: "${file}"`);

  // Load frontmatter from notebook metadata
  const vfile = new VFile();
  vfile.path = file;
  // Pull out only the keys we care about
  const filteredMetadata = filterKeys(metadata ?? {}, [
    ...PAGE_FRONTMATTER_KEYS,
    // Include aliased entries for page frontmatter keys
    ...Object.entries(FRONTMATTER_ALIASES)
      .filter(([_, value]) => PAGE_FRONTMATTER_KEYS.includes(value))
      .map(([key, _]) => key),
  ]);
  const frontmatter = validatePageFrontmatter(
    filteredMetadata ?? {},
    frontmatterValidationOpts(vfile),
  );

  // Load widgets from notebook metadata
  // TODO validation / sanitation
  const widgets = (metadata?.widgets ?? {}) as Record<string, any>;

  let end = cells.length;
  if (cells && cells.length > 1 && cells?.[cells.length - 1].source.length === 0) {
    end = -1;
  }

  const items = await cells?.slice(0, end).reduce(
    async (P, cell: ICell, index) => {
      const acc = await P;
      if (cell.cell_type === CELL_TYPES.markdown) {
        const cellContent = ensureString(cell.source);
        // If the first cell is a frontmatter block, do not put a block break above it
        const omitBlockDivider = index === 0 && cellContent.startsWith('---\n');
        const cellMdast = parseMyst(session, cellContent, file, { ignoreFrontmatter: index > 0 });
        if (cell.attachments) {
          replaceAttachmentsTransform(session, cellMdast, cell.attachments as IAttachments, file);
        }
        if (omitBlockDivider) {
          return acc.concat(...cellMdast.children);
        }
        const block = blockParent(cell, cellMdast.children) as GenericNode;

        // Embed expression results into expression
        const userExpressions = block.data?.[metadataSection] as
          | IUserExpressionMetadata[]
          | undefined;
        const inlineNodes = selectAll('inlineExpression', block) as InlineExpression[];
        inlineNodes.forEach((inlineExpression) => {
          const data = findExpression(userExpressions, inlineExpression.value);
          if (!data) return;
          inlineExpression.result = data.result as unknown as Record<string, unknown>;
        });
        return acc.concat(block);
      }
      if (cell.cell_type === CELL_TYPES.raw) {
        const raw: Code = {
          type: 'code',
          lang: '',
          value: ensureString(cell.source),
        };
        return acc.concat(blockParent(cell, [raw]));
      }
      if (cell.cell_type === CELL_TYPES.code) {
        const code: Code = {
          type: 'code',
          lang: language as string | undefined,
          executable: true,
          value: ensureString(cell.source),
        };

        const outputsChildren = (cell.outputs as IOutput[]).map((output) => {
          // Embed outputs in an output block
          const result = {
            type: 'output',
            jupyter_data: output,
            children: [],
          };
          return result;
        });
        const outputs = {
          type: 'outputs',
          id: nanoid(),
          children: outputsChildren,
        };
        return acc.concat(blockParent(cell, [code, outputs]));
      }
      return acc;
    },
    Promise.resolve([] as GenericNode[]),
  );

  logMessagesFromVFile(session, vfile);

  const mdast = { type: 'root', children: items };
  return { mdast, frontmatter, widgets };
}
