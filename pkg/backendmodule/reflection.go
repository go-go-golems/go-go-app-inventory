package backendmodule

import (
	"context"
	"net/http"

	"github.com/go-go-golems/go-go-os-backend/pkg/backendhost"
)

func (m *Module) Reflection(context.Context) (*backendhost.ModuleReflectionDocument, error) {
	return buildReflectionDocument(), nil
}

func buildReflectionDocument() *backendhost.ModuleReflectionDocument {
	basePath := "/api/apps/" + AppID
	return &backendhost.ModuleReflectionDocument{
		AppID:   AppID,
		Name:    "Inventory",
		Version: "v1",
		Summary: "Inventory chat runtime, profiles, timeline, and confirm APIs",
		Capabilities: []backendhost.ReflectionCapability{
			{ID: "chat", Stability: "stable", Description: "Chat sessions backed by pinocchio chatapp/sessionstream"},
			{ID: "ws", Stability: "stable", Description: "Stream session events over the sessionstream WebSocket"},
			{ID: "frontend-tools", Stability: "beta", Description: "Register browser-executed tools for chat sessions"},
			{ID: "profiles", Stability: "beta", Description: "Select engine profiles at session creation"},
			{ID: "reflection", Stability: "stable", Description: "Discover inventory APIs and capabilities"},
		},
		Docs: []backendhost.ReflectionDocLink{
			{
				ID:          "inventory-readme",
				Title:       "go-go-app-inventory README",
				Path:        "go-go-app-inventory/README.md",
				Description: "Repository overview and ownership boundaries",
			},
			{
				ID:          "inventory-docs-overview",
				Title:       "Inventory Module Overview",
				URL:         basePath + "/docs/overview",
				Description: "Backend module architecture and ownership boundaries",
			},
		},
		APIs: []backendhost.ReflectionAPI{
			{
				ID:      "chat-session-create",
				Method:  http.MethodPost,
				Path:    basePath + "/api/chat/sessions",
				Summary: "Create a chat session (optional profile selection)",
				Tags:    []string{"chat"},
			},
			{
				ID:      "chat-message-submit",
				Method:  http.MethodPost,
				Path:    basePath + "/api/chat/sessions/{id}/messages",
				Summary: "Submit a prompt to a chat session",
				Tags:    []string{"chat"},
			},
			{
				ID:      "chat-session-snapshot",
				Method:  http.MethodGet,
				Path:    basePath + "/api/chat/sessions/{id}",
				Summary: "Get a session timeline snapshot",
				Tags:    []string{"chat"},
			},
			{
				ID:      "chat-session-stop",
				Method:  http.MethodPost,
				Path:    basePath + "/api/chat/sessions/{id}/stop",
				Summary: "Stop the running inference for a session",
				Tags:    []string{"chat"},
			},
			{
				ID:      "chat-tools-manifest",
				Method:  http.MethodPost,
				Path:    basePath + "/api/chat/sessions/{id}/tools/manifest",
				Summary: "Register frontend tool manifest for a session",
				Tags:    []string{"frontend-tools"},
			},
			{
				ID:      "ws-events",
				Method:  http.MethodGet,
				Path:    basePath + "/api/chat/ws",
				Summary: "Sessionstream WebSocket for session events",
				Tags:    []string{"ws", "events"},
			},
			{
				ID:      "docs-list",
				Method:  http.MethodGet,
				Path:    basePath + "/docs",
				Summary: "List available inventory module docs",
				Tags:    []string{"docs"},
			},
			{
				ID:      "docs-get",
				Method:  http.MethodGet,
				Path:    basePath + "/docs/{slug}",
				Summary: "Fetch one inventory module doc by slug",
				Tags:    []string{"docs"},
			},
		},
	}
}
