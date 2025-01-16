import { describe, expect, it } from 'vitest';
import { reduceOutputs, stringIsMatplotlibOutput } from './outputs';
import { Session } from '../session/session';

describe('reduceOutputs', () => {
  it('output with no data is removed', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'hi',
                },
              ],
            },
            {
              type: 'outputs',
              children: [
                {
                  type: 'output',
                  id: 'abc123',
                  jupyter_data: null,
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mdast.children[0].children.length).toEqual(2);
    reduceOutputs(new Session(), mdast, 'notebook.ipynb', '/my/folder');
    expect(mdast.children[0].children.length).toEqual(1);
  });
  it('output with complex data is removed', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'hi',
                },
              ],
            },
            {
              type: 'outputs',
              id: 'abc123',
              children: [
                {
                  type: 'output',
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
    expect(mdast.children[0].children.length).toEqual(2);
    reduceOutputs(new Session(), mdast, 'notebook.ipynb', '/my/folder');
    expect(mdast.children[0].children.length).toEqual(1);
  });
  it('output is replaced with placeholder image', async () => {
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'hi',
                },
              ],
            },
            {
              type: 'outputs',
              id: 'abc123',
              children: [
                {
                  type: 'output',
                  jupyter_data: null,
                  children: [
                    {
                      type: 'image',
                      placeholder: true,
                      url: 'placeholder.png',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mdast.children[0].children.length).toEqual(2);
    reduceOutputs(new Session(), mdast, 'notebook.ipynb', '/my/folder');
    expect(mdast.children[0].children.length).toEqual(2);
    expect(mdast.children[0].children[1]).toEqual({
      type: 'image',
      placeholder: true,
      url: 'placeholder.png',
    });
  });
  // // These tests now require file IO...
  // it('image output converts to image node', async () => {
  //   const mdast = {
  //     type: 'root',
  //     children: [
  //       {
  //         type: 'output',
  //         id: 'abc123',
  //         data: [
  //           {
  //             output_type: 'display_data',
  //             execution_count: 3,
  //             metadata: {},
  //             data: {
  //               'image/png': {
  //                 content_type: 'image/png',
  //                 hash: 'def456',
  //                 path: '/my/path/def456.png',
  //               },
  //               'text/plain': {
  //                 content_type: 'text/plain',
  //                 hash: 'a6255a8d7ac11cabe5829e143599f112',
  //                 path: '/my/path/a6255a8d7ac11cabe5829e143599f112.txt',
  //               },
  //             },
  //           },
  //         ],
  //       },
  //     ],
  //   };
  //   reduceOutputs(new Session(), mdast, 'notebook.ipynb', '/my/folder');
  //   expect(mdast.children.length).toEqual(1);
  //   expect(mdast.children[0].type).toEqual('image');
  // });
  // it('multiple outputs are maintained', async () => {
  //   const mdast = {
  //     type: 'root',
  //     children: [
  //       {
  //         type: 'output',
  //         id: 'abc123',
  //         data: [
  //           {
  //             output_type: 'display_data',
  //             execution_count: 3,
  //             metadata: {},
  //             data: {
  //               'image/png': {
  //                 content_type: 'image/png',
  //                 hash: 'def456',
  //                 path: '/my/path/def456.png',
  //               },
  //               'text/plain': {
  //                 content_type: 'text/plain',
  //                 hash: 'a6255a8d7ac11cabe5829e143599f112',
  //                 path: '/my/path/a6255a8d7ac11cabe5829e143599f112.txt',
  //               },
  //             },
  //           },
  //           {
  //             output_type: 'display_data',
  //             execution_count: 3,
  //             metadata: {},
  //             data: {
  //               'image/png': {
  //                 content_type: 'image/png',
  //                 hash: 'ghi789',
  //                 path: '/my/path/ghi789.png',
  //               },
  //               'text/plain': {
  //                 content_type: 'text/plain',
  //                 hash: 'a6255a8d7ac11cabe5829e143599f112',
  //                 path: '/my/path/a6255a8d7ac11cabe5829e143599f112.txt',
  //               },
  //             },
  //           },
  //         ],
  //       },
  //       {
  //         type: 'output',
  //         id: 'jkl012',
  //         data: [
  //           {
  //             output_type: 'display_data',
  //             execution_count: 3,
  //             metadata: {},
  //             data: {
  //               'image/png': {
  //                 content_type: 'image/png',
  //                 hash: 'mno345',
  //                 path: '/my/path/mno345.png',
  //               },
  //               'text/plain': {
  //                 content_type: 'text/plain',
  //                 hash: 'a6255a8d7ac11cabe5829e143599f112',
  //                 path: '/my/path/a6255a8d7ac11cabe5829e143599f112.txt',
  //               },
  //             },
  //           },
  //         ],
  //       },
  //     ],
  //   };
  //   reduceOutputs(new Session(), mdast, 'notebook.ipynb', '/my/folder');
  //   expect(mdast.children.length).toEqual(3);
  //   expect(mdast.children[0].type).toEqual('image');
  //   expect(mdast.children[1].type).toEqual('image');
  //   expect(mdast.children[2].type).toEqual('image');
  // });
  it.each([
    ['<Figure size 720x576 with 1 Axes>', true],
    ['<matplotlib.legend.Legend at 0x7fb7fc701b90>', true],
    ["Text(0.5, 0.98, 'Test 1')", true],
    [
      '(<Figure size 1224x576 with 1 Axes>,\n<matplotlib.axes._subplots.AxesSubplot at 0x7fd733d23e90>)',
      true,
    ],
    ['Not matplotlib', false],
  ])('%s', (string, bool) => {
    expect(stringIsMatplotlibOutput(string)).toBe(bool);
  });
});
