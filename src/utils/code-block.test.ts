import { describe, expect, test } from "bun:test";
import {
  createGodboltUrl,
  parseSourceRange,
  selectSource,
  visibleHighlightRanges,
} from "./code-block";

describe("code block sources", () => {
  test("selects one-based line and column ranges", () => {
    const range = parseSourceRange("2:2-3:3");
    expect(selectSource("zero\none\ntwo\nthree", range)).toBe("ne\ntw");
  });

  test("translates full-file highlights into a visible source range", () => {
    const range = parseSourceRange("10-20");
    expect(visibleHighlightRanges("8-11,15,22", range)).toEqual(["1-2", "6"]);
  });
});

describe("Compiler Explorer links", () => {
  test("supports generated links and explicit overrides", () => {
    expect(
      createGodboltUrl("int main() {}", { url: "https://example.test/fixed" }),
    ).toBe("https://example.test/fixed");
    const generated = createGodboltUrl("int main() {}", {
      compiler: "gsnapshot",
      baseUrl: "https://godbolt.org",
    });
    expect(generated).toStartWith("https://godbolt.org/clientstate/");
  });
});
