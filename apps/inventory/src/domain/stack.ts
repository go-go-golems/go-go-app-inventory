import type { CardDefinition, CardStackDefinition } from '@hypercard/engine';
import { INVENTORY_PLUGIN_BUNDLE } from './pluginBundle';
import { INVENTORY_VM_CARD_META } from './vmmeta';

interface PluginCardMeta {
  id: string;
  title: string;
  icon: string;
  packId?: string;
  sourceFile?: string;
  source?: string;
  handlerNames?: string[];
}

const INVENTORY_CARD_META: PluginCardMeta[] = INVENTORY_VM_CARD_META.map((card) => ({
  id: card.id,
  title: card.title,
  icon: card.icon,
  packId: card.packId,
  sourceFile: card.sourceFile,
  source: card.source,
  handlerNames: card.handlerNames,
}));

function toPluginCard(card: PluginCardMeta): CardDefinition {
  return {
    id: card.id,
    type: 'plugin',
    title: card.title,
    icon: card.icon,
    ui: {
      t: 'text',
      value: `Plugin card placeholder: ${card.id}`,
    },
    meta: card.source
      ? {
          runtime: {
            packId: card.packId,
            sourceFile: card.sourceFile,
            source: card.source,
            handlerNames: card.handlerNames ?? [],
          },
        }
      : undefined,
  };
}

export const STACK: CardStackDefinition = {
  id: 'inventory',
  name: 'Shop Inventory',
  icon: '📇',
  homeCard: 'home',
  plugin: {
    bundleCode: INVENTORY_PLUGIN_BUNDLE,
    capabilities: {
      domain: ['inventory', 'sales'],
      system: ['nav.go', 'nav.back', 'notify.show', 'window.close'],
    },
  },
  cards: Object.fromEntries(INVENTORY_CARD_META.map((card) => [card.id, toPluginCard(card)])),
};
