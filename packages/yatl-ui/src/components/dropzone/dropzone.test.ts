import { afterEach, describe, expect, test } from 'vitest';

import '../../index';
import { YatlDropzone } from './dropzone';
import { YatlDropzoneDropRequest } from '../../events/dropzone';

async function renderDropzone(attrs = '') {
  document.body.innerHTML = `<yatl-dropzone ${attrs}>content</yatl-dropzone>`;
  const el = document.querySelector<YatlDropzone>('yatl-dropzone')!;
  await el.updateComplete;
  return el;
}

function dragEvent(type: string) {
  return new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    dataTransfer: new DataTransfer(),
  });
}

// The global dragstart/dragenter handling sets isValidDrag via a
// setTimeout(0) (a documented Chrome workaround), so a drag has to
// "start" globally and settle before the local dropzone handlers see
// isValidDrag as true.
async function startGlobalDrag() {
  window.dispatchEvent(dragEvent('dragstart'));
  await new Promise(r => setTimeout(r, 20));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('YatlDropzone - drag/drop flow', () => {
  test('a valid drop request transitions to the valid state', async () => {
    const el = await renderDropzone();
    await startGlobalDrag();

    el.dispatchEvent(dragEvent('dragenter'));

    expect(el.state).toBe('valid');
  });

  test('rejecting the drop request transitions to invalid with the reject reason', async () => {
    const el = await renderDropzone();
    el.addEventListener(
      'yatl-dropzone-drop-request',
      (event: YatlDropzoneDropRequest) => event.reject('wrong file type'),
    );
    await startGlobalDrag();

    el.dispatchEvent(dragEvent('dragenter'));

    expect(el.state).toBe('invalid');
  });

  test('a valid drop fires yatl-dropzone-drop and resets state', async () => {
    const el = await renderDropzone();
    let dropCount = 0;
    el.addEventListener('yatl-dropzone-drop', () => dropCount++);
    await startGlobalDrag();

    el.dispatchEvent(dragEvent('dragenter'));
    expect(el.state).toBe('valid');

    el.dispatchEvent(dragEvent('drop'));

    expect(dropCount).toBe(1);
    expect(el.state).toBe('none');
  });

  test('leaving the dropzone without dropping resets state', async () => {
    const el = await renderDropzone();
    await startGlobalDrag();

    el.dispatchEvent(dragEvent('dragenter'));
    expect(el.state).toBe('valid');

    el.dispatchEvent(dragEvent('dragleave'));

    expect(el.state).toBe('none');
  });

  test('nested dragenter/dragleave pairs do not prematurely reset state', async () => {
    const el = await renderDropzone();
    await startGlobalDrag();

    // Entering the dropzone, then a nested child within it.
    el.dispatchEvent(dragEvent('dragenter'));
    el.dispatchEvent(dragEvent('dragenter'));
    expect(el.state).toBe('valid');

    // Leaving the nested child back into the dropzone itself - still
    // within bounds, should not reset.
    el.dispatchEvent(dragEvent('dragleave'));
    expect(el.state).toBe('valid');

    // Leaving the dropzone entirely.
    el.dispatchEvent(dragEvent('dragleave'));
    expect(el.state).toBe('none');
  });
});

describe('YatlDropzone - global drag request', () => {
  test('rejecting the global drag request never shows the hint or accepts drops', async () => {
    const el = await renderDropzone();
    el.addEventListener('yatl-dropzone-drag-request', event =>
      event.preventDefault(),
    );

    await startGlobalDrag();
    expect(el.showHint).toBe(false);

    el.dispatchEvent(dragEvent('dragenter'));
    expect(el.state).toBe('none');
  });
});
