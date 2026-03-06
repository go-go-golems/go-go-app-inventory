// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ChatConversationWindow,
  clearSemHandlers,
  ensureChatModulesRegistered,
  handleSem,
  chatProfilesReducer,
  chatSessionReducer,
  chatWindowReducer,
  resetChatModulesRegistrationForTest,
  timelineReducer,
} from '@hypercard/chat-runtime';
import { HypercardCardRenderer, createAppStore } from '@hypercard/hypercard-runtime';
import { inventoryReducer } from '../features/inventory/inventorySlice';
import { salesReducer } from '../features/sales/salesSlice';

vi.mock('@hypercard/engine/desktop-react', async () => {
  const actual = await vi.importActual<object>('@hypercard/engine/desktop-react');
  return {
    ...actual,
    useDesktopWindowId: () => undefined,
    useOpenDesktopContextMenu: () => undefined,
  };
});

vi.mock('@hypercard/chat-runtime', async () => {
  const actual = await vi.importActual<object>('@hypercard/chat-runtime');
  return {
    ...actual,
    useConversation: () => ({
      send: vi.fn(async () => undefined),
      connectionStatus: 'connected',
      isStreaming: false,
    }),
    useProfiles: () => ({
      profiles: [],
      loading: false,
      error: null,
      refresh: vi.fn(async () => undefined),
    }),
    useSetProfile: () => vi.fn(async () => undefined),
    useRegisterConversationContextActions: () => undefined,
  };
});

const roots: Root[] = [];
const containers: HTMLElement[] = [];

const { createStore: createInventoryHostStore } = createAppStore({
  inventory: inventoryReducer,
  sales: salesReducer,
  timeline: timelineReducer,
  chatSession: chatSessionReducer,
  chatWindow: chatWindowReducer,
  chatProfiles: chatProfilesReducer,
});

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.scrollIntoView !== 'function') {
    HTMLElement.prototype.scrollIntoView = () => undefined;
  }
});

beforeEach(() => {
  clearSemHandlers();
  resetChatModulesRegistrationForTest();
  ensureChatModulesRegistered();
});

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of containers.splice(0)) {
    container.remove();
  }
});

describe('inventory chat card rendering', () => {
  it('renders a hypercard.card.v2 row in ChatConversationWindow using the inventory host store', async () => {
    const store = createInventoryHostStore();
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    const root = createRoot(container);
    roots.push(root);

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'evt-card',
          data: {
            convId: 'conv-card',
            version: '21',
            entity: {
              id: 'evt-card:result',
              kind: 'hypercard.card.v2',
              createdAtMs: '2100',
              updatedAtMs: '2101',
              props: {
                title: 'Inventory Drilldown',
                result: {
                  title: 'Inventory Drilldown',
                  data: {
                    artifact: {
                      id: 'inventory-drilldown',
                      data: { sku: 'WA-100' },
                    },
                    card: {
                      id: 'runtimeInventoryDrilldown',
                      code: '({ ui }) => ({ render() { return ui.text("inventory"); } })',
                    },
                  },
                },
              },
            },
          },
        },
      },
      { convId: 'conv-card', dispatch: store.dispatch },
    );
    await Promise.resolve();

    await act(async () => {
      root.render(
        <Provider store={store}>
          <ChatConversationWindow
            convId="conv-card"
            basePrefix="/api/apps/inventory"
            windowId="window:inventory:test-chat"
            timelineRenderers={{
              'hypercard.card.v2': HypercardCardRenderer,
            }}
          />
        </Provider>,
      );
    });

    expect(container.textContent).toContain('Card:');
    expect(container.textContent).toContain('Inventory Drilldown');
    expect(container.textContent).toContain('runtime=runtimeInventoryDrilldown');
  });
});
