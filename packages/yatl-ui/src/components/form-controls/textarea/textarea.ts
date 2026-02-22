import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { YatlFormControl } from '../form-control/form-control';
import { live } from 'lit/directives/live.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import styles from './textarea.styles';

@customElement('yatl-textarea')
export class YatlTextArea extends YatlFormControl {
  public static override styles = [...super.styles, styles];

  @property({ type: Number })
  public rows?: number;

  @property({ type: String })
  public placeholder = '';

  @property({ type: Number })
  public minlength?: number;

  @property({ type: Number })
  public maxlength?: number;

  @property({ type: String, attribute: 'value' })
  public defaultValue = '';

  @property({ attribute: false })
  public value = '';

  public get formValue() {
    return this.value;
  }

  protected override render() {
    return html`
      ${this.renderLabel()}
      <div part="base">${this.renderInput()}</div>
      ${this.renderHint()} ${this.renderErrorText()}
    `;
  }

  protected override renderInput() {
    return html`
      <textarea
        part="input"
        class="text-input"
        id=${this.inputId}
        name=${this.name}
        placeholder=${this.placeholder}
        minlength=${ifDefined(this.minlength)}
        maxlength=${ifDefined(this.maxlength)}
        rows=${ifDefined(this.rows)}
        .value=${live(this.value)}
        ?readonly=${this.readonly}
        ?disabled=${this.disabled}
        ?required=${this.required}
      ></textarea>
    `;
  }

  protected override isValidChangeEvent(event: Event): boolean | void {
    this.value = (event.target as HTMLTextAreaElement).value;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-textarea': YatlTextArea;
  }
}
