import path from 'node:path';
import { tic } from 'myst-cli-utils';
import type { GenericParent, IExpressionResult, PluginUtils, References } from 'myst-common';
import { fileError, fileWarn, RuleId, slugToUrl } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import type { Dependency } from 'myst-spec-ext';
import { SourceFileKind } from 'myst-spec-ext';
import type { LinkTransformer } from 'myst-transforms';
import {
  ReferenceState,
  MultiPageReferenceResolver,
  resolveLinksAndCitationsTransform,
  resolveReferencesTransform,
  keysTransform,
  linksTransform,
  MystTransformer,
  SphinxTransformer,
  WikiTransformer,
  GithubTransformer,
  RRIDTransformer,
  RORTransformer,
  DOITransformer,
  checkLinkTextTransform,
  reconstructHtmlTransform,
  htmlTransform,
  basicTransformations,
  inlineMathSimplificationTransform,
  mathTransform,
  glossaryTransform,
  abbreviationTransform,
  indexIdentifierTransform,
  enumerateTargetsTransform,
  joinGatesTransform,
  codeTransform,
  footnotesTransform,
} from 'myst-transforms';
import { unified } from 'unified';
import { select, selectAll } from 'unist-util-select';
import { VFile } from 'vfile';
import { processPageFrontmatter, updateFileInfoFromFrontmatter } from '../frontmatter.js';
import { selectors } from '../store/index.js';
import type { ISession } from '../session/types.js';
import { castSession } from '../session/cache.js';
import type { RendererData } from '../transforms/types.js';

import {
  checkLinksTransform,
  embedTransform,
  importMdastFromJson,
  includeFilesTransform,
  liftCodeMetadataToBlock,
  transformCitations,
  transformImageFormats,
  transformLinkedDOIs,
  transformLinkedRORs,
  transformOutputsToCache,
  transformRenderInlineExpressions,
  transformThumbnail,
  StaticFileTransformer,
  propagateBlockDataToCode,
  transformBanner,
  reduceOutputs,
  transformPlaceholderImages,
  transformDeleteBase64UrlSource,
  transformWebp,
  transformOutputsToFile,
  transformImagesToEmbed,
  transformImagesWithoutExt,
  transformImagesToDisk,
  transformFilterOutputStreams,
  transformLiftCodeBlocksInJupytext,
  transformMystXRefs,
} from '../transforms/index.js';
import type { ImageExtensions } from '../utils/resolveExtension.js';
import { logMessagesFromVFile } from '../utils/logging.js';
import { combineCitationRenderers } from './citations.js';
import { bibFilesInDir } from './file.js';
import { parseMyst } from './myst.js';
import { kernelExecutionTransform, LocalDiskCache } from 'myst-execute';
import type { IOutput } from '@jupyterlab/nbformat';
import { rawDirectiveTransform } from '../transforms/raw.js';
import { TransformPipelineBuilder } from './pipeline.js';

const LINKS_SELECTOR = 'link,card,linkBlock';

const pluginUtils: PluginUtils = { select, selectAll };

const htmlHandlers = {
  comment(h: any, node: any) {
    // Prevents HTML comments from showing up as text in web
    // TODO: Remove once this is landed in myst-parser
    const result = h(node, 'comment');
    (result as any).value = node.value;
    return result;
  },
};

export type TransformFn = (
  session: ISession,
  opts: Parameters<typeof transformMdast>[1],
) => Promise<void>;

function referenceFileFromPartFile(session: ISession, partFile: string) {
  const state = session.store.getState();
  const partDeps = selectors.selectDependentFiles(state, partFile);
  if (partDeps.length > 0) return partDeps[0];
  const file = selectors.selectFileFromPart(state, partFile);
  return file ?? partFile;
}

export async function transformMdast(
  session: ISession,
  opts: {
    referenceResolutionBlocker: () => void;
    indexGenerationBlocker: () => void;
    file: string;
    projectPath?: string;
    projectSlug?: string;
    pageSlug?: string;
    imageExtensions?: ImageExtensions[];
    watchMode?: boolean;
    execute?: boolean;
    extraTransforms?: TransformFn[];
    extraLinkTransformers?: LinkTransformer[];
    minifyMaxCharacters?: number;
    index?: string;
    titleDepth?: number;
    runPostProcess?: boolean;
    referenceStateContext: {
      referenceStates: ReferenceState[];
    };
    checkLinks?: boolean;
  },
) {
  const {
    file,
    projectPath,
    pageSlug,
    projectSlug,
    imageExtensions,
    extraTransforms,
    watchMode = false,
    minifyMaxCharacters,
    extraLinkTransformers,
    index,
    titleDepth,
    execute,
    runPostProcess,
    referenceStateContext,
    referenceResolutionBlocker,
    indexGenerationBlocker,
    checkLinks,
  } = opts;
  const toc = tic();
  const { store, log } = session;
  const cache = castSession(session);
  if (!cache.$getMdast(file)) return;
  const {
    mdast: mdastPre,
    kind,
    frontmatter: preFrontmatter,
    location,
    identifiers,
    widgets,
  } = cache.$getMdast(file)?.pre ?? {};
  if (!mdastPre || !kind || !location) throw new Error(`Expected mdast to be parsed for ${file}`);
  log.debug(`Processing "${file}"`);
  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;

  const sha256 = selectors.selectFileInfo(store.getState(), file).sha256 as string;
  const mdast = structuredClone(mdastPre);
  const frontmatter = processPageFrontmatter(
    session,
    preFrontmatter ?? {},
    {
      property: 'frontmatter',
      file,
      messages: {},
      errorLogFn: (message: string) => {
        fileError(vfile, message, { ruleId: RuleId.validPageFrontmatter });
      },
      warningLogFn: (message: string) => {
        fileWarn(vfile, message, { ruleId: RuleId.validPageFrontmatter });
      },
    },
    projectPath,
  );
  const isJupytext = frontmatter.kernelspec || frontmatter.jupytext;
  const references: References = {
    cite: { order: [], data: {} },
  };
  const refFile = kind === SourceFileKind.Part ? referenceFileFromPartFile(session, file) : file;
  const state = new ReferenceState(refFile, {
    numbering: frontmatter.numbering,
    identifiers,
    vfile,
  });
  cache.$internalReferences[file] = state;

  const builder = new TransformPipelineBuilder();
  // Import additional content from mdast or other files
  builder.addTransform('import-mdast-json', (tree) => importMdastFromJson(session, file, tree)); // after=START
  builder.addTransform('include-files', (tree) =>
    includeFilesTransform(session, file, tree, frontmatter, vfile),
  );
  builder.addTransform('raw-directive', (tree) => rawDirectiveTransform(tree, vfile));
  // This needs to come before basic transformations since it may add labels to blocks
  builder.addTransform('lift-code-metadata', (tree) =>
    liftCodeMetadataToBlock(session, vfile, tree),
  );

  builder.addTransform('reconstruct-html', reconstructHtmlTransform); // We need to group and link the HTML first
  builder.addTransform('html', (tree) => htmlTransform(tree, { htmlHandlers })); // Some of the HTML plugins need to operate on the transformed html, e.g. figure caption transforms
  builder.addTransform('basic', (tree) =>
    basicTransformations(tree, vfile, {
      parser: (content: string) => parseMyst(session, content, file),
      firstDepth: (titleDepth ?? 1) + (frontmatter.content_includes_title ? 0 : 1),
    }),
  );
  builder.addTransform('inline-math', (tree) => inlineMathSimplificationTransform(tree));
  builder.addTransform('math', (tree) => mathTransform(tree, vfile, { macros: frontmatter.math }));
  builder.addTransform('glossary', (tree) => glossaryTransform(tree, vfile)); // This should be before the enumerate plugins
  builder.addTransform('abbreviation', (tree) =>
    abbreviationTransform(tree, { abbreviations: frontmatter.abbreviations }),
  );
  builder.addTransform('index-identifier', (tree) => indexIdentifierTransform(tree));
  builder.addTransform('enumerate-targets', (tree) => enumerateTargetsTransform(tree, { state })); // This should be after math/container transforms
  builder.addTransform('join-gates', (tree) => joinGatesTransform(tree, vfile));

  // Load custom transform plugins
  session.plugins?.transforms.forEach((t) => {
    if (t.stage !== 'document') return;
    builder.addTransform(
      t.name,
      async (tree) => {
        const pipe = unified();
        pipe.use(t.plugin, undefined, pluginUtils);
        await pipe.run(tree, vfile);
      },
      { after: t.after, before: t.before },
    );
  });

  // This needs to come after basic transformations since meta tags are added there
  builder.addTransform('propagate-block-data', (tree) =>
    propagateBlockDataToCode(session, vfile, tree),
  );

  // Initialize citation renderers for this (non-bib) file
  const citationState: { fileRenderer: ReturnType<typeof combineCitationRenderers> } = {
    fileRenderer: {},
  };
  const registerCitations = async (tree: GenericParent) => {
    cache.$citationRenderers[file] = await transformLinkedDOIs(
      session,
      vfile,
      tree,
      cache.$doiRenderers,
      file,
    );
    const rendererFiles = [file];
    if (projectPath) {
      rendererFiles.unshift(projectPath);
    } else {
      const localFiles = (await bibFilesInDir(session, path.dirname(file))) || [];
      rendererFiles.push(...localFiles);
    }
    // Combine file-specific citation renderers with project renderers from bib files
    citationState.fileRenderer = combineCitationRenderers(cache, ...rendererFiles);
  };
  builder.addTransform('register-citations', registerCitations);
  builder.addTransform(
    'kernel-execution',
    (tree) => {
      const cachePath = path.join(session.buildPath(), 'execute');
      kernelExecutionTransform(tree, vfile, {
        basePath: session.sourcePath(),
        cache: new LocalDiskCache<(IExpressionResult | IOutput[])[]>(cachePath),
        sessionFactory: () => session.jupyterSessionManager(),
        frontmatter: frontmatter,
        ignoreCache: false,
        errorIsFatal: false,
        log: session.log,
      });
    },
    { skip: !execute },
  );
  builder.addTransform('render-inline-expressions', (tree) =>
    transformRenderInlineExpressions(tree, vfile),
  );
  builder.addTransform('cache-outputs', (tree) =>
    transformOutputsToCache(session, tree, kind, { minifyMaxCharacters }),
  );
  builder.addTransform('filter-output', (tree) =>
    transformFilterOutputStreams(tree, vfile, frontmatter.settings),
  );
  builder.addTransform('citations', (tree) => {
    transformCitations(session, file, tree, citationState.fileRenderer, references);
  });

  builder.addTransform('code', (tree) =>
    codeTransform(tree, vfile, { lang: frontmatter?.kernelspec?.language }),
  );
  builder.addTransform('footnotes', (tree) => footnotesTransform(tree, vfile)); // Needs to happen near the end
  builder.addTransform('images-to-embed', transformImagesToEmbed);
  builder.addTransform('image-extensions', (tree) =>
    transformImagesWithoutExt(session, tree, file, { imageExtensions }),
  );
  builder.addTransform(
    'jupytext-lift-code-blocks',
    isJupytext ? transformLiftCodeBlocksInJupytext : undefined,
  );
  const dependencies: Dependency[] = [];
  builder.addTransform('write-post-mdast', async (tree) => {
    // This writes the frontmatter to the file, so its position is important
    // We might need to rethink its location
    const useSlug = pageSlug !== index;
    let url: string | undefined;
    let dataUrl: string | undefined;
    if (pageSlug && projectSlug) {
      url = `/${projectSlug}/${useSlug ? pageSlug : ''}`;
      dataUrl = `/${projectSlug}/${pageSlug}.json`;
    } else if (pageSlug) {
      url = `/${useSlug ? pageSlug : ''}`;
      dataUrl = `/${pageSlug}.json`;
    }
    url = slugToUrl(url);
    updateFileInfoFromFrontmatter(session, file, frontmatter, url, dataUrl);

    const data: RendererData = {
      kind: isJupytext ? SourceFileKind.Notebook : kind,
      file,
      location,
      sha256,
      slug: pageSlug,
      dependencies,
      frontmatter,
      mdast: tree,
      references,
      widgets,
    } as any;
    const cachedMdast = cache.$getMdast(file);
    if (cachedMdast) cachedMdast.post = data;
    if (extraTransforms) {
      await Promise.all(
        extraTransforms.map(async (transform) => {
          await transform(session, opts);
        }),
      );
    }
  });

  // Blocking cross-project resolution
  builder.addTransform('reference-resolution', referenceResolutionBlocker);
  builder.addTransform('index-generation', indexGenerationBlocker);

  const sharedStateContext: {
    sharedState?: any;
    externalReferences?: any;
    transformers: LinkTransformer[];
  } = { transformers: [] };
  builder.addTransform('set-shared-state', () => {
    sharedStateContext.sharedState = referenceStateContext.referenceStates
      ? new MultiPageReferenceResolver(referenceStateContext.referenceStates, file, vfile)
      : state;
    sharedStateContext.externalReferences = Object.values(cache.$externalReferences);
    // NOTE: This is doing things in place, we should potentially make this a different state?
    sharedStateContext.transformers = [
      ...(extraLinkTransformers || []),
      new WikiTransformer(),
      new GithubTransformer(),
      new RRIDTransformer(),
      new RORTransformer(),
      new DOITransformer(), // This also is picked up in the next transform
      new MystTransformer(sharedStateContext.externalReferences),
      new SphinxTransformer(sharedStateContext.externalReferences),
      new StaticFileTransformer(session, file), // Links static files and internally linked files
    ];
  });
  const transformOptions = { skip: !runPostProcess };
  builder.addTransform(
    'resolve-links-and-citations',
    (tree) =>
      resolveLinksAndCitationsTransform(tree, {
        state: sharedStateContext.sharedState,
        transformers: sharedStateContext.transformers,
      }),
    transformOptions,
  );
  builder.addTransform(
    'links',
    (tree) =>
      linksTransform(tree, sharedStateContext.sharedState.vfile as VFile, {
        transformers: sharedStateContext.transformers,
        selector: LINKS_SELECTOR,
      }),
    transformOptions,
  );
  builder.addTransform(
    'ror',
    (tree) => transformLinkedRORs(session, vfile, tree, file),
    transformOptions,
  );
  builder.addTransform(
    'resolve-references',
    (tree) =>
      resolveReferencesTransform(tree, sharedStateContext.sharedState.vfile as VFile, {
        state: sharedStateContext.sharedState,
        transformers: sharedStateContext.transformers,
      }),
    transformOptions,
  );
  builder.addTransform(
    'myst-xrefs',
    (tree) => transformMystXRefs(session, vfile, tree, frontmatter),
    transformOptions,
  );
  session.plugins?.transforms.forEach((t) => {
    if (t.stage === 'document') return;
    builder.addTransform(
      t.name,
      async (tree) => {
        const pipe = unified();
        pipe.use(t.plugin, undefined, pluginUtils);
        await pipe.run(tree, vfile);
      },
      { ...transformOptions, after: t.after, before: t.before },
    );
  });
  builder.addTransform(
    'embed',
    (tree) => embedTransform(session, tree, file, dependencies, sharedStateContext.sharedState),
    transformOptions,
  );

  // Ensure there are keys on every node after post processing
  builder.addTransform('keys', keysTransform, transformOptions);
  builder.addTransform(
    'check-link-text',
    (tree) => checkLinkTextTransform(tree, sharedStateContext.externalReferences, vfile),
    transformOptions,
  );
  const pipeline = builder.build();
  await pipeline.run(mdast);
  logMessagesFromVFile(session, vfile);

  if (!watchMode) log.info(toc(`📖 Built ${file} in %s.`));
  if (checkLinks) await checkLinksTransform(session, file, mdast);
}

export async function finalizeMdast(
  session: ISession,
  mdast: GenericParent,
  frontmatter: PageFrontmatter,
  file: string,
  {
    imageWriteFolder,
    useExistingImages,
    imageAltOutputFolder,
    imageExtensions,
    optimizeWebp,
    simplifyFigures,
    processThumbnail,
    maxSizeWebp,
  }: {
    imageWriteFolder: string;
    useExistingImages?: boolean;
    imageAltOutputFolder?: string;
    imageExtensions?: ImageExtensions[];
    optimizeWebp?: boolean;
    simplifyFigures?: boolean;
    processThumbnail?: boolean;
    maxSizeWebp?: number;
  },
) {
  const vfile = new VFile(); // Collect errors on this file
  vfile.path = file;
  const builder = new TransformPipelineBuilder();
  builder.addTransform(
    'reduce-outputs',
    simplifyFigures
      ? (tree) => {
          reduceOutputs(session, tree, file, imageWriteFolder, {
            altOutputFolder: simplifyFigures ? undefined : imageAltOutputFolder,
          });
        }
      : undefined,
  );
  // Transform output nodes to images / text
  builder.addTransform('write-outputs', (tree) =>
    transformOutputsToFile(session, tree, imageWriteFolder, {
      altOutputFolder: simplifyFigures ? undefined : imageAltOutputFolder,
      vfile,
    }),
  );
  builder.addTransform(
    'write-images',
    !useExistingImages
      ? (tree) =>
          transformImagesToDisk(session, tree, file, imageWriteFolder, {
            altOutputFolder: imageAltOutputFolder,
            imageExtensions,
          })
      : undefined,
  );
  // Must happen after transformImages
  builder.addTransform(
    'image-formats',
    !useExistingImages
      ? (tree) =>
          transformImageFormats(session, tree, file, imageWriteFolder, {
            altOutputFolder: imageAltOutputFolder,
            imageExtensions,
          })
      : undefined,
  );
  builder.addTransform(
    'webp',
    !useExistingImages && optimizeWebp
      ? () => transformWebp(session, { file, imageWriteFolder, maxSizeWebp })
      : undefined,
  );

  // Note, the thumbnail transform must be **after** images, as it may read the images
  builder.addTransform(
    'thumbnails',
    !useExistingImages && processThumbnail
      ? (tree) =>
          transformThumbnail(session, tree, file, frontmatter, imageWriteFolder, {
            altOutputFolder: imageAltOutputFolder,
            webp: optimizeWebp,
            maxSizeWebp,
          })
      : undefined,
  );
  builder.addTransform(
    'banner',
    !useExistingImages && processThumbnail
      ? () =>
          transformBanner(session, file, frontmatter, imageWriteFolder, {
            altOutputFolder: imageAltOutputFolder,
            webp: optimizeWebp,
            maxSizeWebp,
          })
      : undefined,
  );

  builder.addTransform('delete-base64', transformDeleteBase64UrlSource);
  // This must happen after embedded content is resolved so all children are present on figures
  builder.addTransform(
    'placeholder-images',
    simplifyFigures ? (tree) => transformPlaceholderImages(tree, { imageExtensions }) : undefined,
  );
  const pipeline = builder.build();
  await pipeline.run(mdast);
  const cache = castSession(session);
  const postData = cache.$getMdast(file)?.post;
  if (postData) {
    postData.frontmatter = frontmatter;
    postData.mdast = mdast;
    // TODO out-of-band widgets?
    postData.widgets = cache.$getMdast(file)?.pre.widgets;
    updateFileInfoFromFrontmatter(session, file, frontmatter);
  }
  logMessagesFromVFile(session, vfile);
}
