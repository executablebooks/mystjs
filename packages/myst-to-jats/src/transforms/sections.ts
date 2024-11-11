import type { Plugin } from 'unified';
import type { Parent, Heading } from 'myst-spec';
import type { Block } from 'myst-spec-ext';
import type { GenericParent } from 'myst-common';
import { liftChildren, NotebookCell } from 'myst-common';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import type { Options } from '../types.js';

export type Section = Omit<Heading, 'type'> & { type: 'section'; meta?: string };

export function sectionAttrsFromBlock(node: { kind?: NotebookCell | string; identifier?: string }) {
  const output: { 'sec-type'?: string; id?: string } = {};
  if (node.kind) {
    const blockType = node.kind;
    if (Object.values(NotebookCell).includes(blockType as NotebookCell)) {
      output['sec-type'] = blockType;
    }
  }
  if (node.identifier) output.id = node.identifier;
  return output;
}

function blockIsNotebookCode(node: Block) {
  // Markdown blocks will be divided to sections later by headings.
  return sectionAttrsFromBlock(node)['sec-type'] === NotebookCell.code;
}

function blockIsNotebookFigure(node: Block) {
  return !!node.data?.['fig-cap'];
}

function headingsToSections(tree: GenericParent | Block) {
  const stack: Section[] = [];
  const children: Parent[] = [];
  function push(child: any) {
    const top = stack[stack.length - 1];
    if (top) {
      top.children.push(child);
    } else {
      children.push(child);
    }
  }

  function newSection(heading: Heading) {
    const { enumerator, enumerated, ...filtered } = heading;
    const next: Section = { ...filtered, type: 'section', children: [] };
    while (stack[stack.length - 1] && stack[stack.length - 1].depth >= heading.depth) stack.pop();
    push(next);
    stack.push(next);
    return { enumerator, enumerated };
  }
  tree.children?.forEach((child) => {
    if (child.type === 'heading') {
      const { enumerator, enumerated } = newSection(child as Heading);
      push({ type: 'heading', enumerator, enumerated, children: child.children });
    } else {
      push(child);
    }
  });
  tree.children = children as any;
}

/**
 * This transform does the following:
 * - For sub-articles:
 *    - Blocks are converted to sections so notebook cell divisions are maintained.
 *    - Within each block, headers are converted to sections.
 * - For main articles:
 *    - Notebook code cell blocks (with meta.type of "notebook-code") are deleted.
 *    - Remaining blocks are removed, lifting children up a level
 *    - Top-level heading nodes are then used to break the tree into section nodes,
 *      with heading and subsequent nodes as children
 */
export function sectionTransform(tree: GenericParent, opts?: Pick<Options, 'isSubArticle'>) {
  if (opts?.isSubArticle) {
    (selectAll('block', tree) as Block[]).forEach((node) => {
      (node as any).type = 'section';
      (node as any).depth = 0;
      headingsToSections(node);
    });
    return;
  }
  (selectAll('block', tree) as Block[]).forEach((node) => {
    if (blockIsNotebookFigure(node)) {
      (node as any).type = 'section';
    } else if (blockIsNotebookCode(node)) {
      (node as any).type = '__delete__';
    }
  });
  remove(tree, '__delete__');

  liftChildren(tree, 'block'); // this looses part information. TODO: milestones
  headingsToSections(tree);
}

export const sectionPlugin: Plugin<
  [Pick<Options, 'isSubArticle'>?],
  GenericParent,
  GenericParent
> = (opts) => (tree) => {
  sectionTransform(tree, opts);
};
