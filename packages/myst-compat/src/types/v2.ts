import type { IOutput } from '@jupyterlab/nbformat';
import type { Parent, Literal } from 'mdast';

export type Visibility = 'show' | 'hide' | 'remove';

export type Output = {
  type: 'output';
  children: (Parent | Literal)[];

  jupyter_data?: IOutput;

  label?: string;
  identifier?: string;
  html_id?: string;
};

export type Outputs = {
  type: 'outputs';
  children: (Parent | Literal)[];

  visibility?: Visibility;

  label?: string;
  identifier?: string;
  html_id?: string;

  id?: string;
};
