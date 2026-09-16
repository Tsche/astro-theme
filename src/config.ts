import type { ImageMetadata } from "astro";

export const CONTENT_TYPES = ["articles", "tips", "updates"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export interface ContentTypeConfig {
  /** Plural display name used for navigation and collection headings. */
  label: string;
  /** Singular display name used on post badges and calls to action. */
  singularLabel: string;
  /** Site-owned description used in collection metadata and headers. */
  description: string;
  /** Short descriptor displayed above a collection heading. */
  eyebrow: string;
  /** Maximum number of entries from this type shown on the landing page. */
  landingPageLimit?: number;
  /** Number of entries shown on each collection page before pagination. */
  postsPerPage?: number;
}

export interface SiteConfig {
  title: string;
  description: string;
  /** Enabled content types and their site-specific presentation copy. */
  contentTypes: Partial<Record<ContentType, ContentTypeConfig>>;
  author: {
    name: string;
    url?: string;
    avatar?: string | ImageMetadata;
    bio?: string;
  };
  /** Optional content license displayed in the site footer. */
  contentLicense?: {
    label: string;
    url: string;
  };
  defaultOgImage: string;
  postsPerPage: number;
  isoDates: boolean;
  showFeaturedImages: boolean;
  boxedArticles: boolean;
  dynamicPostCardHeight: boolean;
  /** Controls metadata shown on collection and taxonomy overview pages. */
  overview?: {
    /** Tags omitted from overview metadata, matched case-insensitively. */
    hiddenTags?: readonly string[];
  };
  autoOgImage: boolean;
  /** Optional third-party services enabled by the site. */
  analytics?: {
    /** Umami's lightweight analytics tracker. Omit or leave the ID empty to disable. */
    umami?: {
      websiteId: string;
      scriptUrl?: string;
      domains?: readonly string[];
      respectDoNotTrack?: boolean;
    };
  };
  url: string;
}

export interface NavItem {
  /** Text displayed for the link. */
  label: string;
  /** Root-relative path or absolute URL. */
  href: string;
  /** Optional astro-icon name. */
  icon?: string;
}

export interface NavigationConfig {
  /** Links displayed in both the desktop and mobile masthead. */
  top: readonly NavItem[];
  /** Links displayed in the site footer. */
  footer: readonly NavItem[];
}

export interface GiscusConfig {
  /** Master switch. */
  enabled: boolean;
  /** GitHub repo (e.g. `user/repo`). */
  repo: string;
  /** Repo ID (from giscus.app). */
  repoId: string;
  /** Discussion category. */
  category: string;
  /** Category ID. */
  categoryId: string;
  /** Discussion mapping strategy. */
  mapping: "pathname" | "url" | "title" | "og:title" | "specific" | "number";
  /** Strict matching. */
  strict: "0" | "1";
  /** Emit metadata events. */
  emitMetadata: "0" | "1";
  /** Comment input position. */
  inputPosition: "top" | "bottom";
  /** Lazy load. */
  loading: "lazy" | "eager";
}
