import {
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabelInput } from "./LabelInput";

const PLAYERS = [
  { value: "player-1", label: "Mia" },
  { value: "player-2", label: "Pat" },
];

/** react-select paints its indicators as bare svgs with no stable class or
 *  role (no classNamePrefix is set here), so the only thing to count is the
 *  icons themselves: the chevron alone, or the chevron plus the cross. */
function indicatorCount(container: HTMLElement) {
  return container.querySelectorAll("svg").length;
}

/******************************
 * LabelInput dropdown clearing tests
 * `isClearable` is opt-in because LabelInput's dropdown mode wraps TypeInput,
 * which backs every react-select in an app built from this template — most of
 * those fields are required, so the default must stay "no X" or any of them
 * could be emptied.
 */
describe("LabelInput isClearable", () => {
  it("renders no clear indicator on a dropdown by default", () => {
    const { container } = render(
      <LabelInput
        name="Assignee"
        id="assignee"
        options={PLAYERS}
        value="player-1"
        onChange={vi.fn()}
      />,
    );

    expect(indicatorCount(container)).toBe(1);
  });

  it("renders a clear indicator when asked for one", () => {
    const { container } = render(
      <LabelInput
        name="Assignee"
        id="assignee"
        isClearable
        options={PLAYERS}
        value="player-1"
        onChange={vi.fn()}
      />,
    );

    expect(indicatorCount(container)).toBe(2);
  });

  // TypeInput reads `val?.value`, so a cleared select reports undefined rather
  // than an empty string — callers have to handle that, not just a falsy value.
  it("reports an undefined value when the selection is cleared", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <LabelInput
        name="Assignee"
        id="assignee"
        isClearable
        options={PLAYERS}
        value="player-1"
        onChange={onChange}
      />,
    );

    const clear = container.querySelectorAll(
      "svg",
    )[0].parentElement as HTMLElement;
    await userEvent.click(clear);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: undefined,
        }),
      }),
    );
  });

  it("leaves a non-clearable dropdown's value untouched by default", () => {
    render(
      <LabelInput
        name="Assignee"
        id="assignee"
        options={PLAYERS}
        value="player-1"
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Mia"),
    ).toBeInTheDocument();
  });
});
