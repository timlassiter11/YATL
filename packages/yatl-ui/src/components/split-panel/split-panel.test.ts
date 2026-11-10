import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlSplitPanel } from './split-panel';

/** Waits for the resize observer to fire and the update it asks for */
async function afterResize(el: YatlSplitPanel) {
  await new Promise(r => requestAnimationFrame(() => r(undefined)));
  await new Promise(r => requestAnimationFrame(() => r(undefined)));
  await el.updateComplete;
}

function splitPosition(el: YatlSplitPanel) {
  return el.style.getPropertyValue('--split-position');
}

async function renderPanel(containerStyle: string, attrs: string) {
  // No theme is loaded in tests, so the divider's default size (a theme
  // spacing token) is undefined and would break the grid
  document.body.innerHTML = `
    <div
      id="container"
      style="--yatl-split-panel-divider-size: 8px; ${containerStyle}"
    >
      <yatl-split-panel ${attrs}>
        <div slot="start">start</div>
        <div slot="end">end</div>
      </yatl-split-panel>
    </div>`;
  const el = document.querySelector<YatlSplitPanel>('yatl-split-panel')!;
  await el.updateComplete;
  return el;
}

describe('YatlSplitPanel - size changes', () => {
  test('a fixed position rendered while hidden keeps its size instead of collapsing to 0px', async () => {
    const el = await renderPanel(
      'display: none; width: 1000px',
      'size-policy="fixed" position="300" start-min="200"',
    );

    expect(splitPosition(el)).toBe('300px');
  });

  test('showing a panel that rendered while hidden applies its position', async () => {
    const el = await renderPanel(
      'display: none; width: 1000px',
      'size-policy="fixed" position="100" start-min="250"',
    );
    const container = document.getElementById('container')!;

    container.style.display = 'block';
    await afterResize(el);

    // Clamped to start-min now that there's a size to clamp against
    expect(splitPosition(el)).toBe('250px');
  });

  test('resizing re-clamps the position to the end panel minimum', async () => {
    const el = await renderPanel(
      'width: 1000px',
      'size-policy="fixed" position="600" end-min="300"',
    );
    expect(parseFloat(splitPosition(el))).toBeCloseTo(600, 0);

    document.getElementById('container')!.style.width = '700px';
    await afterResize(el);

    // The end panel keeps its 300px, so start gets what's left of 700px
    // minus the divider
    const divider = el.shadowRoot!.querySelector<HTMLElement>('.divider')!;
    expect(parseFloat(splitPosition(el))).toBeCloseTo(
      700 - divider.offsetWidth - 300,
      0,
    );
  });

  test('a ratio position is unaffected by being hidden', async () => {
    const el = await renderPanel(
      'display: none; width: 1000px',
      'position="40"',
    );
    expect(splitPosition(el)).toBe('40%');
  });
});
