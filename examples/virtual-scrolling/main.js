import { DataTable } from "../../dist/esm/datatable.js";

/** @type {DataTable} */
let dataTable;

window.addEventListener("load", () => {
  dataTable = new DataTable("table", {
    columns: [
      { field: "id", title: "ID", sortable: true},
      { field: "name", title: "Name", sortable: true},
      { field: "age", title: "Age", sortable: true},
      { field: "city", title: "City"},
    ],
    resizable: true,
    rearrangeable: true,
  });

  // Update the table data when the row count changes
  const rowCountInput = document.getElementById("rowCount");
  rowCountInput.addEventListener("input", () => {
    updateData();
  });

  // Update the virtual scrolling setting
  const virtualScrollingWrapper = document.getElementById("virtualScrolling");
  virtualScrollingWrapper.addEventListener("change", (event) => {
    updateVirtualScroll();
  });

  updateVirtualScroll();
  updateData();
});

const updateData = () => {
  const rowCount = parseInt(document.getElementById("rowCount").value, 10);
  const data = Array.from({ length: rowCount }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    age: Math.floor(Math.random() * 100),
    city: ["New York", "Los Angeles", "Chicago", "Houston"][i % 4],
  }));
  dataTable.loadData(data);
  document.getElementById("totalRows").textContent = data.length.toLocaleString();
  updateVirtualScrollStatus();
};

const updateVirtualScroll = () => {
  const value = document.querySelector('input[name="virtualScrolling"]:checked').value;
  dataTable.virtualScroll = value === "auto" ? 1000 : value === "on";
  updateVirtualScrollStatus();
}

const updateVirtualScrollStatus = () => {
  document.getElementById("virtualScrollStatus").textContent = dataTable.virtualScrollStatus ? "Active" : "Inactive";
}