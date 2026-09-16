/* global URL */
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { SITE } from "@astro-theme-site/config";
import { getPosts, postPath } from "@tsche/astro-blog-theme/posts";

export const GET: APIRoute = async (context) => {
  if (import.meta.env.CI_SKIP_RSS_SITEMAP === "true") {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const siteWithBase = `${(context.site ?? new URL(SITE.url)).origin}${base}`;
    return rss({
      title: SITE.title,
      description: SITE.description,
      site: siteWithBase,
      stylesheet: `${base}/rss/styles.xsl`,
      items: [],
      customData: `<language>en-us</language>`,
    });
  }

  const posts = await getPosts();
  // `BASE_URL` ends with a slash, so slice it off to avoid duplicate slashes.
  // so we slice it off when concatenating to avoid '//rss/styles.xsl'.
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const siteWithBase = `${(context.site ?? new URL(SITE.url)).origin}${base}`;
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: siteWithBase,
    stylesheet: `${base}/rss/styles.xsl`,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: postPath(post),
      categories: [...post.data.tags, ...post.data.categories],
    })),
    customData: `<language>en-us</language>`,
  });
};
