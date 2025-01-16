import type { Parent } from 'mdast';

import { upgrade as upgrade1To2 } from './version_1_2.js';

export function upgrade(from: string, to: string, ast: Parent): void {
  if (from === '1' && to === '2') {
    upgrade1To2(ast);
    return;
  } else if (to === from) {
    return;
  } else {
    throw new Error(`Unable to upgrade between ${from} and ${to}`);
  }
}
export { upgrade1To2 };
