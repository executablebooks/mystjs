import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import type { Link } from 'myst-spec-ext';

const REF_PATTERN = /^(.+?)<([^<>]+)>$/;

export const buttonRole: RoleSpec = {
  name: 'button',
  doc: 'Button to navigate to external or internal links.',
  body: {
    type: String,
    doc: 'The body of the button.',
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const body = data.body as string;
    const match = REF_PATTERN.exec(body);
    const [, modified, rawLabel] = match ?? [];
    const url = rawLabel ?? body;
    const node: Link = {
      type: 'link',
      kind: 'button',
      url,
      children: [],
    };
    if (modified) node.children = [{ type: 'text', value: modified.trim() }];
    return [node];
  },
};
