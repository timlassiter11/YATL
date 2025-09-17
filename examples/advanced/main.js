import { DataTable, LocalStorageAdapter } from "../../dist/datatable.mjs";

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
 * @type {DataTable}
 */
let dataTable;

window.addEventListener("load", () => {
  const table = document.getElementById("table");

  // Pull count from url param
  const url = new URL(location);
  let count = parseInt(url.searchParams.get("count"));
  count = isNaN(count) ? 100000 : count;

  dataTable = new DataTable(table, {
    sortable: true,
    resizable: true,

    columns: [
      {
        field: "id",
        title: "ID",
        sortable: true,
        searchable: false,
      },
      {
        field: "name",
        title: "Item Name",
        sortable: true,
        searchable: true,
        tokenize: true,
      },
      {
        field: "status",
        title: "Status",
        sortable: true,
        searchable: false,
      },
      {
        field: "lastModified",
        sortable: true,
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
      },
      {
        field: "tags",
        sortable: true,
        searchable: true,
        tokenize: true,
        elementFormatter: (tags, row, element) => {
          tags = tags.split(',');
          element.innerHTML = '';
          for (const tag of tags) {
            const span = document.createElement("span");
            span.innerText = tag;
            span.classList.add("rounded-pill", "p-1", "m-1");

            switch (tag) {
              case 'urgent':
              case 'critical':
                span.classList.add("bg-danger");
                break;
              case 'bugfix':
                span.classList.add("bg-warning");
                break;
              default:
                span.classList.add("bg-secondary");
                break;
            }

            element.append(span);
          }

        }
      },
    ],
    rowFormatter: rowFormatter,
    data: generateMockData(count),
    virtualScroll: true,
    rearrangeable: true,
  });

  dataTable.addEventListener('dt.row.clicked', (event) => {
    console.log("Row clicked:", event.detail.row, event.detail.index);
  })

  window.dataTable = dataTable;

  new LocalStorageAdapter(dataTable, "advancedExampleTableState");

  const columnToggles = {}

  // Create visibility toggles for each column
  const colList = document.getElementById("colSelectDropdown");
  for (const col of dataTable.columnStates) {
    const li = document.createElement("li");
    const wrapper = document.createElement("div");
    wrapper.className = "form-check dropdown-item";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.style.pointerEvents = "none";
    input.className = "form-check-input";
    input.id = `${col.field}ColToggle`;
    input.checked = col.visible;
    const label = document.createElement("label");
    label.className = "form-check-label";
    label.for = input.id;
    label.innerText = col.title;

    wrapper.append(input, label);
    li.append(wrapper);
    colList.append(li);

    columnToggles[col.field] = wrapper;

    wrapper.onclick = () => {
      input.checked = !input.checked;
      dataTable.setColumnVisibility(col.field, input.checked);

      // Count all visiable columns
      const visibleColumns = dataTable.columnStates.reduce((accumulator, col) => {
        if (col.visible) {
          accumulator.push(col.field);
        }
        return accumulator;
      }, []);

      // If we only have one visible column left, disable it.
      // We have to have at least one column!
      if (visibleColumns.length === 1) {

        columnToggles[visibleColumns[0]].classList.add("disabled");
      } else {
        // Easier to just enable all columns
        // than it is to check which one is disabled.
        for (const col of visibleColumns) {
          columnToggles[col].classList.remove("disabled");
        }
      }
    };
  }

  const searchInput = document.getElementById("searchInput");

  const regexToggle = document.getElementById("regexToggle");
  regexToggle.onclick = () =>
  (searchInput.placeholder = regexToggle.classList.contains("active")
    ? "Regex Search"
    : "Search");

  const scoringToggle = document.getElementById("scoringToggle");
  
  if (dataTable.scoring) {
    scoringToggle.classList.add("active");
  } else {
    scoringToggle.classList.remove("active");
  }

  scoringToggle.onclick = () => {
    dataTable.scoring = scoringToggle.classList.contains("active");
  }

  // Search table on input but add debouncing
  let debounceTimer;
  searchInput.addEventListener("input", (event) => {
    clearTimeout(debounceTimer);

    // Set a new timeout
    debounceTimer = setTimeout(() => {
      try {
        const query = searchInput.value === "" ? null : searchInput.value;
        if (regexToggle.classList.contains("active") && query) {
          dataTable.search(new RegExp(query, "i"));
        } else {
          dataTable.search(query);
        }
        updateRowCount();
      } catch { }
    }, 300);


  });

  const startDateInput = document.getElementById("startDateInput");
  const endDateInput = document.getElementById("endDateInput");
  function updateFilters() {
    dataTable.filter({ lastModified: { startDate, endDate } });
    updateRowCount();
  }

  // Parse our strings when the inputs change to speed up filter performance
  startDateInput.onchange = (event) => {
    startDate = Date.fromIsoString(startDateInput.value);
    endDateInput.min = startDateInput.value;
    updateFilters();
  };
  endDateInput.onchange = (event) => {
    endDate = Date.fromIsoString(endDateInput.value);
    endDate.setHours(23, 59, 59, 999);
    startDateInput.max = endDateInput.value;
    updateFilters();
  };

  document.getElementById("exportTable").addEventListener("click", () => dataTable.export("DataTable", false));

  updateRowCount();
});

/**
 * Generates an array of mock data objects for populating a table.
 *
 * @param {number} count - The number of data rows to generate.
 * @returns {Array<Object>} An array of generated data objects.
 */
function generateMockData(count) {
  // --- Data sources for randomization ---
  const itemNouns = ['System', 'Module', 'Component', 'API', 'Database', 'Report', 'Dashboard', 'Feature'];
  const itemModifiers = ['Alpha', 'Bravo', 'Phoenix', 'Orion', 'Pegasus', 'Andromeda', 'Cygnus', 'Vega', 'OIC-CPC001'];
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


function updateRowCount() {
  const rowCountElement = document.getElementById("rowCount");
  if (rowCountElement) {
    const filteredRowCount = dataTable.rows.length;
    const totalRowCount = dataTable.data.length;
    let text = "Rows: ";
    if (filteredRowCount === totalRowCount) {
      text += filteredRowCount.toLocaleString();
    } else {
      text += filteredRowCount.toLocaleString() + " of " + totalRowCount.toLocaleString();
    }

    rowCountElement.innerText = text;
  }
}

function rowFormatter(row, element) {
  const tags = row.tags;
  if (typeof tags === "string") {
    if (tags.includes("critical")) {
      element.classList.add("critical");
    } else if (tags.includes("urgent")) {
      element.classList.add("urgent");
    } else if (tags.includes("bugfix")) {
      element.classList.add("bugfix");
    }
  }
}
