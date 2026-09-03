import { YatlToastHideReason, YatlToastRequest } from '../events/toast';
import { YatlToastData } from '../types';

export type ToastRecord = YatlToastData & {
  id: string;
  /** When the record was first created. */
  createdAt: number;
  /** When the record was last created or upserted. */
  updatedAt: number;
  /** Whether the notification center has surfaced this to the user yet. */
  read: boolean;
  /** When the toast stopped showing live, or `undefined` while it's still live. */
  dismissedAt?: number;
};

/**
 * Session-only store holding every toast raised via `toast()`/`yatl-toast-request`,
 * live or dismissed. `yatl-toast-manager` renders the not-yet-dismissed subset as
 * the live overlay; `yatl-notification-center` renders the full history. Neither
 * component owns this state - it's a singleton so either (or neither) can be
 * mounted without the other needing to know.
 */
export class ToastStore extends EventTarget {
  private records: ToastRecord[] = [];

  /**
   * Once history exceeds this many entries, the oldest dismissed entries are
   * dropped first. Live (not yet dismissed) entries are never trimmed.
   */
  public maxHistory = 50;

  constructor() {
    super();
    window.addEventListener('yatl-toast-request', this.handleToastRequest);
  }

  /** All toast records, newest first. Includes both live and dismissed toasts. */
  public get history(): readonly ToastRecord[] {
    return this.records;
  }

  /**
   * Creates a new toast, or - when `data.id` matches an existing record -
   * updates it in place and brings it back to the front/live. Returns the id.
   *
   * `data.silent` opts a call out of that "brings it back live" behavior -
   * see `YatlToastData.silent` for the exact rules. A record created or
   * updated silently still gets its content updated and is bumped to the
   * front of history - only whether it's currently showing is left alone.
   */
  public add(data: YatlToastData): string {
    const id = data.id ?? crypto.randomUUID();
    const now = Date.now();
    const existingIndex = this.records.findIndex(r => r.id === id);
    const isUpdate = existingIndex >= 0;
    const silent =
      data.silent === 'always' || (data.silent === 'onUpdate' && isUpdate);

    let record: ToastRecord;
    if (isUpdate) {
      const existing = this.records[existingIndex];
      record = {
        ...existing,
        ...data,
        id,
        updatedAt: now,
        read: false,
        dismissedAt: silent ? existing.dismissedAt : undefined,
      };
      this.records.splice(existingIndex, 1);
    } else {
      record = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
        read: false,
        dismissedAt: silent ? now : undefined,
      };
    }

    this.records.unshift(record);
    this.trim();
    this.notify();
    return id;
  }

  /**
   * Marks a live toast as no longer showing. It stays in history - unless
   * it was raised with `persist: false`, in which case it's dropped
   * entirely rather than lingering in the notification center.
   *
   * `reason` decides whether it's still unread: a `'user'` dismissal (the
   * close button, or a consumer calling `hide()` directly) counts as seen,
   * but a `'timeout'` expiry leaves it unread - the user may not have been
   * looking when it expired, and the badge is their only cue they missed it.
   */
  public dismiss(id: string, reason: YatlToastHideReason = 'timeout') {
    const index = this.records.findIndex(r => r.id === id);
    if (index < 0 || this.records[index].dismissedAt) {
      return;
    }

    if (this.records[index].persist === false) {
      this.records.splice(index, 1);
      this.notify();
      return;
    }

    this.records[index].dismissedAt = Date.now();
    if (reason === 'user') {
      this.records[index].read = true;
    }
    this.trim();
    this.notify();
  }

  /** Permanently removes a single record, live or not, from history. */
  public remove(id: string) {
    const index = this.records.findIndex(r => r.id === id);
    if (index < 0) {
      return;
    }

    this.records.splice(index, 1);
    this.notify();
  }

  /** Removes every record, including any still showing live. */
  public clear() {
    if (!this.records.length) {
      return;
    }

    this.records = [];
    this.notify();
  }

  public markRead(id: string) {
    const record = this.records.find(r => r.id === id);
    if (!record || record.read) {
      return;
    }

    record.read = true;
    this.notify();
  }

  public markAllRead() {
    const unread = this.records.filter(r => !r.read);
    if (!unread.length) {
      return;
    }

    for (const record of unread) {
      record.read = true;
    }
    this.notify();
  }

  private trim() {
    for (
      let i = this.records.length - 1;
      i >= 0 && this.records.length > this.maxHistory;
      i--
    ) {
      if (this.records[i].dismissedAt) {
        this.records.splice(i, 1);
      }
    }
  }

  private handleToastRequest = (event: YatlToastRequest) => {
    this.add(event.data);
  };

  private notify() {
    this.dispatchEvent(new Event('change'));
  }
}

/** The shared store backing `yatl-toast-manager` and `yatl-notification-center`. */
export const toastStore = new ToastStore();
