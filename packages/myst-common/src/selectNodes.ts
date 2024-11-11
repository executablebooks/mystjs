import { selectAll } from 'unist-util-select';
import { EXIT, SKIP, visit } from 'unist-util-visit';
import type { GenericNode, GenericParent } from './types.js';
import escape from 'css.escape';

/**
 * Determine if node with `identifier` should be considered a target
 *
 * TODO: `identifier` on these non-target should be updated to `target`
 * Doing so will make this function obsolete
 *
 * This function only returns false if node `type` equals one of:
 * crossReferences, citations, footnoteDefinition, and footnoteReference.
 *
 * It does not actually check if the node has `identifier`.
 */
export function isTargetIdentifierNode(node: { type: string }) {
  const nonTargetTypes = ['crossReference', 'cite', 'footnoteDefinition', 'footnoteReference'];
  return !nonTargetTypes.includes(node.type);
}

const hiddenNodes = new Set(['comment', 'mystComment']);

function selectHeadingNodes(mdast: GenericParent, identifier: string, maxNodes?: number) {
  let begin = false;
  let htmlId: string | undefined = undefined;
  const nodes: GenericNode[] = [];
  visit(mdast, (node) => {
    if ((begin && node.type === 'heading') || (maxNodes && nodes.length >= maxNodes)) {
      return EXIT;
    }
    if (node.identifier === identifier && node.type === 'heading') {
      begin = true;
      htmlId = node.html_id || node.identifier;
    }
    if (begin) {
      if (!hiddenNodes.has(node.type)) nodes.push(node);
      return SKIP; // Don't traverse the children
    }
  });
  return { htmlId, nodes };
}

function selectDefinitionTerm(mdast: GenericParent, identifier: string, maxNodes?: number) {
  let begin = false;
  const nodes: GenericNode[] = [];
  visit(mdast, (node) => {
    if (begin && node.type === 'definitionTerm') {
      if (nodes.length > 1) return EXIT;
    } else if (begin && node.type !== 'definitionDescription') {
      return EXIT;
    }
    if (node.identifier === identifier && node.type === 'definitionTerm') {
      nodes.push(node);
      begin = true;
    }
    if (begin) {
      if (node.type === 'definitionDescription') nodes.push(node);
      return SKIP; // Don't traverse the children
    }
  });
  return {
    htmlId: nodes?.[0]?.html_id || nodes?.[0]?.identifier,
    nodes: [{ type: 'definitionList', key: 'dl', children: nodes.slice(0, maxNodes) }],
  };
}

/**
 * Select target node, given identifier and mdast
 *
 * If identifier resolves to "heading" node, this will return the heading node and all
 * subsequent nodes up to the next heading, unless `maxNodes` is specified - then
 * it will only return up to that many nodes.
 *
 * If identifier resolves to "definitionTerm" node, this will return a single
 * "definitionList" node that wraps the "definitionTerm" node and any
 * subsequent "definitionDescription" node(s). The `maxNodes` value will still
 * apply here if specified.
 *
 * For all other target node types, this will only return the single target node.
 */
export function selectMdastNodes(
  mdast: GenericParent,
  identifier: string,
  maxNodes?: number,
): { htmlId?: string; nodes: GenericNode[] } {
  if (maxNodes === 0) return { nodes: [] };
  // Select the first identifier that is not a crossReference or citation
  const escapedIdentifier = escape(identifier);
  const node = selectAll(
    `[identifier=${escapedIdentifier}],[key=${escapedIdentifier}]`,
    mdast,
  ).find((n) => isTargetIdentifierNode(n)) as GenericNode | undefined;
  if (!node) return { nodes: [] };
  switch (node.type) {
    case 'heading':
      return selectHeadingNodes(mdast, identifier, maxNodes);
    case 'definitionTerm':
      return selectDefinitionTerm(mdast, identifier, maxNodes);
    default:
      return { htmlId: node.html_id || node.identifier, nodes: [node] };
  }
}
