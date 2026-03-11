// @ts-check
__card__({
  id: 'home',
  packId: 'ui.card.v1',
  title: 'Home',
  icon: '🏠',
});

__doc__({
  name: 'home',
  summary: 'Inventory landing card with quick links into the main inventory workflows.',
  tags: ['inventory', 'demo', 'navigation'],
  related: ['ui.panel', 'ui.button'],
});

doc`
---
symbol: home
---
The home card is the entry point for the inventory stack. It demonstrates a simple navigation card
built entirely from text and button primitives.
`;

defineRuntimeSurface(
  'home',
  ({ ui }) => ({
    render() {
      return ui.panel([
        ui.text('Welcome to Shop Inventory'),
        ui.text('Plugin DSL runtime'),
        ui.button('📋 Browse Items', { onClick: { handler: 'go', args: { surfaceId: 'browse' } } }),
        ui.button('⚠️ Low Stock', { onClick: { handler: 'go', args: { surfaceId: 'lowStock' } } }),
        ui.button('💰 Sales Today', { onClick: { handler: 'go', args: { surfaceId: 'salesToday' } } }),
        ui.button('📊 Inventory Report', { onClick: { handler: 'go', args: { surfaceId: 'report' } } }),
        ui.button('📦 Receive Shipment', { onClick: { handler: 'go', args: { surfaceId: 'receive' } } }),
        ui.button('➕ New Item', { onClick: { handler: 'go', args: { surfaceId: 'newItem' } } }),
        ui.button('🏷 Price Checker', { onClick: { handler: 'go', args: { surfaceId: 'priceCheck' } } }),
      ]);
    },
    handlers: {
      go({ dispatch }, args) {
        dispatch({ type: 'nav.go', payload: { surfaceId: String(asRecord(args).surfaceId || 'home') } });
      },
    },
  }),
  'ui.card.v1',
);
