import type { Parent } from 'mdast';
import type { Outputs as Outputs2, Output as Output2 } from '../types/v2.js';
import type { Output as Output1 } from '../types/v1.js';
import { visit, SKIP } from 'unist-util-visit';
import { squeeze } from '../utils.js';

export function upgrade(ast: Parent) {
  visit(ast as any, 'output', (node: Output1, index: number | null, parent: Parent | null) => {
    // We can only correlate output children with the IOutput objects if there's only one IOutput
    // Additionally, there may be placeholders that need to be removed
    const children = node.data?.length === 1 ? [...((node.children ?? []) as any[])] : [];
    const placeholders = children.filter((child) => !!child.placeholder);
    const notPlaceholders = children.filter((child) => !child.placeholder);

    const outputsChildren = (node.data ?? []).map((outputData) => {
      const result: Output2 = {
        type: 'output',
        jupyter_data: outputData,
        children: notPlaceholders, // FIXME: ignoring children here
      };
      notPlaceholders.length = 0;
      return result;
    });

    // Restore placeholders at the end
    outputsChildren.push(...placeholders);

    const { visibility, identifier, label, html_id, id } = node;

    // Nest `output` under `outputs` (1)
    const outputs: Outputs2 = {
      type: 'outputs',
      children: outputsChildren as Parent[],
      // Lift `Output.visibility` to `Outputs` (3)
      visibility,
      // Lift `Output.identifier` and `Output.html_id` to `Outputs` (2)
      identifier,
      html_id,
      label,
      id,
    };
    squeeze(outputs);
    if (parent) {
      parent.children[index!] = outputs as any;
    }
    return SKIP;
  });
}
