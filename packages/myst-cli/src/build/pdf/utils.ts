import { makeExecutable, silentLogger } from 'myst-cli-utils';
import which from 'which';
import type { ISession } from '../../session/types.js';

export function isLatexmkAvailable() {
  return which.sync('latexmk', { nothrow: true });
}

export function isTectonicAvailable() {
  return which.sync('tectonic', { nothrow: true });
}

export function isMakeglossariesAvailable() {
  return which.sync('makeglossaries', { nothrow: true });
}

export function isTlmgrAvailable() {
  return which.sync('tlmgr', { nothrow: true });
}

export async function searchForPackage(
  session: ISession,
  sty: string,
  opts?: { cwd?: string },
): Promise<string[] | undefined> {
  if (!isTlmgrAvailable()) {
    session.log.warn('tlmgr is not available, unable to search for LaTeX packages.');
    return;
  }
  const searchCommand = `tlmgr search --global --file "/${sty}"`;
  const log = silentLogger();
  session.log.debug(`Running command to search for package: "${sty}":\n\n    ${searchCommand}\n\n`);
  try {
    const result = await makeExecutable(searchCommand, log, opts)();
    session.log.debug(result);
    const libs = result.match(/\n([^\s]*):\n/g)?.map((p) => p.trim().slice(0, -1));
    return libs;
  } catch (error) {
    session.log.debug('Error searching for LaTeX packages from tlmgr');
    return undefined;
  }
}
