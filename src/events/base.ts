/**
 * Base event class that bubbles and is composed.
 */
export class YatlEvent extends Event {
  constructor(name: string, options: EventInit = {}) {
    super(name, {
      bubbles: true,
      composed: true,
      cancelable: false,
      ...options,
    });
  }
}
