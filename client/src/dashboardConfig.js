// Maps the leads/sales dashboard metrics to the Airtable schema.
// Leads base → "Proposals Sent" table: each row has a Date, a VA, and numeric
// "Proposals Sent" / "Booked Calls" columns — so the metrics are SUMS of those
// columns within the selected date range (proposals also broken down by VA).
export const DASHBOARD = {
  baseLabel: 'Leads',
  table: 'Proposals Sent',
  dateField: 'Date',
  proposalsField: 'Proposals Sent',
  repliesField: 'Replies',
  bookedCallsField: 'Booked Calls',
  costField: 'Cost',
  // Dashboard dropdown filter. `options` are curated — each matches one or more
  // values of `field`. The first option is the default.
  dimension: {
    field: 'Service',
    label: 'Service',
    // `values` matches the Airtable Service field; `boards` maps to the kanban
    // boards for the Proposal cost card (Shopify → Lucas, Shopify2 → Gustavo).
    options: [
      { label: 'Shopify + Shopify2', values: ['Shopify', 'Shopify2'], boards: ['lucas', 'gustavo'] },
      { label: 'Shopify', values: ['Shopify'], boards: ['lucas'] },
      { label: 'Shopify2', values: ['Shopify2'], boards: ['gustavo'] },
    ],
  },
}

export const isConfigured = () =>
  Boolean(DASHBOARD.baseLabel && DASHBOARD.table && DASHBOARD.dateField)
