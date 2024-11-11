import rehypeFormat from 'rehype-format';
import type { Plugin } from 'unified';

export const formatHtml: Plugin<[boolean?], string, undefined> = function formatHtml(opt) {
  if (opt) {
    rehypeFormat(typeof opt === 'boolean' ? {} : opt);
  }
};
