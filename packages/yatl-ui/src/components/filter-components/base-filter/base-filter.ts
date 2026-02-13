import { consume } from '@lit/context';
import { PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { tableContext } from '../../../context';
import {
  getNestedValue,
  setNestedValue,
  YatlTableController,
} from '@timlassiter11/yatl';
import { YatlBase } from '../../base/base';

export class YatlBaseFilter<T> extends YatlBase {
  private _filterOptions?: Map<T, number>;

  private _controller?: YatlTableController;
  @consume({ context: tableContext, subscribe: true })
  @property({ attribute: false })
  public get controller() {
    return this._controller;
  }

  public set controller(controller) {
    const oldValue = this._controller;
    if (oldValue === controller) {
      return;
    }

    oldValue?.detach(this);
    controller?.attach(this);
    this._controller = controller;
    this.updateFilterOptions();
    this.updateFilters();
    this.requestUpdate('controller', oldValue);
  }

  // TODO: Use actual filter value as single source of truth?
  private _value?: T;
  @property({ attribute: false })
  public get value() {
    return this._value;
  }
  public set value(value) {
    const oldValue = this._value;
    if (oldValue === value) {
      return;
    }

    this._value = value;
    this.updateFilterOptions();
    this.updateFilters();
    this.requestUpdate('value', oldValue);
  }

  @property({ type: String })
  public field = '';

  @property({ type: String })
  public label = '';

  @property({ type: Boolean })
  public disabled = false;

  protected get filters() {
    // Don't mess with filters if user sets a custom function
    if (!this.controller || typeof this.controller.filters === 'function') {
      return undefined;
    }
    return structuredClone(this.controller.filters);
  }

  protected set filters(filters) {
    // Don't mess with filters if user sets a custom function
    if (
      filters === undefined ||
      !this.controller ||
      typeof this.controller.filters === 'function'
    ) {
      return;
    }

    this.controller.filters = filters;
  }

  protected get options() {
    return (
      this._filterOptions ??
      (this.controller?.getColumnFilterValues(this.field) as Map<T, number>) ??
      new Map<T, number>()
    );
  }

  protected override willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);

    const filters = this.filters;
    if (filters === undefined) {
      return;
    }

    const filtersValue = getNestedValue(filters ?? {}, this.field);
    // We can't always check if a value changed since
    // some values are mutable and return copies but
    // we can check if the filter value doesn't exist anymore.
    // If that is the case, clear this value.
    if (filtersValue === undefined) {
      this.value = undefined;
    }
  }

  protected updateFilters() {
    if (!this.controller || !this.field) {
      return;
    }

    const filters = this.filters ?? {};
    setNestedValue(filters, this.field, this.value);
    this.filters = filters;
  }

  private updateFilterOptions() {
    if (this.value === undefined) {
      this._filterOptions = undefined;
    } else if (this._filterOptions === undefined) {
      // Lock in our filter options as soon as the user selects a value
      this._filterOptions = this.controller?.getColumnFilterValues(
        this.field,
      ) as Map<T, number>;
    }
  }
}
