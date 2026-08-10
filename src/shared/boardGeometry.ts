// Geometry helpers shared between the static board grid and the animated
// token overlay, so both agree on exactly where each of the 40 spaces sits.

export function gridPos(position: number): { row: number; col: number } {
  if (position <= 10) return { row: 10, col: 10 - position };
  if (position <= 20) return { row: 10 - (position - 10), col: 0 };
  if (position <= 30) return { row: 0, col: position - 20 };
  return { row: position - 30, col: 10 };
}

// Percentage-based (x, y) center of each space within the 11x11 board grid,
// used to place animated tokens with absolute positioning.
export const POSITION_COORDS: { x: number; y: number }[] = Array.from({ length: 40 }, (_, i) => {
  const { row, col } = gridPos(i);
  return { x: ((col + 0.5) / 11) * 100, y: ((row + 0.5) / 11) * 100 };
});
