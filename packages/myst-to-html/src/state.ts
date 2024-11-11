import type { GenericNode, GenericParent } from 'myst-common';
import { normalizeLabel, setTextAsChild } from 'myst-common';
import type { Heading } from 'myst-spec';
import { visit } from 'unist-util-visit';
import { select, selectAll } from 'unist-util-select';
import { findAndReplace } from 'mdast-util-find-and-replace';
import type { Node } from 'mdast';

export enum TargetKind {
  heading = 'heading',
  math = 'math',
  figure = 'figure',
  table = 'table',
  code = 'code',
}

export enum ReferenceKind {
  ref = 'ref',
  numref = 'numref',
  eq = 'eq',
}

type Target = {
  node: GenericNode;
  kind: TargetKind;
};

type TargetCounts = {
  heading?: (number | null)[];
} & Record<string, number>;

export type EnumeratorOptions = {
  disableHeadingEnumeration?: boolean;
  disableContainerEnumeration?: boolean;
  disableEquationEnumeration?: boolean;
};

/**
 * See https://www.sphinx-doc.org/en/master/usage/restructuredtext/roles.html#role-numref
 */
function fillReferenceEnumerators(node: GenericNode, enumerator: string | number) {
  const num = String(enumerator);
  findAndReplace(node as any, [
    ['%s', num],
    ['{number}', num],
  ]);
}

function kindFromNode(node: GenericNode): string | undefined {
  return node.type === 'container' ? node.kind : node.type;
}

/**
 * Increment heading counts based on depth to increment
 *
 * depth is the depth to increment
 * counts is a list of 6 counts, corresponding to 6 heading depths
 *
 * When a certain depth is incremented, shallower depths are left the same
 * and deeper depths are reset to zero. Null counts anywhere are ignored.
 */
export function incrementHeadingCounts(
  depth: number,
  counts: (number | null)[],
): (number | null)[] {
  const incrementIndex = depth - 1;
  return counts.map((count, index) => {
    if (count === null || index < incrementIndex) return count;
    if (index === incrementIndex) return count + 1;
    return 0;
  });
}

/**
 * Return dot-delimited header numbering based on heading counts
 *
 * counts is a list of 6 counts, corresponding to 6 heading depths
 *
 * Leading zeros are kept, trailing zeros are removed, nulls are ignored.
 */
export function formatHeadingEnumerator(counts: (number | null)[]): string {
  counts = counts.filter((d) => d !== null);
  while (counts && counts[counts.length - 1] === 0) {
    counts.pop();
  }
  return counts.join('.');
}

export class State {
  targets: Record<string, Target>;
  targetCounts: TargetCounts;

  constructor(targetCounts?: TargetCounts, targets?: Record<string, Target>) {
    this.targetCounts = targetCounts || {};
    this.targets = targets || {};
  }

  addTarget(node: GenericNode) {
    const kind = kindFromNode(node);
    if (kind && kind in TargetKind) {
      let enumerator = null;
      if (node.enumerated !== false) {
        enumerator = this.incrementCount(node, kind as TargetKind);
        node.enumerator = enumerator;
      }
      if (node.identifier) {
        this.targets[node.identifier] = {
          node: structuredClone(node),
          kind: kind as TargetKind,
        };
      }
    }
  }

  initializeNumberedHeadingDepths(tree: GenericParent) {
    const headings = selectAll('heading', tree).filter(
      (node) => (node as Heading).enumerated !== false,
    );
    const headingDepths = new Set(headings.map((node) => (node as Heading).depth));
    this.targetCounts.heading = [1, 2, 3, 4, 5, 6].map((depth) =>
      headingDepths.has(depth) ? 0 : null,
    );
  }

  incrementCount(node: GenericNode, kind: TargetKind): string {
    if (kind === TargetKind.heading) {
      // Ideally initializeNumberedHeadingDepths is called before incrementing
      // heading count to do a better job initializng headers based on tree
      if (!this.targetCounts.heading) this.targetCounts.heading = [0, 0, 0, 0, 0, 0];
      this.targetCounts.heading = incrementHeadingCounts(node.depth, this.targetCounts.heading);
      return formatHeadingEnumerator(this.targetCounts.heading);
    }
    if (kind in this.targetCounts) {
      this.targetCounts[kind] += 1;
    } else {
      this.targetCounts[kind] = 1;
    }
    return String(this.targetCounts[kind]);
  }

  getTarget(identifier?: string): Target | undefined {
    if (!identifier) return undefined;
    return this.targets[identifier];
  }

  resolveReferenceContent(node: GenericNode): GenericNode['children'] | undefined {
    const target = this.getTarget(node.identifier);
    if (!target) {
      return;
    }
    const kinds = {
      ref: {
        eq: node.kind === ReferenceKind.eq,
        ref: node.kind === ReferenceKind.ref,
        numref: node.kind === ReferenceKind.numref,
      },
      target: {
        math: target.kind === TargetKind.math,
        figure: target.kind === TargetKind.figure,
        table: target.kind === TargetKind.table,
        heading: target.kind === TargetKind.heading,
      },
    };
    const noNodeChildren = !node.children?.length;
    if (kinds.ref.eq && kinds.target.math && target.node.enumerator) {
      if (noNodeChildren) {
        setTextAsChild(node, `(${target.node.enumerator})`);
      }
      node.resolved = true;
    } else if (kinds.ref.ref && kinds.target.heading) {
      if (noNodeChildren) {
        node.children = structuredClone(target.node).children;
      }
      node.resolved = true;
    } else if (kinds.ref.ref && (kinds.target.figure || kinds.target.table)) {
      if (noNodeChildren) {
        const caption = select('caption > paragraph', target.node) as GenericNode;
        node.children = structuredClone(caption).children;
      }
      node.resolved = true;
    } else if (kinds.ref.numref && kinds.target.figure && target.node.enumerator) {
      if (noNodeChildren) {
        setTextAsChild(node, 'Figure %s');
      }
      fillReferenceEnumerators(node, target.node.enumerator);
      node.resolved = true;
    } else if (kinds.ref.numref && kinds.target.table && target.node.enumerator) {
      if (noNodeChildren) {
        setTextAsChild(node, 'Table %s');
      }
      fillReferenceEnumerators(node, target.node.enumerator);
      node.resolved = true;
    }
  }
}

export const enumerateTargets = (state: State, tree: GenericParent, opts: EnumeratorOptions) => {
  state.initializeNumberedHeadingDepths(tree);
  if (!opts.disableContainerEnumeration) {
    visit(tree, 'container', (node: GenericNode) => state.addTarget(node));
  }
  if (!opts.disableEquationEnumeration) {
    visit(tree, 'math', (node: GenericNode) => state.addTarget(node));
  }
  if (!opts.disableHeadingEnumeration) {
    visit(tree, 'heading', (node) => state.addTarget(node as GenericNode));
  }
  return tree;
};

export const resolveReferences = (state: State, tree: GenericParent) => {
  selectAll('link', tree).forEach((node: GenericNode) => {
    const reference = normalizeLabel(node.url);
    if (reference && reference.identifier in state.targets) {
      node.type = 'crossReference';
      node.kind = state.targets[reference.identifier].kind === TargetKind.math ? 'eq' : 'ref';
      node.identifier = reference.identifier;
      node.label = reference.label;
      delete node.url;
    }
  });
  visit(tree, 'crossReference', (node: GenericNode) => {
    state.resolveReferenceContent(node);
  });
};
