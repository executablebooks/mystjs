import { getFrontmatter } from 'myst-transforms';
import type { Export, Licenses, PageFrontmatter } from 'myst-frontmatter';
import {
  validateExportsList,
  fillPageFrontmatter,
  simplifyLicenses,
  unnestKernelSpec,
  validatePageFrontmatter,
} from 'myst-frontmatter';
import type { GenericParent } from 'myst-common';
import { fileError, fileWarn, normalizeLabel, RuleId } from 'myst-common';
import type { ValidationOptions } from 'simple-validators';
import { VFile } from 'vfile';
import type { ISession } from './session/types.js';
import { selectors, watch } from './store/index.js';
import { logMessagesFromVFile } from './utils/logging.js';
import { castSession } from './session/cache.js';
import type { FileOptions } from 'myst-templates';

export function frontmatterValidationOpts(
  vfile: VFile,
  opts?: { property?: string; ruleId?: RuleId },
): ValidationOptions {
  return {
    property: opts?.property ?? 'frontmatter',
    file: vfile.path,
    messages: {},
    errorLogFn: (message: string) => {
      fileError(vfile, message, { ruleId: opts?.ruleId ?? RuleId.validPageFrontmatter });
    },
    warningLogFn: (message: string) => {
      fileWarn(vfile, message, { ruleId: opts?.ruleId ?? RuleId.validPageFrontmatter });
    },
  };
}
/**
 * Get page frontmatter from mdast tree
 *
 * @param session
 * @param tree - mdast tree already loaded
 * @param vfile - vfile used for logging
 * @param preFrontmatter - incoming frontmatter for the page that is not from the project or in the tree
 * @param keepTitleNode - do not remove leading H1 even if it is lifted as title
 */
export function getPageFrontmatter(
  session: ISession,
  tree: GenericParent,
  vfile: VFile,
  preFrontmatter?: Record<string, any>,
  keepTitleNode?: boolean,
): { frontmatter: PageFrontmatter; identifiers: string[] } {
  const { frontmatter: rawPageFrontmatter, identifiers } = getFrontmatter(vfile, tree, {
    propagateTargets: true,
    preFrontmatter,
    keepTitleNode,
  });
  unnestKernelSpec(rawPageFrontmatter);
  const pageFrontmatter = validatePageFrontmatter(
    rawPageFrontmatter,
    frontmatterValidationOpts(vfile),
  );
  if (pageFrontmatter.label) {
    const { identifier } = normalizeLabel(pageFrontmatter.label) ?? {};
    if (identifier) identifiers.push(identifier);
  }
  logMessagesFromVFile(session, vfile);
  return { frontmatter: pageFrontmatter, identifiers };
}

export function processPageFrontmatter(
  session: ISession,
  pageFrontmatter: PageFrontmatter,
  validationOpts: ValidationOptions,
  path?: string,
) {
  const cache = castSession(session);
  const state = session.store.getState();
  const siteFrontmatter = selectors.selectCurrentSiteConfig(state) ?? {};
  const projectFrontmatter = path ? (selectors.selectLocalProjectConfig(state, path) ?? {}) : {};

  const frontmatter = fillPageFrontmatter(pageFrontmatter, projectFrontmatter, validationOpts);
  const siteTemplate = cache.$siteTemplate;
  if (siteTemplate) {
    const siteOptions = siteTemplate.validateOptions(pageFrontmatter.site ?? {}, path, {
      // The property is different on the page vs the myst.yml
      property: 'site',
      // Passing in the log files ensures this isn't prefixed with `myst.yml`.
      warningLogFn: session.log.warn,
      errorLogFn: session.log.error,
    } as ValidationOptions & FileOptions);
    if (siteOptions && Object.keys(siteOptions).length > 0) frontmatter.site = siteOptions;
  } else {
    // The options are still there, they are just not validated
    session.log.debug(`Site template not available to validate site frontmatter in ${path}`);
  }

  if (siteFrontmatter?.options?.hide_authors || siteFrontmatter?.options?.design?.hide_authors) {
    delete frontmatter.authors;
  }
  return frontmatter;
}

export function prepareToWrite(frontmatter: { license?: Licenses }) {
  if (!frontmatter.license) return { ...frontmatter };
  return { ...frontmatter, license: simplifyLicenses(frontmatter.license) };
}

export function getExportListFromRawFrontmatter(
  session: ISession,
  rawFrontmatter: Record<string, any> | undefined,
  file: string,
): Export[] {
  const vfile = new VFile();
  vfile.path = file;
  const exports = validateExportsList(
    rawFrontmatter?.exports ?? rawFrontmatter?.export,
    frontmatterValidationOpts(vfile, {
      property: 'exports',
      ruleId: RuleId.validFrontmatterExportList,
    }),
  );
  logMessagesFromVFile(session, vfile);
  return exports ?? [];
}

export function updateFileInfoFromFrontmatter(
  session: ISession,
  file: string,
  frontmatter: PageFrontmatter,
  url?: string,
  dataUrl?: string,
) {
  session.store.dispatch(
    watch.actions.updateFileInfo({
      path: file,
      title: frontmatter.title,
      short_title: frontmatter.short_title,
      description: frontmatter.description,
      date: frontmatter.date,
      thumbnail: frontmatter.thumbnail,
      thumbnailOptimized: frontmatter.thumbnailOptimized,
      banner: frontmatter.banner,
      bannerOptimized: frontmatter.bannerOptimized,
      tags: frontmatter.tags,
      url,
      dataUrl,
    }),
  );
}
