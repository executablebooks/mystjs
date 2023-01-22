import chalk from 'chalk';
import fs from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { Command } from 'commander';
import { clirun } from './clirun';
import { tic } from 'myst-cli-utils';
import type { TemplateYmlResponse } from 'myst-templates';
import {
  downloadTemplate,
  fetchPublicTemplate,
  listPublicTemplates,
  resolveInputs,
  TEMPLATE_YML,
} from 'myst-templates';
import type { ISession } from '../session';
import { Session } from '../session';
import {
  makeDocxOption,
  makeForceOption,
  makePdfOption,
  makeSiteOption,
  makeTexOption,
} from './options';
import { TemplateKind } from 'myst-common';

type TemplateKinds = { pdf?: boolean; tex?: boolean; docx?: boolean; site?: boolean };

const allTemplates = [TemplateKind.tex, TemplateKind.docx, TemplateKind.site];

function getKindFromName(name: string) {
  return name.match(/^(tex|docx|site)\//)?.[1] ?? undefined;
}
function getKind(session: ISession, kinds?: TemplateKinds): TemplateKind[] | undefined {
  if (!kinds) return undefined;
  const { pdf, tex, docx, site } = kinds;
  if (pdf) session.log.warn('PDF templates are currently using "tex"');
  const flags = {
    [TemplateKind.tex]: (tex || pdf) ?? false,
    [TemplateKind.docx]: docx ?? false,
    [TemplateKind.site]: site ?? false,
  };
  const filteredKinds = Object.entries(flags)
    .filter(([, v]) => !!v)
    .map(([k]) => k);
  if (!filteredKinds || filteredKinds.length === 0) return undefined;
  return filteredKinds as TemplateKind[];
}

export async function downloadTemplateCLI(
  session: ISession,
  template: string,
  path?: string,
  opts?: TemplateKinds & { force?: true },
) {
  const templateKind = getKindFromName(template);
  const kinds = templateKind ? [templateKind] : getKind(session, opts);
  if (!kinds || kinds.length > 1) {
    throw new Error('Cannot lookup a template with more than one kind.');
  }
  const kind = kinds[0] as TemplateKind;
  const { templatePath: defaultTemplatePath, templateUrl } = resolveInputs(session, {
    template,
    kind,
    buildDir: session.buildPath(),
  });
  const templatePath = path || defaultTemplatePath;
  if (!templateUrl) {
    throw new Error(`Unresolved template URL for "${template}"`);
  }
  if (fs.existsSync(templatePath)) {
    if (!opts?.force) {
      session.log.error(`The template download path already exists: "${templatePath}"`);
      process.exit(1);
    }
    session.log.info(`🗑  Deleting path ${templatePath} due to "force" option`);
    fs.rmSync(templatePath, { recursive: true });
  }
  await downloadTemplate(session, { templatePath, templateUrl });
}

export async function listTemplatesCLI(
  session: ISession,
  name?: string,
  opts?: { tag?: string } & TemplateKinds,
) {
  const toc = tic();
  const kinds = getKind(session, opts);
  if (name) {
    if (kinds && kinds?.length > 1) {
      throw new Error('Cannot lookup a template with more than one kind.');
    }
    const isLocal = fs.existsSync(name)
      ? name.endsWith('.yml')
        ? name
        : join(name, TEMPLATE_YML)
      : false;
    // Load the template from disk or remotely
    const template = isLocal
      ? (yaml.load(fs.readFileSync(isLocal).toString()) as TemplateYmlResponse)
      : await fetchPublicTemplate(session, name, kinds?.[0]);
    if (!template.id) template.id = name;
    session.log.debug(toc(`Found ${template.id} template in %s`));
    session.log.info(
      `${chalk.bold.green((template.title ?? '').padEnd(25))}${chalk.bold.blueBright(
        template.id.replace(/^(tex|site|docx)\//, '').replace(/^myst\//, ''),
      )}`,
    );
    session.log.info(`ID: ${chalk.dim(template.id)}\nVersion: ${chalk.dim(template.version)}`);
    session.log.info(`Authors: ${chalk.dim(template.authors?.map((a) => a.name).join(', '))}`);
    session.log.info(`Description: ${chalk.dim(template.description)}`);
    session.log.info(`Tags: ${chalk.dim(template.tags?.join(', '))}`);
    session.log.info(chalk.bold.blueBright(`\nParts:`));
    template.parts?.map((p) =>
      session.log.info(
        `${chalk.cyan(p.id)}${p.required ? chalk.dim(' (required)') : ''} - ${p.description
          ?.trim()
          .replace(/\n/g, '\n\t')}`,
      ),
    );
    session.log.info(chalk.bold.blueBright(`\nOptions:`));
    template.options?.map((p) =>
      session.log.info(
        `${chalk.cyan(p.id)} (${p.type})${
          p.required ? chalk.dim(' (required)') : ''
        } - ${p.description?.trim().replace(/\n/g, '\n\t')}`,
      ),
    );
    return;
  }
  const templates = await listPublicTemplates(session, kinds ?? allTemplates);
  let filtered = templates;
  if (opts?.tag) {
    const tags = opts.tag.split(',').map((t) => t.trim());
    filtered = templates.filter((t) => {
      const templateTags = new Set(t.tags);
      const intersection = tags.filter((x) => templateTags.has(x));
      return intersection.length > 0;
    });
  }
  session.log.debug(
    toc(
      `Found ${templates.length} templates in %s${
        opts?.tag ? `, filtered by ${opts?.tag} to ${filtered.length}` : ''
      }`,
    ),
  );
  if (filtered.length === 0) {
    session.log.error(
      `No templates found for kinds "${(kinds ?? allTemplates).join(', ')}"${
        opts?.tag ? ` and tag "${opts.tag}"` : ''
      }`,
    );
    process.exit(1);
  }
  filtered.forEach((template) => {
    session.log.info(
      `\n${chalk.bold.green((template.title ?? '').padEnd(25))}${chalk.bold.blueBright(
        template.id.replace(/^tex\//, '').replace(/^myst\//, ''),
      )}\nDescription: ${chalk.dim(template.description)}\nTags: ${chalk.dim(
        template.tags?.join(', '),
      )}`,
    );
  });
}

function makeDownloadCLI(program: Command) {
  const command = new Command('download')
    .description('Download a public template to a path')
    .argument('<template>', 'The template URL or name')
    .argument('[path]', 'A folder to download and unzip the template to')
    .addOption(makePdfOption('Download PDF template'))
    .addOption(makeTexOption('Download LaTeX template'))
    .addOption(makeDocxOption('Download Docx template'))
    .addOption(makeSiteOption('Download Site template'))
    .addOption(makeForceOption())
    .action(clirun(Session, downloadTemplateCLI, program));
  return command;
}

function makeListCLI(program: Command) {
  const command = new Command('list')
    .description('List, filter or lookup details on public templates')
    .argument('[name]', 'The optional name to list about a specific template')
    .addOption(makePdfOption('List PDF templates'))
    .addOption(makeTexOption('List LaTeX templates'))
    .addOption(makeDocxOption('List Docx templates'))
    .addOption(makeSiteOption('List Site templates'))
    .option(
      '--tag <tag>',
      'Any tags to filter the list by multiple tags can be joined with a comma.',
    )
    .action(clirun(Session, listTemplatesCLI, program));
  return command;
}

export function makeTemplatesCLI(program: Command) {
  const command = new Command('templates')
    .description('List and download templates')
    .addCommand(makeListCLI(program))
    .addCommand(makeDownloadCLI(program));
  return command;
}
