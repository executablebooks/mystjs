import type { Plugin } from 'unified';
import type { Blockquote, Legend, Caption, FlowContent } from 'myst-spec';
import type { Container } from 'myst-spec-ext';
import { select, selectAll } from 'unist-util-select';
import { remove } from 'unist-util-remove';
import type { GenericParent } from 'myst-common';
import { normalizeLabel } from 'myst-common';

export type SupplementaryMaterial = {
  type: 'supplementaryMaterial';
  enumerator?: string;
  figIdentifier?: string;
  sourceUrl?: string;
  sourceSlug?: string;
  embedIdentifier?: string;
};

function liftCaptionNumber(container: Container) {
  // TODO: this won't work for multi-panel figures?
  const caption = select('caption', container);
  const captionNumber = select('captionNumber', container);
  if (caption) remove(caption, 'captionNumber');
  if (captionNumber) container.children.splice(0, 0, captionNumber as any);
}

export function containerTransform(mdast: GenericParent) {
  const figures = selectAll('container', mdast) as Container[];
  figures.forEach((container) => {
    liftCaptionNumber(container);
    if ((container as any).kind === 'quote') {
      const caption = select('caption > paragraph', container);
      const blockquote = select('blockquote', container) as Blockquote;
      if (blockquote && caption) {
        const newContainer = container as unknown as Blockquote;
        newContainer.type = 'blockquote';
        newContainer.children = blockquote.children;
        caption.type = 'attrib'; // Change the caption to attribution for JATS
        newContainer.children.push(caption as any);
      }
    }
    const caption = (select('caption', container) ?? { type: 'caption', children: [] }) as Caption;
    const legends = selectAll('legend', container) as Legend[];
    if (legends.length) {
      const legendChildren = legends.map((leg) => leg.children).flat() as FlowContent[] & Node[];
      caption.children.push(...legendChildren);
      remove(container as any, 'legend');
    }
    const { identifier } = normalizeLabel(container.source?.label) ?? {};
    if (identifier && container.source) {
      caption.children.push({
        type: 'supplementaryMaterial',
        enumerator: container.enumerator,
        figIdentifier: container.identifier,
        sourceUrl: container.source.url,
        sourceSlug: container.source.slug,
        embedIdentifier: identifier,
      } as SupplementaryMaterial);
    }
    if (caption.children?.length && !select('caption', container)) {
      container.children.push(caption);
    }
    if ((container as any).kind === 'figure') {
      container.children = [
        ...container.children.filter((child) => child.type.startsWith('caption')),
        ...container.children.filter((child) => !child.type.startsWith('caption')),
      ];
    }
  });
}

export const containerPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  containerTransform(tree);
};
