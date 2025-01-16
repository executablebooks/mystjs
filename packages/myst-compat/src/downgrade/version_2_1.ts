import type { Parent, Literal } from 'mdast';
import type { Outputs as Outputs2, Output as Output2 } from '../types/v2.js';
import type { Output as Output1 } from '../types/v1.js';
import { visit, SKIP } from 'unist-util-visit';
import { squeeze } from '../utils.js';

export function downgrade(ast: Parent) {
  visit(ast as any, 'outputs', (node: Outputs2, index: number | null, parent: Parent | null) => {
    const { label, identifier, html_id, id, visibility } = node;

    const outputsChildren = node.children as (Parent | Literal)[];
    const data = outputsChildren
      .filter((output) => output.type === 'output')
      .map((output: any) => output.jupyter_data)
      .filter((datum) => !!datum);

    const placeholders = outputsChildren.filter((child: any) => !!child.placeholder);
    const notPlaceholders = outputsChildren.filter((child: any) => !child.placeholder);
    const children = notPlaceholders.map((output) => (output as Output2).children ?? []).flat();
    children.push(...placeholders);

    const nextOutput: Output1 = {
      type: 'output',
      data,
      children,
      html_id,
      label,
      identifier,
      id,
      visibility,
      _future_ast: structuredClone(node),
    };
    // Drop any undefined members (assume all members are optional if undefined)
    squeeze(nextOutput);

    if (parent) {
      parent.children[index!] = nextOutput as any;
    }
    return SKIP;
  });
}
