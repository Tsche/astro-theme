/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module "@cppsocial/codeblocks-hosted" {
  export function configureCodeBlocks(options: Record<string, unknown>): void;
  export function getCodeBlock(element: Element): {
    getValue(): string;
    sourceReady: Promise<void>;
  } | undefined;
  export function setCodeBlocksTheme(theme: "auto" | "light" | "dark", root?: ParentNode): void;
  export function startCodeBlocks(root?: ParentNode): void;
}

interface ImportMetaEnv {
  readonly CI_SKIP_CONTENT_COLLECTIONS?: string;
  readonly CI_SKIP_RSS_SITEMAP?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
