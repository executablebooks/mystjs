import chalk from 'chalk';
import type { Position } from 'unist';
import type { ISession } from '../session/types.js';
import { warnings } from '../store/reducers.js';
import type { WarningKind } from '../store/types.js';
import { selectCurrentProjectConfig } from '../store/selectors.js';

export function addWarningForFile(
  session: ISession,
  file: string | undefined | null,
  message: string,
  severity: WarningKind = 'warn',
  opts?: {
    note?: string | null;
    url?: string | null;
    position?: Position;
    ruleId?: string | null;
    /** This key can be combined with the ruleId to suppress a warning */
    key?: string | null;
  },
) {
  const line = opts?.position?.start.line ? `:${opts?.position.start.line}` : '';
  const column =
    opts?.position?.start.column && opts?.position?.start.column > 1
      ? `:${opts?.position.start.column}`
      : '';

  const note = opts?.note ? `\n   ${chalk.reset.dim(opts.note)}` : '';
  const url = opts?.url ? chalk.reset.dim(`\n   See also: ${opts.url}\n`) : '';
  const prefix = file ? `${file}${line}${column} ` : '';
  const formatted = `${message}${note}${url}`;
  if (opts?.ruleId) {
    const config = selectCurrentProjectConfig(session.store.getState());
    const handler = config?.error_rules?.find((rule) => {
      if (rule.key) {
        return rule.id === opts.ruleId && rule.key === opts.key;
      }
      return rule.id === opts.ruleId;
    });
    if (handler) {
      if (handler.severity === 'ignore') {
        session.log.debug(`${prefix}${formatted}`);
        return;
      }
      severity = (handler.severity as WarningKind) ?? severity;
    }
  }
  switch (severity) {
    case 'info':
      session.log.info(`ℹ️  ${prefix}${formatted}`);
      break;
    case 'error':
      session.log.error(`⛔️ ${prefix}${formatted}`);
      break;
    case 'warn':
      session.log.warn(`⚠️  ${prefix}${formatted}`);
      break;
    case 'debug':
    default:
      session.log.debug(`${prefix}${formatted}`);
      break;
  }
  if (opts?.ruleId) {
    session.log.debug(
      `To suppress this message, add rule: "${opts.ruleId}"${opts.key ? ` with key: "${opts.key}"` : ''} to "error_rules" in your project config`,
    );
  }
  if (file) {
    session.store.dispatch(
      warnings.actions.addWarning({
        file,
        message,
        kind: severity,
        url: opts?.url,
        note: opts?.note,
        position: opts?.position,
        ruleId: opts?.ruleId,
      }),
    );
  }
}
