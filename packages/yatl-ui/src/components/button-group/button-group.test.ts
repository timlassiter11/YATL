import { describe, expect, test } from 'vitest';

import '../../index';
import { YatlButtonGroup } from './button-group';
import { YatlButton } from '../button/button';

async function renderGroup(inner: string, attrs = '') {
  document.body.innerHTML = `<yatl-button-group ${attrs}>${inner}</yatl-button-group>`;
  const el = document.querySelector<YatlButtonGroup>('yatl-button-group')!;
  await el.updateComplete;
  return el;
}

describe('YatlButtonGroup - child positioning', () => {
  test('marks first/middle/last for three or more children', async () => {
    const el = await renderGroup(
      '<yatl-button>A</yatl-button><yatl-button>B</yatl-button><yatl-button>C</yatl-button>',
    );
    const buttons = [...el.querySelectorAll('yatl-button')];

    expect(buttons.map(b => b.getAttribute('data-group-position'))).toEqual([
      'first',
      'middle',
      'last',
    ]);
  });

  test('marks a single child as "single"', async () => {
    const el = await renderGroup('<yatl-button>A</yatl-button>');
    const button = el.querySelector('yatl-button')!;

    expect(button.getAttribute('data-group-position')).toBe('single');
  });
});

describe('YatlButtonGroup - disabled propagation', () => {
  test('disabled propagates to all children', async () => {
    const el = await renderGroup(
      '<yatl-button>A</yatl-button><yatl-button>B</yatl-button>',
      'disabled',
    );
    const buttons = [...el.querySelectorAll('yatl-button')] as YatlButton[];

    expect(buttons.every(b => b.disabled)).toBe(true);
  });

  test('leaving disabled unset does not touch children own disabled state', async () => {
    const el = await renderGroup(
      '<yatl-button disabled>A</yatl-button><yatl-button>B</yatl-button>',
    );
    const [a, b] = [...el.querySelectorAll('yatl-button')] as YatlButton[];

    expect(a.disabled).toBe(true);
    expect(b.disabled).toBe(false);
  });
});
