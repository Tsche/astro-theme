import type { CollectionEntry } from "astro:content";

const PREVIEW_END = /<!--\s*preview-end\s*-->/i;

export interface ContentPreview {
  html: string;
  hasMore: boolean;
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

  const marker = PREVIEW_END.exec(html);
  if (!marker) return undefined;

  return {
    html: html.slice(0, marker.index).trimEnd(),
    hasMore: html.slice(marker.index + marker[0].length).trim().length > 0,
  } satisfies ContentPreview;
}
