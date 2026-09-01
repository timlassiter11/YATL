import { consume } from '@lit/context';
import { PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { getTableContext } from '../../../context';
import {
  FilterOption,
  Filters,
  NestedKeyOf,
  UnspecifiedRecord,
  YatlTableController,
} from '@timlassiter11/yatl';
import { YatlBase } from '../../base/base';

export class YatlBaseFilter<
  TValue,
  TData extends object = UnspecifiedRecord,
> extends YatlBase {
  private _filterOptions?: FilterOption[];

  private _controller?: YatlTableController<TData>;

  public get controller() {
    return this._controller;
  }

  /** The table controller this filter is attached to. Provided automatically via context. */
  @consume({
    context: getTableContext<TData>(),
    subscribe: true,
  })
  @property({ attribute: false })
  public set controller(controller) {
    const oldValue = this._controller;
    if (oldValue === controller) {
      return;
    }

    oldValue?.detach(this);
    controller?.attach(this);
    this._controller = controller;
    this.updateFilters();
  }

  // TODO: Use actual filter value as single source of truth?
  private _value?: TValue;
  public get value() {
    return this._value;
  }
  /** The current filter value. */
  @property({ attribute: false })
  public set value(value) {
    const oldValue = this._value;
    if (oldValue === value) {
      return;
    }

    this._value = value;
    this.updateFilters();
  }

  /**
   * The name of the data field this filter applies to.
   * @attr field
   */
  @property({ type: String })
  public field = '';

  /**
   * The label displayed for this filter.
   * @attr label
   */
  @property({ type: String })
  public label = '';

  /**
   * Disables the filter.
   * @attr disabled
   */
  @property({ type: Boolean })
  public disabled = false;

  protected get filters(): Filters<TData> | undefined {
    if (!this.controller) {
      return undefined;
    }
    // Filters is a flat map keyed by (possibly dotted) field name - not a
    // nested object mirroring the row shape - so a shallow copy is enough.
    return { ...this.controller.filters };
  }

  protected set filters(filters) {
    if (filters === undefined || !this.controller) {
      return;
    }

    this.controller.filters = filters;
  }

  protected get options() {
    // No controller, just return an empty map.
    if (!this.controller) {
      return [];
    }

    // If we don't have a value, we want to keep updating
    // the current options. Once the user sets a value we need
    // to lock in the current options so we don't filter ourselves.
    if (!this.value || !this._filterOptions) {
      this._filterOptions = this.controller.getColumnFilterValues(
        this.field as NestedKeyOf<TData>,
      );

      // Sort options. This keeps them consistent when sorting
      // changes and makes it easier for the user to find things.
      this._filterOptions.sort((a, b) => a.label.localeCompare(b.label));
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
      const filtersValue = filters[this.field as NestedKeyOf<TData>];
      // We can't always check if a value changed since
      // some values are mutable and return copies but
      // we can check if the filter value doesn't exist anymore.
      // If that is the case, clear this value.
      if (this.value !== filtersValue && filtersValue === undefined) {
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

    const filters: Filters<TData> = this.filters ?? {};
    filters[this.field as NestedKeyOf<TData>] = this.value;
    this.filters = filters;
  }
}
