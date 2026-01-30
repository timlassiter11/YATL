import { YatlTable } from '../dist/index.mjs';

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

/** @type {YatlTable} */
let table;
/** @type {HTMLFormElement} */
let filtersForm;
/** @type {HTMLFormElement} */
let optionsForm;

window.addEventListener('load', () => {
  table = document.querySelector('yatl-table');
  filtersForm = document.getElementById('filtersForm');
  optionsForm = document.getElementById('optionsForm');
  // Initialize the table columns and default options
  initTable();
  // Setup event handlers for table toolbar UI
  initTableToolbar();
  initFilterOptions();

  // Sync filter controls and table filters
  filtersForm.addEventListener('change', updateTableFilters);
  // Update table fitlers AFTER form reset
  filtersForm.addEventListener('reset', () => setTimeout(updateTableFilters, 0));
  updateTableFilters();

  // Sync option controls and table options
  optionsForm.addEventListener('change', updateTableOptions);
  updateTableOptions();

  /* --- Table Events --- */

  // Just to show how to hook into some events
  table.addEventListener('yatl-row-click', event => {
    console.log('Row clicked:', event.detail);
  });
  table.addEventListener('yatl-row-select', event => {
    console.log('Row selected:', event.detail);
  });
});

/**
 * Initialize the table settings and data.
 */
function initTable() {
  // Used for formatting our last modified data
  const dateFormatter = new Intl.DateTimeFormat(undefined);

  table.enableSearchHighlight = true;
  table.enableSearchScoring = true;
  table.enableSearchTokenization = true;
  table.enableFooter = true;

  table.rowParts = row => {
    // Add row tags as parts so we can style them accordingly
    const tags = row.tags;
    if (typeof tags === 'string') {
      return tags.split(',');
    }
  };

  table.storageOptions = {
    key: 'advanced-example-v1',
    saveSearchQuery: true,
    saveColumnOrder: true,
    saveColumnVisibility: true,
    saveColumnSortOrders: true,
    saveColumnWidths: true,
    storage: 'local',
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
    },
    {
      field: 'status',
      title: 'Status',
      searchable: false,
    },
    {
      field: 'lastModified',
      title: 'Modified',
      sortValue: value => value?.getTime(),
      // Custom filter logic just for this column
      filter: (value, filter) => {
        if (filter.startDate && filter.endDate) {
          return (
            filter.startDate.getTime() <= value.getTime() &&
            filter.endDate.getTime() > value.getTime()
          );
        } else if (filter.startDate) {
          return filter.startDate.getTime() <= value.getTime();
        } else if (filter.endDate) {
          return filter.endDate.getTime() >= value.getTime();
        }
        return true;
      },
      valueFormatter: date => dateFormatter.format(date),
    },
    {
      field: 'issueCount',
      title: 'Issues',
    },
    {
      field: 'tags',
      role: 'internal',
      searchable: true,
      tokenize: true,
      // Tokenize on commas
      searchTokenizer: value =>
        value.split(',').map(v => ({ value: v, quoted: false })),
      cellRenderer: value => {
        /** @type {string[]} */
        const tags = value.split(',');
        const tagElements = [];
        for (const tag of tags) {
          const span = document.createElement('span');
          span.innerText = tag;
          span.classList.add('tag');
          span.classList.add(tag);
          tagElements.push(span);
        }
        return tagElements;
      },
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
  observer.observe(table.shadowRoot, { childList: true, subtree: true });

  return table;
}

function initTableToolbar() {
  const colList = document.getElementById('columnList');
  refreshColumnPicker(colList, table);
  // Update column dropdown order when columns are rearranged.
  table.addEventListener('yatl-state-change', event => {
    if (event.detail.triggers.includes('columnOrder')) {
      refreshColumnPicker(colList);
    }
  });

  const colPicker = document.getElementById('columnPicker');
  document.addEventListener('click', e => {
    if (!colPicker.contains(e.target)) {
      colPicker.removeAttribute('open');
    }
  });

  // Handle export
  const exportButton = document.getElementById('exportButton');
  exportButton.addEventListener('click', () => {
    table.export('yatl-export');
  });

  // Handle search
  const searchInput = document.getElementById('searchInput');
  // Set the table's restored query if it exists.
  searchInput.value = table.searchQuery;
  searchInput.addEventListener('input', event => {
    table.searchQuery = searchInput.value;
  });
}

function initFilterOptions() {
  const statusOptions = filtersForm.querySelector('select[name="status"]');
  statusOptions.size = statuses.length;
  for (const status of statuses) {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    statusOptions.append(option);
  }
}

/**
 * Update table filters from the filters form inputs
 */
function updateTableFilters() {
  const lastModified = {};
  const filters = { lastModified };
  const formData = getTypedFormData(filtersForm);
  for (const [name, value] of Object.entries(formData)) {
    if (name === 'startDate') {
      lastModified.startDate = value;
    } else if (name === 'endDate') {
      // We want our end date to be inclusive
      // So increment it by a day and we'll check
      // for < in the filter callback.
      if (value) {
        value.setDate(value.getDate() + 1);
      }
      lastModified.endDate = value;
    } else {
      filters[name] = value;
    }
  }
  table.filters = filters;
}

/**
 * Update the table options from the options form inputs
 */
function updateTableOptions() {
  const options = getTypedFormData(optionsForm);
  for (const [name, value] of Object.entries(options)) {
    if (name === 'rowCount') {
      // Prevent the data from changing when toggling other settings
      if (table.data.length !== value) {
        table.data = generateMockData(value);
      }
    } else if (name in table) {
      table[name] = value;
    }
  }
}

/**
 * Update the table state elements based on the current table state
 */
function updateTableState() {
  const renderedRows = table.shadowRoot.querySelectorAll('.row').length - 1;
  document.getElementById('renderedRows').textContent =
    renderedRows.toLocaleString();

  const filteredRows = table.filteredData.length;
  document.getElementById('filteredRows').textContent =
    filteredRows.toLocaleString();

  const totalRows = table.data.length;
  document.getElementById('totalRows').textContent = totalRows.toLocaleString();
}

/**
 * 
 * @param {HTMLFormElement} form 
 */
function getTypedFormData(form) {
  const formData = new FormData(form);
  const typedData = {};
  for (const [name, value] of formData.entries()) {
    const element = form.querySelector(`[name="${name}"]`);
    if (element instanceof HTMLInputElement) {
      switch (element.type) {
        case 'radio':
        case 'checkbox':
          if (value === 'null') typedData[name] = null;
          else typedData[name] = value;
          break;
        case 'number':
          typedData[name] = parseFloat(value);
          break;
        case 'date':
          typedData[name] = dateFromIsoString(value);
          break;
        case 'datetime':
        case 'datetime-local':
          typedData[name] = new Date(value);
          break;
        case 'text':
        default:
          typedData[name] = value;
      }
    } else if (element instanceof HTMLSelectElement && element.multiple) {
      if (!Array.isArray(typedData[name])) {
        typedData[name] = [value]
      } else {
        typedData[name].push(value);
      }
    } else {
      typedData[name] = value;
    }
  }

  // Manually add checkboxes as true / false since form data ignores unchecked.
  const checkboxes = form.querySelectorAll('input[type="checkbox"]')
  for (const checkbox of checkboxes) {
    if (checkbox.name && checkbox.value === 'on') {
      typedData[checkbox.name] = checkbox.checked;
    }
  }

  return typedData;
}


/**
 * Gets a correctly typed value from the given input based on it's type
 * @param {HTMLInputElement | HTMLSelectElement} input
 */
function getValueFromInput(input) {
  if (input instanceof HTMLSelectElement) {
    if (input.multiple) {
      return [...input.selectedOptions].map(opt => opt.value);
    }
    return input.value;
  }

  switch (input.type) {
    case 'radio':
    case 'checkbox':
      if (input.value === 'on') return input.checked;
      if (input.value === 'null') return null;
      return input.checked ? input.value : undefined;
    case 'number':
      return parseFloat(input.value);
    case 'date':
      return dateFromIsoString(input.value);
    case 'datetime':
    case 'datetime-local':
      return new Date(input.value);
    case 'text':
    default:
      return input.value;
  }
}

function dateFromIsoString(value) {
  // Date only strings are parsed as UTC timezone but datetime strings are parsed as local time.
  // Make sure this is parsed as local time to match our generated dates.
  return value !== '' ? new Date(value + 'T00:00:00') : null;
}

/**
 * Updates the column picker dropdown to match
 * the current table columns and states.
 *
 * @param {HTMLElement} listElement
 */
function refreshColumnPicker(listElement) {
  // Clear existing
  listElement.innerHTML = '';

  const states = table.columnVisibility;
  for (const column of table.displayColumns) {
    // Label wrapper
    const label = document.createElement('label');
    label.className = 'dropdown-item';

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = states[column.field];

    checkbox.addEventListener('change', e => {
      //table.setColumnVisibility(column.field, e.target.checked);
      const states = table.columnVisibility;
      states[column.field] = e.target.checked;
      table.columnVisibility = states;
    });

    // Text
    const span = document.createElement('span');
    // Find the human-readable title from the original definitions
    const def = table.getColumn(column.field);
    span.textContent = column?.title ? column.title : column.field;

    label.appendChild(checkbox);
    label.appendChild(span);
    listElement.appendChild(label);
  }
}

/**
 * Generates an array of mock data objects for populating a table.
 *
 * @param {number} count - The number of data rows to generate.
 * @returns {Array<Object>} An array of generated data objects.
 */
function generateMockData(count) {
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

  const generatedData = [];

  // --- Helper function to get a random element from an array ---
  const getRandom = arr => arr[Math.floor(Math.random() * arr.length)];

  for (let i = 1; i <= count; i++) {
    // --- 1. Generate a random date (+- 1 year from now) ---
    const today = new Date();
    const oneYearInMillis = 365 * 24 * 60 * 60 * 1000;
    const randomTimeOffset =
      Math.random() * 2 * oneYearInMillis - oneYearInMillis;
    const randomDate = new Date(today.getTime() + randomTimeOffset);

    // --- 2. Generate a tokenizable string of tags ---
    // Shuffle tags and pick a random number of them (2 to 5)
    const shuffledTags = [...possibleTags].sort(() => 0.5 - Math.random());
    const tagCount = Math.floor(Math.random() * 4) + 2; // Get 2, 3, 4, or 5 tags
    const selectedTags = shuffledTags.slice(0, tagCount);
    const issueCount = Math.floor(Math.random() * 100); // Random number of issues
    const tagsString = selectedTags.join(','); // Join with a comma for easy tokenizing

    // --- 3. Assemble the final data object for the row ---
    const dataRow = {
      id: i,
      name: `${getRandom(itemModifiers)} ${getRandom(itemNouns)}`,
      status: getRandom(statuses),
      lastModified: randomDate,
      issueCount: issueCount,
      tags: tagsString,
    };

    generatedData.push(dataRow);
  }
  return generatedData;
}
