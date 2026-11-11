import { afterEach, describe, expect, test } from 'vitest';

import '../../index';
import { YatlButton } from './button';

async function renderButton(attrs = '') {
  document.body.innerHTML = `<yatl-button ${attrs}>Click me</yatl-button>`;
  const el = document.querySelector<YatlButton>('yatl-button')!;
  await el.updateComplete;
  return el;
}

function click(el: YatlButton) {
  el.shadowRoot!.querySelector('button')!.click();
}

describe('YatlButton - action state transitions', () => {
  test('a synchronous action goes straight to success', async () => {
    const el = await renderButton();
    let called = false;
    el.action = () => {
      called = true;
    };

    click(el);
    await el.updateComplete;

    expect(called).toBe(true);
    expect(el.state).toBe('success');
  });

  test('an async action shows loading then success', async () => {
    const el = await renderButton();
    let resolveAction!: () => void;
    el.action = () => new Promise<void>(r => (resolveAction = r));

    click(el);
    await el.updateComplete;
    expect(el.state).toBe('loading');

    resolveAction();
    await new Promise(r => setTimeout(r, 0));
    await el.updateComplete;

    expect(el.state).toBe('success');
  });

  test('a rejecting async action shows an error state', async () => {
    const preventUnhandled = (e: PromiseRejectionEvent) => e.preventDefault();
    window.addEventListener('unhandledrejection', preventUnhandled);

    const el = await renderButton();
    el.action = () => Promise.reject(new Error('nope'));

    click(el);
    await new Promise(r => setTimeout(r, 20));
    await el.updateComplete;

    expect(el.state).toBe('error');

    window.removeEventListener('unhandledrejection', preventUnhandled);
  });

  test('disabled prevents the action from running', async () => {
    const el = await renderButton('disabled');
    let called = false;
    el.action = () => {
      called = true;
    };

    click(el);
    await el.updateComplete;

    expect(called).toBe(false);
    expect(el.state).toBe('idle');
  });
});

describe('YatlButton - form association', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('type="reset" resets the owning form', async () => {
    document.body.innerHTML = `
      <form>
        <input name="text" value="original" />
        <yatl-button type="reset">Reset</yatl-button>
      </form>
    `;
    const form = document.querySelector('form')!;
    const input = form.querySelector('input')!;
    const btn = form.querySelector<YatlButton>('yatl-button')!;
    await btn.updateComplete;

    input.value = 'changed';
    click(btn);

    expect(input.value).toBe('original');
  });

  test('type="submit" submits the owning form', async () => {
    document.body.innerHTML = `
      <form>
        <yatl-button type="submit">Submit</yatl-button>
      </form>
    `;
    const form = document.querySelector('form')!;
    const btn = form.querySelector<YatlButton>('yatl-button')!;
    await btn.updateComplete;

    let submitted = false;
    form.addEventListener('submit', e => {
      e.preventDefault();
      submitted = true;
    });

    click(btn);

    expect(submitted).toBe(true);
  });
});

describe('YatlButton - size and variant styles', () => {
  async function renderStyled(inner: string, attrs = '') {
    // Tests run without a theme, so set the tokens these styles use
    document.body.innerHTML = `<yatl-button style="--yatl-spacing-xs: 4px; --yatl-color-neutral: gray" ${attrs}>${inner}</yatl-button>`;
    const el = document.querySelector<YatlButton>('yatl-button')!;
    await el.updateComplete;
    await new Promise(resolve => setTimeout(resolve));
    return el;
  }

  function padding(el: YatlButton) {
    const style = getComputedStyle(el.shadowRoot!.querySelector('button')!);
    return [style.paddingTop, style.paddingLeft];
  }

  test('text gets more padding at the sides than above and below', async () => {
    const el = await renderStyled('Save', 'size="small"');
    expect(padding(el)).toEqual(['4px', '10px']);
    expect(el.matches(':state(icon-only)')).toBe(false);
  });

  test('an icon on its own gets the same padding all round', async () => {
    const el = await renderStyled(
      ' <yatl-icon name="close"></yatl-icon> ',
      'size="small"',
    );
    expect(el.matches(':state(icon-only)')).toBe(true);
    expect(padding(el)).toEqual(['4px', '4px']);
  });

  test('an icon with text is not icon only', async () => {
    const el = await renderStyled('<yatl-icon name="close"></yatl-icon> Close');
    expect(el.matches(':state(icon-only)')).toBe(false);
  });

  test('the icon property on its own is icon only', async () => {
    const el = await renderStyled('', 'size="small" icon="close"');
    expect(
      el.shadowRoot!.querySelector('yatl-icon')!.getAttribute('name'),
    ).toBe('close');
    expect(el.matches(':state(icon-only)')).toBe(true);
    expect(padding(el)).toEqual(['4px', '4px']);

    // Adding text, or removing the icon, makes it a text button again
    el.append('Close');
    await new Promise(resolve => setTimeout(resolve));
    expect(el.matches(':state(icon-only)')).toBe(false);
    el.textContent = '';
    el.icon = '';
    await el.updateComplete;
    expect(el.matches(':state(icon-only)')).toBe(false);
  });

  test('the icon property goes before or after the text', async () => {
    const el = await renderStyled('Save', 'icon="clock" icon-position="end"');
    const contents = el.shadowRoot!.querySelector('[part="contents"]')!;
    const order = [...contents.children].map(c =>
      c.localName === 'slot'
        ? c.getAttribute('name') ?? 'default'
        : c.localName,
    );
    expect(order).toEqual(['start', 'default', 'yatl-icon', 'end']);
    expect(el.matches(':state(icon-only)')).toBe(false);
  });

  test('an icon in the start slot with no text is icon only', async () => {
    const el = await renderStyled(
      '<yatl-icon slot="start" name="close"></yatl-icon>',
    );
    expect(el.matches(':state(icon-only)')).toBe(true);
  });

  test('the outline variant has a visible border, others a clear one', async () => {
    const el = await renderStyled('Cancel', 'variant="outline"');
    expect(getComputedStyle(el).borderTopWidth).toBe('1px');
    expect(getComputedStyle(el).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');

    // The clear border keeps every variant the same height
    const plain = await renderStyled('Cancel', 'variant="plain"');
    expect(getComputedStyle(plain).borderTopWidth).toBe('1px');
    expect(getComputedStyle(plain).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  });
});
