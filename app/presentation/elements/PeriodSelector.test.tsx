import { describe, it, expect, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { PeriodSelector } from "./PeriodSelector";
import { customPeriod } from "~/data/PeriodRange";
import { DateTime } from "luxon";

/******************************
 * PeriodSelector
 */
describe("PeriodSelector", () => {
  it("hides the date inputs for a preset", () => {
    const { container } = render(
      <PeriodSelector
        value="last-month"
        onChange={() => {}}
      />,
    );
    expect(
      container.querySelector(
        'input[name="From"]',
      ),
    ).toBeNull();
  });

  it("shows the inputs for a custom range and reports a valid edit", () => {
    const onChange = vi.fn();
    const today = DateTime.now().toISODate()!;
    const { container } = render(
      <PeriodSelector
        value={customPeriod(today, today)}
        onChange={onChange}
      />,
    );
    const from = container.querySelector(
      'input[name="From"]',
    )!;
    const yesterday = DateTime.now()
      .minus({ days: 1 })
      .toISODate()!;
    fireEvent.change(from, {
      target: { value: yesterday },
    });
    expect(onChange).toHaveBeenCalledWith(
      customPeriod(yesterday, today),
    );
  });

  it("flags an invalid edit without calling onChange", () => {
    const onChange = vi.fn();
    const today = DateTime.now().toISODate()!;
    const { container } = render(
      <PeriodSelector
        value={customPeriod(today, today)}
        onChange={onChange}
      />,
    );
    fireEvent.change(
      container.querySelector(
        'input[name="From"]',
      )!,
      {
        target: { value: "" },
      },
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Pick both/),
    ).toBeTruthy();
  });
});
