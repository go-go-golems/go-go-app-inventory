#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INVENTORY_DIR="$ROOT_DIR/apps/inventory"
BACKEND_CMD="${GO_GO_OS_BACKEND_CMD:-$ROOT_DIR/../go-go-os-backend/cmd/go-go-os-backend}"
GENERATED_JSON="$INVENTORY_DIR/src/domain/generated/inventory.vmmeta.json"
GENERATED_TS="$INVENTORY_DIR/src/domain/generated/inventoryVmmeta.generated.ts"

if [ -d "$BACKEND_CMD" ]; then
  cd "$INVENTORY_DIR"
  go run "$BACKEND_CMD" vmmeta generate \
    --pack-id ui.card.v1 \
    --cards-dir src/domain/vm/cards \
    --docs-dir src/domain/vm/docs \
    --output-json src/domain/generated/inventory.vmmeta.json \
    --output-ts src/domain/generated/inventoryVmmeta.generated.ts
  exit 0
fi

if [ -f "$GENERATED_JSON" ] && [ -f "$GENERATED_TS" ]; then
  echo "go-go-os-backend checkout not found; reusing committed inventory VM metadata." >&2
  exit 0
fi

echo "missing go-go-os-backend checkout and committed VM metadata artifacts" >&2
exit 1
