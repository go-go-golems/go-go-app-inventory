// @ts-check
__card__({
  id: 'priceCheck',
  packId: 'ui.card.v1',
  title: 'Price Checker',
  icon: '🏷',
});

__doc__({
  name: 'priceCheck',
  summary: 'Single-field lookup card for checking current price and stock.',
  tags: ['inventory', 'lookup', 'forms'],
  related: ['ui.input', 'ui.badge'],
});

doc`
---
symbol: priceCheck
---
The priceCheck card is the smallest form example in the inventory stack. It shows how a simple
lookup flow can still use the same draft/result pattern as larger cards.
`;

defineCard(
  'priceCheck',
  ({ ui }) => ({
    render({ state }) {
      const draftState = draft(state);
      const form = asRecord(draftState.form);
      const submitResult = String(draftState.submitResult || '');
      return ui.panel([
        ui.text('Price Checker'),
        ui.row([
          ui.text('SKU:'),
          ui.input(String(form.sku || ''), { onChange: { handler: 'change', args: { field: 'sku' } } }),
        ]),
        submitResult ? ui.badge(submitResult) : ui.text(''),
        ui.button('🔍 Look Up Price', { onClick: { handler: 'submit' } }),
      ]);
    },
    handlers: {
      change({ dispatch }, args) {
        dispatch({
          type: 'draft.set',
          payload: {
            path: 'form.sku',
            value: String(asRecord(args).value || ''),
          },
        });
      },
      submit({ dispatch, state }) {
        const sku = String(asRecord(draft(state).form).sku || '').trim();
        const item = findItem(state, sku);
        if (!item) {
          dispatch({
            type: 'draft.set',
            payload: {
              path: 'submitResult',
              value: '❌ SKU "' + sku + '" not found',
            },
          });
          return;
        }
        dispatch({
          type: 'draft.set',
          payload: {
            path: 'submitResult',
            value:
              '✅ ' +
              String(asRecord(item).name || '') +
              ' — ' +
              toMoney(asRecord(item).price) +
              ' (' +
              String(toNumber(asRecord(item).qty, 0)) +
              ' in stock)',
          },
        });
      },
    },
  }),
  'ui.card.v1',
);
