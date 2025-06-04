import { DataTable } from "../../dist/datatable.mjs";

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

  // Watch for changes in the table to update the number of rendered rows.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        updateRenderedRows();
      }
    }
  });
  observer.observe(dataTable.table, { childList: true, subtree: true });

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
  updateRenderedRows();
};

const updateVirtualScroll = () => {
  const value = document.querySelector('input[name="virtualScrolling"]:checked').value;
  dataTable.virtualScroll = value === "on";
  updateRenderedRows();
}

const updateRenderedRows = () => {
  const renderedRows = dataTable.table.querySelectorAll("tbody tr").length;
  document.getElementById("renderedRows").textContent = renderedRows.toLocaleString();
}
