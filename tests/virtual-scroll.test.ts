import { VirtualScroll } from '../src/virtual-scroll/virtual-scroll';
import { MockResizeObserver } from './__mocks__/mock-resize-observer';

const itemHeight = 50;
const containerHeight = 500;
const nodePadding = 1;

// Array to hold all created mock observer instances for a single test.
let mockObserverInstances: MockResizeObserver[] = [];

// Mock the global ResizeObserver before all tests.
beforeAll(() => {
  global.ResizeObserver = jest.fn(callback => {
    const instance = new MockResizeObserver(callback);
    mockObserverInstances.push(instance);
    return instance;
  }) as any;

  // Mock offsetHeight on all divs
  Object.defineProperty(HTMLDivElement.prototype, 'offsetHeight', {
    configurable: true,
    get: function () {
      const that = this as HTMLDivElement;
      let height = 0;
      for (const child of that.children) {
        height += (child as HTMLElement).offsetHeight;
      }
      return height;
    },
  });
});

// Mock requestAnimationFrame to make scroll tests work
let frameRequestCallback: FrameRequestCallback | null = null;
jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
  frameRequestCallback = cb;
  return 1; // Return a mock frame ID
});
jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
  frameRequestCallback = null;
});

// Helper to manually trigger a frame update.
const triggerAnimationFrame = () => {
  if (frameRequestCallback) {
    frameRequestCallback(performance.now());
    frameRequestCallback = null;
  }
};

describe('Virtual Scroll', () => {
  let container: HTMLElement;
  let element: HTMLElement;
  let virtualScroll: VirtualScroll;
  let generator: jest.Mock;

  beforeEach(() => {
    mockObserverInstances = [];
    jest.clearAllMocks();
    frameRequestCallback = null;

    generator = jest.fn((index: number) => {
      const item = document.createElement('div');
      item.textContent = `${index}`;
      Object.defineProperty(item, 'offsetHeight', {
        configurable: true,
        value: itemHeight,
      });
      return item;
    });

    document.body.innerHTML =
      '<div id="container"><div id="element"></div></div>';
    container = document.getElementById('container')!;
    Object.defineProperty(container, 'offsetHeight', {
      configurable: true,
      value: containerHeight,
    });
    element = document.getElementById('element')!;
    virtualScroll = new VirtualScroll({
      generator,
      container,
      element,
      nodePadding,
    });
  });

  it('should start and stop the virtual scroll', () => {
    expect(virtualScroll.started).toBeFalsy();
    virtualScroll.start(100);
    expect(virtualScroll.started).toBeTruthy();
    virtualScroll.stop();
    expect(virtualScroll.started).toBeFalsy();
  });

  it('should render only visible rows with padding', () => {
    const visibleRows = containerHeight / itemHeight;
    virtualScroll.start(100);
    // add 2 for the top and bottom padding elements
    expect(element.querySelectorAll('div').length).toBe(
      visibleRows + nodePadding + 2,
    );
  });

  it('should scroll to a specific item', () => {
    const count = 100;
    const scrollTo = 50;
    let paddedIndex = scrollTo - nodePadding;
    // virtual scroll always starts with an even index
    if (paddedIndex % 2 === 1) {
      paddedIndex--;
    }

    virtualScroll.start(count);
    virtualScroll.scrollToIndex(scrollTo);
    const elements = [...element.querySelectorAll('div')];
    const items = elements
      .slice(1, elements.length - 1)
      .map(element => parseInt(element.textContent!));
    expect(items.at(0)).toEqual(paddedIndex);
  });

  it('should not allow invalid indexes', () => {
    virtualScroll.start(10);
    expect(() => virtualScroll.scrollToIndex(-1)).toThrow(RangeError);
    expect(() => virtualScroll.scrollToIndex(11)).toThrow(RangeError);
  });

  it('should not render when no rows are given', () => {
    virtualScroll.start(0);
    expect(generator).not.toHaveBeenCalled();
  });

  it('should re-render on scroll events', () => {
    virtualScroll.start(100);
    container.scrollTop = itemHeight * 10;
    container.dispatchEvent(new Event('scroll'));
    triggerAnimationFrame();
    const elements = [...element.querySelectorAll('div')];
    const items = elements
      .slice(1, elements.length - 1)
      .map(element => parseInt(element.textContent!));
    expect(items).toContain(10);
  });

  it('should cancel animation frame on stop', () => {
    virtualScroll.start(100);
    container.scrollTop = itemHeight * 10;
    container.dispatchEvent(new Event('scroll'));
    virtualScroll.stop();
    triggerAnimationFrame();
  });
});
