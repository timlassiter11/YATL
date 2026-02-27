import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import { YatlDropzoneDropEvent, YatlDropzoneDropRequest } from '../../events';

import styles from './dropzone.styles';

export type DropzoneState = 'none' | 'valid' | 'invalid';

/**
 * @fires yatl-dropzone-drop-request - Fired when a drag operation enters this element. Cancellable.
 * @fires yatl-dropzone-drop - Fired when an item is dropped on this element.
 */
@customElement('yatl-dropzone')
export class YatlDropzone extends YatlBase {
  public static override styles = [...super.styles, styles];

  private dragCounter = 0;
  private isValidDrop = false;
  private target?: HTMLElement;

  @property({ type: String, reflect: true })
  public state: DropzoneState = 'none';

  @property({ type: Boolean, reflect: true, attribute: 'show-hint' })
  public showHint = false;

  @property({ attribute: false })
  public context: unknown;

  public override connectedCallback() {
    super.connectedCallback();
    const capture = true;
    // Covers a drag starting anywhere in the window
    window.addEventListener('dragstart', this.dragStart, { capture });
    // Covers a drag started outside the window
    window.addEventListener('dragenter', this.dragStart, { capture });
    window.addEventListener('dragleave', this.dragEnd, { capture });
    window.addEventListener('dragend', this.dragEnd, { capture });
    window.addEventListener('drop', this.dragEnd, { capture });

    queueMicrotask(() => {
      if (this.parentElement) {
        this.target = this.parentElement;
      } else {
        const root = this.getRootNode() as ShadowRoot;
        this.target = root.host as HTMLElement;
      }

      this.target.addEventListener('dragenter', this.handleDragEnter);
      this.target.addEventListener('dragleave', this.handleDragLeave);
      this.target.addEventListener('dragover', this.handleDragOver);
      this.target.addEventListener('drop', this.handleDrop);
    });
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();

    const capture = true;
    window.removeEventListener('dragstart', this.dragStart, { capture });
    window.removeEventListener('dragenter', this.dragStart, { capture });
    window.removeEventListener('dragleave', this.dragEnd, { capture });
    window.removeEventListener('dragend', this.dragEnd, { capture });
    window.removeEventListener('drop', this.dragEnd, { capture });

    if (this.target) {
      this.target.removeEventListener('dragenter', this.handleDragEnter);
      this.target.removeEventListener('dragleave', this.handleDragLeave);
      this.target.removeEventListener('dragover', this.handleDragOver);
      this.target.removeEventListener('drop', this.handleDrop);
    }
  }

  private handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    this.dragCounter++;
    if (this.dragCounter === 1) {
      const requestEvent = new YatlDropzoneDropRequest(
        event.dataTransfer,
        this.target!,
        this.context,
      );
      this.dispatchEvent(requestEvent);
      this.isValidDrop = !requestEvent.defaultPrevented;
      this.state = this.isValidDrop ? 'valid' : 'invalid';
    }
  };

  private handleDragOver = (event: DragEvent) => {
    event.stopPropagation();

    if (!this.isValidDrop) {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }
      return;
    }

    event.preventDefault();
    if (
      event.dataTransfer &&
      isValidDropEffect(event.dataTransfer.effectAllowed)
    ) {
      event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed;
    }
  };

  private handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    this.dragCounter--;
    if (this.dragCounter === 0) {
      this.isValidDrop = false;
      this.state = 'none';
    }
  };

  private handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounter = 0;
    this.state = 'none';
    this.showHint = false;
    this.dispatchEvent(
      new YatlDropzoneDropEvent(event.dataTransfer, this.target!, this.context),
    );
  };

  private dragStart = () => {
    this.showHint = true;
  };

  private dragEnd = () => {
    this.state = 'none';
    this.showHint = false;
  };

  protected override render() {
    return html`<div part="contents"><slot></slot></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-dropzone': YatlDropzone;
  }
}

type DropEffect = 'copy' | 'link' | 'move';

function isValidDropEffect(effect: string): effect is DropEffect {
  return effect === 'copy' || effect === 'link' || effect === 'move';
}
