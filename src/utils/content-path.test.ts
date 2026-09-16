import { describe, expect, test } from "bun:test";
import {
  canonicalContentId,
  createContentIdGenerator,
  isContentPageSource,
} from "./content-path";

describe("canonicalContentId", () => {
  test("a root file becomes a post", () => {
    expect(canonicalContentId({ entry: "articles/bar.md" })).toBe(
      "articles/bar",
    );
    expect(canonicalContentId({ entry: "updates/index.md" })).toBe(
      "updates/index",
    );
  });

  test("a folder index uses the folder URL", () => {
    expect(canonicalContentId({ entry: "articles/foo/_index.md" })).toBe(
      "articles/foo",
    );
  });

  test("legacy folder index files remain compatible", () => {
    expect(canonicalContentId({ entry: "articles/foo/index.mdx" })).toBe(
      "articles/foo",
    );
  });

  test("date prefixes and rendering underscores are removed", () => {
    expect(canonicalContentId({ entry: "articles/_20260105-barz.md" })).toBe(
      "articles/barz",
    );
    expect(
      canonicalContentId({ entry: "articles/2026-01-05-foo/_index.md" }),
    ).toBe("articles/foo");
  });

  test("nested underscore pages use their parent path", () => {
    expect(canonicalContentId({ entry: "articles/foo/_example.mdx" })).toBe(
      "articles/foo/example",
    );
  });

  test("permalink overrides the generated path", () => {
    expect(
      canonicalContentId({
        entry: "articles/foo.md",
        permalink: "/articles/custom/name/",
      }),
    ).toBe("articles/custom/name");
  });

  test("top-level _index is rejected", () => {
    expect(() => canonicalContentId({ entry: "articles/_index.md" })).toThrow(
      "reserved",
    );
  });
});

describe("isContentPageSource", () => {
  test("loads root files and underscored nested markup only", () => {
    expect(isContentPageSource("articles/bar.md")).toBe(true);
    expect(isContentPageSource("articles/foo/_index.md")).toBe(true);
    expect(isContentPageSource("articles/foo/_example.mdx")).toBe(true);
    expect(isContentPageSource("articles/foo/notes.md")).toBe(false);
    expect(isContentPageSource("articles/foo/picture.png")).toBe(false);
  });
});

test("colliding source layouts fail with both filenames", () => {
  const generateId = createContentIdGenerator();
  expect(generateId({ entry: "articles/foo.md", data: {} })).toBe(
    "articles/foo",
  );
  expect(() =>
    generateId({ entry: "articles/foo/_index.md", data: {} }),
  ).toThrow('"articles/foo.md" and "articles/foo/_index.md"');
});
