---
Title: Inventory Profiles And Runtime
DocType: guide
Topics:
  - profiles
  - runtime
  - backend
Summary: "How inventory runtime profiles and middleware selections are resolved."
Order: 3
---

# Inventory Profiles And Runtime

Inventory profile selection is handled by the request resolver and profile registry provided through module options.

At runtime:

1. Incoming chat/profile requests are resolved to a profile slug.
2. The profile defines system prompt, middleware set, and tool policy.
3. The webchat runtime composer builds the effective runtime for the conversation.

