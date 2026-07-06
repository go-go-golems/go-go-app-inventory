import type { RuntimeSurfaceMeta, RuntimeBundleDefinition } from '@go-go-golems/os-core';
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

function toPluginCard(card: PluginCardMeta): RuntimeSurfaceMeta {
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

export const STACK: RuntimeBundleDefinition = {
  id: 'inventory',
  name: 'Shop Inventory',
  icon: '📇',
  homeSurface: 'home',
  plugin: {
    // 'kanban' included so model-generated kanban.v1 cards (chat codeCard →
    // registerRuntimeSurface) can execute in inventory surface sessions.
    packageIds: ['ui', 'kanban'],
    bundleCode: INVENTORY_PLUGIN_BUNDLE,
    capabilities: {
      domain: ['inventory', 'sales'],
      system: ['nav.go', 'nav.back', 'notify.show', 'window.close'],
    },
  },
  surfaces: Object.fromEntries(INVENTORY_CARD_META.map((card) => [card.id, toPluginCard(card)])),
};
