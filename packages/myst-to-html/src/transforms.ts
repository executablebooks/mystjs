import type { Plugin } from 'unified';
import { unified } from 'unified';
import type { Options } from 'rehype-parse';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import type { Handle } from 'hast-util-to-mdast';
import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
import { findAfter } from 'unist-util-find-after';
import { remove } from 'unist-util-remove';
import { liftChildren, normalizeLabel, AdmonitionKind, admonitionKindToTitle } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import type { EnumeratorOptions, State } from './state.js';
import { enumerateTargets, resolveReferences } from './state.js';
import type { TableContent, Table, Parent } from 'mdast';

export type Admonition = GenericNode<{
  kind?: AdmonitionKind;
  class?: string;
}>;

export type TransformOptions = {
  addAdmonitionHeaders?: boolean;
  addContainerCaptionNumbers?: boolean;
} & EnumeratorOptions;

export type HtmlToMdastOptions = {
  htmlHandlers?: { [x: string]: Handle };
  keepBreaks?: boolean;
};

const defaultOptions: Record<keyof TransformOptions, boolean> = {
  addAdmonitionHeaders: true,
  addContainerCaptionNumbers: true,
  disableHeadingEnumeration: false,
  disableContainerEnumeration: false,
  disableEquationEnumeration: false,
};

const defaultHtmlToMdastOptions: HtmlToMdastOptions = {
  keepBreaks: true,
  htmlHandlers: {
    table(state, node) {
      const result: Table = {
        type: 'table',
        children: state.all(node) as TableContent[],
      };
      state.patch(node, result);
      return result;
    },
    th(state, node) {
      const result = { type: 'tableCell', header: true, children: state.all(node) } as Parent;
      state.patch(node, result as any);
      return result as any;
    },
    _brKeep(state, node) {
      const result = { type: '_break' } as Parent;
      state.patch(node, result as any);
      return result as any;
    },
  },
};

// Visit all admonitions and add headers if necessary
export function addAdmonitionHeaders(tree: GenericParent) {
  visit(tree, 'admonition', (node: Admonition) => {
    if (!node.kind || node.kind === AdmonitionKind.admonition) return;
    node.children = [
      {
        type: 'admonitionTitle',
        children: [{ type: 'text', value: admonitionKindToTitle(node.kind) }],
      },
      ...(node.children ?? []),
    ];
  });
}

// Visit all containers and add captions
export function addContainerCaptionNumbers(tree: GenericParent, state: State) {
  selectAll('container', tree)
    .filter((container: GenericNode) => container.enumerator !== false)
    .forEach((container: GenericNode) => {
      const enumerator = state.getTarget(container.identifier)?.node.enumerator;
      const para = select('caption > paragraph', container) as GenericNode;
      if (enumerator && para) {
        para.children = [
          { type: 'captionNumber', kind: container.kind, value: enumerator },
          ...(para?.children ?? []),
        ];
      }
    });
}

/**
 * Propagate target identifier/value to subsequent node
 *
 * Note: While this propagation happens regardless of the
 * subsequent node type, references are only resolved to
 * the TargetKind nodes enumerated in state.ts. For example:
 *
 * (paragraph-target)=
 * Just a normal paragraph
 *
 * will add identifier/label to paragraph node, but the node
 * will still not be targetable.
 */
export function propagateTargets(tree: GenericParent) {
  visit(tree, 'mystTarget', (node: GenericNode, index: number) => {
    const nextNode = findAfter(tree, index) as GenericNode;
    const normalized = normalizeLabel(node.label);
    if (nextNode && normalized) {
      nextNode.identifier = normalized.identifier;
      nextNode.label = normalized.label;
    }
  });
  remove(tree, 'mystTarget');
}

/**
 * Ensure caption content is nested in a paragraph.
 *
 * This function is idempotent!
 */
export function ensureCaptionIsParagraph(tree: GenericParent) {
  visit(tree, 'caption', (node: GenericNode) => {
    if (node.children && node.children[0].type !== 'paragraph') {
      node.children = [{ type: 'paragraph', children: node.children }];
    }
  });
}

export function convertHtmlToMdast(tree: GenericParent, opts?: HtmlToMdastOptions) {
  const handlers = { ...defaultHtmlToMdastOptions.htmlHandlers, ...opts?.htmlHandlers };
  const otherOptions = { ...defaultHtmlToMdastOptions, ...opts };
  const htmlNodes = selectAll('html', tree);
  htmlNodes.forEach((node: GenericNode) => {
    const hast = unified()
      .use(rehypeParse, { fragment: true } as Options)
      .parse(node.value);
    // hast-util-to-mdast removes breaks if they are the first/last children
    // and nests standalone breaks in paragraphs.
    // However, since HTML nodes may just be fragments in the middle of markdown text,
    // there is an option to `keepBreaks` which will simply convert `<br />`
    // tags to `break` nodes, without the special hast-util-to-mdast behavior.
    if (otherOptions.keepBreaks) {
      selectAll('[tagName=br]', hast).forEach((n: GenericNode) => {
        n.tagName = '_brKeep';
      });
    }
    const mdast = unified().use(rehypeRemark, { handlers }).runSync(hast);
    node.type = 'htmlParsed';
    node.children = mdast.children as GenericNode[];
    visit(node, (n: GenericNode) => delete n.position);
  });
  liftChildren(tree, 'htmlParsed');
  selectAll('_break', tree).forEach((n: GenericNode) => {
    n.type = 'break';
  });
  return tree;
}

export const transform: Plugin<[State, TransformOptions?], GenericParent> =
  (state, o) => (tree: GenericParent) => {
    const opts = {
      ...defaultOptions,
      ...o,
    };
    ensureCaptionIsParagraph(tree);
    propagateTargets(tree);
    enumerateTargets(state, tree, opts);
    resolveReferences(state, tree);
    liftChildren(tree, 'mystDirective');
    liftChildren(tree, 'mystRole');
    if (opts.addAdmonitionHeaders) addAdmonitionHeaders(tree);
    if (opts.addContainerCaptionNumbers) addContainerCaptionNumbers(tree, state);
  };
