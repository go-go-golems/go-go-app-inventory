// @ts-check
__card__({
  id: 'lowStock',
  packId: 'ui.card.v1',
  title: 'Low Stock',
  icon: '⚠️',
});

__doc__({
  name: 'lowStock',
  summary: 'Threshold-based inventory triage view for low or empty stock.',
  tags: ['inventory', 'triage', 'alerts'],
  related: ['ui.table', 'itemDetail'],
});

doc`
---
symbol: lowStock
---
The lowStock card filters inventory rows against the active threshold and demonstrates a simple
alert-style workflow with mock supplier and print actions.
`;

defineCard(
  'lowStock',
  ({ ui }) => ({
    render({ state }) {
      const low = threshold(state);
      const items = selectItems(state).filter((item) => toNumber(asRecord(item).qty, 0) <= low);
      const quickOpen = items.slice(0, 10).map((item) => {
        const row = asRecord(item);
        const sku = String(row.sku || '');
        return ui.button('Open ' + sku, { onClick: { handler: 'open', args: { sku } } });
      });

      return ui.panel([
        ui.text('Low Stock (threshold ≤ ' + String(low) + ')'),
        ui.table(itemRows(items), { headers: ['SKU', 'Name', 'Category', 'Price', 'Qty'] }),
        items.length === 0 ? ui.badge('All stocked up') : ui.text('Quick open:'),
        ui.column(quickOpen),
        ui.row([
          ui.button('📧 Email Supplier', { onClick: { handler: 'notify', args: { message: 'Reorder email drafted (mock)' } } }),
          ui.button('🖨 Print', { onClick: { handler: 'notify', args: { message: 'Sent to printer (mock)' } } }),
        ]),
      ]);
    },
    handlers: {
      open({ dispatch }, args) {
        dispatch({
          type: 'nav.go',
          payload: {
            cardId: 'itemDetail',
            param: String(asRecord(args).sku || ''),
          },
        });
      },
      notify({ dispatch }, args) {
        dispatch({ type: 'notify.show', payload: { message: String(asRecord(args).message || '') } });
      },
    },
  }),
  'ui.card.v1',
);
