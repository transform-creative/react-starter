import { describe, it, expect } from "vitest";
import { contextModalPosition } from "./ContextModalBL";

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };

/******************************
 * contextModalPosition tests
 * Guards that a ContextModal opens at the click, flips when it would overflow,
 * and on a phone is centred fully on screen rather than pushed off an edge.
 */
describe("contextModalPosition", () => {
  it("opens at the click when there is room", () => {
    expect(
      contextModalPosition(
        { x: 100, y: 100 },
        { width: 400, height: 300 },
        DESKTOP,
      ),
    ).toEqual({ x: 100, y: 100 });
  });

  it("flips to the left of the click near the right edge", () => {
    const { x } = contextModalPosition(
      { x: 1300, y: 100 },
      { width: 400, height: 300 },
      DESKTOP,
    );
    expect(x).toBe(900);
  });

  it("centres a near-full-width box on a phone, wherever the click was", () => {
    const box = {
      width: PHONE.width - 20,
      height: 400,
    };
    for (const clickX of [5, 200, 385]) {
      const { x } = contextModalPosition(
        { x: clickX, y: 300 },
        box,
        PHONE,
      );
      expect(x).toBe(10);
      expect(x + box.width).toBeLessThanOrEqual(
        PHONE.width,
      );
    }
  });

  it("never returns a negative offset for a box wider than the screen", () => {
    const pos = contextModalPosition(
      { x: 200, y: 200 },
      { width: 500, height: 2000 },
      PHONE,
    );
    expect(pos).toEqual({ x: 0, y: 0 });
  });
});
