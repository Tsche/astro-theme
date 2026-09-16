import type { AstroIntegration } from "astro";
import { fileURLToPath } from "node:url";

const routes = [
  ["/", "./routes/index.astro"],
  ["/404", "./routes/404.astro"],
  ["/about", "./routes/about.astro"],
  ["/archives", "./routes/archives.astro"],
  ["/search", "./routes/search.astro"],
  ["/tags", "./routes/tags/index.astro"],
  ["/tags/[tag]", "./routes/tags/[tag].astro"],
  ["/categories", "./routes/categories/index.astro"],
  ["/categories/[category]", "./routes/categories/[category].astro"],
  ["/[type]", "./routes/[type]/index.astro"],
  ["/[type]/page/[page]", "./routes/[type]/page/[page].astro"],
  ["/[type]/[...slug]", "./routes/[type]/[...slug].astro"],
  ["/page/[page]", "./routes/page/[page].astro"],
  ["/og/[...slug].png", "./routes/og/[...slug].png.ts"],
  ["/rss.xml", "./routes/rss.xml.ts"],
  [
    "/codeblocks-coi-serviceworker.js",
    "./routes/codeblocks-coi-serviceworker.js.ts",
  ],
] as const;

export function astroBlogTheme(): AstroIntegration {
  return {
    name: "@tsche/astro-blog-theme",
    hooks: {
      "astro:config:setup": ({ config, injectRoute, updateConfig }) => {
        updateConfig({
          publicDir: new URL("../public", import.meta.url),
          vite: {
            resolve: {
              alias: {
                "@astro-theme-site": fileURLToPath(config.srcDir),
                "@astro-theme-site-styles": fileURLToPath(
                  new URL("styles/global.css", config.root),
                ),
              },
            },
          },
        });

        for (const [pattern, entrypoint] of routes) {
          injectRoute({
            pattern,
            entrypoint: new URL(entrypoint, import.meta.url),
            prerender: true,
          });
        }
      },
    },
  };
}
