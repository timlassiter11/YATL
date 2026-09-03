import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ToastStore } from './toast-store';
import { YatlToastRequest } from '../events/toast';

describe('ToastStore', () => {
  let store: ToastStore;

  beforeEach(() => {
    store = new ToastStore();
  });

  test('add() creates a record with a generated id and fires change', () => {
    const onChange = vi.fn();
    store.addEventListener('change', onChange);

    const id = store.add({ message: 'Hello' });

    expect(id).toBeTruthy();
    expect(store.history).toHaveLength(1);
    expect(store.history[0]).toMatchObject({
      id,
      message: 'Hello',
      read: false,
    });
    expect(store.history[0].dismissedAt).toBeUndefined();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('newest records are added to the front', () => {
    store.add({ message: 'First' });
    store.add({ message: 'Second' });

    expect(store.history.map(r => r.message)).toEqual(['Second', 'First']);
  });

  test('add() with an existing id upserts in place instead of creating a new record', () => {
    const id = store.add({ message: 'Uploading 0%' });
    store.add({ message: 'Other toast' });

    store.add({ id, message: 'Uploading 50%' });

    expect(store.history).toHaveLength(2);
    const record = store.history.find(r => r.id === id);
    expect(record?.message).toBe('Uploading 50%');
  });

  test('upserting a record moves it to the front and marks it unread again', () => {
    const id = store.add({ message: 'First' });
    store.add({ message: 'Second' });
    store.markAllRead();

    store.add({ id, message: 'First updated' });

    expect(store.history[0]).toMatchObject({ id, read: false });
  });

  test('upserting a dismissed record brings it back live', () => {
    const id = store.add({ message: 'Hi' });
    store.dismiss(id);
    expect(store.history[0].dismissedAt).toBeDefined();

    store.add({ id, message: 'Hi again' });

    expect(store.history[0].dismissedAt).toBeUndefined();
  });

  test('add() preserves createdAt but bumps updatedAt on upsert', () => {
    const id = store.add({ message: 'First' });
    const createdAt = store.history[0].createdAt;

    store.add({ id, message: 'Updated' });

    expect(store.history[0].createdAt).toBe(createdAt);
    expect(store.history[0].updatedAt).toBeGreaterThanOrEqual(createdAt);
  });

  test('dismiss() with no reason (default "timeout") marks a record dismissed but leaves it unread', () => {
    const id = store.add({ message: 'Hi' });

    store.dismiss(id);

    const record = store.history.find(r => r.id === id);
    expect(record?.dismissedAt).toBeDefined();
    // A toast that expired without the panel ever being opened should
    // still show a badge - the user may not have seen it.
    expect(record?.read).toBe(false);
  });

  test('dismiss(id, "timeout") leaves the record unread', () => {
    const id = store.add({ message: 'Hi' });

    store.dismiss(id, 'timeout');

    expect(store.history.find(r => r.id === id)?.read).toBe(false);
  });

  test('dismiss(id, "user") marks the record read', () => {
    const id = store.add({ message: 'Hi' });

    store.dismiss(id, 'user');

    const record = store.history.find(r => r.id === id);
    expect(record?.dismissedAt).toBeDefined();
    expect(record?.read).toBe(true);
  });

  test('dismiss() is a no-op for an unknown or already-dismissed id', () => {
    const id = store.add({ message: 'Hi' });
    store.dismiss(id);
    const onChange = vi.fn();
    store.addEventListener('change', onChange);

    store.dismiss(id);
    store.dismiss('does-not-exist');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('dismiss() drops a persist: false record entirely instead of keeping it in history', () => {
    const id = store.add({ message: 'Copied to clipboard', persist: false });

    store.dismiss(id);

    expect(store.history).toHaveLength(0);
  });

  test('a persist: false record still shows live until it is dismissed', () => {
    const id = store.add({ message: 'Copied to clipboard', persist: false });

    expect(store.history.find(r => r.id === id)?.dismissedAt).toBeUndefined();
  });

  test('remove() deletes a record entirely, live or dismissed', () => {
    const liveId = store.add({ message: 'Live' });
    const dismissedId = store.add({ message: 'Dismissed' });
    store.dismiss(dismissedId);

    store.remove(liveId);
    store.remove(dismissedId);

    expect(store.history).toHaveLength(0);
  });

  test('clear() removes every record, including live ones', () => {
    store.add({ message: 'Live' });
    const dismissedId = store.add({ message: 'Dismissed' });
    store.dismiss(dismissedId);

    store.clear();

    expect(store.history).toHaveLength(0);
  });

  test('clear() on an empty store does not fire change', () => {
    const onChange = vi.fn();
    store.addEventListener('change', onChange);

    store.clear();

    expect(onChange).not.toHaveBeenCalled();
  });

  test('markAllRead() flips every unread record and no-ops when already read', () => {
    store.add({ message: 'First' });
    store.add({ message: 'Second' });

    store.markAllRead();
    expect(store.history.every(r => r.read)).toBe(true);

    const onChange = vi.fn();
    store.addEventListener('change', onChange);
    store.markAllRead();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('markRead() flips a single record', () => {
    const id = store.add({ message: 'First' });
    store.add({ message: 'Second' });

    store.markRead(id);

    const record = store.history.find(r => r.id === id);
    expect(record?.read).toBe(true);
    expect(store.history.find(r => r.message === 'Second')?.read).toBe(false);
  });

  test('trims oldest dismissed records once history exceeds maxHistory', () => {
    store.maxHistory = 2;

    const firstId = store.add({ message: 'First' });
    store.dismiss(firstId);
    const secondId = store.add({ message: 'Second' });
    store.dismiss(secondId);
    store.add({ message: 'Third' });

    expect(store.history).toHaveLength(2);
    expect(store.history.some(r => r.id === firstId)).toBe(false);
  });

  test('never trims live (not dismissed) records, even over maxHistory', () => {
    store.maxHistory = 1;

    store.add({ message: 'First' });
    store.add({ message: 'Second' });
    store.add({ message: 'Third' });

    expect(store.history).toHaveLength(3);
    expect(store.history.every(r => !r.dismissedAt)).toBe(true);
  });

  test('listens for yatl-toast-request events on window', () => {
    window.dispatchEvent(new YatlToastRequest({ message: 'From event' }));

    expect(store.history.some(r => r.message === 'From event')).toBe(true);
  });
});
