---
Title: Inventory Backend Module Simplification and Reflection Design
Ticket: INV-01
Status: active
Topics:
    - backend
    - reflection
    - documentation
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../go-go-os-backend/pkg/backendhost/manifest_endpoint.go
      Note: Manifest/reflection endpoint behavior used by apps-browser
    - Path: ../../../../../../go-go-os-backend/pkg/backendhost/module.go
      Note: |-
        Target host interfaces (AppBackendModule and ReflectiveAppBackendModule)
        Target interfaces to implement directly in inventory module package
    - Path: ../../../../../../go-go-os-frontend/apps/apps-browser/src/domain/types.ts
      Note: Frontend reflection payload shape that inventory should match
    - Path: ../../../../../../wesen-os/cmd/wesen-os-launcher/inventory_backend_module.go
      Note: |-
        Current composition-level wrapper to be simplified/removed
        Current wrapper targeted for simplification/removal
    - Path: ../../../../../../wesen-os/cmd/wesen-os-launcher/main.go
      Note: |-
        Current module composition wiring in runtime host
        Composition site where inventory module construction changes
    - Path: pkg/backendcomponent/component.go
      Note: |-
        Current inventory backend component contract and route/lifecycle implementation
        Current inventory runtime component to preserve while moving adapter ownership
    - Path: pkg/backendcomponent/component_test.go
      Note: |-
        Existing tests and baseline behavior that must be preserved
        Baseline behavior tests guarding lifecycle and manifest expectations
ExternalSources: []
Summary: Design for simplifying inventory backend integration by moving wrapper logic from wesen-os into go-go-app-inventory and adding reflection support so inventory reaches parity with ARC and GEPA.
LastUpdated: 2026-03-01T13:20:00-05:00
WhatFor: Plan the implementation needed to make inventory a first-class backend module with reflection metadata and reduced composition glue code.
WhenToUse: Use this doc before implementing inventory backend module refactor or reflection support.
---


# Inventory Backend Module Simplification and Reflection Design

## Executive Summary

Inventory currently requires a custom wrapper in `wesen-os` to adapt `backendcomponent.Component` into `backendhost.AppBackendModule`. ARC and GEPA already look more uniform in composition because they expose module types that map directly into host contracts and include reflection.

This ticket introduces a dedicated inventory backend module package in `go-go-app-inventory` and adds reflection so all three apps (inventory, arc-agi, gepa) share the same discoverability model in `/api/os/apps` and `/api/os/apps/{id}/reflection`.

## Problem Statement

Current issues:

1. Inventory adaptation logic lives in composition (`wesen-os`) instead of the inventory repo.
2. Inventory lacks reflection metadata; apps-browser cannot introspect it like ARC/GEPA.
3. Composition has extra maintenance burden for inventory-specific mapping.

Observed evidence:

1. Inventory component only defines a local `Component` interface with no reflection (`pkg/backendcomponent/component.go`).
2. `wesen-os` provides wrapper methods for manifest/lifecycle/routes (`wesen-os/cmd/wesen-os-launcher/inventory_backend_module.go`).
3. ARC/GEPA wrappers include `Reflection(ctx)` mapping (`wesen-os/pkg/arcagi/module.go`, `wesen-os/pkg/gepa/module.go`).

## Goals

1. Make inventory integration in `wesen-os` as thin as ARC/GEPA.
2. Add inventory reflection endpoint support with stable metadata.
3. Keep runtime behavior unchanged for existing chat/ws/timeline/profile/confirm routes.
4. Prepare inventory for docs-system rollout (OS-02 follow-up).

## Non-Goals

1. No frontend implementation in this ticket.
2. No semantic changes to existing inventory route behavior.
3. No large schema redesign for pinoweb runtime payloads.

## Current Architecture

### Current shape

1. `backendcomponent.InventoryBackendComponent` owns route and lifecycle behavior.
2. `wesen-os` constructs it and wraps it via `inventoryBackendModule`.
3. Wrapper manually maps manifest into `backendhost.AppBackendManifest`.
4. No reflection method exists for inventory path.

### Current downside

The adaptation boundary is in the wrong repository: composition owns inventory-specific glue logic.

## Proposed Architecture

## 1) Add inventory-owned backend module package

Create a new package in this repo:

1. `pkg/backendmodule` (new)

It should:

1. Implement `backendhost.AppBackendModule` directly.
2. Implement `backendhost.ReflectiveAppBackendModule`.
3. Internally delegate runtime behavior to `backendcomponent.InventoryBackendComponent`.

This keeps the domain/runtime implementation in `backendcomponent` but moves host adaptation into inventory ownership.

## 2) Keep backendcomponent as runtime core

`backendcomponent` remains reusable and focused on route mounting, dependencies, and lifecycle checks.

No need to remove it. The new module package composes it.

## 3) Reflection support design

Expose reflection for inventory with:

1. App identity/summary/version.
2. Capabilities (`chat`, `ws`, `timeline`, `profiles`, `confirm`).
3. API list for key routes under `/api/apps/inventory/...`.
4. Schema references where stable schemas exist.
5. Docs links (initially minimal; can later point to module docs endpoints).

Reflection should be deterministic and safe to call even if runtime has no active conversations.

## 4) Composition simplification in wesen-os

After new inventory module package exists, `wesen-os` should:

1. Construct inventory module from `go-go-app-inventory` directly.
2. Remove local wrapper file (`inventory_backend_module.go`) once migrated.

## Reflection Contract (Inventory Target)

Inventory reflection response should match host expectations:

1. `app_id`
2. `name`
3. `version`
4. `summary`
5. `capabilities`
6. `docs`
7. `apis`
8. `schemas`

Initial API entries to include:

1. `POST /api/apps/inventory/chat`
2. `GET /api/apps/inventory/ws` (or websocket route descriptor)
3. `GET /api/apps/inventory/api/timeline`
4. Profile endpoints under `/api/apps/inventory/api/chat/*`
5. Confirm endpoint under `/api/apps/inventory/confirm`

## Implementation Plan

### Phase 1: New inventory backend module package

1. Add `pkg/backendmodule/module.go` with module struct and constructor.
2. Add compile-time checks:
- `var _ backendhost.AppBackendModule = (*Module)(nil)`
- `var _ backendhost.ReflectiveAppBackendModule = (*Module)(nil)`
3. Delegate lifecycle/routes to `backendcomponent.InventoryBackendComponent`.
4. Map manifest from component into backendhost manifest.

### Phase 2: Reflection implementation

1. Add reflection builder in `pkg/backendmodule/reflection.go`.
2. Add stable reflection doc payload with capabilities/apis/docs/schemas.
3. Add unit tests validating required reflection fields and API paths.

### Phase 3: Migrate composition

1. Update `wesen-os` to construct inventory module from `go-go-app-inventory/pkg/backendmodule`.
2. Delete composition-local inventory wrapper if no longer needed.
3. Update `wesen-os` integration tests to assert inventory reflection appears in `/api/os/apps` and `/api/os/apps/inventory/reflection`.

### Phase 4: Validation and rollout

1. Run module tests in inventory repo.
2. Run integration tests in `wesen-os`.
3. Verify no behavior regression for existing inventory endpoints.

## Risks and Mitigations

### Risk 1: Cross-repo contract churn

Problem:

Adding `backendhost` dependency in inventory introduces coupling.

Mitigation:

1. Keep adapter layer thin and explicit.
2. Pin and test against host contract in CI.

### Risk 2: Reflection payload drift

Problem:

API route changes can stale reflection metadata.

Mitigation:

1. Add tests that assert reflection route list matches mounted route constants.
2. Centralize route strings/constants in one location used by both mount + reflection.

### Risk 3: Composition regression

Problem:

Switching wrapper ownership can break startup wiring.

Mitigation:

1. Migrate with integration tests in place.
2. Keep one transitional PR where old wrapper exists but unused, then remove.

## Alternatives Considered

1. Keep current wrapper and only add reflection method there.
- Rejected: does not simplify ownership; keeps inventory glue in composition repo.

2. Make backendcomponent import backendhost directly.
- Rejected: mixes runtime core with host-contract concerns; reduces reuse flexibility.

## Acceptance Criteria

1. Inventory module is constructible from `go-go-app-inventory` as a host module.
2. Inventory appears reflective in `/api/os/apps`.
3. `GET /api/os/apps/inventory/reflection` returns stable non-empty payload.
4. Existing inventory endpoints continue to function unchanged.
5. `wesen-os` no longer needs inventory-specific wrapper logic.

## Open Questions

1. Should inventory reflection include embedded schemas immediately or URI references only?
2. Do we want explicit `EnableReflection` config flag for inventory (like ARC/GEPA), or always-on reflection?
3. Which profile API subroutes should be explicitly listed vs summarized in one entry?

## References

1. `pkg/backendcomponent/component.go`
2. `pkg/backendcomponent/component_test.go`
3. `/home/manuel/workspaces/2026-03-01/add-os-doc-browser/wesen-os/cmd/wesen-os-launcher/inventory_backend_module.go`
4. `/home/manuel/workspaces/2026-03-01/add-os-doc-browser/go-go-os-backend/pkg/backendhost/module.go`
5. `/home/manuel/workspaces/2026-03-01/add-os-doc-browser/go-go-os-frontend/apps/apps-browser/src/domain/types.ts`
