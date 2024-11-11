import { dump as dumpYAML } from 'js-yaml';
import type { Handle } from 'mdast-util-to-markdown';
import { RuleId, fileError } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { simplifyLicenses } from 'myst-frontmatter';
import type { Root } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import type { NestedKinds, NestedLevels, NestedState, Validator } from './types.js';

type Kind = keyof NestedKinds;

function initializeNestedLevel(state: NestedState) {
  if (!state.nestedLevels) state.nestedLevels = { role: 0, directive: 0 };
  if (!state.nestedMaxLevels) state.nestedMaxLevels = { role: 0, directive: 0 };
  return state as NestedLevels;
}

export function incrementNestedLevel(kind: Kind, state: NestedState, value?: number) {
  const inc = value ?? 1;
  const $state = initializeNestedLevel(state);
  $state.nestedLevels[kind] += inc;
  if ($state.nestedLevels[kind] > $state.nestedMaxLevels[kind]) {
    $state.nestedMaxLevels[kind] = $state.nestedLevels[kind];
  }
}

export function popNestedLevel(kind: Kind, state: NestedState, value?: number) {
  const dec = value ?? 1;
  const $state = initializeNestedLevel(state);
  const nesting = $state.nestedMaxLevels[kind] - $state.nestedLevels[kind];
  $state.nestedLevels[kind] -= dec;
  if ($state.nestedLevels[kind] < 0) $state.nestedLevels[kind] = 0;
  if (!$state.nestedLevels[kind]) $state.nestedMaxLevels[kind] = 0;
  return nesting;
}

/**
 * Create a mdast-to-markdown handler for all unsupported node types
 *
 * This is then able to log an error rather than throwing.
 */
export function unsupportedHandlers(tree: Root, supported: string[], file: VFile) {
  const handlers: Record<string, Handle> = {};
  selectAll('*', tree).forEach((node) => {
    const { type } = node;
    if (supported.includes(type)) return;
    handlers[type] = (n: any): string => {
      fileError(file, `Unsupported node type: ${type}`, {
        node: n,
        source: 'myst-to-md',
        ruleId: RuleId.mdRenders,
      });
      return '';
    };
  });
  return handlers;
}

/**
 * Run tree validation functions for specified node types
 *
 * This validation is separate from the mdast-to-markdown handlers so it may
 * log errors to vfile. Then, handlers can take into account the validated structure.
 */
export function runValidators(tree: Root, validators: Record<string, Validator>, file: VFile) {
  Object.entries(validators).forEach(([key, validator]) => {
    selectAll(key, tree).forEach((node) => {
      validator(node, file);
    });
  });
}

/**
 * Add frontmatter to the beginning of markdown content as yaml
 *
 * If no frontmatter is provided, the markdown content is returned as-is.
 * Frontmatter is not validated, and the only coercion is reducing license to a
 * string rather than structured object.
 */
export function addFrontmatter(page: string, frontmatter?: PageFrontmatter) {
  if (!frontmatter || !Object.keys(frontmatter).length) return page;
  const fm = frontmatter.license
    ? { ...frontmatter, license: simplifyLicenses(frontmatter.license) }
    : { ...frontmatter };
  return `---\n${dumpYAML(fm)}---\n${page}`;
}
