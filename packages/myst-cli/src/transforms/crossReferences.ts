import type { VFile } from 'vfile';
import { selectAll } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';
import { RuleId, fileWarn, plural } from 'myst-common';
import { tic } from 'myst-cli-utils';
import { addChildrenFromTargetNode } from 'myst-transforms';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { ISession } from '../session/types.js';
import type { RendererData } from './types.js';

export async function fetchMystXRefData(dataUrl: string, label: string, vfile: VFile) {
  try {
    const resp = await fetch(dataUrl);
    if (resp.ok) {
      const data: RendererData = await resp.json();
      return data;
    }
  } catch {
    // data is unset
  }
  fileWarn(vfile, `Unable to resolve link text from external MyST reference: ${label}`, {
    ruleId: RuleId.mystLinkValid,
    note: 'Could not load data from external project',
  });
  return;
}

export function nodeFromMystXRefData(
  identifier: string,
  data: RendererData,
  label: string,
  vfile: VFile,
) {
  const targets = selectAll(`[identifier=${identifier}]`, data.mdast) as GenericNode[];
  // Ignore nodes with `identifier` that are not actually the target.
  // TODO: migrate `identifier` on these node types to `target`
  const target = targets.find((t) => {
    return !['crossReference', 'cite', 'footnoteDefinition', 'footnoteReference'].includes(t.type);
  });
  if (!target) {
    fileWarn(vfile, `Unable to resolve link text from external MyST reference: ${label}`, {
      ruleId: RuleId.mystLinkValid,
      note: `Could not locate identifier ${identifier} in page content`,
    });
    return;
  }
  return target;
}

/**
 * Load external MyST project data to update link text for MyST xrefs
 */
export async function transformMystXRefs(
  session: ISession,
  vfile: VFile,
  mdast: GenericParent,
  frontmatter: PageFrontmatter,
) {
  const toc = tic();
  const nodes = selectAll('link,crossReference', mdast)
    .filter((node: GenericNode) => {
      // Only handle MyST xrefs
      return node.protocol === 'xref:myst' && node.dataUrl;
    })
    .filter((node: GenericNode) => {
      // If no link text, load the target to compute children
      if (!node.children?.length) return true;
      // If `identifier` is present, we may need to update existing children (e.g. enumerator)
      return !!node.identifier;
    });
  if (nodes.length === 0) return;
  session.log.debug(`Updating link text for ${plural('%s external MyST reference(s)', nodes)}`);
  let number = 0;
  await Promise.all([
    ...nodes.map(async (node: GenericNode) => {
      const data = await fetchMystXRefData(node.dataUrl, node.urlSource, vfile);
      if (!data) return;
      if (!node.identifier) {
        // Page references without specific node identifier
        node.children = [{ type: 'text', value: data.frontmatter?.title ?? data.slug ?? '' }];
      } else {
        const target = nodeFromMystXRefData(node.identifier, data, node.urlSource, vfile);
        addChildrenFromTargetNode(node as any, target as any, frontmatter.numbering, vfile);
      }
      number += 1;
    }),
  ]);
  const denominator = number === nodes.length ? '' : `/${nodes.length}`;
  session.log.info(
    toc(
      `🪄  Updated link text for ${plural(`%s${denominator} external MyST reference(s)`, number)} in %s seconds`,
    ),
  );
}
