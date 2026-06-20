export const ROWS = 6
export const COLS = 7
export const EMPTY = 0
export const P1 = 1
export const P2 = 2

export type Cell = 0 | 1 | 2
export type Board = Cell[][]
export type Player = 1 | 2

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY) as Cell[])
}
