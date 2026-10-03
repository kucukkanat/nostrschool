/** Shapes passed between chart components and the shared frame (not public API). */
export interface Tip {
  /** Anchor in plot pixels (the SVG viewBox is 1:1 with CSS pixels). */
  readonly x: number;
  readonly y: number;
  readonly text: string;
}

export interface TableData {
  readonly columns: readonly string[];
  readonly rows: readonly { readonly id: string; readonly cells: readonly string[] }[];
}
