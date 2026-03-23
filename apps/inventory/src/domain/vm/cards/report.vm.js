// @ts-check
__card__({
  id: 'report',
  packId: 'ui.card.v1',
  title: 'Inventory Report',
  icon: '📊',
});

__doc__({
  name: 'report',
  summary: 'Derived metrics report card for the inventory and sales slices.',
  tags: ['inventory', 'reporting', 'metrics'],
  related: ['ui.table', 'ui.button'],
});

doc`
---
symbol: report
---
The report card demonstrates a read-only summary card built from derived metrics rather than raw
records. It is useful as a compact example of a reporting-style ui.card.v1 page.
`;

defineRuntimeSurface(
  'report',
  ({ ui }) => ({
    render({ state }) {
      return ui.panel([
        ui.text('Inventory Report'),
        ui.table(reportRows(state), { headers: ['Metric', 'Value'] }),
        ui.row([
          ui.button('🖨 Print', { onClick: { handler: 'notify', args: { message: 'Report sent to printer (mock)' } } }),
          ui.button('📧 Email', { onClick: { handler: 'notify', args: { message: 'Report emailed (mock)' } } }),
        ]),
      ]);
    },
    handlers: {
      notify({ dispatch }, args) {
        dispatch({ type: 'notify.show', payload: { message: String(asRecord(args).message || '') } });
      },
    },
  }),
  'ui.card.v1',
);
