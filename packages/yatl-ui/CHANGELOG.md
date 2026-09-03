# @timlassiter11/yatl-ui

## 5.0.0

### Minor Changes

- 3ffa0f5: Added `silent` to `YatlToastData`, `'always' | 'onUpdate'`:

  - `silent: 'always'` updates an existing toast's content without bringing it back to the live overlay if the user already dismissed it - useful for e.g. a background retry updating the same error notification without repeatedly popping back up. A brand-new toast raised this way is created already dismissed, so it never shows live at all, even the first time.
  - `silent: 'onUpdate'` shows live normally the first time (there's nothing to update yet), but behaves like `'always'` on every subsequent call that finds an existing record for the same `id`. This is for callers that can't tell whether a given call is the first attempt or a repeat - the store already knows, from whether `id` matches an existing record, so the caller can just always pass `silent: 'onUpdate'` and get the right behavior either way.

  Either way, a silent call still marks the entry unread and bumps it to the front of history, so the notification center still reflects it - "silent" only means it doesn't interrupt with a popup, not that it's hidden entirely.

  Also, `yatl-notification-center` now displays each entry's most recent update time instead of when it was first created - unchanged for a toast that's never been updated (`updatedAt` starts equal to `createdAt`), but a recurring notification (via `id`-based upserts, silent or not) now reads as "how long since this last happened" instead of "how long since it first happened".

### Patch Changes

- Updated dependencies [c3aa490]
- Updated dependencies [38a6ab0]
- Updated dependencies [7865c86]
  - @timlassiter11/yatl@1.6.0

## 4.1.0

### Minor Changes

- 10cdcce: Added `yatl-notification-center`, a bell trigger with an unread-count badge and a dropdown of the current session's toast history. It's purely additive - drop it in anywhere and it starts working with zero other wiring, whether or not `yatl-toast-manager` is also mounted. Both are now backed by a shared, session-only toast store instead of `yatl-toast-manager` owning the state itself, so a toast dismissed or expired from the live overlay stays in `yatl-notification-center`'s history until it's cleared, and clearing a toast from the history (or via "Clear all") also removes it from the live overlay if it's still showing.

  Read state follows how a toast left the live overlay: closing one manually (the close button, or a consumer calling `toastEl.hide()`) marks it read, but its duration timer expiring on its own leaves it unread - the user may not have been looking, so the badge stays as their cue they missed it. `<yatl-toast>`'s `yatl-toast-hide` event now carries this as `event.reason` ('user' | 'timeout'), and `hide()` takes an optional matching argument (defaults to 'user').

  While `yatl-notification-center`'s panel is open, each entry's relative timestamp ("2 minutes ago") keeps advancing on its own via an interval, instead of only updating when a new toast triggers a re-render. The interval stops as soon as the panel closes.

  Each entry's icon is now colored to match its toast's variant (danger red, success green, ...), and always renders - even a neutral toast with no icon glyph still reserves the icon's space, so entry titles stay aligned regardless of variant. `<yatl-toast>`'s own status icon got the same treatment for consistency between a live toast and its later history entry.

  Also, on `YatlToastData`:

  - Added `id`. Supplying the id of an existing toast via `toast({ id, ... })` updates it in place (and restarts its duration timer if it's still showing) instead of stacking a new one - useful for progress toasts. `toast()` now returns the id it used, generating one when omitted.
  - Added `persist`. Set to `false` to keep a toast out of `yatl-notification-center`'s history once it's dismissed, for low-value toasts that shouldn't clutter it.

### Patch Changes

- 1003a4e: Fixed `yatl-input`, `yatl-textarea`, and `yatl-radio-group` silently ignoring the `value` attribute when it was set through a dynamic binding in a template (e.g. Lit's `value=${someValue}`) rather than as a static string. A custom element already registered via `customElements.define()` upgrades - constructor and all - synchronously as part of the `cloneNode`/`importNode` a templating library uses to stamp out its template content, which happens _before_ the template engine commits any bound attribute values onto that clone. `value` used to seed itself from the raw `value` attribute directly in a field initializer to work around an unrelated Lit first-render timing quirk, but that read always ran too early to see an attribute supplied this way, silently falling back to empty. `value` is now seeded from `defaultValue` in `willUpdate()` instead, once Lit's own (reliable) attribute-to-property sync has had a chance to run.

## 4.0.1

### Patch Changes

- ff48434: Fixed a race condition where a `change`/`input` event dispatched by a form control (`yatl-input`, `yatl-textarea`, `yatl-number-input`, `yatl-select`, `yatl-search-select`, `yatl-typeahead`, `yatl-date-input`, `yatl-date-range-input`) could reach a listener - most commonly an enclosing `<form>`'s own `change` handler reading `FormData` - before the new value had been committed to `ElementInternals`. The commit used to happen in Lit's `updated()` lifecycle, one microtask after the event was dispatched, so a synchronous listener would see the _previous_ value (or nothing, on the first interaction). The value is now committed synchronously before the event fires. (`yatl-checkbox`/`yatl-switch`/`yatl-radio` were already unaffected - they commit synchronously through their own `checked`/`value` setters.)
- 87b5a1e: Added ability to customize the table toolbar's search input placeholder text with a new searchPlaceholder property and matching search-placeholder attribute on the yatl-toolbar, yatl-table-ui, and yatl-table-view.

## 4.0.0

### Major Changes

- 2c547a4: `yatl-confirmation-dialog` now exposes most of the underlying `yatl-dialog` feature set instead of hiding it behind a fixed accept/reject shape:

  - Added `fullscreen` (passes through to the inner dialog).
  - Added a third "cancel" outcome, separate from "reject", for choices like Save / Don't Save / Cancel - use the new `cancelText`/`cancelColor`/`cancelVariant` properties and the new `cancel()` method and `confirmWithCancel(): Promise<'accept' | 'reject' | 'cancel'>` method. `confirm(): Promise<boolean>` keeps its existing signature; it now resolves `false` for both reject and cancel.
  - Added `acceptColor`/`rejectColor`/`cancelColor` and `acceptVariant`/`rejectVariant`/`cancelVariant`, plus `accept-button`/`reject-button`/`cancel-button` CSS parts, so a destructive action can actually be styled as destructive.
  - Added `header`, `header-actions`, and `footer` slot passthrough (alongside the existing `footer-actions`), and exported the inner dialog's `header`/`footer`/`close-button` parts.
  - Added `yatl-confirmation-dialog-show`/`-hide` events that mirror the inner dialog's own show/hide lifecycle, and a new `yatl-confirmation-dialog-cancel` event.
  - Fixed a bug where the dialog's title never actually rendered through the new header slot passthrough (an empty forwarded `<slot>` was suppressing the inner dialog's own title fallback).
  - Fixed a bug where opening the dialog by setting the `open` property/attribute directly (bypassing `show()`) left the `open` attribute stuck after the dialog was closed via a button - `open` is now a reflecting property, consistent with `yatl-dialog`.

  **Breaking changes**, made deliberately since this component has a single internal consumer today:

  - Dismissing the dialog without an explicit choice - Escape, a backdrop click, or the close button - now fires `yatl-confirmation-dialog-cancel` instead of `yatl-confirmation-dialog-reject`.
  - `modal` now defaults to `true` (was implicitly `false`, inherited from the wrapped `yatl-dialog`). A confirmation dialog is guarding a decision, so accidental backdrop/Escape dismissal is now off by default; the close button remains the deliberate way to cancel without an explicit choice.

### Minor Changes

- efef7a4: `yatl-date-range-filter` now automatically limits its picker's selectable dates to the actual min/max of the field's data (via the attached table controller), instead of allowing any date to be picked. Like `yatl-select-filter`'s options, the bounds keep tracking whatever other filters are currently active until a start/end date is picked, then freeze so the filter's own selection can't narrow its own bounds.
- a50a19b: `yatl-tab-group` now fires a cancelable `yatl-tab-change-request` before switching tabs, and `yatl-tab-change` after - both carry the target panel name. `setActiveTab()` also now returns whether a matching panel was found and activated.

  Fixed along the way: clicking a disabled tab no longer switches its panel, clicking the already-active tab no longer fires change events, and calling `setActiveTab()` with an unknown name no longer blanks out the currently active tab/panel before discovering there's nothing to switch to.

- ee1cf8a: Added a search/sort priority toggle button to `yatl-toolbar` (and, through it, `yatl-table-view`/`yatl-table-ui`) that switches the attached controller's `searchSortPriority` between `'score'` and `'sort'`. It's always visible but disabled unless both a sort and a search are currently active, since the setting has no effect otherwise. Opt out with `hideSearchSortPriorityToggle` (`hide-search-sort-priority-toggle` attribute), defaulting to visible so existing consumers get the feature without any changes.

### Patch Changes

- c4a29c9: Added a shared `initialAttributeValue()` helper on YatlFormControl for reading an attribute's initial value from a `value` field initializer, and switched input, textarea, and radio-group over to it in place of their own ad-hoc versions of the same workaround.
- d97f9c1: Fixed `yatl-checkbox`/`yatl-switch`/`yatl-radio` silently ignoring an explicit `.checked` property set before the element's first render (e.g. a `.checked=${...}` binding from a parent template) - `firstUpdated()` unconditionally re-seeded `checked` from `defaultChecked` afterward, clobbering it back to the attribute-driven default.
- c72e222: Fixed `yatl-confirmation-dialog`'s `confirm()` leaving a dangling accept or reject listener attached forever after each call (only the direction that actually fired was cleaned up by `once`) - both are now removed together once either resolves.
- f885f87: Fixed `yatl-date-grid` not navigating to the previous month when a leading day from that month (shown at the start of the grid) was clicked - it only auto-navigated forward for trailing next-month days, leaving the displayed month unchanged (and visually inconsistent with the just-selected date) when going backward.
- 1b0181d: `yatl-date-grid` (and everything built on it - `yatl-date-picker`, `yatl-date-range-picker`, and their form inputs/filters) no longer always opens on today's month. When the selectable `min`/`max` range doesn't include today, it now opens on the nearest bound instead of a month where every day is disabled; when there's an existing selection, it opens on that month instead. Navigating the calendar is left alone otherwise - reopening or an unrelated re-render won't yank the view back once you've moved around.
- dc0c708: Fixed `yatl-date-range-filter` not applying `start-date`/`end-date` set via attribute until the user manually changed the range - the dates displayed as if filtering, but no filter was ever applied
- 19ef9ed: Fixed `yatl-details` throwing (via an unhandled rejection in `willUpdate()`) when its `name` attribute contained a double quote - the accordion-grouping query interpolated `name` directly into a CSS attribute selector without escaping.
- 2c547a4: Fixed `yatl-dialog` and `yatl-flyout` dispatching `-show`/`-hide` events twice for a single `show()`/close: their `open` property setter called `show()`/`hide()` on any change, but `show()`/`hide()` themselves set `open` as part of their own internal state transition, re-entering the setter and kicking off a second, independent show/hide run. A re-entrancy guard now prevents that internal assignment from triggering a second call.
- af041ea: Fixed `yatl-dialog` getting stuck open (or closed) when `show()`/`hide()`/`open` was toggled again while the previous open/close transition was still in flight - the in-progress-transition guard silently no-op'd instead of applying the newer request once the transition finished, leaving `open` desynced from whether the dialog was actually visible.
- 2911704: Fixed `yatl-dropdown` keyboard navigation (Arrow Up/Down, Home, End) landing focus on disabled options - selecting them was already blocked, but they were reachable and counted toward wrap-around, which is inconsistent with standard listbox/menu keyboard conventions.
- 2911704: Fixed `yatl-dropdown` losing its outside-click/Escape/positioning listeners if it was disconnected and reconnected while open (e.g. a parent moved it to a new location in the DOM) - it would keep rendering as open but stop responding to anything until manually toggled.
- dc0c708: Fixed filter components (`yatl-select-filter`, `yatl-search-filter`, etc.) bound to a dotted/nested `field` (e.g. `field="user.name"`) silently not filtering anything - they were writing a nested object into the controller's `filters`, but `Filters<T>` is a flat map keyed by the dotted field name itself
- fa11865: Fixed `yatl-flyout` getting stuck open (or closed) when `show()`/`hide()`/`open` was toggled again while the previous open/close transition was still in flight - same issue as `yatl-dialog`, since the two share the same show/hide logic.
- 391479b: Fixed `required` validation never triggering on form controls whose value is an array (`yatl-select` in multi mode, `yatl-search-select`) - `!this.value` is always `false` for an array regardless of whether it's empty, so `checkValidity()`/`reportValidity()` always reported valid even with nothing selected.
- dee6221: Fixed `required` validation incorrectly treating `0` as a missing value on `yatl-number-input` - `checkValidity()` reported invalid even when a legitimate value of `0` was set.
- af041ea: Fixed `getAnimationPromise`'s fallback timeout never actually resolving - an inverted condition caused it to bail out instead of resolving when no matching `animationend`/`animationcancel` event ever fired, so anything waiting on it (`yatl-dialog`, `yatl-flyout`, `yatl-toast`) could hang indefinitely instead of falling back after the timeout as intended.
- f4ae30d: Fixed `yatl-remote-options` race conditions: a slower fetch for a previous `uri` could overwrite options loaded for a newer `uri` if it resolved later, a failed fetch could delete the wrong `uri`'s cache entry if `uri` had changed again while the request was in flight, and a fetch failure was an unhandled promise rejection since `fetchOptions()` is called fire-and-forget.
- 391479b: Fixed `yatl-select` with `multi required` blocking unchecking _any_ option, even when another option would remain selected - it should only prevent the selection from becoming entirely empty.
- dc0c708: Fixed `yatl-switch-filter` re-applying its `onValue`/`offValue` when filters were cleared externally (e.g. via the "Clear Filters" button) if its default toggle position mapped to a defined value - clearing now always results in no filter, while still restoring the switch's initial visual position
- 5812e9f: Fixed `yatl-table-view` reload requests racing: since the reload button always calls `reloadData` silently and is never disabled mid-flight, rapid clicks could start overlapping fetches, and a slower/older request finishing after a newer one could overwrite fresher data (or clear the loading indicator while a newer reload was still in flight). Only the most recently started reload's result is now applied.
- 37157a7: Fixed `yatl-table-view`'s sidebar (`sidebar-start`/`sidebar-end` slots) showing a second, nested scrollbar on slotted content like `yatl-card` when the window got short enough that the sidebar itself needed to scroll. `yatl-card` defaults to `height: 100%`, which inside the sidebar's scrollable flex column meant "100% of the sidebar" rather than "however tall my own content is" - squeezing the card into less space than it needed and forcing it to scroll internally on top of the sidebar's own scrollbar. Sidebar-slotted content now sizes to its natural content height, so only the sidebar scrolls.
- fa11865: Fixed `yatl-toast-manager`'s popover staying open (in the top layer, even with zero visible toasts) after the last toast was dismissed - `handleToastHide` removed the toast from the list but never re-evaluated whether the popover should still be open, unlike the request path which does.
- 994f083: Fixed `yatl-tree` multi-select mode not actually selecting anything - it checked the item's stale, pre-click `selected` value instead of the newly-computed target state when deciding whether to add or remove it from the selection, so clicking an item in `selection-method="multi"` was a no-op.
- e97c79b: Fixed yatl-input and yatl-textarea not displaying their value when set via the `value` attribute (e.g. `<yatl-input value="...">`), while setting the `.value` property directly still worked.
- Updated dependencies [a73a20a]
- Updated dependencies [cdb336a]
- Updated dependencies [1ff2fe4]
- Updated dependencies [7c81808]
- Updated dependencies [7c81808]
- Updated dependencies [13c8880]
- Updated dependencies [8e7c615]
- Updated dependencies [7c81808]
- Updated dependencies [7c81808]
- Updated dependencies [7c81808]
- Updated dependencies [7c81808]
- Updated dependencies [7c81808]
- Updated dependencies [7c81808]
- Updated dependencies [7c81808]
- Updated dependencies [7c81808]
- Updated dependencies [f2eb73d]
- Updated dependencies [2f6129e]
- Updated dependencies [91eb0d0]
- Updated dependencies [7c81808]
- Updated dependencies [4cf95fa]
- Updated dependencies [7c81808]
- Updated dependencies [91eb0d0]
- Updated dependencies [ffd84da]
  - @timlassiter11/yatl@1.5.0

## 3.0.1

### Patch Changes

- e34226a: Fixed clicking a yatl-date-input or yatl-date-range-input's label not opening the date picker, since their trigger button had no id for the label to target.
- 91b590b: Fixed a dropdown-based control (yatl-select, yatl-date-input, yatl-date-range-input) closing and immediately reopening on a second label click instead of toggling closed, caused by two separate issues: the label's press was being read as an outside click by the dropdown's click-away-to-close handler, and its forwarded click was being ignored by a guard meant for keyboard-generated clicks.
- ece8173: Added ability to register custom icons to use with yatl-icon
- ba92cfd: Fixed checkbox, switch, and radio labels rendering flush against the control with no gap, and looking bold/oversized like a standard form control label instead of normal body text.
- c2b8ce9: Fixed clicking a yatl-select's label not opening the dropdown when multi is set, since the decorative display input carrying the label's target id doesn't render in multi mode. Moved the id onto the actual trigger element instead, which is present in both modes.
- adcd8e7: Built out yatl-label into a real, reusable component matching form control label styling, and wired it into all form controls. Also exposed it for standalone use on custom markup.
- 8e299ed: Improved disabled state logic for all form controls
- 2e4f397: Added new yatl-flyout component
- Updated dependencies [5cb2c4c]
  - @timlassiter11/yatl@1.4.2

## 3.0.0

### Minor Changes

- eae0d78: \* Added dedicated filterStrategy property to table controller for overriding default filter logic with a custom filter function.
  - Removed the option to set the filters to a callback function.

### Patch Changes

- 5675273: Added new date range filter component
- bcc2428: Switched date input to use new date picker
- dc87be8: Improved the open logic for typeaheads as well as added an inline spinner to visually show the state
- 4383494: Fixed dropdown not emitting toggle events on focus loss
- 78e9d2c: Added new property to select to force dropdown to match input width
- a064def: Fixed select UI bug when tags overflow input row
- bfad084: Added new icons for chevron up, left, and right that match chevron down
- 8544e19: Fixed switch component not visually showing disabled state
- a4b0268: Added new 'text' CSS part to the yatl-tag component
- f4e8d94: Added ability to hide dialog close buttons
- b292a76: Added new tree and tree item components
- fca3230: Added new qr-code and scan icons
- 8eb00dd: Limit date grid selection and navigation to min / max range
- 854a505: Improved contrast for search-select options
- ab0bb80: Fixed typeahead not fetching remote options
- 4235e26: Improved search and added visual match indication to search select component
- fe54c2f: Added calendar icon
- fcd0737: Added minlength and maxlength attributes to typeahead
- 9f1e609: Added copy icon
- 836b5c8: New components for date grid, date picker, and date range picker.
- 97bcbc7: Added new yatl-label component for easier label customization and matching form controls
- 8271f6f: Added yatl-dialog-fullscreen event when toggling dialog fullscreen state
- 4d07436: Improved logic for opening typeahead options picker
- 2dfdfbc: Improved UI/UX of date range filter component
- b1bf13a: Added ability to define custom form data names to date range input
- 3ee56e4: Fixed alignment issues with date input and date range input's calendar icon when there is no value text
- 7420898: Added new 'tag' CSS part to yatl-select
- 0beb4d8: Allow consumer to omit value and label properties if response items are strings
- 559ff75: Fixed checkbox, radio, and switch components not honoring default check state
- 2b59723: Submit date range picker values as start and end when no name is provided
- d46d8fa: Sort search-select results by rank
- c8b0724: Added control for choosing current selection mode (start or end) in date range picker
- af3f3bf: Improved UI for date range input
- Updated dependencies [7a1b276]
- Updated dependencies [6475918]
- Updated dependencies [1a6e094]
- Updated dependencies [dc34ff1]
- Updated dependencies [bdac051]
- Updated dependencies [b334ce9]
- Updated dependencies [611cfa7]
- Updated dependencies [a1b6f99]
- Updated dependencies [61bfcb0]
- Updated dependencies [2d8acdb]
- Updated dependencies [b3a378f]
- Updated dependencies [eca2858]
- Updated dependencies [a559d42]
- Updated dependencies [63fde3d]
- Updated dependencies [f7f1d44]
- Updated dependencies [530ca30]
- Updated dependencies [eae0d78]
- Updated dependencies [add530e]
  - @timlassiter11/yatl@1.4.0

## 2.0.0

### Patch Changes

- f32af15: Added ability to edit cells within table
- 9d18096: Fixed card layout incorrect when header or footer are empty
- 6dd3d58: Switched dialog from native modal to popover to fix toast issues
- 796c56d: Show error state in reload button when table view fetch task returns undefined
- c567e6d: Added caching to remote options
- c03734a: Fixed toasts showing behind open dialogs
- 3c1683f: Fixed detail body not scrolling
- d16ba0e: Fixed components not honoring hidden attribute
- d0aaa1f: Added new icons for lists and nodes
- d4dfd4d: Fixed table-view loading overlay still allowing scrolling
- 2e51698: Fixed missing form data for inputs initialized with a value and never changed
- 3549add: Fixed details layout issue when stacked in a flex container
- f7ca428: Fixed dropzones not always working in Chrome
- d83f27e: Added error state timeout property to button
- 97f91ac: Fixed toast showing label and message when only message set
- 06856f6: Hide confirmation dialog buttons when text is empty
- cae648f: Added position property to toast manager
- db39faf: Added better success and error animations to the button
- 3b82458: Fixed number inputs masked characters not matching length of display value
- f716e88: Fixed dropdown keyboard navigation ignoring nested options
- 9590c25: Added new property to table view for hiding the clear filters button
- 0e3f3fe: Added new toast components
- f083a6a: Added new pencil and save icons
- f202b12: Fixed crash in remote options when using default fetch client
- 8dd62b6: Fixed close button missing on toast
- 56e642a: Added properties to the spinner to automatically transition between states.
- 729ef64: Added property to spinner to disable success / error overlay animation
- 15e88dd: Disable the spinner overlay animation on some button variants
- 0de3776: Fixed number inputs showing autocomplete suggestions
- 2e94b9e: Added property to typeahead to limit total number of options displayed
- 3462cbe: Fixed tab panel clipping
- 689fd08: Fixed form controls not honoring initial value
- Updated dependencies [295518a]
- Updated dependencies [f32af15]
- Updated dependencies [aebeaae]
- Updated dependencies [56df7fd]
- Updated dependencies [0aa669c]
- Updated dependencies [5b489cd]
- Updated dependencies [ceae989]
- Updated dependencies [89263d8]
- Updated dependencies [e1310a0]
- Updated dependencies [269725b]
- Updated dependencies [329b84b]
- Updated dependencies [cbef96d]
- Updated dependencies [ea20d98]
- Updated dependencies [2a27505]
- Updated dependencies [72fa32a]
- Updated dependencies [25eaabb]
  - @timlassiter11/yatl@1.3.0

## 1.0.7

### Patch Changes

- 273fad1: Fixed details summary growing to full height
- d895141: Fixed unable to toggle number input value visibility when disabled
- 4cf0ed6: Fixed hidden number input triggering password save prompts
- e12e942: Fix filter switches not working when setting undefined as onValue
- 468f917: Fixed select returning undefined value instead of empty string or empty list
- Updated dependencies [84ad70a]
  - @timlassiter11/yatl@1.2.5

## 1.0.6

### Patch Changes

- 494a70c: Submit form when enter pressed within form controls
- aa2199f: Fixed dialog not showing and hiding properly
- fe8327b: Made details body scrollable by default
- a1de202: Added a new disabled property to button group to allow disabling all children
- e06377c: Improved dropzone logic for more relaiable state
- a7bcb4e: Added new link icon
- d170447: Fixed dialog not properly handling overflow
- 885608e: Added new size property to button
- e24dd7a: Improved width handling of all form controls
- d09ec8b: Fixed radio group not honoring initial checked state of children
- e6ed560: Fixed select ignoring first selection
- 658ee18: Added default gap to dialog footer actions
- ec09643: Fixed icon icon missing for spinner error state
- a2c3a24: Added new divider component
- 592994b: Added new remote-options component for fetching select options from a remote endpoint
- 14ddebf: Removed dropzone reliance on parent for drag events
- bce14ed: Fixed button groups not properly applying border radius
- 5e96167: Fixed dialog not showing animation when attaching to DOM with open attribute set
- b898052: Moved button state to spinner
- 7320715: Fixed single element button groups not honoring radius
- ad86cbd: Fixed select treating empty string values as actual value
- f28e13e: Fixed footer in card rendering when nothing slotted
- 9d4aa4a: Fixed spinner not animating in Firefox
- 20deed4: Added search debounce property to toolbar
- 9146fc8: Fixed single buttons in button group not taking up full height
- 99580d3: Fixed button groups re-enabling children
- 57acbdc: Added open event for details
- 9f24f5b: Fixed export not working in table view
- 706a80e: Added slots to dropzone for each state
- 2b45b8b: Fixed form-control validation messages not showing
- ad43ec1: Fixed error when setting the select value attribute to a number-like string. E.g. "-1"
- a0b0bd4: Added hint state to dropzone that starts whenever a drag starts
- 4ce8dee: Added new cancellable toggle request event for checkable options
- 53499cf: Fixed dialog hide promise never resolving
- b423a19: Fixed button group styling issues
- 40fe1c8: Added new cancellable event to dropzone that fires when any global drag starts.
- 5a873ae: Added new dropzone component
- 37ba8be: Added new state prop to button for idle, loading, and success
- 314e5da: Fixed table view reload button stuck on success state
- f372691: Fixed dropzone not detecting file drags when started over a disabled form control
- 1fda21c: Fixed dialog showing when not open
- 52d8fb7: Fixed visual bug when virtualized table is put inside dialog causing rows to be rendered incorrectly
- ba01321: Added visibility toggle to password and number inputs
- dab0b40: Fixed button contents being shown under loading or check icon
- Updated dependencies [be235f2]
- Updated dependencies [885608e]
- Updated dependencies [8b8cf2c]
- Updated dependencies [52d8fb7]
  - @timlassiter11/yatl@1.2.4

## 1.0.5

### Patch Changes

- 1203b04: Fixed select values overflowing
- d408806: Better default value logic for form controls
- 6c466a8: Allow select value attribute to accept string for better DX in Lit templates
- 533b6e7: Added new details component
- 6f052a9: Fixed focus ring not showing on form controls
- d22ba92: Added new group filter component to group multiple switch filters
- d5e0a42: Allow date input values to be set with a string
- 93cc9af: Added event to table view when filters are cleared
- 1d750b9: Fixed types not being exported
- 7094b57: Visually show when a tab is disabled
- f77a1ac: Added new tab, tab-panel, and tab-group components
- 55cec2e: Better fetch customization for table-view
- d592880: Added textarea component
- de850c9: Fixed dropdowns not always dispatching select events
- a6dd046: Fixed search select not switching to closed mode on focus loss
- 74c8698: Fixed details with same name not closing automatically
- 8095637: Added a display precision attribute to number inputs
- e51fb04: Fixed typeahead form value not updating on select
- 89c6785: Sort filter options
- 0913b10: Added a header and clear button to the filters pane in the table view
- 1a5cd7a: Fixed filters not working due to incorrect context
- 81d6318: Added table-view attribute for auto loading data before first render
- f14301d: Fixed number-input not displaying anything when display precision is set
- 1f75f43: Added a fullscreen attribute to dialogs
- 2f0c5f5: Fixed switch filters not unchecking when filters externally reset
- 37d4963: Fixed submit and reset buttons not working
- 26cddfb: Fixed error in filter components when filters contain functions
- 28ac414: Added setup attribute to number input
- 97fc7bf: Fixed textarea not properly resizing
- 736884a: Fixed dropdowns not closing on focus loss
- ba3dc80: Fixed number input not displaying 0 values
- bb2ef86: Added ability to hide filter pane in table view
- Updated dependencies [847e4ad]
- Updated dependencies [7b0a774]
- Updated dependencies [6f88bea]
  - @timlassiter11/yatl@1.2.3

## 1.0.4

### Patch Changes

- 328454d: Added reload button and loading indicator to table view
- 9a7291a: Fixed not being able to uncheck radios when not required
- 6affff8: Added a new loading overlay component
- 53cafe9: Added reload icon

## 1.0.3

### Patch Changes

- d76618e: Fixed falsy filter values being cleared

## 1.0.2

### Patch Changes

- 0e31dbd: Added loading property and spinner to button
- 19ddebe: Added new spinner component
- 5a8ae4c: Moved option checkbox to left of start slot
- 98f2ad7: Fixed name always null on all form controls
- bc8d13b: Fixed button text not centered when stretched
- dbad644: Fixed input labels not rendering
- 6ac8535: Fixed switch label alignment
- e6fbff3: Added disabled property to filter components
- 5b004ff: Added default slot to icon to allow using custom SVGs
- 0687887: Added switch filter component
- 524d526: Fix sizing issues with spinner
- Updated dependencies [92e24e5]
  - @timlassiter11/yatl@1.2.2

## 1.0.1

### Patch Changes

- 91fbc9e: Fixed events not exported
- 4640e98: Fixed column toggle request never firing
- Updated dependencies [4640e98]
- Updated dependencies [b7a21b7]
  - @timlassiter11/yatl@1.2.1

## 1.0.0

### Minor Changes

- d2a5ab1: - Refactored project into a monorepo
  - Created @timlassiter11/yatl-ui for UI components

### Patch Changes

- Updated dependencies [d2a5ab1]
  - @timlassiter11/yatl@1.2.0
