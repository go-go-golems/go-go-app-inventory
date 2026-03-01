---
Title: Inventory Module Overview
DocType: guide
Topics:
  - backend
  - inventory
  - onboarding
Summary: "Architecture and ownership boundaries for the inventory backend module."
Order: 1
---

# Inventory Module Overview

The inventory backend module owns chat, websocket, timeline, profile, confirm, and documentation routes under:

- `/api/apps/inventory/...`

The module delegates runtime behavior to `pkg/backendcomponent` and adds backend-host integration contracts:

- `AppBackendModule`
- `ReflectiveAppBackendModule`
- `DocumentableAppBackendModule`

