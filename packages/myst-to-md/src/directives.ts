import { dump as dumpYAML } from 'js-yaml';
import type { Handle, Info } from 'mdast-util-to-markdown';
import { defaultHandlers } from 'mdast-util-to-markdown';
import type { GenericNode } from 'myst-common';
import { toText, fileError, RuleId } from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import type { NestedState, Parent, Validator } from './types.js';
import { incrementNestedLevel, popNestedLevel } from './utils.js';

type DirectiveOptions = {
  argsKey?: string;
  keys?: string[];
  aliases?: Record<string, string>;
  transforms?: Record<string, (val: any) => string>;
  yaml?: boolean;
};

/**
Colons are used for directives which may have:
  - roles in the argument
  - nested directives in the body

Backticks are still used for code fences and directives with unparsed args/body
*/
const directiveChar = ':';

function argsFromNode(node: any, options?: DirectiveOptions) {
  const { argsKey } = options || {};
  return argsKey && node[argsKey] ? node[argsKey] : '';
}

function optionsFromNode(node: any, options?: DirectiveOptions) {
  const { keys, aliases, transforms, yaml } = options || {};
  const opts: Record<string, any> = {};
  (keys ?? [])
    .filter((key) => node[key] != null && node[key] !== false)
    .forEach((key) => {
      const optString = aliases?.[key] ? aliases[key] : key;
      const optValue = transforms?.[key] ? transforms[key](node[key]) : node[key];
      opts[optString] = optValue;
    });
  if (yaml && Object.keys(opts).length) {
    return `---\n${dumpYAML(opts)}---`.split('\n');
  }
  const optionsLines = Object.entries(opts).map(([key, value]) => {
    if (value === true) return `:${key}:`;
    return `:${key}: ${value}`;
  });
  return optionsLines;
}

/**
 * Handler for any directive with a static args, options, and value, not children
 */
function writeStaticDirective(name: string, options?: DirectiveOptions) {
  return (node: any, _: Parent, state: NestedState, info: Info): string => {
    const args = argsFromNode(node, options);
    const optionsLines = optionsFromNode(node, options);
    const nodeCopy = { ...node };
    // Remove special properties that show up on codeFence first line.
    // If these are present on a node, they are still rendered as options.
    delete nodeCopy.meta;
    delete nodeCopy.lang;
    const valueLines = defaultHandlers.code(nodeCopy, _, state, info).split('\n');
    if (optionsLines.length && valueLines.length > 2) optionsLines.push('');
    const directiveLines = [
      `${valueLines[0]}{${name}}${args ? ' ' : ''}${args ? args : ''}`,
      ...optionsLines,
      ...valueLines.slice(1),
    ];
    return directiveLines.join('\n');
  };
}

/**
 * Generic MyST directive handler
 *
 * This uses the directive name/args/value and ignores any children nodes
 */
function mystDirective(node: any, _: Parent, state: NestedState, info: Info): string {
  return writeStaticDirective(node.name, { argsKey: 'args' })(node, _, state, info);
}

const CODE_BLOCK_KEYS = [
  'class',
  'emphasizeLines',
  'label',
  'showLineNumbers',
  'startingLineNumber',
  'caption',
];

/**
 * Override default code handler for code-block directive
 *
 * If the code node only has lang/meta/value, it falls back to
 * non-directive code fence.
 */
function code(node: any, _: Parent, state: NestedState, info: Info): string {
  const nodeCodeBlockKeys = Object.keys(node).filter((k) => CODE_BLOCK_KEYS.includes(k));
  if (!nodeCodeBlockKeys.length) {
    return defaultHandlers.code(node, _, state, info);
  }
  const options = {
    argsKey: 'lang',
    keys: CODE_BLOCK_KEYS.concat('meta'),
    aliases: {
      label: 'name',
      showLineNumbers: 'linenos',
      startingLineNumber: 'lineno-start',
      emphasizeLines: 'emphasize-lines',
    },
    transforms: {
      emphasizeLines: (val: number[]) => val.join(','),
    },
  };
  return writeStaticDirective('code-block', options)(node, _, state, info);
}

const IMAGE_DIRECTIVE_OPTS = ['class', 'width', 'align'];
const IMAGE_OPTS = IMAGE_DIRECTIVE_OPTS.concat('title', 'alt');

/**
 * Override default image handler for image directive
 *
 * If the image node only has url/title/alt, it falls back to
 * non-directive image.
 */
function image(node: any, _: Parent, state: NestedState, info: Info): string {
  const nodeImageDirectiveKeys = Object.keys(node).filter((k) => IMAGE_DIRECTIVE_OPTS.includes(k));
  if (!nodeImageDirectiveKeys.length) return defaultHandlers.image(node, undefined, state, info);
  const options = {
    argsKey: 'url',
    keys: IMAGE_OPTS,
  };
  return writeStaticDirective('image', options)(node, _, state, info);
}

/**
 * Handler for any directive with children nodes
 *
 * This adds multiple backticks in cases where directives are nested
 */
function writeFlowDirective(name: string, args?: string, options?: DirectiveOptions) {
  return (node: any, _: Parent, state: NestedState, info: Info): string => {
    incrementNestedLevel('directive', state);
    const optionsLines = optionsFromNode(node, options);
    const content = state.containerFlow(node, info);
    const nesting = popNestedLevel('directive', state);
    const marker = directiveChar.repeat(nesting + 3);
    if (optionsLines.length && content) optionsLines.push('');
    const directiveLines = [
      `${marker}{${name}}${args ? ' ' : ''}${args ? args : ''}`,
      ...optionsLines,
    ];
    if (content) directiveLines.push(content);
    directiveLines.push(marker);
    return directiveLines.join('\n');
  };
}

function containerValidator(node: any, file: VFile) {
  const { kind } = node;
  if (kind === 'figure' && !select('image', node)) {
    fileError(file, 'Figure container must have image node child', {
      node,
      source: 'myst-to-md',
      ruleId: RuleId.mdRenders,
    });
  }
  if (kind === 'table' && !select('table', node)) {
    fileError(file, 'Table container must have table node child', {
      node,
      source: 'myst-to-md',
      ruleId: RuleId.mdRenders,
    });
  }
  if (kind !== 'figure' && kind !== 'table' && kind !== 'code') {
    fileError(file, `Unknown kind on container node: ${kind}`, {
      node,
      source: 'myst-to-md',
      ruleId: RuleId.mdRenders,
    });
  }
}

const FIGURE_OPTS = ['label', 'class', 'width', 'align', 'title', 'alt', 'placeholder'];
const TABLE_KEYS = ['headerRows', 'label', 'class', 'width', 'align'];

/**
 * Handler for container nodes
 *
 * These may be of kind "figure" with image/caption/legend children or
 * kind "table" with table/caption children.
 */
function container(node: any, _: Parent, state: NestedState, info: Info): string {
  const captionNode: GenericNode | undefined = select('caption', node);
  const legendNode: GenericNode | undefined = select('legend', node);
  const children = [...(captionNode?.children || []), ...(legendNode?.children || [])];
  if (node.kind === 'figure') {
    const imageNodes: GenericNode[] = selectAll('image', node);
    const imageNode = imageNodes.find((img) => !img.placeholder);
    const placeholderNode = imageNodes.find((img) => img.placeholder);
    const url = imageNode?.urlSource ?? imageNode?.url ?? `#${node.source.label}`;
    if (!url) return '';
    const combinedNode: Record<string, any> = { type: 'container', url, children };
    FIGURE_OPTS.forEach((key) => {
      const val = node[key] ?? imageNode?.[key];
      if (val) combinedNode[key] = val;
    });
    if (placeholderNode) {
      combinedNode['placeholder'] = placeholderNode.urlSource ?? placeholderNode.url;
    }
    const options = {
      argsKey: 'url',
      keys: FIGURE_OPTS,
      aliases: { label: 'name' },
    };
    const args = argsFromNode(combinedNode, options);
    return writeFlowDirective('figure', args, options)(combinedNode, _, state, info);
  } else if (node.kind === 'table') {
    const tableNode: GenericNode | undefined = select('table', node);
    if (!tableNode) return '';
    let headerRows = 0;
    let inHeader = true;
    const listNodes = selectAll('tableRow', tableNode).map((row) => {
      const cells = selectAll('tableCell', row);
      if (inHeader) {
        const isHeaderRow = cells
          .map((cell) => (cell as any).header)
          .reduce((val, allHeaders) => (val ? allHeaders : false), true);
        if (isHeaderRow) {
          headerRows += 1;
        } else {
          inHeader = false;
        }
      }
      const listItemNodes = cells.map((cell) => {
        return { ...cell, type: 'listItem' };
      });
      return {
        ...row,
        type: 'listItem',
        children: [{ type: 'list', children: listItemNodes }],
      };
    });
    const combinedNode: Record<string, any> = {
      type: 'container',
      headerRows,
      children: [{ type: 'list', children: listNodes }],
    };
    TABLE_KEYS.forEach((key) => {
      const val = node[key] ?? tableNode[key];
      if (val) combinedNode[key] = val;
    });
    const args = captionNode ? state.containerPhrasing(captionNode as any, info) : '';
    const options = {
      keys: TABLE_KEYS,
      aliases: {
        headerRows: 'header-rows',
        label: 'name',
      },
    };
    return writeFlowDirective('list-table', args, options)(combinedNode, _, state, info);
  } else if (node.kind === 'code') {
    const codeNode: GenericNode | undefined = select('code', node);
    if (!codeNode) return '';
    const combinedNode: Record<string, any> = { ...codeNode };
    CODE_BLOCK_KEYS.forEach((key) => {
      const val = node[key];
      if (val) combinedNode[key] = val;
    });
    const caption = toText(children);
    if (caption) combinedNode.caption = caption;
    return code(combinedNode, _, state, info);
  }
  return '';
}

/**
 * Handler for admonition nodes
 */
function admonition(node: any, _: Parent, state: NestedState, info: Info): string {
  const name = node.kind ?? 'admonition';
  const admonitionTitle = select('admonitionTitle', node);
  const args = admonitionTitle ? state.containerPhrasing(admonitionTitle as any, info) : '';
  const nodeCopy = {
    ...node,
    children: node.children.filter((n: GenericNode) => n.type !== 'admonitionTitle'),
  };
  const options = {
    keys: ['class', 'icon'],
  };
  return writeFlowDirective(name, args, options)(nodeCopy, _, state, info);
}

/**
 * Handler for dropdown directive
 */
function details(node: any, _: Parent, state: NestedState, info: Info): string {
  const summary = select('summary', node);
  const args = summary ? state.containerPhrasing(summary as any, info) : '';
  const nodeCopy = {
    ...node,
    children: node.children.filter((n: GenericNode) => n.type !== 'summary'),
  };
  const options = {
    keys: ['open'],
  };
  return writeFlowDirective('dropdown', args, options)(nodeCopy, _, state, info);
}

function card(node: any, _: Parent, state: NestedState, info: Info): string {
  const title = select('cardTitle', node);
  const args = title ? state.containerPhrasing(title as any, info) : '';
  const header = select('header', node);
  const footer = select('footer', node);
  const nodeCopy = {
    ...node,
    children: node.children.filter(
      (n: GenericNode) => !['cardTitle', 'header', 'footer'].includes(n.type),
    ),
  };
  if (header) nodeCopy.header = state.containerFlow(header as any, info);
  if (footer) nodeCopy.footer = state.containerFlow(footer as any, info);
  const options = {
    keys: ['url', 'header', 'footer'],
    aliases: { url: 'link' },
    yaml: true,
  };
  return writeFlowDirective('card', args, options)(nodeCopy, _, state, info);
}

function gridValidator(node: any, file: VFile) {
  node.children?.forEach((child: any) => {
    if (child.kind !== 'card') {
      fileError(file, `Unexpected grid node child is not card: ${child.kind}`, {
        node,
        source: 'myst-to-md',
        ruleId: RuleId.mdRenders,
      });
    }
  });
}

function tabSetValidator(node: any, file: VFile) {
  node.children?.forEach((child: any) => {
    if (child.kind !== 'tabItem') {
      fileError(file, `Unexpected tabSet node child is not tabItem: ${child.kind}`, {
        node,
        source: 'myst-to-md',
        ruleId: RuleId.mdRenders,
      });
    }
  });
}

function tabItem(node: any, _: Parent, state: NestedState, info: Info): string {
  const handler = writeFlowDirective('tab-item', node.title, { keys: ['sync', 'selected'] });
  return handler(node, _, state, info);
}

export const directiveHandlers: Record<string, Handle> = {
  code,
  image,
  container,
  admonition,
  details,
  card,
  grid: writeFlowDirective('grid', undefined, {
    keys: ['columns'],
    transforms: { columns: (val) => val.join(' ') },
  }),
  tabSet: writeFlowDirective('tab-set'),
  tabItem,
  math: writeStaticDirective('math', { keys: ['label'] }),
  embed: writeStaticDirective('embed', { argsKey: 'label' }),
  include: writeStaticDirective('include', { argsKey: 'file' }),
  mermaid: writeStaticDirective('mermaid'),
  mystDirective,
};

export const directiveValidators: Record<string, Validator> = {
  container: containerValidator,
  grid: gridValidator,
  tabSet: tabSetValidator,
};
