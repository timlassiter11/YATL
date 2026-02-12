/**
 * Base event class that bubbles and is composed.
 */
export abstract class YatlEvent extends Event {
  constructor(name: string, options: EventInit = {}) {
    super(name, {
      bubbles: true,
      composed: true,
      cancelable: false,
      ...options,
    });
  }

  public abstract clone(): YatlEvent;
}
