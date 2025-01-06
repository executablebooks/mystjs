import path from 'node:path';
import { plural } from 'myst-common';
import { tic } from 'myst-cli-utils';
import type { LinkTransformer } from 'myst-transforms';
import { combineProjectCitationRenderers } from '../../process/citations.js';
import { loadFile, selectFile } from '../../process/file.js';
import { loadReferences } from '../../process/loadReferences.js';
import type { TransformFn } from '../../process/mdast.js';
import { transformMdast } from '../../process/mdast.js';
import { loadProject, selectPageReferenceStates, makeBarrier } from '../../process/site.js';
import { buildIndexTransform, MultiPageReferenceResolver } from 'myst-transforms';
import type { ISession } from '../../session/types.js';
import { selectors } from '../../store/index.js';
import type { ImageExtensions } from '../../utils/resolveExtension.js';
import { castSession } from '../../session/cache.js';
import { VFile } from 'vfile';
import { logMessagesFromVFile } from '../../utils/logging.js';

export async function getFileContent(
  session: ISession,
  files: string[],
  {
    projectPath,
    imageExtensions,
    extraLinkTransformers,
    extraTransforms,
    titleDepths,
    preFrontmatters,
    execute,
  }: {
    projectPath?: string;
    imageExtensions: ImageExtensions[];
    extraLinkTransformers?: LinkTransformer[];
    extraTransforms?: TransformFn[];
    titleDepths?: number | (number | undefined)[];
    preFrontmatters?: Record<string, any> | (Record<string, any> | undefined)[];
    execute?: boolean;
  },
) {
  const toc = tic();
  files = files.map((file) => path.resolve(file));
  projectPath = projectPath ?? path.resolve('.');
  const { project, pages } = await loadProject(session, projectPath);
  const projectFiles = pages.map((page) => page.file).filter((file) => !files.includes(file));
  await Promise.all([
    // Load all citations (.bib)
    ...project.bibliography.map((bib) => loadFile(session, bib, projectPath, '.bib')),
    // Load all content (.md, .tex, .myst.json, or .ipynb)
    ...[...files, ...projectFiles].map((file, ind) => {
      const preFrontmatter = Array.isArray(preFrontmatters)
        ? preFrontmatters?.[ind]
        : preFrontmatters;
      return loadFile(session, file, projectPath, undefined, {
        preFrontmatter,
      });
    }),
    // Load up all the intersphinx references
    loadReferences(session, { projectPath }),
  ]);
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(session, projectPath);

  const projectParts = selectors.selectProjectParts(session.store.getState(), projectPath);
  // Keep 'files' indices consistent in 'allFiles' as index is used for other fields.
  const allFiles = [...files, ...projectFiles, ...projectParts];

  const { wait: waitReferencing, promise: referencingPromise } = makeBarrier(allFiles.length);
  const { wait: waitIndexing, promise: indexingPromise } = makeBarrier(allFiles.length);

  // TODO: maybe move transformMdast into a multi-file function
  const referenceStateContext: {
    referenceStates: ReturnType<typeof selectPageReferenceStates>;
  } = { referenceStates: [] };
  const referencingPages = allFiles.map((file) => {
    return { file };
  });
  referencingPromise.then(() => {
    const pageReferenceStates = selectPageReferenceStates(session, referencingPages);
    referenceStateContext.referenceStates.push(...pageReferenceStates);
  });
  indexingPromise.then(() => {
    const cache = castSession(session);
    referencingPages.forEach((page) => {
      const fileState = cache.$internalReferences[page.file];
      if (!fileState) return;
      const { mdast } = cache.$getMdast(page.file)?.post ?? {};
      if (!mdast) return;
      const vfile = new VFile();
      vfile.path = page.file;
      buildIndexTransform(
        mdast,
        vfile,
        fileState,
        new MultiPageReferenceResolver(referenceStateContext.referenceStates, fileState.filePath),
      );
      logMessagesFromVFile(session, vfile);
    });
  });
  await Promise.all(
    allFiles.map(async (file, ind) => {
      const pageSlug = pages.find((page) => page.file === file)?.slug;
      const titleDepth = typeof titleDepths === 'number' ? titleDepths : titleDepths?.[ind];
      await transformMdast(session, {
        referenceResolutionBlocker: waitReferencing,
        indexGenerationBlocker: waitIndexing,
        file,
        imageExtensions,
        projectPath,
        pageSlug,
        minifyMaxCharacters: 0,
        index: project.index,
        titleDepth,
        extraTransforms,
        execute,
        extraLinkTransformers,
        runPostProcess: [...files, ...projectParts].includes(file),
        referenceStateContext,
      });
    }),
  );

  const selectedFiles = await Promise.all(
    files.map(async (file) => {
      const selectedFile = selectFile(session, file);
      if (!selectedFile) throw new Error(`Could not load file information for ${file}`);
      return selectedFile;
    }),
  );
  session.log.info(
    toc(
      `📚 Built ${plural('%s page(s)', allFiles)} for export (including ${plural(
        '%s dependenc(y|ies)',
        allFiles.length - files.length,
      )}) from ${projectPath} in %s.`,
    ),
  );
  return selectedFiles;
}
