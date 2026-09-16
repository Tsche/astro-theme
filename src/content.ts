/**
 * Content Collections (Astro v7 loader API).
 *
 * Folder convention:
 *  - content/articles/<slug>/_index.{md,mdx} -> long-form writing
 *  - content/tips/<slug>/_index.{md,mdx}     -> compact technical tips
 *  - content/updates/<slug>/_index.{md,mdx}  -> chronological updates
 *  - content/{articles,tips,updates}/<slug>.{md,mdx} -> flat entries
 *  - content/pages/<name>.{md,mdx}          -> static pages
 */

import { glob } from "astro/loaders";
import { defineCollection, type SchemaContext } from "astro:content";
import { z } from "astro/zod";
import { createContentIdGenerator } from "./utils/content-path";

/**
 * Build the post / page frontmatter schema.
 *
 * `heroImage` accepts THREE shapes:
 *   1. An imported asset via `image()` — a path RELATIVE TO THE
 *      MARKDOWN FILE. Astro resolves
 *      it through its image pipeline (WebP, responsive `srcset`,
 *      width/height inferred). This is the recommended option.
 *   2. A public path (e.g. `/images/foo.jpg`) — copied as-is, NOT
 *      optimized.
 *   3. An external URL (https://…) — optimized at build if the host
 *      is allow-listed in `image.remotePatterns` in `astro.config.mjs`.
 */
export const baseFrontmatter = ({ image }: SchemaContext) =>
  z.object({
    title: z.string().min(1).max(140),
    description: z.string().min(1).max(280),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    authors: z
      .array(
        z.object({
          name: z.string().min(1),
          url: z.url().optional(),
        }),
      )
      .default([]),
    draft: z.boolean().default(false),
    heroImage: z.union([image(), z.string()]).optional(),
    /** Optional alt-text for the hero/featured image. */
    heroImageAlt: z.string().optional(),
    /** Per-post override of SITE.showFeaturedImages (cards + hero). */
    showFeaturedImage: z.boolean().optional(),
    /** Per-post override of SITE.dynamicPostCardHeight on listing cards. */
    dynamicPostCardHeight: z.boolean().optional(),
    canonicalURL: z.url().optional(),
    /** Override the generated route, either relative to its type or root-relative. */
    permalink: z.string().min(1).optional(),
    comments: z.boolean().optional(),
    toc: z.boolean().default(true),
    /** Pin to top of listings. */
    pinned: z.boolean().default(false),
    /** @deprecated Use `showcase: feature` instead. */
    highlighted: z.boolean().default(false),
    /** Control whether this post appears in the homepage recent-post reel. */
    showcase: z.enum(["auto", "hide", "feature"]).default("auto"),
    /**
     * Opt in to LaTeX math rendering (KaTeX). When `true`, the layout
     * loads `katex.min.css` only on this page so the stylesheet stays
     * off posts/pages that don't use math.
     */
    math: z.boolean().default(false),
    /**
     * Unlisted posts/pages are NOT shown in any listing (home, archives,
     * tags, categories, RSS, sitemap) but remain accessible to anyone who
     * knows the direct URL.
     *
     * Use `unlistedHideFromSeo: true` (the default when `unlisted: true`)
     * to also emit `<meta name="robots" content="noindex, nofollow">` so
     * search engines won't index or follow links on the page.
     */
    unlisted: z.boolean().default(false),
    /**
     * When `true`, adds `<meta name="robots" content="noindex, nofollow">`
     * to the page. Defaults to `true` whenever `unlisted: true`; can be
     * set independently to hide a listed post from search engines, or to
     * keep an unlisted post indexable (e.g. for sharing via a canonical URL
     * you control).
     */
    unlistedHideFromSeo: z.boolean().optional(),
  });

export type PostFrontmatter = z.infer<ReturnType<typeof baseFrontmatter>>;

/** Create version-neutral glob options for a consuming site's posts collection. */
export function postLoaderOptions(base: string | URL = "./content") {
  return {
    base,
    pattern: [
      "{articles,tips,updates}/*.{md,mdx}",
      "{articles,tips,updates}/**/_*.{md,mdx}",
      // Compatibility with the theme's original folder layout.
      "{articles,tips,updates}/**/index.{md,mdx}",
    ],
    generateId: createContentIdGenerator(),
  };
}

const posts = defineCollection({
  loader: glob(postLoaderOptions()),
  schema: baseFrontmatter,
});

export const pageFrontmatter = (ctx: SchemaContext) =>
  baseFrontmatter(ctx)
    .partial({ pubDate: true })
    .extend({
      /** Pages don't paginate or appear in archives. */
      showInNav: z.boolean().default(false),
    });

const pages = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./content/pages",
  }),
  schema: pageFrontmatter,
});

export const collections = { posts, pages };
