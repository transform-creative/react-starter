/******************************
 * contextModalPosition
 * Works out where a ContextModal should sit so it stays on screen. Centres the
 * box on an axis the screen is too small for, flips it to the other side of the
 * click when it would overflow, and never returns a negative offset.
 */
export function contextModalPosition(
  click: { x: number; y: number },
  box: { width: number; height: number },
  screen: { width: number; height: number },
): { x: number; y: number } {
  let x = click.x;
  let y = click.y;

  // Centre the box if the screen is narrow
  if (
    screen.width <
    box.width + Math.round(box.width / 1.5)
  ) {
    x = (screen.width - box.width) / 2;
  } else if (screen.width - click.x < box.width) {
    x = click.x - box.width;
  }

  // Centre the box vertically if the screen is short
  if (screen.height < box.height * 1.8) {
    y = screen.height / 2 - box.height / 2 + 40;
  } else if (
    screen.height - click.y <
    box.height
  ) {
    y =
      click.y + box.height > screen.height
        ? screen.height -
          (box.height + box.height / 2)
        : click.y - box.height;
  }

  return { x: Math.max(0, x), y: Math.max(0, y) };
}
