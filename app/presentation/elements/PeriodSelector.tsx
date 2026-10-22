import { useState } from "react";
import { LabelInput } from "~/presentation/elements/LabelInput/LabelInput";
import {
  CUSTOM_PERIOD_OPTION,
  PERIOD_PRESETS,
  customPeriod,
  customRangeLimits,
  parseCustomPeriod,
  periodToDateRange,
  validateCustomRange,
  type Period,
  type PeriodPreset,
} from "~/data/PeriodRange";

export interface PeriodSelectorProps {
  value: Period;
  onChange: (next: Period) => void;
  /** Preset options to offer. Defaults to every preset in PERIOD_PRESETS */
  presets?: {
    label: string;
    value: PeriodPreset;
  }[];
}

/******************************
 * PeriodSelector component
 * Preset dropdown (last week … this year) with a "Custom range…" option that
 * reveals From / To date inputs, limited to the last 12 months. Controlled:
 * `onChange` only fires with a valid Period, so a half-typed date can sit in
 * the inputs, flagged, without ever reaching a query. Wraps on narrow screens.
 * Pair with periodToSearchParams / periodFromSearchParams (~/data/PeriodRange)
 * to keep the selection in the URL.
 */
export function PeriodSelector({
  value,
  onChange,
  presets = PERIOD_PRESETS,
}: PeriodSelectorProps) {
  // An edit that hasn't (yet) become the period. Tagged with the period it was
  // typed against, so it lapses on its own the moment the period moves on.
  const [edit, setEdit] = useState<{
    period: Period;
    from: string;
    to: string;
  } | null>(null);

  const draft =
    edit?.period === value
      ? edit
      : parseCustomPeriod(value);
  const limits = customRangeLimits();
  const error = draft
    ? validateCustomRange(draft.from, draft.to)
    : null;

  /** "Custom range…" starts from the dates the current period already covers,
   *  so switching to it changes nothing on screen until a date is edited. */
  function selectOption(next: string) {
    setEdit(null);
    if (next !== CUSTOM_PERIOD_OPTION) {
      onChange(next as PeriodPreset);
      return;
    }
    if (parseCustomPeriod(value)) return;
    const { startDate, endDate } =
      periodToDateRange(value);
    onChange(customPeriod(startDate, endDate));
  }

  function changeRange(from: string, to: string) {
    setEdit({ period: value, from, to });
    if (!validateCustomRange(from, to))
      onChange(customPeriod(from, to));
  }

  return (
    <div className="w-100 col gap-10">
      <LabelInput
        inlineLabel
        name="Period"
        value={
          parseCustomPeriod(value)
            ? CUSTOM_PERIOD_OPTION
            : value
        }
        onChange={(e) =>
          selectOption(e.target.value)
        }
        options={[
          ...presets,
          {
            label: "Custom range…",
            value: CUSTOM_PERIOD_OPTION,
          },
        ]}
      />
      {draft && (
        <div className="col">
          <div className="row gap-10 shrink-wrap">
            <LabelInput
              inlineLabel
              name="From"
              type="date"
              min={limits.min}
              max={limits.max}
              value={draft.from}
              error={error ? " " : undefined}
              onChange={(e) =>
                changeRange(
                  e.target.value,
                  draft.to,
                )
              }
            />
            <LabelInput
              inlineLabel
              name="To"
              type="date"
              min={limits.min}
              max={limits.max}
              value={draft.to}
              error={error ? " " : undefined}
              onChange={(e) =>
                changeRange(
                  draft.from,
                  e.target.value,
                )
              }
            />
          </div>
          {error && (
            <p style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
