import { describe, expect, test } from 'vitest';
import {
  ReferenceState,
  enumerateTargetsTransform,
  formatHeadingEnumerator,
  incrementHeadingCounts,
  initializeTargetCounts,
} from './enumerate';
import { u } from 'unist-builder';
import { VFile } from 'vfile';

describe('Heading counts and formatting', () => {
  test.each([
    [2, [0, 0, 0, null, 0, 0], [0, 1, 0, null, 0, 0]],
    [1, [0, 1, 0, null, 0, 0], [1, 0, 0, null, 0, 0]],
    [2, [1, 0, 0, null, 0, 0], [1, 1, 0, null, 0, 0]],
    [5, [1, 1, 0, null, 0, 0], [1, 1, 0, null, 1, 0]],
    [5, [1, 1, 0, null, 1, 0], [1, 1, 0, null, 2, 0]],
    [2, [1, 1, 0, null, 2, 0], [1, 2, 0, null, 0, 0]],
    [1, [1, 2, 0, null, 0, 0], [2, 0, 0, null, 0, 0]],
  ])('incrementHeadingCounts(%s, %s)}', (depth, counts, out) => {
    expect(incrementHeadingCounts(depth, counts)).toEqual(out);
  });
  test.each([
    [[0, 0, 0, null, 0, 0], ''],
    [[0, 1, 0, null, 0, 0], '0.1'],
    [[1, 0, 0, null, 0, 0], '1'],
    [[1, 1, 0, null, 0, 0], '1.1'],
    [[1, 1, 0, null, 1, 0], '1.1.0.1'],
    [[1, 1, 0, null, 2, 0], '1.1.0.2'],
    [[1, 2, 0, null, 0, 0], '1.2'],
  ])('formatHeadingEnumerator(%s)}', (counts, out) => {
    expect(formatHeadingEnumerator(counts)).toEqual(out);
  });
});

describe('enumeration', () => {
  test('sub-equations', () => {
    const tree = u('root', [
      u('mathGroup', { identifier: 'eq:1' }, [
        u('math', { identifier: 'eq:1a', kind: 'subequation' }),
        u('math', { identifier: 'eq:1b', kind: 'subequation' }),
      ]),
      u('math', { identifier: 'eq:x', enumerated: false }),
      u('math', { identifier: 'eq:2' }),
      u('mathGroup', { identifier: 'eq:3' }, [
        u('math', { identifier: 'eq:3-1', kind: 'subequation', enumerated: false }),
        u('math', { identifier: 'eq:3-2', kind: 'subequation' }),
        u('math', { identifier: 'eq:3-3', kind: 'subequation', enumerated: false }),
        u('math', { identifier: 'eq:3-4', kind: 'subequation' }),
      ]),
    ]);
    const state = new ReferenceState('my-file.md', {
      frontmatter: { numbering: { enumerator: { template: 'A.%s' } } },
      vfile: new VFile(),
    });
    enumerateTargetsTransform(tree, { state });
    expect(state.getTarget('eq:1')?.node.enumerator).toBe('A.1');
    expect(state.getTarget('eq:1a')?.node.enumerator).toBe('A.1a');
    expect(state.getTarget('eq:1b')?.node.enumerator).toBe('A.1b');
    expect(state.getTarget('eq:x')?.node.enumerator).toBeUndefined();
    expect(state.getTarget('eq:2')?.node.enumerator).toBe('A.2');
    expect(state.getTarget('eq:3')?.node.enumerator).toBe('A.3');
    expect(state.getTarget('eq:3-1')?.node.enumerator).toBeUndefined();
    expect(state.getTarget('eq:3-2')?.node.enumerator).toBe('A.3a');
    expect(state.getTarget('eq:3-3')?.node.enumerator).toBeUndefined();
    expect(state.getTarget('eq:3-4')?.node.enumerator).toBe('A.3b');
  });
  test('headers', () => {
    const tree = u('root', [
      u('heading', { identifier: 'h1', depth: 2 }),
      u('heading', { identifier: 'h2', depth: 3 }),
      u('heading', { identifier: 'h3', depth: 2 }),
    ]);
    const state = new ReferenceState('my-file.md', {
      frontmatter: { numbering: { heading_1: { enabled: true }, heading_2: { enabled: true } } },
      vfile: new VFile(),
    });
    enumerateTargetsTransform(tree, { state });
    expect(state.getTarget('h1')?.node.enumerator).toBe('1');
    expect(state.getTarget('h2')?.node.enumerator).toBe('1.1');
    expect(state.getTarget('h3')?.node.enumerator).toBe('2');
  });
  test('sub-figures', () => {
    const tree = u('root', [
      u('container', { identifier: 'fig:1', kind: 'figure' }, [
        u('container', { identifier: 'fig:1a', kind: 'figure', subcontainer: true }),
        u('container', { identifier: 'fig:1b', kind: 'figure', subcontainer: true }),
        u('container', { kind: 'figure', subcontainer: true }),
      ]),
      u('container', { identifier: 'fig:2', kind: 'figure' }, []),
    ]);
    const state = new ReferenceState('my-file.md', {
      frontmatter: { numbering: { enumerator: { template: 'A.%s' } } },
      vfile: new VFile(),
    });
    enumerateTargetsTransform(tree, { state });
    expect(state.getTarget('fig:1')?.node.enumerator).toBe('A.1');
    expect(state.getTarget('fig:1a')?.node.enumerator).toBe('a');
    expect(state.getTarget('fig:1a')?.node.parentEnumerator).toBe('A.1');
    expect(state.getTarget('fig:1b')?.node.enumerator).toBe('b');
    expect(state.getTarget('fig:1b')?.node.parentEnumerator).toBe('A.1');
    expect(state.getTarget('fig:1-c')?.node.enumerator).toBe('c');
    expect(state.getTarget('fig:1-c')?.node.parentEnumerator).toBe('A.1');
    expect(state.getTarget('fig:2')?.node.enumerator).toBe('A.2');
  });
});
describe('initializeTargetCounts', () => {
  test('no inputs initializes heading', () => {
    expect(initializeTargetCounts({})).toEqual({ heading: [0, 0, 0, 0, 0, 0] });
  });
  test('previousCounts unchanged if continue is true', () => {
    const initialCounts = {
      heading: [5, 3, 1, 0, null, null],
      figure: { main: 7, sub: 2 },
      other: { main: 0, sub: 0 },
    };
    expect(
      initializeTargetCounts({ all: { continue: true, enabled: true } }, initialCounts as any),
    ).toEqual(initialCounts);
  });
  test('numbering starts are respected', () => {
    const numbering = {
      heading_1: { enabled: true, start: 5 },
      heading_2: { enabled: false, start: 2 },
      heading_5: { enabled: true, start: 2 },
      figure: { enabled: true, start: 5 },
      other: { enabled: true, start: 8 },
    };
    expect(initializeTargetCounts(numbering)).toEqual({
      heading: [4, null, 0, 0, 1, 0],
      figure: { main: 4, sub: 0 },
      other: { main: 7, sub: 0 },
    });
  });
  test('tree headings are respected', () => {
    expect(initializeTargetCounts({}, undefined, undefined, new Set([1, 3, 4]))).toEqual({
      heading: [0, null, 0, 0, null, null],
    });
  });
  test('previousCounts override tree headings', () => {
    const previousCounts = {
      heading: [5, 3, 1, 0, null, null],
      figure: { main: 7, sub: 2 },
      other: { main: 0, sub: 0 },
    };
    expect(
      initializeTargetCounts(
        {
          heading_1: { continue: true, enabled: true },
          heading_2: { continue: true, enabled: true },
          heading_3: { continue: true, enabled: true },
          heading_4: { continue: true, enabled: true },
          heading_5: { continue: true, enabled: true },
          heading_6: { continue: true, enabled: true },
          figure: { continue: true, enabled: true },
          other: { continue: true, enabled: true },
        },
        previousCounts as any,
        undefined,
        new Set([1, 3, 4]),
      ),
    ).toEqual(previousCounts);
  });
  test('explicit numberings override previous', () => {
    const previousCounts = {
      heading: [5, 3, 1, 0, null, null],
      figure: { main: 7, sub: 2 },
      other: { main: 0, sub: 0 },
    };
    const numbering = {
      heading_1: { enabled: true, start: 5, continue: true },
      heading_2: { enabled: false, start: 2, continue: true },
      heading_5: { enabled: true, start: 2, continue: true },
      figure: { enabled: true, start: 5, continue: true },
      code: { enabled: true, start: 8, continue: true },
    };
    expect(initializeTargetCounts(numbering, previousCounts as any)).toEqual({
      heading: [4, null, 0, 0, 1, 0],
      figure: { main: 4, sub: 0 },
      other: { main: 0, sub: 0 },
      code: { main: 7, sub: 0 },
    });
  });
});
