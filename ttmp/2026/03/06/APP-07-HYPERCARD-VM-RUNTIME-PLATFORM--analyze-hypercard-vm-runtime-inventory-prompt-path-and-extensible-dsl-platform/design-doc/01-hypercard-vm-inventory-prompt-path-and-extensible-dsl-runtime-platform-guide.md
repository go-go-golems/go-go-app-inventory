---
Title: HyperCard VM, Inventory Prompt Path, and Extensible DSL Runtime Platform Guide
Ticket: APP-07-HYPERCARD-VM-RUNTIME-PLATFORM
Status: active
Topics:
    - architecture
    - backend
    - chat
    - frontend
    - hypercard
    - wesen-os
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../go-go-os-chat/pkg/profilechat/request_resolver.go
      Note: Canonical request fields and current runtime selection mismatch
    - Path: ../../../../../../../go-go-os-chat/pkg/profilechat/runtime_composer.go
      Note: Profile-aware runtime composition and middleware resolution
    - Path: ../../../../../../../pinocchio/pkg/inference/runtime/engine.go
      Note: Final engine builder that applies middleware plus base system prompt
    - Path: ../../../../../../../pinocchio/pkg/webchat/conversation_service.go
      Note: Inference startup and event sink usage
    - Path: ../../../../../../../pinocchio/pkg/webchat/http/api.go
      Note: HTTP and websocket request handling into conversation service
    - Path: ../../../../../../../pinocchio/pkg/webchat/router.go
      Note: Runtime composer and event sink wrapper application
    - Path: cmd/wesen-os-launcher/main.go
      Note: Inventory runtime composer
    - Path: workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/bridge/ArcPendingIntentEffectHost.tsx
      Note: Pending-intent effect host for async command execution
    - Path: workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/bridge/middleware.ts
      Note: Middleware alternative for async bridge and capability enforcement
    - Path: workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/domain/pluginBundle.ts
      Note: Reference request-lifecycle-driven async runtime card
    - Path: workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/launcher/module.tsx
      Note: Reference launcher pattern mounting ARC effect host with runtime card host
    - Path: workspace-links/go-go-app-inventory/apps/inventory/src/domain/pluginBundle.vm.js
      Note: Current generated-card authoring style for inventory
    - Path: workspace-links/go-go-app-inventory/apps/inventory/src/domain/stack.ts
      Note: Current inventory runtime capability policy
    - Path: workspace-links/go-go-app-inventory/apps/inventory/src/features/inventory/inventorySlice.ts
      Note: Reducer-side domain action handlers currently used by inventory cards
    - Path: workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go
      Note: SEM mappings and timeline projection for hypercard artifacts
    - Path: workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_extractors.go
      Note: Structured sink extractors and event sink wrapper for tagged model output
    - Path: workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_middleware.go
      Note: Prompt middleware that injects hypercard and widget policy instructions
    - Path: workspace-links/go-go-app-inventory/pkg/pinoweb/middleware_definitions.go
      Note: Active and inactive middleware definitions
    - Path: workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md
      Note: Current DSL reference shown to the model during inventory inference
    - Path: workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/widget-policy.md
      Note: Structured widget tag instructions paired with runtime card policy
    - Path: workspace-links/go-go-app-inventory/pkg/pinoweb/runtime_composer.go
      Note: Inventory-specific runtime composer construction
    - Path: workspace-links/go-go-app-sqlite/apps/sqlite/src/components/SqliteHypercardIntentRunner.tsx
      Note: Async runner that performs host-side HTTP work and writes results back into state
    - Path: workspace-links/go-go-app-sqlite/apps/sqlite/src/domain/hypercard/runtimeState.ts
      Note: Queued job model for async SQLite intents
    - Path: workspace-links/go-go-app-sqlite/apps/sqlite/src/domain/pluginBundle.vm.js
      Note: Reference async query card authoring pattern
    - Path: workspace-links/go-go-app-sqlite/apps/sqlite/src/launcher/module.tsx
      Note: Reference launcher pattern mounting effect runner next to PluginCardSessionHost
    - Path: workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/http.ts
      Note: Frontend POST body shape for chat prompt submission
    - Path: workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/ws/wsManager.ts
      Note: Frontend websocket query parameter shape and profile selection reuse
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/capabilityPolicy.ts
      Note: Capability authorization model for domain and system intents
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts
      Note: Local runtime state mutations and pending intent queues
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts
      Note: Timeline-to-artifact projection and runtime card registration
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts
      Note: Extraction of card ids and code from projected timeline results
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts
      Note: Global generated-card registry and injection flow
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts
      Note: QuickJS VM lifecycle
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js
      Note: Current VM-visible helper surface and intent collection
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/uiSchema.ts
      Note: Strict validation rules for generated UI trees
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/uiTypes.ts
      Note: Structured UI node contract for generated cards
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardRenderer.tsx
      Note: Renderer seam for richer structured widgets
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Host-side VM lifecycle
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts
      Note: Domain and system dispatch escape hatch from QuickJS
ExternalSources: []
Summary: Detailed intern-facing analysis of how inventory prompt policy drives hypercard generation, how QuickJS runtime cards are executed safely, and how to extend the platform with new DSLs, host APIs, actions, HTTP effects, and live DB query bridges.
LastUpdated: 2026-03-06T13:18:00-05:00
WhatFor: Explain the end-to-end architecture that turns inventory chat prompts into generated runtime cards, then executes those cards safely in QuickJS and routes their intents back into the host application.
WhenToUse: Use when onboarding engineers to the hypercard runtime, when extending the generated UI DSL, when adding new host APIs or action bridges, or when designing richer widget and live-query capabilities.
---


# HyperCard VM, Inventory Prompt Path, and Extensible DSL Runtime Platform Guide

## Executive Summary

The current system already has the two halves needed for an extensible generated-UI platform, but they are named and wired as if they only exist for inventory hypercards.

The first half is inference-time. The inventory chat backend resolves a runtime profile, composes a base system prompt, and injects inventory-specific middleware blocks that describe the current UI DSL and the expected `<hypercard:card:v2>` / `<hypercard:widget:v1>` payloads. That is how the model learns what kind of JavaScript and YAML it is supposed to emit.

The second half is runtime-time. The frontend receives timeline entities such as `hypercard.card.v2`, extracts `card.id` and `card.code`, registers them in a runtime card registry, and injects them into a per-session QuickJS VM. That VM is deliberately narrow: it has strict memory, stack, and timeout limits; it exposes only `ui.*` helper functions plus a few dispatch helpers; and it validates both rendered UI nodes and emitted intents before they escape back into Redux.

The important architectural conclusion is that this is not fundamentally an "inventory hypercard" system. It is already a small generated-runtime platform. To extend it safely, the right move is not to give the VM raw `fetch()` and more implicit globals. The right move is to separate:

- inference packs: prompt and extraction rules that teach the model what artifact to emit
- runtime packs: VM bootstrap, schema validation, renderer mapping, and capability defaults
- effect bridges: host-side code that performs async HTTP or DB work and mirrors results back into runtime state

That separation lets you support multiple UI DSLs, richer widgets, and live query workflows without weakening the safety boundary or hardcoding more inventory assumptions into the platform.

## Problem Statement

The user asked for a thorough trace of how code is generated by an LLM and then executed in a safe sandbox, with special attention to the inventory chat app and the current hypercard runtime.

More specifically, the user asked:

- how the hypercard prompt and UI DSL description are passed into model inference
- how to wire a different UI DSL
- how to add additional objects and APIs to the runtime
- how to add more actions and dispatch handlers
- how to support richer widgets plus async work such as HTTP fetches and DB queries whose results flow back into rendered state

Those questions all cross the same boundary. There is no single "hypercard" component. The behavior is spread across:

- backend request resolution and runtime profile selection
- backend middleware-based prompt injection
- backend structured extraction and timeline projection
- frontend artifact projection and runtime card injection
- frontend QuickJS host bootstrap
- frontend intent routing, capability policy, reducers, and effect hosts

An intern who only reads one layer will misunderstand the system. This document therefore follows the artifact end to end.

## Scope And Terminology

This guide uses the following terms consistently.

| Term | Meaning in this codebase |
| --- | --- |
| Runtime profile | A `geppetto` profile that selects system prompt, middleware uses, and allowed tools for a conversation. |
| Middleware | Inference-time logic that mutates turns before or after the model call. Inventory uses middleware to inject DSL instructions into system blocks. |
| Hypercard artifact | A structured result emitted by the model, currently via `<hypercard:card:v2>`, `<hypercard:widget:v1>`, or `<hypercard:suggestions:v1>` tags. |
| Structured sink | A backend event-sink wrapper that scans streamed model output, extracts tagged YAML payloads, and emits semantic events. |
| Timeline entity | A projected, durable frontend-facing artifact row such as `hypercard.card.v2`. |
| Runtime card | A generated JavaScript card definition identified by `card.id` and implemented by `card.code`. |
| QuickJS session | One isolated per-window VM instance created by `QuickJSCardRuntimeService`. |
| Runtime intent | A VM-emitted action envelope with `scope: card | session | domain | system`. |
| Effect host | Host-side async logic that consumes runtime intents, performs HTTP/DB work, and patches results back into app state or runtime state. |

Terminology note: the repository does not currently contain a `microquickjs` runtime. The frontend sandbox is QuickJS WASM, loaded via `@jitl/quickjs-singlefile-mjs-release-sync` plus `quickjs-emscripten`.

## Current System Trace

### 1. Request Enters The Inventory Chat App

The frontend chat runtime posts prompts through `packages/chat-runtime/src/chat/runtime/http.ts`. That helper sends:

- `prompt`
- `conv_id`
- optionally `profile`
- optionally `registry`

The websocket layer in `packages/chat-runtime/src/chat/ws/wsManager.ts` similarly adds `profile` and `registry` query parameters.

The backend request resolver in `go-go-os-chat/pkg/profilechat/request_resolver.go` does not read those names. It resolves profile selection from:

- request body `runtime_key`
- websocket query `runtime_key`
- fallback cookie `chat_profile`

It also defines `registry_slug` in the POST body type, but the current resolver implementation does not actually use it for selection.

That creates an important current-state mismatch:

- the frontend stores per-conversation profile selection
- the backend mostly resolves profile from the global `chat_profile` cookie fallback

This matters for any future plan where a conversation chooses a different DSL pack, different runtime APIs, or different action bridge. Before those become robust, transport naming needs to be aligned.

### 2. Runtime Profile Resolution And Composer Setup

Inventory runtime composition is created in `cmd/wesen-os-launcher/main.go`.

Key points:

- `pinoweb.NewRuntimeComposer(...)` creates an inventory-specific runtime composer
- `RegisterInventoryHypercardExtensions()` registers event factories, SEM mappings, and timeline handlers for hypercard artifacts
- inventory-like profiles (`inventory`, `analyst`, `planner`) all use `inventoryRuntimeMiddlewares()`
- those profiles also narrow allowed tools to inventory tool factories

The middleware list returned by `inventoryRuntimeMiddlewares()` is currently:

- `inventory_artifact_policy`
- `inventory_suggestions_policy`

There is also an `inventory_artifact_generator` middleware definition, but it is not part of the active default profile middleware list. That means the system currently teaches the model to emit artifacts, but does not strictly enforce "a response must contain a card/widget tag" unless some other profile explicitly enables that generator middleware.

The actual profile-aware engine composition happens in `go-go-os-chat/pkg/profilechat/runtime_composer.go`.

That composer:

- starts from base step settings
- applies any `step_settings_patch` from the resolved profile
- selects the effective system prompt
- selects the effective allowed tool list
- resolves middleware definitions into concrete middleware instances
- builds the final engine with `BuildEngineFromSettingsWithMiddlewares(...)`

At that point, the conversation runtime is fully determined. The model does not "know" about hypercards magically. It knows because the resolved runtime includes hypercard prompt middleware and inventory tool access.

### 3. How The UI DSL Prompt Reaches The Model

This is the most direct answer to "how is the prompt for generating hypercards and the UI DSL description passed on to inference?"

The answer is:

1. `main.go` attaches inventory runtime middleware uses to selected profiles.
2. `pinoweb.NewRuntimeComposer(...)` registers middleware definitions from `pkg/pinoweb/middleware_definitions.go`.
3. During request composition, `profilechat.RuntimeComposer.Compose(...)` resolves those definitions into middleware instances.
4. `BuildEngineFromSettingsWithMiddlewares(...)` wraps the engine with the resolved middleware chain and the base system prompt middleware.
5. `NewInventoryArtifactPolicyMiddleware(...)` mutates the outgoing turn by upserting a system block whose text is the concatenation of:
   - `prompts/widget-policy.md`
   - `prompts/runtime-card-policy.md`

The runtime-card policy prompt is the UI DSL contract. It explicitly tells the model:

- to emit exactly one `<hypercard:card:v2>` block when a visual card is appropriate
- the required YAML payload shape
- that `card.code` is a JavaScript expression
- the two accepted forms: factory form with `{ ui }` and raw object form
- the current `ui.*` helper API
- the current render context (`cardState`, `sessionState`, `globalState`)
- the current handler context (`dispatchCardAction`, `dispatchSessionAction`, `dispatchDomainAction`, `dispatchSystemCommand`)
- example cards using inventory-specific global state such as `globalState.domains.inventory.items`

This has two practical consequences:

- changing the runtime DSL is not only a frontend change; it is also a prompt-pack change
- the current prompt is inventory-specific because it hardcodes the expected `globalState.domains.inventory` and `globalState.domains.sales` shape

### 4. What Happens During Inference

The HTTP handler in `pinocchio/pkg/webchat/http/api.go` resolves the request, then calls `ConversationService.SubmitPrompt(...)`.

The conversation service:

- resolves or reuses the conversation runtime
- appends a new user turn from the prompt
- registers the allowed tool set for this runtime
- installs the event sink on the tool-loop builder
- starts inference

The runtime composer and the event sink wrapper are both applied before inference begins:

- the composer produces the engine plus the base sink
- `Router.convRuntimeComposer()` wraps the sink with the configured event sink wrapper
- inventory supplies `NewInventoryEventSinkWrapper(...)`

The high-level path is:

```text
ChatConversationWindow
  -> submitPrompt(prompt, conv_id, profile?)
  -> POST /chat
  -> NewChatHandler.Resolve(req)
  -> StrictRequestResolver.Resolve()
  -> ConversationService.SubmitPrompt()
  -> ConvManager.GetOrCreate()
  -> RuntimeComposer.Compose()
  -> BuildEngineFromSettingsWithMiddlewares()
  -> Router.eventSinkWrapper(...)
  -> Session.StartInference()
  -> model output streams through structured sink
```

### 5. How Model Output Becomes A Runtime Card

Inventory's event sink wrapper creates a `structuredsink.NewFilteringSinkWithContext(...)` and registers three extractors:

- widget extractor for `hypercard/widget/v1`
- runtime card extractor for `hypercard/card/v2`
- suggestions extractor for `hypercard/suggestions/v1`

The runtime card extractor accepts YAML with:

- `artifact.id`
- `artifact.data`
- `card.id`
- `card.code`

If `card.id` or `card.code` is missing, it emits `HypercardCardErrorEvent`. If the payload completes successfully, it emits `HypercardCardV2ReadyEvent`.

That event is then mapped to:

- a SEM frame with type `hypercard.card.v2`
- a timeline entity with kind `hypercard.card.v2`

The timeline result entity stores the structured payload, including the generated JavaScript code string. That is the handoff point between model output and frontend runtime injection.

### 6. How The Frontend Registers Generated Cards

Once the frontend receives a timeline entity or snapshot:

- `artifactProjectionMiddleware.ts` listens for timeline add/upsert/snapshot actions
- `artifactRuntime.ts` detects `hypercard.card.v2`
- it extracts:
  - artifact id
  - title
  - `runtimeCardId`
  - `runtimeCardCode`
- it dispatches `upsertArtifact(...)`
- it calls `registerRuntimeCard(runtimeCardId, runtimeCardCode)`

The runtime card registry is global. It is intentionally decoupled from any one VM session. That means:

- cards generated before a session exists can still be injected later
- cards generated while a session is already running can be live-injected into that session

`PluginCardSessionHost.tsx` loads the stack bundle, then injects all pending runtime cards with `service.defineCard(sessionId, cardId, code)`. It also subscribes to registry changes so later-arriving cards can be injected after the session is already ready.

### 7. How QuickJS Executes The Card Safely

`QuickJSCardRuntimeService` is the current sandbox boundary.

Safety properties enforced there:

- per-session isolation: each `sessionId` gets its own `QuickJSRuntime` and `QuickJSContext`
- memory limit: default `32 MiB`
- max stack: default `1 MiB`
- interrupt handler: execution is interrupted when the session deadline passes
- load timeout: default `1000 ms`
- render timeout: default `100 ms`
- event timeout: default `100 ms`

The bootstrap file `stack-bootstrap.vm.js` defines the only stable VM surface:

- `defineStackBundle(factory)`
- `defineCard(cardId, definitionOrFactory)`
- `defineCardRender(cardId, renderFn)`
- `defineCardHandler(cardId, handlerName, handlerFn)`
- `ui.*` helper namespace

The exposed `ui.*` helper namespace currently includes:

- `text`
- `badge`
- `button`
- `input`
- `row`
- `column`
- `panel`
- `table`
- `dropdown`
- `selectableTable`
- `gridBoard`

The VM does not currently expose:

- `fetch`
- DOM APIs
- timers
- filesystem APIs
- storage APIs
- background tasks
- any promise-based host bridge

There are also two validation gates:

- `uiSchema.ts` validates the rendered UI tree and rejects unsupported node kinds or malformed event references
- `intentSchema.ts` validates the returned intent list

So the current sandbox model is:

```text
generated JS
  -> runs in isolated QuickJS VM
  -> can only see explicit bootstrap helpers
  -> returns plain JSON-like UI tree or intent list
  -> host validates result shape
  -> host chooses whether to dispatch resulting intents
```

This is a good narrow runtime for deterministic generated UI. It is not a good place for raw async side effects yet.

### 8. How Intents Leave The VM

When a user clicks or types, `PluginCardSessionHost` calls `runtimeService.eventCard(...)`.

The bootstrap handler collects emitted intents through helper functions:

- `dispatchCardAction`
- `dispatchSessionAction`
- `dispatchDomainAction`
- `dispatchSystemCommand`

`dispatchRuntimeIntent(...)` then handles those on the host side.

Current behavior:

- card intents mutate `pluginCardRuntime.sessions[sessionId].cardState`
- session intents mutate `pluginCardRuntime.sessions[sessionId].sessionState`
- domain intents are:
  - recorded in runtime timeline
  - queued in `pendingDomainIntents`
  - immediately converted to Redux actions of type `${domain}/${actionType}`
- system intents are:
  - recorded in runtime timeline
  - queued in `pendingSystemIntents`
  - immediately mapped to host actions such as `nav.go`, `nav.back`, toast notification, or window close

Capability policy is enforced before domain and system intents are allowed to escape. The stack definition provides allowed domain and system command sets.

One subtle but very important detail: the platform currently supports two async-handling styles at once.

- direct dispatch style: domain intents become normal Redux actions immediately
- queue-consumer style: effect hosts consume `pendingDomainIntents`

That is powerful, but it also means a new extension should choose one bridge pattern intentionally. Otherwise it is easy to double-handle a domain intent.

### 9. What Inventory Does Today

The inventory stack definition declares one plugin bundle plus the capability policy:

- allowed domains: `inventory`, `sales`
- allowed system commands: `nav.go`, `nav.back`, `notify`, `window.close`

The generated inventory plugin bundle uses the current DSL heavily:

- `ui.panel`, `ui.text`, `ui.table`, `ui.button`, `ui.input`, `ui.row`, `ui.column`
- `dispatchDomainAction('inventory', ...)`
- `dispatchSystemCommand('nav.go' | 'nav.back' | 'notify')`

Those domain actions land in plain Redux reducers under the `inventory` slice:

- `updateQty`
- `saveItem`
- `deleteItem`
- `createItem`
- `receiveStock`

This is a synchronous reducer model. It works well for local mock inventory state. It is not an async data-fetching model.

### 10. Existing Async Bridge Patterns You Should Copy

The repository already contains two examples much closer to the user's desired future architecture.

#### SQLite Pattern

The SQLite runtime bundle dispatches domain actions such as:

- `sqlite/query.execute`
- `sqlite/seed.execute`

Those actions do not perform the query inside QuickJS. Instead:

- the SQLite slice enqueues jobs in app state
- `SqliteHypercardIntentRunner` claims queued jobs
- the runner performs HTTP work against the SQLite API
- success or failure is written back into Redux state
- the generated card reads the updated domain state from `globalState.domains.app_sqlite`

This is already an RTK-query-like separation:

- VM asks for work declaratively
- host performs side effects
- results re-enter state
- next render sees the updated state snapshot

#### ARC Pattern

The ARC demo cards dispatch a single domain action family:

- `arc/command.request`

The runtime bundle writes request metadata into `sessionState`, then dispatches that domain intent. The host-side bridge:

- dequeues pending ARC domain intents
- validates payload
- performs HTTP requests
- applies capability checks
- mirrors request lifecycle state back into runtime session state
- upserts snapshots into normal Redux state

That is the closest existing example of "runtime requests async work and keeps rendering status/result state while the request resolves."

## Answers To The Requested Extension Questions

### How Could I Wire In A Different UI DSL?

There are two levels of answer.

#### Minimal Answer: Extend The Current Hypercard DSL

If the new DSL is only "the same runtime model, but with more node kinds", the minimal path is:

1. extend `stack-bootstrap.vm.js` to expose more helper functions
2. extend `uiTypes.ts` to type the new node kinds
3. extend `uiSchema.ts` to validate them
4. extend `PluginCardRenderer.tsx` to render them
5. update `runtime-card-policy.md` so the model knows the new API

That works for additions such as:

- chart widgets
- richer forms
- tabs
- accordions
- tree views
- embedded custom engine widgets

This is the smallest change if you want to keep one global `ui.*` DSL forever.

#### Better Answer: Introduce A Runtime Pack Registry

If the goal is "register all kinds of UI DSLs", not just "add more helper functions", the cleaner architecture is a runtime pack registry.

Recommended concept:

```ts
interface RuntimePackDefinition {
  id: string;                        // e.g. "hypercard.ui.v1", "rich.widgets.v1"
  promptPolicy: string;              // instructions injected at inference time
  artifactKind: string;              // timeline kind, e.g. "runtime.card.v1"
  bootstrapModules: string[];        // VM packages exposed to generated code
  validateView(value: unknown): unknown;
  renderView(value: unknown, onEvent: (handler: string, args?: unknown) => void): ReactNode;
  defaultCapabilities: CapabilityPolicy;
}
```

Then each generated artifact should declare which runtime pack it targets:

```yaml
artifact:
  id: inventory-report-q1
runtime:
  pack: rich.widgets.v1
module:
  id: inventoryReportQ1
  code: |-
    ({ ui, widgets, effects }) => ({ ... })
```

That gives you a stable seam for:

- a different prompt pack
- a different render schema
- a different helper namespace
- different capabilities
- different effect bridges

It also prevents the current problem where inventory-specific assumptions are baked into one generic-looking hypercard prompt.

### How Could I Write In Other Additional Objects / APIs?

The current bootstrap only passes `{ ui }` into `defineStackBundle(({ ui }) => ...)`.

If you want more runtime-visible objects, there are two categories.

#### Category A: Pure Synchronous Helper APIs

These are safe to inject directly because they are deterministic and do not require async host calls.

Examples:

- formatting helpers
- date helpers
- pure data transforms
- widget factories
- selection utilities
- schema helpers

These can be added as more bootstrap packages:

```js
defineStackBundle(({ ui, format, widgets, selectors }) => ({ ... }))
```

Implement them by:

1. extending the VM bootstrap source
2. updating the prompt pack to document the new helpers
3. updating any type definitions or schema validators affected by the new return shapes

#### Category B: Async Or Side-Effectful APIs

Examples:

- HTTP fetch
- DB query
- file upload
- background polling
- command execution

These should not be injected as raw direct APIs in the current architecture.

Why not:

- the runtime service is synchronous today: `eventCard()` returns `RuntimeIntent[]` immediately
- there is no promise bridge, no host callback scheduler, and no async continuation model in QuickJS
- direct side effects would bypass centralized capability checks, cancellation, retries, logging, and auth handling

So the right design is not "give the VM `fetch`". The right design is "give the VM declarative request helpers that emit intents".

Recommended API shape:

```js
defineStackBundle(({ ui, effects }) => ({
  handlers: {
    refresh(ctx) {
      const requestId = effects.nextRequestId("inventory-http");
      ctx.dispatchSessionAction("patch", {
        customerSearch: { status: "requested", requestId, error: null }
      });
      effects.http.request(ctx, {
        requestId,
        endpoint: "inventory/searchCustomers",
        params: { q: String(ctx.cardState?.query ?? "") },
        resultPath: "customerSearch"
      });
    }
  }
}));
```

Under the hood, `effects.http.request(...)` should still just emit a domain intent. It should not do the network request in-VM.

### How Can I Wire Additional Actions And Register Their Dispatches?

There are three different dispatch surfaces in the current runtime. Each extends differently.

#### 1. Local Card And Session Actions

Current supported local action types are:

- `patch`
- `set`
- `reset`

Those are implemented in `pluginCardRuntimeSlice.ts` by `applyStateAction(...)`.

If you want more local actions, extend that reducer logic. Example candidates:

- `mergeArray`
- `removeAtPath`
- `toggle`
- `replace`

Use this only for local runtime state semantics. Do not use it for real side effects.

#### 2. Domain Actions

Domain actions are the main extensibility path today.

Current flow:

```text
generated code
  -> dispatchDomainAction("inventoryQuery", "request", payload)
  -> dispatchRuntimeIntent()
  -> Redux action type "inventoryQuery/request"
  -> reducer or middleware or effect host handles it
```

To add a new domain action:

1. decide the domain string and action type string
2. add that domain to the stack capability policy
3. implement the host-side reducer, middleware, or effect host
4. expose the behavior in the prompt pack so the model knows it exists

If the work is synchronous and reducer-only, a slice is enough. If it is async, use a bridge host or middleware.

#### 3. System Commands

System commands are mapped in `pluginIntentRouting.ts`.

Current builtins:

- `nav.go`
- `nav.back`
- `notify`
- `window.close`

To add a new system command:

1. extend `toSystemAction(...)`
2. add it to the stack capability policy
3. document it in the runtime prompt pack

Examples:

- `window.minimize`
- `dialog.open`
- `clipboard.copy`
- `workspace.open`

System commands should stay host-oriented and generic. Domain actions are better for application-specific behavior.

### How Should HTTP Fetches And DB Queries Work?

For the current architecture, the correct answer is: use effect bridges, not direct VM fetch.

The flow should look like this:

```text
generated handler
  -> emits domain intent "runtime_http/request" or "inventory_query/request"
  -> host effect runner performs HTTP or DB work
  -> host writes request lifecycle + result into Redux / runtime session state
  -> next render sees updated globalState/sessionState
```

Recommended request lifecycle fields:

- `status`: `idle | requested | started | succeeded | failed`
- `requestId`
- `error`
- `result`
- optional `updatedAt`

Example request intent:

```ts
type RuntimeQueryRequest = {
  requestId: string;
  resource: "inventory.items.search";
  args: Record<string, unknown>;
  target: {
    scope: "session" | "card";
    path: string;
  };
};
```

Example effect host logic:

```ts
function RuntimeQueryEffectHost() {
  const pending = useSelector(selectPendingDomainIntents);
  const dispatch = useDispatch();

  useEffect(() => {
    const next = pending.find((intent) => intent.domain === "inventoryQuery");
    if (!next) return;

    dispatch(dequeuePendingDomainIntent({ id: next.id }));

    const payload = validateInventoryQuery(next.payload);
    dispatch(
      ingestRuntimeIntent({
        sessionId: next.sessionId,
        cardId: next.cardId,
        intent: {
          scope: "session",
          actionType: "patch",
          payload: {
            [payload.target.path]: {
              status: "started",
              requestId: payload.requestId,
              error: null
            }
          }
        }
      })
    );

    runInventoryQuery(payload)
      .then((result) => {
        dispatch(inventoryQuerySucceeded({ requestId: payload.requestId, result }));
        dispatch(
          ingestRuntimeIntent({
            sessionId: next.sessionId,
            cardId: next.cardId,
            intent: {
              scope: "session",
              actionType: "patch",
              payload: {
                [payload.target.path]: {
                  status: "succeeded",
                  requestId: payload.requestId,
                  result,
                  error: null
                }
              }
            }
          })
        );
      })
      .catch((error) => {
        dispatch(
          ingestRuntimeIntent({
            sessionId: next.sessionId,
            cardId: next.cardId,
            intent: {
              scope: "session",
              actionType: "patch",
              payload: {
                [payload.target.path]: {
                  status: "failed",
                  requestId: payload.requestId,
                  error: String(error)
                }
              }
            }
          })
        );
      });
  }, [dispatch, pending]);
}
```

That is already very close to the SQLite and ARC examples. You do not need to invent a new model from scratch.

## Recommended Target Architecture

### The Main Design Recommendation

Promote "hypercards" into a generic runtime-pack platform.

Proposed layers:

```text
inference pack
  -> teaches model what artifact to emit

artifact envelope
  -> carries runtime pack id, module id, code, metadata

runtime pack
  -> defines bootstrap helpers, schema validation, renderer, capability defaults

effect bridge
  -> performs async host work and mirrors results into state
```

### Proposed Generic Artifact Envelope

Keep `hypercard.card.v2` for compatibility, but introduce a generic envelope for future work.

Example:

```yaml
<runtime:card:v1>
artifact:
  id: inventory-query-console
  title: Inventory Query Console
runtime:
  pack: rich.widgets.v1
  moduleId: inventoryQueryConsole
  requestedCapabilities:
    domain:
      - inventoryQuery
      - runtimeHttp
module:
  code: |-
    ({ ui, widgets, effects }) => ({
      render({ sessionState }) {
        return widgets.queryPanel(sessionState.inventoryQueryConsole);
      },
      handlers: {
        run(ctx) {
          effects.query.request(ctx, {
            requestId: effects.nextRequestId("inventory-query"),
            resource: "inventory.items.search",
            args: { sku: ctx.cardState?.sku ?? "" },
            targetPath: "inventoryQueryConsole"
          });
        }
      }
    })
</runtime:card:v1>
```

Important fields:

- `runtime.pack`: chooses the DSL/runtime package
- `runtime.moduleId`: stable VM registration id
- `requestedCapabilities`: optional request, still validated by host
- `module.code`: generated JS entry point

### Proposed Runtime Pack Registry

Backend registry responsibilities:

- prompt pack lookup
- middleware construction
- artifact tag/extractor registration
- timeline projection kind mapping

Frontend registry responsibilities:

- VM bootstrap package lookup
- output schema validation
- React renderer
- effect bridge hookup
- capability defaults

### Proposed Host Package Categories

Do not keep everything in one giant `ui.*` helper forever. Split the host surface into categories:

- `ui`: basic layout and primitive controls
- `widgets`: richer typed components backed by explicit node schema
- `effects`: intent emitters for async work
- `format`: pure helper utilities
- `selectors`: pure helpers for reading projected global state safely
- `runtime`: helper functions like `nextRequestId`

That makes prompt writing cleaner and allows packs to vary independently.

## Implementation Plan

### Phase 0: Fix Runtime Selection Transport

Goal: make per-conversation runtime / DSL selection real.

Files to change:

- `packages/chat-runtime/src/chat/runtime/http.ts`
- `packages/chat-runtime/src/chat/ws/wsManager.ts`
- `go-go-os-chat/pkg/profilechat/request_resolver.go`
- related tests in chat runtime

Recommended change:

- frontend should send `runtime_key` and `registry_slug`, not `profile` and `registry`
- or backend should accept both aliases during migration
- wire actual registry selection if that concept remains important

Do this first. Without it, conversation-specific runtime-pack selection is unreliable.

### Phase 1: Introduce Generic Runtime Artifact Envelope

Goal: stop hardcoding future work into `hypercard.card.v2`.

Files to change:

- `workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_middleware.go`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/card_prompt.go`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_extractors.go`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go`

Recommended change:

- add a generic runtime artifact kind such as `runtime.card.v1`
- include `runtime.pack` in the payload
- keep `hypercard.card.v2` as a compatibility adapter until existing inventory flows are migrated

### Phase 2: Add Frontend Runtime Pack Registry

Goal: let the frontend decide how to load and validate each generated module by pack id.

Files to change:

- `packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts`
- `packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts`
- `packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts`
- `packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`

Recommended change:

- register generated modules by `{ packId, moduleId, code }`
- inject modules into runtime sessions through a pack-aware service
- let artifact projection choose the proper runtime pack from payload metadata

### Phase 3: Split VM Bootstrap Into Host Packages

Goal: make helper injection explicit and extensible.

Files to change:

- `packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
- `packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
- `packages/hypercard-runtime/src/plugin-runtime/contracts.ts`

Recommended change:

- bootstrap with something like `defineStackBundle(({ ui, widgets, effects, format }) => ...)`
- serialize pack-specific helper metadata into the VM bootstrap phase
- keep async packages intent-only unless the runtime is redesigned for promises

### Phase 4: Add Rich Widget Node Kinds

Goal: support richer generated views.

Files to change:

- `packages/hypercard-runtime/src/plugin-runtime/uiTypes.ts`
- `packages/hypercard-runtime/src/plugin-runtime/uiSchema.ts`
- `packages/hypercard-runtime/src/runtime-host/PluginCardRenderer.tsx`

Recommended change:

- add new node kinds deliberately, with schema and renderer in lockstep
- do not let the model emit arbitrary React or arbitrary HTML
- prefer structured nodes that can be validated strictly

### Phase 5: Add Effect Bridge Registry For HTTP And DB Work

Goal: support async runtime workflows safely.

Suggested new concepts:

- `runtimeHttp/request`
- `runtimeQuery/request`
- `runtimeCommand/request`

Reference implementations:

- SQLite job runner pattern
- ARC pending-intent effect host pattern

Recommended change:

- create reusable effect-host helpers that filter `pendingDomainIntents`
- standardize request lifecycle state
- mirror results back through `ingestRuntimeIntent(...)` or normal Redux slices

### Phase 6: Migrate Inventory To A Data-Fetching Runtime Pattern

Goal: let generated inventory cards do real live queries without weakening the VM.

Recommended shape:

- keep inventory synchronous reducer actions for simple local actions
- add one new async query domain such as `inventoryQuery`
- expose query results to the VM through either:
  - session state patches for card-specific request state
  - global domain slice for shared cache

This is the place where RTK-query-like ideas fit best:

- cache keys
- request status
- deduplication
- invalidation
- background refresh

But those should live in the host app, not inside QuickJS.

### Phase 7: Tests

Must-have test coverage:

- backend middleware test that proves the chosen runtime pack prompt is inserted
- backend extractor tests for new generic runtime artifact payloads
- backend timeline projection tests for new entity kinds
- frontend artifact projection tests for pack-aware registration
- frontend runtime service tests for new helper injection and validation failures
- frontend renderer tests for new node kinds
- integration test: timeline upsert -> generated card injected -> effect host performs request -> runtime session state patched -> rerender shows result
- end-to-end test with conversation-scoped runtime selection

## Testing And Validation Strategy

For this ticket, I did not change product code. The validation target is architectural correctness and trace completeness. Future implementation work should validate at four layers.

### Backend Unit

- middleware prompt injection
- profile runtime resolution
- extractor payload validation
- timeline handler projection

### Frontend Unit

- artifact projection
- runtime card registry injection
- QuickJS timeout / schema rejection behavior
- capability denials

### Host Integration

- mount `PluginCardSessionHost` with a real store
- feed a timeline snapshot containing a generated runtime card
- verify render tree
- trigger a VM handler and observe async bridge state changes

### End-To-End

- choose runtime pack per conversation
- send a chat request
- inspect emitted runtime artifact
- open the generated card
- trigger HTTP and DB queries
- verify rerender after result patch

## Risks And Alternatives Considered

### Risks

- Transport mismatch risk: per-conversation runtime selection is not fully wired today.
- Prompt drift risk: if runtime helper APIs change without prompt updates, the model will generate invalid code.
- Double-handling risk: domain intents can be both queued and immediately dispatched.
- Capability drift risk: prompt may describe APIs or commands that stack capability policy still denies.
- Async runtime mismatch: current QuickJS host is synchronous, so promise-style APIs require a real runtime redesign.

### Alternative 1: Inject Raw `fetch()` Into QuickJS

Rejected for now.

Reasons:

- current runtime has no async continuation model
- worse security, auth, and observability story
- harder cancellation and retry behavior
- encourages business logic in generated code

### Alternative 2: Keep One Giant `ui.*` DSL Forever

Possible, but not recommended long-term.

Reasons:

- harder to explain in prompts
- couples unrelated widget families together
- no clean way to register different packs with different capabilities

### Alternative 3: Generate React Or JSX Directly

Rejected.

Reasons:

- far weaker validation boundary
- much larger execution and rendering surface
- harder to sandbox
- encourages coupling to implementation details of the host UI layer

## Open Questions

- Should the future generic artifact envelope replace `hypercard.card.v2`, or should `hypercard` remain as one specific runtime pack family?
- Do you want one shared effect bridge registry for all apps, or should each app own its own bridge packages and only share helper scaffolding?
- Should query results live primarily in runtime `sessionState`, or in app domain slices with runtime cards only reading projected cache state?
- Is conversation-scoped runtime selection enough, or do you eventually want per-message runtime-pack requests?
- Do you want a true async VM API later, or is intent-based async orchestration sufficient?

## References

Primary backend trace files:

- `cmd/wesen-os-launcher/main.go`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/runtime_composer.go`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_middleware.go`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/middleware_definitions.go`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/runtime-card-policy.md`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/prompts/widget-policy.md`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_extractors.go`
- `workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go`
- `../go-go-os-chat/pkg/profilechat/runtime_composer.go`
- `../go-go-os-chat/pkg/profilechat/request_resolver.go`
- `../pinocchio/pkg/webchat/http/api.go`
- `../pinocchio/pkg/webchat/conversation_service.go`
- `../pinocchio/pkg/webchat/router.go`
- `../pinocchio/pkg/inference/runtime/engine.go`

Primary frontend trace files:

- `workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/runtime/http.ts`
- `workspace-links/go-go-os-frontend/packages/chat-runtime/src/chat/ws/wsManager.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactProjectionMiddleware.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/hypercard/artifacts/artifactRuntime.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeCardRegistry.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/runtimeService.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/stack-bootstrap.vm.js`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/uiTypes.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/plugin-runtime/uiSchema.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardRenderer.tsx`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/pluginIntentRouting.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`
- `workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/features/pluginCardRuntime/capabilityPolicy.ts`

Reference async bridge examples:

- `workspace-links/go-go-app-sqlite/apps/sqlite/src/domain/pluginBundle.vm.js`
- `workspace-links/go-go-app-sqlite/apps/sqlite/src/domain/hypercard/runtimeState.ts`
- `workspace-links/go-go-app-sqlite/apps/sqlite/src/components/SqliteHypercardIntentRunner.tsx`
- `workspace-links/go-go-app-sqlite/apps/sqlite/src/launcher/module.tsx`
- `workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/domain/pluginBundle.ts`
- `workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/bridge/ArcPendingIntentEffectHost.tsx`
- `workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/bridge/middleware.ts`
- `workspace-links/go-go-app-arc-agi-3/apps/arc-agi-player/src/launcher/module.tsx`

## Problem Statement

<!-- Describe the problem this design addresses -->

## Proposed Solution

<!-- Describe the proposed solution in detail -->

## Design Decisions

<!-- Document key design decisions and rationale -->

## Alternatives Considered

<!-- List alternative approaches that were considered and why they were rejected -->

## Implementation Plan

<!-- Outline the steps to implement this design -->

## Open Questions

<!-- List any unresolved questions or concerns -->

## References

<!-- Link to related documents, RFCs, or external resources -->
