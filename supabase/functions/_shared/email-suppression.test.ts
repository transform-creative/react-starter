import { describe, it, expect } from "vitest";
import {
  applySuppression,
  toSuppressionList,
} from "./email-suppression.ts";

const LIST = toSuppressionList([
  { email: "Blocked@Example.com" },
  { email: "other@example.com" },
]);

describe("toSuppressionList", () => {
  // Studio stores whatever was typed.
  it("normalises case and surrounding whitespace", () => {
    expect([
      ...toSuppressionList([
        { email: " A@x.com " },
        { email: "B@X.COM" },
      ]),
    ]).toEqual(["a@x.com", "b@x.com"]);
  });

  it("ignores blank and null rows", () => {
    expect(
      toSuppressionList([
        { email: null },
        { email: "  " },
      ]).size,
    ).toBe(0);
  });

  it("is empty when there are no rows", () => {
    expect(toSuppressionList(null).size).toBe(0);
    expect(toSuppressionList([]).size).toBe(0);
  });
});

describe("applySuppression", () => {
  it("skips a single-recipient email to a suppressed address, ignoring case", () => {
    const data = {
      type: "account.created",
      recipient_email: " BLOCKED@example.com",
    };
    expect(applySuppression(data, LIST)).toEqual({
      data,
      suppressed: ["blocked@example.com"],
      skip: true,
    });
  });

  it("sends to an address that isn't on the list", () => {
    const data = {
      type: "error.logged",
      recipient_email: "fine@example.com",
    };
    expect(applySuppression(data, LIST)).toEqual({
      data,
      suppressed: [],
      skip: false,
    });
  });

  // A payment receipt is owed whatever the email preference.
  it("never suppresses an exempt type", () => {
    const data = {
      type: "payment.received",
      receipts: [
        { email: "blocked@example.com" },
      ],
      recipient_email: "blocked@example.com",
    };
    expect(
      applySuppression(data, LIST).skip,
    ).toBe(false);
    expect(
      applySuppression(data, LIST).suppressed,
    ).toEqual([]);
  });

  it("removes only the suppressed players from a bulk email", () => {
    const result = applySuppression(
      {
        type: "event.completed",
        players: [
          { address: "blocked@example.com" },
          { address: "fine@example.com" },
        ],
      },
      LIST,
    );
    expect(result.skip).toBe(false);
    expect(result.suppressed).toEqual([
      "blocked@example.com",
    ]);
    expect(result.data.players).toEqual([
      { address: "fine@example.com" },
    ]);
  });

  it("skips a bulk email when every player is suppressed", () => {
    const result = applySuppression(
      {
        type: "newsletter.bulk",
        players: [
          { address: "blocked@example.com" },
          { address: "OTHER@example.com" },
        ],
      },
      LIST,
    );
    expect(result.skip).toBe(true);
    expect(result.suppressed).toEqual([
      "blocked@example.com",
      "other@example.com",
    ]);
  });

  it("leaves a bulk email untouched when nobody is suppressed", () => {
    const data = {
      type: "event.completed",
      players: [{ address: "fine@example.com" }],
    };
    expect(
      applySuppression(data, LIST).data,
    ).toBe(data);
  });

  // error.logged / error_log go to the developer inbox; there's no person in
  // them to suppress.
  it("sends messages with no recipient of their own", () => {
    expect(
      applySuppression(
        {
          type: "error.logged",
          profile_id: "x",
        },
        LIST,
      ).skip,
    ).toBe(false);
  });

  it("does nothing when the list is empty", () => {
    const data = {
      type: "account.created",
      recipient_email: "blocked@example.com",
    };
    expect(
      applySuppression(data, new Set()).skip,
    ).toBe(false);
  });
});
