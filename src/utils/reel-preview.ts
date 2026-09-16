/** Fit formatted excerpts to their available space, preserving inline markup. */
export function setupReelPreviews(reel: HTMLElement) {
  const previews = Array.from(
    reel.querySelectorAll<HTMLElement>("[data-reel-preview]"),
  );
  const originals = new Map(
    previews.map((preview) => [
      preview,
      preview.cloneNode(true) as HTMLElement,
    ]),
  );

  function fit(preview: HTMLElement) {
    if (!preview.clientHeight || !preview.clientWidth) return;
    const original = originals.get(preview)!;
    const restore = () =>
      preview.replaceChildren(
        ...Array.from(original.childNodes, (node) => node.cloneNode(true)),
      );
    restore();
    if (preview.scrollHeight <= preview.clientHeight) return;

    const length = preview.textContent?.length ?? 0;
    function truncate(count: number) {
      restore();
      const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const size = node.textContent?.length ?? 0;
        if (count > size) {
          count -= size;
          continue;
        }
        const range = document.createRange();
        range.setStart(node, count);
        range.setEnd(preview, preview.childNodes.length);
        range.deleteContents();
        node.textContent = (node.textContent ?? "").trimEnd() + " ";
        const more = document.createElement("a");
        more.href = preview.dataset.reelPreviewHref ?? "#";
        more.className = "latest-story__ellipsis";
        more.textContent = "[…]";
        more.setAttribute("aria-label", "Continue reading this post");
        node.parentNode?.insertBefore(more, node.nextSibling);
        return;
      }
    }

    let low = 0;
    let high = length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      truncate(middle);
      if (preview.scrollHeight <= preview.clientHeight) low = middle;
      else high = middle - 1;
    }
    truncate(low);
  }

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) fit(entry.target as HTMLElement);
  });
  previews.forEach((preview) => observer.observe(preview));
  document.fonts.ready.then(() => previews.forEach(fit));
  document.addEventListener("astro:before-swap", () => observer.disconnect(), {
    once: true,
  });
}
