// @ts-check
__card__({
  id: 'newItem',
  packId: 'ui.card.v1',
  title: 'New Item',
  icon: '➕',
});

__doc__({
  name: 'newItem',
  summary: 'Creation form for adding a new inventory item.',
  tags: ['inventory', 'create', 'forms'],
  related: ['ui.input', 'home'],
});

doc`
---
symbol: newItem
---
The newItem card demonstrates a full create flow with validation, draft state, and success
notifications using the ui.card.v1 primitives.
`;

defineRuntimeSurface(
  'newItem',
  ({ ui }) => ({
    render({ state }) {
      const draftState = draft(state);
      const form = asRecord(draftState.form);
      const submitResult = String(draftState.submitResult || '');
      return ui.panel([
        ui.text('Create New Item'),
        ui.row([
          ui.text('SKU:'),
          ui.input(String(form.sku || ''), { onChange: { handler: 'change', args: { field: 'sku' } } }),
        ]),
        ui.row([
          ui.text('Name:'),
          ui.input(String(form.name || ''), { onChange: { handler: 'change', args: { field: 'name' } } }),
        ]),
        ui.row([
          ui.text('Category:'),
          ui.input(String(form.category || ''), { onChange: { handler: 'change', args: { field: 'category' } } }),
        ]),
        ui.row([
          ui.text('Price:'),
          ui.input(String(toNumber(form.price, 0)), { onChange: { handler: 'change', args: { field: 'price' } } }),
        ]),
        ui.row([
          ui.text('Cost:'),
          ui.input(String(toNumber(form.cost, 0)), { onChange: { handler: 'change', args: { field: 'cost' } } }),
        ]),
        ui.row([
          ui.text('Qty:'),
          ui.input(String(toNumber(form.qty, 0)), { onChange: { handler: 'change', args: { field: 'qty' } } }),
        ]),
        submitResult ? ui.badge(submitResult) : ui.text(''),
        ui.row([
          ui.button('💾 Create Item', { onClick: { handler: 'submit' } }),
          ui.button('🏠 Home', { onClick: { handler: 'goHome' } }),
        ]),
      ]);
    },
    handlers: {
      change({ dispatch }, args) {
        const field = String(asRecord(args).field || '');
        if (!field) return;
        let value = asRecord(args).value;
        if (field === 'price' || field === 'cost' || field === 'qty') {
          value = toNumber(value, 0);
        }
        dispatch({
          type: 'draft.set',
          payload: {
            path: 'form.' + field,
            value,
          },
        });
      },
      submit({ dispatch, state }) {
        const form = asRecord(draft(state).form);
        const sku = String(form.sku || '').trim();
        const name = String(form.name || '').trim();
        if (!sku || !name) {
          dispatch({
            type: 'draft.set',
            payload: {
              path: 'submitResult',
              value: '❌ SKU and Name are required',
            },
          });
          return;
        }

        dispatch({
          type: 'inventory/createItem',
          payload: {
            sku,
            name,
            category: String(form.category || 'Accessories'),
            price: toNumber(form.price, 0),
            cost: toNumber(form.cost, 0),
            qty: toNumber(form.qty, 0),
            tags: [],
          },
        });

        dispatch({
          type: 'draft.patch',
          payload: {
            form: { sku: '', name: '', category: 'Accessories', price: 0, cost: 0, qty: 0 },
            submitResult: '✅ Created ' + sku,
          },
        });
        dispatch({ type: 'notify.show', payload: { message: 'Created ' + sku } });
      },
      goHome({ dispatch }) {
        dispatch({ type: 'nav.go', payload: { surfaceId: 'home' } });
      },
    },
  }),
  'ui.card.v1',
);
