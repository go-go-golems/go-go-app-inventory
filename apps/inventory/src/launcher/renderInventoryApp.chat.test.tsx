import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSemHandlers,
  ensureChatModulesRegistered,
  handleSem,
  resetChatModulesRegistrationForTest,
} from '@hypercard/chat-runtime';
import { createAppStore } from '@hypercard/hypercard-runtime';
import { inventoryReducer } from '../features/inventory/inventorySlice';
import { salesReducer } from '../features/sales/salesSlice';
import {
  chatProfilesReducer,
  chatSessionReducer,
  chatWindowReducer,
  timelineReducer,
} from '@hypercard/chat-runtime';

const { createStore: createInventoryHostStore } = createAppStore({
  inventory: inventoryReducer,
  sales: salesReducer,
  timeline: timelineReducer,
  chatSession: chatSessionReducer,
  chatWindow: chatWindowReducer,
  chatProfiles: chatProfilesReducer,
});

beforeEach(() => {
  clearSemHandlers();
  resetChatModulesRegistrationForTest();
  ensureChatModulesRegistered();
});

describe('inventory chat card projection', () => {
  it('projects a hypercard.card.v2 artifact into the inventory host store', async () => {
    const store = createInventoryHostStore();

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

    const artifact = store.getState().hypercardArtifacts.byId['inventory-drilldown'];
    expect(artifact?.title).toBe('Inventory Drilldown');
    expect(artifact?.runtimeSurfaceId).toBe('runtimeInventoryDrilldown');
    expect(artifact?.packId).toBeUndefined();
  });

  it('projects runtime.pack metadata for kanban.v1 cards into the inventory host store', async () => {
    const store = createInventoryHostStore();

    handleSem(
      {
        sem: true,
        event: {
          type: 'timeline.upsert',
          id: 'evt-kanban-card',
          data: {
            convId: 'conv-kanban-card',
            version: '22',
            entity: {
              id: 'evt-kanban-card:result',
              kind: 'hypercard.card.v2',
              createdAtMs: '2200',
              updatedAtMs: '2201',
              props: {
                title: 'Sprint Board',
                result: {
                  title: 'Sprint Board',
                  data: {
                    artifact: {
                      id: 'sprint-board',
                      data: { boardId: 'sprint-24' },
                    },
                    runtime: {
                      pack: 'kanban.v1',
                    },
                    card: {
                      id: 'sprintBoard',
                      code: `({ widgets }) => ({
                        render() {
                          return widgets.kanban.board({
                            columns: [
                              { id: 'todo', title: 'To Do', icon: '📋' },
                              { id: 'done', title: 'Done', icon: '✅' }
                            ],
                            tasks: [
                              { id: 'task-1', col: 'todo', title: 'Wire runtime.pack', desc: '', tags: ['feature'], priority: 'high' },
                              { id: 'task-2', col: 'done', title: 'Extract KanbanBoardView', desc: '', tags: ['feature'], priority: 'medium' }
                            ],
                            editingTask: null,
                            filterTag: null,
                            filterPriority: null,
                            searchQuery: '',
                            collapsedCols: {}
                          });
                        }
                      })`,
                    },
                  },
                },
              },
            },
          },
        },
      },
      { convId: 'conv-kanban-card', dispatch: store.dispatch },
    );
    await Promise.resolve();

    const artifact = store.getState().hypercardArtifacts.byId['sprint-board'];
    expect(artifact?.title).toBe('Sprint Board');
    expect(artifact?.runtimeSurfaceId).toBe('sprintBoard');
    expect(artifact?.packId).toBe('kanban.v1');
  });
});
