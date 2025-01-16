import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { tic } from 'myst-cli-utils';
import { TexParser } from 'tex-to-myst';
import { VFile } from 'vfile';
import { doi } from 'doi-utils';
import type { GenericParent } from 'myst-common';
import { RuleId, toText, fileError, fileWarn } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { validatePageFrontmatter, fillProjectFrontmatter } from 'myst-frontmatter';
import { SourceFileKind, VERSION } from 'myst-spec-ext';
import { frontmatterValidationOpts, getPageFrontmatter } from '../frontmatter.js';
import type { ISession, ISessionWithCache } from '../session/types.js';
import { castSession } from '../session/cache.js';
import { config, projects, warnings, watch } from '../store/reducers.js';
import type { PreRendererData, RendererData } from '../transforms/types.js';
import { makeCompatible } from 'myst-compat';
import { logMessagesFromVFile } from '../utils/logging.js';
import { isValidFile, parseFilePath } from '../utils/resolveExtension.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { loadBibTeXCitationRenderers } from './citations.js';
import { parseMyst } from './myst.js';
import { processNotebookFull } from './notebook.js';
import { selectors } from '../store/index.js';
import {
  defined,
  incrementOptions,
  validateObjectKeys,
  validateEnum,
  validateString,
} from 'simple-validators';
import type { ValidationOptions } from 'simple-validators';

type LoadFileOptions = {
  preFrontmatter?: Record<string, any>;
  keepTitleNode?: boolean;
  kind?: SourceFileKind;
};

export type LoadFileResult = {
  kind: SourceFileKind;
  mdast: GenericParent;
  frontmatter?: PageFrontmatter;
  identifiers?: string[];
  widgets?: Record<string, any>;
};

function checkCache(cache: ISessionWithCache, content: string, file: string) {
  const sha256 = createHash('sha256').update(content).digest('hex');
  cache.store.dispatch(watch.actions.markFileChanged({ path: file, sha256 }));
  const mdast = cache.$getMdast(file);
  const useCache = mdast?.pre && mdast.sha256 === sha256;
  return { useCache, sha256 };
}

export function loadMdFile(
  session: ISession,
  content: string,
  file: string,
  opts?: LoadFileOptions,
): LoadFileResult {
  const vfile = new VFile();
  vfile.path = file;
  const mdast = parseMyst(session, content, file);
  const { frontmatter, identifiers } = getPageFrontmatter(
    session,
    mdast,
    vfile,
    opts?.preFrontmatter,
    opts?.keepTitleNode,
  );
  return { kind: opts?.kind ?? SourceFileKind.Article, mdast, frontmatter, identifiers };
}

export async function loadNotebookFile(
  session: ISession,
  content: string,
  file: string,
  opts?: LoadFileOptions,
): Promise<LoadFileResult> {
  const vfile = new VFile();
  vfile.path = file;
  const {
    mdast,
    frontmatter: nbFrontmatter,
    widgets,
  } = await processNotebookFull(session, file, content);
  const { frontmatter: cellFrontmatter, identifiers } = getPageFrontmatter(
    session,
    mdast,
    vfile,
    opts?.preFrontmatter,
    opts?.keepTitleNode,
  );
  const frontmatter = fillProjectFrontmatter(
    cellFrontmatter,
    nbFrontmatter,
    frontmatterValidationOpts(vfile),
  );
  return { kind: opts?.kind ?? SourceFileKind.Notebook, mdast, frontmatter, identifiers, widgets };
}

export function loadTexFile(
  session: ISession,
  content: string,
  file: string,
  opts?: LoadFileOptions,
): LoadFileResult {
  const vfile = new VFile();
  vfile.path = file;
  const tex = new TexParser(content, vfile);
  const frontmatter = validatePageFrontmatter(
    {
      title: toText(tex.data.frontmatter.title as any),
      short_title: toText(tex.data.frontmatter.short_title as any),
      authors: tex.data.frontmatter.authors,
      // TODO: affiliations: tex.data.frontmatter.affiliations,
      keywords: tex.data.frontmatter.keywords,
      math: tex.data.macros,
      bibliography: tex.data.bibliography,
      ...(opts?.preFrontmatter ?? {}),
    },
    frontmatterValidationOpts(vfile),
  );
  logMessagesFromVFile(session, vfile);
  return {
    kind: opts?.kind ?? SourceFileKind.Article,
    mdast: tex.ast as GenericParent,
    frontmatter,
  };
}

export function mystJSONValidationOpts(
  vfile: VFile,
  opts?: { property?: string; ruleId?: RuleId },
): ValidationOptions {
  return {
    property: opts?.property ?? 'file',
    file: vfile.path,
    messages: {},
    errorLogFn: (message: string) => {
      fileError(vfile, message, { ruleId: opts?.ruleId ?? RuleId.mystJsonValid });
    },
    warningLogFn: (message: string) => {
      fileWarn(vfile, message, { ruleId: opts?.ruleId ?? RuleId.mystJsonValid });
    },
  };
}

function validateMySTJSON(
  input: any,
  opts: ValidationOptions,
):
  | { mdast: GenericParent; kind: SourceFileKind; frontmatter: PageFrontmatter; version: string }
  | undefined {
  const value = validateObjectKeys(
    input,
    { required: ['mdast'], optional: ['kind', 'frontmatter', 'version'] },
    opts,
  );
  if (value === undefined) {
    return undefined;
  }

  const { mdast } = value;

  // Check kind
  let kind: undefined | SourceFileKind;
  if (defined(value.kind)) {
    kind = validateEnum<SourceFileKind>(value.kind, {
      ...incrementOptions('kind', opts),
      enum: SourceFileKind,
    });
  }

  // Check frontmatter
  let frontmatter: undefined | PageFrontmatter;
  if (defined(value.frontmatter)) {
    frontmatter = validatePageFrontmatter(value.frontmatter, incrementOptions('frontmatter', opts));
  }

  let version: undefined | string;
  if (defined(value.version)) {
    version = validateString(value.version, incrementOptions('version', opts));
    // Need a valid version if given
    if (version === undefined) {
      return undefined;
    }
  }
  version = version ?? '1';

  // Ingest "legacy" mdast and upgrade it
  makeCompatible(version, '2', mdast);

  return {
    mdast,
    kind: kind ?? SourceFileKind.Article,
    frontmatter: frontmatter ?? {},
    version: version,
  };
}

export function loadMySTJSON(
  session: ISession,
  content: string,
  file: string,
  opts?: LoadFileOptions,
) {
  const vfile = new VFile();
  vfile.path = file;

  const rawData = JSON.parse(content);
  const result = validateMySTJSON(rawData, mystJSONValidationOpts(vfile));
  if (result === undefined) {
    logMessagesFromVFile(session, vfile);
    throw new Error('Unable to load JSON file: error during validation');
  } else {
    const { mdast, kind, frontmatter: pageFrontmatter } = result;
    const { frontmatter, identifiers } = getPageFrontmatter(
      session,
      mdast,
      vfile,
      { ...pageFrontmatter, ...opts?.preFrontmatter },
      opts?.keepTitleNode,
    );
    logMessagesFromVFile(session, vfile);
    return { mdast, kind: opts?.kind ?? kind, frontmatter, identifiers };
  }
}

function getLocation(file: string, projectPath?: string) {
  let location = file;
  if (projectPath) {
    location = `/${path.relative(projectPath, file)}`;
  }
  // ensure forward slashes and not windows backslashes
  return location.replaceAll('\\', '/');
}

/**
 * Attempt to load a file into the current session. Unsupported files with
 * issue a warning
 *
 * @param session session with logging
 * @param file path to file to load
 * @param projectPath path to project directory
 * @param extension pre-computed file extension
 * @param opts loading options
 *
 * @param opts.preFrontmatter raw page frontmatter, prioritized over frontmatter
 *     read from the file. Fields defined here will override fields defined
 *     in the file. Unlike project and page frontmatter which are carefully
 *     combined to maintain affiliations, keep all math macros, etc, this
 *     override simply replaces fields prior to any further processing or
 *     validation.
 */
export async function loadFile(
  session: ISession,
  file: string,
  projectPath?: string,
  extension?: '.md' | '.ipynb' | '.tex' | '.bib' | '.myst.json',
  opts?: LoadFileOptions,
): Promise<PreRendererData | undefined> {
  await session.loadPlugins();
  const toc = tic();
  session.store.dispatch(warnings.actions.clearWarnings({ file }));
  const cache = castSession(session);
  let success = true;
  let pre: PreRendererData | undefined;
  let successMessage: string | undefined;
  try {
    const content = fs.readFileSync(file).toString();
    const { sha256, useCache } = checkCache(cache, content, file);
    if (useCache) {
      successMessage = `loadFile: ${file} already loaded.`;
      pre = cache.$getMdast(file)?.pre;
    } else {
      const ext = extension || parseFilePath(file).ext.toLowerCase();
      let loadResult: LoadFileResult | undefined;
      switch (ext) {
        case '.md': {
          loadResult = loadMdFile(session, content, file, opts);
          break;
        }
        case '.ipynb': {
          loadResult = await loadNotebookFile(session, content, file, opts);
          break;
        }
        case '.tex': {
          loadResult = loadTexFile(session, content, file, opts);
          break;
        }
        case '.bib': {
          const renderers = await loadBibTeXCitationRenderers(session, file);
          cache.$citationRenderers[file] = renderers;
          Object.entries(renderers).forEach(([id, renderer]) => {
            const normalizedDOI = doi.normalize(renderer.getDOI())?.toLowerCase();
            if (!normalizedDOI || cache.$doiRenderers[normalizedDOI]) return;
            cache.$doiRenderers[normalizedDOI] = { id, render: renderer };
          });
          break;
        }
        case '.myst.json': {
          loadResult = loadMySTJSON(session, content, file);
          break;
        }
        default:
          addWarningForFile(session, file, 'Unrecognized extension', 'error', {
            ruleId: RuleId.mystFileLoads,
          });
          session.log.info(
            `"${file}": Please rerun the build with "-c" to ensure the built files are cleared.`,
          );
          success = false;
      }
      if (loadResult) {
        pre = { file, location: getLocation(file, projectPath), ...loadResult };
        cache.$setMdast(file, {
          sha256,
          pre,
        });
      }
    }
  } catch (error) {
    session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
    addWarningForFile(session, file, `Error reading file: ${error}`, 'error', {
      ruleId: RuleId.mystFileLoads,
    });
    success = false;
  }
  if (success) session.log.debug(successMessage ?? toc(`loadFile: loaded ${file} in %s.`));
  if (pre?.frontmatter) {
    pre.frontmatter.parts = await loadFrontmatterParts(
      session,
      file,
      'parts',
      pre.frontmatter,
      projectPath,
    );
  }
  return pre;
}

export async function loadFrontmatterParts(
  session: ISession,
  file: string,
  property: string,
  frontmatter: PageFrontmatter,
  projectPath?: string,
) {
  const { parts, ...pageFrontmatter } = frontmatter;
  const vfile = new VFile();
  vfile.path = file;
  const modifiedParts: [string, string[]][] = await Promise.all(
    Object.entries(parts ?? {}).map(async ([part, contents]) => {
      let partFile: string;
      if (contents.length === 1 && isValidFile(contents[0])) {
        partFile = path.resolve(path.dirname(file), contents[0]);
        if (!fs.existsSync(partFile)) {
          fileWarn(vfile, `Part file does not exist: ${partFile}`);
          return [part, contents];
        }
        await loadFile(session, partFile, projectPath, undefined, {
          kind: SourceFileKind.Part,
          /** Frontmatter from the source page is prioritized over frontmatter from the part file itself */
          preFrontmatter: pageFrontmatter,
        });
        session.store.dispatch(
          watch.actions.addLocalDependency({
            path: file,
            dependency: partFile,
          }),
        );
        const proj = selectors.selectLocalProject(session.store.getState(), projectPath ?? '.');
        if (proj?.index === partFile) {
          fileWarn(vfile, `index file is also used as a part: ${partFile}`);
        } else if (proj) {
          const filteredPages = proj.pages.filter((page) => {
            const { file: pageFile, implicit } = page as any;
            if (!pageFile) return true;
            if (pageFile !== partFile) return true;
            if (!implicit) {
              fileWarn(vfile, `project file is also used as a part: ${partFile}`);
            }
            return !implicit;
          });
          const newProj = { ...proj, pages: filteredPages };
          session.store.dispatch(projects.actions.receive(newProj));
        }
      } else {
        const cache = castSession(session);
        partFile = `${path.resolve(file)}#${property}.${part}`;
        if (contents.length !== 1 || contents[0] !== partFile || !cache.$getMdast(contents[0])) {
          const mdast = {
            type: 'root',
            children: contents.map((content) => {
              const root = parseMyst(session, content, file);
              return {
                type: 'block',
                data: { part },
                children: root.children,
              };
            }),
          };
          cache.$setMdast(partFile, {
            pre: {
              kind: SourceFileKind.Part,
              file: partFile,
              mdast,
              // Same frontmatter as the containing page
              frontmatter: { ...pageFrontmatter },
              location: getLocation(file, projectPath),
            },
          });
        }
        session.store.dispatch(
          config.actions.receiveFilePart({
            partFile,
            file,
          }),
        );
      }
      session.store.dispatch(
        config.actions.receiveProjectPart({
          partFile,
          path: projectPath ?? '.',
        }),
      );
      return [part, [partFile]];
    }),
  );
  logMessagesFromVFile(session, vfile);
  return Object.fromEntries(modifiedParts);
}

/**
 * Find bibliography files in the given directory, loading them if required
 *
 * @param session session with logging
 * @param dir directory to search
 * @param load load bib files in addition to locating them
 */
export async function bibFilesInDir(session: ISession, dir: string, load = true) {
  const bibFiles = await Promise.all(
    fs.readdirSync(dir).map(async (f) => {
      if (path.extname(f).toLowerCase() === '.bib') {
        const bibFile = path.join(dir, f);
        if (load) await loadFile(session, bibFile);
        return bibFile;
      }
    }),
  );
  return bibFiles.filter((f): f is string => Boolean(f));
}

/**
 * Return the cached post-processed MDAST for the given file, or return undefined
 *
 * @param session session with logging
 * @param file path to file
 */
export function selectFile(session: ISession, file: string): RendererData | undefined {
  const cache = castSession(session);
  if (!cache.$getMdast(file)) {
    addWarningForFile(session, file, `Expected mdast to be processed`, 'error', {
      ruleId: RuleId.selectedFileIsProcessed,
    });
    return undefined;
  }
  const mdastPost = cache.$getMdast(file)?.post;
  if (!mdastPost) {
    addWarningForFile(session, file, `Expected mdast to be processed and transformed`, 'error', {
      ruleId: RuleId.selectedFileIsProcessed,
    });
    return undefined;
  }
  return mdastPost;
}

export async function getRawFrontmatterFromFile(
  session: ISession,
  file: string,
  projectPath?: string,
) {
  const state = session.store.getState();
  if (projectPath && path.resolve(file) === selectors.selectLocalConfigFile(state, projectPath)) {
    return selectors.selectLocalProjectConfig(state, projectPath);
  }
  const cache = castSession(session);
  if (!cache.$getMdast(file)) await loadFile(session, file, projectPath);
  const result = cache.$getMdast(file);
  if (!result || !result.pre) return undefined;
  return result.pre.frontmatter;
}
