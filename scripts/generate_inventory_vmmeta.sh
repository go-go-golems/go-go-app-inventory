#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INVENTORY_DIR="$ROOT_DIR/apps/inventory"
DOCS_DIR="src/domain/vm/docs"

cd "$INVENTORY_DIR"

args=(
  --pack-id ui.card.v1
  --cards-dir src/domain/vm/cards
  --output-json src/domain/generated/inventory.vmmeta.json
  --output-ts src/domain/generated/inventoryVmmeta.generated.ts
)

if [ -d "$DOCS_DIR" ]; then
  args+=(--docs-dir "$DOCS_DIR")
fi

GOWORK=off go tool -modfile="$ROOT_DIR/tools/go.mod" go-go-os-backend vmmeta generate "${args[@]}"
