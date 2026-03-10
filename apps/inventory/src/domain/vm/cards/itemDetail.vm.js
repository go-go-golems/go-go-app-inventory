// @ts-check
__card__({
  id: 'itemDetail',
  packId: 'ui.card.v1',
  title: 'Item Detail',
  icon: '📦',
});

__doc__({
  name: 'itemDetail',
  summary: 'Editable item detail card with quantity deltas and draft-backed form state.',
  tags: ['inventory', 'detail', 'forms'],
  related: ['ui.input', 'ui.row', 'browse'],
});

doc`
---
symbol: itemDetail
---
The itemDetail card is the main editable form example in the inventory stack. It demonstrates
draft-backed field editing, optimistic quantity delta actions, and destructive item removal.
`;

defineCard(
  'itemDetail',
  ({ ui }) => ({
    render({ state }) {
      const sku = navParam(state);
      const record = findItem(state, sku);
      if (!record) {
        return ui.panel([
          ui.text('Item not found: ' + String(sku || '(none)')),
          ui.button('← Back', { onClick: { handler: 'back' } }),
        ]);
      }

      const edits = asRecord(draft(state).edits);
      const current = { ...asRecord(record), ...edits };

      return ui.panel([
        ui.text('Item Detail: ' + String(current.sku || '')),
        ui.row([
          ui.text('Name:'),
          ui.input(String(current.name || ''), { onChange: { handler: 'change', args: { field: 'name' } } }),
        ]),
        ui.row([
          ui.text('Category:'),
          ui.input(String(current.category || ''), { onChange: { handler: 'change', args: { field: 'category' } } }),
        ]),
        ui.row([
          ui.text('Price:'),
          ui.input(String(toNumber(current.price, 0)), { onChange: { handler: 'change', args: { field: 'price' } } }),
        ]),
        ui.row([
          ui.text('Cost:'),
          ui.input(String(toNumber(current.cost, 0)), { onChange: { handler: 'change', args: { field: 'cost' } } }),
        ]),
        ui.row([
          ui.text('Qty:'),
          ui.input(String(toNumber(current.qty, 0)), { onChange: { handler: 'change', args: { field: 'qty' } } }),
        ]),
        ui.row([
          ui.text('Tags:'),
          ui.input(asArray(current.tags).join(', '), { onChange: { handler: 'change', args: { field: 'tags' } } }),
        ]),
        ui.row([
          ui.button('🛒 Sell 1', { onClick: { handler: 'delta', args: { delta: -1 } } }),
          ui.button('🛒 Sell 5', { onClick: { handler: 'delta', args: { delta: -5 } } }),
          ui.button('📦 Receive +5', { onClick: { handler: 'delta', args: { delta: 5 } } }),
          ui.button('📦 Receive +10', { onClick: { handler: 'delta', args: { delta: 10 } } }),
        ]),
        ui.row([
          ui.button('✏️ Save Changes', { onClick: { handler: 'save' } }),
          ui.button('🗑 Delete', { onClick: { handler: 'remove' } }),
          ui.button('← Back', { onClick: { handler: 'back' } }),
        ]),
      ]);
    },
    handlers: {
      back({ dispatch }) {
        dispatch({ type: 'nav.back' });
      },
      change({ dispatch }, args) {
        const field = String(asRecord(args).field || '');
        const value = asRecord(args).value;
        if (!field) return;

        let nextValue = value;
        if (field === 'qty' || field === 'price' || field === 'cost') {
          nextValue = toNumber(value, 0);
        }
        if (field === 'tags') {
          nextValue = parseTags(value);
        }

        dispatch({
          type: 'draft.set',
          payload: {
            path: 'edits.' + field,
            value: nextValue,
          },
        });
      },
      delta({ dispatch, state }, args) {
        const sku = navParam(state);
        if (!sku) return;
        dispatch({
          type: 'inventory/updateQty',
          payload: {
            sku,
            delta: toNumber(asRecord(args).delta, 0),
          },
        });
      },
      save({ dispatch, state }) {
        const sku = navParam(state);
        if (!sku) return;
        dispatch({
          type: 'inventory/saveItem',
          payload: {
            sku,
            edits: asRecord(draft(state).edits),
          },
        });
        dispatch({ type: 'draft.patch', payload: { edits: {} } });
        dispatch({ type: 'notify.show', payload: { message: 'Saved ' + sku } });
      },
      remove({ dispatch, state }) {
        const sku = navParam(state);
        if (!sku) return;
        dispatch({ type: 'inventory/deleteItem', payload: { sku } });
        dispatch({ type: 'notify.show', payload: { message: 'Deleted ' + sku } });
        dispatch({ type: 'nav.back' });
      },
    },
  }),
  'ui.card.v1',
);
