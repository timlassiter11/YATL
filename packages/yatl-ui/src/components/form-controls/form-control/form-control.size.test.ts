import { describe, expect, test } from 'vitest';

import '@timlassiter11/yatl/theme.css';
import '../../../index';

// Real layout with the theme loaded, since the sizes come from its tokens.

const frame = () =>
  new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

/** The height of a control's box, or of a button */
function boxHeight(el: Element) {
  const box = el.shadowRoot?.querySelector('.input') ?? el;
  return box.getBoundingClientRect().height;
}

const sizedControls: [string, string][] = [
  ['yatl-input', 'value="hello" clearable'],
  ['yatl-number-input', 'value="12"'],
  ['yatl-select', ''],
  ['yatl-time-input', 'value="14:30"'],
  ['yatl-date-input', ''],
  ['yatl-date-range-input', ''],
];

describe('size', () => {
  for (const size of ['small', 'medium', 'large']) {
    test(`a ${size} control is as tall as a ${size} button`, async () => {
      document.body.innerHTML = `
        <yatl-button size="${size}">Save</yatl-button>
        <yatl-button size="${size}" variant="outline">Cancel</yatl-button>
        <yatl-button size="${size}"><yatl-icon name="clock"></yatl-icon></yatl-button>
        ${sizedControls
          .map(([tag, attrs]) => `<${tag} size="${size}" ${attrs}></${tag}>`)
          .join('')}`;
      await frame();
      await frame();

      const [button, ...others] = document.body.children;
      const height = boxHeight(button);
      for (const el of others) {
        expect(boxHeight(el), el.localName).toBeCloseTo(height, 0);
      }
    });
  }

  test('controls get bigger with their size', async () => {
    document.body.innerHTML = `
      <yatl-input size="small"></yatl-input>
      <yatl-input></yatl-input>
      <yatl-input size="large"></yatl-input>`;
    await frame();
    const [small, medium, large] = [...document.body.children].map(boxHeight);
    expect(small).toBeLessThan(medium);
    expect(medium).toBeLessThan(large);
  });

  test('chars sets the width in characters', async () => {
    document.body.innerHTML = `
      <div style="display: flex; gap: 8px">
        <yatl-input chars="3"></yatl-input>
        <yatl-input chars="12"></yatl-input>
        <yatl-number-input chars="3"></yatl-number-input>
        <yatl-number-input chars="12"></yatl-number-input>
      </div>`;
    await frame();
    const [text3, text12, number3, number12] = [
      ...document.querySelectorAll('yatl-input, yatl-number-input'),
    ].map(el => el.getBoundingClientRect().width);
    expect(text3).toBeLessThan(text12);
    expect(number3).toBeLessThan(number12);
  });
});
