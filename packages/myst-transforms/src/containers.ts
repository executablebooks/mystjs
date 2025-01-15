import type { Plugin } from 'unified';
import {
  fileError,
  fileWarn,
  liftChildren,
  normalizeLabel,
  RuleId,
  plural,
  transferTargetAttrs,
} from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import { remove } from 'unist-util-remove';
import { select, selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

const SUBFIGURE_TYPES = [
  'embed',
  'block',
  'container',
  'image',
  'mermaid',
  'iframe',
  'table',
  'code',
  'output',
];

/** Raise a warning if caption includes content that is expected to be directly on the figure */
function warnOnCaptionContent(tree: GenericParent, vfile: VFile) {
  const captions = [...selectAll('caption', tree), ...selectAll('legend', tree)] as GenericParent[];
  SUBFIGURE_TYPES.forEach((t) => {
    captions.forEach((caption) => {
      if (select(t, caption)) {
        fileWarn(vfile, `unexpected figure content of type ${t} found in ${caption.type} node`, {
          node: caption,
          ruleId: RuleId.containerChildrenValid,
        });
      }
    });
  });
}

function isPlaceholder(node: GenericNode) {
  return node.type === 'image' && node.placeholder;
}

function isStatic(node: GenericNode) {
  return node.type === 'image' && node.static;
}

/** Nest node inside container */
function createSubfigure(node: GenericNode, parent: GenericParent): GenericParent {
  const children = node.type === 'container' && node.children ? node.children : [node];
  if (node.type === 'image' && node.alt) {
    children.push({
      type: 'caption',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: node.alt,
            },
          ],
        },
      ],
    });
    delete node.alt;
  }
  const { label, identifier } = normalizeLabel(node.label) ?? {};
  node.label = label;
  node.identifier = identifier;
  const subfigure = {
    type: 'container',
    kind: node.kind ?? parent.kind ?? 'figure',
    subcontainer: true,
    children,
  };
  transferTargetAttrs(node, subfigure);
  return subfigure;
}

/**
 * Lifts images out of paragraph that only contains images and newlines
 *
 * This handles the case of:
 * ```
 * :::{figure}
 *
 * ![](image_a.png)
 * ![](image_b.png)
 *
 * :::
 * ```
 * which parses to paragraph with image, newline, image children.
 */
function hoistContentOutOfParagraphs(tree: GenericParent) {
  const paragraphs = selectAll('paragraph', tree) as GenericParent[];
  paragraphs.forEach((paragraph) => {
    const unhoistableChildren = paragraph.children.filter((child) => {
      if (child.type === 'text' && child.value === '\n') return false;
      if (SUBFIGURE_TYPES.includes(child.type)) return false;
      return true;
    });
    if (unhoistableChildren.length > 0) return;
    selectAll('text', paragraph).forEach((child) => {
      child.type = '__delete__';
    });
    paragraph.type = '__lift__';
  });
  remove(tree, '__delete__');
  liftChildren(tree, '__lift__');
}

/**
 * Update container children and add sub-figures
 *
 * - Valid container nodes are ensured to be first children.
 *   These include image/iframe/table/code/embed/block/container nodes.
 * - If multiple of these are present, they are nested as sub-figures.
 *   (This does not include placeholder images, which are left unchanged)
 * - A warning is raised if these node types are found in caption or legend
 * - Remaining non-image content becomes caption (first node) and legend (subsequent nodes).
 */
export function containerChildrenTransform(tree: GenericParent, vfile: VFile) {
  const containers = selectAll('container', tree) as GenericParent[];
  // Process in reverse so subfigure processing persists
  containers.reverse().forEach((container) => {
    // We don't need to process quotes
    if (container.kind === 'quote') {
      return;
    }
    hoistContentOutOfParagraphs(container);
    let subfigures: GenericNode[] = [];
    let placeholderImage: GenericNode | undefined;
    let staticImage: GenericNode | undefined;
    let caption: GenericNode | undefined;
    let legend: GenericNode | undefined;
    const otherNodes: GenericNode[] = [];
    container.children.forEach((child: GenericNode) => {
      if (child.type === 'caption') {
        if (caption) {
          fileError(vfile, 'container has multiple captions', {
            node: container,
            ruleId: RuleId.containerChildrenValid,
          });
        } else {
          caption = child;
        }
      } else if (child.type === 'legend') {
        if (legend) {
          fileError(vfile, 'container has multiple legends', {
            node: container,
            ruleId: RuleId.containerChildrenValid,
          });
        } else {
          legend = child;
        }
      } else if (isPlaceholder(child)) {
        if (placeholderImage) {
          fileError(vfile, 'container has multiple placeholders', {
            node: container,
            ruleId: RuleId.containerChildrenValid,
          });
        } else {
          placeholderImage = child;
        }
      } else if (isStatic(child)) {
        if (staticImage) {
          fileError(vfile, 'container has multiple static images', {
            node: container,
            ruleId: RuleId.containerChildrenValid,
          });
        } else {
          staticImage = child;
        }
      } else if (SUBFIGURE_TYPES.includes(child.type)) {
        subfigures.push(child);
      } else {
        otherNodes.push(child);
      }
    });
    if (!caption && otherNodes.length > 0) {
      caption = { type: 'caption', children: [otherNodes.shift() as GenericNode] };
    }
    if (!legend && otherNodes.length > 0) {
      legend = { type: 'legend', children: [...otherNodes] };
    } else if (otherNodes.length > 0) {
      fileError(
        vfile,
        `container includes unexpected children of ${plural('type(s)', otherNodes)} ${otherNodes
          .map((n) => n.type)
          .join(', ')}`,
        { node: container, ruleId: RuleId.containerChildrenValid },
      );
    }
    if (subfigures.length === 0) {
      const suffix = [
        caption ? 'caption' : undefined,
        legend ? 'legend' : undefined,
        placeholderImage ? 'placeholder image' : undefined,
        staticImage ? 'static image' : undefined,
      ]
        .filter(Boolean)
        .join(', ');
      fileError(
        vfile,
        `container of kind ${container.kind} contains no valid content${
          suffix ? ' besides ' + suffix : ''
        }`,
        {
          node: container,
          ruleId: RuleId.containerChildrenValid,
          note: 'Valid content types include image, referenced notebook cell, table, code, iframe, subfigure',
        },
      );
    }
    if (subfigures.length > 1 && !container.noSubcontainers) {
      subfigures = subfigures.map((node) => createSubfigure(node, container));
    }
    const children: GenericNode[] = [...subfigures];
    if (placeholderImage) children.push(placeholderImage);
    if (staticImage) children.push(staticImage);
    // Caption is above tables and below all other figures
    if (container.kind === 'table') {
      if (caption) children.unshift(caption);
      if (legend) children.push(legend);
    } else {
      if (caption) children.push(caption);
      if (legend) children.push(legend);
    }
    container.children = children;
  });
  warnOnCaptionContent(tree, vfile);
}

export const containerChildrenPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree, vfile) => {
    containerChildrenTransform(tree, vfile);
  };
