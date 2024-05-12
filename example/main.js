import { DataTable } from "../src/datatable.js";

Date.prototype.addDays = function (days) {
  const date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

// Generate random rows of data
function createData(count) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Array(count).fill(null).map((v, i) => ({
    // Uncomment this to provide your own random indexes.
    //index: Math.floor(Math.random() * count),
    name: `Row ${i}`,
    // Random date within a year
    date: today.addDays(Math.floor(Math.random() * 365)),
    quantity: Math.floor(Math.random() * 10),
    cost: Math.random() * 1000,
  }));
}

const dateFormatter = new Intl.DateTimeFormat("en-US");
const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dt = new DataTable({
  table: "#table",
  // Create lots of data
  data: createData(1_000_000),
  columns: [
    {
      field: "name",
      title: "Name",
      searchable: true,
      sortable: true,
    },
    {
      field: "date",
      title: "Date Created",
      sortable: true,
      sorter: (a, b) => a.getTime() - b.getTime(),
      compare: (value, filter) => value.getTime() === filter.getTime(),
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
  ],
});

window.addEventListener("load", () => {
  const searchInput = document.getElementById("searchInput");
  const dateInput = document.getElementById("dateInput");
  const caption = document.getElementById("rowCount");
  const updateRowCount = () => (caption.innerText = dt.length);

  // Search table on input
  searchInput.addEventListener("input", (event) => {
    dt.search(new RegExp(searchInput.value));
    updateRowCount();
  });

  // Filter table on date change
  dateInput.addEventListener("change", (event) => {
    const filters = {};
    if (dateInput.value !== "") {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format:~:text=date%2Donly%20forms%20are%20interpreted%20as%20a%20UTC%20time%20and%20date%2Dtime%20forms%20are%20interpreted%20as%20local%20time
      // Date only strings are parsed as UTC timezone but datetime strings are parsed as local time.
      // Make sure this is parsed as local time to match our generated dates.
      filters["date"] = new Date(dateInput.value + "T00:00:00");
    }
    dt.filter(filters);
    updateRowCount();
  });

  updateRowCount();
});
