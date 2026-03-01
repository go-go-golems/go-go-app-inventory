---
Title: 'Implementation Guide: Inventory Backend Module + Reflection Parity'
Ticket: INV-01
Status: active
Topics:
    - backend
    - reflection
    - documentation
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../go-go-os-backend/pkg/backendhost/manifest_endpoint.go
      Note: Manifest hint behavior impacted by reflection parity goal
    - Path: ../../../../../../go-go-os-backend/pkg/backendhost/module.go
      Note: Host contracts to satisfy from inventory module package
    - Path: ../../../../../../wesen-os/cmd/wesen-os-launcher/inventory_backend_module.go
      Note: Wrapper to replace during migration
    - Path: ../../../../../../wesen-os/cmd/wesen-os-launcher/main_integration_test.go
      Note: |-
        Integration tests to extend with inventory reflection assertions
        Integration tests to update for inventory reflection parity
    - Path: pkg/backendcomponent/component.go
      Note: |-
        Runtime component delegated to by new module package
        Delegation target for new backendmodule package
    - Path: pkg/backendcomponent/component_test.go
      Note: Baseline runtime behavior tests to keep passing
ExternalSources: []
Summary: Step-by-step implementation guide for moving inventory adapter ownership into go-go-app-inventory and adding reflection parity with ARC/GEPA.
LastUpdated: 2026-03-01T13:20:00-05:00
WhatFor: Execution runbook for implementing INV-01 with concrete file changes, test commands, and validation checkpoints.
WhenToUse: Use when actively implementing or reviewing INV-01 changes.
---


# Implementation Guide: Inventory Backend Module + Reflection Parity

## Goal

Implement inventory as a first-class backend module package in this repository and add reflection so runtime composition treats inventory the same way as ARC and GEPA.

## Preconditions

1. Workspace contains sibling repos:
- `go-go-app-inventory`
- `go-go-os-backend`
- `wesen-os`

2. `go-go-app-inventory` can import `github.com/go-go-golems/go-go-os-backend/pkg/backendhost`.

## Target File Plan

### Files to add in this repo

1. `pkg/backendmodule/module.go`
2. `pkg/backendmodule/reflection.go`
3. `pkg/backendmodule/contracts.go` (optional, if you want local reflection config/types)
4. `pkg/backendmodule/module_test.go`

### Files to update in this repo

1. `go.mod` (add `go-go-os-backend` dependency if missing)
2. `pkg/backendcomponent/component.go` (minimal updates only if route constants/helpers are extracted)

### External files to update (follow-up in wesen-os)

1. `wesen-os/cmd/wesen-os-launcher/main.go`
2. Remove or stop using `wesen-os/cmd/wesen-os-launcher/inventory_backend_module.go`
3. `wesen-os/cmd/wesen-os-launcher/main_integration_test.go`

## Detailed Steps

### Step 1: Create inventory backend module package

1. Add a `Module` struct in `pkg/backendmodule/module.go` that holds:
- inner `backendcomponent.Component`
- optional config (if needed for reflection toggles)

2. Add constructor:
- Accept same dependency bundle currently passed to `newInventoryBackendModule(...)` in `wesen-os`.
- Build `backendcomponent.NewInventoryBackendComponent(...)` internally.

3. Implement methods:
- `Manifest() backendhost.AppBackendManifest`
- `MountRoutes(*http.ServeMux) error`
- `Init(ctx) error`
- `Start(ctx) error`
- `Stop(ctx) error`
- `Health(ctx) error`

4. Add compile-time checks for host interfaces.

## Step 2: Add reflection implementation

1. Add `Reflection(ctx)` method returning `*backendhost.ModuleReflectionDocument`.
2. Build reflection doc with:
- app identity and summary
- capabilities
- API route list
- doc links (can start minimal)
- schema refs (can be URI-only initially)

3. Keep reflection generation deterministic and side-effect free.

## Step 3: Add tests in this repo

### Unit tests for module contract

1. Manifest fields match expected app id/name/capabilities.
2. Lifecycle methods delegate and preserve existing error behavior.
3. Reflection returns expected non-empty payload and stable key fields.

### Optional consistency test

1. Assert reflected API paths are under `/api/apps/inventory/...` and correspond to mounted routes.

## Step 4: Migrate usage in wesen-os

1. Update launcher composition to instantiate inventory backend module from this repo.
2. Ensure inventory appears as reflective in `/api/os/apps`.
3. Add integration test for `/api/os/apps/inventory/reflection`.
4. Remove old wrapper once behavior is stable.

## Suggested Reflection Payload Skeleton

```go
func (m *Module) Reflection(context.Context) (*backendhost.ModuleReflectionDocument, error) {
    base := "/api/apps/inventory"
    return &backendhost.ModuleReflectionDocument{
        AppID:   "inventory",
        Name:    "Inventory",
        Version: "v1",
        Summary: "Inventory chat runtime, profiles, timeline, and confirm APIs",
        Capabilities: []backendhost.ReflectionCapability{
            {ID: "chat", Stability: "stable", Description: "Start chat jobs"},
            {ID: "ws", Stability: "stable", Description: "Stream events over websocket"},
            {ID: "timeline", Stability: "stable", Description: "Conversation timeline snapshots"},
            {ID: "profiles", Stability: "beta", Description: "Profile and middleware management"},
            {ID: "confirm", Stability: "stable", Description: "plz-confirm HTTP endpoints"},
        },
        APIs: []backendhost.ReflectionAPI{
            {ID: "chat", Method: "POST", Path: base + "/chat"},
            {ID: "ws", Method: "GET", Path: base + "/ws"},
            {ID: "timeline", Method: "GET", Path: base + "/api/timeline"},
            {ID: "profiles-list", Method: "GET", Path: base + "/api/chat/profiles"},
            {ID: "confirm", Method: "POST", Path: base + "/confirm"},
        },
    }, nil
}
```

## Validation Commands

In `go-go-app-inventory`:

```bash
go test ./... -count=1
```

In `wesen-os` after migration:

```bash
GOWORK=off go test ./cmd/wesen-os-launcher -count=1
```

Manual smoke after running launcher:

```bash
curl -s http://127.0.0.1:8091/api/os/apps | jq
curl -s http://127.0.0.1:8091/api/os/apps/inventory/reflection | jq
```

## Review Checklist

1. Inventory reflection appears in manifest (`reflection.available=true`).
2. Reflection endpoint returns 200 with valid document.
3. Existing inventory chat/ws/timeline routes still pass integration tests.
4. `wesen-os` no longer contains inventory-specific adaptation logic.
5. Code ownership is clear: inventory module logic in inventory repo; composition only composes.

## Common Pitfalls

1. Route mismatch between reflected paths and mounted paths.
2. Introducing host-contract dependencies into `backendcomponent` instead of new `backendmodule` package.
3. Changing runtime behavior while refactoring adapter ownership.
4. Forgetting to update integration tests in `wesen-os` when wrapper is removed.

## Handoff Notes

This ticket is intentionally scoped for implementation later. The design and task list are complete so the next engineer can execute without additional discovery.
