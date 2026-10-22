/************************
 * The email suppression list: addresses email-handler must never send to,
 * whatever the email type, apart from SUPPRESSION_EXEMPT_TYPES.
 *
 * The list is the `public.email_suppressions` table
 * (app/setup/SqlFunctions/add_email_suppressions.sql), managed in Studio and read
 * once per email-handler run.
 *
 * Applied at send time, after index.ts has resolved the recipient, because
 * that's the only point where every type's real address is known (a type that
 * is enqueued before its address exists can't be filtered any earlier).
 *
 * Deliberately free of npm:/jsr: specifiers so Vitest can cover it.
 */

/** Types sent even to suppressed addresses. Transactional mail the recipient
 * needs to act on (a sign-in code) or is legally owed (a payment receipt)
 * must not be silently dropped. Add to this per project. */
export const SUPPRESSION_EXEMPT_TYPES = new Set([
  "magic_link",
  "payment.received",
]);

/** Audit row written for every skip. */
export const SUPPRESSION_AUDIT_EVENT =
  "email_suppressed";

function normalise(email: unknown): string {
  return typeof email === "string"
    ? email.trim().toLowerCase()
    : "";
}

/*******************************
 * toSuppressionList
 * `email_suppressions` rows as a set of normalised addresses. Normalised here
 * as well as by the table's unique index, because Studio stores whatever was
 * typed.
 */
export function toSuppressionList(
  rows:
    | { email: string | null }[]
    | null
    | undefined,
): Set<string> {
  return new Set(
    (rows ?? [])
      .map((row) => normalise(row.email))
      .filter(Boolean),
  );
}

export interface SuppressionOutcome {
  /** The message to send. For bulk types, the suppressed players are removed. */
  data: any;
  /** Normalised addresses that were held back. Empty means nothing changed. */
  suppressed: string[];
  /** True when nobody is left to send to: archive the message unsent. */
  skip: boolean;
}

/*******************************
 * applySuppression
 * Decide what's left of a queue message once suppressed addresses are removed.
 * Single-recipient messages are addressed by `recipient_email`, and the bulk
 * player emails by `players[].address`. Anything else (developer and admin
 * notices) has no person to suppress, so it is sent unchanged.
 */
export function applySuppression(
  data: any,
  list: Set<string>,
): SuppressionOutcome {
  const unchanged = {
    data,
    suppressed: [],
    skip: false,
  };
  if (
    list.size === 0 ||
    SUPPRESSION_EXEMPT_TYPES.has(data?.type)
  ) {
    return unchanged;
  }

  if (Array.isArray(data.players)) {
    const suppressed: string[] = [];
    const players = data.players.filter(
      (player: any) => {
        const address = normalise(
          player?.address,
        );
        if (!list.has(address)) return true;
        suppressed.push(address);
        return false;
      },
    );
    if (suppressed.length === 0) return unchanged;
    return {
      data: { ...data, players },
      suppressed,
      skip: players.length === 0,
    };
  }

  const recipient = normalise(
    data?.recipient_email,
  );
  if (list.has(recipient)) {
    return {
      data,
      suppressed: [recipient],
      skip: true,
    };
  }
  return unchanged;
}
