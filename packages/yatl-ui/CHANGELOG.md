# @timlassiter11/yatl-ui

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
