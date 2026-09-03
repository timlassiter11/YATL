import { ComplexAttributeConverter } from 'lit';
import { YatlToastData, YatlToastVariant } from '../types';
import { YatlToastRequest } from '../events/toast';

/**
 * Retrieves the flattened list of elements assigned to a slot.
 *
 * Unlike the native `assignedElements({flatten: true})`, this function
 * correctly falls back to the slot's default content (its light DOM children)
 * if no nodes are assigned.
 *
 * It recursively resolves nested slots in the default content to ensure
 * you always get the final rendered leaf elements.
 */
export function getEffectiveChildren(node: Node): Element[] {
  if (node instanceof HTMLSlotElement) {
    const assigned = node.assignedElements({ flatten: true });
    if (assigned.length > 0) {
      return assigned.flatMap(getEffectiveChildren);
    }

    const fallback = Array.from(node.children);
    return fallback.flatMap(getEffectiveChildren);
  }
  if (node instanceof Element) {
    // Filter out comments
    if (node.nodeType !== Node.COMMENT_NODE) {
      // Filter out empty text nodes
      if (node.nodeType !== Node.TEXT_NODE || node.textContent!.trim() !== '') {
        return [node];
      }
    }
  }
  return [];
}

/**
 * Lit Property converter to convert between date string and date objects
 */
class DateConverter implements ComplexAttributeConverter<Date | undefined> {
  public fromAttribute(value: string) {
    if (!value) return undefined;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return isNaN(date.getTime()) ? undefined : date;
  }

  public toAttribute(value: Date | string | undefined) {
    // If the user sets a string, convert it to a date to make sure its valid
    if (typeof value === 'string') {
      value = this.fromAttribute(value);
    }

    if (!value || isNaN(value.getTime())) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export const dateConverter = new DateConverter();

// SOURCE: https://github.com/shoelace-style/webawesome/blob/next/packages/webawesome/src/internal/active-elements.ts#L14
/**
 * Use a generator so we can iterate and possibly break early.
 * @example
 *   // to operate like a regular array. This kinda nullifies generator benefits, but worth knowing if you need the whole array.
 *   const allActiveElements = [...activeElements()]
 *
 *   // Early return
 *   for (const activeElement of activeElements()) {
 *     if (<cond>) {
 *       break; // Break the loop, don't need to iterate over the whole array or store an array in memory!
 *     }
 *   }
 */
export function* activeElements(
  activeElement: Element | null = document.activeElement,
): Generator<Element> {
  if (activeElement === null || activeElement === undefined) return;

  yield activeElement;

  if (
    'shadowRoot' in activeElement &&
    activeElement.shadowRoot &&
    activeElement.shadowRoot.mode !== 'closed'
  ) {
    yield* activeElements(activeElement.shadowRoot.activeElement);
  }
}

export async function animateWithClass(
  element: HTMLElement,
  className: string,
  animationName?: string,
  timeout = 350,
) {
  element.classList.remove(className);
  element.classList.add(className);
  await getAnimationPromise(element, animationName, timeout);
  element.classList.remove(className);
}

export async function getAnimationPromise(
  element: HTMLElement,
  animationName?: string,
  timeout = 350,
) {
  await new Promise<void>(resolve => {
    const controller = new AbortController();
    const { signal } = controller;

    let timer = 0;
    const onEnd = (event?: AnimationEvent) => {
      // No event means the timeout fired - always resolve in that case,
      // as a fallback for when the animation never fires at all. A real
      // event only counts if it matches the requested animation name
      // (when one was given).
      if (event && animationName && animationName !== event.animationName) {
        return;
      }

      clearTimeout(timer);
      element.removeEventListener('animationend', onEnd);
      element.removeEventListener('animationcancel', onEnd);
      resolve();
      controller.abort();
    };

    timer = window.setTimeout(() => {
      onEnd();
    }, timeout);

    element.addEventListener('animationend', onEnd, { signal });
    element.addEventListener('animationcancel', onEnd, { signal });
  });
}

/**
 * Shows a toast via `yatl-toast-manager` and/or records it in
 * `yatl-notification-center`'s history (whichever are mounted - neither is
 * required). Returns the toast's id: pass it back as `data.id` on a later
 * call to update the same toast in place instead of creating a new one.
 */
export function toast(data: YatlToastData): string {
  const id = data.id ?? crypto.randomUUID();
  window.dispatchEvent(new YatlToastRequest({ ...data, id }));
  return id;
}

/** The icon shown for a given toast/notification variant, if any. */
export function toastVariantIcon(variant: YatlToastVariant = 'neutral') {
  if (variant === 'danger') {
    return 'close';
  } else if (variant === 'success') {
    return 'check';
  }
  // TODO: create exclamation icon for 'warning'
  return '';
}

const RELATIVE_TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 30],
  ['week', 1000 * 60 * 60 * 24 * 7],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
];

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
});

/**
 * Formats a past timestamp (epoch ms) as a short relative string, e.g.
 * "5 minutes ago" or "just now" for anything under a minute old.
 */
export function formatRelativeTime(
  timestamp: number,
  now: number = Date.now(),
): string {
  const elapsed = now - timestamp;

  for (const [unit, unitMs] of RELATIVE_TIME_UNITS) {
    if (elapsed >= unitMs) {
      return relativeTimeFormatter.format(-Math.floor(elapsed / unitMs), unit);
    }
  }

  return 'just now';
}
