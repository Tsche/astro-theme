import { describe, expect, test } from "bun:test";
import { ExpressiveCodeBlock } from "@expressive-code/core";
import { copyOptInPlugin } from "./astro-config";

describe("copy-button-opt-in plugin", () => {
  test("reads metadata from the rendered group's codeBlock", async () => {
    const codeBlock = new ExpressiveCodeBlock({
      code: "int main() {}",
      language: "cpp",
      meta: "copy",
    });
    const renderedBlockAst = {
      type: "element" as const,
      tagName: "pre",
      properties: {},
      children: [],
    };
    const groupAst = {
      type: "element" as const,
      tagName: "div",
      properties: { className: ["expressive-code"] },
      children: [renderedBlockAst],
    };
    const hook = copyOptInPlugin.hooks?.postprocessRenderedBlockGroup;
    expect(hook).toBeDefined();
    await hook?.({
      renderedGroupContents: [{ codeBlock, renderedBlockAst }],
      pluginStyles: [],
      addStyles: () => {},
      renderData: { groupAst },
    });
    expect(groupAst.properties.className).toContain("code-copy-enabled");
  });
});
