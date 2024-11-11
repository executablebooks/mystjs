import { describe, beforeEach, test, expect } from 'vitest';

import { validateTOC } from '../src';
import type { ValidationOptions } from 'simple-validators';

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
});

test('Single file entry passes', () => {
  const input = [{ file: 'foo.md' }];
  const toc = validateTOC(input, opts);
  expect(opts.messages.errors?.length).toBeFalsy();
  expect(opts.messages.warnings?.length).toBeFalsy();
  expect(toc).toStrictEqual(input);
});

describe.each([
  ['file', 'foo.md'],
  ['url', 'https://google.com'],
  ['pattern', 'main*.md'],
])('Single %s entry', (entryName, entryValue) => {
  test.each([['title', 'document']])('with %s passes', (name, value) => {
    const entry = {};
    entry[entryName] = entryValue;
    entry[name] = value;
    const input = [entry];
    const toc = validateTOC(input, opts);
    expect(opts.messages.errors?.length).toBeFalsy();
    expect(opts.messages.warnings?.length).toBeFalsy();
    expect(toc).toStrictEqual(input);
  });

  test.each([['title', 1000, 'string']])('with invalid type for %s fails', (name, value, type) => {
    const input = [{ file: 'foo.md' }];
    input[0][name] = value;
    validateTOC(input, opts);
    expect(opts.messages.errors).toStrictEqual([
      { message: `'${name}' must be ${type} (at test.0)`, property: name },
    ]);
    expect(opts.messages.warnings).toBeUndefined();
  });

  test('with unknown property fails', () => {
    const input = [{ file: 'foo.md', bar: 'baz.rst' }];
    const toc = validateTOC(input, opts);
    expect(opts.messages.errors).toBeUndefined();
    expect(opts.messages.warnings).toStrictEqual([
      {
        message: "'0' extra key ignored: bar (at test)",
        property: '0',
      },
    ]);
    expect(toc).toStrictEqual([
      {
        file: 'foo.md',
      },
    ]);
  });
});

test('Single file entry with children passes', () => {
  const input = [{ file: 'foo.md', children: [{ file: 'bar.md' }] }];
  const toc = validateTOC(input, opts);
  expect(opts.messages.errors?.length).toBeFalsy();
  expect(opts.messages.warnings?.length).toBeFalsy();
  expect(toc).toStrictEqual(input);
});

test('Single file entry with invalid children fails', () => {
  const input = [{ file: 'foo.md', children: [{ utopia: 'bar.md' }] }];
  validateTOC(input, opts);
  expect(opts.messages.errors).toStrictEqual([
    {
      message:
        "'children.0' expected an entry with 'file', 'url', 'pattern', or 'title' (at test.0)",
      property: 'children.0',
    },
  ]);
  expect(opts.messages.warnings).toBeUndefined();
});

test('Single parent entry passes', () => {
  const input = [{ title: 'Bar', children: [] }];
  const toc = validateTOC(input, opts);
  expect(opts.messages.errors?.length).toBeFalsy();
  expect(opts.messages.warnings?.length).toBeFalsy();
  expect(toc).toStrictEqual(input);
});

test('Single parent entry with children passes', () => {
  const input = [{ title: 'Bar', children: [{ url: 'https://bbc.co.uk/news' }] }];
  const toc = validateTOC(input, opts);
  expect(opts.messages.errors?.length).toBeFalsy();
  expect(opts.messages.warnings?.length).toBeFalsy();
  expect(toc).toStrictEqual(input);
});

test('Single parent entry without title', () => {
  const input = [{ children: [{ url: 'https://bbc.co.uk/news' }] }];
  validateTOC(input, opts);
  expect(opts.messages.errors).toStrictEqual([
    {
      message: "'0' expected an entry with 'file', 'url', 'pattern', or 'title' (at test)",
      property: '0',
    },
  ]);
  expect(opts.messages.warnings).toBeUndefined();
});

test('invalid toc entry', () => {
  const input = ['invalid'];
  validateTOC(input, opts);
  expect(opts.messages.errors).toStrictEqual([
    {
      message: "'0' must be object (at test)",
      property: '0',
    },
  ]);
  expect(opts.messages.warnings).toBeUndefined();
});
