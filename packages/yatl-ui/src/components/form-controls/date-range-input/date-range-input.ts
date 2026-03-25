import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { dateConverter, getDateOnly } from '../../../utils';
import { YatlDateRangePicker } from '../../date-range-picker/date-range-picker';
import { YatlDropdown } from '../../dropdown/dropdown';
import { YatlFormControl } from '../form-control/form-control';
import styles from './date-range-input.styles';

const dayFormatter = Intl.DateTimeFormat(undefined, { dateStyle: 'short' });

export interface YatlDateRange {
  start?: Date;
  end?: Date;
}

@customElement('yatl-date-range-input')
export class YatlDateRangeInput extends YatlFormControl<YatlDateRange> {
  public static override styles = [...super.styles, styles];

  @state() private startDateDraft?: Date;
  @state() private endDateDraft?: Date;

  @state() private open = false;

  @property({ type: String })
  public placeholder = '';

  @property({ type: Number })
  public size?: number;

  @property({ converter: dateConverter, reflect: true })
  public min?: Date;

  @property({ converter: dateConverter, reflect: true })
  public max?: Date;

  @property({ converter: dateConverter, attribute: 'start-date' })
  public startDate?: Date;

  @property({ converter: dateConverter, attribute: 'end-date' })
  public endDate?: Date;

  @property({ attribute: false })
  public defaultValue: YatlDateRange = {
    start: dateConverter.fromAttribute(this.getAttribute('start-date') ?? ''),
    end: dateConverter.fromAttribute(this.getAttribute('end-date') ?? ''),
  };

  public get value(): YatlDateRange {
    return { start: this.startDate, end: this.endDate };
  }

  @property({ attribute: false })
  public set value(value) {
    const { start, end } = value;
    this.startDate = start;
    this.endDate = end;
  }

  public get formValue() {
    // TODO: Set form data
    const data = new FormData();
    return data;
  }

  protected override render() {
    return html`
      <yatl-dropdown
        .open=${live(this.open)}
        @yatl-dropdown-open=${this.handleDropdownToggle}
        @yatl-dropdown-close=${this.handleDropdownToggle}
      >
        ${this.renderInput()}
        <div class="column">
          <yatl-date-range-picker
            .startDate=${this.startDateDraft}
            .endDate=${this.endDateDraft}
            @change=${this.handleDatePickerChange}
          ></yatl-date-range-picker>
          <div class="footer">
            <yatl-button
              variant="plain"
              color="danger"
              size="small"
              title="Clear dates"
              @click=${this.handleClearClick}
              >Clear</yatl-button
            >
            <div class="spacer"></div>
            <yatl-button
              variant="plain"
              color="muted"
              size="small"
              title="Cancel"
              @click=${this.handleCancelClick}
              >Cancel</yatl-button
            >
            <yatl-button
              variant="neutral"
              color="brand"
              size="small"
              title="Apply"
              ?disabled=${!this.startDateDraft}
              @click=${this.handleApplyClick}
              >Apply</yatl-button
            >
          </div>
        </div>
      </yatl-dropdown>
    `;
  }

  protected override renderInput() {
    const startText = this.startDate
      ? dayFormatter.format(this.startDate)
      : 'From';
    const endText = this.endDate ? dayFormatter.format(this.endDate) : 'To';
    return html`
      <yatl-input
        part="input"
        slot="trigger"
        label=${this.label}
        value="-"
        readonly
      >
        <span slot="start">${startText}</span>
        <span slot="end">${endText}</span>
      </yatl-input>
    `;
  }

  private handleClearClick() {
    this.formResetCallback();
    this.open = false;
    this.dispatchEvent(new Event('change'));
  }

  private handleCancelClick() {
    this.open = false;
  }

  private handleApplyClick() {
    this.startDate = this.startDateDraft;
    this.endDate = this.endDateDraft;
    this.open = false;
    this.dispatchEvent(new Event('change'));
  }

  private handleDatePickerChange(event: Event) {
    event.stopPropagation();
    const target = event.target as YatlDateRangePicker;
    this.startDateDraft = target.startDate;
    this.endDateDraft = target.endDate;
  }

  private handleDropdownToggle(event: Event) {
    const target = event.target as YatlDropdown;
    this.open = target.open;

    if (this.open) {
      this.startDateDraft = this.startDate
        ? getDateOnly(this.startDate)
        : undefined;
      this.endDateDraft = this.endDate ? getDateOnly(this.endDate) : undefined;
    }
  }

  protected override onFormReset(): void {
    if (this.defaultValue) {
      this.value = this.defaultValue;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yatl-date-range-input': YatlDateRangeInput;
  }
}
