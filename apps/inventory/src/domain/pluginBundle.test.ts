import { afterEach, describe, expect, it } from 'vitest';
import { QuickJSRuntimeService } from '@hypercard/hypercard-runtime';
import { INVENTORY_PLUGIN_BUNDLE } from './pluginBundle';
import { INVENTORY_VM_CARD_META, INVENTORY_VM_PACK_METADATA } from './vmmeta';

describe('inventory runtime surfaces', () => {
  const services: QuickJSRuntimeService[] = [];

  afterEach(() => {
    for (const service of services) {
      for (const sessionId of service.health().sessions) {
        service.disposeSession(sessionId);
      }
    }
    services.length = 0;
  });

  it('loads the inventory ui.card.v1 surfaces and preserves generated surface metadata', async () => {
    const service = new QuickJSRuntimeService();
    services.push(service);

    const bundle = await service.loadRuntimeBundle('inventory', 'inventory@test', ['ui'], INVENTORY_PLUGIN_BUNDLE);
    expect(INVENTORY_VM_PACK_METADATA.packId).toBe('ui.card.v1');
    expect(bundle.packageIds).toEqual(['ui']);
    expect(bundle.surfaces).toEqual(expect.arrayContaining(INVENTORY_VM_CARD_META.map((card) => card.id)));
    expect(bundle.surfaceTypes).toMatchObject(
      Object.fromEntries(INVENTORY_VM_CARD_META.map((card) => [card.id, 'ui.card.v1'])),
    );

    const rendered = service.renderRuntimeSurface('inventory@test', 'home', {});
    expect(rendered).toMatchObject({
      kind: 'panel',
      children: expect.arrayContaining([
        expect.objectContaining({ kind: 'text', text: 'Welcome to Shop Inventory' }),
        expect.objectContaining({ kind: 'button', props: expect.objectContaining({ label: '📋 Browse Items' }) }),
      ]),
    });
  });
});
