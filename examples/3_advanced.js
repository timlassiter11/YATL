import { YatlTable, findColumn } from '../dist/index.mjs'

const today = new Date();
today.setHours(0, 0, 0, 0);

/** @type {Date?} */
let startDate
/** @type {Date?} */
let endDate;

Date.prototype.addDays = function (days) {
  const date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

Date.fromIsoString = function (date) {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format:~:text=date%2Donly%20forms%20are%20interpreted%20as%20a%20UTC%20time%20and%20date%2Dtime%20forms%20are%20interpreted%20as%20local%20time
  // Date only strings are parsed as UTC timezone but datetime strings are parsed as local time.
  // Make sure this is parsed as local time to match our generated dates.
  return date !== "" ? new Date(date + "T00:00:00") : null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US");

/**
 * @type {YatlTable}
 */
let table;


window.addEventListener("load", () => {
  table = document.querySelector("yatl-table");
  const colList = document.getElementById("columnList");

  // Pull count from url param
  const url = new URL(location);
  let count = parseInt(url.searchParams.get("count"));
  count = isNaN(count) ? 100000 : count;

  table.enableVirtualScroll = true;
  table.enableSearchHighlight = true;
  table.enableSearchScoring = true;
  table.enableSearchTokenization = true;
  table.enableColumnReorder = true;
  table.enableFooter = true;
  
  table.rowParts = (row) => {
    // Add row tags as parts so we can style them accordingly
    const tags = row.tags;
    if (typeof tags === "string") {
      return tags.split(',');
    }
  }

  table.storageOptions = {
    key: 'advanced-example-v1',
    saveColumnOrder: true,
    saveColumnVisibility: true,
    saveColumnSortOrders: true,
    saveColumnWidths: true,
    storage: 'local'
  }

  table.columns = [
    {
      field: "id",
      title: "ID",
      sortable: true,
      resizable: true,
      searchable: false,
    },
    {
      field: "name",
      title: "Item Name",
      sortable: true,
      resizable: true,
      searchable: true,
      tokenize: true,
    },
    {
      field: "status",
      title: "Status",
      sortable: true,
      resizable: true,
      searchable: false,
    },
    {
      field: "lastModified",
      sortable: true,
      resizable: true,
      sortValue: (value) => value?.getTime(),
      filter: (value, filter) => {
        if (filter.startDate && filter.endDate) {
          return (
            filter.startDate.getTime() <= value.getTime() &&
            filter.endDate.getTime() >= value.getTime()
          );
        } else if (filter.startDate) {
          return filter.startDate.getTime() <= value.getTime();
        } else if (filter.endDate) {
          return filter.endDate.getTime() >= value.getTime();
        }
        return true;
      },
      valueFormatter: (date) => dateFormatter.format(date),
    },
    {
      field: "issueCount",
      title: "Issues",
      sortable: true,
      resizable: true,
    },
    {
      field: "tags",
      resizable: true,
      searchable: true,
      tokenize: true,
      // Tokenize on commas
      searchTokenizer: (value) => value.split(',').map(v => ({ value: v, quoted: false })),
      cellRenderer: (value) => {
        /** @type {string[]} */
        const tags = value.split(',');
        const tagElements = []
        for (const tag of tags) {
          const span = document.createElement("span");
          span.innerText = tag;
          span.classList.add("tag");
          span.classList.add(tag);
          tagElements.push(span);
        }
        return tagElements;
      }
    },
  ];

  table.data = generateMockData(count);

  table.addEventListener('yatl-row-click', (event) => {
    console.log("Row clicked:", event.detail);
  });

  // Update column dropdown order when columns are rearranged.
  table.addEventListener('yatl-state-change', (event) => {
    if (event.detail.triggers.includes('columnOrder')) {
      refreshColumnPicker(colList);
    }
  })

  refreshColumnPicker(colList);

  const colPicker = document.getElementById('columnPicker');
  document.addEventListener('click', (e) => {
    if (!colPicker.contains(e.target)) {
      colPicker.removeAttribute('open');
    }
  });

  const exportButton = document.getElementById('exportButton');
  exportButton.addEventListener('click', () => {
    table.export('yatl-export');
  })

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (event) => {
    table.searchQuery = searchInput.value;
  });

  const startDateInput = document.getElementById("startDateInput");
  const endDateInput = document.getElementById("endDateInput");
  function updateFilters() {
    table.filters = { lastModified: { startDate, endDate } };
  }

  // Parse our strings when the inputs change to speed up filter performance
  startDateInput.onchange = (event) => {
    startDate = Date.fromIsoString(startDateInput.value);
    endDateInput.min = startDateInput.value;
    updateFilters();
  };
  endDateInput.onchange = (event) => {
    endDate = Date.fromIsoString(endDateInput.value);
    endDate?.setHours(23, 59, 59, 999);
    startDateInput.max = endDateInput?.value;
    updateFilters();
  };
});

function refreshColumnPicker(list) {
  // Clear existing
  list.innerHTML = '';

  table.columnVisibility.forEach(col => {
    
    // Label wrapper
    const label = document.createElement('label');
    label.className = 'col-item';

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = col.visible;

    checkbox.addEventListener('change', (e) => {
      table.setColumnVisibility(col.field, e.target.checked);
    });

    // Text
    const span = document.createElement('span');
    // Find the human-readable title from the original definitions
    const def = findColumn(col.field, table.columns);
    span.textContent = def?.title ? def.title : col.field;

    label.appendChild(checkbox);
    label.appendChild(span);
    list.appendChild(label);
  });
}

/**
 * Generates an array of mock data objects for populating a table.
 *
 * @param {number} count - The number of data rows to generate.
 * @returns {Array<Object>} An array of generated data objects.
 */
function generateMockData(count) {
  // --- Data sources for randomization ---
  const itemNouns = ['System', 'Module', 'Component', 'API', 'Database', 'Report', 'Dashboard', 'Feature'];
  const itemModifiers = ['Alpha', 'Bravo', 'Phoenix', 'Orion', 'Pegasus', 'Andromeda', 'Cygnus', 'Vega'];
  const statuses = ['Completed', 'In Progress', 'Pending', 'Failed', 'On Hold', 'Needs Review'];
  const possibleTags = ['urgent', 'bugfix', 'feature', 'ui', 'backend', 'database', 'critical', 'needs-review', 'mobile', 'web', 'refactor'];

  const generatedData = [];

  // --- Helper function to get a random element from an array ---
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  for (let i = 1; i <= count; i++) {
    // --- 1. Generate a random date (+- 1 year from now) ---
    const today = new Date();
    const oneYearInMillis = 365 * 24 * 60 * 60 * 1000;
    const randomTimeOffset = (Math.random() * 2 * oneYearInMillis) - oneYearInMillis;
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
