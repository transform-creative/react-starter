import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "~/presentation/elements/Icon";
import {
  ADMIN_PAGES,
  type AdminPage,
} from "~/presentation/admin/AdminBL";

export interface AdminNavbarProps {
  activePage: AdminPage;
  onSelect: (page: AdminPage) => void;
}

/******************************
 * AdminNavbar component
 * Admin navigation. A sticky left column on desktop; under inShrink a "Menu"
 * button across the top that drops down the page list, so content keeps the
 * full phone width.
 */
export function AdminNavbar({
  activePage,
  onSelect,
}: AdminNavbarProps) {
  const context: SharedContextProps =
    useOutletContext();
  const [menuOpenRaw, setMenuOpen] =
    useState(false);
  // Derived so growing out of shrink mode never leaves a stale open menu
  const menuOpen =
    menuOpenRaw && context.inShrink;
  const containerRef =
    useRef<HTMLDivElement>(null);

  // Close the dropdown on a press outside it
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (
        !containerRef.current?.contains(
          e.target as Node,
        )
      )
        setMenuOpen(false);
    }
    document.addEventListener(
      "pointerdown",
      onPointerDown,
    );
    return () =>
      document.removeEventListener(
        "pointerdown",
        onPointerDown,
      );
  }, [menuOpen]);

  const pageButtons = ADMIN_PAGES.map(
    ({ page, label }) => (
      <button
        key={page}
        className={`${activePage === page ? "accent" : "outline"} w-100`}
        aria-current={
          activePage === page ? "page" : undefined
        }
        onClick={() => {
          onSelect(page);
          setMenuOpen(false);
        }}
      >
        {label}
      </button>
    ),
  );

  if (!context.inShrink) {
    return (
      <nav className="boxed s-10 ml-10 mt-10 admin-sidebar">
        <div className="p-10 gap-10 col start sticky">
          {pageButtons}
        </div>
      </nav>
    );
  }

  return (
    <nav
      ref={containerRef}
      className="boxed outline mx-10 mt-10 mb-20 col admin-menu"
    >
      <button
        className="row middle center p-10 gap-10"
        onClick={() =>
          setMenuOpen((open) => !open)
        }
        aria-label={
          menuOpen
            ? "Close admin menu"
            : "Open admin menu"
        }
        aria-expanded={menuOpen}
      >
        <Icon
          name={
            menuOpen
              ? "close-outline"
              : "menu-outline"
          }
          size={15}
        />
        <p className="bold">Menu</p>
      </button>
      {menuOpen && (
        <div className="col gap-10 px-10 pb-10 fade-sm">
          {pageButtons}
        </div>
      )}
    </nav>
  );
}
