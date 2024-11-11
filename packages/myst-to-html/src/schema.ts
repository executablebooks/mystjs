import type { Handler, Options } from 'mdast-util-to-hast';
import { defaultHandlers, toHast } from 'mdast-util-to-hast';
import { h } from 'hastscript';
import classNames from 'classnames';
import type { Plugin } from 'unified';
import type { Element, Comment, Properties, Root as HastRoot } from 'hast';
import type { Root } from 'mdast';
import { u } from 'unist-builder';

const abbreviation: Handler = (state, node) => {
  const result = h('abbr', { title: node.title }, state.all(node));
  state.patch(node, result);
  return state.applyData(node, result);
};

const subscript: Handler = (state, node) => {
  const result = h('sub', {}, state.all(node));
  state.patch(node, result);
  return state.applyData(node, result);
};
const superscript: Handler = (state, node) => {
  const result = h('sup', {}, state.all(node));
  state.patch(node, result);
  return state.applyData(node, result);
};
const image: Handler = (state, node) => {
  const result = h(
    'img',
    {
      src: node.url,
      alt: node.alt,
      title: node.title,
      class: classNames(node.align ? `align-${node.align}` : '', node.class) || undefined,
      height: node.height,
      width: node.width,
    },
    [],
  );
  state.patch(node, result);
  return state.applyData(node, result);
};
const caption: Handler = (state, node) => {
  const result = h('figcaption', {}, state.all(node));
  state.patch(node, result);
  return state.applyData(node, result);
};
const legend: Handler = (state, node) => {
  const result = h('div', { class: 'legend' }, state.all(node));
  state.patch(node, result);
  return state.applyData(node, result);
};
const container: Handler = (state, node) => {
  const result = h(
    'figure',
    {
      id: node.identifier || node.label || undefined,
      class: classNames({ numbered: node.enumerated !== false }, node.class) || undefined,
    },
    state.all(node),
  );
  state.patch(node, result);
  return state.applyData(node, result);
};

const admonitionTitle: Handler = (state, node) => {
  const result = h('p', { class: 'admonition-title' }, state.all(node));
  state.patch(node, result);
  return state.applyData(node, result);
};

const admonition: Handler = (state, node) => {
  const result = h(
    'aside',
    {
      class: classNames({
        [node.class]: node.class, // The custom class is first!!
        admonition: true,
        [node.kind]: node.kind && node.kind !== 'admonition',
      }),
    },
    state.all(node),
  );
  state.patch(node, result);
  return state.applyData(node, result);
};

const captionNumber: Handler = (state, node) => {
  const captionKind = node.kind?.charAt(0).toUpperCase() + node.kind?.slice(1);
  const result = h('span', { class: 'caption-number' }, [
    u('text', `${captionKind} ${node.value}`),
  ]);
  state.patch(node, result);
  return state.applyData(node, result);
};

const math: Handler = (state, node) => {
  const attrs = { id: node.identifier || undefined, class: 'math-display' };
  const isPre = node.value.indexOf('\n') !== -1;
  const value = isPre ? node.value : node.value.replace(/\r?\n|\r/g, ' ');
  let result: Element = {
    type: 'element',
    properties: attrs,
    tagName: 'div',
    children: [u('text', value)],
  };
  if (isPre) {
    result = {
      type: 'element',
      tagName: 'pre',
      children: [result],
    } as Element;
  }
  state.patch(node, result);
  return state.applyData(node, result);
};

const inlineMath: Handler = (state, node) => {
  const result = h('span', { class: 'math-inline' }, [
    u('text', node.value.replace(/\r?\n|\r/g, ' ')),
  ]);
  state.patch(node, result);
  return state.applyData(node, result);
};

const definitionList: Handler = (state, node) => {
  const result = h('dl', {}, state.all(node));
  state.patch(node, result);
  return state.applyData(node, result);
};
const definitionTerm: Handler = (state, node) => {
  const result = h('dt', {}, state.all(node));
  state.patch(node, result);
  return state.applyData(node, result);
};
const definitionDescription: Handler = (state, node) => {
  const result = h('dd', {}, state.all(node));
  state.patch(node, result);
  return state.applyData(node, result);
};

const mystRole: Handler = (state, node) => {
  const children = [h('code', { class: 'kind' }, [u('text', `{${node.name}}`)])];
  if (node.value) {
    children.push(h('code', {}, [u('text', node.value)]));
  }
  const result = h('span', { class: 'role unhandled' }, children);
  state.patch(node, result);
  return state.applyData(node, result);
};

const mystDirective: Handler = (state, node) => {
  const directiveHeader: Element[] = [h('code', { class: 'kind' }, [u('text', `{${node.name}}`)])];
  if (node.args) {
    directiveHeader.push(h('code', { class: 'args' }, [u('text', node.args)]));
  }
  const directiveBody: Element[] = [];
  if (node.options) {
    const optionsString = Object.keys(node.options)
      .map((k) => `:${k}: ${node.options[k]}`)
      .join('\n');
    directiveBody.push(h('pre', [h('code', { class: 'options' }, [u('text', optionsString)])]));
  }
  directiveBody.push(h('pre', [h('code', [u('text', node.value)])]));
  const result = h('div', { class: 'directive unhandled' }, [
    h('p', {}, directiveHeader),
    ...directiveBody,
  ]);
  state.patch(node, result);
  return state.applyData(node, result);
};

const block: Handler = (state, node) => {
  const result = h('div', { class: 'block', 'data-block': node.meta }, state.all(node));
  state.patch(node, result);
  return state.applyData(node, result);
};

const comment: Handler = (state, node) => {
  const result: Comment = { type: 'comment', value: node.value };
  state.patch(node, result);
  return state.applyData(node, result);
};

const heading: Handler = (state, node) => {
  const result = h(`h${node.depth}`, { id: node.identifier || undefined }, state.all(node));
  state.patch(node, result);
  return state.applyData(node, result);
};

const crossReference: Handler = (state, node) => {
  if (node.resolved) {
    const result = h(
      'a',
      { href: `#${node.identifier}`, title: node.title || undefined },
      state.all(node),
    );
    state.patch(node, result);
    return state.applyData(node, result);
  } else {
    const result = h('span', { class: 'reference role unhandled' }, [
      h('code', { class: 'kind' }, [u('text', `{${node.kind}}`)]),
      h('code', {}, [u('text', node.identifier)]),
    ]);
    state.patch(node, result);
    return state.applyData(node, result);
  }
};

// TODO: The defaultHandler treats the first row (and only the first row)
//       header; the mdast `tableCell.header` property is not respected.
//       For that, we need to entirely rewrite this handler.
const table: Handler = (state, node) => {
  node.data = { hProperties: { align: node.align } };
  delete node.align;
  return defaultHandlers.table(state, node);
};

const code: Handler = (state, node) => {
  const value = node.value ? node.value + '\n' : '';
  const props: Properties = {};
  if (node.identifier) {
    props.id = node.identifier;
  }
  props.className = classNames({ ['language-' + node.lang]: node.lang }, node.class) || undefined;
  const codeHast = h('code', props, [u('text', value)]);
  const result = h('pre', {}, [codeHast]);
  state.patch(node, result);
  return state.applyData(node, result);
};

const iframe: Handler = (state, node) => {
  const result = h('div', { class: 'iframe' }, []);
  state.patch(node, result);
  return state.applyData(node, result);
};
const bibliography: Handler = (state, node) => {
  const result = h('div', { class: 'bibliography' }, []);
  state.patch(node, result);
  return state.applyData(node, result);
};
const details: Handler = (state, node) => {
  const result = h('details');
  state.patch(node, result);
  return state.applyData(node, result);
};
const summary: Handler = (state, node) => {
  const result = h('summary');
  state.patch(node, result);
  return state.applyData(node, result);
};
const embed: Handler = (state, node) => {
  const result = h('div');
  state.patch(node, result);
  return state.applyData(node, result);
};
const include: Handler = (state, node) => {
  const result = h('div', { file: node.file }, []);
  state.patch(node, result);
  return state.applyData(node, result);
};
const linkBlock: Handler = (state, node) => {
  const result = h('a');
  state.patch(node, result);
  return state.applyData(node, result);
};
const margin: Handler = (state, node) => {
  const result = h('aside', { class: 'margin' }, []);
  state.patch(node, result);
  return state.applyData(node, result);
};
const mdast: Handler = (state, node) => {
  const result = h('div', { id: node.id }, []);
  state.patch(node, result);
  return state.applyData(node, result);
};
const mermaid: Handler = (state, node) => {
  const result = h('div', { class: 'margin' }, []);
  state.patch(node, result);
  return state.applyData(node, result);
};
const myst: Handler = (state, node) => {
  const result = h('div', { class: 'margin' }, []);
  state.patch(node, result);
  return state.applyData(node, result);
};
const output: Handler = (state, node) => {
  const result = h('div', { class: 'output' }, []);
  state.patch(node, result);
  return state.applyData(node, result);
};

export const mystToHast: Plugin<[Options?], Root, HastRoot> = (opts) => (tree) => {
  return toHast(tree, {
    ...opts,
    handlers: {
      // @ts-expect-error: mdast spec doesn't include node
      admonition,
      admonitionTitle,
      container,
      image,
      caption,
      captionNumber,
      legend,
      abbreviation,
      subscript,
      superscript,
      math,
      inlineMath,
      definitionList,
      definitionTerm,
      definitionDescription,
      mystRole,
      mystDirective,
      block,
      comment,
      heading,
      crossReference,
      code,
      table,
      iframe,
      bibliography,
      details,
      summary,
      embed,
      include,
      linkBlock,
      margin,
      mdast,
      mermaid,
      myst,
      output,
      ...opts?.handlers,
    },
  }) as HastRoot;
};
