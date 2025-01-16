import type { GenericNode, GenericParent } from 'myst-common';
import { NotebookCellTags, RuleId, fileError, fileWarn } from 'myst-common';
import type { Image, Outputs } from 'myst-spec-ext';
import { select, selectAll } from 'unist-util-select';
import yaml from 'js-yaml';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types.js';

// Note: There may be a space in between the "# |", which is introduced by `black` in python.
const CELL_OPTION_PREFIX = /^#\s?\| /;
const IPYTHON_MAGIC = /^%%/;

/**
 * Parse metadata from code block using js-yaml
 *
 * Metadata is defined at the beginning of code cells as:
 *
 * ```python
 * #| key: value
 * #| flag: true
 *
 * print('hello world')
 * ```
 *
 * New lines around metadata will be ignored, but once a non-metadata line
 * is encountered, metadata parsing is stopped (i.e. you cannot define
 * metadata in the middle of other code).
 */
export function metadataFromCode(
  session: ISession,
  file: VFile,
  value: string,
  opts?: { remove?: boolean },
): { value: string; metadata?: Record<string, any> } {
  const metaLines: string[] = [];
  const outputLines: string[] = [];
  let expectIpython = true;
  let inHeader = true;
  value.split('\n').forEach((line) => {
    if (inHeader) {
      if (expectIpython && line.match(IPYTHON_MAGIC)) {
        // This is silly logic, but we need to push regardless
        // not just if we are in the header
        if (opts?.remove) outputLines.push(line);
        expectIpython = false;
      } else if (line.match(CELL_OPTION_PREFIX)) {
        metaLines.push(line.replace(CELL_OPTION_PREFIX, ''));
      } else if (line.trim()) {
        inHeader = false;
      }
    }
    if (!inHeader || !opts?.remove) {
      outputLines.push(line);
    }
  });
  let metadata: Record<string, any> | undefined;
  if (metaLines.length) {
    try {
      metadata = yaml.load(metaLines.join('\n')) as Record<string, any>;
    } catch {
      fileError(file, `Invalid code cell metadata`, { ruleId: RuleId.codeMetadataLoads });
    }
  }
  if (!metadata) {
    return { value };
  }
  return {
    value: outputLines.join('\n'),
    metadata,
  };
}

/**
 * Traverse mdast, remove code cell metadata, and add it to parent block
 */
export function liftCodeMetadataToBlock(session: ISession, file: VFile, mdast: GenericParent) {
  const blocks = selectAll('block', mdast) as GenericNode[];
  blocks.forEach((block) => {
    const codeNodes = selectAll('code', block) as GenericNode[];
    let blockMetadata: Record<string, any> | undefined;
    codeNodes.forEach((node) => {
      if (!node.value) return;
      const { metadata, value } = metadataFromCode(session, file, node.value, { remove: true });
      if (blockMetadata && metadata) {
        fileWarn(file, `Multiple code blocks with metadata found in ${file.path}`, {
          node,
          ruleId: RuleId.codeMetadataLifted,
        });
      } else {
        blockMetadata = metadata;
      }
      node.value = value;
    });
    if (blockMetadata) {
      block.data = block.data ? { ...block.data, ...blockMetadata } : blockMetadata;
    }
  });
}

/**
 * Check duplicated meta tags and conflict meta tags.
 * Separate the meta tags from tag if filter is true, otherwise just go through and process.
 */
export function checkMetaTags(
  vfile: VFile,
  node: GenericNode,
  tags: string[],
  filter: boolean,
): string[] {
  const metaTagsCounter = new Map();
  for (const action of ['hide', 'remove']) {
    for (const target of ['cell', 'input', 'output']) {
      metaTagsCounter.set(`${action}-${target}`, 0);
    }
  }
  const check = (tag: string) => {
    const isMetaTag = metaTagsCounter.has(tag);
    if (isMetaTag) {
      metaTagsCounter.set(tag, metaTagsCounter.get(tag) + 1);
    }
    return !isMetaTag;
  };
  if (filter) {
    tags.splice(0, tags.length, ...tags.filter(check));
  } else {
    tags.forEach(check);
  }
  const validMetatags = [];
  metaTagsCounter.forEach((value, key) => {
    if (value >= 2) {
      fileWarn(vfile, `tag '${key}' is duplicated`, { node, ruleId: RuleId.codeMetatagsValid });
    }
  });
  for (const target of ['cell', 'input', 'output']) {
    const hide = metaTagsCounter.get(`hide-${target}`) > 0;
    const remove = metaTagsCounter.get(`remove-${target}`) > 0;
    if (hide && remove) {
      fileWarn(vfile, `'hide-${target}' and 'remove-${target}' both exist`, {
        node,
        ruleId: RuleId.codeMetatagsValid,
      });
      validMetatags.push(`remove-${target}`);
    } else if (hide) {
      validMetatags.push(`hide-${target}`);
    } else if (remove) {
      validMetatags.push(`remove-${target}`);
    }
  }
  return validMetatags;
}

/**
 * Traverse mdast, propagate block metadata and tags to code and output
 */
export function propagateBlockDataToCode(session: ISession, vfile: VFile, mdast: GenericParent) {
  const blocks = selectAll('block', mdast) as GenericNode[];
  blocks.forEach((block) => {
    if (!block.data) return;
    const outputsNode = select('outputs', block) as Outputs | null;
    if (block.data.placeholder && outputsNode) {
      outputsNode.children.push({
        type: 'image',
        placeholder: true,
        url: block.data.placeholder as string,
        alt: block.data.alt as string,
        width: block.data.width as string,
        height: block.data.height as string,
        align: block.data.align as Image['align'],
      } as Image);
    }
    if (!block.data.tags) return;
    if (!Array.isArray(block.data.tags)) {
      fileError(vfile, `tags in code-cell directive must be a list of strings`, {
        node: block,
        ruleId: RuleId.codeMetatagsValid,
      });
      return;
    }
    const validMetatags = checkMetaTags(vfile, block, block.data.tags, true);
    const codeNode = select('code[executable=true]', block) as GenericNode | null;
    validMetatags.forEach((tag: string) => {
      switch (tag) {
        // should we raise when hide and remove both exist?
        case NotebookCellTags.hideCell:
          block.visibility = 'hide';
          break;
        case NotebookCellTags.removeCell:
          block.visibility = 'remove';
          break;
        case NotebookCellTags.hideInput:
          if (codeNode) codeNode.visibility = 'hide';
          break;
        case NotebookCellTags.removeInput:
          if (codeNode) codeNode.visibility = 'remove';
          break;
        case NotebookCellTags.hideOutput:
          if (outputsNode) outputsNode.visibility = 'hide';
          break;
        case NotebookCellTags.removeOutput:
          if (outputsNode) outputsNode.visibility = 'remove';
          break;
        default:
          session.log.debug(`tag '${tag}' is not valid in code-cell tags'`);
      }
    });
    if (!block.visibility) block.visibility = 'show';
    if (codeNode && !codeNode.visibility) codeNode.visibility = 'show';
    if (outputsNode && !outputsNode.visibility) outputsNode.visibility = 'show';
  });
}

/**
 * Because jupytext style notebooks can introduce code-cells in blocks
 * after explicit thematic breaks, we need to lift them up to the parent
 * to ensure that all executable code blocks are at the top level of
 * the document.
 *
 * @param mdast
 */
export function transformLiftCodeBlocksInJupytext(mdast: GenericParent) {
  const flattened = (mdast.children as GenericParent[]).reduce((acc, node) => {
    if (node.type !== 'block' || !node.children) return [...acc, node];

    const buriedCodeCells = selectAll('block:has(block)', node);
    if (buriedCodeCells.length === 0) return [...acc, node];

    const newBlocks: GenericParent[] = [{ ...node, children: [] }];
    node.children?.forEach((child) => {
      // if this is a code-cell block with code+output
      // add any nodes accumulated so far and add the code-cell block
      if (
        child.type === 'block' &&
        child.children?.length === 2 &&
        child.children?.[0].type === 'code' &&
        child.children?.[1].type === 'output'
      ) {
        newBlocks.push(child as GenericParent);
        newBlocks.push({ type: 'block', children: [] });
        return;
      }

      // add the node to the new block
      newBlocks[newBlocks.length - 1].children?.push(child);
    });

    if (newBlocks[newBlocks.length - 1].children?.length === 0) newBlocks.pop();

    return [...acc, ...newBlocks];
  }, [] as GenericParent[]);

  mdast.children = flattened;
}
