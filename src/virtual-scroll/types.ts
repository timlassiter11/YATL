export interface VirtualScrollOptions {
  generator: (index: number) => HTMLElement;
  container: HTMLElement;
  element?: HTMLElement;
  nodePadding?: number;
}

export interface IVirtualScroll {
  start(rowCount: number): void;
  stop(): void;
  scrollToIndex(index: number): void;
  scrollToPx(px: number): void;
}

export interface IVirtualScrollConstructor {
  new (options: VirtualScrollOptions): IVirtualScroll;
}