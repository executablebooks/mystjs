import fs from 'node:fs';
import path from 'node:path';
import type { RootContent } from 'mdast';
import { createDocFromState, DocxSerializer, writeDocx } from 'myst-to-docx';
import { tic, writeFileToFolder } from 'myst-cli-utils';
import {
  FRONTMATTER_ALIASES,
  PAGE_FRONTMATTER_KEYS,
  PROJECT_FRONTMATTER_KEYS,
  validateProjectFrontmatter,
} from 'myst-frontmatter';
import type { RendererDoc } from 'myst-templates';
import MystTemplate from 'myst-templates';
import { htmlTransform } from 'myst-transforms';
import { fileError, fileWarn, RuleId, TemplateKind, type GenericNode } from 'myst-common';
import { selectAll } from 'unist-util-select';
import { filterKeys } from 'simple-validators';
import { VFile } from 'vfile';
import { frontmatterValidationOpts } from '../../frontmatter.js';
import { finalizeMdast } from '../../process/mdast.js';
import type { ISession } from '../../session/types.js';
import type { RendererData } from '../../transforms/types.js';
import { createTempFolder } from '../../utils/createTempFolder.js';
import { logMessagesFromVFile } from '../../utils/logging.js';
import { ImageExtensions } from '../../utils/resolveExtension.js';
import type { ExportFnOptions, ExportResults, ExportWithOutput } from '../types.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { getFileContent } from '../utils/getFileContent.js';
import { createFooter } from './footers.js';
import { createArticleTitle, createReferenceTitle } from './titles.js';

const DOCX_IMAGE_EXTENSIONS = [ImageExtensions.png, ImageExtensions.jpg, ImageExtensions.jpeg];

function defaultWordRenderer(
  session: ISession,
  data: RendererData,
  doc: RendererDoc,
  opts: Record<string, any>,
  staticPath: string,
  vfile: VFile,
) {
  const { mdast, frontmatter, references } = data;
  const frontmatterNodes = createArticleTitle(
    frontmatter.title,
    frontmatter.authors,
  ) as RootContent[];
  const serializer = new DocxSerializer(
    vfile,
    {
      getImageBuffer(image: string) {
        // This extra read somehow prevents an error when buffer-image-size tries to get image dimensions...
        fs.readFileSync(image);
        return Buffer.from(fs.readFileSync(image).buffer);
      },
      useFieldsForCrossReferences: false,
    },
    frontmatter,
  );
  frontmatterNodes.forEach((node) => {
    serializer.render(node as GenericNode);
  });
  serializer.renderChildren(mdast);
  const referencesDocStates = Object.values(references.cite?.data ?? {})
    .map(({ html }) => html)
    .sort((a, b) => a.localeCompare(b))
    .map((html) => {
      return { type: 'html', value: html };
    });
  if (referencesDocStates.length > 0) {
    serializer.render(createReferenceTitle());
    const referencesRoot = htmlTransform({ type: 'root', children: referencesDocStates as any });
    serializer.renderChildren(referencesRoot);
  }
  selectAll('footnoteDefinition', mdast).forEach((footnote) => {
    serializer.render(footnote as GenericNode);
  });
  const logo = path.join(staticPath, 'logo.png');
  const docfooter = fs.existsSync(logo) && !opts.hideFooter ? createFooter(logo) : undefined;
  const styles = path.join(staticPath, 'styles.xml');
  const docstyles = fs.existsSync(styles) ? fs.readFileSync(styles).toString() : undefined;
  return createDocFromState(serializer, docfooter, docstyles);
}

export async function runWordExport(
  session: ISession,
  file: string,
  exportOptions: ExportWithOutput,
  opts?: ExportFnOptions,
): Promise<ExportResults> {
  const { output, articles } = exportOptions;
  const { clean, projectPath, extraLinkTransformers, execute } = opts ?? {};
  // At this point, export options are resolved to contain one-and-only-one article
  const article = articles[0];
  if (!article?.file) return { tempFolders: [] };
  if (clean) cleanOutput(session, output);
  const vfile = new VFile();
  vfile.path = output;
  const imageWriteFolder = createTempFolder(session);
  const [data] = await getFileContent(session, [article.file], {
    projectPath,
    imageExtensions: DOCX_IMAGE_EXTENSIONS,
    extraLinkTransformers,
    preFrontmatters: [
      filterKeys(article, [...PAGE_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
    ],
    execute,
  });
  const mystTemplate = new MystTemplate(session, {
    kind: TemplateKind.docx,
    template: exportOptions.template || undefined,
    buildDir: session.buildPath(),
    errorLogFn: (message: string) => {
      fileError(vfile, message, { ruleId: RuleId.docxRenders });
    },
    warningLogFn: (message: string) => {
      fileWarn(vfile, message, { ruleId: RuleId.docxRenders });
    },
  });
  await mystTemplate.ensureTemplateExistsOnPath();
  const toc = tic();

  const exportFrontmatter = validateProjectFrontmatter(
    filterKeys(exportOptions, [...PROJECT_FRONTMATTER_KEYS, ...Object.keys(FRONTMATTER_ALIASES)]),
    frontmatterValidationOpts(vfile),
  );
  logMessagesFromVFile(session, vfile);
  data.frontmatter = { ...data.frontmatter, ...exportFrontmatter };
  const { options, doc } = mystTemplate.prepare({
    frontmatter: data.frontmatter,
    parts: {},
    options: { ...data.frontmatter.options, ...exportOptions },
    sourceFile: file,
  });
  const renderer = exportOptions.renderer ?? defaultWordRenderer;
  await finalizeMdast(session, data.mdast, data.frontmatter, article.file, {
    imageWriteFolder,
    imageExtensions: DOCX_IMAGE_EXTENSIONS,
    simplifyFigures: true,
  });
  const docx = renderer(session, data, doc, options, mystTemplate.templatePath, vfile);
  logMessagesFromVFile(session, vfile);
  await writeDocx(docx, (buffer) => writeFileToFolder(output, buffer));
  session.log.info(toc(`📄 Exported DOCX in %s, copying to ${output}`));
  return { tempFolders: [imageWriteFolder] };
}
