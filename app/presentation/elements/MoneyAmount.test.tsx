import { describe, it, expect } from "vitest";
import {
  render,
  screen,
} from "@testing-library/react";
import { MoneyAmount } from "./MoneyAmount";

/******************************
 * MoneyAmount renders the charged figure, a settled base line for foreign
 * payments, and a refunded line
 */
describe("MoneyAmount", () => {
  it("renders a base-currency amount alone", () => {
    const { container } = render(
      <MoneyAmount cents={6800} currency="aud" />,
    );
    expect(
      screen.getByText("$68"),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll("p"),
    ).toHaveLength(1);
  });

  it("adds the settled base equivalent for a foreign payment", () => {
    render(
      <MoneyAmount
        cents={3500}
        currency="gbp"
        centsBase={6800}
      />,
    );
    expect(
      screen.getByText("GBP £35"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("≈ AUD $68"),
    ).toBeInTheDocument();
  });

  it("shows refunds in the payment's own currency", () => {
    render(
      <MoneyAmount
        cents={3500}
        currency="gbp"
        refundedCents={500}
      />,
    );
    expect(
      screen.getByText("GBP £5 refunded"),
    ).toBeInTheDocument();
  });

  it("never uses spans", () => {
    const { container } = render(
      <MoneyAmount
        cents={3500}
        currency="gbp"
        centsBase={6800}
      />,
    );
    expect(
      container.querySelector("span"),
    ).toBeNull();
  });
});
