/**
 * A mock ResizeObserver that can be controlled from tests.
 * This class is designed to be used with Jest.
 */
export class MockResizeObserver {
  // The callback passed to the constructor.
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  // Mock methods to spy on during tests.
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();

  /**
   * A custom method to manually trigger the resize callback in tests.
   * This simulates the browser firing a resize event.
   * @param entries The mock entries to pass to the callback.
   */
  trigger(entries: ResizeObserverEntry[]) {
    this.callback(entries, this);
  }
}
