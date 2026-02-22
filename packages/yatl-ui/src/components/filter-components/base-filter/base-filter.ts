import { consume } from '@lit/context';
import { PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { getTableContext } from '../../../context';
import {
  getNestedValue,
  NestedKeyOf,
  setNestedValue,
  UnspecifiedRecord,
  YatlTableController,
} from '@timlassiter11/yatl';
import { YatlBase } from '../../base/base';

export class YatlBaseFilter<
  T,
  TData extends object = UnspecifiedRecord,
> extends YatlBase {
  private _filterOptions?: Map<T, number>;

  private _controller?: YatlTableController<TData>;

  @consume({
    context: getTableContext<TData>(),
    subscribe: true,
  })
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
    return { ...this.controller.filters };
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
    // No controller, just return an empty map.
    if (!this.controller) {
      return new Map<T, number>();
    }

    // If we don't have a value, we want to keep updating
    // the current options. Once the user sets a value we need
    // to lock in the current options so we don't filter ourselves.
    if (!this.value || !this._filterOptions) {
      const options = this.controller.getColumnFilterValues(
        this.field as NestedKeyOf<TData>,
      ) as Map<T, number>;

      // Sort options. This keeps them consistent when sorting
      // changes and makes it easier for the user to find things.
      this._filterOptions = new Map([...options.entries()].sort());
    }
    return this._filterOptions;
  }

  protected override willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);

    const filters = this.filters;
    if (filters === undefined) {
      return;
    }

    if (this.field) {
      const filtersValue = getNestedValue(filters ?? {}, this.field);
      // We can't always check if a value changed since
      // some values are mutable and return copies but
      // we can check if the filter value doesn't exist anymore.
      // If that is the case, clear this value.
      if (filtersValue === undefined) {
        this.reset();
      }
    }
  }

  protected reset() {
    this.value = undefined;
  }

  protected updateFilters() {
    if (!this.controller || !this.field) {
      return;
    }

    const filters = this.filters ?? {};
    setNestedValue(filters, this.field, this.value);
    this.filters = filters;
  }
}
