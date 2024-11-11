import type {
  DirectiveSpec,
  DirectiveData,
  DirectiveContext,
  GenericNode,
  GenericParent,
} from 'myst-common';
import { fileError, RuleId } from 'myst-common';
import type { VFile } from 'vfile';
import { parse } from 'csv-parse/browser/esm/sync';
import { select } from 'unist-util-select';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const tableDirective: DirectiveSpec = {
  name: 'table',
  arg: {
    type: 'myst',
    doc: 'An optional table caption',
  },
  options: {
    ...commonDirectiveOptions('table'),
    class: {
      type: String,
      // class_option: list of strings?
      doc: `CSS classes to add to your table. Special classes include:

- \`full-width\`: changes the table environment to cover two columns in LaTeX`,
    },
    align: {
      type: String,
      // choice(['left', 'center', 'right'])
    },
  },
  body: {
    type: 'myst',
    required: true,
  },
  run(data): GenericNode[] {
    const children = [];
    if (data.arg) {
      children.push({
        type: 'caption',
        children: [{ type: 'paragraph', children: data.arg as GenericNode[] }],
      });
    }
    children.push(...(data.body as GenericNode[]));
    const container = {
      type: 'container',
      kind: 'table',
      class: data.options?.class,
      children,
    };
    addCommonDirectiveOptions(data, container);
    return [container];
  },
};

export const listTableDirective: DirectiveSpec = {
  name: 'list-table',
  arg: {
    type: 'myst',
    doc: 'An optional table caption',
  },
  options: {
    ...commonDirectiveOptions('list table'),
    'header-rows': {
      type: Number,
      // nonnegative int
    },
    // 'stub-columns': {
    //   type: Number,
    //   // nonnegative int
    // },
    // width: {
    //   type: String,
    //   // length_or_percentage_or_unitless,
    // },
    // widths: {
    //   type: String,
    //   // TODO use correct widths option validator
    // },
    class: {
      type: String,
      // class_option: list of strings?
      doc: `CSS classes to add to your table. Special classes include:

- \`full-width\`: changes the table environment to cover two columns in LaTeX`,
    },
    align: {
      type: String,
      // choice(['left', 'center', 'right'])
    },
  },
  body: {
    type: 'myst',
    required: true,
  },
  validate(data: DirectiveData, vfile: VFile) {
    const validatedData = { ...data };
    const parsedBody = data.body as GenericNode[];
    if (parsedBody.length !== 1 || parsedBody[0].type !== 'list') {
      fileError(vfile, 'list-table directive must have one list as body', {
        node: data.node,
        ruleId: RuleId.directiveBodyCorrect,
      });
      validatedData.body = [];
    } else {
      parsedBody[0].children?.forEach((listItem) => {
        if (!(validatedData.body as GenericNode[]).length) return;
        if (
          listItem.type !== 'listItem' ||
          listItem.children?.length !== 1 ||
          listItem.children[0]?.type !== 'list'
        ) {
          fileError(vfile, 'list-table directive must have a list of lists', {
            node: data.node,
            ruleId: RuleId.directiveBodyCorrect,
          });
          validatedData.body = [];
        }
      });
    }
    return validatedData;
  },
  run(data: DirectiveData): GenericNode[] {
    const children = [];
    if (data.arg) {
      children.push({
        type: 'caption',
        children: [{ type: 'paragraph', children: data.arg as GenericNode[] }],
      });
    }
    const topListChildren = (data.body as GenericNode[])[0]?.children || [];
    let headerCount = (data.options?.['header-rows'] as number) || 0;
    const table = {
      type: 'table',
      align: data.options?.align,
      children: topListChildren.map((topListItem) => {
        const nestedListChildren = topListItem.children?.[0]?.children || [];
        const row = {
          type: 'tableRow',
          children: nestedListChildren.map((nestedListItem) => {
            const cell = {
              type: 'tableCell',
              header: headerCount > 0 ? true : undefined,
              children: nestedListItem.children,
            };
            return cell;
          }),
        };
        headerCount -= 1;
        return row;
      }),
    };
    children.push(table);
    const container = {
      type: 'container',
      kind: 'table',
      class: data.options?.class,
      children,
    };
    addCommonDirectiveOptions(data, container);
    return [container];
  },
};

type ParseCsvOptions = {
  delim?: 'tab' | 'space' | string;
  keepspace?: boolean;
  quote?: string;
  escape: string;
};
/**
 * Parse a CSV-table comprising of (inline) MyST Markdown
 *
 * @param data - CSV string
 * @param opts - directive options
 * @param ctx - directive evaluation context
 */
function parseCSV(data: string, ctx: DirectiveContext, opts?: ParseCsvOptions): GenericParent[][] {
  const delimiter = opts?.delim ?? ',';
  const records = parse(data, {
    delimiter: delimiter === 'tab' ? '\t' : delimiter === 'space' ? ' ' : delimiter,
    ltrim: !opts?.keepspace,
    escape: opts?.escape ?? '"',
    quote: opts?.quote ?? '"',
  });

  return records.map((record: any, recordIndex: number) => {
    return record.map((cell: string) => {
      const mdast = ctx.parseMyst(cell, recordIndex);
      // May be null!
      return select('*:root > paragraph:only-child', mdast);
    });
  });
}

// Documentation is from Docutils
// License is public domain: https://docutils.sourceforge.io/COPYING.html
export const csvTableDirective: DirectiveSpec = {
  name: 'csv-table',
  doc: 'The "csv-table" directive is used to create a table from CSV (comma-separated values) data.',
  arg: {
    type: 'myst',
    doc: 'An optional table caption',
  },
  options: {
    ...commonDirectiveOptions('CSV table'),
    // file: {
    //   type: String,
    //   doc: 'The local filesystem path to a CSV data file.',
    //   alias: ['url'],
    //  Add this to the description for the directive:
    //  The data may be internal (an integral part of the document) or external (a separate file).
    // },
    header: {
      type: String,
      // nonnegative int
      doc: 'Supplemental data for the table header, added independently of and before any header-rows from the main CSV data. Must use the same CSV format as the main CSV data.',
    },
    'header-rows': {
      type: Number,
      // nonnegative int
      doc: 'The number of rows of CSV data to use in the table header. Defaults to 0.',
    },
    class: {
      type: String,
      // class_option: list of strings?
      doc: `CSS classes to add to your table. Special classes include:

- \`full-width\`: changes the table environment to cover two columns in LaTeX`,
    },
    align: {
      type: String,
      // choice(['left', 'center', 'right'])
    },
    delim: {
      type: String,
      doc: 'The character used to separate data fields. The special values "tab" and "space" are converted to the respective whitespace characters. Defaults to "," (comma)',
    },
    keepspace: {
      type: Boolean,
      doc: 'Treat whitespace immediately following the delimiter as significant. The default is to ignore such whitespace.',
    },
    quote: {
      type: String,
      doc: 'The character used to quote fields containing special characters, such as the delimiter, quotes, or new-line characters. Must be a single character, defaults to `"` (a double quote)\\\nFor example, `First cell, "These commas, for example, are escaped", Next cell`',
    },
    escape: {
      type: String,
      doc: 'A character used to escape the delimiter or quote characters from the CSV parser. Must be a single character, defaults to `"` (a double quote) default is a double quote\\\nFor example, `First cell, "These quotes"", for example, are escaped", Next cell`',
    },
  },
  body: {
    type: String,
    doc: 'The CSV content',
    required: true,
  },
  run(data: DirectiveData, vfile: VFile, ctx: DirectiveContext): GenericNode[] {
    const captions: GenericParent[] = [];
    if (data.arg) {
      captions.push({
        type: 'caption',
        children: [{ type: 'paragraph', children: data.arg as GenericNode[] }],
      });
    }

    const rows: GenericParent[] = [];

    if (data.options?.header !== undefined) {
      let headerCells: GenericParent[][] = [];
      try {
        headerCells = parseCSV(data.options.header as string, ctx, data.options as ParseCsvOptions);
      } catch (error) {
        fileError(vfile, 'csv-table directive header must be valid CSV-formatted MyST', {
          node: (select('mystDirectiveOption[name="header"]', data.node) ??
            data.node) as GenericNode,
          ruleId: RuleId.directiveOptionsCorrect,
        });
      }
      rows.push(
        ...headerCells.map((parsedRow) => ({
          type: 'tableRow',
          children: parsedRow.map((parsedCell) => ({
            type: 'tableCell',
            header: true,
            children: parsedCell?.children ?? [],
          })),
        })),
      );
    }

    let bodyCells: GenericParent[][] = [];
    try {
      bodyCells = parseCSV(data.body as string, ctx, data.options as ParseCsvOptions);
    } catch (error) {
      fileError(vfile, 'csv-table directive body must be valid CSV-formatted MyST', {
        node: (select('mystDirectiveBody', data.node) ?? data.node) as GenericNode,
        ruleId: RuleId.directiveBodyCorrect,
      });
    }

    let headerCount = (data.options?.['header-rows'] as number) || 0;
    rows.push(
      ...bodyCells.map((parsedRow) => {
        const row = {
          type: 'tableRow',
          children: parsedRow.map((parsedCell) => ({
            type: 'tableCell',
            header: headerCount > 0 ? true : undefined,
            children: parsedCell?.children ?? [],
          })),
        };

        headerCount -= 1;
        return row;
      }),
    );
    const table = {
      type: 'table',
      align: data.options?.align,
      children: rows,
    };

    const container = {
      type: 'container',
      kind: 'table',
      class: data.options?.class,
      children: [...captions, table],
    };
    addCommonDirectiveOptions(data, container);

    return [container];
  },
};
