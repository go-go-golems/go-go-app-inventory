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
			{ID: "chat", Stability: "stable", Description: "Start inventory chat requests"},
			{ID: "ws", Stability: "stable", Description: "Stream conversation events over WebSocket"},
			{ID: "timeline", Stability: "stable", Description: "Retrieve timeline snapshots for conversations"},
			{ID: "profiles", Stability: "beta", Description: "Manage runtime profiles and middleware settings"},
			{ID: "confirm", Stability: "stable", Description: "Serve plz-confirm operator workflow endpoints"},
			{ID: "reflection", Stability: "stable", Description: "Discover inventory APIs and capabilities"},
		},
		Docs: []backendhost.ReflectionDocLink{
			{
				ID:          "inventory-readme",
				Title:       "go-go-app-inventory README",
				Path:        "go-go-app-inventory/README.md",
				Description: "Repository overview and ownership boundaries",
			},
		},
		APIs: []backendhost.ReflectionAPI{
			{
				ID:      "chat-start",
				Method:  http.MethodPost,
				Path:    basePath + "/chat",
				Summary: "Start a chat turn",
				Tags:    []string{"chat"},
			},
			{
				ID:      "ws-events",
				Method:  http.MethodGet,
				Path:    basePath + "/ws",
				Summary: "WebSocket stream for conversation events",
				Tags:    []string{"ws", "events"},
			},
			{
				ID:      "timeline-get",
				Method:  http.MethodGet,
				Path:    basePath + "/api/timeline",
				Summary: "Get conversation timeline snapshot",
				Tags:    []string{"timeline"},
			},
			{
				ID:      "profiles-list",
				Method:  http.MethodGet,
				Path:    basePath + "/api/chat/profiles",
				Summary: "List available runtime profiles",
				Tags:    []string{"profiles"},
			},
			{
				ID:      "profile-current",
				Method:  http.MethodGet,
				Path:    basePath + "/api/chat/profile",
				Summary: "Get current profile assignment",
				Tags:    []string{"profiles"},
			},
			{
				ID:      "confirm-api",
				Method:  http.MethodPost,
				Path:    basePath + "/confirm",
				Summary: "Start confirm operator interactions",
				Tags:    []string{"confirm"},
			},
		},
	}
}

