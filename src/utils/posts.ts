import type { ImageMetadata } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";

import { SITE } from "@astro-theme-site/config";
import {
  CONTENT_TYPES,
  type ContentType,
} from "@tsche/astro-blog-theme/config";
import { withBase } from "@tsche/astro-blog-theme/site";
import { slugify } from "@tsche/astro-blog-theme/slugify";

export { CONTENT_TYPES, type ContentType };

export const enabledContentTypes = CONTENT_TYPES.filter(
  (type) => SITE.contentTypes[type] !== undefined,
);
export type Post = CollectionEntry<"posts">;
export type PostAuthor = { name: string; url?: string };

const isProd = import.meta.env.PROD;
const skipCollections = import.meta.env.CI_SKIP_CONTENT_COLLECTIONS === "true";

export function contentType(entry: Post): ContentType {
  const type = entry.id.split(/[\\/]/)[0];
  if (CONTENT_TYPES.includes(type as ContentType)) return type as ContentType;
  throw new Error(`Unsupported content type in entry id: ${entry.id}`);
}

export function postSlug(entry: Post): string {
  return entry.id.split("/").slice(1).join("/");
}

export function postPath(entry: Post): string {
  return withBase(`/${entry.id}/`);
}

export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.data.pinned !== b.data.pinned) return a.data.pinned ? -1 : 1;
    return (b.data.pubDate?.valueOf() ?? 0) - (a.data.pubDate?.valueOf() ?? 0);
  });
}

export function sortPostsByDate(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) =>
      (b.data.pubDate?.valueOf() ?? 0) - (a.data.pubDate?.valueOf() ?? 0),
  );
}

export async function getPosts(): Promise<Post[]> {
  if (skipCollections) return [];
  const posts = await getCollection("posts", (entry) => {
    if (isProd && entry.data.draft) return false;
    const type = entry.id.split(/[\\/]/)[0] as ContentType;
    return enabledContentTypes.includes(type) && !entry.data.unlisted;
  });
  return sortPosts(posts);
}

export async function getUnlistedPosts(): Promise<Post[]> {
  if (skipCollections) return [];
  const posts = await getCollection("posts", (entry) => {
    if (isProd && entry.data.draft) return false;
    const type = entry.id.split(/[\\/]/)[0] as ContentType;
    return enabledContentTypes.includes(type) && entry.data.unlisted;
  });
  return sortPosts(posts);
}

export async function getPostBySlug(
  type: ContentType,
  slug: string,
): Promise<Post | undefined> {
  return (await getPosts()).find(
    (post) => contentType(post) === type && postSlug(post) === slug,
  );
}

export async function getTagsWithCount(): Promise<
  Array<{ name: string; count: number }>
> {
  const counts = new Map<string, number>();
  for (const post of await getPosts()) {
    for (const tag of post.data.tags)
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    },
  );
}

export async function getCategoriesWithCount(): Promise<
  Array<{ name: string; count: number }>
> {
  const counts = new Map<string, number>();
  for (const post of await getPosts()) {
    for (const category of post.data.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  return Array.from(counts, ([name, count]) => ({ name, count })).sort(
    (a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    },
  );
}

export function groupByYearMonth(posts: Post[]): Array<{
  year: number;
  months: Array<{ month: number; label: string; posts: Post[] }>;
}> {
  const buckets = new Map<number, Map<number, Post[]>>();
  for (const post of posts) {
    const year = post.data.pubDate.getFullYear();
    const month = post.data.pubDate.getMonth();
    if (!buckets.has(year)) buckets.set(year, new Map());
    const months = buckets.get(year)!;
    if (!months.has(month)) months.set(month, []);
    months.get(month)!.push(post);
  }
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long" });
  return Array.from(buckets.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({
      year,
      months: Array.from(months.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([month, list]) => ({
          month,
          label: monthName.format(new Date(year, month, 1)),
          posts: list,
        })),
    }));
}

export function shouldShowHero(post: Post): boolean {
  return (
    Boolean(post.data.heroImage) &&
    (post.data.showFeaturedImage ?? SITE.showFeaturedImages)
  );
}

export function postAuthors(post: Post): PostAuthor[] {
  if (post.data.authors.length > 0) return post.data.authors;
  return [{ name: SITE.author.name, url: SITE.author.url }];
}

/** Tags worth displaying in compact overview metadata. Full post metadata is unchanged. */
export function overviewTags(post: Post): string[] {
  const hidden = new Set(
    (SITE.overview?.hiddenTags ?? []).map((tag) => tag.toLocaleLowerCase()),
  );
  return post.data.tags.filter((tag) => !hidden.has(tag.toLocaleLowerCase()));
}

export function hasDistinctAuthors(posts: Post[]): boolean {
  return (
    new Set(
      posts.map((post) =>
        postAuthors(post)
          .map(({ name }) => name)
          .sort()
          .join("\u0000"),
      ),
    ).size > 1
  );
}

export function hasDistinctCategories(posts: Post[]): boolean {
  return (
    new Set(
      posts.map((post) => [...post.data.categories].sort().join("\u0000")),
    ).size > 1
  );
}

export function heroImageSrc(post: Post): string | undefined {
  const image = post.data.heroImage;
  if (!image) return undefined;
  const src = typeof image === "string" ? image : image.src;
  return src.startsWith("/") && !src.startsWith("//") ? withBase(src) : src;
}

export function heroImage(post: Post): ImageMetadata | string | undefined {
  const image = post.data.heroImage;
  if (
    typeof image === "string" &&
    image.startsWith("/") &&
    !image.startsWith("//")
  ) {
    return withBase(image);
  }
  return image;
}

export function tagPath(tag: string): string {
  return withBase(`/tags/${slugify(tag)}/`);
}

export function categoryPath(category: string): string {
  return withBase(`/categories/${slugify(category)}/`);
}

/** Link back to a content collection with one client-side metadata filter. */
export function collectionFilterPath(
  type: ContentType,
  filter: "tag" | "date" | "author",
  value: string,
): string {
  const params = new URLSearchParams({ [filter]: value });
  return `${withBase(`/${type}/`)}?${params.toString()}`;
}

export { slugify } from "@tsche/astro-blog-theme/slugify";
