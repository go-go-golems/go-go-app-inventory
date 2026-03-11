// @ts-check
__card__({
  id: 'salesToday',
  packId: 'ui.card.v1',
  title: 'Sales Log',
  icon: '💰',
});

__doc__({
  name: 'salesToday',
  summary: 'Sales log card that summarizes recent orders and links back to sold inventory items.',
  tags: ['inventory', 'sales', 'table'],
  related: ['ui.table', 'itemDetail'],
});

doc`
---
symbol: salesToday
---
The salesToday card shows how a ui.card.v1 card can render derived totals alongside a table and a
secondary navigation list.
`;

defineRuntimeSurface(
  'salesToday',
  ({ ui }) => ({
    render({ state }) {
      const entries = selectSales(state);
      const quickOpen = entries.slice(0, 10).map((sale) => {
        const row = asRecord(sale);
        const sku = String(row.sku || '');
        return ui.button('Open item ' + sku, { onClick: { handler: 'open', args: { sku } } });
      });

      const total = entries.reduce((sum, sale) => sum + toNumber(asRecord(sale).total, 0), 0);

      return ui.panel([
        ui.text('Sales Log (' + entries.length + ' entries)'),
        ui.table(salesRows(entries), { headers: ['ID', 'Date', 'SKU', 'Qty', 'Total'] }),
        ui.badge('Total Revenue: ' + toMoney(total)),
        ui.text('Quick open sold SKU:'),
        ui.column(quickOpen),
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
    },
  }),
  'ui.card.v1',
);
