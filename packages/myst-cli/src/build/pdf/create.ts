import fs from 'node:fs';
import path from 'node:path';
import util from 'util';
import chalk from 'chalk';
import { pdfTexExportCommand, texMakeGlossariesCommand } from 'jtex';
import { exec, tic } from 'myst-cli-utils';
import { RuleId, TemplateKind, fileError, fileWarn } from 'myst-common';
import MystTemplate from 'myst-templates';
import { VFile } from 'vfile';
import { docLinks } from '../../docs.js';
import type { ISession } from '../../session/types.js';
import type { ExportResults, ExportWithOutput } from '../types.js';
import { uniqueArray } from '../../utils/uniqueArray.js';
import { logMessagesFromVFile } from '../../utils/logging.js';
import { createTempFolder } from '../../utils/createTempFolder.js';
import { cleanOutput } from '../utils/cleanOutput.js';
import { isTectonicAvailable, isLatexmkAvailable, isMakeglossariesAvailable } from './utils.js';

const copyFile = util.promisify(fs.copyFile);

function copyContents(srcFolder: string, destFolder: string) {
  fs.readdirSync(srcFolder).forEach((item) => {
    const srcItemPath = path.join(srcFolder, item);
    const destItemPath = path.join(destFolder, item);
    if (fs.lstatSync(srcItemPath).isDirectory()) {
      fs.mkdirSync(destItemPath);
      copyContents(srcItemPath, destItemPath);
    } else {
      fs.copyFileSync(srcItemPath, destItemPath);
    }
  });
}

export function getLogOutputFolder(pdfOutput: string) {
  const pdfBasename = path.basename(pdfOutput, path.extname(pdfOutput));
  return path.join(path.dirname(pdfOutput), `${pdfBasename}_pdf_logs`);
}

export function getTexOutputFolder(pdfOutput: string) {
  const pdfBasename = path.basename(pdfOutput, path.extname(pdfOutput));
  return path.join(path.dirname(pdfOutput), `${pdfBasename}_pdf_tex`);
}

export async function createPdfGivenTexExport(
  session: ISession,
  texExportOptions: ExportWithOutput,
  pdfOutput: string,
  copyLogs?: boolean,
  clean?: boolean,
  glossaries?: boolean,
): Promise<ExportResults> {
  if (clean) cleanOutput(session, pdfOutput);
  const vfile = new VFile();
  vfile.path = pdfOutput;
  const { output: texOutput, template } = texExportOptions;
  const templateLogString = `(${template ?? 'default'})`;
  const {
    buildPath,
    texFile,
    texLogFile,
    pdfBuild,
    logBuild,
    texLogBuild,
    logOutputFolder,
    logOutput,
    texLogOutput,
  } = ensurePaths(session, texOutput, pdfOutput);

  if (clean) cleanOutput(session, logOutputFolder);

  const { buildError, toc } = await runCommands(
    session,
    template,
    texFile,
    texLogFile,
    templateLogString,
    pdfBuild,
    buildPath,
    vfile,
    glossaries,
  );

  const logs = uniqueArray(
    fs
      .readFileSync(logBuild)
      .toString()
      .split('\n')
      .filter(
        (line) =>
          line.includes('WARN ') || line.includes('LaTeX Error') || line.includes('LaTeX Warning'),
      ),
    (line) => (line.indexOf('WARN') > -1 ? line.slice(line.indexOf('WARN')) : line),
  ).filter((line) => !line.includes('Unused global option')); // Remove the trivial errors

  const packageErrors = logs
    .map((line) => (line.includes('LaTeX Error') ? line.match(/`(.*)\.sty'/)?.[1] : undefined))
    .filter((sty) => !!sty)
    .map((p) => `${p}.sty`);
  session.log.debug(`Unknown style files: "${packageErrors.join('", "')}"`);

  // Here we could search for packages and install:
  // const packages = await Promise.all(
  //   packageErrors.map((sty) => searchForPackage(session, sty, { cwd: buildPath })),
  // );

  if (logs.length > 0) {
    if (buildError) {
      if (fs.existsSync(pdfBuild)) {
        session.log.info('\n   Please check your PDF, it may actually be fine? 🤷');
      } else {
        session.log.info('\n   The PDF did not compile, here are the logs:');
      }
    } else {
      session.log.info(`\n   LaTeX ${chalk.green('succeeded')} with warnings:`);
    }
    session.log.info(
      chalk.dim(
        `\n     Console:        ${texLogBuild}\n     Detailed logs:  ${logBuild}\n     Build path:     ${buildPath}\n`,
      ),
    );
    session.log.info(
      `\n     ${chalk.dim('Preview:')}\n     ${logs
        .map((line) => (line.includes('LaTeX Error') ? chalk.red(line) : chalk.yellowBright(line)))
        .join('\n     ')}\n`,
    );
  }

  const pdfBuildExists = fs.existsSync(pdfBuild);
  const logBuildExists = fs.existsSync(logBuild);
  const texLogBuildExists = fs.existsSync(texLogBuild);

  if (pdfBuildExists && !fs.existsSync(path.dirname(pdfOutput))) {
    fs.mkdirSync(path.dirname(pdfOutput), { recursive: true });
  }

  if (pdfBuildExists) {
    session.log.info(toc(`📄 Exported PDF ${templateLogString} in %s, copying to ${pdfOutput}`));
    await copyFile(pdfBuild, pdfOutput);
    session.log.debug(`Copied PDF file to ${pdfOutput}`);
  } else {
    fileError(vfile, `Could not find ${pdfBuild} as expected`, { ruleId: RuleId.pdfBuilds });
  }

  if (copyLogs) {
    if ((logBuildExists || texLogBuildExists) && !fs.existsSync(path.dirname(logOutput))) {
      fs.mkdirSync(path.dirname(logOutput), { recursive: true });
    }
    if (logBuildExists) {
      session.log.debug(`Copying log file: ${logOutput}`);
      await copyFile(logBuild, logOutput);
    }

    if (texLogBuildExists) {
      session.log.debug(`Copying log file: ${texLogOutput}`);
      await copyFile(texLogBuild, texLogOutput);
    }
  }
  logMessagesFromVFile(session, vfile);
  const logFiles = copyLogs ? [logOutput, texLogOutput] : [logBuild, texLogBuild];
  if (!fs.existsSync(pdfOutput)) {
    const err = Error(`Error exporting: ${pdfOutput}`);
    (err as any).logFiles = logFiles;
    throw err;
  }

  return { logFiles, tempFolders: [buildPath] };
}

function ensurePaths(session: ISession, texOutput: string, pdfOutput: string) {
  const buildPath = createTempFolder(session);
  const texFile = path.basename(texOutput);
  const texBuild = path.join(buildPath, texFile);
  copyContents(path.dirname(texOutput), buildPath);

  if (!fs.existsSync(texBuild)) {
    throw Error(`Error exporting: ${pdfOutput}\nCould not find tex file: ${texOutput}`);
  }

  const pdfBasename = path.basename(pdfOutput, path.extname(pdfOutput));
  const pdfFile = `${pdfBasename}.pdf`;
  const pdfBuild = path.join(buildPath, pdfFile);

  const logFile = `${pdfBasename}.log`;
  const texLogFile = `${pdfBasename}.shell.log`;
  // Temporary log file locations
  const logBuild = path.join(buildPath, logFile);
  const texLogBuild = path.join(buildPath, texLogFile);
  // Log file location saved alongside pdf
  const logOutputFolder = getLogOutputFolder(pdfOutput);
  const logOutput = path.join(logOutputFolder, logFile);
  const texLogOutput = path.join(logOutputFolder, texLogFile);

  return {
    buildPath,
    texFile,
    texLogFile,
    pdfBuild,
    logBuild,
    texLogBuild,
    logOutputFolder,
    logOutput,
    texLogOutput,
  };
}

async function runCommands(
  session: ISession,
  template: string | null | undefined,
  texFile: string,
  texLogFile: string,
  templateLogString: string,
  pdfBuild: string,
  buildPath: string,
  vfile: VFile,
  glossaries?: boolean,
) {
  const toc = tic();
  let buildError = await runPdfBuildCommand(
    session,
    texFile,
    texLogFile,
    templateLogString,
    template,
    pdfBuild,
    buildPath,
    vfile,
  );

  if (buildError || !glossaries) {
    return { buildError, toc };
  }

  // Glossaries require two more commands to be run
  buildError = await runGlossariesBuildCommand(session, texFile, texLogFile, buildPath);

  if (buildError) {
    return { buildError, toc };
  }

  buildError = await runPdfBuildCommand(
    session,
    texFile,
    texLogFile,
    templateLogString,
    template,
    pdfBuild,
    buildPath,
    vfile,
    true,
  );

  return { buildError, toc };
}

async function runPdfBuildCommand(
  session: ISession,
  texFile: string,
  texLogFile: string,
  templateLogString: string,
  template: string | null | undefined,
  pdfBuild: string,
  buildPath: string,
  vfile: VFile,
  debugLogsOnly?: boolean,
) {
  if (!(isTectonicAvailable() || isLatexmkAvailable())) {
    fileError(
      vfile,
      `⚠️  Neither "tectonic" nor "latexmk" command is available. See documentation on installing LaTeX:\n\n${docLinks.installLatex}\n${docLinks.installTectonic}`,
      { ruleId: RuleId.pdfBuildCommandsAvailable },
    );
  }

  let buildCommand: string;
  if (!template) {
    buildCommand = pdfTexExportCommand(texFile, texLogFile);
  } else {
    const mystTemplate = new MystTemplate(session, {
      kind: TemplateKind.tex,
      template: template || undefined,
      buildDir: session.buildPath(),
      errorLogFn: (message: string) => {
        fileError(vfile, message, { ruleId: RuleId.pdfBuilds });
      },
      warningLogFn: (message: string) => {
        fileWarn(vfile, message, { ruleId: RuleId.pdfBuilds });
      },
    });
    buildCommand = pdfTexExportCommand(texFile, texLogFile, mystTemplate);
  }

  let buildError = false;
  try {
    if (!debugLogsOnly) session.log.info(`🖨  Rendering PDF ${templateLogString} to ${pdfBuild}`);
    session.log.debug(`Running command:\n> ${buildCommand}`);
    await exec(buildCommand, { cwd: buildPath });
    session.log.debug(`Done building LaTeX.`);
  } catch (err) {
    session.log.debug((err as Error).stack);
    fileError(
      vfile,
      `LaTeX reported an error building your PDF ${templateLogString} for ${texFile}`,
      { ruleId: RuleId.pdfBuildsWithoutErrors },
    );
    buildError = true;
  }

  return buildError;
}

async function runGlossariesBuildCommand(
  session: ISession,
  texFile: string,
  texLogFile: string,
  buildPath: string,
) {
  if (!isMakeglossariesAvailable()) {
    session.log.error(
      `⚠️  The "makeglossaries" command is not available. See documentation on installing LaTeX:\n\n${docLinks.installLatex}`,
    );
  }

  const buildCommand = texMakeGlossariesCommand(texFile, texLogFile);

  let buildError = false;
  try {
    session.log.info(`🔖 Creating glossaries in ${buildPath}`);
    session.log.debug(`Running command:\n> ${buildCommand}`);
    await exec(buildCommand, { cwd: buildPath });
    session.log.debug(`Done building glossaries.`);
  } catch (err) {
    session.log.debug((err as Error).stack);
    session.log.error(`🛑 Command makeglossaries reported an error for ${texFile}`);
    buildError = true;
  }

  return buildError;
}
