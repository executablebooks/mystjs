import fs from 'node:fs';
import type { Response } from 'node-fetch';
import { Inventory } from 'intersphinx';
import { tic, isUrl, computeHash } from 'myst-cli-utils';
import { RuleId, fileError } from 'myst-common';
import type { ExternalReference } from 'myst-frontmatter';
import type { MystXRefs, ResolvedExternalReference } from 'myst-transforms';
import { VFile } from 'vfile';
import {
  cachePath,
  castSession,
  checkCache,
  loadFromCache,
  writeToCache,
} from '../session/cache.js';
import type { ISession } from '../session/types.js';
import { selectors } from '../store/index.js';
import { XREF_MAX_AGE, mystXRefsCacheFilename } from '../transforms/crossReferences.js';
import { dirname } from 'node:path';

function sphinxInventoryCacheFilename(path: string) {
  return `xrefs-intersphinx-${computeHash(path)}.inv`;
}

async function preloadReference(session: ISession, key: string, reference: ExternalReference) {
  const ref: ResolvedExternalReference = {
    key,
    url: reference.url,
    kind: reference.kind,
  };
  const toc = tic();
  const mystXRefFilename = mystXRefsCacheFilename(reference.url);
  const mystXRefData = loadFromCache(session, mystXRefFilename, {
    maxAge: XREF_MAX_AGE,
  });
  const intersphinxFilename = sphinxInventoryCacheFilename(reference.url);
  if ((!ref.kind || ref.kind === 'myst') && !!mystXRefData) {
    session.log.debug(`Loading cached inventory file for ${reference.url}: ${mystXRefFilename}`);
    const xrefs = JSON.parse(mystXRefData);
    session.log.info(
      toc(`🏫 Read ${xrefs.references.length} myst references for "${key}" in %s (cached).`),
    );
    ref.kind = 'myst';
    ref.value = xrefs;
  } else if (
    (!ref.kind || ref.kind === 'intersphinx') &&
    checkCache(session, intersphinxFilename, { maxAge: XREF_MAX_AGE })
  ) {
    const inventory = new Inventory({ id: key, path: reference.url });
    const localInventory = new Inventory({
      id: key,
      path: cachePath(session, intersphinxFilename),
    });
    session.log.debug(`Loading cached inventory file for ${reference.url}: ${intersphinxFilename}`);
    await localInventory.load();
    inventory.project = localInventory.project;
    inventory.version = localInventory.version;
    inventory.data = localInventory.data;
    inventory._loaded = true;
    session.log.info(
      toc(`🏫 Read ${inventory.numEntries} intersphinx references for "${key}" in %s (cached).`),
    );
    ref.kind = 'intersphinx';
    ref.value = inventory;
  }
  return ref;
}

async function loadReference(
  session: ISession,
  vfile: VFile,
  reference: ResolvedExternalReference,
) {
  if (reference.kind === 'myst' && reference.value) {
    return reference;
  }
  if (reference.kind === 'intersphinx' && (reference.value as Inventory)?._loaded) {
    return reference;
  }
  if (!reference.kind || reference.kind === 'myst') {
    const mystXRefsUrl = `${reference.url}/myst.xref.json`;
    session.log.debug(`Attempting to load MyST xref file: ${mystXRefsUrl}`);
    const toc = tic();
    let mystXRefsResp: Response | undefined;
    try {
      mystXRefsResp = await session.fetch(mystXRefsUrl);
    } catch {
      session.log.debug(`Request to ${mystXRefsUrl} failed`);
    }
    if (mystXRefsResp?.status === 200) {
      reference.kind = 'myst';
      const mystXRefs = (await mystXRefsResp?.json()) as MystXRefs;
      session.log.debug(`Saving remote myst xref file to cache: ${reference.url}`);
      writeToCache(session, mystXRefsCacheFilename(reference.url), JSON.stringify(mystXRefs));
      reference.value = mystXRefs;
      session.log.info(
        toc(`🏫 Read ${mystXRefs.references.length} myst references for "${reference.key}" in %s.`),
      );
      return reference;
    } else if (reference.kind === 'myst') {
      fileError(vfile, `Problem fetching references entry: ${reference.key} (${mystXRefsUrl})`, {
        ruleId: RuleId.intersphinxReferencesResolve,
      });
      return;
    } else {
      session.log.debug(`Unable to load reference "${reference.key}" as MyST cross-references`);
    }
  }
  if (!reference.kind || reference.kind === 'intersphinx') {
    const inventory = new Inventory({ id: reference.key, path: reference.url });
    const toc = tic();
    try {
      session.log.debug(`Attempting to load inventory file ${inventory.path}/objects.inv`);
      await inventory.load();
    } catch (error) {
      if (reference.kind === 'intersphinx') {
        session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
        fileError(vfile, `Problem fetching references entry: ${inventory.id} (${inventory.path})`, {
          ruleId: RuleId.intersphinxReferencesResolve,
        });
      } else {
        session.log.debug(`Unable to load reference "${reference.key}" as intersphinx`);
      }
      return;
    }
    reference.kind = 'intersphinx';
    reference.value = inventory;
    if (inventory.id && inventory.path && isUrl(inventory.path)) {
      const intersphinxPath = cachePath(session, sphinxInventoryCacheFilename(inventory.path));
      if (!fs.existsSync(intersphinxPath)) {
        session.log.debug(`Saving remote inventory file to cache: ${inventory.path}`);
        fs.mkdirSync(dirname(intersphinxPath), { recursive: true });
        inventory.write(intersphinxPath);
      }
    }
    session.log.info(
      toc(`🏫 Read ${inventory.numEntries} intersphinx references for "${inventory.id}" in %s.`),
    );
    return reference;
  }
  fileError(vfile, `Unable to resolve references: ${reference.key} (${reference.url})`, {
    ruleId: RuleId.intersphinxReferencesResolve,
  });
}

/**
 * Load MyST and intersphinx references from project frontmatter
 *
 * @param session session with logging
 * @param opts loading options
 */
export async function loadReferences(
  session: ISession,
  opts: { projectPath: string },
): Promise<void[]> {
  const state = session.store.getState();
  const projectConfig = selectors.selectLocalProjectConfig(state, opts.projectPath);
  const configFile = selectors.selectLocalConfigFile(state, opts.projectPath);
  // A bit confusing here, references is the frontmatter, but those are `externalReferences`
  if (!projectConfig?.references || !configFile) return [];
  const vfile = new VFile();
  vfile.path = configFile;
  const cache = castSession(session);
  const references = await Promise.all(
    Object.entries(projectConfig.references)
      .map(async ([key, val]) => {
        if (!cache.$externalReferences[key]) {
          cache.$externalReferences[key] = await preloadReference(session, key, val);
        }
        return cache.$externalReferences[key];
      })
      .filter((exists) => !!exists),
  );
  return Promise.all(
    references.map(async (ref) => {
      await loadReference(session, vfile, ref);
    }),
  );
}
