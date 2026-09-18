import type { CollectionEntry } from "astro:content";

const MORE_MARKER = /<!--\s*more\s*-->/i;
const HTML_TAG = /<!--[\s\S]*?-->|<([a-z][\w:-]*)(?:\s[^<>]*?)?\/?>|<\/([a-z][\w:-]*)\s*>/gi;
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const FALLBACK_WORD_COUNT = 70;

export interface ContentPreview {
  html: string;
  hasMore: boolean;
}

function htmlBlocks(html: string) {
  const blocks: string[] = [];
  let depth = 0;
  let blockStart = 0;

  for (const match of html.matchAll(HTML_TAG)) {
    const tagName = (match[1] ?? match[2])?.toLowerCase();
    if (!tagName || match[0].startsWith("<!--")) continue;

    if (match[1]) {
      if (depth === 0) blockStart = match.index;
      if (!VOID_TAGS.has(tagName) && !match[0].endsWith("/>")) depth += 1;
    } else if (depth > 0) {
      depth -= 1;
      if (depth === 0) {
        blocks.push(html.slice(blockStart, match.index + match[0].length));
      }
    }
  }

  return blocks.length > 0 ? blocks : [html];
}

function wordCount(html: string) {
  return (html.replace(/<[^>]+>/g, " ").match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

function fallbackPreview(html: string) {
  const blocks = htmlBlocks(html);
  let wordTotal = 0;
  let blockCount = 0;

  while (blockCount < blocks.length && wordTotal < FALLBACK_WORD_COUNT) {
    wordTotal += wordCount(blocks[blockCount]);
    blockCount += 1;
  }

  return {
    html: blocks.slice(0, blockCount).join("\n"),
    hasMore: blockCount < blocks.length,
  };
}

/**
 * Return the part of a rendered post explicitly selected for compact feeds.
 *
 * Keeping the boundary in Markdown means the initial preview is pruned while
 * Astro generates the page. The browser may remove more complete blocks when
 * space gets tight, but it never has to begin with the entire post.
 */
export function previewHtml(post: CollectionEntry<"posts">) {
  const html = post.rendered?.html;
  if (!html) return undefined;

  const marker = MORE_MARKER.exec(html);
  if (!marker) return fallbackPreview(html);

  return {
    html: html.slice(0, marker.index).trimEnd(),
    hasMore: html.slice(marker.index + marker[0].length).trim().length > 0,
  } satisfies ContentPreview;
}
