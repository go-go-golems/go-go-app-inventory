---
Title: Analyze HyperCard VM Runtime, Inventory Prompt Path, and Extensible DSL Platform
Ticket: APP-07-HYPERCARD-VM-RUNTIME-PLATFORM
Status: active
Topics:
    - architecture
    - backend
    - chat
    - frontend
    - hypercard
    - wesen-os
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: workspace-links/go-go-app-inventory/pkg/pinoweb/hypercard_events.go
      Note: Backend semantic event to timeline projection for generated hypercard artifacts
    - Path: workspace-links/go-go-app-sqlite/apps/sqlite/src/launcher/module.tsx
      Note: Reference async bridge mounting pattern for runtime cards
    - Path: workspace-links/go-go-os-frontend/packages/hypercard-runtime/src/runtime-host/PluginCardSessionHost.tsx
      Note: Frontend runtime host that loads generated cards into QuickJS
ExternalSources: []
Summary: Maps how inventory chat prompt policy becomes generated hypercard code, how that code is executed inside a constrained QuickJS runtime, and how to extend the platform toward multiple DSLs, richer widgets, and async HTTP or DB effect bridges.
LastUpdated: 2026-03-06T13:22:00-05:00
WhatFor: Use this ticket as the main entrypoint for understanding and extending the generated runtime-card platform behind inventory hypercards.
WhenToUse: Use before changing prompt packs, VM helper APIs, runtime action dispatch, richer widget rendering, or async query bridges.
---


# Analyze HyperCard VM Runtime, Inventory Prompt Path, and Extensible DSL Platform

## Overview

This ticket traces the full lifecycle of an inventory runtime card:

- request enters chat transport
- profile runtime resolves
- hypercard DSL instructions are injected into the model prompt
- the model emits tagged YAML with generated JavaScript
- the backend extracts and projects that payload into timeline entities
- the frontend registers the generated module and injects it into a QuickJS sandbox
- user interactions inside the sandbox become runtime intents that the host routes into reducers or async bridges

The main design finding is that the current implementation is already a small generated-runtime platform, but it is still named and packaged as if it were only for inventory hypercards. The recommended next step is to generalize it into runtime packs plus effect bridges, rather than handing raw async APIs directly to the VM.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field
- **Main Guide**: [design-doc/01-hypercard-vm-inventory-prompt-path-and-extensible-dsl-runtime-platform-guide.md](./design-doc/01-hypercard-vm-inventory-prompt-path-and-extensible-dsl-runtime-platform-guide.md)
- **Diary**: [reference/01-investigation-diary.md](./reference/01-investigation-diary.md)

## Status

Current status: **active**

## Topics

- architecture
- backend
- chat
- frontend
- hypercard
- wesen-os

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
