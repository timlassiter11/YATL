import type {
  IVirtualScroll,
  VirtualScrollOptions,
} from '../../virtual-scroll/types';

export class MockVirtualScroll implements IVirtualScroll {
  static AVERAGE_RENDER_COUNT = 1000;

  options: VirtualScrollOptions;

  constructor(options: VirtualScrollOptions) {
    this.options = options;
  }
  start = jest.fn();
  stop = jest.fn();
  scrollToIndex = jest.fn();
  scrollToPx = jest.fn();
}
