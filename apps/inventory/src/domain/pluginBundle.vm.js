// @ts-check
/// <reference path="./pluginBundle.authoring.d.ts" />
defineStackBundle(({ ui }) => {
  function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function toMoney(value) {
    return '$' + toNumber(value, 0).toFixed(2);
  }

  function inventoryState(state) {
    return asRecord(asRecord(state).inventory);
  }

  function salesState(state) {
    return asRecord(asRecord(state).sales);
  }

  function filters(state) {
    return asRecord(asRecord(state).filters);
  }

  function draft(state) {
    return asRecord(asRecord(state).draft);
  }

  function selectItems(state) {
    return asArray(inventoryState(state).items);
  }

  function selectSales(state) {
    return asArray(salesState(state).log);
  }

  function navParam(state) {
    const param = asRecord(asRecord(state).nav).param;
    return typeof param === 'string' ? param : '';
  }

  function threshold(state) {
    const value = toNumber(filters(state).lowStockThreshold, 3);
    return value > 0 ? value : 3;
  }

  function findItem(state, sku) {
    const normalized = String(sku || '').toLowerCase();
    return selectItems(state).find((item) => String(asRecord(item).sku || '').toLowerCase() === normalized) || null;
  }

  function reportRows(state) {
    const items = selectItems(state);
    const low = threshold(state);
    const totalSkus = items.length;
    const totalUnits = items.reduce((sum, item) => sum + toNumber(asRecord(item).qty, 0), 0);
    const retailValue = items.reduce(
      (sum, item) => sum + toNumber(asRecord(item).price, 0) * toNumber(asRecord(item).qty, 0),
      0
    );
    const costBasis = items.reduce(
      (sum, item) => sum + toNumber(asRecord(item).cost, 0) * toNumber(asRecord(item).qty, 0),
      0
    );
    const lowStockCount = items.filter((item) => toNumber(asRecord(item).qty, 0) <= low).length;
    const outOfStockCount = items.filter((item) => toNumber(asRecord(item).qty, 0) <= 0).length;
    const potentialProfit = retailValue - costBasis;
    const recentSalesTotal = selectSales(state).reduce((sum, sale) => sum + toNumber(asRecord(sale).total, 0), 0);

    return [
      ['Total SKUs', String(totalSkus)],
      ['Total Units', String(totalUnits)],
      ['Retail Value', toMoney(retailValue)],
      ['Cost Basis', toMoney(costBasis)],
      ['Potential Profit', toMoney(potentialProfit)],
      ['Low Stock Items', String(lowStockCount)],
      ['Out of Stock', String(outOfStockCount)],
      ['Sales (recent)', toMoney(recentSalesTotal)],
    ];
  }

  function itemRows(items) {
    return items.map((item) => {
      const row = asRecord(item);
      return [
        String(row.sku || ''),
        String(row.name || ''),
        String(row.category || ''),
        toMoney(row.price),
        String(toNumber(row.qty, 0)),
      ];
    });
  }

  function salesRows(entries) {
    return entries.map((sale) => {
      const row = asRecord(sale);
      return [
        String(row.id || ''),
        String(row.date || ''),
        String(row.sku || ''),
        String(toNumber(row.qty, 0)),
        toMoney(row.total),
      ];
    });
  }

  function parseTags(value) {
    return String(value || '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  return {
    id: 'inventory',
    title: 'Shop Inventory',
    initialSessionState: {
      lowStockThreshold: 3,
      aiModel: 'Local LLM',
    },
    initialCardState: {
      itemDetail: { edits: {} },
      newItem: {
        form: { sku: '', name: '', category: 'Accessories', price: 0, cost: 0, qty: 0 },
        submitResult: '',
      },
      receive: { form: { sku: '', qty: 1, note: '' }, submitResult: '' },
      priceCheck: { form: { sku: '' }, submitResult: '' },
    },
    cards: {
      home: {
        render() {
          return ui.panel([
            ui.text('Welcome to Shop Inventory'),
            ui.text('Plugin DSL runtime'),
            ui.button('📋 Browse Items', { onClick: { handler: 'go', args: { cardId: 'browse' } } }),
            ui.button('⚠️ Low Stock', { onClick: { handler: 'go', args: { cardId: 'lowStock' } } }),
            ui.button('💰 Sales Today', { onClick: { handler: 'go', args: { cardId: 'salesToday' } } }),
            ui.button('📊 Inventory Report', { onClick: { handler: 'go', args: { cardId: 'report' } } }),
            ui.button('📦 Receive Shipment', { onClick: { handler: 'go', args: { cardId: 'receive' } } }),
            ui.button('➕ New Item', { onClick: { handler: 'go', args: { cardId: 'newItem' } } }),
            ui.button('🏷 Price Checker', { onClick: { handler: 'go', args: { cardId: 'priceCheck' } } }),
          ]);
        },
        handlers: {
          go({ dispatch }, args) {
            dispatch({ type: 'nav.go', payload: { cardId: String(asRecord(args).cardId || 'home') } });
          },
        },
      },

      browse: {
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
      },

      lowStock: {
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
      },

      salesToday: {
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
      },

      itemDetail: {
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
      },

      newItem: {
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
            dispatch({ type: 'nav.go', payload: { cardId: 'home' } });
          },
        },
      },

      receive: {
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
      },

      priceCheck: {
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
      },

      report: {
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
      },
    },
  };
});
