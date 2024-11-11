import type { Plugin } from 'unified';
import type { Block } from 'myst-spec-ext';
import { selectBlockParts, type GenericParent } from 'myst-common';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import { ABSTRACT_PARTS, ACKNOWLEDGMENT_PARTS, type Options } from '../types.js';

function blocksToKeep(tree: GenericParent, opts: Options) {
  const keepParts: string[] = [...ACKNOWLEDGMENT_PARTS];
  if (opts.extractAbstract) {
    keepParts.push(...(opts.abstractParts?.map(({ part }) => part).flat() ?? ABSTRACT_PARTS));
  }
  if (opts.backSections) {
    keepParts.push(...opts.backSections.map(({ part }) => part).flat());
  }
  return selectBlockParts(tree, keepParts);
}

/**
 * This transform does the following:
 * - Removes hidden or removed blocks from the tree except those that are consumed as front/backmatter parts
 * - Removes hidden or removed outputs from the tree
 */
export function blockTransform(tree: GenericParent, opts: Options) {
  // Collect blocks that will be used as parts to make sure they are not deleted
  const doNotDelete = blocksToKeep(tree, opts);
  // This could also be an output, etc.
  (selectAll('[visibility=remove],[visibility=hide]', tree) as Block[]).forEach((node) => {
    if (node.visibility === 'remove' || node.visibility === 'hide') {
      (node as any).type = '__delete__';
    }
  });
  // Blocks are converted to sections - avoid doing this for part blocks
  doNotDelete.forEach((node) => {
    node.type = 'block-part' as any;
  });
  remove(tree, '__delete__');
}

export const blockPlugin: Plugin<[Options], GenericParent, GenericParent> = (opts) => (tree) => {
  blockTransform(tree, opts);
};

export function restoreBlockPartTypeTransform(tree: GenericParent) {
  selectAll('block-part', tree).forEach((node) => {
    node.type = 'block';
  });
}
