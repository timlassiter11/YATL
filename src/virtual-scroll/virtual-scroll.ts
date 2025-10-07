import type {
  VirtualScrollOptions,
  IVirtualScroll,
  IVirtualScrollConstructor,
} from './types';

const MAX_ELEMENT_HEIGHT = 33554400;

export class VirtualScroll implements IVirtualScroll {
  static #warned = false;
  static AVERAGE_RENDER_COUNT = 1000;

  #container;
  #element;
  #generator;
  #rowCount = 0;
  #rowHeight = 0;
  #padding = 2;
  #animationFrame = 0;
  #started = false;
  #scrollTop = 0;
  #topPaddingElement: HTMLElement;
  #bottomPaddingElement: HTMLElement;
  #resizeObserver: ResizeObserver;

  constructor({
    generator,
    container,
    element = container,
    nodePadding = 10,
  }: VirtualScrollOptions) {
    this.#container = container;
    this.#element = element;
    this.#generator = generator;
    this.#padding = nodePadding;
    this.#topPaddingElement = document.createElement('div');
    this.#topPaddingElement.style.visibility = 'hidden';
    this.#bottomPaddingElement = document.createElement('div');
    this.#bottomPaddingElement.style.visibility = 'hidden';
    this.#resizeObserver = new ResizeObserver(() => this.#renderChunk());
  }

  private get rowHeight() {
    if (!this.#rowHeight) {
      this.#updateRowHeight();
    }
    return this.#rowHeight;
  }

  get started() {
    return this.#started;
  }

  /*
   * Scroll to a specific index in the virtual scroll.
   * @param index The index to scroll to.
   * @throws RangeError if the index is out of bounds.
   */
  scrollToIndex(index: number) {
    if (index < 0 || index >= this.#rowCount) {
      throw new RangeError('Index out of bounds.');
    }
    this.scrollToPx(this.rowHeight * index);
  }

  /**
   * @param px
   */
  scrollToPx(px: number) {
    this.#container.scrollTop = px;
    this.#renderChunk();
  }

  #scrollCallback = () => {
    // Only update if we are vertically scrolling.
    // Fixes horizontal scroll bug.
    if (this.#container.scrollTop !== this.#scrollTop) {
      this.#scrollTop = this.#container.scrollTop;
      if (this.#animationFrame) {
        cancelAnimationFrame(this.#animationFrame);
      }
      this.#animationFrame = requestAnimationFrame(() => this.#renderChunk());
    }
  };

  start(rowCount: number) {
    if (!this.#started) {
      this.#container.addEventListener('scroll', this.#scrollCallback);
      this.#resizeObserver.observe(this.#container);
      this.#started = true;
    }
    this.#container.classList.add('dt-virtual-scroll');
    this.#rowCount = rowCount;
    this.#renderChunk();
  }

  stop() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
    }

    this.#container.classList.remove('dt-virtual-scroll');
    this.#container.removeEventListener('scroll', this.#scrollCallback);
    this.#resizeObserver.disconnect();
    this.#started = false;
  }

  #renderChunk() {
    const scrollTop = this.#container.scrollTop;
    const rowCount = this.#rowCount;
    const rowHeight = this.rowHeight;
    const padding = this.#padding;

    if (!this.started || !rowCount || !rowHeight) {
      return;
    }

    const totalContentHeight = rowHeight * rowCount;
    // Max out the element height so we can get a real height of the container.
    // This fixes an issue when the parent isn't set to grow causing only a
    // small number of rows to render until you scroll.
    this.#element.innerHTML = `<div style="height: ${totalContentHeight}px;"></div>`;
    const actualHeight = this.#element.offsetHeight;
    const viewHeight = this.#container.offsetHeight;

    if (
      !VirtualScroll.#warned &&
      actualHeight < Math.round(totalContentHeight - 1)
    ) {
      VirtualScroll.#warned = true;
      console.error(
        'Max element height exceeded. Virtual scroll may not work.',
      );
    }

    let totalPadding = padding * 2;
    let startNode = Math.floor(scrollTop / rowHeight) - padding;

    if (startNode < 0) {
      totalPadding += startNode;
    }

    startNode = Math.max(0, startNode);

    let visibleNodesCount = Math.ceil(viewHeight / rowHeight) + totalPadding;
    visibleNodesCount = Math.min(rowCount - startNode, visibleNodesCount);

    // Always start with an even row.
    // This helps striped tables.
    if (startNode % 2 === 1) {
      startNode--;
      // If we don't add this we might not render the last row
      visibleNodesCount++;
    }

    const offsetY = startNode * rowHeight;
    let remainingHeight = totalContentHeight - (offsetY + visibleNodesCount * rowHeight);
    if (remainingHeight < 0) {
      remainingHeight = 0;
    }
  
    this.#element.innerHTML = '';
    const visibleChildren = new Array(visibleNodesCount)
      .fill(null)
      .map((_, index) => this.#generator(index + startNode));
    // We create two empty rows. One at the top and one at the bottom.
    // Resize the rows accordingly to move the rendered rows to where we want.
    this.#topPaddingElement.style.height = offsetY + 'px';
    this.#bottomPaddingElement.style.height = remainingHeight + 'px';
    this.#element.append(this.#topPaddingElement);
    this.#element.append(...visibleChildren);
    this.#element.append(this.#bottomPaddingElement);
  }

  #updateRowHeight() {
    if (this.#rowCount === 0) {
      this.#rowHeight = 0;
      return;
    }

    const renderSize = Math.min(
      VirtualScroll.AVERAGE_RENDER_COUNT,
      this.#rowCount,
    );
    // Create an average row height by rendering the first N rows.
    const elements = [];
    for (let i = 0; i < renderSize; ++i) {
      elements.push(this.#generator(i));
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.visibility = 'hidden';
    container.style.height = 'auto';
    container.style.width = '100%';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.maxHeight = 'none';
    container.style.overflow = 'visible';
    container.style.display = 'block';

    try {
      container.append(...elements);
      document.body.append(container);
      this.#rowHeight = container.offsetHeight / renderSize;
    } finally {
      container.remove();
    }

    if (this.#rowHeight <= 0) {
      throw new VirtualScrollError(
        `First ${renderSize} rows had no rendered height. Virtual scroll can't be used.`,
      );
    } else if (this.#rowHeight * this.#rowCount > MAX_ELEMENT_HEIGHT) {
      // This seems to be Chrome's max height of an element based on some random testing.
      console.warn(
        'Virtual scroll height exceeded maximum known element height.',
      );
    }
  }
}

export class VirtualScrollError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// Just to make sure I don't break anything...
VirtualScroll satisfies IVirtualScrollConstructor;
