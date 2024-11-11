import { unified } from 'unified';
import type { Plugin } from 'unified';
import { liftChildren, normalizeLabel } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import type { Parent, TableCell } from 'myst-spec';
import { mystToHtml } from 'myst-to-html';
import type { ElementContent } from 'hast';
import { u } from 'unist-builder';
import { fromHtml } from 'hast-util-from-html';
import type { Handle, NodeHandle } from 'hast-util-to-mdast';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import { visit } from 'unist-util-visit';
import type { Options } from 'rehype-parse';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';

export type HtmlTransformOptions = {
  keepBreaks?: boolean;
  htmlHandlers?: { [x: string]: Handle };
  htmlNodeHandlers?: { [x: string]: NodeHandle };
};

function convertStylesStringToObject(stringStyles: string) {
  if (!stringStyles || typeof stringStyles !== 'string') return undefined;
  return stringStyles.split(';').reduce((acc, style) => {
    const colonPosition = style.indexOf(':');

    if (colonPosition === -1) return acc;

    const camelCaseProperty = style
        .slice(0, colonPosition)
        .trim()
        .replace(/^-ms-/, 'ms-')
        .replace(/-./g, (c) => c.slice(1).toUpperCase()),
      value = style.slice(colonPosition + 1).trim();

    return value ? { ...acc, [camelCaseProperty]: value } : acc;
  }, {});
}

function getAlignment(alignment?: string): TableCell['align'] {
  if (!alignment) return undefined;
  if (alignment === 'center') return 'center';
  if (alignment === 'left') return 'left';
  if (alignment === 'right') return 'right';
}

function addClassAndIdentifier(node: GenericNode, attrs: Record<string, any> = {}) {
  const props = node.properties ?? {};
  if (props.id || props.dataLabel) {
    const normalized = normalizeLabel(props.id || props.dataLabel);
    if (normalized?.identifier) attrs.identifier = normalized.identifier;
    if (normalized?.label) attrs.label = normalized.label;
  }
  if (props.className) attrs.class = props.className.join(' ');
  const style = convertStylesStringToObject(node.properties.style);
  if (style) attrs.style = style;
  return attrs;
}

const defaultHtmlToMdastOptions: HtmlTransformOptions = {
  keepBreaks: true,
  htmlNodeHandlers: {
    comment(state, node) {
      // Prevents HTML comments from showing up as text in web
      const result = u('mystComment', node.value) as any;
      state.patch(node, result);
      return result;
    },
  },
  htmlHandlers: {
    table(state, node) {
      const attrs = addClassAndIdentifier(node);
      const result = u('table', attrs, state.all(node) as any[]);
      state.patch(node, result);
      return result;
    },
    th(state, node) {
      const attrs = addClassAndIdentifier(node, { header: true });
      const { rowSpan, colSpan, align } = node.properties;
      const rowSpanParsed = Number.parseInt(rowSpan as any, 10);
      const colSpanParsed = Number.parseInt(colSpan as any, 10);
      const alignParsed = getAlignment(align as any);
      if (align && align !== 'left') attrs.align = alignParsed;
      if (Number.isInteger(rowSpanParsed) && rowSpanParsed > 1) attrs.rowspan = rowSpanParsed;
      if (Number.isInteger(colSpanParsed) && colSpanParsed > 1) attrs.colspan = colSpanParsed;
      const result = u('tableCell', attrs, state.all(node) as any[]);
      state.patch(node, result);
      return result;
    },
    tr(state, node) {
      const attrs = addClassAndIdentifier(node);
      const result = u('tableRow', attrs, state.all(node) as any[]);
      state.patch(node, result);
      return result;
    },
    td(state, node) {
      const attrs = addClassAndIdentifier(node);
      const { rowSpan, colSpan, align } = node.properties;
      const rowSpanParsed = Number.parseInt(rowSpan as any, 10);
      const colSpanParsed = Number.parseInt(colSpan as any, 10);
      const alignParsed = getAlignment(align as any);
      if (align && align !== 'left') attrs.align = alignParsed;
      if (Number.isInteger(rowSpanParsed) && rowSpanParsed > 1) attrs.rowspan = rowSpanParsed;
      if (Number.isInteger(colSpanParsed) && colSpanParsed > 1) attrs.colspan = colSpanParsed;
      const result = u('tableCell', attrs, state.all(node) as any[]);
      state.patch(node, result);
      return result;
    },
    _brKeep(state, node) {
      const result = u('_break') as any;
      state.patch(node, result);
      return result;
    },
    span(state, node) {
      const attrs = addClassAndIdentifier(node);
      const result = u('span', attrs, state.all(node)) as any;
      state.patch(node, result);
      return result;
    },
    div(state, node) {
      const attrs = addClassAndIdentifier(node);
      const result = u('div', attrs, state.all(node) as any[]) as any;
      state.patch(node, result);
      return result;
    },
    a(state, node) {
      const attrs = addClassAndIdentifier(node);
      attrs.url = String(node.properties.href || '');
      if (node.properties.title) attrs.title = node.properties.title;
      const result = u('link', attrs as any, state.all(node) as any);
      state.patch(node, result);
      return result;
    },
    img(state, node) {
      const attrs = addClassAndIdentifier(node);
      if (node.properties.title) attrs.title = node.properties.title;
      if (node.properties.alt) attrs.alt = node.properties.alt;
      const result = u('image', { ...attrs, url: String(node.properties.src || '') });
      state.patch(node, result);
      return result;
    },
    video(state, node) {
      // Currently this creates an image node, we should change this to video in the future
      const attrs = addClassAndIdentifier(node);
      if (node.properties.title) attrs.title = node.properties.title;
      if (node.properties.alt) attrs.alt = node.properties.alt;
      const result = u('image', { ...attrs, url: String(node.properties.src || '') });
      state.patch(node, result);
      return result;
    },
    figure(state, node) {
      const attrs = addClassAndIdentifier(node);
      const result = u('container', attrs, state.all(node) as any[]) as any;
      state.patch(node, result);
      return result;
    },
    figcaption(state, node) {
      const result = u('caption', {}, state.all(node) as any[]) as any;
      state.patch(node, result);
      return result;
    },
    sup(state, node) {
      const result = u('superscript', {}, state.all(node) as any[]) as any;
      state.patch(node, result);
      return result;
    },
    sub(state, node) {
      const result = u('subscript', {}, state.all(node) as any[]) as any;
      state.patch(node, result);
      return result;
    },
    kbd(state, node) {
      const result = u('keyboard', {}, state.all(node) as any[]) as any;
      state.patch(node, result);
      return result;
    },
    cite(state, node) {
      const attrs = addClassAndIdentifier(node);
      const result = attrs.label ? (u('cite', attrs, state.all(node)) as any) : state.all(node);
      state.patch(node, result);
      return result;
    },
    details(state, node) {
      const attrs = addClassAndIdentifier(node);
      const result = u('details', attrs, state.all(node)) as any;
      state.patch(node, result);
      return result;
    },
    summary(state, node) {
      const result = u('summary', {}, state.all(node)) as any;
      state.patch(node, result);
      return result;
    },
  },
};

export function htmlTransform(tree: GenericParent, opts?: HtmlTransformOptions) {
  const handlers = { ...defaultHtmlToMdastOptions.htmlHandlers, ...opts?.htmlHandlers };
  const otherOptions = { ...defaultHtmlToMdastOptions, ...opts };
  const htmlNodes = selectAll('html', tree) as Parent[];
  htmlNodes.forEach((node) => {
    const hast = unified()
      .use(rehypeParse, { fragment: true } as Options)
      .parse((node as any).value);
    // hast-util-to-mdast removes breaks if they are the first/last children
    // and nests standalone breaks in paragraphs.
    // However, since HTML nodes may just be fragments in the middle of markdown text,
    // there is an option to `keepBreaks` which will simply convert `<br />`
    // tags to `break` nodes, without the special hast-util-to-mdast behavior.
    if (otherOptions.keepBreaks) {
      selectAll('[tagName=br]', hast).forEach((n: any) => {
        n.tagName = '_brKeep';
      });
    }
    const mdast = unified().use(rehypeRemark, { handlers, document: false }).runSync(hast);
    node.type = 'htmlParsed';
    node.children = mdast.children as Parent[];
    visit(node, (n: any) => delete n.position);
  });
  selectAll('paragraph > htmlParsed', tree).forEach((parsed) => {
    const node = parsed as GenericParent;
    if (node?.children?.length === 1 && node.children[0].type === 'paragraph') {
      node.children = node.children[0].children as GenericNode[];
    }
  });
  liftChildren(tree, 'htmlParsed');
  selectAll('_break', tree).forEach((node) => {
    node.type = 'break';
  });
  return tree;
}

/**
 * Convert html nodes and children to single html node
 *
 * This function takes the html nodes with opening and closing tags; all the mdast content
 * between these nodes is present as 'children' on the opening node. The mdast content is
 * then converted to html, wrapped by the opening and closing tag, and saved to a single html
 * node. All of the processed nodes are then marked for deletion.
 */
function finalizeNode(htmlOpenNodeWithChildren: GenericParent, htmlCloseNode: GenericNode) {
  const innerHtml = mystToHtml(
    { type: 'root', children: htmlOpenNodeWithChildren.children },
    {
      hast: {
        handlers: {
          html: (_, node) => {
            return fromHtml(node.value, { fragment: true }).children as ElementContent[];
          },
        },
      },
    },
  );
  // This would be good to sanitize, but the best solution requires jsdom, increasing build size by 50%...
  htmlOpenNodeWithChildren.value = `${htmlOpenNodeWithChildren.value?.trim()}${innerHtml}${htmlCloseNode.value?.trim()}`;
  htmlOpenNodeWithChildren.children.forEach((child: GenericNode) => {
    child.type = '__delete__';
  });
  htmlCloseNode.type = '__delete__';
  delete (htmlOpenNodeWithChildren as GenericNode).children;
}

// https://html.spec.whatwg.org/multipage/syntax.html#elements-2
const HTML_EMPTY_ELEMENTS = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
];

function reconstructHtml(tree: GenericParent) {
  const htmlOpenNodes: GenericParent[] = [];
  tree.children.forEach((child: GenericNode) => {
    if (child.type === 'html') {
      const value = child.value?.trim();
      const selfClosing =
        (value?.startsWith('<') && value?.endsWith('/>')) ||
        value?.match(new RegExp(`<(${HTML_EMPTY_ELEMENTS.join('|')})([^>]*)?/?>`));
      if (selfClosing) {
        if (htmlOpenNodes.length) {
          htmlOpenNodes[htmlOpenNodes.length - 1].children.push(child);
        }
      } else if (value?.startsWith('</')) {
        // In this case, child is a standalone closing html node
        const htmlOpenNode = htmlOpenNodes.pop();
        if (!htmlOpenNode) return;
        finalizeNode(htmlOpenNode, child);
        if (htmlOpenNodes.length) {
          htmlOpenNodes[htmlOpenNodes.length - 1].children.push(htmlOpenNode);
        }
      } else if (!value?.endsWith('/>') && !value?.endsWith('-->')) {
        // In this case, child is a standalone opening html node
        child.children = [];
        htmlOpenNodes.push(child as GenericParent);
      }
    } else {
      if (child.children) {
        // Recursively process children
        reconstructHtml(child as GenericParent);
      }
      if (htmlOpenNodes.length) {
        // If we are between an opening and closing node, add this to the html content to be processed
        htmlOpenNodes[htmlOpenNodes.length - 1].children.push(child);
      }
    }
  });
  // At this point, any htmlOpenNodes are errors; just clean them up.
  htmlOpenNodes.forEach((node: GenericNode) => {
    delete node.children;
  });
  // Finalize children by combining consecutive html nodes
  const combined: GenericNode[] = [];
  tree.children.forEach((child) => {
    if (combined[combined.length - 1]?.type === 'html' && child.type === 'html') {
      combined[combined.length - 1].value = `${combined[combined.length - 1].value}${child.value}`;
    } else if (child.type !== '__delete__') {
      combined.push(child);
    }
  });
  tree.children = combined;
}

/**
 * Traverse mdast tree to reconstruct html elements split across mdast nodes into a single node
 *
 * This function identifies html "opening" nodes, then collects the subsequent mdast nodes until
 * it encounters a "closing" node, when it consolidates all the nodes into a single html node.
 */
export function reconstructHtmlTransform(tree: GenericParent) {
  reconstructHtml(tree);
  remove(tree, '__delete__');
  return tree;
}

export const reconstructHtmlPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  reconstructHtmlTransform(tree);
};

export const htmlPlugin: Plugin<[HtmlTransformOptions?], GenericParent, GenericParent> =
  (opts) => (tree) => {
    htmlTransform(tree, opts);
  };
