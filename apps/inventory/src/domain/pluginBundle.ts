import runtimePrelude from './vm/00-runtimePrelude.vm.js?raw';
import browseCard from './vm/cards/browse.vm.js?raw';
import homeSurface from './vm/cards/home.vm.js?raw';
import itemDetailCard from './vm/cards/itemDetail.vm.js?raw';
import lowStockCard from './vm/cards/lowStock.vm.js?raw';
import newItemCard from './vm/cards/newItem.vm.js?raw';
import priceCheckCard from './vm/cards/priceCheck.vm.js?raw';
import receiveCard from './vm/cards/receive.vm.js?raw';
import reportCard from './vm/cards/report.vm.js?raw';
import salesTodayCard from './vm/cards/salesToday.vm.js?raw';

// Inventory keeps its formatting/select helpers bundle-local; reusable DSL belongs to runtime packages.
const INVENTORY_BUNDLE_PRELUDE = [
  runtimePrelude,
];

const INVENTORY_BUNDLE_SURFACES = [
  homeSurface,
  browseCard,
  lowStockCard,
  salesTodayCard,
  itemDetailCard,
  newItemCard,
  receiveCard,
  priceCheckCard,
  reportCard,
];

export const INVENTORY_PLUGIN_BUNDLE = [
  ...INVENTORY_BUNDLE_PRELUDE,
  ...INVENTORY_BUNDLE_SURFACES,
].join('\n\n');
