import { downgrade } from './downgrade/index.js';
import { upgrade } from './upgrade/index.js';
import type { Parent } from 'mdast';

export function makeCompatible(from: string, to: string, ast: Parent) {
  const fromVersion = parseInt(from);
  const toVersion = parseInt(to);

  if (fromVersion === toVersion) {
    return;
  } else if (fromVersion < toVersion) {
    upgrade(from, to, ast);
    return;
  } else {
    downgrade(from, to, ast);
    return;
  }
}

export { downgrade, upgrade };
