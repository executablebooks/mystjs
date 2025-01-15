import { describe, expect, it } from 'vitest';
import { buttonRole } from '../src';
import type { RoleData } from 'myst-common';

describe('Button component', () => {
  it('should process button role correctly', () => {
    const data: RoleData = { body: 'Click me<http://example.com>' };
    const result = buttonRole.run(data);
    expect(result).toEqual([
      {
        type: 'link',
        kind: 'button',
        url: 'http://example.com',
        children: [{ type: 'text', value: 'Click me' }],
      },
    ]);
  });

  it('should process button role without label correctly', () => {
    const data: RoleData = { body: 'http://example.com' };
    const result = buttonRole.run(data);
    expect(result).toEqual([
      {
        type: 'link',
        kind: 'button',
        url: 'http://example.com',
        children: [],
      },
    ]);
  });
});
