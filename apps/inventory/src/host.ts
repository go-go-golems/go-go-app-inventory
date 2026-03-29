import type { FederatedAppHostContract } from '@go-go-golems/os-shell';
import { inventoryReducer, salesReducer } from './reducers';
import { STACK as inventoryStack } from './domain/stack';
import { INVENTORY_VM_PACK_METADATA } from './domain/vmmeta';
import { inventoryLauncherModule } from './launcher/module';

export const inventorySharedReducers = {
  inventory: inventoryReducer,
  sales: salesReducer,
};

export const inventoryRuntimeBundles = [inventoryStack] as const;

export const inventoryHostContract = {
  remoteId: 'inventory',
  launcherModule: inventoryLauncherModule,
  sharedReducers: inventorySharedReducers,
  docsMetadata: INVENTORY_VM_PACK_METADATA,
  runtimeBundles: inventoryRuntimeBundles,
} satisfies FederatedAppHostContract;
