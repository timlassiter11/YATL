import { DataTable, LocalStorageAdapter } from "../../dist/datatable.mjs"

/**
 * @type {DataTable}
 */
let dataTable;

window.addEventListener("load", () => {
  const table = document.getElementById("table");
  table.addEventListener(DataTable.Events.ROW_CLICK, (event) => {
    const row = event.detail.row;
    const index = event.detail.index;
    console.log("Row clicked:", row, index);
  });

  // Pull count from url param
  const url = new URL(location);
  let count = parseInt(url.searchParams.get("count"));
  count = isNaN(count) ? 100000 : count;

  dataTable = new DataTable(table, {
    sortable: true,
    resizable: true,

    columns: [
      {
        field: "name",
        searchable: true,
        sortable: true,
      },
      {
        field: "due_date",
        sortable: true,
        sortValue: (value) => value.getTime(),
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
        field: "quantity",
        sortable: true,
        valueFormatter: (qty) => qty.toFixed(1),
      },
      {
        field: "cost",
        sortable: true,
        valueFormatter: (cost) => moneyFormatter.format(cost),
      },
    ],
    rowFormatter: rowFormatter,
    data: createData(count),
    virtualScroll: 1000,
    rearrangeable: true,
  });

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

  // Search table on input
  searchInput.addEventListener("input", (event) => {
    try {
      const query = searchInput.value === "" ? null : searchInput.value;
      if (regexToggle.classList.contains("active") && query) {
        dataTable.search(new RegExp(query, "i"));
      } else {
        dataTable.search(query);
      }
      updateRowCount();
    } catch { }
  });

  const startDateInput = document.getElementById("startDateInput");
  const endDateInput = document.getElementById("endDateInput");
  function updateFilters() {
    dataTable.filter({ due_date: { startDate, endDate } });
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
    startDateInput.max = endDateInput.value;
    updateFilters();
  };

  document.getElementById("exportTable").addEventListener("click", () => dataTable.export("DataTable", false));

  updateRowCount();
});

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

const today = new Date();
today.setHours(0, 0, 0, 0);
let startDate, endDate;

const dateFormatter = new Intl.DateTimeFormat("en-US");
const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Generate random rows of data
function createData(count) {
  const randomDate = (from, delta) => {
    const min = -delta,
      max = delta;
    const deltaDays = Math.floor(Math.random() * (max - min + 1) + min);
    return from.addDays(deltaDays);
  };

  today.setHours(0, 0, 0, 0);
  return new Array(count).fill(null).map((v, i) => ({
    // Uncomment below to provide your own random indexes.
    //index: Math.floor(Math.random() * count),
    name: `Row ${i}`,
    // Random date within a year
    due_date: randomDate(today, 365),
    quantity: Math.floor(Math.random() * 10),
    cost: Math.random() * 1000,
  }));
}

function updateRowCount() {
  document.getElementById("rowCount").innerText =
    dataTable.length.toLocaleString();
}

function rowFormatter(row, element) {
  if (row.due_date.getTime() < today.getTime()) {
    element.classList.add("past-due");
  }
}
