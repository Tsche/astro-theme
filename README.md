# `@tsche/astro-blog-theme`

A reusable, content-focused theme for Astro blogs.

The package owns the visual system, shared layouts and route implementations,
generic Astro components, content schemas and queries, common configuration
types and UI copy, SEO/OG helpers, and the Satteri Markdown plugins. Each site
continues to own its content, configuration, content-type copy, brand assets,
base layout, and site-only decoration.

## Install

For sibling development checkouts:

```json
{
  "dependencies": {
    "@tsche/astro-blog-theme": "file:../astro-theme"
  }
}
```

For independent checkouts or CI, replace the local specifier with the theme
repository URL and pin a tag or commit:

```json
{
  "dependencies": {
    "@tsche/astro-blog-theme": "git+https://github.com/tsche/astro-theme.git#v0.1.0"
  }
}
```

Import the stylesheet from a site-owned CSS entry point so local Tailwind
sources and palette overrides remain explicit:

```css
@import "@tsche/astro-blog-theme/styles.css";
@source '../src';
@source '../content';
```

The shared runtime uses `astro-blog-light` and `astro-blog-dark` as its
`data-theme` values. A site can override daisyUI tokens under those selectors.

Shared files import site-specific values through an internal site adapter. The
integration configures that adapter and injects all common routes:

```js
import { astroBlogTheme } from "@tsche/astro-blog-theme";

export default defineConfig({
  integrations: [astroBlogTheme()],
});
```

Sites explicitly enable and describe the content types they use through
`SITE.contentTypes`. The keys select theme behavior and styling; all visible
names and descriptions remain site-owned:

```ts
contentTypes: {
  articles: {
    label: "Articles",
    singularLabel: "Article",
    description: "Long-form writing about this site's subject.",
    eyebrow: "Long form",
    landingPageLimit: 5,
    postsPerPage: 8,
  },
},
```

`landingPageLimit` controls how many entries of that type appear on the home
page. `postsPerPage` controls when its collection page starts paginating at
`/<type>/page/2/`. Both are optional for compatibility with older site
configurations; the theme's existing limits are used when they are omitted.

Astro requires content collection registration to live in the consuming
project. `src/content.config.ts` is therefore a small registration file using
the package's shared frontmatter schemas and canonical loader options. The
route implementations themselves live entirely in this package:

```ts
import {
  baseFrontmatter,
  pageFrontmatter,
  postLoaderOptions,
} from "@tsche/astro-blog-theme/content";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob(postLoaderOptions("./content")),
  schema: baseFrontmatter,
});

const pages = defineCollection({
  loader: glob({ base: "./content/pages", pattern: "**/*.{md,mdx}" }),
  schema: pageFrontmatter,
});

export const collections = { posts, pages };
```

## Content paths

Posts can be flat files or live in folders with adjacent assets:

```text
content/articles/bar.md                 -> /articles/bar/
content/articles/_20260105-barz.md      -> /articles/barz/
content/articles/foo/_index.md          -> /articles/foo/
content/articles/2026-01-05-quux/_index.mdx -> /articles/quux/
content/articles/foo/_example.md        -> /articles/foo/example/
content/articles/foo/picture.png        -> adjacent asset, not a post
```

At the content-type root, every `.md` or `.mdx` file except `_index.*` is a
post; a leading `_` is removed from its URL. Inside a post folder, rendered
pages begin with `_`. `_index.md` and `_index.mdx` are the folder's primary
page. The original `index.md`/`index.mdx` folder convention remains supported
for compatibility. Other nested files are available to the page as adjacent
assets and are not loaded as posts.

An eight-digit `YYYYMMDD-` or dashed `YYYY-MM-DD-` prefix is removed from
folder and rendered-page names. All remaining path segments are slugified.
Use `permalink` to override the generated path:

```yaml
permalink: /articles/a-stable-name/
```

The content type prefix may be omitted (`permalink: a-stable-name`). Duplicate
generated or overridden paths fail content loading with both source filenames
in the error. `canonicalURL` remains separate: it changes SEO metadata but not
the emitted route.

Components and utilities are exposed through explicit subpath exports; for
example:

```astro
---
import SmartImage from "@tsche/astro-blog-theme/components/SmartImage.astro";
import { readingTime } from "@tsche/astro-blog-theme/reading-time";
---
```

## Code blocks

Ordinary fenced blocks stay build-time rendered and lightweight. Line numbers
are enabled by default, line highlighting uses Expressive Code's marker syntax,
and copying is opt-in:

````md
```cpp copy {2-3}
int main() {
  return 0;
}
```
````

For file-backed examples, ranges, and generated Compiler Explorer links, use
the immutable MDX component. Paths are resolved at build time from the
consuming project root; ranges use one-based, start-inclusive/end-exclusive
columns and inclusive line endpoints:

```astro
---
import CodeBlock from "@tsche/astro-blog-theme/components/CodeBlock.astro";
---

<CodeBlock
  src="content/examples/widget.cpp"
  range="12:3-28:1"
  highlightLines="14-16,23"
  copy
  godbolt={{ compiler: "clang2110", options: "-std=c++2c -O2" }}
/>
```

Set `godbolt.url` to use a hand-fixed Compiler Explorer link, or set
`godbolt.source` / `godbolt.sourcePath` when the code sent to Compiler Explorer
must differ from the excerpt shown in the article.

Use the heavyweight component only for editable/runnable demos. It bundles the
UI from `@cppsocial/codeblocks-hosted`, while clangd's roughly 22 MB Wasm binary
continues to load from `clangd.cpp.social` and only when the block approaches
the viewport:

```astro
---
import InteractiveCodeBlock from "@tsche/astro-blog-theme/components/InteractiveCodeBlock.astro";
---

<InteractiveCodeBlock
  src="/examples/constexpr-debugger.cpp"
  range="5-42"
  highlightLines="12-15"
  compiler="clang2110"
  compilerArgs="-std=c++2c"
  outputViews="execution,compiler,assembly"
  copy
  isolationWorker
/>
```

`isolationWorker` opts into the theme's same-origin service worker for static
hosts such as GitHub Pages. Omit it when the host already sends COOP/COEP
headers. The component dispatches `astro-codeblocks:ready` with `getCodeBlock`
in `event.detail`, which lets article-specific Wasm tools attach without making
every code block pay their cost. See `CODEBLOCKS_UPSTREAM_TODO.md` for features
implemented here that may be worth contributing upstream.

## Toolchain

All three repositories use Bun 1.3.14 and Astro 7. Run `bun install`, then use
the consuming site's existing `bun run typecheck`, `bun test`, and
`bun run build` commands.
