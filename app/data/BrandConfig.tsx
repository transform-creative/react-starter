/******************************
 * BrandConfig
 *
 * Single source of truth for project-level copy that gets shown to users
 * (site name, headings, legal entity, email footer text, etc.). Drop the
 * defaults below in and they'll flow through the rest of the app via
 * `context.brandConfig`.
 *
 * The starter ships with a single brand. If a project later needs to serve
 * multiple brands on different domains (Transform Creative does this for
 * Ping-pong-a-thon / Pong Strong), add additional `BrandCopy` objects below
 * and extend `getBrandConfig()` to switch on `window.location.hostname` or
 * port. For example:
 *
 *   if (hostname.includes("brand-b") || port === "5174") return BRAND_B;
 *
 * Keep `origin_site` as the database-facing identifier so rows can be
 * scoped per brand via an `origin_site` column.
 */

export type BrandCopy = {
  site_name: string;
  legal_entity_name: string;
  origin_site: string;
  home_heading: string;
  home_subheading: string;
  footer_copyright: string;
};

const DEFAULT_BRAND: BrandCopy = {
  site_name: "Project Name",
  legal_entity_name: "Project Name LTD",
  origin_site: "default",
  home_heading: "Welcome.",
  home_subheading: "Replace this copy in BrandConfig.tsx.",
  footer_copyright: `© Project Name ${new Date().getFullYear()}`,
};

/*****************************
 * getBrandConfig — resolve the active brand for the current hostname.
 * Called once in `root.tsx` and surfaced via `context.brandConfig`.
 */
export function getBrandConfig(): BrandCopy {
  if (typeof window === "undefined") return DEFAULT_BRAND;
  return DEFAULT_BRAND;
}
