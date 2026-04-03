# @timlassiter11/yatl-ui

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
- f4e8d94: Added ability to hide dialog close buttons
- b292a76: Added new tree and tree item components
- 8eb00dd: Limit date grid selection and navigation to min / max range
- 854a505: Improved contrast for search-select options
- ab0bb80: Fixed typeahead not fetching remote options
- 4235e26: Improved search and added visual match indication to search select component
- fe54c2f: Added calendar icon
- fcd0737: Added minlength and maxlength attributes to typeahead
- 836b5c8: New components for date grid, date picker, and date range picker.
- 4d07436: Improved logic for opening typeahead options picker
- 2dfdfbc: Improved UI/UX of date range filter component
- b1bf13a: Added ability to define custom form data names to date range input
- 3ee56e4: Fixed alignment issues with date input and date range input's calendar icon when there is no value text
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
