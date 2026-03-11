// @ts-check
// Bundle-local Inventory helpers. Public VM DSL APIs belong to runtime packages (`ui`).
function __package__() {}
function __doc__() {}
function __example__() {}
function __card__() {}
function doc() {
  return '';
}

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

defineRuntimeBundle(() => ({
  id: 'inventory',
  title: 'Shop Inventory',
  packageIds: ["ui"],
  description: 'Inventory HyperCard stack using the ui.card.v1 DSL.',
  initialSessionState: {
    lowStockThreshold: 3,
    aiModel: 'Local LLM',
  },
  initialSurfaceState: {
    itemDetail: { edits: {} },
    newItem: {
      form: { sku: '', name: '', category: 'Accessories', price: 0, cost: 0, qty: 0 },
      submitResult: '',
    },
    receive: { form: { sku: '', qty: 1, note: '' }, submitResult: '' },
    priceCheck: { form: { sku: '' }, submitResult: '' },
  },
  surfaces: {},
}));
