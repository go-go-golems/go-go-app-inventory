# go-go-app-inventory

`go-go-app-inventory` is the inventory domain repository.

It owns both:
- inventory backend/domain runtime
- inventory frontend app package (`@go-go-golems/inventory`)

## What Lives Here

- Backend/domain packages:
  - `pkg/backendmodule`
  - `pkg/inventorydb`
  - `pkg/inventorytools`
  - `pkg/pinoweb`
  - related inventory API/service packages
- Frontend workspace:
  - `apps/inventory`

## Frontend Commands

```bash
npm install
npm run dev
npm run build
npm run storybook
npm run typecheck
```

## Public Frontend API Surface

Launcher composition should import inventory via package exports, not source internals.

- `@go-go-golems/inventory`
- `@go-go-golems/inventory/launcher`
- `@go-go-golems/inventory/reducers`

## Backend Tests

```bash
GOWORK=off go test ./...
```

## Ownership Boundary

Use this repo when you are:
- adding inventory features, reducers, selectors, domain tools, or API handlers
- evolving inventory launcher module contract exported to composition host

Use other repos when you are:
- editing shared desktop engine/platform APIs -> `go-go-os-frontend`
- editing launcher shell composition, dist sync, binary assembly -> `wesen-os`
