---
Title: Inventory Troubleshooting
DocType: troubleshooting
Topics:
  - troubleshooting
  - backend
Summary: "Frequent inventory backend startup and routing issues."
Order: 4
---

# Inventory Troubleshooting

Common issues:

- Missing dependencies in `Options` can cause `Init` and `MountRoutes` to fail.
- Invalid profile registry wiring can break profile APIs.
- Missing tool registration can lead to runtime behavior mismatches in chat flows.

Quick checks:

- Verify module health in `/api/os/apps`.
- Verify reflection payload in `/api/os/apps/inventory/reflection`.
- Verify docs routes in `/api/apps/inventory/docs`.

