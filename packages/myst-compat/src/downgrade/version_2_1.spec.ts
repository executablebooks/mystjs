import { describe, expect, it } from 'vitest';
import { downgrade } from './version_2_1.js';
import type { Parent } from 'mdast';
import { warn } from 'console';

const SIMPLE_AST: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      children: [
        {
          // @ts-expect-error: invalid child type
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'This is an ',
            },
            {
              type: 'emphasis',
              children: [
                {
                  type: 'text',
                  value: 'interesting',
                },
              ],
            },
            {
              type: 'text',
              value: ' file. See ',
            },
            {
              type: 'link',
              url: '#other',
              children: [],
              // @ts-expect-error: unknown field
              urlSource: '#other',
            },
            {
              type: 'text',
              value: ' for more.',
            },
          ],
        },
        {
          // @ts-expect-error: invalid child type
          type: 'code',
          lang: 'python',
          value: 'Some code',
        },
      ],
    },
  ],
};

const SIMPLE_V2_AST_WITH_OUTPUT: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      children: [
        {
          // @ts-expect-error: invalid child type
          type: 'outputs',
          id: 'abc123',
          children: [
            {
              // @ts-expect-error: invalid child type
              type: 'output',
              children: [],
              jupyter_data: {
                output_type: 'display_data',
                execution_count: 3,
                metadata: {},
                data: {
                  'application/octet-stream': {
                    content_type: 'application/octet-stream',
                    hash: 'def456',
                    path: '/my/path/def456.png',
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

const SIMPLE_V1_AST_WITH_OUTPUT: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      children: [
        {
          // @ts-expect-error: invalid child type
          type: 'output',
          id: 'abc123',
          // @ts-expect-error: invalid type
          data: [
            {
              output_type: 'display_data',
              execution_count: 3,
              metadata: {},
              data: {
                'application/octet-stream': {
                  content_type: 'application/octet-stream',
                  hash: 'def456',
                  path: '/my/path/def456.png',
                },
              },
            },
          ],
          children: [],
          _future_ast: {
            type: 'outputs',
            id: 'abc123',
            children: [
              {
                type: 'output',
                children: [],
                jupyter_data: {
                  output_type: 'display_data',
                  execution_count: 3,
                  metadata: {},
                  data: {
                    'application/octet-stream': {
                      content_type: 'application/octet-stream',
                      hash: 'def456',
                      path: '/my/path/def456.png',
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  ],
};

describe('downgrade 2->1', () => {
  it('leaves a simple AST unchanged', () => {
    const ast = structuredClone(SIMPLE_AST);
    downgrade(ast);
    expect(ast).toStrictEqual(SIMPLE_AST);
  });
  it('downgrades a v2 AST with outputs', () => {
    const ast = structuredClone(SIMPLE_V2_AST_WITH_OUTPUT);
    downgrade(ast);
    expect(ast).toStrictEqual(SIMPLE_V1_AST_WITH_OUTPUT);
  });
});
