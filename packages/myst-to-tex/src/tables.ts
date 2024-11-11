import type { Table, TableRow, TableCell as SpecTableCell } from 'myst-spec';
import type { ITexSerializer } from './types.js';
import { addIndexEntries } from './utils.js';

export const TOTAL_TABLE_WIDTH = 886;

type TableCell = SpecTableCell & { colspan?: number; width?: number };

export function renderPColumn(width: number) {
  if (width === 1) return `p{\\dimexpr \\linewidth-2\\tabcolsep}`;
  return `p{\\dimexpr ${width.toFixed(3)}\\linewidth-2\\tabcolsep}`;
}

/**
 * given a table node, return the column widths
 *
 * @param node  - node.type.name === 'table'
 * @returns
 */
export function getColumnWidths(node: Table) {
  // TODO: unsure about rowspans
  let bestMaybeWidths: number[] = [];
  let mostNonNulls = 0;
  for (let i = 0; i < node.children.length; i += 1) {
    const row = node.children[i] as TableRow;
    const maybeWidths = row.children.reduce((acc: number[], cell: TableCell) => {
      const colwidth = new Array(cell.colspan ?? 1).fill(
        cell.width ? cell.width / (cell.colspan ?? 1) : null,
      );
      return [...acc, ...colwidth];
    }, []);
    const nonNulls = maybeWidths.filter((maybeWidth: number) => maybeWidth > 0).length;
    if (i === 0 || nonNulls >= mostNonNulls) {
      mostNonNulls = nonNulls;
      bestMaybeWidths = maybeWidths;
      if (mostNonNulls === maybeWidths.length) {
        break;
      }
    }
  }

  let widths;
  if (mostNonNulls === bestMaybeWidths.length) {
    widths = bestMaybeWidths;
  } else {
    // need to fill in the null colwidths
    const totalDefinedWidths = bestMaybeWidths.reduce(
      (acc: number, cur: number | null) => (cur == null ? acc : acc + cur),
      0,
    );
    const remainingSpace = TOTAL_TABLE_WIDTH - totalDefinedWidths;
    const nullCells = bestMaybeWidths.length - mostNonNulls;
    const defaultWidth = Math.floor(remainingSpace / nullCells);
    widths = bestMaybeWidths.map((w: number) => (w == null || w === 0 ? defaultWidth : w));
  }
  const total = widths.reduce((acc: number, cur: number) => acc + cur, 0);
  const fractionalWidths = widths.map((w: number) => w / total);
  const columnSpec = fractionalWidths.map((w: number) => renderPColumn(w)).join('');

  const numColumns = widths.length > 0 ? widths.length : (node?.children[0]?.children?.length ?? 0);

  return { widths: fractionalWidths, columnSpec, numColumns };
}

function renderTableCell(
  state: ITexSerializer,
  cell: TableCell,
  i: number,
  spanIdx: number,
  widths: number[],
  childCount: number,
) {
  let renderedSpan = 1;
  const colspan = cell.colspan ?? 1;
  if (colspan > 1) {
    let width = 0;
    for (let j = 0; j < colspan; j += 1) {
      width += widths[spanIdx + j];
    }
    state.write(`\\multicolumn{${colspan}}{${renderPColumn(width)}}{`);
    renderedSpan = colspan;
  }
  if (cell.children.length === 1 && (cell.children[0].type as string) === 'paragraph') {
    // Render simple things inline, otherwise render a block
    state.renderChildren(cell.children[0], true);
  } else {
    state.renderChildren(cell, true);
  }
  if (colspan > 1) state.write('}');
  if (i < childCount - 1) {
    state.write(' & ');
  }
  return renderedSpan;
}

/**
 * convert prosemirror table node into latex table
 */
export function renderNodeToLatex(node: Table, state: ITexSerializer) {
  state.usePackages('booktabs');
  const { widths, columnSpec, numColumns } = getColumnWidths(node);
  if (!numColumns) {
    throw new Error('invalid table format, no columns');
  }
  addIndexEntries(node, state);
  state.data.isInTable = true; // this is cleared at the end of this function
  if (!state.data.isInContainer) {
    state.write('\\bigskip\\noindent');
  }
  state.ensureNewLine();

  // if not in a longtable environment already (these replace the figure environment)
  // let dedent;
  // handle initial headers first
  let numHeaderRowsFound = 0;
  if (state.data.longFigure) {
    state.ensureNewLine();
    state.write('\\hline');
    state.ensureNewLine();
    let endHeader = false;
    // write the first header section
    node.children.forEach(({ children: rowContent }) => {
      if (endHeader) return;
      if (rowContent[0]?.header) {
        numHeaderRowsFound += 1;
        let spanIdx = 0;
        rowContent.forEach((cell, i) => {
          spanIdx += renderTableCell(state, cell, i, spanIdx, widths, rowContent.length);
        });
        state.write(' \\\\');
        state.ensureNewLine();
      }
      if (!rowContent[0]?.header) {
        endHeader = true;
      }
    });

    if (numHeaderRowsFound > 0) {
      state.ensureNewLine();
      state.write('\\hline');
      state.ensureNewLine();
      state.write('\\endfirsthead');
      state.ensureNewLine();

      state.write('\\hline');
      state.ensureNewLine();
      // write the continuation header section
      state.write(
        `\\multicolumn{${numColumns}}{c}{\\tablename\\ \\thetable\\ -- \\textit{Continued from previous page}}\\\\`,
      );
      state.ensureNewLine();
      node.children.forEach(({ children: rowContent }, index) => {
        if (index >= numHeaderRowsFound) return;
        let spanIdx = 0;
        rowContent.forEach((cell, i) => {
          spanIdx += renderTableCell(state, cell, i, spanIdx, widths, rowContent.length);
        });
        state.write(' \\\\');
        state.ensureNewLine();
      });
      state.ensureNewLine();
      state.write('\\hline');
      state.ensureNewLine();
      state.write('\\endhead');
      state.ensureNewLine();
    }
  } else {
    state.write(`\\begin{tabular}{${columnSpec}}`);
    state.ensureNewLine();
    // dedent = indent(state);
    state.write(`\\toprule`);
    state.ensureNewLine();
  }

  // todo: can we use offset and index to better handle row and column spans?
  node.children.forEach(({ children: rowContent }, index) => {
    if (index < numHeaderRowsFound) return; // skip the header rows
    let spanIdx = 0;
    rowContent.forEach((cell, i) => {
      spanIdx += renderTableCell(state, cell, i, spanIdx, widths, rowContent.length);
    });
    state.write(' \\\\');
    state.ensureNewLine();
    // If the first cell in this row is a table header, make a line
    if (rowContent[0]?.header) {
      state.write('\\hline');
      state.ensureNewLine();
    }
  });

  if (state.data.longFigure) {
    state.write('\\hline');
  } else {
    state.write('\\bottomrule');
    state.ensureNewLine();
    // dedent?.();
    state.write('\\end{tabular}');
  }
  state.closeBlock(node);
  state.data.isInTable = false;
  if (!state.data.isInContainer) {
    state.write('\\bigskip');
  }
}
