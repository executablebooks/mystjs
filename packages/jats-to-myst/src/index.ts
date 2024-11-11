import type { Root } from 'myst-spec';
import { unified } from 'unified';
import { doi } from 'doi-utils';
import type { Plugin } from 'unified';
import { VFile } from 'vfile';
import type { MessageInfo, GenericNode, GenericParent } from 'myst-common';
import { toText, copyNode, fileError, RuleId } from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import { u } from 'unist-builder';
import { RefType } from 'jats-tags';
import { Jats } from 'jats-xml';
import { keysTransform } from 'myst-transforms';
import type { Handler, IJatsParser, JatsResult, Options, StateData } from './types.js';
import { basicTransformations } from './transforms/index.js';

function refTypeToReferenceKind(kind?: RefType): string | undefined {
  switch (kind) {
    case RefType.sec:
      return 'heading';
    case RefType.fig:
      return 'figure';
    case RefType.dispFormula:
      return 'equation';
    case RefType.table:
      return 'table';
    case RefType.custom:
      return undefined;
  }
}

type Attributes = Record<string, any>;

const handlers: Record<string, Handler> = {
  body(node, state) {
    state.renderChildren(node);
  },
  text(node, state) {
    state.text(node.value);
  },
  p(node, state) {
    state.renderInline(node, 'paragraph');
  },
  heading(node, state) {
    state.renderInline(node, 'heading', {
      enumerated: true,
      label: node.id,
      identifier: node.id,
      depth: node.depth,
    });
  },
  block(node, state) {
    state.renderInline(node, 'block', { data: { part: node.part ?? node['sec-type'] } });
  },
  ['disp-quote'](node, state) {
    state.renderInline(node, 'blockquote', { kind: node['content-type'] });
  },
  // definitionList(node, state) {
  //   state.renderInline(node, 'def-list');
  // },
  // definitionItem(node, state) {
  //   state.renderInline(node, 'def-item');
  // },
  // definitionTerm(node, state) {
  //   state.renderInline(node, 'term');
  // },
  // definitionDescription(node, state) {
  //   state.renderInline(node, 'def');
  // },
  // code(node, state) {
  //   const { lang } = node as Code;
  //   state.renderInline(node, 'code', { language: lang });
  // },
  list(node, state) {
    // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/list.html
    state.renderInline(node, 'list', {
      ordered: node['list-type'] === 'ordered',
    });
  },
  ['list-item'](node, state) {
    state.renderInline(node, 'listItem');
  },
  // thematicBreak() {
  //   // The use of thematic breaks should be restricted to use inside table cells.
  //   // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/hr.html
  // },
  // ['inline-formula'](node, state) {
  //   // state.openNode('inline-formula');
  //   // state.openNode('tex-math');
  //   // state.addLeaf('cdata', { cdata: node.value });
  //   // state.closeNode();
  //   // state.closeNode();
  // },
  // ['disp-formula'](node, state) {
  //   const { identifier, enumerated, enumerator } = node;
  //   state.openNode('disp-formula', { id: identifier });
  //   if (enumerated !== false && enumerator) {
  //     state.openNode('label');
  //     state.text(`(${enumerator})`);
  //     state.closeNode();
  //   }
  //   state.openNode('tex-math');
  //   state.addLeaf('cdata', { cdata: node.value });
  //   state.closeNode();
  //   state.closeNode();
  // },
  // mystRole(node, state) {
  //   state.renderChildren(node);
  // },
  // mystDirective(node, state) {
  //   state.renderChildren(node);
  // },
  // comment() {
  //   // Do not archive comments
  // },
  bold(node, state) {
    state.renderInline(node, 'strong');
  },
  italic(node, state) {
    state.renderInline(node, 'emphasis');
  },
  underline(node, state) {
    state.renderInline(node, 'underline');
  },
  monospace(node, state) {
    state.renderInline(node, 'inlineCode');
  },
  sub(node, state) {
    state.renderInline(node, 'subscript');
  },
  sup(node, state) {
    state.renderInline(node, 'superscript');
  },
  strike(node, state) {
    state.renderInline(node, 'delete');
  },
  sc(node, state) {
    state.renderInline(node, 'smallcaps');
  },
  // break(node, state) {
  //   // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/break.html
  //   state.addLeaf('break');
  // },
  // // abbreviation(node, state) {
  // //   // TODO: \newacronym{gcd}{GCD}{Greatest Common Divisor}
  // //   // https://www.overleaf.com/learn/latex/glossaries
  // //   state.renderChildren(node, true);
  // // },
  ['ext-link'](node, state) {
    state.renderInline(node, 'link', { url: node['xlink:href'] });
  },
  ['boxed-text'](node, state) {
    state.renderInline(node, 'admonition', { kind: 'info' });
  },
  admonitionTitle(node, state) {
    // This is created in a transform!
    state.renderInline(node, 'admonitionTitle');
  },
  // attrib(node, state) {
  //   // This is used inside of disp-quotes
  //   state.renderInline(node, 'attrib');
  // },
  // table(node, state) {
  //   state.renderInline(node, 'table');
  // },
  // tableHead(node, state) {
  //   state.renderInline(node, 'thead');
  // },
  // tableBody(node, state) {
  //   state.renderInline(node, 'tbody');
  // },
  // tableFooter(node, state) {
  //   state.renderInline(node, 'tfoot');
  // },
  // tableRow(node, state) {
  //   state.renderInline(node, 'tr');
  // },
  // tableCell(node, state) {
  //   const { align, colspan, rowspan } = node as TableCell;
  //   state.renderInline(node, node.header ? 'th' : 'td', {
  //     align,
  //     colspan: colspan ? String(colspan) : undefined,
  //     rowspan: rowspan ? String(rowspan) : undefined,
  //   });
  // },
  // image(node, state) {
  //   if (node.url?.startsWith('http')) {
  //     state.warn(`Image URL is remote (${node.url})`, node, 'image');
  //   }
  //   if (state.data.isInContainer && node.alt) {
  //     state.openNode('alt-text');
  //     state.text(node.alt);
  //     state.closeNode();
  //   }
  //   // TOOD: identifier?
  //   state.addLeaf('graphic', { 'xlink:href': node.url });
  // },
  ['fig-group'](node, state) {
    state.openNode('tabSet');
    node.children?.forEach((n) => {
      state.openNode('tabItem', {
        title: toText(select('label', n) as GenericNode),
        sync: toText(select('label', n) as GenericNode),
      });
      state.renderChildren({ children: [n] });
      state.closeNode();
    });
    state.closeNode();
  },
  fig(node, state) {
    const caption = select('caption', node) as GenericNode;
    const graphic = select('graphic', node) as GenericNode;
    const title = select('title', node) as GenericNode;
    state.openNode('container', { label: node.id, identifier: node.id });
    const link = graphic?.['xlink:href'];
    if (state.jats.source?.includes('elifesciences')) {
      const elifeId = state.jats.doi?.split('/')[1].split('.')[1];
      state.addLeaf('image', {
        url: `https://iiif.elifesciences.org/lax:${elifeId}/${link}/full/617,/0/default.png`,
        urlOptimized: `https://iiif.elifesciences.org/lax:${elifeId}/${link}/full/617,/0/default.webp`,
      });
    } else if (state.jats.source?.includes('joss')) {
      const jossId = state.jats.doi?.split('/')[1].split('.')[1];
      state.addLeaf('image', {
        url: `https://raw.githubusercontent.com/openjournals/joss-papers/master/joss.${jossId}/${link}`,
      });
    } else if (state.jats.source?.includes('https://journals.plos.org')) {
      // from: info:doi/10.1371/journal.pmed.1004118.g001
      // to: https://journals.plos.org/plosmedicine/article/figure/image?size=inline&id=10.1371/journal.pmed.1004118.g001
      // size is "inline" or "large"
      // e.g. "plosmedicine"
      const journal = new URL(state.jats.source).pathname.split('/')[1];
      const figureDoi = link?.replace(/^info:doi/, '');
      const size = 'large';
      const url = `https://journals.plos.org/${journal}/article/figure/image?size=${size}&id=${figureDoi}`;
      state.addLeaf('image', { url });
    } else {
      const pmcid = state.jats.pmc;
      state.addLeaf('image', {
        url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcid}/bin/${link}.jpg`,
      });
    }
    state.openNode('caption');
    if (title) {
      state.openNode('strong');
      state.renderChildren(title);
      state.closeNode();
    }
    // caption number?
    state.renderChildren(caption);
    state.closeNode();
    state.closeNode();
  },
  // container(node, state) {
  //   state.data.isInContainer = true;
  //   switch (node.kind) {
  //     case 'figure': {
  //       state.renderInline(node, 'fig');
  //       break;
  //     }
  //     case 'table': {
  //       state.renderInline(node, 'table-wrap');
  //       break;
  //     }
  //     case 'quote': {
  //       // This is transformed in containers.ts
  //       state.renderChildren(node);
  //       break;
  //     }
  //     case 'code': {
  //       // This is transformed in containers.ts
  //       state.renderInline(node, 'boxed-text', { 'content-type': node.kind });
  //       break;
  //     }
  //     default: {
  //       state.error(`Unhandled container kind of ${node.kind}`, node, 'container');
  //       state.renderChildren(node);
  //     }
  //   }
  //   delete state.data.isInContainer;
  // },
  // caption(node, state) {
  //   state.renderInline(node, 'caption');
  // },
  // captionNumber(node, state) {
  //   state.renderInline(node, 'label');
  // },
  // crossReference(node, state) {
  //   // Look up reference and add the text
  //   const { identifier, kind } = node as CrossReference;
  //   const attrs: Attributes = { 'ref-type': referenceKindToRefType(kind), rid: identifier };
  //   if (attrs['ref-type'] === RefType.custom && kind) {
  //     attrs['custom-type'] = kind;
  //   }
  //   state.renderInline(node, 'xref', attrs);
  // },
  // citeGroup(node, state) {
  //   if (state.options.citestyle === 'numerical-only') {
  //     state.write('\\cite{');
  //   } else if (state.options.bibliography === 'biblatex') {
  //     const command = node.kind === 'narrative' ? 'textcite' : 'parencite';
  //     state.write(`\\${command}{`);
  //   } else {
  //     const tp = node.kind === 'narrative' ? 't' : 'p';
  //     state.write(`\\cite${tp}{`);
  //   }
  //   state.renderChildren(node, true, ', ');
  //   state.write('}');
  // },
  // cite(node, state, parent) {
  //   if (!state.options.bibliography) {
  //     state.usePackages('natbib');
  //     // Don't include biblatex in the package list
  //   }
  //   if (parent.type === 'citeGroup') {
  //     state.write(node.label);
  //   } else if (state.options.bibliography === 'biblatex') {
  //     state.write(`\\textcite{${node.label}}`);
  //   } else {
  //     state.write(`\\cite{${node.label}}`);
  //   }
  // },
  xref(node, state) {
    const refType: RefType = node['ref-type'];
    switch (refType) {
      case RefType.bibr:
        state.renderInline(node, 'cite', {
          label: node.rid,
          identifier: node.rid,
          kind: 'narrative',
        });
        return;
      case RefType.sec:
      case RefType.fig:
      case RefType.dispFormula:
      case RefType.table: {
        const kind = refTypeToReferenceKind(refType);
        state.renderInline(node, 'crossReference', { label: node.rid, identifier: node.rid, kind });
        return;
      }
      default: {
        state.renderInline(node, 'crossReference', { identifier: node.rid });
        state.warn(`Unknown ref-type of ${refType}`, node);
        return;
      }
    }
  },
};

const DEFAULT_HANDLERS = { ...handlers };

export class JatsParser implements IJatsParser {
  file: VFile;
  data: StateData;
  options: Options;
  handlers: Record<string, Handler>;
  stack: GenericNode[] = [];
  jats: Jats;

  unhandled: string[] = [];

  constructor(file: VFile, jats: Jats, opts?: Options) {
    this.file = file;
    this.jats = jats;
    this.options = opts ?? {};
    this.data = {};
    this.stack = [{ type: 'root', children: [] }];
    this.handlers = opts?.handlers ?? DEFAULT_HANDLERS;
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  warn(message: string, node: GenericNode, source?: string, opts?: MessageInfo) {
    fileError(this.file, message, {
      ...opts,
      node,
      source: source ? `jats-to-myst:${source}` : 'jats-to-myst',
      ruleId: RuleId.jatsParses,
    });
  }

  error(message: string, node: GenericNode, source?: string, opts?: MessageInfo) {
    fileError(this.file, message, {
      ...opts,
      node,
      source: source ? `jats-to-myst:${source}` : 'jats-to-myst',
      ruleId: RuleId.jatsParses,
    });
  }

  pushNode(el?: GenericNode) {
    const top = this.top();
    if (this.stack.length && el && 'children' in top) top.children?.push(el);
    return el;
  }

  text(text?: string) {
    const top = this.top();
    const value = text;
    if (!value || !this.stack.length || !('children' in top)) return;
    const last = top.children?.[top.children.length - 1];
    if (last?.type === 'text') {
      // The last node is also text, merge it
      last.value += `${value}`;
      return last;
    }
    const node = u('text', value);
    top.children?.push(node);
    return node;
  }

  renderChildren(node: GenericNode) {
    node.children?.forEach((child) => {
      const handler = this.handlers[child.type];
      if (handler) {
        handler(child, this, node);
      } else {
        this.unhandled.push(child.type);
        fileError(this.file, `Unhandled JATS conversion for node of "${child.type}"`, {
          source: 'myst-to-jats',
          ruleId: RuleId.jatsParses,
        });
      }
    });
  }

  renderInline(node: GenericNode, name: string, attributes?: Attributes) {
    this.openNode(name, { ...attributes });
    if ('children' in node) {
      this.renderChildren(node);
    } else if ('value' in node && node.value) {
      this.text(node.value);
    }
    this.closeNode();
  }

  addLeaf(name: string, attributes?: Attributes) {
    this.openNode(name, attributes, true);
    this.closeNode();
  }

  openNode(name: string, attributes?: Attributes, isLeaf = false) {
    const node: GenericNode = { type: name, ...attributes };
    if (!isLeaf) node.children = [];
    this.stack.push(node);
  }

  closeNode() {
    const node = this.stack.pop();
    return this.pushNode(node);
  }
}
declare module 'unified' {
  interface CompileResultMap {
    VFile: VFile;
  }
}

export const jatsToMystPlugin: Plugin<[Jats, Options?], Root, Root> = function (jats, opts) {
  this.compiler = (node, file: VFile) => {
    const tree = jats.abstract
      ? {
          type: 'root',
          children: [
            u('block', { part: 'abstract' }, copyNode(jats.abstract).children),
            ...copyNode(node as any).children,
          ],
        }
      : copyNode(node as any);
    // Can do better than this in the future, but for now, just put them at the end!
    const floatsGroup = selectAll('floats-group', jats.tree) as GenericParent[];
    if (floatsGroup.length > 0) {
      floatsGroup.forEach((g) => {
        tree.children.push(...g.children);
      });
    }
    basicTransformations(tree, file);
    const state = new JatsParser(file, jats, opts ?? { handlers });
    state.renderChildren(tree);
    while (state.stack.length > 1) state.closeNode();
    console.log([...new Set(state.unhandled)].join(', '));
    const referenceData = Object.fromEntries(
      jats.references.map((bibr) => {
        const id = bibr.id;
        const names = selectAll('name,string-name', bibr)
          .map(
            (n) =>
              `${toText(select('surname', n) as GenericNode)}, ${toText(select('given-names', n) as GenericNode)}`,
          )
          .join(', ');
        const year = toText(select('year', bibr) as GenericNode);
        const title = toText(select('article-title', bibr) as GenericNode);
        const source = toText(select('source', bibr) as GenericNode);
        const volume = toText(select('volume', bibr) as GenericNode);
        const fpage = toText(select('fpage', bibr) as GenericNode);
        const lpage = toText(select('lpage', bibr) as GenericNode);
        const doiElement = selectAll('ext-link,[pub-id-type=doi]', bibr).find((e) =>
          doi.validate(toText(e as GenericNode)),
        );
        const doiString = doiElement ? toText(doiElement as GenericNode) : undefined;
        const doiLink = doiString ? ` <a href=${doi.buildUrl(doiString)}>${doiString}</a>` : '';
        return [
          id,
          {
            html: `${names}. (${year}). ${title}. <i>${source}</i>, <i>${volume}</i>, ${fpage}-${lpage}.${doiLink}`,
            doi: doiString,
          },
        ];
      }),
    );

    const referenceOrder: string[] = [];
    const xrefs = selectAll('xref[ref-type=bibr]', jats.body) as GenericNode[];
    xrefs.forEach((xref) => {
      const rid = xref.rid;
      // should do a set or something to speed this up
      if (!referenceOrder.includes(rid)) {
        referenceOrder.push(rid);
      }
    });
    const treeFinal = state.stack[0] as Root;
    keysTransform(treeFinal);
    const result: JatsResult = {
      references: { order: referenceOrder, data: referenceData },
      tree: treeFinal,
    };
    file.result = result;
    return file;
  };
};

export function jatsToMystTransform(
  data: string | Jats,
  opts?: Options,
): { tree: Root; jats: Jats; file: VFile; references: any } {
  const jats = typeof data === 'string' ? new Jats(data) : data;
  const file = new VFile();
  const pipe = unified().use(jatsToMystPlugin, jats, opts);
  const vfile = pipe.stringify(jats.body as any, file);
  const references = (vfile as any).result.references;
  const tree = (vfile as any).result.tree as Root;
  return { tree, jats, file, references };
}
