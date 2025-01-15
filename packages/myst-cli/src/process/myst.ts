import { mystParse } from 'myst-parser';
import { buttonRole } from 'myst-ext-button';
import { cardDirective } from 'myst-ext-card';
import { gridDirectives } from 'myst-ext-grid';
import { proofDirective } from 'myst-ext-proof';
import { exerciseDirectives } from 'myst-ext-exercise';
import { tabDirectives } from 'myst-ext-tabs';
import { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import { logMessagesFromVFile } from '../utils/logging.js';
import type { GenericParent } from 'myst-common';

/**
 * Boiled-down options for parseMyst
 *
 * These options are far simpler than the extensive options allowed
 * if myst-parser and markdown-it are used directly.
 */
type Options = {
  ignoreFrontmatter?: boolean;
};

/**
 * Parse MyST content using the full suite of built-in directives, roles, and plugins
 *
 * @param session session with logging
 * @param content Markdown content to parse
 * @param file path to file containing content
 */
export function parseMyst(
  session: ISession,
  content: string,
  file: string,
  opts?: Options,
): GenericParent {
  const vfile = new VFile();
  vfile.path = file;
  const parsed = mystParse(content, {
    markdownit: { linkify: true },
    directives: [
      cardDirective,
      ...gridDirectives,
      proofDirective,
      ...exerciseDirectives,
      ...tabDirectives,
      ...(session.plugins?.directives ?? []),
    ],
    extensions: {
      frontmatter: !opts?.ignoreFrontmatter,
    },
    roles: [buttonRole, ...(session.plugins?.roles ?? [])],
    vfile,
  });
  logMessagesFromVFile(session, vfile);
  return parsed;
}
