import { Command, Option } from 'commander';
import { Session, clean } from 'myst-cli';
import { clirun } from './clirun.js';
import {
  makeAllOption,
  makeDocxOption,
  makeHtmlOption,
  makeJatsOption,
  makeMdOption,
  makeMecaOptions,
  makePdfOption,
  makeSiteOption,
  makeTexOption,
  makeTypstOption,
  makeExecuteOption,
  makeYesOption,
  makeLogsOption,
  makeCacheOption,
} from './options.js';

export function makeTempOption() {
  return new Option(
    '--temp',
    'Delete the _build/temp folder where intermediate build artifacts are saved',
  ).default(false);
}

export function makeExportsOption() {
  return new Option(
    '--exports',
    'Delete the _build/exports folder where exports are saved by default',
  ).default(false);
}

export function makeTemplatesOption() {
  return new Option(
    '--templates',
    'Delete the _build/templates folder where downloaded templates are saved',
  ).default(false);
}

export function makeCleanCommand() {
  const command = new Command('clean')
    .description('Remove exports, temp files and installed templates')
    .argument('[files...]', 'list of files to clean corresponding outputs')
    .addOption(makePdfOption('Clean PDF output'))
    .addOption(makeTexOption('Clean LaTeX outputs'))
    .addOption(makeTypstOption('Clean typst output'))
    .addOption(makeDocxOption('Clean Docx output'))
    .addOption(makeMdOption('Clean MD output'))
    .addOption(makeJatsOption('Clean JATS xml output'))
    .addOption(makeMecaOptions('Clean MECA zip output'))
    .addOption(makeSiteOption('Clean MyST site content'))
    .addOption(makeHtmlOption('Clean static HTML site content'))
    .addOption(makeExecuteOption('Clean execute cache'))
    .addOption(makeTempOption())
    .addOption(makeLogsOption('Clean CLI logs'))
    .addOption(makeCacheOption('Clean web request cache'))
    .addOption(makeExportsOption())
    .addOption(makeTemplatesOption())
    .addOption(
      makeAllOption('Delete all exports, site content, templates, and temp files created by MyST'),
    )
    .addOption(makeYesOption());
  return command;
}

export function makeCleanCLI(program: Command) {
  const command = makeCleanCommand().action(clirun(Session, clean, program));
  return command;
}
