# Tasks

## Planning

- [x] Create INV-01 ticket workspace.
- [x] Write design document for inventory backend module simplification.
- [x] Write implementation guide with step-by-step migration instructions.

## Phase 1: Inventory Module Package

- [x] Add `pkg/backendmodule/module.go` in `go-go-app-inventory`.
- [x] Add constructor that builds and owns `backendcomponent.InventoryBackendComponent`.
- [x] Implement `backendhost.AppBackendModule` methods (`Manifest`, `MountRoutes`, `Init`, `Start`, `Stop`, `Health`).
- [x] Add compile-time interface assertions for backend host contracts.
- [x] Add/verify `go-go-os-backend` dependency in `go.mod`.

## Phase 2: Reflection Parity

- [x] Add `Reflection(ctx)` implementation for inventory module.
- [x] Define inventory reflection capabilities list.
- [x] Define inventory reflection API route inventory (chat/ws/timeline/profiles/confirm).
- [x] Add docs links and schema refs strategy (initial minimal version acceptable).
- [x] Add reflection unit tests validating required fields and path conventions.

## Phase 3: Test Coverage in Inventory Repo

- [x] Add tests for module manifest mapping behavior.
- [x] Add tests for lifecycle delegation behavior.
- [x] Add tests for reflection response stability.
- [x] Run `go test ./... -count=1` in `go-go-app-inventory` and capture output.

## Phase 4: Composition Migration (wesen-os)

- [ ] Update `wesen-os` launcher to use inventory module from `go-go-app-inventory/pkg/backendmodule`.
- [ ] Remove or retire `wesen-os/cmd/wesen-os-launcher/inventory_backend_module.go`.
- [ ] Update integration tests to assert inventory reflection endpoint.
- [ ] Run launcher integration tests and verify no route regressions.

## Phase 5: Runtime Verification

- [ ] Verify `/api/os/apps` shows inventory reflection hint.
- [ ] Verify `/api/os/apps/inventory/reflection` returns 200 with expected payload.
- [ ] Verify existing inventory runtime paths still work (`/chat`, `/ws`, `/api/timeline`, profile APIs, `/confirm`).

## Phase 6: Cleanup and Docs

- [ ] Update inventory README (if needed) with new backend module package ownership.
- [ ] Update relevant `wesen-os` docs that mention inventory wrapper-specific behavior.
- [ ] Record final migration notes and any follow-up tasks.
