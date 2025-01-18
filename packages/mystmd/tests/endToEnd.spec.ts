import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { exec } from 'myst-cli-utils';

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  cwd: string;
  command: string;
  outputs: {
    path: string;
    content: string;
  }[];
};

function loadCases(file: string) {
  const testYaml = fs.readFileSync(path.join(__dirname, file)).toString();
  return (yaml.load(testYaml) as TestFile).cases;
}

function resolve(relative: string) {
  return path.resolve(__dirname, relative);
}

function cleanHashes(text: string) {
  return text
    .replace(/,\s*"urlOptimized":\s*"[-./a-z0-9]{0,50}"/g, '')
    .replace(/,\s*"thumbnailOptimized":\s*"[-./a-z0-9]{0,50}"/g, '')
    .replace(/-[a-f0-9]{32}\./g, '.')
    .replace(/"key":\s*"[a-zA-Z0-9]{10}"/g, '"key": "keyABC0123"');
}

const only = '';

describe.concurrent('End-to-end cli export tests', { timeout: 15000 }, () => {
  const cases = loadCases('exports.yml');
  test.each(
    cases.filter((c) => !only || c.title === only).map((c): [string, TestCase] => [c.title, c]),
  )('%s', async (_, { cwd, command, outputs }) => {
    // Clean expected outputs if they already exist
    await Promise.all(
      outputs.map(async (output) => {
        if (fs.existsSync(resolve(output.path))) {
          await exec(`rm ${resolve(output.path)}`, { cwd: resolve(cwd) });
        }
      }),
    );
    // Run CLI command
    await exec(command, { cwd: resolve(cwd) });
    // Expect correct output
    outputs.forEach((output) => {
      expect(fs.existsSync(resolve(output.path))).toBeTruthy();
      if (path.extname(output.content) === '.json') {
        expect(
          JSON.parse(cleanHashes(fs.readFileSync(resolve(output.path), { encoding: 'utf-8' }))),
        ).toMatchObject(
          JSON.parse(cleanHashes(fs.readFileSync(resolve(output.content), { encoding: 'utf-8' }))),
        );
      } else {
        expect(cleanHashes(fs.readFileSync(resolve(output.path), { encoding: 'utf-8' }))).toEqual(
          cleanHashes(fs.readFileSync(resolve(output.content), { encoding: 'utf-8' })),
        );
      }
    });
  });
});
