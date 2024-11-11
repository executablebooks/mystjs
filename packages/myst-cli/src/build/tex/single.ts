import AdmZip from 'adm-zip';
import path from 'node:path';
import type { TexTemplateImports } from 'jtex';
import { mergeTexTemplateImports, renderTemplate } from 'jtex';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import type { References, GenericParent } from 'myst-common';
import { extractPart, RuleId, TemplateKind } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import {
  FRONTMATTER_ALIASES,
  PAGE_FRONTMATTER_KEYS,
  PROJECT_FRONTMATTER_KEYS,
  articlesWithFile,
  validateProjectFrontmatter,
} from 'myst-frontmatter';
import type { TemplatePartDefinition, TemplateYml } from 'myst-templates';
import MystTemplate from 'myst-templates';
import mystToTex, { mergePreambles, generatePreamble } from 'myst-to-tex';
import type { LatexResult, PreambleData } from 'myst-to-tex';
import { filterKeys } from 'simple-validators';
import { unified } from 'unified';
import { select, selectAll } from 'unist-util-select';
import { VFile } from 'vfile';
import { frontmatterValidationOpts } from '../../frontmatter.js';
import { finalizeMdast } from '../../process/mdast.js';
import type { ISession } from '../../session/types.js';
import { selectors } from '../../store/index.js';
import { ImageExtensions } from '../../utils/resolveExtension.js';
import { logMessagesFromVFile } from '../../utils/logging.js';
import { getFileContent } from '../utils/getFileContent.js';
import { addWarningForFile } from '../../utils/addWarningForFile.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { createTempFolder } from '../../utils/createTempFolder.js';
import { resolveFrontmatterParts } from '../../utils/resolveFrontmatterParts.js';
import type { ExportWithOutput, ExportResults, ExportFnOptions } from '../types.js';
import { writeBibtexFromCitationRenderers } from '../utils/bibtex.js';

export const DEFAULT_BIB_FILENAME = 'main.bib';
const TEX_IMAGE_EXTENSIONS = [
  ImageExtensions.pdf,
  ImageExtensions.png,
  ImageExtensions.jpg,
  ImageExtensions.jpeg,
];

export function mdastToTex(
  session: ISession,
  mdast: GenericParent,
  references: References,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml | null,
  printGlossaries: boolean,
) {
  const pipe = unified().use(mystToTex, {
    math: frontmatter?.math,
    citestyle: templateYml?.style?.citation,
    bibliography: templateYml?.style?.bibliography,
    printGlossaries,
    references,
    ...frontmatter.settings?.myst_to_tex,
  });
  const result = pipe.runSync(mdast as any);
  const tex = pipe.stringify(result as any);
  logMessagesFromVFile(session, tex);
  return tex.result as LatexResult;
}

export function extractTexPart(
  session: ISession,
  mdast: GenericParent,
  references: References,
  partDefinition: TemplatePartDefinition,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml,
): LatexResult | LatexResult[] | undefined {
  const part = extractPart(mdast, partDefinition.id, {
    frontmatterParts: resolveFrontmatterParts(session, frontmatter),
  });
  if (!part) return undefined;
  if (!partDefinition.as_list) {
    // Do not build glossaries when extracting parts: references cannot be mapped to definitions
    return mdastToTex(session, part, references, frontmatter, templateYml, false);
  }
  if (
    part.children.length === 1 &&
    part.children[0]?.children?.length === 1 &&
    part.children[0].children[0].type === 'list'
  ) {
    const items = selectAll('listItem', part) as GenericParent[];
    return items.map((item: GenericParent) => {
      return mdastToTex(
        session,
        { type: 'root', children: item.children },
        references,
        frontmatter,
        templateYml,
        false,
      );
    });
  }
  return part.children.map((block) => {
    return mdastToTex(
      session,
      { type: 'root', children: [block] },
      references,
      frontmatter,
      templateYml,
      false,
    );
  });
}

function titleToTexHeading(session: ISession, title: string, depth = 1) {
  const headingMdast = {
    type: 'root',
    children: [
      {
        type: 'heading',
        depth,
        children: [{ type: 'text', value: title }],
      },
    ],
  };
  const content = mdastToTex(session, headingMdast, {}, {}, null, false);
  return content.value;
}

export async function localArticleToTexRaw(
  session: ISession,
  templateOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  const { articles, output } = templateOptions;
  const { projectPath, extraLinkTransformers, execute } = opts ?? {};
  const fileArticles = articlesWithFile(articles);
  const content = await getFileContent(
    session,
    fileArticles.map((article) => article.file),
    {
      projectPath,
      imageExtensions: TEX_IMAGE_EXTENSIONS,
      extraLinkTransformers,
      titleDepths: fileArticles.map((article) => article.level),
      preFrontmatters: fileArticles.map((article) =>
        filterKeys(article, [...PAGE_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
      ),
      execute,
    },
  );

  const toc = tic();
  const results = await Promise.all(
    content.map(async ({ mdast, frontmatter, references }, ind) => {
      await finalizeMdast(session, mdast, frontmatter, fileArticles[ind].file, {
        imageWriteFolder: path.join(path.dirname(output), 'files'),
        imageAltOutputFolder: 'files/',
        imageExtensions: TEX_IMAGE_EXTENSIONS,
        simplifyFigures: true,
      });
      return mdastToTex(session, mdast, references, frontmatter, null, false);
    }),
  );
  session.log.info(toc(`📑 Exported TeX in %s, copying to ${output}`));
  if (results.length === 1) {
    writeFileToFolder(output, results[0].value);
  } else {
    let includeContent = '';
    let fileInd = 0;
    const { dir, name, ext } = path.parse(output);
    articles.forEach((article) => {
      if (article.file) {
        const base = `${name}-${content[fileInd]?.slug ?? fileInd}${ext}`;
        const includeFile = path.format({ dir, ext, base });
        let part = '';
        const { title, content_includes_title } = content[fileInd]?.frontmatter ?? {};
        if (title && !content_includes_title) {
          part = `${titleToTexHeading(session, title, article.level)}\n\n`;
        }
        writeFileToFolder(includeFile, `${part}${results[fileInd]?.value}`);
        includeContent += `\\include{${base}}\n\n`;
        fileInd++;
      } else if (article.title) {
        includeContent += `${titleToTexHeading(session, article.title, article.level)}\n\n`;
      }
    });
    writeFileToFolder(output, includeContent);
  }
  // TODO: add imports and macros?
  return { tempFolders: [] };
}

export async function localArticleToTexTemplated(
  session: ISession,
  file: string,
  templateOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  const { output, articles, template } = templateOptions;
  const { projectPath, extraLinkTransformers, clean, ci, execute } = opts ?? {};
  const filesPath = path.join(path.dirname(output), 'files');
  const fileArticles = articlesWithFile(articles);
  const content = await getFileContent(
    session,
    fileArticles.map((article) => article.file),
    {
      projectPath,
      imageExtensions: TEX_IMAGE_EXTENSIONS,
      extraLinkTransformers,
      titleDepths: fileArticles.map((article) => article.level),
      preFrontmatters: fileArticles.map((article) =>
        filterKeys(article, [...PAGE_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
      ),
      execute,
    },
  );
  const bibtexWritten = writeBibtexFromCitationRenderers(
    session,
    path.join(path.dirname(output), DEFAULT_BIB_FILENAME),
    content,
  );

  const warningLogFn = (message: string) => {
    addWarningForFile(session, file, message, 'warn', {
      ruleId: RuleId.texRenders,
    });
  };
  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.tex,
    template: template || undefined,
    buildDir: session.buildPath(),
    errorLogFn: (message: string) => {
      addWarningForFile(session, file, message, 'error', {
        ruleId: RuleId.texRenders,
      });
    },
    warningLogFn,
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  const toc = tic();
  const templateYml = mystTemplate.getValidatedTemplateYml();
  const partDefinitions = templateYml?.parts || [];
  const parts: Record<string, string | string[]> = {};
  let collectedImports: TexTemplateImports = { imports: [], commands: {} };
  let preambleData: PreambleData = {
    hasProofs: false,
    printGlossaries: false,
    glossary: {},
    abbreviations: {},
  };
  let hasGlossaries = false;
  const results = await Promise.all(
    content.map(async ({ mdast, frontmatter, references }, ind) => {
      await finalizeMdast(session, mdast, frontmatter, fileArticles[ind].file, {
        imageWriteFolder: filesPath,
        imageAltOutputFolder: 'files/',
        imageExtensions: TEX_IMAGE_EXTENSIONS,
        simplifyFigures: true,
      });

      partDefinitions.forEach((def) => {
        const part = extractTexPart(session, mdast, references, def, frontmatter, templateYml);
        if (part && parts[def.id]) {
          addWarningForFile(
            session,
            file,
            `multiple values for part '${def.id}' found; ignoring value from ${fileArticles[ind].file}`,
            'error',
            { ruleId: RuleId.texRenders },
          );
        } else if (Array.isArray(part)) {
          // This is the case if def.as_list is true
          part.forEach((item) => {
            collectedImports = mergeTexTemplateImports(collectedImports, item);
          });
          parts[def.id] = part.map(({ value }) => value);
        } else if (part != null) {
          collectedImports = mergeTexTemplateImports(collectedImports, part);
          parts[def.id] = part?.value ?? '';
        }
      });
      const result = mdastToTex(session, mdast, references, frontmatter, templateYml, true);
      collectedImports = mergeTexTemplateImports(collectedImports, result);
      preambleData = mergePreambles(preambleData, result.preamble, warningLogFn);
      hasGlossaries = hasGlossaries || hasGlossary(mdast);
      return result;
    }),
  );

  let frontmatter: Record<string, any>;
  let texContent: string;
  if (results.length === 1) {
    frontmatter = content[0].frontmatter;
    texContent = results[0].value;
  } else {
    const state = session.store.getState();
    frontmatter = selectors.selectLocalProjectConfig(state, projectPath ?? '.') ?? {};
    const { dir, name, ext } = path.parse(output);
    texContent = '';
    let fileInd = 0;
    articles.forEach((article) => {
      if (article.file) {
        const includeFilename = `${name}-${content[fileInd]?.slug ?? fileInd}`;
        const includeFile = path.format({ dir, ext, base: `${includeFilename}${ext}` });
        let part = '';
        const { title, content_includes_title } = content[fileInd]?.frontmatter ?? {};
        if (title && !content_includes_title) {
          part = `${titleToTexHeading(session, title, article.level)}\n\n`;
        }
        writeFileToFolder(includeFile, `${part}${results[fileInd].value}`);
        texContent += `\\include{${includeFilename}}\n\n`;
        fileInd++;
      } else if (article.title) {
        texContent += `${titleToTexHeading(session, article.title, article.level)}\n\n`;
      }
    });
  }
  const vfile = new VFile();
  vfile.path = file;
  const exportFrontmatter = validateProjectFrontmatter(
    filterKeys(templateOptions, [...PROJECT_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
    frontmatterValidationOpts(vfile),
  );
  logMessagesFromVFile(session, vfile);
  frontmatter = { ...frontmatter, ...exportFrontmatter };
  // Fill in template
  session.log.info(toc(`📑 Exported TeX in %s, copying to ${output}`));
  const { preamble, suffix } = generatePreamble(preambleData);
  renderTemplate(mystTemplate, {
    contentOrPath: texContent + suffix,
    outputPath: output,
    frontmatter,
    parts,
    options: { ...frontmatter.options, ...templateOptions },
    bibliography: bibtexWritten ? DEFAULT_BIB_FILENAME : undefined,
    sourceFile: file,
    imports: collectedImports,
    preamble,
    force: clean,
    packages: templateYml.packages,
    filesPath,
    removeVersionComment: ci,
  });
  return { tempFolders: [], hasGlossaries };
}

export async function runTexExport( // DBG: Must return an info on whether glossaries are present
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  if (opts?.clean) cleanOutput(session, exportOptions.output);
  let result: ExportResults;
  if (exportOptions.template === null) {
    result = await localArticleToTexRaw(session, exportOptions, opts);
  } else {
    result = await localArticleToTexTemplated(session, file, exportOptions, opts);
  }
  return result;
}

export async function runTexZipExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  if (opts?.clean) cleanOutput(session, exportOptions.output);
  const zipOutput = exportOptions.output;
  const texFolder = createTempFolder(session);
  exportOptions.output = path.join(
    texFolder,
    `${path.basename(zipOutput, path.extname(zipOutput))}.tex`,
  );
  await runTexExport(session, file, exportOptions, opts);
  session.log.info(`🤐 Zipping tex outputs to ${zipOutput}`);
  const zip = new AdmZip();
  zip.addLocalFolder(texFolder);
  zip.writeZip(zipOutput);
  return { tempFolders: [texFolder] };
}

function hasGlossary(mdast: GenericParent): boolean {
  const glossary = select('glossary', mdast);
  return glossary !== null;
}
