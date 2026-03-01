---
Title: Simplify Inventory Backend Module Integration and Add Reflection Parity
Ticket: INV-01
Status: active
Topics:
    - backend
    - reflection
    - documentation
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-03-01/add-os-doc-browser/go-go-app-inventory/pkg/backendcomponent/component.go
      Note: Current inventory backend component that will be wrapped by new module package
    - Path: /home/manuel/workspaces/2026-03-01/add-os-doc-browser/wesen-os/cmd/wesen-os-launcher/inventory_backend_module.go
      Note: Current composition-local wrapper targeted for removal/simplification
    - Path: /home/manuel/workspaces/2026-03-01/add-os-doc-browser/go-go-os-backend/pkg/backendhost/module.go
      Note: Host module interfaces inventory should implement directly
ExternalSources: []
Summary: >-
    Ticket for simplifying inventory backend integration by moving host-adapter
    ownership into go-go-app-inventory and adding reflection support so
    inventory reaches parity with ARC and GEPA.
LastUpdated: 2026-03-01T13:20:00-05:00
WhatFor: >-
    Plan and track the refactor that removes composition-specific wrapper
    complexity and adds inventory reflection discoverability.
WhenToUse: >-
    Use this ticket when implementing inventory backend module refactor and
    reflection parity work.
---

# Simplify Inventory Backend Module Integration and Add Reflection Parity

## Task Description

Refactor inventory backend integration so `go-go-app-inventory` owns its backend module adapter logic and reflection metadata, instead of relying on inventory-specific wrapper code in `wesen-os`.

Target outcome:

1. Inventory module can be composed like ARC and GEPA.
2. Inventory exposes reflection metadata via host reflection endpoint.
3. Composition code in `wesen-os` is simpler and more uniform across apps.

## Document Map

1. `design-doc/01-inventory-backend-module-simplification-and-reflection-design.md`
- Architecture and migration design.

2. `reference/01-implementation-guide-inventory-backend-module-reflection-parity.md`
- Step-by-step implementation guide and validation commands.

3. `reference/02-implementation-diary.md`
- Chronological implementation diary with commit and command trace.

4. `tasks.md`
- Detailed execution checklist by phase.
