import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlDetails } from './details';
import { YatlDetailsToggleEvent } from '../../events/details';

async function updateAll(...els: { updateComplete: Promise<unknown> }[]) {
  await Promise.all(els.map(el => el.updateComplete));
}

describe('YatlDetails - accordion grouping', () => {
  test('opening one closes others sharing the same name', async () => {
    document.body.innerHTML = `
      <yatl-details name="group" open summary="A"></yatl-details>
      <yatl-details name="group" summary="B"></yatl-details>
    `;
    const [a, b] = [
      ...document.querySelectorAll('yatl-details'),
    ] as YatlDetails[];
    await updateAll(a, b);
    expect(a.open).toBe(true);

    b.open = true;
    await updateAll(a, b);

    expect(b.open).toBe(true);
    expect(a.open).toBe(false);
  });

  test('details with different names do not affect each other', async () => {
    document.body.innerHTML = `
      <yatl-details name="one" open summary="A"></yatl-details>
      <yatl-details name="two" summary="B"></yatl-details>
    `;
    const [a, b] = [
      ...document.querySelectorAll('yatl-details'),
    ] as YatlDetails[];
    await updateAll(a, b);

    b.open = true;
    await updateAll(a, b);

    expect(a.open).toBe(true);
    expect(b.open).toBe(true);
  });

  test('details with no name do not affect each other', async () => {
    document.body.innerHTML = `
      <yatl-details open summary="A"></yatl-details>
      <yatl-details summary="B"></yatl-details>
    `;
    const [a, b] = [
      ...document.querySelectorAll('yatl-details'),
    ] as YatlDetails[];
    await updateAll(a, b);

    b.open = true;
    await updateAll(a, b);

    expect(a.open).toBe(true);
    expect(b.open).toBe(true);
  });

  test('a name containing a double quote does not throw', async () => {
    document.body.innerHTML = `
      <yatl-details summary="A"></yatl-details>
    `;
    const a = document.querySelector<YatlDetails>('yatl-details')!;
    await a.updateComplete;

    a.name = 'weird"name';
    a.open = true;
    // willUpdate() runs the accordion-group query asynchronously, so an
    // invalid-selector failure would surface here as a rejection, not
    // synchronously on the property set above.
    await expect(a.updateComplete).resolves.toBe(true);
  });
});

describe('YatlDetails - toggle interaction', () => {
  test('the native toggle event syncs open and fires yatl-details-toggle', async () => {
    document.body.innerHTML = '<yatl-details summary="A"></yatl-details>';
    const el = document.querySelector<YatlDetails>('yatl-details')!;
    await el.updateComplete;

    let toggledOpen: boolean | undefined;
    el.addEventListener('yatl-details-toggle', (e: YatlDetailsToggleEvent) => {
      toggledOpen = e.open;
    });

    const details = el.shadowRoot!.querySelector('details')!;
    details.open = true;
    details.dispatchEvent(new Event('toggle'));

    expect(el.open).toBe(true);
    expect(toggledOpen).toBe(true);
  });
});
