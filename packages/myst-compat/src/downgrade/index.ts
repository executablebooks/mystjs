import type { Parent } from 'mdast';

import { downgrade as downgrade2To1 } from './version_2_1.js';

export function downgrade(from: string, to: string, ast: Parent): void {
  if (to === '1' && from === '2') {
    downgrade2To1(ast);
    return;
  } else if (to === from) {
    return;
  } else {
    throw new Error(`Unable to downgrade between ${from} and ${to}`);
  }
}

export { downgrade2To1 };
