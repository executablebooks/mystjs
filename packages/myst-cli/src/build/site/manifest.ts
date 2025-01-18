import fs from 'node:fs';
import path from 'node:path';
import { hashAndCopyStaticFile } from 'myst-cli-utils';
import { RuleId, TemplateOptionType } from 'myst-common';
import type { SiteAction, SiteExport, SiteManifest } from 'myst-config';
import type { Download } from 'myst-frontmatter';
import {
  EXT_TO_FORMAT,
  ExportFormats,
  PROJECT_FRONTMATTER_KEYS,
  SITE_FRONTMATTER_KEYS,
} from 'myst-frontmatter';
import type MystTemplate from 'myst-templates';
import { filterKeys } from 'simple-validators';
import { resolveToAbsolute } from '../../config.js';
import type { ISession } from '../../session/types.js';
import type { RootState } from '../../store/index.js';
import { selectors } from '../../store/index.js';
import { transformBanner, transformThumbnail } from '../../transforms/images.js';
import { addWarningForFile } from '../../utils/addWarningForFile.js';
import { fileTitle } from '../../utils/fileInfo.js';
import { resolveFrontmatterParts } from '../../utils/resolveFrontmatterParts.js';
import version from '../../version.js';
import { getSiteTemplate } from './template.js';
import { collectExportOptions } from '../utils/collectExportOptions.js';
import { filterPages } from '../../project/load.js';
import { getRawFrontmatterFromFile } from '../../process/file.js';
import { castSession } from '../../session/cache.js';

type ManifestProject = Required<SiteManifest>['projects'][0];

export async function resolvePageExports(session: ISession, file: string): Promise<SiteExport[]> {
  const exports = (
    await collectExportOptions(
      session,
      [file],
      [
        ExportFormats.docx,
        ExportFormats.pdf,
        ExportFormats.tex,
        ExportFormats.typst,
        ExportFormats.xml,
        ExportFormats.meca,
      ],
      {},
    )
  )
    .filter((exp) => {
      return ['.docx', '.pdf', '.zip', '.xml'].includes(path.extname(exp.output));
    })
    .filter((exp) => {
      return fs.existsSync(exp.output);
    });
  const exportsAsDownloads = exports.map((exp) => {
    const { format, output } = exp;
    const fileHash = hashAndCopyStaticFile(session, output, session.publicPath(), (m: string) => {
      addWarningForFile(session, file, m, 'error', {
        ruleId: RuleId.exportFileCopied,
      });
    });
    return { format, filename: path.basename(output), url: `/${fileHash}` };
  });
  return exportsAsDownloads;
}

export async function resolvePageDownloads(
  session: ISession,
  file: string,
  projectPath?: string,
): Promise<SiteAction[] | undefined> {
  const state = session.store.getState();
  if (!projectPath) {
    projectPath = selectors.selectCurrentProjectPath(state);
  }
  const project = projectPath
    ? selectors.selectLocalProject(session.store.getState(), projectPath)
    : undefined;
  const files = project ? filterPages(project).map((page) => page.file) : [file];
  const allExports = await collectExportOptions(session, files, [...Object.values(ExportFormats)], {
    projectPath,
  });
  const expLookup: Record<string, { format: ExportFormats; output: string }> = {};
  allExports.forEach((exp) => {
    if (exp.id) expLookup[exp.id] = exp;
  });
  const pageFrontmatter = await getRawFrontmatterFromFile(session, file, projectPath);
  const resolvedDownloads = pageFrontmatter?.downloads
    ?.map((download): SiteAction | undefined => {
      if (download.id && !expLookup[download.id]) {
        addWarningForFile(
          session,
          file,
          `Unable to locate download file by export id "${download.id}"`,
          'error',
          {
            ruleId: RuleId.exportFileCopied,
          },
        );
        return undefined;
      }
      const idOrUrl = download.id ?? download.url;
      // Validation will catch this earlier
      if (!idOrUrl) return undefined;
      const exp = expLookup[idOrUrl];
      if (exp) {
        download.format = exp.format;
        download.url = exp.output;
        download.static = true;
      }
      if (!download.url) return undefined;
      return resolveSiteAction(session, download as SiteAction, file, 'downloads');
    })
    .filter((download): download is SiteAction => !!download);
  return resolvedDownloads;
}

/**
 * Convert local project representation to site manifest project
 *
 * This does a couple things:
 * - Adds projectSlug (which locally comes from site config)
 * - Removes any local file references
 * - Adds validated frontmatter
 * - Writes and transforms banner and thumbnail images
 */
export async function localToManifestProject(
  session: ISession,
  projectPath?: string,
  projectSlug?: string,
): Promise<ManifestProject | null> {
  if (!projectPath) return null;
  const state = session.store.getState();
  const projConfig = selectors.selectLocalProjectConfig(state, projectPath);
  const proj = selectors.selectLocalProject(state, projectPath);
  if (!proj) return null;
  // Update all of the page title to the frontmatter title
  const { index, file: indexFile } = proj;
  const projectFileInfo = selectors.selectFileInfo(state, proj.file);
  const projectTitle = projConfig?.title || projectFileInfo.title || proj.index;
  const cache = castSession(session);
  const pages = await Promise.all(
    proj.pages.map(async (page) => {
      if ('file' in page) {
        const fileInfo = selectors.selectFileInfo(state, page.file);
        const title = fileInfo.title || fileTitle(page.file);
        const short_title = fileInfo.short_title ?? undefined;
        const description = fileInfo.description ?? '';
        const thumbnail = fileInfo.thumbnail ?? '';
        const thumbnailOptimized = fileInfo.thumbnailOptimized ?? '';
        const banner = fileInfo.banner ?? '';
        const bannerOptimized = fileInfo.bannerOptimized ?? '';
        const date = fileInfo.date ?? '';
        const tags = fileInfo.tags ?? [];
        const { slug, level, file } = page;
        const { frontmatter } = cache.$getMdast(file)?.post ?? {};
        const projectPage: ManifestProject['pages'][0] = {
          slug,
          title,
          short_title,
          description,
          date,
          thumbnail,
          thumbnailOptimized,
          banner,
          bannerOptimized,
          tags,
          level,
          enumerator: frontmatter?.enumerator,
        };
        return projectPage;
      }
      return { ...page };
    }),
  );

  const projFrontmatter = projConfig ? filterKeys(projConfig, PROJECT_FRONTMATTER_KEYS) : {};
  const projConfigFile = selectors.selectLocalConfigFile(state, projectPath);
  const exports = projConfigFile ? await resolvePageExports(session, projConfigFile) : [];
  const downloads = projConfigFile
    ? await resolvePageDownloads(session, projConfigFile, projectPath)
    : undefined;
  const parts = resolveFrontmatterParts(session, projFrontmatter);
  const banner = await transformBanner(
    session,
    path.join(projectPath, 'myst.yml'),
    projFrontmatter,
    session.publicPath(),
    { altOutputFolder: '/', webp: true },
  );
  const thumbnail = await transformThumbnail(
    session,
    null,
    path.join(projectPath, 'myst.yml'),
    projFrontmatter,
    session.publicPath(),
    { altOutputFolder: '/', webp: true },
  );
  const { frontmatter } = cache.$getMdast(indexFile)?.post ?? {};
  return {
    ...projFrontmatter,
    // TODO: a null in the project frontmatter should not fall back to index page
    thumbnail: thumbnail?.url || projectFileInfo.thumbnail,
    thumbnailOptimized:
      thumbnail?.urlOptimized ||
      // Do not fall back to optimized page thumbnail if unoptimized project thumbnail exists
      (thumbnail?.url ? undefined : projectFileInfo.thumbnailOptimized) ||
      undefined,
    banner: banner?.url || projectFileInfo.banner,
    bannerOptimized:
      banner?.urlOptimized ||
      (banner?.url ? undefined : projectFileInfo.bannerOptimized) ||
      undefined,
    exports,
    downloads,
    parts,
    bibliography: projFrontmatter.bibliography || [],
    title: projectTitle || 'Untitled',
    slug: projectSlug,
    index,
    enumerator: frontmatter?.enumerator,
    pages,
  };
}

async function resolveTemplateFileOptions(
  session: ISession,
  mystTemplate: MystTemplate,
  options: Record<string, any>,
) {
  const resolvedOptions = { ...options };
  await Promise.all(
    (mystTemplate.getValidatedTemplateYml().options ?? []).map(async (option) => {
      if (option.type === TemplateOptionType.file && options[option.id]) {
        const configPath = selectors.selectCurrentSitePath(session.store.getState());
        const absPath = configPath
          ? await resolveToAbsolute(session, configPath, options[option.id], { allowRemote: true })
          : options[option.id];
        const fileHash = hashAndCopyStaticFile(
          session,
          absPath,
          session.publicPath(),
          (m: string) => {
            addWarningForFile(session, options[option.id], m, 'error', {
              ruleId: RuleId.templateFileCopied,
            });
          },
        );
        resolvedOptions[option.id] = `/${fileHash}`;
      }
    }),
  );
  return resolvedOptions;
}

function isInternalUrl(value: string) {
  return !!value.match('^(/[a-zA-Z0-9._-]+)+$');
}

function isUrl(value: string) {
  // Allow simple relative path in project
  if (isInternalUrl(value)) return true;
  try {
    new URL(value);
  } catch {
    return false;
  }
  return true;
}

/**
 * Resolves Site Action, including hashing and copying static files
 *
 * Infers `static: true` if url is an existing local file
 */
function resolveSiteAction(
  session: ISession,
  action: SiteAction | (Download & { url: string }),
  file: string,
  property: string,
): SiteAction | undefined {
  const title = action.title;
  if (action.static === false) {
    if (!title) {
      addWarningForFile(
        session,
        file,
        `"title" is required for resource "${action.url}" in ${property}`,
        'error',
      );
      return undefined;
    }
    return {
      title,
      url: action.url,
      filename: action.filename,
      format: action.format,
      internal: isInternalUrl(action.url),
      static: false,
    };
  }
  const resolvedFile = path.resolve(path.dirname(file), action.url);
  // Cases where url does not exist as a local file
  if (!fs.existsSync(resolvedFile)) {
    if (action.static) {
      addWarningForFile(
        session,
        file,
        `Could not find static resource at "${action.url}" in ${property}`,
        'error',
        { ruleId: RuleId.staticActionFileCopied },
      );
      return undefined;
    }
    if (!isUrl(action.url)) {
      addWarningForFile(
        session,
        file,
        `Resource "${action.url}" in ${property} should be a URL or path to static file`,
        'error',
      );
      return undefined;
    }
    if (!title) {
      addWarningForFile(
        session,
        file,
        `"title" is required for resource "${action.url}" in ${property}`,
        'error',
      );
      return undefined;
    }
    return {
      title,
      url: action.url,
      filename: action.filename,
      format: action.format,
      internal: isInternalUrl(action.url),
      static: false,
    };
  }
  if (!action.static && isUrl(action.url)) {
    // Unlikely case where url is both an existing local file and a valid URL
    addWarningForFile(
      session,
      file,
      `Linking resource "${action.url}" in ${property} to static file; to mark this as a URL instead, use 'static: false'`,
    );
  }
  const fileHash = hashAndCopyStaticFile(
    session,
    resolvedFile,
    session.publicPath(),
    (m: string) => {
      addWarningForFile(session, resolvedFile, m, 'error', {
        ruleId: RuleId.staticActionFileCopied,
      });
    },
  );
  if (!title) {
    addWarningForFile(
      session,
      file,
      `using filename for title of resource "${action.url}" in ${property}`,
    );
  }
  const filename = action.filename ?? path.basename(resolvedFile);
  return {
    title: action.title ?? filename,
    url: `/${fileHash}`,
    filename,
    format: action.format ?? EXT_TO_FORMAT[path.extname(resolvedFile)],
    static: true,
  };
}

export type SiteManifestOptions = {
  defaultTemplate?: string;
};

/**
 * Build site manifest from local redux state
 *
 * Site manifest acts as the configuration to build the website.
 * It combines local site config and project configs into a single structure.
 */
export async function getSiteManifest(
  session: ISession,
  opts?: SiteManifestOptions,
): Promise<SiteManifest> {
  const state = session.store.getState() as RootState;
  const siteConfig = selectors.selectCurrentSiteConfig(state);
  const siteConfigFile = selectors.selectCurrentSiteFile(state);
  if (!siteConfig || !siteConfigFile) throw Error('no site config defined');
  const siteProjects: ManifestProject[] = (
    await Promise.all(
      siteConfig.projects?.map(async (p) => localToManifestProject(session, p.path, p.slug)) ?? [],
    )
  ).filter((p): p is ManifestProject => !!p);
  const { nav } = siteConfig;
  const actions = siteConfig.actions
    ?.map((action) => resolveSiteAction(session, action, siteConfigFile, 'actions'))
    .filter((action): action is SiteAction => !!action);
  const siteFrontmatter = filterKeys(siteConfig as Record<string, any>, SITE_FRONTMATTER_KEYS);
  const mystTemplate = await getSiteTemplate(session, opts);
  const validatedOptions = mystTemplate.validateOptions(
    siteFrontmatter.options ?? {},
    siteConfigFile,
    { allowRemote: true },
  );
  const validatedFrontmatter = mystTemplate.validateDoc(
    siteFrontmatter,
    validatedOptions,
    undefined,
    siteConfigFile,
  );
  const resolvedOptions = await resolveTemplateFileOptions(session, mystTemplate, validatedOptions);
  validatedFrontmatter.options = resolvedOptions;
  const parts = resolveFrontmatterParts(session, validatedFrontmatter);
  const manifest: SiteManifest = {
    ...validatedFrontmatter,
    parts,
    myst: version,
    nav: nav || [],
    actions: actions || [],
    projects: siteProjects,
  };
  return manifest;
}
