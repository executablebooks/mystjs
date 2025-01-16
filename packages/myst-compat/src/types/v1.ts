import type { IOutput } from '@jupyterlab/nbformat';
import type { Outputs as Outputs2 } from './v2.js';
import type { Parent, Literal } from 'mdast';

export type Visibility = 'show' | 'hide' | 'remove';

export type Output = {
  type: 'output';
  children?: (Parent | Literal)[];

  data?: IOutput[];
  visibility?: Visibility;

  html_id?: string;
  label?: string;
  identifier?: string;

  id?: string;

  // v1 introduces v2 syntax early, through a new attribute
  // in v2, this attribute is removed
  _future_ast?: Outputs2;
};
