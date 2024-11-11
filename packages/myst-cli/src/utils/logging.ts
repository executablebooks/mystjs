import type { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import type { WarningKind } from '../store/types.js';
import { addWarningForFile } from './addWarningForFile.js';
import { writeFileToFolder } from 'myst-cli-utils';
import { join } from 'node:path';

export function logMessagesFromVFile(session: ISession, file?: VFile): void {
  if (!file) return;
  file.messages.forEach((message) => {
    const kind: WarningKind =
      message.fatal === null ? 'info' : message.fatal === false ? 'warn' : 'error';
    addWarningForFile(session, file.path, message.message, kind, {
      // TODO: does this logic make sense, or should we support `place`?
      position: message.place
        ? 'start' in message.place
          ? message.place
          : { start: message.place, end: message.place }
        : undefined,
      note: message.note,
      url: message.url,
      ruleId: message.ruleId,
    });
  });
  file.messages = [];
}

export function writeJsonLogs(session: ISession, name: string, logData: Record<string, any>) {
  const seen = new WeakSet();
  const data = JSON.stringify(
    logData,
    function (_, value) {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    },
    2,
  );
  writeFileToFolder(join(session.buildPath(), 'logs', name), data);
}
