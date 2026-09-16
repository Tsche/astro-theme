/** Central copy used by layouts and interactive components. */
export const UI = {
  "site.skipToContent": "Skip to content",
  "nav.home": "Home",
  "nav.posts": "Posts",
  "nav.tags": "Tags",
  "nav.categories": "Categories",
  "nav.archives": "Archives",
  "nav.about": "About",
  "nav.search": "Search",
  "nav.toggleMenu": "Toggle menu",

  "theme.toggle": "Toggle theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",

  "post.publishedOn": "Published on",
  "post.updatedOn": "Updated on",
  "post.readingTime": "min read",
  "post.toc": "Table of contents",
  "post.tags": "Tags",
  "post.categories": "Categories",
  "post.previous": "Previous",
  "post.next": "Next",
  "post.comments": "Comments",
  "post.commentsDisabled": "Comments are disabled for this post.",
  "post.commentsSetupTitle": "Comments need configuration",
  "post.commentsSetupBody":
    "Giscus is enabled but not yet configured. Add the repository details below to start collecting comments.",
  "post.commentsSetupStep1":
    "Visit `giscus.app` and select your public GitHub repository (Discussions must be enabled).",
  "post.commentsSetupStep2":
    "Copy the generated `data-repo-id`, `data-category` and `data-category-id` values.",
  "post.commentsSetupStep3":
    "Set `enabled`, `repo`, `repoId`, `category`, and `categoryId` in the site's `GISCUS` config.",
  "post.commentsSetupStep4":
    "Rebuild the site — this notice will be replaced by the live comments thread.",
  "post.commentsSetupDocs": "Open giscus.app",
  "post.share": "Share",
  "post.copyLink": "Copy link",
  "post.copied": "Copied!",
  "post.author": "Author",

  "list.allPosts": "All posts",
  "list.empty": "No posts found.",
  "list.tagPosts": "Posts tagged",
  "list.categoryPosts": "Posts in",
  "list.totalPosts": "posts",
  "list.totalPostsOne": "post",

  "pagination.previous": "Previous page",
  "pagination.next": "Next page",
  "pagination.page": "Page",
  "pagination.of": "of",

  "archives.title": "Archives",
  "archives.empty": "No posts yet.",

  "tags.title": "Tags",
  "tags.empty": "No tags yet.",

  "categories.title": "Categories",
  "categories.empty": "No categories yet.",

  "search.title": "Search",
  "search.placeholder": "Search the site",
  "search.openLabel": "Open search",
  "search.closeLabel": "Close search",
  "search.empty": "No results.",
  "search.loading": "Loading search...",
  "search.typeToStart": "Type to search...",
  "search.hintShortcut": "Press / anywhere to open search",
  "search.searching": "Searching...",
  "search.noResultsFor": "No results for",
  "search.resultsCount": "results",
  "search.resultsCountOne": "result",
  "search.hintNavigate": "to navigate",
  "search.hintSelect": "to open",
  "search.clearLabel": "Clear",

  "code.copy": "Copy",
  "code.copied": "Copied",

  "404.title": "Page not found",
  "404.description": "The page you are looking for has flown away.",
  "404.cta": "Back to home",

  "footer.poweredBy": "Powered by",
  "footer.privacy": "Privacy Policy",
  "footer.copyright": "All rights reserved.",
} as const;

export type UIKey = keyof typeof UI;

export function t(key: UIKey): string {
  return UI[key];
}
