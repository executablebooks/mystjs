import type { Handle, State } from 'mdast-util-to-markdown';
import type { VFile } from 'vfile';

export type NestedKinds = {
  role: number;
  directive: number;
};

export type NestedLevels = {
  nestedLevels: NestedKinds;
  nestedMaxLevels: NestedKinds;
};

export type NestedState = State & Partial<NestedLevels>;

export type Parent = Parameters<Handle>[1];

export type Validator = (node: any, file: VFile) => void;
