import type { CitationRenderer } from 'citation-js-utils';
import type { Logger } from 'myst-cli-utils';
import type { MystPlugin, RuleId, ValidatedMystPlugin } from 'myst-common';
import type { ResolvedExternalReference, ReferenceState } from 'myst-transforms';
import type { MinifiedContentCache } from 'nbtx';
import type { Store } from 'redux';
import type { RequestInfo, RequestInit, Response } from 'node-fetch';
import type { Limit } from 'p-limit';
import type { BuildWarning, RootState } from '../store/index.js';
import type { PreRendererData, RendererData, SingleCitationRenderer } from '../transforms/types.js';
import type { SessionManager } from '@jupyterlab/services';
import type MystTemplate from 'myst-templates';

export type ISession = {
  API_URL: string;
  configFiles: string[];
  store: Store<RootState>;
  log: Logger;
  doiLimiter: Limit;
  reload(): Promise<ISession>;
  clone(): Promise<ISession>;
  sourcePath(): string;
  buildPath(): string;
  sitePath(): string;
  contentPath(): string;
  publicPath(): string;
  showUpgradeNotice(): void;
  plugins: ValidatedMystPlugin | undefined;
  loadPlugins(): Promise<MystPlugin>;
  getAllWarnings(ruleId: RuleId): (BuildWarning & { file: string })[];
  jupyterSessionManager(): Promise<SessionManager | undefined>;
  dispose(): void;
  fetch(url: URL | RequestInfo, init?: RequestInit): Promise<Response>;
};

export type ISessionWithCache = ISession & {
  $citationRenderers: Record<string, CitationRenderer>; // keyed on path
  $doiRenderers: Record<string, SingleCitationRenderer>; // keyed on doi
  $externalReferences: Record<string, ResolvedExternalReference>; // keyed on id
  $mdast: Record<string, { sha256?: string; pre: PreRendererData; post?: RendererData }>; // keyed on path
  $siteTemplate: MystTemplate;
  $outputs: MinifiedContentCache;
  /** Method to get $mdast value with normalized path */
  $getMdast(
    file: string,
  ): { sha256?: string; pre: PreRendererData; post?: RendererData } | undefined;
  /** Method to set $mdast value with normalized path */
  $setMdast(
    file: string,
    data: { sha256?: string; pre: PreRendererData; post?: RendererData },
  ): void;
};
