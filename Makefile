.PHONY: gifs lint lintmax gosec govulncheck test build bump-glazed

all: gifs

TAPES=$(wildcard doc/vhs/*.tape)
gifs: $(TAPES)
	if [ -n "$(TAPES)" ]; then for i in $(TAPES); do vhs < $$i; done; fi

docker-lint:
	docker run --rm -v $(shell pwd):/app -w /app golangci/golangci-lint:latest golangci-lint run -v

lint:
	golangci-lint run -v

lintmax:
	golangci-lint run -v --max-same-issues=100

gosec:
	go install github.com/securego/gosec/v2/cmd/gosec@latest
	gosec -exclude=G101,G304,G301,G306 -exclude-dir=.history ./...

govulncheck:
	go install golang.org/x/vuln/cmd/govulncheck@latest
	govulncheck ./...

test:
	go test ./...

build:
	go generate ./...
	go build ./...

bump-glazed:
	go get github.com/go-go-golems/glazed@latest
	go get github.com/go-go-golems/clay@latest
	go mod tidy

.PHONY: logcopter-generate
logcopter-generate:
	GOWORK=off go tool logcopter-gen -include-main -var zlog -area-prefix go-go-golems.go-go-app-inventory -strip-prefix github.com/go-go-golems/go-go-app-inventory ./cmd/... ./pkg/...

.PHONY: logcopter-check
logcopter-check:
	GOWORK=off go tool logcopter-gen -include-main -var zlog -area-prefix go-go-golems.go-go-app-inventory -strip-prefix github.com/go-go-golems/go-go-app-inventory -check ./cmd/... ./pkg/...

GLAZED_LINT_BIN ?= /tmp/glazed-lint
GLAZED_LINT_PKG ?= github.com/go-go-golems/glazed/cmd/tools/glazed-lint
GLAZED_VERSION ?= v1.3.6

.PHONY: glazed-lint-build glazed-lint

glazed-lint-build:
	@echo "Building glazed-lint from Glazed module..."
	@if [ -n "$(GLAZED_VERSION)" ]; then \
		echo "Installing $(GLAZED_LINT_PKG)@$(GLAZED_VERSION)"; \
		GOBIN=$(dir $(GLAZED_LINT_BIN)) GOWORK=off go install $(GLAZED_LINT_PKG)@$(GLAZED_VERSION); \
	else \
		echo "Installing $(GLAZED_LINT_PKG) from workspace/module"; \
		GOBIN=$(dir $(GLAZED_LINT_BIN)) go install $(GLAZED_LINT_PKG); \
	fi

# cmd/inventory-seed is a seed-data helper with legacy Cobra flags, not a
# user-facing Glazed command; keep the rollout gate focused on package CLIs.
glazed-lint: glazed-lint-build
	GOWORK=off go vet -vettool=$(GLAZED_LINT_BIN) -glazedclilint.allow-paths=cmd/inventory-seed/ ./cmd/... ./pkg/...
