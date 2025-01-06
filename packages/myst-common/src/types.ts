import type { Plugin } from 'unified';
import type { Directive, Node, Role } from 'myst-spec';
import type { VFile } from 'vfile';
import type * as nbformat from '@jupyterlab/nbformat';
import type { PartialJSONObject } from '@lumino/coreutils';
import type { PageFrontmatter } from 'myst-frontmatter';

export type GenericNode<T extends Record<string, any> = Record<string, any>> = {
  type: string;
  kind?: string;
  children?: GenericNode<Record<string, any>>[];
  value?: string;
  identifier?: string;
  label?: string;
  position?: Node['position'];
} & T;

export type GenericParent<T extends Record<string, any> = Record<string, any>> = GenericNode<T> & {
  children: GenericNode<T>[];
};

export type Citations = {
  order: string[];
  data: Record<
    string,
    { label: string; html: string; enumerator: string; doi?: string; url?: string }
  >;
};

export enum NotebookCell {
  content = 'notebook-content',
  code = 'notebook-code',
}

export enum NotebookCellTags {
  'removeStderr' = 'remove-stderr',
  'removeStdout' = 'remove-stdout',
  'hideCell' = 'hide-cell',
  'hideInput' = 'hide-input',
  'hideOutput' = 'hide-output',
  'removeCell' = 'remove-cell',
  'removeInput' = 'remove-input',
  'removeOutput' = 'remove-output',
}

export type References = {
  cite?: Citations;
  article?: GenericParent;
};

// Types for defining roles and directives

export enum ParseTypesEnum {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  parsed = 'parsed',
}

export type ParseTypes = string | number | boolean | GenericNode[];

export type ArgDefinition = {
  type: ParseTypesEnum | typeof Boolean | typeof String | typeof Number | 'myst';
  required?: boolean;
  doc?: string;
};

export type BodyDefinition = ArgDefinition;

export type OptionDefinition = ArgDefinition & {
  alias?: string[];
};

export type DirectiveData = {
  name: string;
  node: Directive & { tight?: boolean | 'before' | 'after' };
  arg?: ParseTypes;
  options?: Record<string, ParseTypes>;
  body?: ParseTypes;
};

export type RoleData = {
  name: string;
  node: Role;
  body?: ParseTypes;
};

export type DirectiveContext = {
  parseMyst: (source: string, offset?: number) => GenericParent;
};

export type DirectiveSpec = {
  name: string;
  alias?: string[];
  doc?: string;
  arg?: ArgDefinition;
  options?: Record<string, OptionDefinition>;
  body?: BodyDefinition;
  validate?: (data: DirectiveData, vfile: VFile) => DirectiveData;
  run: (data: DirectiveData, vfile: VFile, ctx: DirectiveContext) => GenericNode[];
};

export type RoleSpec = {
  name: string;
  alias?: string[];
  doc?: string;
  body?: BodyDefinition;
  validate?: (data: RoleData, vfile: VFile) => RoleData;
  run: (data: RoleData, vfile: VFile) => GenericNode[];
};

type Select = (selector: string, tree?: GenericParent) => GenericNode | null;
type SelectAll = (selector: string, tree?: GenericParent) => GenericNode[] | null;

export type PluginUtils = { select: Select; selectAll: SelectAll };
export type PluginOptions = Record<string, any>;

export type TransformSpec = {
  name: string;
  doc?: string;
  stage: 'document' | 'project';
  before?: string;
  after?: string;
  // context?: 'tex' | 'docx' | 'jats' | 'typst' | 'site';
  plugin: Plugin<
    [PluginOptions | undefined, PluginUtils],
    GenericParent,
    GenericParent | Promise<GenericParent>
  >;
};

/**
 * Create MyST plugins that export this from a file,
 * or combine multiple plugins to a single object.
 */
export type MystPlugin = {
  name?: string;
  author?: string;
  license?: string;
  directives?: DirectiveSpec[];
  roles?: RoleSpec[];
  transforms?: TransformSpec[];
};

export type ValidatedMystPlugin = Required<Pick<MystPlugin, 'directives' | 'roles' | 'transforms'>>;

export enum TargetKind {
  heading = 'heading',
  equation = 'equation',
  subequation = 'subequation',
  figure = 'figure',
  table = 'table',
  code = 'code',
}

export enum AdmonitionKind {
  admonition = 'admonition',
  attention = 'attention',
  caution = 'caution',
  danger = 'danger',
  error = 'error',
  important = 'important',
  hint = 'hint',
  note = 'note',
  seealso = 'seealso',
  tip = 'tip',
  warning = 'warning',
}

export interface IExpressionOutput {
  status: 'ok';
  data: nbformat.IMimeBundle;
  metadata: PartialJSONObject;
}

export interface IExpressionError {
  status: 'error';
  /**
   * Exception name
   */
  ename: string;
  /**
   * Exception value
   */
  evalue: string;
  /**
   * Traceback
   */
  traceback: string[];
}

export type IExpressionResult = IExpressionError | IExpressionOutput;

export type FrontmatterPart = { mdast: GenericParent; frontmatter?: PageFrontmatter };

export type FrontmatterParts = Record<string, FrontmatterPart>;
