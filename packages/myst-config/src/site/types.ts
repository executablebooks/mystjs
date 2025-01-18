import type { FrontmatterParts } from 'myst-common';
import type { ExportFormats, ProjectFrontmatter, SiteFrontmatter } from 'myst-frontmatter';

export interface SiteProject {
  slug?: string;
  remote?: string;
  path?: string;
}

export interface SiteNavItem {
  title: string;
  url?: string;
  internal?: boolean;
  children?: SiteNavItem[];
  static?: boolean;
}

export interface SiteAction {
  title: string;
  url: string;
  filename?: string;
  format?: ExportFormats;
  internal?: boolean;
  static?: boolean;
}

export type SiteConfig = SiteFrontmatter & {
  projects?: SiteProject[];
  nav?: SiteNavItem[];
  actions?: SiteAction[];
  domains?: string[];
  favicon?: string;
  template?: string;
};

export type SiteExport = {
  url: string;
  filename: string;
  format?: ExportFormats;
};

type ManifestProjectItem = {
  title: string;
  short_title?: string;
  level: number;
  slug?: string;
  description?: string;
  date?: string;
  thumbnail?: string | null;
  thumbnailOptimized?: string;
  banner?: string | null;
  bannerOptimized?: string;
  tags?: string[];
  enumerator?: string;
};

type ManifestProject = {
  slug?: string;
  index: string;
  enumerator?: string;
  title: string;
  pages: ManifestProjectItem[];
  thumbnail?: string | null;
  thumbnailOptimized?: string;
  banner?: string | null;
  bannerOptimized?: string;
  tags?: string[];
  downloads?: SiteAction[];
  exports?: SiteExport[];
  parts?: FrontmatterParts;
} & Omit<ProjectFrontmatter, 'downloads' | 'exports' | 'parts'>;

export type SiteManifest = Omit<SiteFrontmatter, 'parts'> & {
  myst: string;
  id?: string;
  projects?: ManifestProject[];
  nav?: SiteNavItem[];
  actions?: SiteAction[];
  domains?: string[];
  favicon?: string;
  template?: string;
  parts?: FrontmatterParts;
};
