import { DataTable } from "../src/datatable.js";

Date.prototype.addDays = function(days) {
  const date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

// Generate random rows of data
function createData(count) {
  const today = new Date();
  return new Array(count).fill(null).map((v, i) => ({
    // Uncomment this to provide your own random indexes.
    //index: Math.floor(Math.random() * count),
    name: `Name ${i}`,
    date: today.addDays(Math.floor(Math.random() * 365)),
    quantity: Math.floor(Math.random() * 10),
    cost: Math.random() * 1000,
  }));
}

const dateFormatter = new Intl.DateTimeFormat('en-US');
const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const dt = new DataTable({
  table: "#table",
  // Create lots of data
  data: createData(100_000),
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
      formatter: (date, element) => dateFormatter.format(date)
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
      formatter: (cost, element) => moneyFormatter.format(cost)
    }
  ],
});

const input = document.querySelector("input");
input.addEventListener("input", (event) => dt.search(new RegExp(input.value)));
