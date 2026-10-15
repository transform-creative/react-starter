import { contextModalPosition } from "~/presentation/elements/ContextModalBL";

/******************************
 * contextModalPosition tests
 */
describe("contextModalPosition", () => {
  const desktop = { width: 1400, height: 900 };
  const box = { width: 300, height: 200 };

  it("keeps the click position when there is room", () => {
    expect(
      contextModalPosition(
        { x: 100, y: 100 },
        box,
        desktop,
      ),
    ).toEqual({ x: 100, y: 100 });
  });

  it("flips left when it would overflow the right edge", () => {
    expect(
      contextModalPosition(
        { x: 1300, y: 100 },
        box,
        desktop,
      ).x,
    ).toBe(1000);
  });

  it("flips above when it would overflow the bottom edge", () => {
    expect(
      contextModalPosition(
        { x: 100, y: 800 },
        box,
        desktop,
      ).y,
    ).toBe(600);
  });

  it("centres horizontally on a narrow phone screen", () => {
    expect(
      contextModalPosition(
        { x: 300, y: 50 },
        box,
        { width: 390, height: 844 },
      ).x,
    ).toBe(45);
  });

  it("never returns a negative offset", () => {
    const pos = contextModalPosition(
      { x: 0, y: 0 },
      { width: 500, height: 500 },
      { width: 320, height: 400 },
    );
    expect(pos.x).toBe(0);
    expect(pos.y).toBeGreaterThanOrEqual(0);
  });
});
