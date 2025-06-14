const MAX_ELEMENT_HEIGHT = 33554400;
const DEFAULT_ESTIMATED_ROW_HEIGHT = 30;

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
  _rowMetas: Array<{height: number; offset: number} | null> = [];
  #estimateRowHeight: (index: number) => number;

  constructor({
    container,
    element,
    generator,
    nodePadding = 10,
    estimateRowHeight,
  }: VirtualScrollOptions) {
    this.#container = container;
    this.#element = element;
    this.#generator = generator;
    this.#padding = nodePadding;
    this.#estimateRowHeight = estimateRowHeight ?? (() => DEFAULT_ESTIMATED_ROW_HEIGHT);

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
    // Returns the estimated height of the first row or a default.
    // Individual row heights should be accessed via _getRowMetadata(index).height.
    return this.#estimateRowHeight(0);
  }

  _getRowMetadata(index: number): {height: number; offset: number} {
    if (index < 0 || index >= this.#rowCount) {
      throw new RangeError('Index out of bounds in _getRowMetadata.');
    }

    if (this._rowMetas[index]) {
      return this._rowMetas[index]!;
    }

    const height = this.#estimateRowHeight(index);
    let offset = 0;
    if (index > 0) {
      const prevMeta = this._getRowMetadata(index - 1); // Recursive call
      offset = prevMeta.offset + prevMeta.height;
    }

    const meta = {height, offset};
    this._rowMetas[index] = meta;
    return meta;
  }

  _measureAndCacheRowHeight(index: number, generatedElement?: HTMLElement): number {
    if (index < 0 || index >= this.#rowCount) {
      throw new RangeError('Index out of bounds in _measureAndCacheRowHeight.');
    }

    const elementToMeasure = generatedElement ?? this.#generator(index);

    // To measure, element needs to be in the DOM.
    // This is a simplified approach; a dedicated off-screen measurement div might be better.
    const parent = this.#element;
    parent.appendChild(elementToMeasure);
    const actualHeight = elementToMeasure.offsetHeight;
    if (!generatedElement) { // Only remove if we added it temporarily
      parent.removeChild(elementToMeasure);
    }

    let offset = 0;
    if (index > 0) {
      // Ensure previous metadata is available, might be an estimate
      const prevMeta = this._getRowMetadata(index - 1);
      offset = prevMeta.offset + prevMeta.height;
    }

    // Update if new measurement or if height changed
    if (!this._rowMetas[index] || this._rowMetas[index]!.height !== actualHeight) {
      this._rowMetas[index] = {height: actualHeight, offset};
    }
    // else if (this._rowMetas[index]!.offset !== offset) {
      // Offset might change if a previous row's height was remeasured.
      // this._rowMetas[index]!.offset = offset;
      // This scenario is complex as it could require cascading updates.
      // For now, _getRowMetadata calculates offset on-the-fly based on previous row's *current* metadata.
    // }


    return actualHeight;
  }

  _getTotalContentHeight(): number {
    if (this.#rowCount === 0) {
      return 0;
    }
    // The offset of the last element + its height gives the total height.
    const lastMeta = this._getRowMetadata(this.#rowCount - 1);
    return lastMeta.offset + lastMeta.height;
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
    // Use _getRowMetadata to get the correct offset for variable height rows
    const meta = this._getRowMetadata(index);
    this.scrollToPx(meta.offset);
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

    // Resize _rowMetas to match rowCount, filling with null
    if (this._rowMetas.length !== rowCount) {
      this._rowMetas = new Array(rowCount).fill(null);
    } else {
      // If you need to preserve existing non-null values,
      // you might need a more sophisticated approach here.
      // For now, this will re-initialize if rowCount is the same.
      // A simple optimization could be to only fill if length changed.
      this._rowMetas.fill(null);
    }

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
    // const rowHeight = this.rowHeight; // Removed: rowHeight is variable
    const padding = this.#padding;

    if (
      !this.started ||
      !this.#element.checkVisibility() ||
      !rowCount
      // !rowHeight // Removed: rowHeight is variable
    ) {
      return;
    }

    let totalContentHeight = this._getTotalContentHeight();
    // Set a placeholder div with the total content height to enable scrollbar
    this.#element.innerHTML = `<div style="height: ${totalContentHeight}px;"></div>`;
    const actualHeight = this.#element.offsetHeight; // Actual height of the container element itself
    const viewHeight = this.#container.offsetHeight;

    if (
      !VirtualScroll.#warned &&
      actualHeight < Math.round(totalContentHeight - 1) && totalContentHeight > 0
    ) {
      VirtualScroll.#warned = true;
      console.error(
        'Max element height exceeded. Virtual scroll may not work. Total content height:', totalContentHeight, 'Actual element height:', actualHeight
      );
    }

    // Determine startNode
    let startNode = 0;
    for (let i = 0; i < rowCount; i++) {
      const rowMeta = this._getRowMetadata(i);
      if (rowMeta.offset + rowMeta.height < scrollTop) {
        startNode = i + 1;
      } else {
        break;
      }
    }
    startNode = Math.max(0, startNode - padding);

    // Determine visibleNodesCount
    let visibleHeight = 0;
    let visibleNodesCount = 0;
    for (let i = startNode; i < rowCount; i++) {
      if (visibleHeight >= viewHeight && visibleNodesCount > 2 * padding) {
        break;
      }
      const rowMeta = this._getRowMetadata(i);
      visibleHeight += rowMeta.height;
      visibleNodesCount++;
    }
    visibleNodesCount = Math.min(rowCount - startNode, visibleNodesCount);

    // Initial offsetY (top padding height)
    let offsetY = 0;
    if (startNode > 0) {
      offsetY = this._getRowMetadata(startNode).offset;
    }

    this.#element.innerHTML = ''; // Clear placeholder

    const visibleChildren: HTMLElement[] = [];
    for (let j = 0; j < visibleNodesCount; j++) {
      const currentIndex = startNode + j;
      if (currentIndex < rowCount) { // Ensure not to go out of bounds
        const childElement = this.#generator(currentIndex);
        visibleChildren.push(childElement);
      } else {
        // This case should ideally not be hit if visibleNodesCount is calculated correctly
        console.warn("Attempted to generate child out of bounds:", currentIndex);
        break;
      }
    }

    const topRow = document.createElement('div');
    topRow.style.height = offsetY + 'px';
    this.#element.append(topRow);
    this.#element.append(...visibleChildren);

    // Measure children now that they are in the DOM
    for (let j = 0; j < visibleChildren.length; j++) {
      const currentIndex = startNode + j;
      // It's possible visibleChildren.length is less than visibleNodesCount if generator failed or bounds issue
      if (currentIndex < rowCount) {
        this._measureAndCacheRowHeight(currentIndex, visibleChildren[j]);
      }
    }

    // Recalculate offsetY and totalContentHeight after measurements
    if (startNode > 0) {
        // Ensure metadata for startNode is accurate after potential measurements
        offsetY = this._getRowMetadata(startNode).offset;
    } else {
        offsetY = 0;
    }
    topRow.style.height = offsetY + 'px'; // Update top padding

    totalContentHeight = this._getTotalContentHeight(); // Recalculate with new measurements

    // Calculate remainingHeight (bottom padding height)
    let remainingHeight = 0;
    if (startNode + visibleNodesCount < rowCount) {
      const bottomOffsetMeta = this._getRowMetadata(startNode + visibleNodesCount -1);
      const bottomOffset = bottomOffsetMeta.offset + bottomOffsetMeta.height;
      remainingHeight = totalContentHeight - bottomOffset;
    }
    remainingHeight = Math.max(0, remainingHeight); // Ensure not negative

    const bottomRow = document.createElement('div');
    bottomRow.style.height = remainingHeight + 'px';
    this.#element.append(bottomRow);

    // The RangeError catch can be kept if #generator can throw it,
    // though specific error handling might need review.
    // try { ... } catch (e) { if (e instanceof RangeError) { console.log(e); } }
  }

  /**
   * Clears the cached height and offset for a specific row.
   * The row will be re-estimated and then re-measured if it becomes visible
   * or its metadata is requested by other operations.
   * This does not automatically trigger a re-render.
   * @param index The index of the row to reset.
   */
  resetRowHeight(index: number): void {
    if (index < 0 || index >= this.#rowCount) {
      console.warn(`resetRowHeight: Index ${index} is out of bounds.`);
      return;
    }
    this._rowMetas[index] = null;
    // Subsequent calls to _getRowMetadata for this index will re-estimate.
    // Offsets of subsequent rows will be recalculated on-demand.
    // _getTotalContentHeight will also reflect changes upon its next call.
  }

  /**
   * Clears all cached row heights and offsets.
   * All rows will be re-estimated and then re-measured as they become visible
   * or their metadata is requested.
   * This does not automatically trigger a re-render.
   */
  resetAllRowHeights(): void {
    this._rowMetas = new Array(this.#rowCount).fill(null);
    // All row metadata will be recalculated on-demand.
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
  // this.#rowHeight = this.#element.offsetHeight / renderSize; // Removed

  // if (this.#rowHeight <= 0) { // Removed
  //   throw new VirtualScrollError( // Removed
  //     `First ${renderSize} rows had no rendered height. Virtual scroll can't be used.`, // Removed
  //   ); // Removed
  // } else if (this.#rowHeight * this.#rowCount > MAX_ELEMENT_HEIGHT) { // Removed
  //   // This seems to be Chrome's max height of an element based on some random testing. // Removed
  //   console.warn( // Removed
  //     'Virtual scroll height exceeded maximum known element height.', // Removed
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
  estimateRowHeight?: (index: number) => number;
}
