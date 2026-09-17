/** Fit generated excerpts by removing whole blocks from the end. */
export function setupReelPreviews(root: ParentNode) {
  const previews = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[data-reel-preview], [data-block-preview]",
    ),
  );
  const originals = new Map(
    previews.map((preview) => [
      preview,
      preview.cloneNode(true) as HTMLElement,
    ]),
  );

  function fit(preview: HTMLElement) {
    if (!preview.clientHeight || !preview.clientWidth) return;
    delete preview.dataset.previewReady;
    const original = originals.get(preview)!;
    const restore = () =>
      preview.replaceChildren(
        ...Array.from(original.childNodes, (node) => node.cloneNode(true)),
      );
    restore();
    const more = preview.querySelector<HTMLElement>(".content-preview__more");
    while (preview.scrollHeight > preview.clientHeight) {
      const blocks = Array.from(preview.children).filter(
        (child) => child !== more,
      );
      const last = blocks.at(-1);
      if (!last) break;
      last.remove();
    }
    preview.dataset.previewReady = "true";
  }

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) fit(entry.target as HTMLElement);
  });
  previews.forEach((preview) => observer.observe(preview));
  previews.forEach(fit);
  document.fonts.ready.then(() => previews.forEach(fit));
  document.addEventListener("astro:before-swap", () => observer.disconnect(), {
    once: true,
  });
}
