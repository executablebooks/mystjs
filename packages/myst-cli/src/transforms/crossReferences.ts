import type { VFile } from 'vfile';
import { selectAll } from 'unist-util-select';
import type { FrontmatterParts, GenericNode, GenericParent, References } from 'myst-common';
import { RuleId, fileWarn, plural, selectMdastNodes } from 'myst-common';
import { computeHash, tic } from 'myst-cli-utils';
import { addChildrenFromTargetNode } from 'myst-transforms';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { CrossReference, Dependency, Link, SourceFileKind } from 'myst-spec-ext';
import type { ISession } from '../session/types.js';
import { loadFromCache, writeToCache } from '../session/cache.js';
import type { SiteAction, SiteExport } from 'myst-config';

export const XREF_MAX_AGE = 1; // in days

function mystDataFilename(dataUrl: string) {
  return `myst-${computeHash(dataUrl)}.json`;
}

export type MystData = {
  kind?: SourceFileKind;
  sha256?: string;
  slug?: string;
  location?: string;
  dependencies?: Dependency[];
  frontmatter?: Omit<PageFrontmatter, 'downloads' | 'exports' | 'parts'> & {
    downloads?: SiteAction[];
    exports?: [{ format: string; filename: string; url: string }, ...SiteExport[]];
    parts?: FrontmatterParts;
  };
  widgets?: Record<string, any>;
  mdast?: GenericParent;
  references?: References;
};

async function fetchMystData(
  session: ISession,
  dataUrl: string | undefined,
  urlSource: string | undefined,
  vfile: VFile,
) {
  let note: string;
  if (dataUrl) {
    const filename = mystDataFilename(dataUrl);
    const cacheData = loadFromCache(session, filename, { maxAge: XREF_MAX_AGE });
    if (cacheData) {
      return JSON.parse(cacheData) as MystData;
    }
    try {
      const resp = await session.fetch(dataUrl);
      if (resp.ok) {
        const data = (await resp.json()) as MystData;
        writeToCache(session, filename, JSON.stringify(data));
        return data;
      }
    } catch {
      // data is unset
    }
    note = 'Could not load data from external project';
  } else {
    note = 'Data source URL unavailable';
  }
  fileWarn(
    vfile,
    `Unable to resolve link text from external MyST reference: ${urlSource ?? dataUrl ?? ''}`,
    {
      ruleId: RuleId.mystLinkValid,
      note,
    },
  );
  return;
}

export async function fetchMystLinkData(session: ISession, node: Link, vfile: VFile) {
  return fetchMystData(session, node.dataUrl, node.urlSource, vfile);
}

export async function fetchMystXRefData(session: ISession, node: CrossReference, vfile: VFile) {
  let dataUrl: string | undefined;
  if (node.remoteBaseUrl && node.dataUrl) {
    dataUrl = `${node.remoteBaseUrl}${node.dataUrl}`;
  }
  return fetchMystData(session, dataUrl, node.urlSource, vfile);
}

export function nodesFromMystXRefData(
  data: MystData,
  identifier: string,
  vfile: VFile,
  opts?: {
    maxNodes?: number;
    urlSource?: string;
  },
) {
  let targetNodes: GenericNode[] | undefined;
  [data, ...Object.values(data.frontmatter?.parts ?? {})].forEach(({ mdast }) => {
    if (!mdast || targetNodes?.length) return;
    targetNodes = selectMdastNodes(mdast, identifier, opts?.maxNodes).nodes;
  });
  if (!targetNodes?.length) {
    fileWarn(vfile, `Unable to resolve content from external MyST reference: ${opts?.urlSource}`, {
      ruleId: RuleId.mystLinkValid,
      note: `Could not locate identifier ${identifier} in page content`,
    });
    return;
  }
  return targetNodes;
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
      if (!node.identifier) {
        // Page references without specific node identifier
        const data = await fetchMystLinkData(session, node as Link, vfile);
        if (!data) return;
        node.children = [{ type: 'text', value: data.frontmatter?.title ?? data.slug ?? '' }];
      } else {
        const data = await fetchMystXRefData(session, node as CrossReference, vfile);
        if (!data) return;
        const targets = nodesFromMystXRefData(data, node.identifier, vfile, {
          urlSource: node.urlSource,
          maxNodes: 1,
        });
        if (targets?.length) {
          addChildrenFromTargetNode(
            node as any,
            targets[0] as any,
            frontmatter.numbering,
            vfile,
            frontmatter.numbering?.title?.offset,
          );
        }
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
