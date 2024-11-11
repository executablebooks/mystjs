import type {
  Root,
  CrossReference,
  TableCell as SpecTableCell,
  Math,
  Text,
  Paragraph,
  Blockquote,
  List,
  ThematicBreak,
  Role,
  Directive,
  Comment,
  Strong,
  Emphasis,
  Underline,
  InlineCode,
  Subscript,
  Superscript,
  Abbreviation,
  Link,
  AdmonitionTitle,
  Table,
  Caption,
  Break,
} from 'myst-spec';
import type {
  Block,
  Cite,
  Code,
  DefinitionTerm,
  DefinitionDescription,
  DefinitionList,
  FootnoteDefinition,
  FootnoteReference,
  Heading,
  AlgorithmLine,
  ListItem,
  InlineMath,
  Image,
  MathGroup,
  Delete,
  Smallcaps,
  Admonition,
  Container,
  CaptionNumber,
  CiteGroup,
} from 'myst-spec-ext';
import type { Plugin } from 'unified';
import { VFile } from 'vfile';
import { xml2js } from 'xml-js';
import type { CitationRenderer } from 'citation-js-utils';
import type { MessageInfo, GenericNode, GenericParent } from 'myst-common';
import { RuleId, copyNode, extractPart, fileError } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { renderEquation } from 'myst-transforms';
import { SourceFileKind } from 'myst-spec-ext';
import { Tags, RefType } from 'jats-tags';
import { serializeJatsXml } from 'jats-utils';
import type { MinifiedOutput } from 'nbtx';
import { getBack } from './backmatter.js';
import { getArticleMeta, getFront } from './frontmatter.js';
import type {
  Handler,
  IJatsSerializer,
  Options,
  StateData,
  Element,
  Attributes,
  ArticleContent,
  DocumentOptions,
  JatsPart,
  FrontmatterWithParts,
} from './types.js';
import { ACKNOWLEDGMENT_PARTS, ABSTRACT_PARTS } from './types.js';
import {
  basicTransformations,
  referenceResolutionTransform,
  referenceTargetTransform,
} from './transforms/index.js';
import type { SupplementaryMaterial } from './transforms/containers.js';
import { affiliationIdTransform } from './transforms/frontmatter.js';
import type { IdInventory } from './transforms/references.js';
import type { Section } from './transforms/sections.js';
import { sectionAttrsFromBlock } from './transforms/sections.js';
import { inlineExpression } from './inlineExpression.js';
import type { DefinitionItem } from './transforms/definitions.js';

type TableCell = SpecTableCell & { colspan?: number; rowspan?: number; width?: number };

function escapeForXML(text: string) {
  return (
    text
      .replace(/&(?!amp;)/g, '&amp;')
      .replace(/</g, '&lt;')
      // eslint-disable-next-line no-irregular-whitespace
      .replace(/​/g, '') // Replace no-width spaces, used in links
  );
}

function referenceKindToRefType(kind?: string): RefType {
  switch (kind?.split(':')[0]) {
    case 'heading':
      return RefType.sec;
    case 'figure':
      return RefType.fig;
    case 'subequation':
    case 'equation':
      return RefType.dispFormula;
    case 'table':
      return RefType.table;
    case 'proof':
      return RefType.statement;
    default:
      return RefType.custom;
  }
}

function renderLabel(node: GenericNode, state: IJatsSerializer, template = (s: string) => s) {
  const { enumerated, enumerator } = node;
  if (enumerated !== false && enumerator) {
    state.openNode('label');
    state.text(template(enumerator));
    state.closeNode();
  }
}

function alternativesFromMinifiedOutput(output: MinifiedOutput, state: IJatsSerializer) {
  state.openNode('alternatives');
  if (output.output_type === 'error') {
    state.openNode('media', {
      'specific-use': 'error',
      mimetype: 'text',
      'mime-subtype': 'plain',
      'xlink:href': (output as any).path,
    });
    state.openNode('caption');
    state.openNode('title');
    state.text(output.ename);
    state.closeNode();
    state.openNode('p');
    state.text(output.evalue);
    state.closeNode();
    state.closeNode();
    state.closeNode();
  } else if (output.output_type === 'stream') {
    state.addLeaf('media', {
      'specific-use': 'stream',
      mimetype: 'text',
      'mime-subtype': 'plain',
      'xlink:href': (output as any).path,
    });
  } else if (
    ['display_data', 'execute_result', 'update_display_data'].includes(output.output_type)
  ) {
    Object.entries(output.data ?? {}).forEach(([mimeType, value]) => {
      let leafType: string;
      let specificUse: string;
      if (mimeType.startsWith('image/')) {
        leafType = 'graphic';
        specificUse = 'print';
      } else if (mimeType === 'text/html') {
        leafType = 'media';
        specificUse = 'web';
      } else if (mimeType === 'text/plain') {
        leafType = 'media';
        specificUse = 'text';
      } else {
        leafType = 'media';
        specificUse = 'original-format';
      }
      state.addLeaf(leafType, {
        'specific-use': specificUse,
        mimetype: mimeType.split('/')[0],
        'mime-subtype': mimeType.split('/').slice(1).join('/'),
        'xlink:href': (value as any).path,
      });
    });
  }
  state.closeNode();
}

function addMmlAndRemoveAnnotation(el?: Element) {
  if (el?.name) el.name = `mml:${el.name}`;
  if (!el?.elements) return;
  el.elements = el.elements.filter((child: Element) => child.name !== 'annotation');
  el.elements.forEach((child: Element) => {
    addMmlAndRemoveAnnotation(child);
  });
}

function mathToMml(node: Math | InlineMath) {
  const math = copyNode(node);
  // TODO: add macros, log errors
  renderEquation(new VFile(), math, { mathML: true });
  const katexJs = (math as any).html
    ? (xml2js((math as any).html, { compact: false }) as Element)
    : undefined;
  const spanElement = katexJs?.elements?.[0];
  const mathElement = spanElement?.elements?.[0];
  if (!mathElement) return;
  const inline = node.type === 'inlineMath';
  if (inline) mathElement.attributes = { ...mathElement.attributes, display: 'inline' };
  delete mathElement.attributes?.xmlns;
  addMmlAndRemoveAnnotation(mathElement);
  // Remove the wrapping `<mml:semantics><mml:mrow>` if it is the only element
  if (mathElement?.elements?.length === 1 && mathElement.elements[0].name === 'mml:semantics') {
    mathElement.elements = mathElement.elements[0].elements;
  }
  if (mathElement?.elements?.length === 1 && mathElement.elements[0].name === 'mml:mrow') {
    mathElement.elements = mathElement.elements[0].elements;
  }
  return mathElement;
}

/**
 * Remove comments and consolidate to one line
 */
function cleanLatex(value?: string): string | undefined {
  if (!value) return;
  return value
    .split('\n')
    .map((s) => s.replace(/%(.*)/, '').trim())
    .join(' ')
    .trim();
}

// TODO: this should be based on some information of the proof, or myst config
function capitalize(kind?: string) {
  if (!kind) return '';
  return kind.slice(0, 1).toUpperCase() + kind.slice(1);
}

type Handlers = {
  text: Handler<Text>;
  paragraph: Handler<Paragraph>;
  section: Handler<Section>;
  heading: Handler<Heading>;
  block: Handler<Block>;
  blockquote: Handler<Blockquote>;
  definitionList: Handler<DefinitionList>;
  definitionItem: Handler<DefinitionItem>;
  definitionTerm: Handler<DefinitionTerm>;
  definitionDescription: Handler<DefinitionDescription>;
  code: Handler<Code>;
  list: Handler<List>;
  listItem: Handler<ListItem>;
  thematicBreak: Handler<ThematicBreak>;
  inlineMath: Handler<InlineMath>;
  math: Handler<Math>;
  mathGroup: Handler<MathGroup>;
  mystRole: Handler<Role>;
  mystDirective: Handler<Directive>;
  comment: Handler<Comment>;
  strong: Handler<Strong>;
  emphasis: Handler<Emphasis>;
  underline: Handler<Underline>;
  inlineCode: Handler<InlineCode>;
  subscript: Handler<Subscript>;
  superscript: Handler<Superscript>;
  delete: Handler<Delete>;
  smallcaps: Handler<Smallcaps>;
  span: Handler<GenericNode>;
  break: Handler<Break>;
  abbreviation: Handler<Abbreviation>;
  link: Handler<Link>;
  admonition: Handler<Admonition>;
  admonitionTitle: Handler<AdmonitionTitle>;
  attrib: Handler<GenericNode>;
  table: Handler<Table>;
  tableHead: Handler<GenericNode>;
  tableBody: Handler<GenericNode>;
  tableFooter: Handler<GenericNode>;
  tableRow: Handler<GenericNode>;
  tableCell: Handler<TableCell>;
  image: Handler<Image>;
  container: Handler<Container>;
  caption: Handler<Caption>;
  captionNumber: Handler<CaptionNumber>;
  crossReference: Handler<CrossReference>;
  citeGroup: Handler<CiteGroup>;
  cite: Handler<Cite>;
  footnoteReference: Handler<FootnoteReference>;
  footnoteDefinition: Handler<FootnoteDefinition>;
  si: Handler<GenericNode>;
  proof: Handler<GenericNode>;
  algorithmLine: Handler<AlgorithmLine>;
  output: Handler<GenericNode>;
  embed: Handler<GenericNode>;
  supplementaryMaterial: Handler<SupplementaryMaterial>;
  inlineExpression: Handler<GenericNode>;
};

const handlers: Handlers = {
  text(node, state) {
    state.text(node.value);
  },
  paragraph(node, state) {
    state.renderInline(node, 'p');
  },
  section(node, state) {
    state.renderInline(node, 'sec', sectionAttrsFromBlock(node as Section));
  },
  heading(node, state) {
    renderLabel(node, state);
    state.renderInline(node, 'title');
  },
  block(node, state) {
    if (node.visibility === 'remove') return;
    state.renderChildren(node);
  },
  blockquote(node, state) {
    state.renderInline(node, 'disp-quote');
  },
  definitionList(node, state) {
    state.renderInline(node, 'def-list');
  },
  definitionItem(node, state) {
    state.renderInline(node, 'def-item');
  },
  definitionTerm(node, state) {
    state.renderInline(node, 'term');
  },
  definitionDescription(node, state) {
    state.openNode('def');
    if (node.children?.[0].type === 'paragraph') {
      state.renderChildren(node);
    } else {
      state.renderInline(node, 'p');
    }
    state.closeNode();
  },
  code(node, state) {
    const { lang, executable, identifier } = node as Code;
    const attrs: Attributes = { language: lang };
    if (executable) attrs.executable = 'yes';
    if (identifier) attrs.id = identifier;
    state.renderInline(node, 'code', attrs);
  },
  list(node, state) {
    // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/list.html
    state.renderInline(node, 'list', { 'list-type': node.ordered ? 'order' : 'bullet' });
  },
  listItem(node, state) {
    state.openNode('list-item');
    if (node.children?.[0].type === 'paragraph') {
      state.renderChildren(node);
    } else {
      state.renderInline(node, 'p');
    }
    state.closeNode();
  },
  thematicBreak(node, state) {
    // Don't include the HR
    state.warn(
      'The use of thematic breaks should be restricted to use inside table cells.',
      node,
      'thematicBreak',
      {
        url: 'https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/hr.html',
      },
    );
  },
  inlineMath(node, state) {
    const inlineFormulaAttrs: Attributes = {};
    if (node.identifier) {
      inlineFormulaAttrs.id = node.identifier;
    }
    state.openNode('inline-formula', inlineFormulaAttrs);
    state.openNode('alternatives');
    state.pushNode(mathToMml(node as InlineMath));
    state.openNode('tex-math');
    state.addLeaf('cdata', { cdata: cleanLatex(node.value) });
    state.closeNode();
    state.closeNode();
    state.closeNode();
  },
  math(node, state) {
    const dispFormulaAttrs: Attributes = {};
    if (node.identifier) {
      dispFormulaAttrs.id = node.identifier;
    }
    state.openNode('disp-formula', dispFormulaAttrs);
    state.openNode('alternatives');
    state.pushNode(mathToMml(node as Math));
    state.openNode('tex-math');
    state.addLeaf('cdata', { cdata: cleanLatex(node.value) });
    state.closeNode();
    state.closeNode();
    // The label can be anywhere, and many publishers like this at the end (which is closer to reading order)
    renderLabel(node, state, (enumerator) => `(${enumerator})`);
    state.closeNode();
  },
  mathGroup(node, state) {
    const attrs: Attributes = {};
    if (node.identifier) {
      attrs.id = node.identifier;
    }
    state.openNode('disp-formula-group', attrs);
    // The disp-formula-group must have the label first
    renderLabel(node, state, (enumerator) => `(${enumerator})`);
    state.renderChildren(node);
    state.closeNode();
  },
  mystRole(node, state) {
    state.renderChildren(node);
  },
  mystDirective(node, state) {
    state.renderChildren(node);
  },
  comment() {
    // Do not archive comments
  },
  strong(node, state) {
    // TODO: potentially add `{ role: 'strong' }`?
    state.renderInline(node, 'bold');
  },
  emphasis(node, state) {
    state.renderInline(node, 'italic');
  },
  underline(node, state) {
    state.renderInline(node, 'underline');
  },
  inlineCode(node, state) {
    state.renderInline(node, 'monospace');
  },
  subscript(node, state) {
    state.renderInline(node, 'sub');
  },
  superscript(node, state) {
    state.renderInline(node, 'sup');
  },
  delete(node, state) {
    state.renderInline(node, 'strike');
  },
  smallcaps(node, state) {
    state.renderInline(node, 'sc');
  },
  span(node, state) {
    // Basic support for span at the moment
    state.renderChildren(node);
  },
  break(node, state, parent) {
    if (parent.type === 'paragraph' || parent.type === 'listItem') {
      state.warn(`There are no breaks allowed in ${parent.type}s.`, node, 'break', {
        url: 'https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/break.html',
      });
      return;
    }
    // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/break.html
    state.addLeaf('break');
  },
  abbreviation(node, state) {
    state.renderInline(node, 'abbrev', { alt: node.title });
  },
  link(node, state) {
    state.renderInline(node, 'ext-link', {
      'ext-link-type': 'uri',
      'xlink:href': node.url,
    });
  },
  admonition(node, state) {
    // This is `boxed-text`, the content-type is used to differentiate it
    // https://jats.nlm.nih.gov/archiving/tag-library/1.3/element/boxed-text.html
    state.renderInline(node, 'boxed-text', { 'content-type': node.kind });
  },
  admonitionTitle(node, state) {
    state.openNode('caption');
    state.renderInline(node, 'title');
    state.closeNode();
  },
  attrib(node, state) {
    // This is used inside of disp-quotes
    state.renderInline(node, 'attrib');
  },
  table(node, state) {
    state.renderInline(node, 'table');
  },
  tableHead(node, state) {
    state.renderInline(node, 'thead');
  },
  tableBody(node, state) {
    state.renderInline(node, 'tbody');
  },
  tableFooter(node, state) {
    state.renderInline(node, 'tfoot');
  },
  tableRow(node, state) {
    state.renderInline(node, 'tr');
  },
  tableCell(node, state) {
    const { align, colspan, rowspan } = node as TableCell;
    state.renderInline(node, node.header ? 'th' : 'td', {
      align,
      colspan: colspan ? String(colspan) : undefined,
      rowspan: rowspan ? String(rowspan) : undefined,
    });
  },
  image(node, state) {
    if (node.url?.startsWith('http')) {
      state.warn(`Image URL is remote (${node.url})`, node, 'image');
    }
    if (state.data.isInContainer && node.alt && !node.data?.altTextIsAutoGenerated) {
      state.openNode('alt-text');
      state.text(node.alt);
      state.closeNode();
    }
    const attrs: Record<string, any> = { mimetype: 'image' };
    const ext = node.url ? node.url.split('.').slice(-1)?.[0] : '';
    if (ext) attrs['mime-subtype'] = ext;
    attrs['xlink:href'] = node.url;
    // TOOD: identifier?
    if (node.placeholder) state.openNode('alternatives');
    state.addLeaf('graphic', attrs);
    if (node.placeholder) state.closeNode();
  },
  container(node, state) {
    state.data.isInContainer = true;
    switch (node.kind) {
      case 'figure': {
        state.renderInline(node, 'fig');
        break;
      }
      case 'table': {
        state.renderInline(node, 'table-wrap');
        break;
      }
      case 'quote': {
        // This is transformed in containers.ts
        state.renderChildren(node);
        break;
      }
      case 'code': {
        // This is transformed in containers.ts
        state.renderInline(node, 'boxed-text', { 'content-type': node.kind });
        break;
      }
      default: {
        state.error(`Unhandled container kind of ${node.kind}`, node, 'container');
        state.renderChildren(node);
      }
    }
    delete state.data.isInContainer;
  },
  caption(node, state) {
    state.renderInline(node, 'caption');
  },
  captionNumber(node, state) {
    delete (node as any).identifier;
    state.renderInline(node, 'label');
  },
  crossReference(node, state) {
    // Look up reference and add the text
    const { identifier, kind } = node as CrossReference;
    const attrs: Attributes = { 'ref-type': referenceKindToRefType(kind), rid: identifier };
    if (attrs['ref-type'] === RefType.custom && kind) {
      attrs['custom-type'] = kind;
    }
    state.renderInline(node, 'xref', attrs);
  },
  citeGroup(node, state) {
    state.renderChildren(node);
  },
  cite(node, state) {
    const { label } = node as Cite;
    const attrs: Attributes = {
      'ref-type': 'bibr',
      rid: label,
    };
    if (!state.referenceOrder.includes(label)) {
      state.referenceOrder.push(label);
    }
    state.renderInline(node, 'xref', attrs);
  },
  footnoteReference(node, state) {
    const { identifier, enumerator } = node as FootnoteReference;
    const attrs: Attributes = {
      'ref-type': 'fn',
      rid: identifier,
    };
    state.openNode('xref', attrs);
    state.text(enumerator);
    state.closeNode();
  },
  footnoteDefinition(node, state) {
    const { identifier, enumerator } = node as FootnoteDefinition;
    state.openNode('fn', { id: identifier });
    state.openNode('label');
    state.text(enumerator);
    state.closeNode();
    state.renderChildren(node);
    const element = state.stack.pop();
    if (element) state.footnotes.push(element);
  },
  si(node, state) {
    // <named-content content-type="quantity">5 <abbrev content-type="unit" alt="milli meter">mm</abbrev></named-content>
    const hasNumber = node.number != null;
    if (hasNumber) {
      state.openNode('named-content', { 'content-type': 'quantity' });
      state.text(`${node.number} `);
    }
    state.openNode('abbrev', { 'content-type': 'unit', alt: node.alt });
    state.text(node.unit);
    state.closeNode();
    if (hasNumber) state.closeNode();
  },
  proof(node, state) {
    state.openNode('statement', { 'specific-use': node.kind, id: node.identifier });
    const [title, ...rest] = node.children ?? [];
    const useTitle = title && title.type === 'admonitionTitle';
    if (node.enumerated) {
      state.openNode('label');
      state.text(`${capitalize(node.kind)} ${node.enumerator}`);
      state.closeNode();
    }
    if (useTitle) {
      state.openNode('title');
      state.renderChildren(title);
      state.closeNode();
    }
    state.renderChildren(useTitle ? rest : node.children);
    state.closeNode();
  },
  algorithmLine(node, state) {
    state.openNode('p', { 'specific-use': 'line' });
    if (node.enumerator) {
      state.openNode('x');
      state.text(`${node.enumerator}: `);
      state.closeNode();
    }
    state.text(Array(node.indent).fill(' ').join(''));
    state.renderChildren(node);
    state.closeNode();
  },
  output(node, state) {
    if (state.data.isInContainer) {
      if (!node.data?.[0]) return;
      alternativesFromMinifiedOutput(node.data[0], state);
      return;
    }
    const { identifier } = node;
    const attrs: Attributes = { 'sec-type': 'notebook-output' };
    node.data?.forEach((output: any, index: number) => {
      state.openNode('sec', {
        ...attrs,
        id: identifier && !state.data.isNotebookArticleRep ? `${identifier}-${index}` : undefined,
      });
      alternativesFromMinifiedOutput(output, state);
      state.closeNode();
    });
  },
  embed(node, state) {
    if (state.data.isInContainer) {
      // embedded figure content is handled in container transform
      return;
    }
    state.renderChildren(node);
  },
  supplementaryMaterial(node, state) {
    const smNode = node as SupplementaryMaterial;
    state.openNode('p');
    const smAttrs: Record<string, any> = {};
    if (smNode.figIdentifier) {
      smAttrs.id = `${smNode.figIdentifier}-source`;
    }
    smAttrs['specific-use'] = 'notebook';
    state.openNode('supplementary-material', smAttrs);
    renderLabel(node, state, (s: string) => `Figure ${s} - Notebook.`);
    state.openNode('caption');
    state.openNode('title');
    state.text('Analysis for ');
    if (smNode.figIdentifier) {
      state.openNode('xref', { 'ref-type': 'fig', rid: smNode.figIdentifier });
    }
    state.text('Figure' + (smNode.enumerator ? ` ${smNode.enumerator}` : ''));
    if (smNode.figIdentifier) {
      state.closeNode();
    }
    state.text('.');
    state.closeNode();
    state.openNode('p');
    state.text('See methods');
    if (smNode.sourceSlug) {
      state.text(' in ');
      state.openNode('xref', {
        'ref-type': 'custom',
        'custom-type': 'notebook',
        rid: smNode.sourceSlug,
      });
      state.text('notebook');
      state.closeNode();
    }
    if (smNode.embedIdentifier) {
      state.text(' from ');
      state.openNode('xref', {
        'ref-type': 'custom',
        'custom-type': 'notebook-code',
        rid: smNode.embedIdentifier,
      });
      state.text('cell');
      state.closeNode();
    }
    state.text('.');
    state.closeNode();
    state.closeNode();
    state.closeNode();
    state.closeNode();
  },
  inlineExpression,
};

function createText(text: string): Element {
  return { type: 'text', text: escapeForXML(text) };
}

function renderPart(vfile: VFile, mdast: GenericParent, part: string | string[], opts?: Options) {
  const { frontmatterParts, ...otherOpts } = opts ?? {};
  const partMdast = extractPart(mdast, part, {
    removePartData: true,
    frontmatterParts,
  });
  if (!partMdast) return undefined;
  const serializer = new JatsSerializer(vfile, partMdast as Root, otherOpts);
  return serializer.render(true).elements();
}

function renderAbstract(vfile: VFile, mdast: GenericParent, def: JatsPart, opts?: Options) {
  const elements = renderPart(vfile, mdast, def.part, opts);
  if (!elements) return undefined;
  const abstract: Element = { type: 'element', name: 'abstract', elements };
  if (def.title)
    abstract.elements = [
      { type: 'element', name: 'title', elements: [{ type: 'text', text: def.title }] },
      ...(abstract.elements as Element[]),
    ];
  if (def.type) abstract.attributes = { 'abstract-type': def.type };
  return abstract;
}

function renderAcknowledgments(vfile: VFile, mdast: GenericParent, opts?: Options) {
  const elements = renderPart(vfile, mdast, ACKNOWLEDGMENT_PARTS, opts);
  if (!elements) return undefined;
  const acknowledgments: Element = { type: 'element', name: 'ack', elements };
  return acknowledgments;
}

function renderBackSection(vfile: VFile, mdast: GenericParent, def: JatsPart, opts?: Options) {
  const elements = renderPart(vfile, mdast, def.part, opts);
  if (!elements) return undefined;
  const sec: Element = { type: 'element', name: 'sec', elements };
  if (def.title)
    sec.elements = [
      { type: 'element', name: 'title', elements: [{ type: 'text', text: def.title }] },
      ...(sec.elements as Element[]),
    ];
  if (def.type) sec.attributes = { 'sec-type': def.type };
  return sec;
}

export class JatsSerializer implements IJatsSerializer {
  file: VFile;
  data: StateData;
  handlers: Record<string, Handler>;
  mdast: Root;
  stack: Element[];
  footnotes: Element[];
  expressions: Element[];
  referenceOrder: string[];
  opts: Options;

  constructor(file: VFile, mdast: Root, opts?: Options) {
    this.file = file;
    this.data = {
      isNotebookArticleRep: opts?.isNotebookArticleRep,
      slug: opts?.slug,
    };
    this.stack = [{ type: 'element', elements: [] }];
    this.footnotes = [];
    this.expressions = [];
    this.referenceOrder = [];
    this.handlers = opts?.handlers ?? handlers;
    this.mdast = copyNode(mdast);
    this.opts = opts ?? {};
    basicTransformations(this.mdast as any, opts ?? {});
  }

  render(ignoreParts?: boolean) {
    if (!ignoreParts) {
      if (this.opts?.extractAbstract) {
        const abstractParts =
          this.opts.abstractParts ??
          ABSTRACT_PARTS.map((part) => {
            return { part };
          });
        this.data.abstracts = abstractParts
          .map((def) => renderAbstract(this.file, this.mdast, def, this.opts))
          .filter((e) => !!e) as Element[];
      }
      this.data.acknowledgments = renderAcknowledgments(this.file, this.mdast, this.opts);
      const backSections = this.opts?.backSections ?? [];
      this.data.backSections = backSections
        .map((def) => renderBackSection(this.file, this.mdast, def, this.opts))
        .filter((e) => !!e) as Element[];
    }
    this.renderChildren(this.mdast);
    while (this.stack.length > 1) this.closeNode();
    return this;
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  warn(message: string, node?: GenericNode, source?: string, opts?: MessageInfo) {
    fileError(this.file, message, {
      ...opts,
      node,
      source: source ? `myst-to-jats:${source}` : 'myst-to-jats',
      ruleId: RuleId.jatsRenders,
    });
  }

  error(message: string, node?: GenericNode, source?: string, opts?: MessageInfo) {
    fileError(this.file, message, {
      ...opts,
      node,
      source: source ? `myst-to-jats:${source}` : 'myst-to-jats',
      ruleId: RuleId.jatsRenders,
    });
  }

  pushNode(el?: Element) {
    const top = this.top();
    if (this.stack.length && el && 'elements' in top) top.elements?.push(el);
    return el;
  }

  text(text?: string) {
    const top = this.top();
    const value = text;
    if (!value || !this.stack.length || !('elements' in top)) return;
    const last = top.elements?.[top.elements.length - 1];
    if (last?.type === 'text') {
      // The last node is also text, merge it
      last.text += `${escapeForXML(value)}`;
      return last;
    }
    const node = createText(value);
    top.elements?.push(node);
    return node;
  }

  renderChildren(node: GenericNode | GenericNode[]) {
    const parent = Array.isArray(node) ? { children: node } : node;
    const children = Array.isArray(node) ? node : node.children;
    children?.forEach((child) => {
      const handler = this.handlers[child.type];
      if (handler) {
        handler(child, this, parent);
      } else {
        fileError(this.file, `Unhandled JATS conversion for node of "${child.type}"`, {
          node: child,
          source: 'myst-to-jats',
        });
      }
    });
  }

  renderInline(node: GenericNode, name: string, attributes?: Attributes) {
    this.openNode(name, {
      id: name !== 'xref' && node.identifier ? node.identifier : undefined,
      ...attributes,
    });
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
    const node: Element =
      name === 'cdata'
        ? { type: 'cdata', cdata: attributes?.cdata }
        : { type: 'element', name, attributes };
    if (!isLeaf) node.elements = [];
    this.stack.push(node);
  }

  closeNode() {
    const node = this.stack.pop();
    return this.pushNode(node);
  }

  elements() {
    return this.stack[0].elements ?? [];
  }
}

export class JatsDocument {
  file: VFile;
  options: DocumentOptions;
  content: ArticleContent;

  constructor(file: VFile, content: ArticleContent, opts?: DocumentOptions) {
    this.file = file;
    this.options = opts ?? {};
    this.content = content;
  }

  article(articleType?: string, specificUse?: string) {
    const attributes: Record<string, string> = {
      'xmlns:mml': 'http://www.w3.org/1998/Math/MathML',
      'xmlns:xlink': 'http://www.w3.org/1999/xlink',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xmlns:ali': 'http://www.niso.org/schemas/ali/1.0/', // Used for the licensing
      'dtd-version': '1.3',
      'xml:lang': 'en',
    };
    if (articleType) attributes['article-type'] = articleType;
    if (specificUse) attributes['specific-use'] = specificUse;
    const isNotebookArticleRep = this.content.kind === SourceFileKind.Notebook;
    if (this.content.slug) {
      attributes.id = `${this.content.slug}${isNotebookArticleRep ? '-article' : ''}`;
    }
    const articleState = new JatsSerializer(this.file, this.content.mdast, {
      ...this.options,
      isNotebookArticleRep,
      extractAbstract: true,
      frontmatterParts: this.content.frontmatter?.parts,
    });
    const inventory: IdInventory = {};
    referenceTargetTransform(articleState.mdast as any, inventory, this.content.citations);
    const subArticles = this.options.subArticles ?? [];
    if (isNotebookArticleRep) {
      subArticles.unshift({
        mdast: copyNode(this.content.mdast),
        kind: this.content.kind,
        frontmatter: this.content.frontmatter,
        slug: this.content.slug,
        // No citations here - don't want duplicates in the jats
      });
    }
    affiliationIdTransform(
      [this.content.frontmatter, ...subArticles.map((a) => a.frontmatter)].filter(
        (fm): fm is Omit<PageFrontmatter, 'parts'> => !!fm,
      ),
      'aff',
    );
    const subArticleStates = subArticles.map((subArticle, ind) => {
      const subArticleState = this.subArticleState(subArticle, ind === 0 && isNotebookArticleRep);
      referenceTargetTransform(subArticleState.mdast as any, inventory, subArticle.citations);
      return subArticleState;
    });
    [articleState, ...subArticleStates].forEach((state) => {
      referenceResolutionTransform(state.mdast as any, inventory);
      state.render();
    });
    const elements: Element[] = [
      ...getFront(this.content.frontmatter, articleState),
      this.body(articleState),
      ...getBack(articleState, {
        citations: this.content.citations,
        footnotes: articleState.footnotes,
        expressions: articleState.expressions,
        referenceOrder: articleState.referenceOrder,
      }),
      ...subArticleStates.map((state, ind) => {
        return this.subArticle(state, subArticles[ind], ind === 0 && isNotebookArticleRep);
      }),
    ];
    const article: Element = {
      type: 'element',
      name: Tags.article,
      attributes,
      elements,
    };
    return article;
  }

  frontStub(
    frontmatter?: FrontmatterWithParts,
    state?: IJatsSerializer,
    notebookRep?: boolean,
  ): Element[] {
    const stubFrontmatter: Record<string, any> = {};
    if (frontmatter) {
      // Do not duplicate frontmatter fields that are already in the article front
      Object.entries(frontmatter).forEach(([key, val]) => {
        const articleVal = this.content.frontmatter?.[key as keyof PageFrontmatter];
        if (articleVal == null || JSON.stringify(val) !== JSON.stringify(articleVal)) {
          stubFrontmatter[key] = val;
        }
      });
    }
    const articleMeta = getArticleMeta(stubFrontmatter, state);
    let elements = articleMeta?.elements ?? [];
    if (notebookRep) {
      const articleVersion: Element = {
        type: 'element',
        name: 'article-version',
        attributes: { 'article-version-type': 'alt representation' },
        elements: [{ type: 'text', text: 'notebook' }],
      };
      // For valid JATS, article-id must be first if it is present and article-version must be next
      if (elements[0]?.name === 'article-id') {
        elements = [elements[0], articleVersion, ...elements.slice(1)];
      } else {
        elements.unshift(articleVersion);
      }
    }
    return [{ type: 'element', name: 'front-stub', elements }];
  }

  subArticleState(content: ArticleContent, notebookRep: boolean): IJatsSerializer {
    return new JatsSerializer(this.file, content.mdast, {
      ...this.options,
      isNotebookArticleRep: false,
      isSubArticle: true,
      slug: content.slug,
      extractAbstract: !notebookRep,
      frontmatterParts: content.frontmatter?.parts,
    });
  }

  subArticle(
    subArticleState: IJatsSerializer,
    content: ArticleContent,
    notebookRep: boolean,
  ): Element {
    const elements: Element[] = [
      ...this.frontStub(content.frontmatter, subArticleState, notebookRep),
      { type: 'element', name: 'body', elements: subArticleState.elements() },
      ...getBack(subArticleState, {
        citations: content.citations,
        footnotes: subArticleState.footnotes,
        expressions: subArticleState.expressions,
        referenceOrder: subArticleState.referenceOrder,
      }),
    ];
    const attributes: Record<string, any> = {};
    if (content.slug) attributes.id = content.slug;
    return { type: 'element', name: 'sub-article', elements, attributes };
  }

  body(state?: JatsSerializer) {
    if (!state) {
      state = new JatsSerializer(this.file, this.content.mdast, this.options);
      state.render();
    }
    return { type: 'element', name: 'body', elements: state.elements() } as Element;
  }
}

export function writeJats(file: VFile, content: ArticleContent, opts?: DocumentOptions) {
  const doc = new JatsDocument(file, content, opts);
  const element = opts?.writeFullArticle
    ? {
        type: 'element',
        elements: [
          {
            type: 'doctype',
            doctype:
              'article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD with MathML3 v1.3 20210610//EN" "http://jats.nlm.nih.gov/publishing/1.3/JATS-archivearticle1-3-mathml3.dtd"',
          },
          doc.article(),
        ],
        declaration: { attributes: { version: '1.0', encoding: 'UTF-8' } },
      }
    : doc.body();
  const xml = serializeJatsXml(element, opts);
  file.result = xml;
  return file;
}

declare module 'unified' {
  interface CompileResultMap {
    VFile: VFile;
  }
}

const plugin: Plugin<
  [SourceFileKind, FrontmatterWithParts?, CitationRenderer?, string?, DocumentOptions?],
  Root,
  VFile
> = function (kind, frontmatter, citations, slug, opts) {
  this.compiler = (node, file) => {
    return writeJats(file, { mdast: node as any, kind, frontmatter, citations, slug }, opts);
  };
};

export default plugin;
