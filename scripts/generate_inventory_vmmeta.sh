#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INVENTORY_DIR="$ROOT_DIR/apps/inventory"

cd "$INVENTORY_DIR"

GOWORK=off go tool -modfile="$ROOT_DIR/tools/go.mod" go-go-os-backend vmmeta generate \
  --pack-id ui.card.v1 \
  --cards-dir src/domain/vm/cards \
  --docs-dir src/domain/vm/docs \
  --output-json src/domain/generated/inventory.vmmeta.json \
  --output-ts src/domain/generated/inventoryVmmeta.generated.ts
