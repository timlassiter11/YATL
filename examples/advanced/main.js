import { DataTable, DataTableRowEvent } from "../../src/datatable.js";

let dt;

window.addEventListener("load", () => {
  const columns = [
    {
      field: "name",
      title: "Name",
      searchable: true,
      sortable: true,
    },
    {
      field: "due_date",
      title: "Due Date",
      sortable: true,
      sorter: (a, b) => a.getTime() - b.getTime(),
      compare: (value, filter) => {
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
      formatter: (date, element) => dateFormatter.format(date),
    },
    {
      field: "quantity",
      title: "Quantity",
      sortable: true,
      formatter: (qty, element) => qty.toFixed(1),
    },
    {
      field: "cost",
      title: "Cost",
      sortable: true,
      formatter: (cost, element) => moneyFormatter.format(cost),
    },
  ];

  const table = document.getElementById("table");
  table.addEventListener("dt.row.click", (event) => {
    if (event instanceof DataTableRowEvent) {
      console.log(event.row);
    }
  });

  // Pull count from url param
  const url = new URL(location);
  let count = parseInt(url.searchParams.get("count"));
  count = isNaN(count) ? 100000 : count;

  dt = new DataTable({
    table: table,
    columns: columns,
    formatter: rowFormatter,
    data: createData(count),
  });

  // Create visibility toggles for each column
  const colList = document.getElementById("colSelectDropdown");
  for (const col of columns) {
    const li = document.createElement("li");
    const wrapper = document.createElement("div");
    wrapper.className = "form-check dropdown-item";
    const input = document.createElement("input");
    input.type = "checkbox";
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

    col.input = input;

    wrapper.onclick = () => input.click();
    input.onchange = (event) => {
      dt.setColumnVisibility(col.field, input.checked);

      // Count all visiable columns
      const visibleColumns = columns.reduce((accumulator, col) => {
        if (col.visible) {
          accumulator.push(col);
        }
        return accumulator;
      }, []);

      // If we only have one visible column left, disable it.
      // We have to have at least one column!
      if (visibleColumns.length === 1) {
        visibleColumns[0].input.disabled = true;
      } else {
        // Easier to just enable all columns
        // than it is to check which one is disabled.
        for (const col of visibleColumns) {
          col.input.disabled = false;
        }
      }
    };
  }

  const searchInput = document.getElementById("searchInput");
  // Search table on input
  searchInput.addEventListener("input", (event) => {
    dt.search(new RegExp(searchInput.value));
    updateRowCount();
  });

  updateRowCount();

  document
    .getElementById("exportTable")
    .addEventListener("click", () => dt.export("DataTable", false));
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
  document.getElementById("rowCount").innerText = dt.length.toLocaleString();
}

function rowFormatter(row, element) {
  if (row.due_date.getTime() < today.getTime()) {
    element.classList.add("past-due");
  }
}

const dateFormatter = new Intl.DateTimeFormat("en-US");
const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const startDateInput = document.getElementById("startDateInput");
const endDateInput = document.getElementById("endDateInput");
function updateFilters() {
  dt.filter({ due_date: { startDate, endDate } });
  updateRowCount();
}

// Parse our strings when the inputs change to speed up filter performance
let startDate, endDate;
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

const filterWrapper = document.querySelector(".filter-wrapper");
document.getElementById("filterToggle").onclick = () => {
  if (filterWrapper.classList.contains("hide")) {
    filterWrapper.classList.remove("hide");
  } else {
    filterWrapper.classList.add("hide");
  }
};
