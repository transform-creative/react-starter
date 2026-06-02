/******************************
 * styles.ts
 * Shared inline styles for every transactional email. React-email renders
 * to MIME-safe inline CSS, so update tokens here rather than at the call site.
 */

export const baseUrl = Deno?.env?.get?.("APP_BASE_URL") ?? "";
export const contactEmail =
  Deno?.env?.get?.("CONTACT_EMAIL") ?? "hello@example.com";

/******************************
 * getBrandName — read the brand name from the BRAND_NAME env var, with a
 * sensible fallback. The optional `origin_site` argument is left in the
 * signature so multi-brand projects can switch via a lookup table.
 */
export function getBrandName(origin_site?: string): string {
  return Deno?.env?.get?.("BRAND_NAME") ?? "Project Name";
}

export const main = {
  backgroundColor: "#f9f9f9",
  fontFamily:
    '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

export const container = {
  backgroundColor: "#f0f0f0",
  margin: "0 auto",
  padding: "20px 20px",
  marginBottom: "64px",
  maxWidth: "800px",
  borderRadius: "20px",
  overflow: "hidden",
};

export const banner = {
  display: "block",
  width: "100%",
  borderRadius: "5px",
};

export const content = {
  textAlign: "center" as const,
};

export const col = {
  textAlign: "center" as const,
};

export const hr = {
  borderColor: "#f9f9f9",
  margin: "30px 0",
};

export const footer = {
  color: "#5b5b5b",
  padding: "0 40px 40px",
  textAlign: "center" as const,
  fontStyle: "italic",
};

export const link = {
  color: "#f5ae3e",
  textDecoration: "underline",
};

export const h1 = {
  color: "#121212",
  fontSize: "32px",
  fontFamily: '"Inter", sans-serif',
  fontWeight: "700",
  letterSpacing: "0.5px",
  margin: "20px 10px",
};

export const h2 = {
  fontSize: "22px",
  lineHeight: "32px",
  color: "#121212",
  margin: "16px 0",
};

export const p = {
  fontSize: "16px",
  color: "#121212",
  margin: "16px 32px",
  lineHeight: "28px",
};

export const amountHighlight = {
  color: "#f5ae3e",
};

export const buttonPrimary = {
  backgroundColor: "#121212",
  borderRadius: "20px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  fontFamily: '"Inter", sans-serif',
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  margin: "0 5px",
};

export const buttonSecondary = {
  backgroundColor: "#f9f9f9",
  border: "1px solid #cecece",
  borderRadius: "20px",
  color: "#121212",
  fontSize: "14px",
  fontWeight: "600",
  fontFamily: '"Inter", sans-serif',
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  margin: "0 5px",
};

export const card = {
  backgroundColor: "#ffffff",
  border: "1px solid #cecece",
  borderRadius: "5px",
  padding: "16px 52px",
  margin: "10px 0",
  textAlign: "center" as const,
};
