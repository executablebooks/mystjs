import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  incrementOptions,
  validateObjectKeys,
  validateString,
  validateBoolean,
  validateObject,
  validateNumber,
} from 'simple-validators';
import { validateProjectAndPageFrontmatterKeys } from '../project/validators.js';
import { PAGE_FRONTMATTER_KEYS, type PageFrontmatter } from './types.js';
import { validateKernelSpec } from '../kernelspec/validators.js';
import { validateJupytext } from '../jupytext/validators.js';
import { FRONTMATTER_ALIASES } from '../site/types.js';

export const USE_PROJECT_FALLBACK = [
  'authors',
  'reviewers',
  'editors',
  'date',
  'doi',
  'arxiv',
  'pmid',
  'pmcid',
  'open_access',
  'license',
  'github',
  'binder',
  'source',
  'subject',
  'venue',
  'volume',
  'issue',
  'first_page',
  'last_page',
  'numbering',
  'keywords',
  'funding',
  'copyright',
  'affiliations',
];

export function validatePageFrontmatterKeys(value: Record<string, any>, opts: ValidationOptions) {
  const output: PageFrontmatter = validateProjectAndPageFrontmatterKeys(value, opts);
  if (defined(value.label)) {
    output.label = validateString(value.label, incrementOptions('label', opts));
  }
  if (defined(value.kernelspec)) {
    output.kernelspec = validateKernelSpec(value.kernelspec, incrementOptions('kernelspec', opts));
  }
  if (defined(value.jupytext)) {
    output.jupytext = validateJupytext(value.jupytext, incrementOptions('jupytext', opts));
  }
  if (defined(value.enumerator)) {
    output.enumerator = validateString(value.enumerator, incrementOptions('enumerator', opts));
  }
  if (defined(value.content_includes_title)) {
    output.content_includes_title = validateBoolean(
      value.content_includes_title,
      incrementOptions('content_includes_title', opts),
    );
  }
  if (defined(value.site)) {
    // These are validated later based on the siteTemplate
    // At this point, they just need to be an object
    output.site = validateObject(value.site, incrementOptions('site', opts));
  }
  return output;
}

/**
 * Validate single PageFrontmatter object against the schema
 */
export function validatePageFrontmatter(input: any, opts: ValidationOptions) {
  const value =
    validateObjectKeys(
      input,
      { optional: PAGE_FRONTMATTER_KEYS, alias: { ...FRONTMATTER_ALIASES, name: 'label' } },
      opts,
    ) || {};
  return validatePageFrontmatterKeys(value, opts);
}
