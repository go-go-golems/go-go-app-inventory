// @ts-check
__card__({
  id: 'browse',
  packId: 'ui.card.v1',
  title: 'Browse Inventory',
  icon: '📋',
});

__doc__({
  name: 'browse',
  summary: 'Inventory listing card with quick-open actions for individual SKUs.',
  tags: ['inventory', 'table', 'browse'],
  related: ['ui.table', 'ui.column', 'itemDetail'],
});

doc`
---
symbol: browse
---
The browse card demonstrates a table-heavy ui.card.v1 screen. It renders all inventory rows and a
secondary quick-open action column for jumping into item detail.
`;

defineRuntimeSurface(
  'browse',
  ({ ui }) => ({
    render({ state }) {
      const items = selectItems(state);
      const quickOpen = items.slice(0, 10).map((item) => {
        const row = asRecord(item);
        const sku = String(row.sku || '');
        return ui.button('Open ' + sku, { onClick: { handler: 'open', args: { sku } } });
      });

      return ui.panel([
        ui.text('Browse Inventory (' + items.length + ' items)'),
        ui.table(itemRows(items), { headers: ['SKU', 'Name', 'Category', 'Price', 'Qty'] }),
        ui.text('Quick open:'),
        ui.column(quickOpen),
        ui.row([
          ui.button('➕ New Item', { onClick: { handler: 'go', args: { cardId: 'newItem' } } }),
          ui.button('🏠 Home', { onClick: { handler: 'go', args: { cardId: 'home' } } }),
        ]),
      ]);
    },
    handlers: {
      go({ dispatch }, args) {
        dispatch({ type: 'nav.go', payload: { cardId: String(asRecord(args).cardId || 'home') } });
      },
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
