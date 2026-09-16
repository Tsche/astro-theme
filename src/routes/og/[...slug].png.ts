/**
 * Dynamic OG image endpoint.
 *
 * Generates a 1200×630 PNG for each post that doesn't have a custom
 * heroImage. Posts WITH a heroImage get their image used as the OG
 * directly (handled in the SEO/layout layer) — this endpoint only
 * produces fallback images for posts that lack one.
 *
 * Route: /og/[...slug].png
 * Example: /og/articles/welcome.png
 */
/* global Response */
import type { GetStaticPaths } from "astro";
import { generateOgImage } from "@tsche/astro-blog-theme/og-image";
import {
  contentType,
  getPosts,
  postSlug,
  type Post,
} from "@tsche/astro-blog-theme/posts";
import { SITE } from "@astro-theme-site/config";
import { formatDate } from "@tsche/astro-blog-theme/site";

export const getStaticPaths: GetStaticPaths = async () => {
  // When autoOgImage is disabled, or skipped via CI flag, generate no OG images.
  if (!SITE.autoOgImage || import.meta.env.CI_SKIP_AUTO_OG_IMAGE === "true")
    return [];

  const paths: Array<{ params: { slug: string }; props: { post: Post } }> = [];
  const posts = await getPosts();
  for (const post of posts) {
    // Skip posts that already have a custom heroImage to save build time.
    if (post.data.heroImage) continue;

    const slug = postSlug(post);
    paths.push({
      params: { slug: `${contentType(post)}/${slug}` },
      props: { post },
    });
  }
  return paths;
};

interface Props {
  post: Post;
}

export async function GET({ props }: { props: Props }) {
  const { post } = props;

  const date = post.data.pubDate ? formatDate(post.data.pubDate) : undefined;

  const png = await generateOgImage({
    title: post.data.title,
    description: post.data.description,
    date,
    category: post.data.categories[0],
    tags: post.data.tags,
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
