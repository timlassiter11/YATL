import { html, nothing, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { YatlFormControl } from '../form-control/form-control';
import type { YatlSize } from '../../../types';

import styles from './segmented-field.styles';

/** One typed part of a segmented field, e.g. a date's month. */
export interface FieldSegment {
  /** Unique within the field, e.g. "month" */
  key: string;
  /** For screen readers, e.g. "Month" */
  label: string;
  /** Shown while it's empty, e.g. "mm" */
  placeholder: string;
  min: number;
  max: number;
  /** How many digits can be typed before moving to the next segment */
  digits: number;
  /** How far the arrow keys move it. Defaults to 1. */
  step?: number;
  /** The text shown for a value. Defaults to the number padded to `digits`. */
  format?: (value: number) => string;
  /**
   * Letter keys that set it, for text segments like AM/PM,
   * e.g. `{ a: 0, p: 1 }`. Digits are ignored when set.
   */
  letters?: Record<string, number>;
}

/** A segment, or text between segments like "/" or ":" */
export type FieldPart =
  | { type: 'segment'; segment: FieldSegment }
  | { type: 'literal'; text: string };

/** Each segment's value by key. null while it's empty. */
export type SegmentValues = Record<string, number | null>;

/** Keys that move to the next segment, like typing the separator */
const SEPARATORS = new Set(['/', '-', '.', ':', ' ', ',']);

/**
 * Base for inputs typed in parts, like a date (month / day / year) or a
 * time (hour : minute AM). Each part is a spin button: type digits (the
 * next part gets focus once it's full), use the arrow keys to change it,
 * Backspace to clear it, and Left/Right or the separator key to move.
 *
 * Subclasses list their parts and convert between them and `value`. The
 * value is only set once every part is filled in and they make a real
 * value; until then it's empty and the field reports `badInput`.
 *
 * Fires `input` on every edit and `change` when focus leaves the field
 * with a different value than it had.
 */
export abstract class YatlSegmentedField<TData> extends YatlFormControl<TData> {
  public static override styles = [...super.styles, styles];

  /**
   * The size of the control. A control and a button of the same size are
   * the same height.
   * @attr size
   */
  @property({ type: String, reflect: true })
  public size: YatlSize = 'medium';

  /**
   * Shown instead of the empty parts when there's no value and the field
   * isn't focused, or is read-only. When empty, the parts' own hints
   * (e.g. "mm/dd/yyyy") show instead.
   * @attr placeholder
   */
  @property({ type: String })
  public placeholder = '';

  /**
   * The message when some parts are filled in but not all.
   * @attr incomplete-text
   */
  @property({ type: String, attribute: 'incomplete-text' })
  public incompleteText = 'Fill in every part';

  /**
   * The message when every part is filled in but they don't make a real
   * value, e.g. February 30.
   * @attr invalid-text
   */
  @property({ type: String, attribute: 'invalid-text' })
  public invalidText = 'Not a valid value';

  @state() protected segmentValues: SegmentValues = {};
  @state() private focused = false;

  /** Digits typed into the focused segment so far */
  private typed = '';
  /** Set while `value` changes because of typing, so the segments keep
   * what was typed instead of being rebuilt from the value */
  private fromSegments = false;
  /** The value when focus came in, to fire `change` when it leaves */
  private valueOnFocus: string | null = null;

  constructor() {
    super();
    this.addEventListener('focusin', this.handleFocusIn);
    this.addEventListener('focusout', this.handleFocusOut);
  }

  /** The parts in display order */
  protected abstract get parts(): FieldPart[];

  /** Splits a value into segment values. Empty segments are null. */
  protected abstract toSegments(value: TData | undefined): SegmentValues;

  /**
   * Builds the value from filled-in segments, or undefined when they don't
   * make one (e.g. February 30).
   */
  protected abstract fromSegmentValues(
    values: Record<string, number>,
  ): TData | undefined;

  /** The empty value, e.g. undefined or "" */
  protected abstract get emptyValue(): TData | undefined;

  /** Compares values, e.g. by their form value */
  protected abstract valueKey(value: TData | undefined): string | null;

  protected get segments(): FieldSegment[] {
    return this.parts.flatMap(part =>
      part.type === 'segment' ? [part.segment] : [],
    );
  }

  /** How many segments have a value */
  protected get filledCount() {
    return this.segments.filter(s => this.segmentValues[s.key] != null).length;
  }

  /**
   * The value segments make, and what's wrong with them if anything:
   * "incomplete" when only some are filled in, "invalid" when they're all
   * filled in but don't make a value. By default the field is all or
   * nothing. Override it for fields with optional groups, like a range
   * with an open end.
   */
  protected resolveSegments(values: SegmentValues): {
    value: TData | undefined;
    problem?: 'incomplete' | 'invalid';
  } {
    const segments = this.segments;
    const filled = segments.filter(s => values[s.key] != null).length;
    if (filled === 0) {
      return { value: this.emptyValue };
    }
    if (filled < segments.length) {
      return { value: this.emptyValue, problem: 'incomplete' };
    }
    const value = this.fromSegmentValues(values as Record<string, number>);
    return value === undefined
      ? { value: this.emptyValue, problem: 'invalid' }
      : { value };
  }

  protected override willUpdate(changedProps: PropertyValues<this>) {
    super.willUpdate(changedProps);
    // Rebuild the segments when the value is set from outside (or first
    // rendered), not when typing set it
    if (changedProps.has('value') || !this.hasUpdated) {
      if (!this.fromSegments) {
        this.segmentValues = this.toSegments(this.value);
      }
      this.fromSegments = false;
    }
  }

  protected override renderInput() {
    const empty = this.filledCount === 0;
    const showPlaceholder =
      empty &&
      (this.readonly || this.isDisabled || (!this.focused && this.placeholder));

    if (showPlaceholder) {
      return html`<div
        id=${this.inputId}
        part="segments"
        class="segments has-placeholder"
        tabindex=${this.readonly || this.isDisabled ? -1 : 0}
        @focus=${this.handlePlaceholderFocus}
      >
        ${this.placeholder}
      </div>`;
    }

    return html`
      <div
        id=${this.inputId}
        part="segments"
        class="segments"
        role="group"
        aria-label=${this.label || nothing}
      >
        ${this.parts.map(part =>
          part.type === 'literal'
            ? html`<span part="literal" class="literal" aria-hidden="true"
                >${part.text}</span
              >`
            : this.renderSegment(part.segment),
        )}
      </div>
    `;
  }

  private renderSegment(segment: FieldSegment) {
    const value = this.segmentValues[segment.key];
    const text =
      value == null ? segment.placeholder : this.formatSegment(segment, value);
    const editable = !this.readonly && !this.isDisabled;
    return html`<span
      part="segment"
      class=${classMap({ segment: true, empty: value == null })}
      data-key=${segment.key}
      role="spinbutton"
      tabindex=${editable ? 0 : -1}
      inputmode=${segment.letters ? 'text' : 'numeric'}
      aria-label=${segment.label}
      aria-valuemin=${segment.min}
      aria-valuemax=${segment.max}
      aria-valuenow=${value ?? nothing}
      aria-valuetext=${value == null ? 'Empty' : text}
      aria-readonly=${this.readonly ? 'true' : nothing}
      aria-disabled=${this.isDisabled ? 'true' : nothing}
      @keydown=${(event: KeyboardEvent) =>
        this.handleSegmentKeyDown(event, segment)}
      @focus=${this.handleSegmentFocus}
      >${text}</span
    >`;
  }

  protected formatSegment(segment: FieldSegment, value: number) {
    return segment.format
      ? segment.format(value)
      : String(value).padStart(segment.digits, '0');
  }

  // #region Editing

  /** Sets one segment and updates the value, as if the user typed it */
  protected setSegment(key: string, value: number | null) {
    this.segmentValues = { ...this.segmentValues, [key]: value };
    this.commitSegments();
  }

  /** Sets every segment from a value and fires input, e.g. from a picker */
  protected setFromPicker(value: TData | undefined) {
    this.segmentValues = this.toSegments(value);
    this.commitSegments();
  }

  private commitSegments() {
    const { value } = this.resolveSegments(this.segmentValues);
    if (this.valueKey(value) !== this.valueKey(this.value)) {
      this.fromSegments = true;
      this.value = value;
    }
    this.emitInteraction('input');
  }

  private handleSegmentKeyDown(event: KeyboardEvent, segment: FieldSegment) {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const target = event.currentTarget as HTMLElement;
    const editable = !this.readonly && !this.isDisabled;
    const value = this.segmentValues[segment.key] ?? null;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.focusSibling(target, -1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.focusSibling(target, 1);
        return;
      case 'Tab':
        return;
      case 'Enter':
        // Commit and submit like a native input does
        this.commitIfChanged();
        this.form?.requestSubmit();
        return;
    }

    if (!editable) {
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.typed = '';
      this.setSegment(
        segment.key,
        this.stepSegment(segment, value, event.key === 'ArrowUp' ? 1 : -1),
      );
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.typed = '';
      this.setSegment(
        segment.key,
        event.key === 'Home' ? segment.min : segment.max,
      );
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      if (this.typed.length > 1) {
        this.typed = this.typed.slice(0, -1);
        this.setSegment(segment.key, Number(this.typed));
      } else if (value == null && event.key === 'Backspace') {
        // Already empty, so go back like a text field
        this.focusSibling(target, -1);
      } else {
        this.typed = '';
        this.setSegment(segment.key, null);
      }
    } else if (segment.letters) {
      const letter = event.key.toLowerCase();
      if (letter in segment.letters) {
        event.preventDefault();
        this.setSegment(segment.key, segment.letters[letter]);
        this.focusSibling(target, 1);
      }
    } else if (/^\d$/.test(event.key)) {
      event.preventDefault();
      this.typeDigit(target, segment, event.key);
    } else if (SEPARATORS.has(event.key)) {
      event.preventDefault();
      if (value != null) {
        this.focusSibling(target, 1);
      }
    }
  }

  /**
   * Adds a digit to what's been typed into the segment. Moves on once no
   * more digits could fit, e.g. after "1" then "2" for a month, or right
   * away after "4" since no month is 40-something.
   */
  private typeDigit(target: HTMLElement, segment: FieldSegment, digit: string) {
    let typed = this.typed + digit;
    if (typed.length > segment.digits || Number(typed) > segment.max) {
      // Doesn't fit, so start over with this digit
      typed = digit;
    }
    this.typed = typed;
    this.setSegment(segment.key, Number(typed));

    const full =
      typed.length >= segment.digits || Number(typed + '0') > segment.max;
    if (full) {
      this.focusSibling(target, 1);
    }
  }

  /** The value one step up or down, wrapping around at min and max */
  protected stepSegment(
    segment: FieldSegment,
    value: number | null,
    direction: 1 | -1,
  ) {
    const step = segment.step ?? 1;
    if (value == null) {
      return direction > 0 ? segment.min : this.lastStep(segment);
    }
    // An off-step value goes to the nearest step in that direction first,
    // so 07 with a 5 step goes up to 10 (not 12) or down to 05
    const offset = (value - segment.min) / step;
    const snapped =
      (direction > 0 ? Math.ceil(offset) : Math.floor(offset)) * step +
      segment.min;
    const next = snapped === value ? value + step * direction : snapped;
    if (next > segment.max) return segment.min;
    if (next < segment.min) return this.lastStep(segment);
    return next;
  }

  /** The largest value on the segment's step, e.g. 55 for 5 minute steps */
  private lastStep(segment: FieldSegment) {
    const step = segment.step ?? 1;
    return segment.min + Math.floor((segment.max - segment.min) / step) * step;
  }

  // #endregion
  // #region Focus

  private get segmentElements() {
    return [
      ...(this.renderRoot.querySelectorAll<HTMLElement>('[part="segment"]') ??
        []),
    ];
  }

  private focusSibling(from: HTMLElement, offset: 1 | -1) {
    const elements = this.segmentElements;
    const next = elements[elements.indexOf(from) + offset];
    next?.focus();
  }

  /** Focuses the first segment, e.g. after clicking the field */
  public override focus(options?: FocusOptions) {
    const first = this.segmentElements[0];
    if (first) {
      first.focus(options);
    } else {
      super.focus(options);
    }
  }

  private handleSegmentFocus() {
    this.typed = '';
  }

  private async handlePlaceholderFocus() {
    // Swap the placeholder for the parts and put focus in the first one
    this.focused = true;
    await this.updateComplete;
    this.segmentElements[0]?.focus();
  }

  /** Whether focus is anywhere in the control, e.g. its picker button */
  private focusWithin = false;

  /*
   * Focus is tracked on the host, so moving between the parts, the picker
   * button and an open picker is all "inside" (the browser doesn't even
   * fire these on the host for moves within the shadow root). Only
   * leaving the whole control fires change.
   */
  private handleFocusIn = () => {
    this.focused = true;
    if (!this.focusWithin) {
      this.focusWithin = true;
      this.valueOnFocus = this.valueKey(this.value);
    }
  };

  private handleFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && (next === this || this.contains(next))) {
      return;
    }
    this.focusWithin = false;
    this.focused = false;
    this.typed = '';
    this.commitIfChanged();
  };

  /** Fires change if the value differs from when it was last committed */
  private commitIfChanged() {
    if (this.valueKey(this.value) !== this.valueOnFocus) {
      this.commitChange();
    }
  }

  /**
   * Fires change for a value set by a picker. Typing fires it when focus
   * leaves, or on Enter, instead.
   */
  protected commitChange() {
    this.valueOnFocus = this.valueKey(this.value);
    this.emitInteraction('change');
  }

  // #endregion
  // #region Validity

  protected override onFormReset() {
    super.onFormReset();
    this.segmentValues = this.toSegments(this.value);
    this.typed = '';
  }

  protected override updateValidity() {
    if (!this.errorText) {
      const { problem } = this.resolveSegments(this.segmentValues);
      if (problem) {
        this.setValidity(
          { badInput: true },
          problem === 'incomplete' ? this.incompleteText : this.invalidText,
        );
        return;
      }
    }

    super.updateValidity();
    if (!this.errorText && this.validity.valid) {
      this.updateValueValidity();
    }
  }

  /**
   * Checks a complete value, e.g. against min and max. Call setValidity()
   * for a problem. The value is otherwise valid when this runs.
   */
  protected updateValueValidity() {}

  // #endregion
}
