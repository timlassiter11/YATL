import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import { YatlDropzoneDropEvent, YatlDropzoneDropRequest } from '../../events';

import styles from './dropzone.styles';
import { HasSlotController } from '../../utils';
import { classMap } from 'lit/directives/class-map.js';

export type DropzoneState = 'none' | 'valid' | 'invalid';

/**
 * @fires yatl-dropzone-drop-request - Fired when a drag operation enters this element. Cancellable.
 * @fires yatl-dropzone-drop - Fired when an item is dropped on this element.
 */
@customElement('yatl-dropzone')
export class YatlDropzone extends YatlBase {
  public static override styles = [...super.styles, styles];

  private slotController = new HasSlotController(
    this,
    '[default]',
    'hint',
    'valid',
    'invalid',
  );

  private dragCounter = 0;
  private isValidDrop = false;
  @state() private rejectReason?: string;

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

    this.addEventListener('dragenter', this.handleDragEnter);
    this.addEventListener('dragleave', this.handleDragLeave);
    this.addEventListener('dragover', this.handleDragOver);
    this.addEventListener('drop', this.handleDrop);
  }

  public override disconnectedCallback() {
    super.disconnectedCallback();

    const capture = true;
    window.removeEventListener('dragstart', this.dragStart, { capture });
    window.removeEventListener('dragenter', this.dragStart, { capture });
    window.removeEventListener('dragleave', this.dragEnd, { capture });
    window.removeEventListener('dragend', this.dragEnd, { capture });
    window.removeEventListener('drop', this.dragEnd, { capture });

    this.removeEventListener('dragenter', this.handleDragEnter);
    this.removeEventListener('dragleave', this.handleDragLeave);
    this.removeEventListener('dragover', this.handleDragOver);
    this.removeEventListener('drop', this.handleDrop);
  }

  private handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    this.dragCounter++;
    if (this.dragCounter === 1) {
      const requestEvent = new YatlDropzoneDropRequest(
        event.dataTransfer,
        this.context,
      );
      this.dispatchEvent(requestEvent);
      this.rejectReason = requestEvent.rejectReason;
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
      this.resetState();
    }
  };

  private handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    this.showHint = false;
    this.resetState();

    this.dispatchEvent(
      new YatlDropzoneDropEvent(event.dataTransfer, this.context),
    );
  };

  private dragStart = () => {
    this.showHint = true;
  };

  private dragEnd = () => {
    this.showHint = false;
    this.resetState();
  };

  private resetState() {
    this.dragCounter = 0;
    this.state = 'none';
    this.rejectReason = undefined;
    this.isValidDrop = false;
  }

  protected override render() {
    const hasDefault = this.slotController.test(null);
    const hasHint = this.slotController.test('hint');
    const hasValid = this.slotController.test('valid');
    const hasInvalid = this.slotController.test('invalid');

    const classes = {
      'has-default': hasDefault,
      'has-hint': hasHint,
      'has-valid': hasValid,
      'has-invalid': hasInvalid || !!this.rejectReason,
    };

    return html`
      <div part="contents" class=${classMap(classes)}>
        <slot></slot>
        <slot name="hint"></slot>
        <slot name="valid"></slot>
        <slot name="invalid"
          >${this.rejectReason ? this.rejectReason : nothing}</slot
        >
      </div>
    `;
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
