import runtimePrelude from './vm/00-runtimePrelude.vm.js?raw';
import inventoryPackDocs from './vm/docs/inventory-pack.docs.vm.js?raw';
import browseCard from './vm/cards/browse.vm.js?raw';
import homeCard from './vm/cards/home.vm.js?raw';
import itemDetailCard from './vm/cards/itemDetail.vm.js?raw';
import lowStockCard from './vm/cards/lowStock.vm.js?raw';
import newItemCard from './vm/cards/newItem.vm.js?raw';
import priceCheckCard from './vm/cards/priceCheck.vm.js?raw';
import receiveCard from './vm/cards/receive.vm.js?raw';
import reportCard from './vm/cards/report.vm.js?raw';
import salesTodayCard from './vm/cards/salesToday.vm.js?raw';

export const INVENTORY_PLUGIN_BUNDLE = [
  runtimePrelude,
  inventoryPackDocs,
  homeCard,
  browseCard,
  lowStockCard,
  salesTodayCard,
  itemDetailCard,
  newItemCard,
  receiveCard,
  priceCheckCard,
  reportCard,
].join('\n\n');
