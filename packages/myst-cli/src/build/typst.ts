import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import which from 'which';
import { makeExecutable, tic, writeFileToFolder } from 'myst-cli-utils';
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
import mystToTypst from 'myst-to-typst';
import type { TypstResult } from 'myst-to-typst';
import { filterKeys } from 'simple-validators';
import { unified } from 'unified';
import { selectAll } from 'unist-util-select';
import type { TypstTemplateImports } from 'jtex';
import { VFile } from 'vfile';
import { mergeTypstTemplateImports, renderTemplate, renderTypstImports } from 'jtex';
import { frontmatterValidationOpts } from '../frontmatter.js';
import { finalizeMdast } from '../process/mdast.js';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { ImageExtensions } from '../utils/resolveExtension.js';
import { logMessagesFromVFile } from '../utils/logging.js';
import { getFileContent } from './utils/getFileContent.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { createTempFolder } from '../utils/createTempFolder.js';
import { resolveFrontmatterParts } from '../utils/resolveFrontmatterParts.js';
import version from '../version.js';
import { cleanOutput } from './utils/cleanOutput.js';
import type { ExportWithOutput, ExportResults, ExportFnOptions } from './types.js';
import { writeBibtexFromCitationRenderers } from './utils/bibtex.js';

export const DEFAULT_BIB_FILENAME = 'main.bib';
const TYPST_IMAGE_EXTENSIONS = [
  ImageExtensions.svg,
  ImageExtensions.png,
  ImageExtensions.jpg,
  ImageExtensions.jpeg,
];

export function isTypstAvailable() {
  return which.sync('typst', { nothrow: true });
}

export async function runTypstExecutable(session: ISession, typstFile: string) {
  if (!isTypstAvailable()) {
    throw new Error('The typst CLI must be installed to build PDFs with typst');
  }
  if (path.extname(typstFile) !== '.typ') {
    throw new Error(`invalid input file for typst executable: ${typstFile}`);
  }
  session.log.debug('Running typst compile');
  await makeExecutable(`typst compile "${typstFile}"`, session.log)();
}

export function mdastToTypst(
  session: ISession,
  mdast: GenericParent,
  references: References,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml | null,
  printGlossaries: boolean,
) {
  const pipe = unified().use(mystToTypst, {
    math: frontmatter?.math,
    // citestyle: templateYml?.style?.citation,
    // bibliography: templateYml?.style?.bibliography,
    // printGlossaries,
    // references,
    // ...frontmatter.settings?.myst_to_tex,
  });
  const result = pipe.runSync(mdast as any);
  const typ = pipe.stringify(result as any);
  logMessagesFromVFile(session, typ);
  return typ.result as TypstResult;
}

export function extractTypstPart(
  session: ISession,
  mdast: GenericParent,
  references: References,
  partDefinition: TemplatePartDefinition,
  frontmatter: PageFrontmatter,
  templateYml: TemplateYml,
): TypstResult | TypstResult[] | undefined {
  const part = extractPart(mdast, partDefinition.id, {
    frontmatterParts: resolveFrontmatterParts(session, frontmatter),
  });
  if (!part) return undefined;
  if (!partDefinition.as_list) {
    // Do not build glossaries when extracting parts: references cannot be mapped to definitions
    return mdastToTypst(session, part, references, frontmatter, templateYml, false);
  }
  if (
    part.children.length === 1 &&
    part.children[0]?.children?.length === 1 &&
    part.children[0].children[0].type === 'list'
  ) {
    const items = selectAll('listItem', part) as GenericParent[];
    return items.map((item: GenericParent) => {
      return mdastToTypst(
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
    return mdastToTypst(
      session,
      { type: 'root', children: [block] },
      references,
      frontmatter,
      templateYml,
      false,
    );
  });
}

function titleToTypstHeading(session: ISession, title: string, depth = 1) {
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
  const content = mdastToTypst(session, headingMdast, {}, {}, null, false);
  return content.value;
}

export async function localArticleToTypstRaw(
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
      imageExtensions: TYPST_IMAGE_EXTENSIONS,
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
        imageExtensions: TYPST_IMAGE_EXTENSIONS,
        simplifyFigures: true,
      });
      return mdastToTypst(session, mdast, references, frontmatter, null, false);
    }),
  );
  session.log.info(toc(`📑 Exported typst in %s, copying to ${output}`));
  if (results.length === 1) {
    writeFileToFolder(output, results[0].value);
  } else {
    const { dir, name, ext } = path.parse(output);
    let includeContent = '';
    let fileInd = 0;
    let addPageBreak = false;
    articles.forEach((article) => {
      if (addPageBreak) includeContent += '#pagebreak()\n\n';
      addPageBreak = false;
      if (article.file) {
        const base = `${name}-${content[fileInd]?.slug ?? fileInd}${ext}`;
        const includeFile = path.format({ dir, ext, base });
        let part = '';
        const { title, content_includes_title } = content[fileInd]?.frontmatter ?? {};
        if (title && !content_includes_title) {
          part = `${titleToTypstHeading(session, title, article.level)}\n\n`;
        }
        writeFileToFolder(includeFile, `${part}${results[fileInd].value}`);
        includeContent += `#include "${base}"\n\n`;
        fileInd++;
        addPageBreak = true;
      } else if (article.title) {
        includeContent += `${titleToTypstHeading(session, article.title, article.level)}\n\n`;
      }
    });
    writeFileToFolder(output, includeContent);
  }
  await runTypstExecutable(session, output);
  // TODO: add imports and macros?
  return { tempFolders: [] };
}

export async function localArticleToTypstTemplated(
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
      imageExtensions: TYPST_IMAGE_EXTENSIONS,
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
    kind: TemplateKind.typst,
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
  let collected: TypstTemplateImports = {
    macros: [],
    commands: {},
  };
  const hasGlossaries = false;
  const results = await Promise.all(
    content.map(async ({ mdast, frontmatter, references }, ind) => {
      await finalizeMdast(session, mdast, frontmatter, fileArticles[ind].file, {
        imageWriteFolder: filesPath,
        imageAltOutputFolder: 'files/',
        imageExtensions: TYPST_IMAGE_EXTENSIONS,
        simplifyFigures: true,
      });

      partDefinitions.forEach((def) => {
        const part = extractTypstPart(session, mdast, references, def, frontmatter, templateYml);
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
            collected = mergeTypstTemplateImports(collected, item);
          });
          parts[def.id] = part.map(({ value }) => value);
        } else if (part != null) {
          collected = mergeTypstTemplateImports(collected, part);
          parts[def.id] = part?.value ?? '';
        }
      });
      const result = mdastToTypst(session, mdast, references, frontmatter, templateYml, true);
      collected = mergeTypstTemplateImports(collected, result);
      return result;
    }),
  );

  let frontmatter: Record<string, any>;
  let typstContent: string;
  const versionComment = ci ? '' : `/* Written by MyST v${version} */\n\n`;
  if (results.length === 1) {
    frontmatter = content[0].frontmatter;
    typstContent = results[0].value;
  } else {
    const state = session.store.getState();
    frontmatter = selectors.selectLocalProjectConfig(state, projectPath ?? '.') ?? {};
    const { dir, name, ext } = path.parse(output);
    typstContent = '';
    let fileInd = 0;
    let addPageBreak = false;
    articles.forEach((article) => {
      if (addPageBreak) typstContent += '#pagebreak()\n\n';
      addPageBreak = false;
      if (article.file) {
        const base = `${name}-${content[fileInd]?.slug ?? fileInd}${ext}`;
        const includeFile = path.format({ dir, ext, base });
        const exports = renderTypstImports(false, collected);
        let part = '';
        const { title, content_includes_title } = content[fileInd]?.frontmatter ?? {};
        if (title && !content_includes_title) {
          part = `${titleToTypstHeading(session, title, article.level)}\n\n`;
        }
        writeFileToFolder(
          includeFile,
          `${versionComment}${exports}\n\n${part}${results[fileInd].value}`,
        );
        typstContent += `#include "${base}"\n\n`;
        fileInd++;
        addPageBreak = true;
      } else if (article.title) {
        typstContent += `${titleToTypstHeading(session, article.title, article.level)}\n\n`;
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
  typstContent = `${versionComment}${typstContent}`;
  session.log.info(toc(`📑 Exported typst in %s, copying to ${output}`));
  renderTemplate(mystTemplate, {
    contentOrPath: typstContent,
    outputPath: output,
    frontmatter,
    parts,
    options: { ...frontmatter.options, ...templateOptions },
    bibliography: bibtexWritten ? DEFAULT_BIB_FILENAME : undefined,
    sourceFile: file,
    imports: collected,
    force: clean,
    packages: templateYml.packages,
    filesPath,
    removeVersionComment: ci,
  });
  await runTypstExecutable(session, output);
  return { tempFolders: [], hasGlossaries };
}

export async function runTypstExport( // DBG: Must return an info on whether glossaries are present
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  if (opts?.clean) cleanOutput(session, exportOptions.output);
  let result: ExportResults;
  if (exportOptions.template === null) {
    result = await localArticleToTypstRaw(session, exportOptions, opts);
  } else {
    result = await localArticleToTypstTemplated(session, file, exportOptions, opts);
  }
  return result;
}

export async function runTypstZipExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  if (opts?.clean) cleanOutput(session, exportOptions.output);
  const zipOutput = exportOptions.output;
  const typFolder = createTempFolder(session);
  exportOptions.output = path.join(
    typFolder,
    `${path.basename(zipOutput, path.extname(zipOutput))}.typ`,
  );
  await runTypstExport(session, file, exportOptions, { ...(opts ?? {}), clean: false });
  session.log.info(`🤐 Zipping typst outputs to ${zipOutput}`);
  const zip = new AdmZip();
  zip.addLocalFolder(typFolder);
  zip.writeZip(zipOutput);
  return { tempFolders: [typFolder] };
}

export async function runTypstPdfExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  if (opts?.clean) cleanOutput(session, exportOptions.output);
  const pdfOutput = exportOptions.output;
  const typFolder = createTempFolder(session);
  exportOptions.output = path.join(
    typFolder,
    `${path.basename(pdfOutput, path.extname(pdfOutput))}.typ`,
  );
  await runTypstExport(session, file, exportOptions, { ...(opts ?? {}), clean: false });
  const writeFolder = path.dirname(pdfOutput);
  session.log.info(`🖨  Rendering typst pdf to ${pdfOutput}`);
  if (!fs.existsSync(writeFolder)) fs.mkdirSync(writeFolder, { recursive: true });
  fs.copyFileSync(exportOptions.output.replace('.typ', '.pdf'), pdfOutput);
  return { tempFolders: [typFolder] };
}
