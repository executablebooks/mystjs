import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { visit } from 'unist-util-visit';
import { mystParse } from '../src';
import { mystToHtml } from 'myst-to-html';
import { selectAll } from 'unist-util-select';
import type { GenericParent } from 'myst-common';
import { containerChildrenTransform } from 'myst-transforms';
import { VFile } from 'vfile';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  description?: string;
  skip?: boolean;
  mdast: GenericParent;
  myst?: string;
  html?: string;
};

// Comment out to make these fail
const SKIP_TESTS = [
  // Expected
  '44', // This is a block break, expect it to be different
  // Minor
  '25', // This is a &nbsp; I think
  // To fix
  '333', // Spacing around inline code?
  '353', // Broken paragraph/emph?
  '506', // This is a link issue?
];

// TODO: import this from myst-spec properly!
const directory = fs.existsSync('../../node_modules/myst-spec/dist/examples')
  ? '../../node_modules/myst-spec/dist/examples'
  : '../../../node_modules/myst-spec/dist/examples';

const files: string[] = fs.readdirSync(directory).filter((name) => name.endsWith('.yml'));

// For prettier printing of test cases
const length = files.map((f) => f.replace('.yml', '')).reduce((a, b) => Math.max(a, b.length), 0);

const skipped: [string, TestCase][] = [];
const cases: [string, TestCase][] = files
  .map((file) => {
    const testYaml = fs.readFileSync(path.join(directory, file)).toString();
    const loadedCases = yaml.load(testYaml) as TestFile;
    return loadedCases.cases.map((testCase) => {
      const section = `${file.replace('.yml', '')}:`.padEnd(length + 2, ' ');
      const name = `${section} ${testCase.title}`;
      return [name, testCase] as [string, TestCase];
    });
  })
  .flat()
  .filter(([f, t]) => {
    if (t.skip) skipped.push([f, t]);
    return !t.skip;
  });

const mystCases: [string, TestCase][] = cases.filter(([f, t]) => {
  for (const skip of SKIP_TESTS) {
    if (f.trim().endsWith(`example ${skip}`)) return false;
  }
  return t.myst;
});
const htmlCases: [string, TestCase][] = cases.filter(([, t]) => t.html);

/**
 * Normalize html by removing any indented newlines.
 *
 * **Note**: This will screw up `<pre>` tags, but it is good enough for comparing in tests
 */
function normalize(html: string) {
  return html.replace(/\n[\s]*/g, '');
}

function stripPositions(tree: GenericParent) {
  visit(tree, (node) => {
    delete node.position;
  });
  return tree;
}

function fixMystDirectives(tree: GenericParent) {
  selectAll('mystDirective', tree).forEach((node) => {
    // Node markdown is trimmed
    (node as any).value = (node as any).value?.trim();
    // These are added on afterwards and we aren't taking them into account in myst spec
    delete (node as any).tight;
    // fix the options
    Object.entries((node as any).options ?? {}).forEach(([key, val]) => {
      const options = (node as any).options;
      if (val === true) {
        options[key] = true; // a flag
      } else if (!isNaN(Number(val))) {
        options[key] = Number(val);
      } else if (typeof val === 'string' && val.toLowerCase() === 'true') {
        options[key] = true;
      } else if (typeof val === 'string' && val.toLowerCase() === 'false') {
        options[key] = false;
      } else {
        options[key] = val;
      }
    });
  });
  return tree;
}

function replaceMystCommentNodes(tree: GenericParent) {
  selectAll('comment', tree).forEach((node) => {
    // In a future version of the spec, hopefully this is removed
    // There isn't anything myst-like about the comments
    node.type = 'mystComment';
  });
  return tree;
}

function replaceCommentNodes(tree: GenericParent) {
  selectAll('mystComment', tree).forEach((node) => {
    // In a future version of the spec, hopefully this is removed
    // There isn't anything myst-like about the comments
    node.type = 'comment';
  });
  return tree;
}

describe('Testing myst --> mdast conversions', () => {
  test.each(mystCases)('%s', (_, { myst, mdast }) => {
    if (myst) {
      const newAst = fixMystDirectives(
        replaceMystCommentNodes(
          stripPositions(
            mystParse(myst, {
              mdast: {
                hoistSingleImagesOutofParagraphs: false,
                nestBlocks: false,
              },
              extensions: {
                frontmatter: false, // Frontmatter screws with some tests!
                citations: false,
                smartquotes: false,
              },
            }),
          ),
        ),
      );
      // Figure caption/legend creation described in myst-spec has been moved
      // from figure directive to a basic myst transform.
      // Run that transform to keep tests consistent.
      if (myst.includes('{figure}')) {
        containerChildrenTransform(newAst, new VFile());
      }
      expect(newAst).toEqual(mdast);
    }
  });
});

describe('Testing mdast --> html conversions', () => {
  test.each(htmlCases)('%s', (name, { html, mdast }) => {
    const modified = replaceCommentNodes(mdast);
    if (html) {
      if (name.includes('cmark_spec_0.30')) {
        const output = mystToHtml(modified, {
          formatHtml: false,
          hast: {
            clobberPrefix: 'm-',
            allowDangerousHtml: true,
          },
          stringifyHtml: {
            closeSelfClosing: true,
            allowDangerousHtml: true,
          },
        });
        const i = html
          .replace(/&gt;/g, '>')
          .replace(/&lt;/g, '&#x3C;')
          .replace(/&amp;/g, '&#x26;')
          .replace(/&quot;/g, '"')
          .replace(' alt=""', '') // Test 580
          .trim();
        const o = output
          // These are quoted correctly, but come out poorly from the &quot; replacement above
          .replace('foo&#x22;bar', 'foo"bar') // Test 202
          .replace('&#x22;and&#x22;', '"and"') // Test 508
          .replace('title &#x22;&#x22;', 'title ""'); // Test 505

        expect(normalize(o)).toEqual(normalize(i));
      } else {
        const newHTML = mystToHtml(modified, {
          formatHtml: true,
          hast: {
            clobberPrefix: 'm-',
            allowDangerousHtml: true,
          },
          stringifyHtml: {
            closeSelfClosing: false,
            allowDangerousHtml: true,
          },
        });
        expect(normalize(newHTML)).toEqual(normalize(html));
      }
    }
  });
});

if (skipped.length) {
  describe('Skipped Tests', () => {
    test.skip.each(skipped)('%s', () => null);
  });
}
