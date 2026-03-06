# VM Boundary Simplification: One `state`, One `dispatch(action)`

## Recommendation

Yes: this should come before broadening the platform to support multiple UI DSLs,
extra runtime objects, richer effect APIs, or app-specific live query actions.

Right now the VM contract already leaks too much host structure:

- three different read models: `cardState`, `sessionState`, `globalState`
- four different write channels: `dispatchCardAction`, `dispatchSessionAction`,
  `dispatchDomainAction`, `dispatchSystemCommand`
- host-only concepts like "domain slice" and "system command" are visible to
  generated code

If we add more UI runtimes and more host actions before fixing that boundary, we
will multiply the complexity in every prompt, every authoring type, every sample,
and every generated program.

The cleaner direction is:

- the VM sees one projected `state`
- the VM emits one generic `dispatch(action)`
- the host translates between that simple contract and the real store / reducer /
  effect / navigation / database plumbing

This document explains how to get there without throwing away the current runtime.

---

## Current Problem

The current runtime boundary is spread across several places:

- `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
  - `render(cardId, cardState, sessionState, globalState)` calls `card.render({ cardState, sessionState, globalState })`
  - `event(...)` exposes four dispatch functions into the VM
- `packages/hypercard-runtime/src/plugin-runtime/contracts.ts`
  - worker request types explicitly carry `cardState`, `sessionState`, and `globalState`
  - runtime intent types are split into `card`, `session`, `domain`, and `system`
- `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
  - host selects card-local and session-local state separately
  - host also builds a projected global object
- `packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts`
  - host decodes intent scope and routes it to local state, Redux domain actions,
    or system commands
- `packages/hypercard-runtime/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`
  - local runtime storage is split between `sessionState` and `cardState`
- `apps/inventory/src/domain/pluginBundle.vm.js`
  - VM programs contain helper functions that know about `globalState.domains.inventory`,
    `globalState.domains.sales`, `nav`, and `sessionState`

That means generated VM code currently needs host topology knowledge:

- where global app data lives
- which mutations are "card" vs "session"
- which writes are "domain" vs "system"
- how navigation is encoded

This is exactly the kind of knowledge that should stay outside the sandbox.

---

## Current Code Anchors

Use these files first when implementing the boundary refactor:

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js:198-266`
  - current VM-facing render/event boundary
  - exposes `cardState`, `sessionState`, `globalState`
  - exposes the four scoped dispatch functions

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts:13-38`
  - current `RuntimeIntent` union by scope

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/contracts.ts:59-79`
  - worker request types that currently carry three state objects

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts:253-293`
  - render/event calls that serialize the three-state boundary into QuickJS

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx:33-64`
  - current `projectGlobalState()` helper

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx:91-97`
  - current selectors for `sessionState`, `cardState`, and projected domains

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx:263-304`
  - current render path that passes three state objects into the VM

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx:333-364`
  - current event path that passes three state objects and receives scoped intents

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts:30-121`
  - current host-side routing split between domain and system handling

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/selectors.ts:23-32`
  - current card/session local state selectors

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/selectors.ts:45-64`
  - current global/domain projection helper

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts:47-62`
  - current runtime session storage shape

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts:132-160`
  - current local state mutation semantics (`patch` / `set` / `reset`)

- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts:235-309`
  - current ingest path branching by `card`, `session`, `domain`, and `system`

- `workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.authoring.d.ts:46-57`
  - current inventory authoring surface leaking split contexts

- `workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.vm.js:21-58`
  - current inventory VM helper functions that navigate `globalState` and `sessionState`

- `workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md`
  - current prompt doc that should be simplified after the runtime contract changes

---

## What We Want Instead

The VM contract should look like this:

```js
({ ui }) => ({
  render({ state }) {
    return ui.panel([
      ui.text("Low stock report"),
      ui.badge("Threshold: " + String(state.filters.lowStockThreshold ?? 3)),
      ui.table(state.rows ?? [], { headers: ["SKU", "Name", "Qty"] })
    ]);
  },
  handlers: {
    changeThreshold({ state, dispatch }, args) {
      dispatch({
        type: "state.patch",
        payload: {
          filters: {
            ...state.filters,
            lowStockThreshold: Number(args?.value ?? 3)
          }
        }
      });
    },
    openItem({ dispatch }, args) {
      dispatch({
        type: "nav.go",
        payload: { cardId: "itemDetail", param: String(args?.sku ?? "") }
      });
    }
  }
})
```

The VM author should not need to know:

- whether `filters.lowStockThreshold` is internally persisted in `cardState` or `sessionState`
- whether `nav.go` becomes a system command
- whether a save action becomes a Redux domain action, a DB query, or a network request
- whether "global" state came from Redux, a query cache, or a backend projection

The host boundary should own all of that.

---

## Design Principle

Hide **store topology** and expose **app semantics**.

Bad VM-facing API:

- `globalState.domains.inventory.items`
- `dispatchDomainAction("inventory", "saveItem", payload)`
- `dispatchSessionAction("patch", ...)`

Better VM-facing API:

- `state.inventory.items`
- `state.currentItem`
- `state.filters`
- `dispatch({ type: "inventory.saveItemRequested", payload })`
- `dispatch({ type: "state.patch", payload })`

Best VM-facing API for smaller models:

- projected `state` that already contains the exact fields the card needs
- action names that sound like user intent, not host plumbing

Examples:

- `state.rows`
- `state.selectedSku`
- `state.form`
- `state.summary`
- `dispatch({ type: "form.change", payload: { field: "name", value: "Cable" } })`
- `dispatch({ type: "item.deleteRequested", payload: { sku } })`

---

## The Mental Model

Think of the VM as a pure UI brain:

1. Host computes a **view model**
2. VM renders from that **view model**
3. User interacts with widgets
4. VM emits a semantic **action**
5. Host interprets that action
6. Host updates real state or runs effects
7. Host recomputes the view model
8. VM rerenders

The VM should be ignorant of:

- Redux slice boundaries
- session/card storage boundaries
- domain reducer naming
- nav command implementation
- DB / HTTP / side-effect mechanics

---

## Current Flow vs Target Flow

### Current Flow

```text
Redux store
  -> selectRuntimeSessionState()
  -> selectRuntimeCardState()
  -> selectProjectedRuntimeDomains()
  -> PluginCardSessionHost builds projectedGlobalState
  -> QuickJS render(cardState, sessionState, globalState)
  -> VM reads three state objects
  -> VM emits scoped intents
  -> host routes by scope
```

### Target Flow

```text
Redux store + runtime local state + nav state + effect results
  -> runtime profile projectState(...)
  -> QuickJS render(state)
  -> VM reads one projected state object
  -> VM emits dispatch({ type, payload })
  -> host runtime profile handles action
  -> host updates store / nav / effects / cache
  -> runtime profile projectState(...)
  -> QuickJS rerenders
```

---

## Proposed Public VM API

## Render

```ts
interface VmRenderContext<State = unknown> {
  state: State;
}
```

Render signature:

```ts
render(context: { state: State }): UINode
```

## Handler

```ts
interface VmAction {
  type: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
}

interface VmHandlerContext<State = unknown> {
  state: State;
  dispatch(action: VmAction): void;
}
```

Handler signature:

```ts
(context: { state: State; dispatch(action: VmAction): void }, args?: unknown) => void
```

## Bundle

```ts
interface VmCardDef<State = unknown> {
  render(context: { state: State }): UINode;
  handlers?: Record<string, (context: { state: State; dispatch(action: VmAction): void }, args?: unknown) => void>;
}
```

The UI helper API can remain `({ ui }) => ({ ... })`. This change is about the
runtime state and action boundary, not the UI builder syntax.

---

## Host Responsibilities After The Change

The host will need two new concepts:

1. a **state projector**
2. an **action registry**

### 1. State Projector

The state projector receives all host-side inputs and returns the single VM state
object.

Pseudo-interface:

```ts
interface HostProjectionInput {
  sessionId: string;
  cardId: string;
  windowId: string;
  runtimeSessionState: Record<string, unknown>;
  runtimeCardState: Record<string, unknown>;
  reduxState: unknown;
  nav: {
    currentCardId: string;
    param?: string;
    depth: number;
    canBack: boolean;
  };
  system: {
    focusedWindowId: string | null;
    runtimeStatus: string;
  };
  effectState?: Record<string, unknown>;
}

type ProjectState = (input: HostProjectionInput) => unknown;
```

Important point:

- the host may still internally store card-local state, session-local state,
  Redux domain state, cache state, and effect state separately
- but the VM should only ever receive the merged projection result

### 2. Action Registry

The action registry maps semantic VM actions to real host behavior.

Pseudo-interface:

```ts
interface VmActionHandlerContext {
  sessionId: string;
  cardId: string;
  windowId: string;
  getState(): unknown;
  dispatchHost(action: unknown): void;
}

interface RegisteredVmAction {
  type: string;
  capability?: string;
  handle(action: VmAction, ctx: VmActionHandlerContext): void | Promise<void>;
}
```

Examples:

- `state.patch`
  - host writes into local runtime state
- `nav.go`
  - host dispatches navigation action
- `inventory.saveItemRequested`
  - host dispatches Redux action or effect request
- `query.http.requested`
  - host launches HTTP effect
- `query.db.requested`
  - host launches DB query effect

The VM only sees `dispatch({ type, payload })`.

---

## Recommended Internal Host Architecture

Do not immediately try to collapse all host state into one physical store object.
That is not required.

Instead, keep the internal split if it is useful, but hide it behind the runtime
boundary.

Recommended layers:

### Layer 1: Internal State Stores

- runtime card-local state
- runtime session-local state
- Redux domain state
- nav/window state
- effect result cache

### Layer 2: Projection

- one function per runtime profile or stack
- turns internal state into VM-facing `state`

### Layer 3: Action Handling

- action registry interprets `dispatch({ type, payload })`
- decides whether action means:
  - local state write
  - nav command
  - Redux action
  - HTTP effect
  - DB query effect
  - notification

### Layer 4: Rerender

- any host-side state change causes the projector to produce a fresh VM-facing state
- render is called again with the new projected state

This lets you simplify the VM contract without destabilizing the host.

---

## How To Handle Local VM State Without Exposing Session/Card Distinctions

This is the key question.

The VM still needs "local editable state" for things like:

- search text
- selected row ids
- draft form values
- open/closed toggles
- pagination

The VM should not know whether that state is persisted per card or shared across
the session.

### Recommended Approach

Keep internal storage split, but add **host-owned write policies**.

Example:

```ts
interface LocalStatePolicy {
  defaultScope: "card" | "session";
  routes?: Array<{
    match: string;
    scope: "card" | "session";
  }>;
}
```

Examples:

- `form.*` -> `card`
- `selectedRowKeys` -> `card`
- `filters.*` -> `session`
- `preferredView` -> `session`

Then `state.patch` and `state.set` can stay VM-visible, but the host decides where
the real write lands.

Pseudo-code:

```ts
function handleStatePatch(action, ctx) {
  const entries = Object.entries(asRecord(action.payload));
  for (const [key, value] of entries) {
    const scope = resolveScopeForPath(key, ctx.profile.localStatePolicy);
    if (scope === "session") {
      patchSessionState(ctx.sessionId, { [key]: value });
    } else {
      patchCardState(ctx.sessionId, ctx.cardId, { [key]: value });
    }
  }
}
```

That preserves the current host storage model without leaking it into the VM API.

---

## How To Handle Domain Actions Without Exposing Domains

The same rule applies to Redux domains.

Today the VM must do this:

```js
dispatchDomainAction("inventory", "saveItem", payload)
```

That forces the VM to know:

- there is an `inventory` reducer
- the reducer action name is `saveItem`

Instead, define VM-visible semantic actions:

```js
dispatch({ type: "item.saveRequested", payload })
dispatch({ type: "item.deleteRequested", payload: { sku } })
dispatch({ type: "stock.receiveRequested", payload: { sku, qty } })
```

Then the host action registry maps those to real host actions:

```ts
{
  type: "item.saveRequested",
  capability: "inventory.write",
  handle(action, ctx) {
    ctx.dispatchHost({
      type: "inventory/saveItem",
      payload: action.payload,
      meta: runtimeMeta(ctx),
    });
  }
}
```

This is better because:

- prompts become simpler
- actions become portable across apps
- action names can stay stable even if Redux internals change

---

## How To Handle System Commands Without Exposing "System Commands"

Same pattern:

Current:

```js
dispatchSystemCommand("nav.go", { cardId: "detail", param: "A-100" })
```

Target:

```js
dispatch({ type: "nav.go", payload: { cardId: "detail", param: "A-100" } })
dispatch({ type: "notify", payload: { message: "Saved" } })
dispatch({ type: "window.close" })
```

The VM still names the semantic action, but it no longer needs a separate API or
the concept of a special command channel.

---

## How This Helps HTTP / DB / Async Query Work

This simplification is a prerequisite for effectful runtime cards.

You said you want VM code to trigger things like:

- HTTP fetches
- DB queries
- effect results coming back into state and rerendering

That should not be raw `fetch()` inside QuickJS. It should be a host-managed
effect loop.

### Recommended Pattern

VM emits intent:

```js
dispatch({
  type: "query.inventory.searchRequested",
  payload: {
    requestId: "search-1",
    term: "cable"
  }
})
```

Host action registry:

1. validates capability
2. runs HTTP or DB work outside the VM
3. stores pending / success / error result in host state
4. projector folds the effect result back into VM-facing `state`

Projected state example:

```js
{
  query: {
    term: "cable",
    status: "success",
    rows: [
      ["A-101", "Cable", "4"]
    ],
    error: null
  }
}
```

Then render becomes ordinary state-driven UI:

```js
render({ state }) {
  return ui.panel([
    ui.input(state.query.term ?? "", { onChange: { handler: "setTerm" } }),
    ui.badge(state.query.status ?? "idle"),
    ui.table(state.query.rows ?? [], { headers: ["SKU", "Name", "Qty"] })
  ]);
}
```

This is exactly the right direction if you want RTK-Query-like behavior:

- async work lives outside the VM
- result caching lives outside the VM
- VM stays deterministic and safe
- UI stays state-driven

---

## Why This Should Come Before Multi-DSL

If you add a second UI DSL now, you will have to answer all of these questions twice:

- how does this DSL see state?
- how does it mutate local view state?
- how does it navigate?
- how does it trigger domain actions?
- how does it trigger HTTP / DB queries?
- how does capability checking work?
- how do prompts explain all of that?

If you first simplify to one `state` + one `dispatch(action)` contract, then
every future UI DSL can plug into the same runtime semantics.

That creates a much cleaner platform split:

- **UI DSL** decides how UI trees are authored
- **VM contract** decides how state and actions cross the sandbox boundary
- **host action registry** decides what actions actually do

That is the right layering.

---

## Concrete File Changes

These are the key files to change first.

### 1. `stack-bootstrap.vm.js`

Current responsibility:

- passes three read objects and four dispatch functions into card code

Change to:

- pass one `{ state }` object into `render()`
- pass one `{ state, dispatch }` object into handlers
- collect one action array with shape `{ type, payload, meta? }`

Target sketch:

```js
render(cardId, state) {
  return card.render({ state });
}

event(cardId, handlerName, args, state) {
  __runtimeActions = [];

  const dispatch = (action) => {
    __runtimeActions.push(normalizeAction(action));
  };

  handler({ state, dispatch }, args);
  return __runtimeActions.slice();
}
```

### 2. `contracts.ts`

Replace:

- `cardState`
- `sessionState`
- `globalState`
- scoped `RuntimeIntent`

With:

- `state`
- generic `VmAction`

Target sketch:

```ts
interface VmAction {
  type: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
}

interface RenderCardRequest {
  state: unknown;
}

interface EventCardRequest {
  args?: unknown;
  state: unknown;
}
```

### 3. `runtimeService.ts`

Replace:

- `renderCard(sessionId, cardId, cardState, sessionState, globalState)`
- `eventCard(sessionId, cardId, handler, args, cardState, sessionState, globalState)`

With:

- `renderCard(sessionId, cardId, state)`
- `eventCard(sessionId, cardId, handler, args, state)`

### 4. `PluginCardSessionHost.tsx`

Replace:

- direct construction of `projectedGlobalState`
- direct passing of `cardState`, `sessionState`, `globalState`

With:

- `const vmState = runtimeProfile.projectState(...)`
- render/event calls that pass only `vmState`
- action execution through runtime profile action registry

### 5. `pluginIntentRouting.ts`

Replace the scope-based router with an action registry executor.

Current branching:

- if scope is `domain`, dispatch Redux action
- if scope is `system`, map to nav/toast/window close

Target:

- lookup `registeredAction = profile.actions[action.type]`
- validate capability
- execute handler

### 6. `selectors.ts`

Current selector only projects global domains.

Change to:

- provide raw host inputs to the state projector
- stop treating `globalState.domains` as the main VM-facing read model

### 7. `pluginCardRuntimeSlice.ts`

Keep if useful:

- internal `sessionState`
- internal `cardState`

But remove their visibility from the VM contract.

Also change timeline recording:

- record `action.type`
- record outcome
- record handler/source metadata if helpful
- stop centering timeline entries around `scope`

### 8. App authoring types and prompts

Update:

- `apps/inventory/src/domain/pluginBundle.authoring.d.ts`
- `pkg/pinoweb/prompts/runtime-card-policy.md`

So that authored cards target:

- `render({ state })`
- handlers receive `{ state, dispatch }`

not the older split model.

---

## Suggested New Runtime Profile API

This is the cleanest long-term shape.

```ts
interface RuntimeProfile {
  id: string;
  projectState(input: HostProjectionInput): unknown;
  actions: Record<string, RegisteredVmAction>;
  capabilities?: {
    allow?: string[];
  };
}
```

Then `PluginCardSessionHost` depends on a runtime profile, not on hardcoded
knowledge of global/domain/session wiring.

This sets up the later work cleanly:

- different UI DSLs can still share the same runtime profile
- different apps can register different action maps
- rich widgets can share the same state/action boundary
- HTTP / DB effects become registered action handlers

---

## Migration Plan

### Phase 1: Introduce Compatibility Layer

Goal:

- add the new `state` + `dispatch(action)` API without breaking existing cards

Approach:

- keep old internal storage
- let the VM bootstrap support both:
  - legacy `render({ cardState, sessionState, globalState })`
  - new `render({ state })`
- let handlers support both:
  - legacy scoped dispatch methods
  - new `dispatch(action)`

This phase keeps momentum and reduces migration risk.

### Phase 2: Add State Projector + Action Registry For Inventory

Goal:

- move the inventory app to one projected state model

Approach:

- create `inventoryRuntimeProfile`
- define `projectState()`
- define handlers for:
  - `state.patch`
  - `state.set`
  - `state.reset`
  - `nav.go`
  - `nav.back`
  - `notify`
  - inventory semantic actions

### Phase 3: Port Inventory Bundle Authoring

Goal:

- stop inventory VM code from touching `globalState.domains.*`

Approach:

- rewrite `pluginBundle.vm.js` helpers around `state`
- update prompt doc
- update authoring d.ts

### Phase 4: Add Effect Actions

Goal:

- allow safe HTTP / DB / query workflows

Approach:

- register effect actions like `query.*Requested`
- store results in host-side effect state
- project results back into `state`

### Phase 5: Remove Legacy Split API

Goal:

- delete `dispatchCardAction`, `dispatchSessionAction`, `dispatchDomainAction`, `dispatchSystemCommand`
- delete VM-facing `cardState/sessionState/globalState`

Only do this after inventory and tooling are migrated.

---

## Inventory Example: Before And After

### Current Style

```js
render({ globalState, sessionState }) {
  const low = threshold(sessionState);
  const items = selectItems(globalState).filter((item) => qty(item) <= low);
  return ui.panel([
    ui.text("Low stock"),
    ui.table(itemRows(items), { headers: ["SKU", "Name", "Qty"] })
  ]);
}
```

This code knows:

- where inventory lives
- where the threshold lives
- which values are global vs session-local

### Target Style

```js
render({ state }) {
  return ui.panel([
    ui.text("Low stock"),
    ui.badge("Threshold: " + String(state.filters.lowStockThreshold)),
    ui.table(state.lowStockRows ?? [], { headers: ["SKU", "Name", "Qty"] })
  ]);
}
```

This code only knows the projected view model.

That is the right abstraction.

---

## Risks And Tradeoffs

### Risk: Projection Becomes A Mess

If each card hand-builds its own projector inline, this will just move the mess.

Mitigation:

- define runtime profiles
- define named projector helpers
- keep projection logic host-side and testable

### Risk: Too Much Magic In `dispatch`

If action names are arbitrary strings with no registry or validation, debugging gets worse.

Mitigation:

- require every action type to be registered
- record action timeline with outcomes
- validate capability and payload shape at the host boundary

### Risk: Hidden State Scope Confusion

If the VM cannot tell card-vs-session lifetime at all, authors may be surprised by persistence behavior.

Mitigation:

- document host write policy clearly
- keep default policy simple
- expose semantic action names when persistence meaning matters
  - for example `filters.setThreshold` instead of raw `state.patch`

---

## Testing Strategy

Add or update tests in these layers:

- VM bootstrap tests
  - render with one `state`
  - handler dispatch returns normalized action array
- runtime service tests
  - single-state render/event transport
- host routing tests
  - registered action maps to Redux/nav/effect work correctly
- projector tests
  - host inputs map to projected VM state correctly
- inventory bundle tests
  - cards render using `state`, not `globalState/sessionState`
- prompt/extractor tests
  - prompt examples and hypercard extraction stay valid

---

## Bottom Line

Do this first.

The single biggest improvement you can make to this platform before adding more
UI DSLs, richer widgets, HTTP actions, or DB-backed cards is to stop exposing
host topology inside the VM.

The target contract should be:

- read: `state`
- write: `dispatch({ type, payload })`

Everything else belongs at the host boundary.

Once that is in place:

- prompts get shorter
- generated code gets simpler
- compatibility across apps improves
- effectful cards become much more tractable
- adding alternate UI DSLs becomes a UI problem instead of a state-plumbing problem
