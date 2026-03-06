import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { YatlBase } from '../base/base';
import {
  YatlDropzoneDragRequest,
  YatlDropzoneDropEvent,
  YatlDropzoneDropRequest,
} from '../../events';
import { HasSlotController } from '../../utils';
import { classMap } from 'lit/directives/class-map.js';

import styles from './dropzone.styles';

export type DropzoneState = 'none' | 'valid' | 'invalid';

/**
 * @fires yatl-dropzone-drag-request - Fired when a drag operation starts anywhere in the window. Cancel to not show the hint.
 * @fires yatl-dropzone-drop-request - Fired when a drag operation enters this element. Cancel to set the state to invalid.
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
  private globalDragCounter = 0;
  private isValidDrag = false;
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
    window.addEventListener('dragstart', this.dragStart);
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
    window.removeEventListener('dragstart', this.dragStart);
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
    // Just in case
    if (this.dragCounter < 0) {
      this.dragCounter = 0;
    }

    this.dragCounter++;
    if (this.isValidDrag && this.dragCounter === 1) {
      const requestEvent = new YatlDropzoneDropRequest(
        event.dataTransfer,
        this.context,
      );
      this.dispatchEvent(requestEvent);
      this.rejectReason = requestEvent.rejectReason;
      this.isValidDrop = !requestEvent.defaultPrevented;
      this.state = this.isValidDrop ? 'valid' : 'invalid';
    }

    if (this.isValidDrop) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  private handleDragOver = (event: DragEvent) => {
    if (!this.isValidDrop) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    if (event.dataTransfer) {
      if (isValidDropEffect(event.dataTransfer.effectAllowed)) {
        event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed;
      } else {
        event.dataTransfer.dropEffect = 'copy';
      }
    }
  };

  private handleDragLeave = (event: DragEvent) => {
    if (this.isValidDrop) {
      event.stopPropagation();
    }

    this.dragCounter--;
    if (this.dragCounter === 0) {
      this.resetState();
    }
  };

  private handleDrop = (event: DragEvent) => {
    if (this.isValidDrop) {
      event.preventDefault();
      event.stopPropagation();
      this.dispatchEvent(
        new YatlDropzoneDropEvent(event.dataTransfer, this.context),
      );
    }

    this.showHint = false;
    this.resetState();
  };

  private dragStart = (event: DragEvent) => {
    let isValidDrag = this.isValidDrag;
    if (this.globalDragCounter === 0) {
      const requestEvent = new YatlDropzoneDragRequest(
        event.dataTransfer,
        this.context,
      );
      this.dispatchEvent(requestEvent);
      isValidDrag = !requestEvent.defaultPrevented;
    }

    if (event.type === 'dragstart') {
      this.globalDragCounter = 1;
    } else {
      this.globalDragCounter++;
    }

    if (!this.showHint && isValidDrag) {
      // This is a hack to fix dragging issues in Chrome.
      // Chrome doesn't like when you update things right
      // when the drag event starts so just wait...
      setTimeout(() => {
        this.isValidDrag = true;
        this.showHint = true;
      });
    }
  };

  private dragEnd = (event: DragEvent) => {
    if (event.type === 'dragend' || event.type === 'drop') {
      // Don't reset our state if this is a drop event and we are in the path.
      // The global drop event fires before the local one
      // so if we reset the state now, it won't be a valid drop.
      // Rely on our drop handler to cleanup.
      if (event.type !== 'drop' || !event.composedPath().includes(this)) {
        this.globalDragCounter = 0;
      }
    } else {
      this.globalDragCounter--;
    }

    if (this.globalDragCounter < 1) {
      this.showHint = false;
      this.isValidDrag = false;
      this.resetState();
    }
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
