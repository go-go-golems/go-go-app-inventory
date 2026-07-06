import { createAppStore } from '@go-go-golems/os-scripting';
import { confirmRuntimeReducer } from '@go-go-golems/os-confirm';
import { inventoryReducer } from '../features/inventory/inventorySlice';
import { salesReducer } from '../features/sales/salesSlice';

export const { store, createStore: createInventoryStore } = createAppStore(
  {
    inventory: inventoryReducer,
    sales: salesReducer,
    confirmRuntime: confirmRuntimeReducer,
  },
  {
    enableReduxDiagnostics: import.meta.env.DEV,
    diagnosticsWindowMs: 5000,
  },
);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
