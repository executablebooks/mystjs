import path from 'node:path';
import type MystTemplate from 'myst-templates';
import { createCommand } from '../utils.js';
import which from 'which';

export function isLatexmkAvailable() {
  return which.sync('latexmk', { nothrow: true });
}

export function isTectonicAvailable() {
  return which.sync('tectonic', { nothrow: true });
}

export function pdfTexExportCommand(
  texFile: string,
  logFile: string,
  template?: MystTemplate,
): string {
  const templateYml = template?.getValidatedTemplateYml();
  // Use Tectonic by default (https://tectonic-typesetting.github.io)
  let baseCommand = `tectonic -X compile --keep-intermediates --keep-logs ${texFile}`;
  // Alternatively, switch to Latexmk with xelatex
  if (!isTectonicAvailable() && isLatexmkAvailable()) {
    const engine = templateYml?.build?.engine ?? '-xelatex';
    baseCommand = `latexmk -f ${engine} -synctex=1 -interaction=batchmode -file-line-error -latexoption="-shell-escape" ${texFile}`;
  }
  return createCommand(baseCommand, logFile);
}

export function texMakeGlossariesCommand(texFile: string, logFile: string): string {
  const fileNameNoExt = path.basename(texFile, '.tex');
  const baseCommand = `makeglossaries ${fileNameNoExt}`;

  return createCommand(baseCommand, logFile);
}
