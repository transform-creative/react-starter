export interface BannerProps {
  top?: number;
  background?: string;
  children: any;
}

/******************************
 * Banner component
 * Sticky top banner strip used for site-wide announcements
 */
export function Banner({
  top = 0,
  background = "var(--accent)",
  children,
}: BannerProps) {
  return (
    <div
      className="sticky p-10 middle center row"
      style={{ top: top, background: background }}
    >
      {children}
    </div>
  );
}
