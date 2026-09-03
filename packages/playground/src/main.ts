import '@timlassiter11/yatl';
import '@timlassiter11/yatl/theme.css';
import '@timlassiter11/yatl-ui';

import {
  toast,
  YatlButton,
  YatlCheckbox,
  YatlFlyout,
  YatlFormControl,
  YatlNumberInput,
  YatlSwitch,
  YatlTableView,
} from '@timlassiter11/yatl-ui';
import {
  NumberEditor,
  RowId,
  SelectEditor,
  TextEditor,
  YatlCommitTransaction,
} from '@timlassiter11/yatl';

// Used for generating data and for filters
const statuses = [
  'Completed',
  'In Progress',
  'Pending',
  'Failed',
  'On Hold',
  'Needs Review',
];

const possibleTags = [
  'urgent',
  'bugfix',
  'feature',
  'ui',
  'backend',
  'database',
  'critical',
  'needs-review',
  'mobile',
  'web',
  'refactor',
];

interface TableData {
  id: number;
  name: string;
  status: string;
  lastModified: Date;
  issueCount: number | null;
  tags: string;
}

// Used for formatting the last modified date, both in the table and the details flyout.
const dateFormatter = new Intl.DateTimeFormat(undefined);

let table: YatlTableView<TableData>;
let optionsForm: HTMLFormElement;
let rowCountInput: YatlNumberInput;

let rowDetailsFlyout: YatlFlyout;
let rowDetailsStatus: HTMLElement;
let rowDetailsModified: HTMLElement;
let rowDetailsIssues: HTMLElement;
let rowDetailsTags: HTMLElement;
let rowDetailsDeleteButton: YatlButton;
let currentDetailsRowId: RowId | undefined;

window.addEventListener('load', () => {
  // Stuff for the page, not about YATL.
  initExtras();

  table = document.querySelector<YatlTableView<TableData>>('yatl-table-view')!;
  optionsForm = document.getElementById('optionsForm') as HTMLFormElement;
  rowCountInput = document.getElementById('rowCountInput') as YatlNumberInput;

  // Initialize the table columns and default options
  initTable();

  rowCountInput.addEventListener('change', () => {
    const count = rowCountInput.value ?? 0;
    table.data = generateMockData(count);
    if (count === 0) {
      toast({
        variant: 'warning',
        label: 'No rows to display',
        message: 'Increase the row count to generate table data.',
      });
    }
  });

  // Sync option controls and table options
  optionsForm.addEventListener('change', updateTableOptions);
  updateTableOptions();

  const deleteRowsButton = document.getElementById(
    'deleteRowsButton',
  ) as YatlButton;
  deleteRowsButton.disabled = table.selectedRowIds.length <= 0;
  deleteRowsButton.addEventListener('click', async () => {
    const selectedRows = table.selectedRowIds;
    const title = 'Delete Rows?';
    const body = `Are you sure you want to delete ${selectedRows.length} rows?`;
    if (await showDialog(title, body)) {
      table.deleteRow(...table.selectedRowIds);
      deleteRowsButton.disabled = true;
      toast({
        variant: 'success',
        label: selectedRows.length === 1 ? 'Row deleted' : 'Rows deleted',
        message:
          selectedRows.length === 1
            ? '1 row was removed.'
            : `${selectedRows.length} rows were removed.`,
      });
    }
  });

  // Wire up the row details flyout.
  rowDetailsFlyout = document.getElementById('rowDetailsFlyout') as YatlFlyout;
  rowDetailsStatus = document.getElementById('rowDetailsStatus')!;
  rowDetailsModified = document.getElementById('rowDetailsModified')!;
  rowDetailsIssues = document.getElementById('rowDetailsIssues')!;
  rowDetailsTags = document.getElementById('rowDetailsTags')!;
  rowDetailsDeleteButton = document.getElementById(
    'rowDetailsDeleteButton',
  ) as YatlButton;
  rowDetailsDeleteButton.addEventListener('click', async () => {
    if (currentDetailsRowId === undefined) {
      return;
    }
    const title = 'Delete Row?';
    const rowName = rowDetailsFlyout.label;
    const body = `Are you sure you want to delete "${rowName}"?`;
    if (await showDialog(title, body)) {
      table.deleteRow(currentDetailsRowId);
      rowDetailsFlyout.open = false;
      toast({
        variant: 'success',
        label: 'Row deleted',
        message: `"${rowName}" was removed.`,
      });
    }
  });

  /* --- Table Events --- */

  // Just to show how to hook into some events
  table.addEventListener('yatl-row-click', event => {
    console.log('Row clicked:', {
      rowId: event.rowId,
      field: event.field,
      row: event.row,
    });
    showRowDetails(event.rowId, event.row as TableData);
  });
  table.addEventListener('yatl-row-select', event => {
    console.log('Row selected:', event.selectedIds);
    // Disable the delete button when no rows are selected.
    deleteRowsButton.disabled = event.selectedIds.length === 0;
  });
});

/**
 * Initialize the table settings and data.
 */
function initTable() {
  table.data = generateMockData(rowCountInput.value!);

  // Add a fake task for fetching data
  table.fetchTask = async context => {
    context.options.silent = true;

    await sleep(1000);
    return generateMockData(rowCountInput.value!);
  };

  table.rowParts = row => {
    // Add row tags as parts so we can style them accordingly
    const tags = row.tags;
    if (typeof tags === 'string') {
      return tags.split(',');
    }
    return [];
  };

  table.addEventListener('yatl-table-commit-request', event => {
    const transaction = event.transaction as YatlCommitTransaction<TableData>;
    const count = transaction.records.length;
    const plural = count === 1 ? 'change' : 'changes';

    // Same id across all three calls updates one toast in place instead of
    // stacking a new one per save - a "Saving..." -> "Saved"/"Failed" toast,
    // like you'd see for an autosave. The interim state is marked
    // persist: false since it's not worth keeping around once it resolves;
    // the final outcome overrides that back to the default so it sticks
    // around in the notification history.
    const toastId = `table-commit-${transaction.id}`;
    toast({
      id: toastId,
      message: `Saving ${count} ${plural}...`,
      duration: 0,
      persist: false,
    });

    const save = async () => {
      await sleep(1000);

      // Simulate an occasional failure so the save flow shows off both
      // outcomes, same as a real backend that can reject a write.
      if (Math.random() < 0.15) {
        toast({
          id: toastId,
          variant: 'danger',
          label: 'Save failed',
          message: `Could not save ${count} ${plural}. Please try again.`,
          duration: 6000,
          persist: true,
        });
        return false;
      }

      for (const record of transaction.records) {
        record.originalRow.lastModified = new Date();
      }
      toast({
        id: toastId,
        variant: 'success',
        label: 'Changes saved',
        message: `${count} ${plural} saved.`,
        duration: 4000,
        persist: true,
      });
      return true;
    };
    event.respondWith(save());
  });

  table.storageOptions = {
    key: 'advanced-example-v1',
    saveSearchQuery: true,
    saveColumnOrder: true,
    saveColumnVisibility: true,
    saveColumnSortOrders: true,
    saveColumnWidths: true,
  };

  table.columns = [
    {
      field: 'id',
      title: 'ID',
      searchable: false,
    },
    {
      field: 'name',
      title: 'Item Name',
      searchable: true,
      tokenize: true,
      editor: new TextEditor(),
    },
    {
      field: 'status',
      title: 'Status',
      searchable: false,
      editor: new SelectEditor<TableData>(),
    },
    {
      field: 'lastModified',
      title: 'Modified',
      sorter: value => (value as Date)?.getTime(),
      // Custom filter logic just for this column
      filter: (value, filter) => {
        const lastModified = value as Date;
        const { startDate } = filter as { startDate?: Date };
        let { endDate } = filter as { endDate?: Date };
        // endDate should be inclusive.
        if (endDate instanceof Date) {
          // Make a copy so we don't keep increasing
          endDate = new Date(endDate);
          endDate.setDate(endDate.getDate() + 1);
        }

        if (startDate instanceof Date && endDate instanceof Date) {
          return (
            startDate.getTime() <= lastModified.getTime() &&
            endDate.getTime() > lastModified.getTime()
          );
        } else if (startDate instanceof Date) {
          return startDate.getTime() <= lastModified.getTime();
        } else if (endDate) {
          return endDate.getTime() >= lastModified.getTime();
        }
        return true;
      },
      valueFormatter: date => dateFormatter.format(date as Date),
    },
    {
      field: 'issueCount',
      title: 'Issues',
      editor: new NumberEditor(),
    },
    {
      field: 'tags',
      role: 'internal',
      searchable: true,
      tokenize: true,
      // Tokenize on commas
      searchTokenizer: value =>
        value.split(',').map(v => ({ value: v, quoted: false })),
    },
  ];

  // Watch for changes in the table to update the number of rendered rows.
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        updateTableState();
        break;
      }
    }
  });
  observer.observe(table.shadowRoot!, { childList: true, subtree: true });

  return table;
}

/**
 * Update the table options from the options form inputs
 */
function updateTableOptions() {
  const options = getTypedFormData(optionsForm);
  const { rowSelectionMethod, ...tableOptions } = options;
  tableOptions['rowSelectionMethod'] =
    rowSelectionMethod === 'null' ? null : rowSelectionMethod;
  Object.assign(table, tableOptions);
}

/**
 * Update the table state elements based on the current table state
 */
function updateTableState() {
  const renderedRows = table.shadowRoot!.querySelectorAll('.row').length - 1;
  document.getElementById('renderedRows')!.textContent =
    renderedRows.toLocaleString();

  const filteredRows = table.filteredData.length;
  document.getElementById('filteredRows')!.textContent =
    filteredRows.toLocaleString();

  const totalRows = table.data.length;
  document.getElementById('totalRows')!.textContent =
    totalRows.toLocaleString();
}

/**
 *
 * @param {HTMLFormElement} form
 */
function getTypedFormData(form: HTMLFormElement) {
  const formData = new FormData(form);
  const typedData: Record<string, unknown> = {};
  for (const [name, value] of formData.entries()) {
    const element = form.querySelector(`[name="${name}"]`);
    if (element instanceof YatlCheckbox || element instanceof YatlSwitch) {
      typedData[name] = element.checked;
    } else if (element instanceof YatlFormControl) {
      typedData[name] = element.value;
    } else {
      typedData[name] = value;
    }
  }
  return typedData;
}

/**
 * Generates an array of mock data objects for populating a table.
 *
 * @param  count - The number of data rows to generate.
 * @returns  An array of generated data objects.
 */
function generateMockData(count: number) {
  // --- Data sources for randomization ---
  const itemNouns = [
    'System',
    'Module',
    'Component',
    'API',
    'Database',
    'Report',
    'Dashboard',
    'Feature',
  ];
  const itemModifiers = [
    'Alpha',
    'Bravo',
    'Phoenix',
    'Orion',
    'Pegasus',
    'Andromeda',
    'Cygnus',
    'Vega',
  ];

  const generatedData: TableData[] = [];

  // Helper function to get a random element from an array
  const getRandom = <T>(arr: T[]) =>
    arr[Math.floor(Math.random() * arr.length)];

  for (let i = 1; i <= count; i++) {
    // Generate a random date within the last year
    const today = new Date();
    const oneYearInMillis = 365 * 24 * 60 * 60 * 1000;
    const randomTimeOffset = Math.random() * oneYearInMillis;
    const randomDate = new Date(today.getTime() - randomTimeOffset);

    // Generate a tokenizable string of tags
    // Shuffle tags and pick a random number of them (2 to 5)
    const shuffledTags = [...possibleTags].sort(() => 0.5 - Math.random());
    const tagCount = Math.floor(Math.random() * 4) + 2; // Get 2, 3, 4, or 5 tags
    const selectedTags = shuffledTags.slice(0, tagCount);
    const issueCount = Math.floor(Math.random() * 100); // Random number of issues
    const tagsString = selectedTags.join(','); // Join with a comma for easy tokenizing

    // Assemble the final data object for the row
    const dataRow = {
      id: i,
      name: `${getRandom(itemModifiers)} ${getRandom(itemNouns)}`,
      status: getRandom(statuses),
      lastModified: randomDate,
      issueCount: issueCount % 17 === 0 ? null : issueCount, // Add some null values in there.
      tags: tagsString,
    };

    generatedData.push(dataRow);
  }
  return generatedData;
}

/**
 * Populates and opens the row details flyout for the given row.
 */
function showRowDetails(rowId: RowId, row: TableData) {
  currentDetailsRowId = rowId;
  rowDetailsFlyout.label = row.name;
  rowDetailsStatus.textContent = row.status;
  rowDetailsModified.textContent = dateFormatter.format(row.lastModified);
  rowDetailsIssues.textContent =
    row.issueCount != null ? row.issueCount.toLocaleString() : 'None';

  rowDetailsTags.replaceChildren(
    ...row.tags
      .split(',')
      .filter(Boolean)
      .map(tag => {
        const element = document.createElement('yatl-tag');
        element.textContent = tag;
        return element;
      }),
  );

  rowDetailsFlyout.open = true;
}

async function showDialog(title: string, body: string) {
  const dialog = document.createElement('yatl-confirmation-dialog');

  const acceptButton = document.createElement('yatl-button');
  acceptButton.slot = 'footer-actions';
  acceptButton.color = 'danger';
  acceptButton.innerText = 'Yes';
  acceptButton.onclick = () => dialog.accept();

  const rejectButton = document.createElement('yatl-button');
  rejectButton.slot = 'footer-actions';
  rejectButton.color = 'muted';
  rejectButton.innerText = 'No';
  rejectButton.onclick = () => dialog.reject();

  dialog.label = title;
  dialog.innerText = body;

  dialog.append(rejectButton);
  dialog.append(acceptButton);
  document.body.append(dialog);

  const ret = await dialog.confirm();
  // remove the element once it is done hiding itself
  dialog.hide().then(() => dialog.remove());
  return ret;
}

function initExtras() {
  const themeButton = document.getElementById('themeToggle')!;
  themeButton.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('light');
  });
}

// Source - https://stackoverflow.com/a/39914235
// Posted by Dan Dascalescu, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-14, License - CC BY-SA 4.0
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
