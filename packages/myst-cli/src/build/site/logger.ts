import chalk from 'chalk';
import type { LoggerDE } from 'myst-cli-utils';
import type { ISession } from '../../session/types.js';

export function createServerLogger(session: ISession, ready: () => void): LoggerDE {
  const logger = {
    debug(data: string) {
      const line = data.trim();
      if (!line || line.startsWith('>') || line.startsWith('Watching')) return;
      if (line.includes('File changed: app/content')) return; // This is shown elsewhere
      if (line.includes('started at http://')) {
        const [, ipAndPort] = line.split('http://');
        const host =
          process.env.HOST && process.env.HOST.startsWith('http')
            ? new URL(process.env.HOST).hostname
            : process.env.HOST ?? 'localhost';
        const port = ipAndPort.split(':')[1].replace(/[^0-9]/g, '');
        const local = `http://${host}:${port}`;
        ready();
        session.log.info(
          `\n🔌 Server started on port ${port}!  🥳 🎉\n\n\n\t👉  ${chalk.green(local)}  👈\n\n`,
        );
        session.showUpgradeNotice?.();
        return;
      }
      session.log.info(
        line
          .replace(/💿/g, '🚀')
          .replace(/(GET) /, '💌 $1  ')
          .replace(/(POST) /, '📦 $1 '),
      );
    },
    error(data: string) {
      const line = data.trim();
      if (!line) return;
      // This is a spurious Remix warning https://github.com/remix-run/remix/issues/2677
      if (line.includes('is not listed in your package.json dependencies')) return;
      if (line.includes('was not found in your node_modules')) return;
      // This is the punycode deprecation warning
      if (line.includes('--trace-deprecation') || line.includes('DEP0040')) return;
      if (line.startsWith('Rebuilding')) {
        session.log.debug(line);
        return;
      }
      if (line.startsWith('Done in')) {
        session.log.info(`⚡️ ${line.replace('Done', 'Compiled')}`);
        return;
      }
      session.log.error(data);
    },
  };
  return logger;
}
