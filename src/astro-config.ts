import { satteri, satteriHeadingIdsPlugin } from "@astrojs/markdown-satteri";
import { astroBlogTheme } from "./integration";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { definePlugin } from "@expressive-code/core";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import { defineConfig, fontProviders, svgoOptimizer } from "astro/config";
import {
  copyFileSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import satteriExternalLinks from "satteri-external-links";
import { katex } from "@nullpinter/satteri-katex";
import { satteriAlert } from "./markdown/satteri-alert";
import { satteriAsHTML } from "./markdown/satteri-ashtml";
import { satteriBaseLinks } from "./markdown/satteri-base-links";
import { satteriAutolinkHeadings } from "./markdown/satteri-autolink-headings";
import type { SiteConfig } from "./config";

export const copyOptInPlugin = definePlugin({
  name: "copy-button-opt-in",
  hooks: {
    postprocessRenderedBlockGroup({ renderedGroupContents, renderData }) {
      if (
        !renderedGroupContents.some(({ codeBlock }) =>
          codeBlock.metaOptions.getBoolean("copy"),
        )
      )
        return;
      const classes = renderData.groupAst.properties.className;
      renderData.groupAst.properties.className = [
        ...(Array.isArray(classes)
          ? classes
          : classes
            ? [String(classes)]
            : []),
        "code-copy-enabled",
      ];
    },
  },
});

export function defineBlogConfig(siteConfig: SiteConfig) {
  const rawBase = (process.env.BASE_PATH ?? "/").replace(/\/$/, "");
  const BASE = rawBase.startsWith("/") ? rawBase : `/${rawBase}`;
  const SITEMAP_XSL_HREF = `${BASE}/sitemap/styles.xsl`;
  const SKIP_RSS_SITEMAP = process.env.CI_SKIP_RSS_SITEMAP === "true";

  /**
   * Set of URL path segments that belong to unlisted posts/pages.
   * Populated by `collectUnlistedUrls()` integration before the sitemap
   * integration runs, so the sitemap `filter` can exclude them.
   *
   * We use path segments (e.g. "articles/my-slug") rather than full URLs so
   * the check works regardless of the configured site URL or base path.
   */
  const unlistedPathSegments = new Set();

  /**
   * Integration that reads the content collection at build time and
   * populates `unlistedPathSegments` with the URL path segments of every
   * unlisted post. Must be listed BEFORE `@astrojs/sitemap` in the
   * integrations array.
   */
  function collectUnlistedUrls() {
    return {
      name: "site:collect-unlisted-urls",
      hooks: {
        "astro:build:start": async () => {
          try {
            // Dynamically import so this only runs during builds (not in
            // the config evaluation phase where astro:content isn't ready).
            const { getCollection } = await import("astro:content");
            const entries = await getCollection("posts");
            for (const entry of entries) {
              if (!entry.data.unlisted) continue;
              unlistedPathSegments.add(
                entry.id
                  .replace(/(?:^|\/)index\.(md|mdx)$/i, "")
                  .replace(/\.(md|mdx)$/i, ""),
              );
            }
          } catch {
            // Content collections aren't available in all build contexts
            // (e.g. CI fast mode). Silently skip — the sitemap will include
            // unlisted posts in that case, which is acceptable for CI.
          }
        },
      },
    };
  }

  /**
   * Tiny inline integration: after `@astrojs/sitemap` runs, rewrite the
   * absolute XSL `href` it emits (always prefixed with `site`, e.g.
   * an absolute sitemap stylesheet URL to a root-relative path.
   *
   * Why: a root-relative href works in BOTH environments
   *   - production: same origin as the sitemap, browsers apply the XSL
   *   - `bun serve` / preview: same origin (localhost), no cross-origin
   *     XSLT block (which renders as a blank page in browsers).
   *
   * Crawlers ignore `<?xml-stylesheet ?>` entirely, so SEO is unaffected.
   */
  function rewriteSitemapXslToRelative() {
    return {
      name: "site:rewrite-sitemap-xsl",
      hooks: {
        "astro:build:done": (/** @type {{ dir: URL }} */ { dir }) => {
          const distDir = fileURLToPath(dir);
          const files = readdirSync(distDir).filter(
            (f) => f.startsWith("sitemap") && f.endsWith(".xml"),
          );
          for (const file of files) {
            const path = join(distDir, file);
            const xml = readFileSync(path, "utf8");
            const fixed = xml.replace(
              /<\?xml-stylesheet\b[^?]*\?>/,
              `<?xml-stylesheet type="text/xsl" href="${SITEMAP_XSL_HREF}"?>`,
            );
            if (fixed !== xml) writeFileSync(path, fixed);
          }

          const indexPath = join(distDir, "sitemap-index.xml");
          const aliasPath = join(distDir, "sitemap.xml");
          if (readdirSync(distDir).includes("sitemap-index.xml")) {
            copyFileSync(indexPath, aliasPath);
          }
        },
      },
    };
  }

  // https://astro.build/config
  return defineConfig({
    site: siteConfig.url,
    redirects: siteConfig.redirects,

    // GitHub Pages serves the project at https://<user>.github.io/<repo>/,
    // so production builds need `base` to match that subpath — every
    // generated asset URL (CSS, JS, images, favicons) is prefixed with it.
    //
    // In `bun run dev`, however, we want the site to open at plain
    // `http://localhost:4321/` for a friction-free local experience. The
    // `BASE_PATH` env var (read from `.env`) lets each environment opt in:
    //   - `.env` (committed empty / unset)         → dev runs at `/`
    //   - root deployments leave BASE_PATH empty
    //
    // In source code, build absolute paths through `withBase()` / `sitePath()`
    // in `src/utils/site.ts` so they pick up this value
    // automatically (via `import.meta.env.BASE_URL`).
    base: process.env.BASE_PATH ?? "/",
    trailingSlash: "ignore",
    build: {
      format: "directory",
    },
    prefetch: true,

    // Image optimization (https://docs.astro.build/en/guides/images/).
    //
    // - Imported images from `assets/` and content directories are optimized
    //   automatically by `astro:assets`.
    // - Images in `public/` are copied as-is and CANNOT be transformed.
    // - Remote URLs must match a `remotePatterns` entry below before they
    //   can be passed to `<Image>` / `<Picture>` for optimization.
    //
    // The default Sharp service generates modern formats (WebP/AVIF) and
    // responsive `srcset`s. With `responsiveStyles: true` and a default
    // `layout`, every `<Image layout="...">` automatically gets the right
    // `width`/`height`/`object-fit` styles applied.
    image: {
      layout: "constrained",
      responsiveStyles: true,
      remotePatterns: [
        // Unsplash.
        { protocol: "https", hostname: "images.unsplash.com" },
        // Common CDNs many users plug in. Extend or trim as needed.
        { protocol: "https", hostname: "**.githubusercontent.com" },
        { protocol: "https", hostname: "cdn.jsdelivr.net" },
        { protocol: "https", hostname: "res.cloudinary.com" },
        { protocol: "https", hostname: "imagedelivery.net" },
      ],
    },

    markdown: {
      // `remark-math` parses `$inline$` and `$$display$$` blocks into MDAST
      // math nodes; `rehype-katex` converts them to pre-rendered HTML at
      // build time so no JavaScript is shipped to the client.
      //
      // The accompanying KaTeX stylesheet (`katex/dist/katex.min.css`) is
      // loaded ONLY on pages that opt in via `math: true` in frontmatter,
      // through `<MathStyles />` in the post / page layouts. This keeps the
      // CSS (~25kB gzipped) off pages that don't need it.
      processor: satteri({
        features: { math: true },
        mdastPlugins: [satteriAlert(), satteriAsHTML(), katex()],
        hastPlugins: [
          satteriHeadingIdsPlugin(),
          satteriAutolinkHeadings(),
          satteriExternalLinks({
            target: "_blank",
            rel: ["nofollow", "noopener", "noreferrer"],
          }),
          satteriBaseLinks({ base: BASE }),
        ],
      }),
    },

    integrations: [
      astroBlogTheme(),
      // Astro-Icon tree-shakes the installed Iconify collections. Branding and
      // OG artwork are imported as image assets, so they must not be parsed as
      // Iconify icons (complex SVGs may contain text or repeated local IDs).
      icon({
        iconDir: fileURLToPath(new URL("../public/icons", import.meta.url)),
      }),
      // Expressive Code provides syntax highlighting (Shiki under the hood)
      // plus extra features: code-block frames + titles, copy button, line
      // markers, diffs, word wrap, collapsible sections.
      // https://expressive-code.com/
      expressiveCode({
        emitExternalStylesheet: false,
        themes: ["github-light", "github-dark-dimmed"],
        plugins: [pluginLineNumbers(), copyOptInPlugin],
        defaultProps: {
          showLineNumbers: true,
        },
        // Bind the active theme to our `<html data-theme>` attribute instead
        // of the default `prefers-color-scheme` media query so the theme
        // toggle in the sidebar takes effect immediately.
        themeCssSelector: (theme) =>
          `[data-theme='${theme.type === "dark" ? "astro-blog-dark" : "astro-blog-light"}']`,
        useDarkModeMediaQuery: false,
        shiki: {
          langAlias: {
            env: "dotenv",
          },
        },
        styleOverrides: {
          borderRadius: "0.5rem",
          codeFontFamily:
            "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          codeFontSize: "0.875rem",
          codePaddingInline: "0.75rem",
          frames: {
            shadowColor: "transparent",
          },
        },
      }),
      // MDX must come after Expressive Code so EC can transform fenced
      // code blocks inside .mdx files too.
      mdx(),
      ...(SKIP_RSS_SITEMAP
        ? []
        : [
            collectUnlistedUrls(),
            sitemap({
              // Browsers (and only browsers) apply this XSL to render a
              // human-readable view of `sitemap-index.xml` and `sitemap-0.xml`.
              // Search-engine crawlers ignore the processing instruction.
              // Note: `@astrojs/sitemap` rewrites this into an ABSOLUTE URL using
              // `site`. The `rewriteSitemapXslToRelative()` integration below
              // turns it back into a root-relative path so local preview works.
              xslURL: SITEMAP_XSL_HREF,
              filter: (page) => {
                if (page.includes("/draft/") || page.endsWith("/404/"))
                  return false;
                // Exclude unlisted posts from the sitemap.
                for (const seg of unlistedPathSegments) {
                  if (page.includes(String(seg))) return false;
                }
                return true;
              },
            }),
            rewriteSitemapXslToRelative(),
          ]),
    ],

    vite: {
      plugins: [tailwindcss()],
    },

    experimental: {
      contentIntellisense: true,
      // Astro 7.x still exposes SVG optimization as an experimental flag.
      // The 6.2 change renamed the old `experimental.svgo` flag to the new
      // `experimental.svgOptimizer` API; it is not a stable top-level config yet.
      svgOptimizer: svgoOptimizer({
        multipass: true,
      }),
    },

    fonts: [
      // Source Sans 3 — main UI font from @fontsource/source-sans-3 npm package
      {
        name: "Source Sans 3",
        cssVariable: "--font-source-sans-3",
        provider: fontProviders.local(),
        options: {
          variants: [
            {
              weight: "400",
              style: "normal",
              src: [
                "./node_modules/@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2",
              ],
            },
            {
              weight: "600",
              style: "normal",
              src: [
                "./node_modules/@fontsource/source-sans-3/files/source-sans-3-latin-600-normal.woff2",
              ],
            },
            {
              weight: "700",
              style: "normal",
              src: [
                "./node_modules/@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.woff2",
              ],
            },
            {
              weight: "900",
              style: "normal",
              src: [
                "./node_modules/@fontsource/source-sans-3/files/source-sans-3-latin-900-normal.woff2",
              ],
            },
          ],
        },
      },
      // JetBrains Mono — monospace font from @fontsource/jetbrains-mono npm package
      {
        name: "JetBrains Mono",
        cssVariable: "--font-jetbrains-mono",
        provider: fontProviders.local(),
        options: {
          variants: [
            {
              weight: "400",
              style: "normal",
              src: [
                "./node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
              ],
            },
            {
              weight: "600",
              style: "normal",
              src: [
                "./node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2",
              ],
            },
          ],
        },
      },
    ],
  });
}
