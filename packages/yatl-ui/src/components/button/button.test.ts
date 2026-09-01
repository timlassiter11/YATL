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
