import type { ReactNode } from "react";
import {
  useRef,
  useState,
  useEffect,
} from "react";
import { gsap } from "gsap";
import { Icon } from "~/presentation/elements/Icon";

export interface ExpandableCardProps {
  id?: string;
  accentColor?: string;
  headerContent: ReactNode;
  previewContent?: ReactNode;
  expandedContent: ReactNode;
  /** Controlled open state — when provided the card syncs to this value */
  isOpen?: boolean;
  /** Called when the user clicks the chevron/header */
  onToggle?: () => void;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Hide the collapse chevron (e.g. when toggling is disabled) */
  hideChevron?: boolean;
}

/******************************
 * ExpandableCard component
 * Reusable GSAP-animated accordion card. Works as controlled (isOpen prop)
 * or uncontrolled (defaultOpen). Left-border colour is driven by accentColor.
 */
export function ExpandableCard({
  id,
  accentColor,
  headerContent,
  previewContent,
  expandedContent,
  isOpen,
  onToggle,
  defaultOpen = false,
  hideChevron = false,
}: ExpandableCardProps) {
  const isControlled = isOpen !== undefined;
  const [internalOpen, setInternalOpen] =
    useState(defaultOpen);
  const open = isControlled
    ? isOpen
    : internalOpen;

  const panelRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);

  /******************************
   * Animate panel open
   */
  function animateOpen() {
    const panel = panelRef.current;
    if (!panel) return;
    gsap.fromTo(
      panel,
      { height: 0, opacity: 0 },
      {
        height: "auto",
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      },
    );
    gsap.to(chevronRef.current, {
      rotation: 180,
      duration: 0.3,
      ease: "power2.out",
    });
  }

  /******************************
   * Animate panel close
   */
  function animateClose() {
    const panel = panelRef.current;
    if (!panel) return;
    gsap.to(panel, {
      height: 0,
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
    });
    gsap.to(chevronRef.current, {
      rotation: 0,
      duration: 0.25,
      ease: "power2.in",
    });
  }

  /******************************
   * Sync animation when controlled isOpen changes
   */
  useEffect(() => {
    if (!isControlled) return;
    if (isOpen) animateOpen();
    else animateClose();
  }, [isOpen, isControlled]);

  /******************************
   * Handle chevron / header click
   */
  function handleToggle() {
    if (onToggle) {
      onToggle();
    } else {
      const next = !internalOpen;
      setInternalOpen(next);
      if (next) animateOpen();
      else animateClose();
    }
  }

  const borderColor =
    accentColor ?? "var(--accent)";

  return (
    <button
      id={id}
      type="button"
      className={`col start boxed w-100`}
      onClick={handleToggle}
      style={{
        border: `1px solid ${open ? borderColor : "var(--accent-md)"}`,
      }}
    >
      <div className="w-100 row">
        <div className="row between w-100">
          {headerContent}
          {!hideChevron && (
            <div
              ref={chevronRef}
              className="col center"
              style={{ flexShrink: 0 }}
            >
              <Icon
                name="chevron-down"
                size={16}
                color="var(--accent)"
              />
            </div>
          )}
        </div>
      </div>

      {previewContent && (
        <div className="">{previewContent}</div>
      )}

      <div ref={panelRef}>
        <div className="">{expandedContent}</div>
      </div>
    </button>
  );
}
