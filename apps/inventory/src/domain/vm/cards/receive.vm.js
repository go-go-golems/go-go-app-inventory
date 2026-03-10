// @ts-check
__card__({
  id: 'receive',
  packId: 'ui.card.v1',
  title: 'Receive Shipment',
  icon: '📦',
});

__doc__({
  name: 'receive',
  summary: 'Receiving workflow for adding stock back into inventory.',
  tags: ['inventory', 'receiving', 'forms'],
  related: ['ui.input', 'ui.badge'],
});

doc`
---
symbol: receive
---
The receive card is a compact form workflow for stock intake. It demonstrates draft-backed form
state and a simple success/error result badge.
`;

defineCard(
  'receive',
  ({ ui }) => ({
    render({ state }) {
      const draftState = draft(state);
      const form = asRecord(draftState.form);
      const submitResult = String(draftState.submitResult || '');
      return ui.panel([
        ui.text('Receive Shipment'),
        ui.row([
          ui.text('SKU:'),
          ui.input(String(form.sku || ''), { onChange: { handler: 'change', args: { field: 'sku' } } }),
        ]),
        ui.row([
          ui.text('Qty:'),
          ui.input(String(toNumber(form.qty, 1)), { onChange: { handler: 'change', args: { field: 'qty' } } }),
        ]),
        ui.row([
          ui.text('Note:'),
          ui.input(String(form.note || ''), { onChange: { handler: 'change', args: { field: 'note' } } }),
        ]),
        submitResult ? ui.badge(submitResult) : ui.text(''),
        ui.button('📦 Receive Stock', { onClick: { handler: 'submit' } }),
      ]);
    },
    handlers: {
      change({ dispatch }, args) {
        const field = String(asRecord(args).field || '');
        if (!field) return;
        let value = asRecord(args).value;
        if (field === 'qty') {
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
        const qty = toNumber(form.qty, 0);
        if (!sku || qty <= 0) {
          dispatch({
            type: 'draft.set',
            payload: {
              path: 'submitResult',
              value: '❌ SKU and qty are required',
            },
          });
          return;
        }

        dispatch({ type: 'inventory/receiveStock', payload: { sku, qty } });
        dispatch({
          type: 'draft.patch',
          payload: {
            form: { sku: '', qty: 1, note: '' },
            submitResult: '✅ Received +' + String(qty) + ' for ' + sku,
          },
        });
        dispatch({ type: 'notify.show', payload: { message: 'Received stock for ' + sku } });
      },
    },
  }),
  'ui.card.v1',
);
