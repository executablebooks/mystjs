import fs from 'node:fs';
import path from 'node:path';
import type { ISession, ISessionWithCache } from './types.js';
import { writeFileToFolder } from 'myst-cli-utils';

/**
 * Cast session to include in-memory cache
 */
export function castSession(session: ISession): ISessionWithCache {
  const cache = session as unknown as ISessionWithCache;
  if (!cache.$citationRenderers) cache.$citationRenderers = {};
  if (!cache.$doiRenderers) cache.$doiRenderers = {};
  if (!cache.$externalReferences) cache.$externalReferences = {};
  if (!cache.$mdast) cache.$mdast = {};
  if (!cache.$outputs) cache.$outputs = {};
  cache.$setMdast = (file, data) => {
    cache.$mdast[path.resolve(file)] = data;
  };
  cache.$getMdast = (file) => {
    return cache.$mdast[path.resolve(file)];
  };
  return cache;
}

export function cachePath(session: ISession, filename: string) {
  return path.join(session.buildPath(), 'cache', filename);
}

/**
 * Write data to file on-disk cache
 */
export function writeToCache(
  session: ISession,
  filename: string,
  data: string | NodeJS.ArrayBufferView,
) {
  const file = cachePath(session, filename);
  session.log.debug(`Writing cache file: ${file}`);
  writeFileToFolder(file, data);
}

/**
 * Return true if cache file exists and is not expired
 */
export function checkCache(session: ISession, filename: string, opts?: { maxAge?: number }) {
  const file = cachePath(session, filename);
  if (!fs.existsSync(file)) {
    session.log.debug(`Cache file not found: ${file}`);
    return false;
  }
  const { ctimeMs } = fs.lstatSync(file);
  const age = (Date.now() - ctimeMs) / (1000 * 60 * 60 * 24);
  if (opts?.maxAge != null && age > opts.maxAge) {
    session.log.debug(
      `Cache file has expired (age: ${age.toFixed(3)} days, max: ${opts.maxAge} days): ${file}`,
    );
    return false;
  }
  return true;
}

/**
 * Load data from file on-disk cache
 *
 * If cache file is older than opts.maxAge, in days, it is ignored.
 */
export function loadFromCache(session: ISession, filename: string, opts?: { maxAge?: number }) {
  if (!checkCache(session, filename, opts)) return;
  const file = cachePath(session, filename);
  session.log.debug(`Loading cache file: ${file}`);
  return fs.readFileSync(file).toString();
}
