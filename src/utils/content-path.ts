import { slugify } from "./slugify";

const MARKUP_EXTENSION = /\.(?:md|mdx)$/i;
const DATE_PREFIX = /^\d{4}(?:-?\d{2}){2}[-_]+/;

export interface ContentIdOptions {
  /** Path relative to the content directory, including the content type. */
  entry: string;
  /** Optional route override from frontmatter. */
  permalink?: unknown;
}

function stripDatePrefix(segment: string): string {
  return segment.replace(DATE_PREFIX, "");
}

function cleanSegment(segment: string): string {
  return slugify(stripDatePrefix(segment.replace(/^_/, "")));
}

function normalizeOverride(type: string, permalink: string): string {
  const segments = permalink
    .trim()
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);
  if (segments[0] === type) segments.shift();
  if (
    segments.length === 0 ||
    segments.some((part) => part === "." || part === "..")
  ) {
    throw new Error(`Invalid permalink "${permalink}" for ${type}`);
  }
  return `${type}/${segments.map(slugify).join("/")}`;
}

/**
 * Turn a source filename into the one canonical content ID used by every
 * route. Root files use their filename; `_index` uses its parent directory;
 * and date prefixes are removed from directory and file segments.
 */
export function canonicalContentId({
  entry,
  permalink,
}: ContentIdOptions): string {
  const normalized = entry.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!MARKUP_EXTENSION.test(normalized)) {
    throw new Error(`Unsupported content markup: ${entry}`);
  }

  const sourceSegments = normalized.replace(MARKUP_EXTENSION, "").split("/");
  const type = sourceSegments.shift();
  if (!type) throw new Error(`Content entry has no content type: ${entry}`);

  if (typeof permalink === "string" && permalink.trim()) {
    return normalizeOverride(type, permalink);
  }

  if (sourceSegments.length === 1 && sourceSegments[0] === "_index") {
    throw new Error(
      `Top-level _index files are reserved and cannot be content entries: ${entry}`,
    );
  }

  const filename = sourceSegments.pop();
  if (!filename) throw new Error(`Content entry has no filename: ${entry}`);
  const directories = sourceSegments.map(cleanSegment);
  const isDirectoryIndex =
    filename === "_index" || (filename === "index" && directories.length > 0);
  const leaf = isDirectoryIndex ? undefined : cleanSegment(filename);
  const routeSegments = [...directories, ...(leaf ? [leaf] : [])];

  if (routeSegments.length === 0 || routeSegments.some((part) => !part)) {
    throw new Error(`Content entry produces an empty URL segment: ${entry}`);
  }
  return `${type}/${routeSegments.join("/")}`;
}

/** Only root markup files and underscore-prefixed files inside folders render. */
export function isContentPageSource(entry: string): boolean {
  const normalized = entry.replaceAll("\\", "/");
  if (!MARKUP_EXTENSION.test(normalized)) return false;
  const parts = normalized.split("/");
  const filename = parts.at(-1)!.replace(MARKUP_EXTENSION, "");
  if (parts.length === 2) return filename !== "_index";
  return filename.startsWith("_") || filename === "index";
}

/** Build a stateful ID callback that rejects two source files targeting one URL. */
export function createContentIdGenerator() {
  const contentIds = new Map<string, string>();
  const entryIds = new Map<string, string>();
  return ({
    entry,
    data,
  }: {
    entry: string;
    data: Record<string, unknown>;
  }) => {
    if (!isContentPageSource(entry))
      throw new Error(`Invalid content page source: ${entry}`);
    const id = canonicalContentId({ entry, permalink: data.permalink });
    const previousId = entryIds.get(entry);
    if (previousId && previousId !== id) contentIds.delete(previousId);
    const existing = contentIds.get(id);
    if (existing && existing !== entry) {
      throw new Error(
        `Content URL collision: "${existing}" and "${entry}" both resolve to "/${id}/"`,
      );
    }
    contentIds.set(id, entry);
    entryIds.set(entry, id);
    return id;
  };
}
