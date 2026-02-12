export class TypedEventTarget<TEventMap extends Record<string, Event>> extends EventTarget {
    public override addEventListener<K extends keyof TEventMap>(
    type: K,
    listener: (this: TEventMap, ev: TEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;

  public override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  public override addEventListener(
    type: string,
    listener: unknown,
    options?: boolean | AddEventListenerOptions,
  ) {
    super.addEventListener(type, listener as EventListenerOrEventListenerObject, options);
  }

  public override removeEventListener<K extends keyof TEventMap>(
    type: K,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void;

  public override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type, listener, options);
  }

  public override dispatchEvent<K extends keyof TEventMap>(
    event: TEventMap[K],
  ): boolean {
    return super.dispatchEvent(event);
  }
}