import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { CopyCell } from "./CopyCell";

const writeText = vi.fn(() => Promise.resolve());

beforeEach(() => {
  writeText.mockClear();
  // navigator.clipboard is getter-only in jsdom.
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  // jsdom throws on real navigation, so the handoff target is captured instead.
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { href: "http://localhost/" },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CopyCell", () => {
  it("is a focusable button for keyboard and screen reader users", () => {
    render(<CopyCell value="idrury" />);

    const cell = screen.getByRole("button", {
      name: "idrury",
    });
    expect(cell).toHaveAttribute("tabindex", "0");
  });

  it("copies on click and shows feedback", async () => {
    render(<CopyCell value="idrury" />);

    fireEvent.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith(
      "idrury",
    );
    expect(
      await screen.findByText("Copied"),
    ).toBeInTheDocument();
  });

  it.each(["Enter", " "])(
    "copies on the %j key",
    async (key) => {
      render(<CopyCell value="idrury" />);

      fireEvent.keyDown(
        screen.getByRole("button"),
        { key },
      );

      expect(writeText).toHaveBeenCalledWith(
        "idrury",
      );
      expect(
        await screen.findByText("Copied"),
      ).toBeInTheDocument();
    },
  );

  it("ignores other keys", () => {
    render(<CopyCell value="idrury" />);

    fireEvent.keyDown(
      screen.getByRole("button"),
      { key: "a" },
    );

    expect(writeText).not.toHaveBeenCalled();
  });

  it("hands off to the href after copying", async () => {
    render(
      <CopyCell
        value="a@b.com"
        href="mailto:a@b.com"
      />,
    );

    fireEvent.keyDown(
      screen.getByRole("button"),
      { key: "Enter" },
    );

    expect(writeText).toHaveBeenCalledWith(
      "a@b.com",
    );
    await waitFor(() =>
      expect(window.location.href).toBe(
        "mailto:a@b.com",
      ),
    );
  });
});
