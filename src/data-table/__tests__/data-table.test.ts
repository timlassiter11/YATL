import { html, fixture, expect, oneEvent } from '@open-wc/testing';
import '../data-table'; // Import your component definition
import { ColumnOptions, YatlTable } from '../data-table'; // Import the class type

type DataType = {
  id: number;
  name: string;
  role: string
}

const mockColumns: ColumnOptions<DataType>[] = [
  { field: 'name', title: 'Name' },
  { field: 'role', title: 'Role' }
];

const mockData: DataType[] = [
  { id: 1, name: 'Alice', role: 'Dev' },
  { id: 2, name: 'Bob', role: 'Manager' }
];

describe('YatlTable', () => {
  
  // Test 1: Basic Rendering
  it('renders with default values', async () => {
    // 1. The 'fixture' helper mounts the component to the DOM
    const el = await fixture<YatlTable<DataType>>(html`<yatl-table></yatl-table>`);

    // 2. Check if it upgraded to a Custom Element
    expect(el).to.be.instanceOf(YatlTable);
    
    // 3. Check Shadow DOM existence
    //expect(el.shadowRoot).to.exist;
  });

  // Test 2: Data Binding & Rendering Rows
  it('renders rows when data is provided', async () => {
    const el = await fixture<YatlTable<DataType>>(html`<yatl-table></yatl-table>`);

    // Assign properties
    el.columns = mockColumns;
    el.data = mockData;

    // CRITICAL: Wait for Lit to finish the render cycle
    await el.updateComplete;

    // Query the Shadow DOM to verify rendering
    // Note: If using virtualizer, rows might be wrapped in the scroller
    const rows = el.shadowRoot!.querySelectorAll('.row');
    expect(rows.length).to.equal(2);
    
    // Check content of first cell
    const firstCell = rows[0].querySelector('.td');
    expect(firstCell).to.have.text('Alice');
  });

  // Test 3: Event Dispatching (Interaction)
  it('dispatches row-click event with correct data', async () => {
    const el = await fixture<YatlTable<DataType>>(html`<yatl-table></yatl-table>`);
    el.columns = mockColumns;
    el.data = mockData;
    await el.updateComplete;

    const firstRow = el.shadowRoot!.querySelector('.row') as HTMLElement;

    // 1. Set up the listener promise using 'oneEvent' helper
    // This waits for the next event of this name to fire
    const listener = oneEvent(el, 'row-click');

    // 2. Trigger the interaction
    firstRow.click();

    // 3. Await the event
    const { detail } = await listener;

    expect(detail.row).to.deep.equal(mockData[0]);
  });

  // Test 4: Public API & State Updates
  it('hides a column via toggleColumn method', async () => {
    const el = await fixture<YatlTable<DataType>>(html`<yatl-table></yatl-table>`);
    el.columns = mockColumns;
    el.data = mockData;
    await el.updateComplete;

    // Initial check: 2 columns visible
    let headers = el.shadowRoot!.querySelectorAll('.th');
    expect(headers.length).to.equal(2);

    // Call your convenience method
    el.hideColumn('role');

    // Wait for re-render
    await el.updateComplete;

    // Verify 'role' column is gone from DOM
    headers = el.shadowRoot!.querySelectorAll('.th');
    expect(headers.length).to.equal(1);
    expect(headers[0]).to.have.text('Name');
  });
  
  // Test 5: Accessibility (Optional but recommended)
  it('passes accessibility audit', async () => {
    const el = await fixture<YatlTable<DataType>>(html`<yatl-table></yatl-table>`);
    await expect(el).to.be.accessible();
  });
});