package backendcomponent

import (
	"context"
	"fmt"
	"net/http"
)

const AppID = "inventory"

type AppManifest struct {
	AppID        string
	Name         string
	Description  string
	Required     bool
	Capabilities []string
}

type Component interface {
	Manifest() AppManifest
	MountRoutes(mux *http.ServeMux) error
	Init(ctx context.Context) error
	Start(ctx context.Context) error
	Stop(ctx context.Context) error
	Health(ctx context.Context) error
}

// ChatRoutes mounts a chat backend under the inventory app namespace. The
// composition host owns the chat runtime (pinocchio chatapp/sessionstream);
// this component no longer builds one itself. The legacy pinocchio
// pkg/webchat + chatservice wiring was removed when pinocchio deleted those
// packages (WESEN-OS-STOCKTAKE-2026-07 Decision D3).
type ChatRoutes func(mux *http.ServeMux) error

type Options struct {
	// Chat optionally mounts the host-owned chat routes for this app.
	Chat ChatRoutes
	// ChatStop optionally releases the host-owned chat runtime on Stop.
	ChatStop func(ctx context.Context) error
}

type InventoryBackendComponent struct {
	chat     ChatRoutes
	chatStop func(ctx context.Context) error
}

func NewInventoryBackendComponent(opts Options) *InventoryBackendComponent {
	return &InventoryBackendComponent{
		chat:     opts.Chat,
		chatStop: opts.ChatStop,
	}
}

func (m *InventoryBackendComponent) Manifest() AppManifest {
	capabilities := []string{"docs"}
	if m != nil && m.chat != nil {
		capabilities = append(capabilities, "chat", "chat-sessions", "ws", "frontend-tools", "profiles")
	}
	return AppManifest{
		AppID:        AppID,
		Name:         "Inventory",
		Description:  "Inventory chat runtime and docs APIs",
		Required:     true,
		Capabilities: capabilities,
	}
}

func (m *InventoryBackendComponent) MountRoutes(mux *http.ServeMux) error {
	if mux == nil {
		return fmt.Errorf("inventory backend component mount mux is nil")
	}
	if m == nil || m.chat == nil {
		return nil
	}
	return m.chat(mux)
}

func (m *InventoryBackendComponent) Init(ctx context.Context) error {
	if m == nil {
		return fmt.Errorf("inventory backend component is not initialized")
	}
	return nil
}

func (m *InventoryBackendComponent) Start(ctx context.Context) error {
	if m == nil {
		return fmt.Errorf("inventory backend component is not initialized")
	}
	return nil
}

func (m *InventoryBackendComponent) Stop(ctx context.Context) error {
	if m == nil || m.chatStop == nil {
		return nil
	}
	return m.chatStop(ctx)
}

func (m *InventoryBackendComponent) Health(ctx context.Context) error {
	if m == nil {
		return fmt.Errorf("inventory backend component is not initialized")
	}
	return nil
}
