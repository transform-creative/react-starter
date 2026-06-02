import DOMPurify from "dompurify";

/**********************************************************
 * Sanitises HTML strings before they are pasted into a Quill
 * read view via `quill.clipboard.dangerouslyPasteHTML`.
 *
 * Story authoring is admin-only so this is defence-in-depth.
 * The allow-list mirrors the tags / attributes Quill's `snow`
 * theme emits — headings, lists, inline marks, links, images
 * (Supabase-hosted), embedded video iframes, and the inline
 * style attribute (Quill uses it for alignment + text colour).
 *
 * If a future story breaks rendering, narrow the allow-list
 * here rather than removing the call.
 */
export function sanitizeQuillHtml(dirty: string): string {
  if (typeof window === "undefined") return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "hr",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "b", "em", "i", "u", "s", "sub", "sup",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "iframe",
      "span", "div",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel",
      "src", "alt", "title", "width", "height",
      "class", "style",
      "data-list",
      "allowfullscreen", "frameborder", "allow",
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}
