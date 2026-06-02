import { DateTime } from "luxon";

/******************************
 * dateUtils
 * Thin Luxon wrappers for consistent, TZ-safe date handling across the app.
 * All functions accept/return Luxon DateTime or ISO strings — never native Date.
 */

export function now(): DateTime {
  return DateTime.now();
}

export function formatDate(iso: string, fmt = "dd MMM"): string {
  return DateTime.fromISO(iso).toFormat(fmt);
}

export function formatTimeRange(start: string, end: string, zone?: string): string {
  const opts = zone ? { zone } : {};
  const s = DateTime.fromISO(start, opts);
  const e = DateTime.fromISO(end, opts);
  return `${s.toFormat("h:mm a")} – ${e.toFormat("h:mm a")}`;
}

export function isAfter(iso: string): boolean {
  return DateTime.fromISO(iso) > DateTime.now();
}
