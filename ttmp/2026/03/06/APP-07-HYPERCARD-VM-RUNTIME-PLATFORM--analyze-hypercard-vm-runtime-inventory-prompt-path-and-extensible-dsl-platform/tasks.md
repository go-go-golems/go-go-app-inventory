# Tasks

## Investigation

- [x] Trace the inventory chat request path from frontend transport through backend request resolution and runtime composition.
- [x] Identify exactly where the hypercard and UI DSL instructions are injected into model inference.
- [x] Trace how generated `<hypercard:card:v2>` payloads are extracted, projected into timeline entities, and turned into frontend runtime card registrations.
- [x] Trace how generated JavaScript is executed inside the QuickJS sandbox and how intents escape back into Redux.
- [x] Compare the current inventory reducer model with the async bridge patterns used by SQLite and ARC.
- [x] Identify architectural gaps and blockers for conversation-scoped DSL selection, richer widgets, and live query workflows.

## Documentation

- [x] Write a detailed intern-facing design and implementation guide.
- [x] Record the chronological investigation diary with commands, failures, evidence, and review instructions.
- [x] Relate the key code files to the ticket and documents.

## Validation And Delivery

- [x] Run `docmgr doctor` for the ticket and fix any metadata issues.
- [x] Bundle the ticket documents for reMarkable upload with a dry run first.
- [x] Upload the final bundle to reMarkable and verify the remote listing.

## Follow-Up Implementation

- [ ] Fix the frontend/backend runtime selection naming mismatch (`profile` / `registry` vs `runtime_key` / `registry_slug`).
- [ ] Introduce a generic runtime artifact envelope that can coexist with `hypercard.card.v2` during migration.
- [ ] Add a frontend runtime-pack registry keyed by DSL or pack id.
- [ ] Split VM helper injection into explicit host packages such as `ui`, `widgets`, `effects`, and `format`.
- [ ] Add richer validated node kinds and renderer support for non-trivial widgets.
- [ ] Create reusable effect-host helpers for HTTP and DB query workflows.
- [ ] Add inventory-specific async query bridges that mirror request lifecycle state back into runtime state.
- [ ] Add integration tests that cover generated card injection, effect execution, and rerender after result patches.
