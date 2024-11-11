import type { Position } from 'unist';

export type ExternalLinkResult = {
  url: string;
  ok?: boolean;
  skipped?: boolean;
  status?: number;
  statusText?: string;
};

export type WarningKind = 'error' | 'warn' | 'info' | 'debug';

export type BuildWarning = {
  message: string;
  kind: WarningKind;
  note?: string | null;
  url?: string | null;
  position?: Position;
  ruleId?: string | null;
};

export type ValidatedRawConfig = {
  site?: Record<string, any>;
  project?: Record<string, any>;
  extend?: string[];
};
