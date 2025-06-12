const MAX_ELEMENT_HEIGHT = 33554400;

export class VirtualScroll {
  static #warned = false;

  #container;
  #element;
  #generator;
  #rowCount = 0;
  #rowHeight = 0;
  #padding = 2;
  #animationFrame = 0;
  #started = false;
  #scrollTop = 0;

  constructor({
    container,
    element,
    generator,
    nodePadding = 10,
  }: VirtualScrollOptions) {
    this.#container = container;
    this.#element = element;
    this.#generator = generator;
    this.#padding = nodePadding;

    // Watch for visual changes on our virtual scroll element.
    // This allows us to avoid rendering when the element isn't
    // shown since it can't do the calculations and then start
    // rendering once the element comes into view.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.intersectionRatio === 1) {
          this.renderChunk();
        }
      }
    });
    observer.observe(this.#element);
  }

  get rowHeight() {
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
    this.renderChunk();
  }

  #scrollCallback = () => {
    // Only update if we are vertically scrolling.
    // Fixes horizontal scroll bug.
    if (this.#container.scrollTop !== this.#scrollTop) {
      this.#scrollTop = this.#container.scrollTop;
      if (this.#animationFrame) {
        cancelAnimationFrame(this.#animationFrame);
      }
      this.#animationFrame = requestAnimationFrame(() => this.renderChunk());
    }
  };

  #renderCallback = () => {
    this.renderChunk();
  };

  start(rowCount: number) {
    if (!this.#started) {
      this.#container.addEventListener('scroll', this.#scrollCallback);
      window.addEventListener('resize', this.#renderCallback);
      this.#started = true;
    }
    this.#rowCount = rowCount;
    this.renderChunk();
  }

  stop() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
    }

    this.#container.removeEventListener('scroll', this.#scrollCallback);
    window.removeEventListener('resize', this.#renderCallback);
    this.#started = false;
  }

  renderChunk() {
    const scrollTop = this.#container.scrollTop;
    const rowCount = this.#rowCount;
    const rowHeight = this.rowHeight;
    const padding = this.#padding;

    if (
      !this.started ||
      !this.#element.checkVisibility() ||
      !rowCount ||
      !rowHeight
    ) {
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

    let startNode = Math.floor(scrollTop / rowHeight) - padding;
    startNode = Math.max(0, startNode);

    let visibleNodesCount = Math.ceil(viewHeight / rowHeight) + 2 * padding;
    visibleNodesCount = Math.min(rowCount - startNode, visibleNodesCount);

    const offsetY = startNode * rowHeight;
    const remainingHeight =
      totalContentHeight - (offsetY + visibleNodesCount * rowHeight);

    try {
      this.#element.innerHTML = '';
      const visibleChildren = new Array(visibleNodesCount)
        .fill(null)
        .map((_, index) => this.#generator(index + startNode));
      // We create two empty rows. One at the top and one at the bottom.
      // Resize the rows accordingly to move the rendered rows to where we want.
      const topRow = document.createElement('div');
      const bottomRow = document.createElement('div');
      topRow.style.height = offsetY + 'px';
      bottomRow.style.height = remainingHeight + 'px';
      this.#element.append(topRow);
      this.#element.append(...visibleChildren);
      this.#element.append(bottomRow);
    } catch (e) {
      if (e instanceof RangeError) {
        console.log(e);
      }
    }
  }

  #updateRowHeight() {
    if (this.#rowCount === 0 || !this.#element.checkVisibility()) {
      this.#rowHeight = 0;
      return;
    }

    const AVERAGE_RENDER_COUNT = 1000;
    const renderSize = Math.min(AVERAGE_RENDER_COUNT, this.#rowCount);
    // Create an average row height by rendering the first N rows.
    const elements = [];
    for (let i = 0; i < renderSize; ++i) {
      elements.push(this.#generator(i));
    }
    this.#element.innerHTML = '';
    this.#element.append(...elements);
    this.#rowHeight = this.#element.offsetHeight / renderSize;

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

export interface VirtualScrollOptions {
  container: HTMLElement;
  element: HTMLElement;
  generator: (index: number) => HTMLElement;
  nodePadding?: number;
}
