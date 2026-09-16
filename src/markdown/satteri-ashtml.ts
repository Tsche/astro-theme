import { defineMdastPlugin } from "satteri";

// See satteri-alert.ts: Satteri exposes a nominal visitor context type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function satteriAsHTML(): any {
  return defineMdastPlugin({
    name: "remark-ashtml",
    code(node, ctx) {
      if (node.lang === "ashtml") {
        ctx.replaceNode(node, {
          type: "html",
          value: node.value,
        });
      }
    },
  });
}
