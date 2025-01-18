import type { ValidationOptions } from 'simple-validators';
import {
  defined,
  fillMissingKeys,
  incrementOptions,
  validateBoolean,
  validateNumber,
  validateObjectKeys,
  validateString,
  validationWarning,
} from 'simple-validators';
import type { Numbering, NumberingItem } from './types.js';

export const NUMBERING_OPTIONS = ['enumerator', 'all', 'headings', 'title'];

const HEADING_KEYS = ['heading_1', 'heading_2', 'heading_3', 'heading_4', 'heading_5', 'heading_6'];
export const NUMBERING_KEYS = [
  'figure',
  'subfigure',
  'equation',
  'subequation',
  'table',
  'code',
  ...HEADING_KEYS,
];

const NUMBERING_ITEM_KEYS = ['enabled', 'start', 'template', 'continue'];

const CONTINUE_STRINGS = ['continue', 'next'];

export const NUMBERING_ALIAS = {
  sections: 'headings',
  h1: 'heading_1',
  h2: 'heading_2',
  h3: 'heading_3',
  h4: 'heading_4',
  h5: 'heading_5',
  h6: 'heading_6',
  heading1: 'heading_1',
  heading2: 'heading_2',
  heading3: 'heading_3',
  heading4: 'heading_4',
  heading5: 'heading_5',
  heading6: 'heading_6',
  figures: 'figure',
  subfigures: 'subfigure',
  equations: 'equation',
  subequations: 'subequation',
  tables: 'table',
  titles: 'title',
};

function isBoolean(input: any) {
  if (typeof input === 'string') {
    return ['true', 'false'].includes(input.toLowerCase());
  }
  return typeof input === 'boolean';
}

/**
 * Validate value for each numbering entry
 *
 * Value may be:
 * - boolean, to simply enable/disable numbering
 * - number, to indicate the starting number
 * - string, to define the cross-reference template
 *   (e.g. 'Fig. %s' to get "Fig. 1" instead of "Figure 1" in your document)
 * - An object with any of enabled/start/template - specifying the above types
 *   will coerce to this object
 */
export function validateNumberingItem(
  input: any,
  opts: ValidationOptions,
): NumberingItem | undefined {
  if (isBoolean(input)) {
    input = { enabled: input };
  } else if (typeof input === 'number') {
    input = { start: input };
  } else if (CONTINUE_STRINGS.includes(input)) {
    input = { continue: true };
  } else if (typeof input === 'string') {
    input = { template: input };
  }
  const value = validateObjectKeys(input, { optional: NUMBERING_ITEM_KEYS }, opts);
  if (value === undefined) return undefined;
  const output: NumberingItem = {};
  if (defined(value.enabled)) {
    const enabled = validateBoolean(value.enabled, incrementOptions('enabled', opts));
    if (defined(enabled)) output.enabled = enabled;
  }
  if (defined(value.start)) {
    if (CONTINUE_STRINGS.includes(value.start) && !defined(value.continue)) {
      output.continue = true;
      output.enabled = output.enabled ?? true;
    } else {
      const start = validateNumber(value.start, {
        ...incrementOptions('start', opts),
        integer: true,
        min: 1,
      });
      if (start) {
        output.start = start;
        output.enabled = output.enabled ?? true;
      }
    }
  }
  if (defined(value.template)) {
    const template = validateString(value.template, incrementOptions('template', opts));
    if (defined(template)) {
      output.template = template;
      output.enabled = output.enabled ?? true;
    }
  }
  if (defined(value.continue)) {
    const cont = validateBoolean(value.continue, incrementOptions('continue', opts));
    if (defined(cont)) {
      output.continue = cont;
      output.enabled = output.enabled ?? true;
    }
  }
  if (Object.keys(output).length === 0) return undefined;
  return output;
}
export function validateTitleItem(input: any, opts: ValidationOptions): NumberingItem | undefined {
  if (isBoolean(input)) {
    input = { enabled: input };
  } else if (typeof input === 'number') {
    input = { offset: input };
  }
  const value = validateObjectKeys(input, { optional: ['enabled', 'offset'] }, opts);
  if (value === undefined) return undefined;
  const output: { enabled?: boolean; offset?: number } = {};
  if (defined(value.enabled)) {
    const enabled = validateBoolean(value.enabled, incrementOptions('enabled', opts));
    if (defined(enabled)) output.enabled = enabled;
  }
  if (defined(value.offset)) {
    const offset = validateNumber(value.offset, {
      integer: true,
      min: 0,
      max: 5,
      ...incrementOptions('offset', opts),
    });
    if (defined(offset)) {
      output.offset = offset;
      output.enabled = output.enabled ?? true;
    }
  }
  if (Object.keys(output).length === 0) return undefined;
  return output;
}

/**
 * Validate Numbering object
 */
export function validateNumbering(input: any, opts: ValidationOptions): Numbering | undefined {
  if (isBoolean(input)) {
    input = { all: input };
  }
  const value = validateObjectKeys(
    input,
    { optional: [...NUMBERING_KEYS, ...NUMBERING_OPTIONS], alias: NUMBERING_ALIAS },
    { ...opts, suppressWarnings: true, keepExtraKeys: true },
  );
  if (value === undefined) return undefined;
  const output: Numbering = {};
  let headings: NumberingItem | undefined;
  if (defined(value.enumerator)) {
    const enumeratorOpts = incrementOptions('enumerator', opts);
    output.enumerator = validateNumberingItem(value.enumerator, enumeratorOpts);
    if (output.enumerator?.enabled != null) {
      if (output.enumerator.enabled !== true) {
        validationWarning("value for 'enabled' is ignored", enumeratorOpts);
      }
      delete output.enumerator.enabled;
    }
    if (output.enumerator?.start != null) {
      validationWarning("value for 'start' is ignored", enumeratorOpts);
      delete output.enumerator.start;
    }
    if (output.enumerator?.continue != null) {
      validationWarning("value for 'continue' is ignored", enumeratorOpts);
      delete output.enumerator.continue;
    }
    if (!output.enumerator || Object.keys(output.enumerator).length === 0) {
      delete output.enumerator;
    }
  }
  if (defined(value.all)) {
    const allOpts = incrementOptions('all', opts);
    output.all = validateNumberingItem(value.all, allOpts);
    if (output.all?.template != null) {
      validationWarning("value for 'template' is ignored", allOpts);
      delete output.all.template;
    }
    if (output.all?.start != null) {
      validationWarning("value for 'start' is ignored", allOpts);
      delete output.all.start;
    }
    if (!output.all || Object.keys(output.all).length === 0) {
      delete output.all;
    }
  }
  if (defined(value.title)) {
    output.title = validateTitleItem(value.title, incrementOptions('title', opts));
  }
  if (defined(value.headings)) {
    headings = validateNumberingItem(value.headings, incrementOptions('headings', opts));
    HEADING_KEYS.forEach((headingKey) => {
      if (headings && !defined(value[headingKey])) {
        value[headingKey] = headings;
      }
    });
  }
  Object.keys(value)
    .filter((key) => !NUMBERING_OPTIONS.includes(key)) // For all the unknown options
    .forEach((key) => {
      if (defined(value[key])) {
        const item = validateNumberingItem(value[key], incrementOptions(key, opts));
        if (!defined(item)) return;
        if (headings && HEADING_KEYS.includes(key)) {
          output[key] = { ...headings, ...item };
        } else {
          output[key] = item;
        }
      }
    });
  if (Object.keys(output).length === 0) return undefined;
  return output;
}

export function fillNumbering(base?: Numbering, filler?: Numbering) {
  const output: Numbering = { ...filler, ...base };
  Object.entries(filler ?? {})
    .filter(([key]) => !NUMBERING_OPTIONS.includes(key))
    .forEach(([key, val]) => {
      output[key] = fillMissingKeys(
        base?.[key] ?? {},
        // Enabling/disabling all in base overrides filler
        {
          ...val,
          enabled: base?.all?.enabled ?? val.enabled,
          continue: base?.all?.continue ?? val.continue,
        },
        NUMBERING_ITEM_KEYS,
      );
    });
  return output;
}
