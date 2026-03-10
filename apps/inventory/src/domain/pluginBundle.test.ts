import { afterEach, describe, expect, it } from 'vitest';
import { QuickJSCardRuntimeService } from '@hypercard/hypercard-runtime';
import { INVENTORY_PLUGIN_BUNDLE } from './pluginBundle';
import { INVENTORY_VM_CARD_META, INVENTORY_VM_PACK_METADATA } from './vmmeta';

describe('inventory runtime cards', () => {
  const services: QuickJSCardRuntimeService[] = [];

  afterEach(() => {
    for (const service of services) {
      for (const sessionId of service.health().sessions) {
        service.disposeSession(sessionId);
      }
    }
    services.length = 0;
  });

  it('loads the inventory ui.card.v1 cards and preserves generated card metadata', async () => {
    const service = new QuickJSCardRuntimeService();
    services.push(service);

    const bundle = await service.loadStackBundle('inventory', 'inventory@test', INVENTORY_PLUGIN_BUNDLE);
    expect(INVENTORY_VM_PACK_METADATA.packId).toBe('ui.card.v1');
    expect(bundle.cards).toEqual(expect.arrayContaining(INVENTORY_VM_CARD_META.map((card) => card.id)));
    expect(bundle.cardPacks).toMatchObject(
      Object.fromEntries(INVENTORY_VM_CARD_META.map((card) => [card.id, 'ui.card.v1'])),
    );

    const rendered = service.renderCard('inventory@test', 'home', {});
    expect(rendered).toMatchObject({
      kind: 'panel',
      children: expect.arrayContaining([
        expect.objectContaining({ kind: 'text', text: 'Welcome to Shop Inventory' }),
        expect.objectContaining({ kind: 'button', props: expect.objectContaining({ label: '📋 Browse Items' }) }),
      ]),
    });
  });
});
