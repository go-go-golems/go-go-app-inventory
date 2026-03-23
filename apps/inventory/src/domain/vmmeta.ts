import VM_PACK_METADATA from './generated/inventoryVmmeta.generated';

export const INVENTORY_VM_PACK_METADATA = VM_PACK_METADATA;

export const INVENTORY_VM_CARD_META = VM_PACK_METADATA.cards.map((card) => ({
  id: card.id,
  title: card.title,
  icon: card.icon,
  packId: card.packId,
  sourceFile: card.sourceFile,
  source: card.source,
  handlerNames: Array.isArray(card.handlerNames) ? [...card.handlerNames] : [],
}));
