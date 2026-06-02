import { useEffect, type RefObject } from "react";
import { useSearchParams } from "react-router";

/******************************
 * useClickOutside
 * Calls `handler` when a mousedown fires outside the referenced element.
 * Pass `enabled = false` to skip attaching the listener.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (e: MouseEvent) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    function onMouseDown(e: MouseEvent) {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) handler(e);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () =>
      document.removeEventListener("mousedown", onMouseDown);
  }, [ref, handler, enabled]);
}

/******************************
 * useScrollToSection
 * Reads `?section=<id>` from the URL and smooth-scrolls to the element with
 * that id on mount or whenever the param changes.
 */
export function useScrollToSection() {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const section = searchParams.get("section");
    if (!section) return;
    // Defer to next frame so the target element has time to mount.
    const id = requestAnimationFrame(() => {
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [searchParams]);
}
