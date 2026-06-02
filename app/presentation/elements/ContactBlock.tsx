import { CONTACT } from "~/data/Objects";
import { Icon } from "./Icon";
import type { IoniconName } from "~/data/Ionicons";

export interface ContactBlockProps {
  /** "row" = footer layout; "col" = nav dropdown panel layout. */
  layout?: "row" | "col";
}

// Populate per-project. Leave the array empty to hide the social row.
const socialLinks: { name: IoniconName; href: string }[] = [];

/******************************
 * ContactBlock
 * Shared contact UI used by the footer and the NavBar "Contact" dropdown.
 * Renders the social icons + email link; layout controls flex direction.
 */
export function ContactBlock({ layout = "row" }: ContactBlockProps) {
  const wrapperClass =
    layout === "row"
      ? "row wrap gap-10 middle center"
      : "col gap-10 middle center";

  return (
    <div className={wrapperClass}>
      <div className="row gap-10 middle center">
        {socialLinks.map((s) => (
          <a
            role="button"
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            aria-label={s.name}
            className="boxed p-10"
          >
            <Icon color="var(--accent) !important" name={s.name} />
          </a>
        ))}
      </div>

      <a
        className="boxed p-10 row middle center gap-5"
        role="button"
        href={`mailto:${CONTACT.orgEmail}`}
        style={{ color: "var(--accent)" }}
      >
        <Icon name="mail-open" />
        {CONTACT.orgEmail}
      </a>
    </div>
  );
}
