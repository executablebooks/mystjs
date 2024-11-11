import type { VFile } from 'vfile';
import type { VFileMessage } from 'vfile-message';
import type { Position } from 'unist';
import { customAlphabet } from 'nanoid';
import type { Node, Parent, PhrasingContent } from 'myst-spec';
import type { RuleId } from './ruleids.js';
import type { AdmonitionKind, GenericNode, GenericParent } from './types.js';

export type MessageInfo = {
  node?: Node | Position;
  note?: string;
  source?: string;
  url?: string;
  fatal?: boolean;
  ruleId?: RuleId | string;
};

function addMessageInfo(message: VFileMessage, info?: MessageInfo) {
  if (info?.note) message.note = info.note;
  if (info?.url) message.url = info.url;
  if (info?.ruleId) message.ruleId = info.ruleId as string;
  if (info?.fatal) message.fatal = true;
  return message;
}

export function fileError(file: VFile, message: string | Error, opts?: MessageInfo): VFileMessage {
  //@ts-expect-error file.message signature
  return addMessageInfo(file.message(message, opts?.node, opts?.source), { ...opts, fatal: true });
}

export function fileWarn(file: VFile, message: string | Error, opts?: MessageInfo): VFileMessage {
  //@ts-expect-error file.message signature
  return addMessageInfo(file.message(message, opts?.node, opts?.source), opts);
}

export function fileInfo(file: VFile, message: string | Error, opts?: MessageInfo): VFileMessage {
  //@ts-expect-error file.message signature
  return addMessageInfo(file.info(message, opts?.node, opts?.source), opts);
}

const az = 'abcdefghijklmnopqrstuvwxyz';
const alpha = az + az.toUpperCase();
const numbers = '0123456789';
const nanoidAZ = customAlphabet(alpha, 1);
const nanoidAZ9 = customAlphabet(alpha + numbers, 9);

/**
 * Create random 10-digit alphanumeric string
 */
export function createId() {
  return nanoidAZ() + nanoidAZ9();
}

/**
 * https://github.com/syntax-tree/mdast#association
 * @param label A label field can be present.
 *        label is a string value: it works just like title on a link or a
 *        lang on code: character escapes and character references are parsed.
 * @returns { identifier, label, html_id }
 */
export function normalizeLabel(
  label: string | undefined,
): { identifier: string; label: string; html_id: string } | undefined {
  if (!label) return undefined;
  const identifier = label
    .replace(/[\t\n\r ]+/g, ' ')
    .replace(/['‘’"“”]+/g, '') // These can make matching difficult, especially in glossaries and terms
    .trim()
    .toLowerCase();
  const html_id = createHtmlId(identifier) as string;
  return { identifier, label: label, html_id };
}

export function createHtmlId(identifier?: string): string | undefined {
  if (!identifier) return undefined;
  return identifier
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Remove any fancy characters
    .replace(/^([0-9-])/, 'id-$1') // Ensure that the id starts with a letter
    .replace(/-[-]+/g, '-') // Replace repeated `-`s
    .replace(/(?:^[-]+)|(?:[-]+$)/g, ''); // Remove repeated `-`s at the start or the end
}

/**
 * Transfer all target-related attributes from one node to another
 *
 * During mdast transformation, these attributes (including: label,
 * identifier, html_id, indexEntries) are often moved. For example
 * `mystTarget` information propagates to the next node, `image`
 * attributes may propagate to parent `container` node, etc.
 *
 * This shared function helps insure attributes are not lost along the way.
 */
export function transferTargetAttrs(sourceNode: GenericNode, destNode: GenericNode, vfile?: VFile) {
  if (sourceNode.label) {
    if (destNode.label && vfile) {
      fileWarn(vfile, `label "${destNode.label}" replaced with "${sourceNode.label}"`, {
        node: destNode,
      });
    }
    destNode.label = sourceNode.label;
    delete sourceNode.label;
  }
  if (sourceNode.identifier) {
    destNode.identifier = sourceNode.identifier;
    delete sourceNode.identifier;
  }
  if (sourceNode.html_id) {
    destNode.html_id = sourceNode.html_id;
    delete sourceNode.html_id;
  }
  if (sourceNode.indexEntries) {
    if (!destNode.indexEntries) destNode.indexEntries = [];
    destNode.indexEntries.push(...sourceNode.indexEntries);
    delete sourceNode.indexEntries;
  }
}

/**
 * Helper function for recursively lifting children
 */
function getNodeOrLiftedChildren(
  node: GenericParent | GenericNode,
  removeType: string,
): (GenericParent | GenericNode)[] {
  if (!node.children) return [node];
  const children = node.children.map((child) => getNodeOrLiftedChildren(child, removeType)).flat();
  if (node.type === removeType) {
    // There are some checks in unist that look like `'children' in node`
    // all children must be deleted, and not a key on the object
    if (node && node.children == null) delete node.children;
    return children;
  }
  node.children = children;
  return [node];
}

/**
 * Eliminate all parent nodes in `tree` of type `removeType`; children of eliminated nodes are moved up to it's parent
 *
 * Nodes of `removeType` will remain if:
 * - they are the root of `tree`
 * - their children are undefined
 */
export function liftChildren(tree: GenericParent | GenericNode, removeType: string) {
  if (!tree.children) return;
  tree.children = tree.children.map((child) => getNodeOrLiftedChildren(child, removeType)).flat();
}

export function setTextAsChild(node: Partial<Parent>, text: string) {
  node.children = [{ type: 'text', value: text } as Node];
}

/**
 * Renders a textual representation of one or more nodes
 * by concatenating all children that have a text representation.
 * @param content The node or nodes to provide as input.
 * @returns A string. An empty string is returned in case no
 * textual representation could be extracted.
 */
export function toText(content?: Node[] | Node | null): string {
  if (!content) return '';
  if (!Array.isArray(content)) return toText([content]);
  return (content as PhrasingContent[])
    .map((n) => {
      if (!n || typeof n === 'string') return n || '';
      if ('value' in n) return n.value;
      if ('children' in n && n.children) return toText(n.children);
      return '';
    })
    .join('');
}

export function copyNode<T extends Node | Node[]>(node: T): T {
  return structuredClone(node);
}

export function mergeTextNodes(node: GenericNode): GenericNode {
  const children = node.children?.reduce((c, n) => {
    if (n?.type !== 'text') {
      c.push(mergeTextNodes(n));
      return c;
    }
    const last = c[c.length - 1];
    if (last?.type !== 'text') {
      c.push(n);
      return c;
    }
    if (n.position?.end) {
      if (!last.position) last.position = {} as Required<GenericNode>['position'];
      last.position.end = n.position.end;
    }
    if (!last.value) last.value = '';
    if (n.value) last.value += n.value;
    return c;
  }, [] as GenericNode[]);
  if (children) node.children = children;
  return node;
}

export function admonitionKindToTitle(kind: AdmonitionKind | string) {
  const transform: Record<string, string> = {
    attention: 'Attention',
    caution: 'Caution',
    danger: 'Danger',
    error: 'Error',
    important: 'Important',
    hint: 'Hint',
    note: 'Note',
    seealso: 'See Also',
    tip: 'Tip',
    warning: 'Warning',
  };
  return transform[kind] || `Unknown Admonition "${kind}"`;
}

export function writeTexLabelledComment(title: string, commands: string[], commentLength: number) {
  if (!commands || commands?.length === 0) return '';
  const len = (commentLength - title.length - 4) / 2;
  const start = ''.padEnd(Math.ceil(len), '%');
  const end = ''.padEnd(Math.floor(len), '%');
  const titleBlock = `${start}  ${title}  ${end}\n`;
  return `${titleBlock}${commands.join('\n')}\n`;
}

export function getMetadataTags(node: GenericNode) {
  if (!node.data) return [];
  const tags: string[] = node.data.tags ?? [];
  Object.entries(node.data).forEach(([key, val]) => {
    if (val === true || (typeof val === 'string' && val.toLowerCase() === 'true')) {
      tags.push(key);
    }
  });
  return tags.map((tag) => tag.toLowerCase());
}

/**
 * Change from a slug such as `folder.subfolder.index` to a URL (`folder/subfolder`).
 *
 * @param slug
 * @returns url
 */
export function slugToUrl<T extends string | undefined>(slug: T): T {
  if (slug == null) return undefined as T;
  return slug.replace(/\.index$/, '').replace(/\./g, '/') as T;
}
