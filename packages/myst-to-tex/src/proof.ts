import { fileError, writeTexLabelledComment, RuleId } from 'myst-common';
import type { Text } from 'myst-spec';
import type { ProofContainer, ProofKind } from 'myst-ext-proof';
import { select } from 'unist-util-select';
import { remove } from 'unist-util-remove';
import type { Handler } from './types.js';
import { addIndexEntries } from './utils.js';

function kindToEnvironment(kind: ProofKind): string {
  switch (kind) {
    case 'theorem':
      return 'theorem';
    case 'proof':
      return 'proof';
    case 'proposition':
      return 'proposition';
    case 'definition':
      return 'definition';
    case 'example':
      return 'example';
    case 'remark':
      return 'remark';
    case 'axiom':
      return 'axiom';
    case 'conjecture':
      return 'conjecture';
    case 'lemma':
      return 'lemma';
    case 'observation':
      return 'observation';
    case 'corollary':
      return 'corollary';
    default:
      return '';
  }
}

export const proofHandler: Handler = (node, state) => {
  state.usePackages('amsthm');

  const p = node as ProofContainer;
  const env = kindToEnvironment(p.kind ?? 'proof');
  if (!env) {
    fileError(state.file, `Unhandled LaTeX proof environment "${p.kind}"`, {
      node,
      source: 'myst-to-tex',
      ruleId: RuleId.texRenders,
    });
    return;
  }

  const t = select('admonitionTitle > text', node);
  if (t) {
    // Do not render the title twice
    t.type = '__delete__';
  }
  remove(node, '__delete__');
  addIndexEntries(node, state);
  state.write('\\begin{');
  state.write(env);
  state.write('}');
  if (t) {
    state.write('[');
    state.write((t as Text).value);
    state.write(']');
  }
  if (node.identifier && node.identifier.length > 0) {
    state.write('\\label{');
    state.write(node.identifier);
    state.write('}');
  }
  state.renderChildren(node, true);
  state.write('\\end{');
  state.write(env);
  state.write('}');

  state.data.hasProofs = true;
};

export class TexProofSerializer {
  static COMMENT_LENGTH = 50;

  preamble: string;

  constructor() {
    this.preamble = this.renderThmDefinitions();
  }

  private renderThmDefinitions(): string {
    const definitions = [
      '\\newtheorem{theorem}{Theorem}[section]',
      '\\newtheorem{corollary}{Corollary}[theorem]',
      '\\newtheorem{lemma}[theorem]{Lemma}',
      '\\newtheorem{proposition}{Proposition}[section]',
      '\\newtheorem{definition}{Definition}[section]',
      '\\newtheorem{example}{Example}[section]',
      '\\newtheorem{remark}{Remark}[section]',
      '\\newtheorem{axiom}{Axiom}[section]',
      '\\newtheorem{conjecture}{Conjecture}[section]',
      '\\newtheorem{observation}{Observation}[section]',
    ];
    const block = writeTexLabelledComment(
      'theorem',
      definitions,
      TexProofSerializer.COMMENT_LENGTH,
    );
    const percents = ''.padEnd(TexProofSerializer.COMMENT_LENGTH, '%');
    return `${percents}\n${block}${percents}\n`;
  }
}
