package backendmodule

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-go-golems/go-go-app-inventory/pkg/backendcomponent"
	"github.com/go-go-golems/go-go-os-backend/pkg/backendhost"
	"github.com/stretchr/testify/require"
)

type stubComponent struct{}

func (s *stubComponent) Manifest() backendcomponent.AppManifest {
	return backendcomponent.AppManifest{
		AppID:       AppID,
		Name:        "Inventory",
		Description: "Inventory chat runtime, profiles, timeline, and confirm APIs",
		Required:    true,
		Capabilities: []string{
			"chat",
			"ws",
			"timeline",
			"profiles",
			"confirm",
		},
	}
}

func (s *stubComponent) MountRoutes(_ *http.ServeMux) error { return nil }
func (s *stubComponent) Init(_ context.Context) error       { return nil }
func (s *stubComponent) Start(_ context.Context) error      { return nil }
func (s *stubComponent) Stop(_ context.Context) error       { return nil }
func (s *stubComponent) Health(_ context.Context) error     { return nil }

func TestManifestContract(t *testing.T) {
	module := NewModule(Options{})
	manifest := module.Manifest()

	require.Equal(t, AppID, manifest.AppID)
	require.Equal(t, "Inventory", manifest.Name)
	require.True(t, manifest.Required)
	require.ElementsMatch(t, []string{"chat", "ws", "timeline", "profiles", "confirm"}, manifest.Capabilities)
}

func TestReflectionContract(t *testing.T) {
	module := NewModule(Options{})
	doc, err := module.Reflection(context.Background())
	require.NoError(t, err)
	require.NotNil(t, doc)
	require.Equal(t, AppID, doc.AppID)
	require.Equal(t, "Inventory", doc.Name)
	require.Equal(t, "v1", doc.Version)
	require.NotEmpty(t, doc.Capabilities)
	require.NotEmpty(t, doc.APIs)

	apiByID := map[string]bool{}
	for _, api := range doc.APIs {
		apiByID[api.ID] = true
		require.Contains(t, api.Path, "/api/apps/inventory/")
	}
	require.True(t, apiByID["chat-start"])
	require.True(t, apiByID["ws-events"])
	require.True(t, apiByID["timeline-get"])
	require.True(t, apiByID["profiles-list"])
	require.True(t, apiByID["profile-current"])
	require.True(t, apiByID["confirm-api"])
	require.True(t, apiByID["docs-list"])
	require.True(t, apiByID["docs-get"])
}

func TestLifecycleDelegationBehavior(t *testing.T) {
	module := NewModule(Options{})

	require.Error(t, module.Init(context.Background()))
	require.Error(t, module.Start(context.Background()))
	require.Error(t, module.Health(context.Background()))
	require.NoError(t, module.Stop(context.Background()))
}

func TestMountRoutesValidatesDependencies(t *testing.T) {
	module := NewModule(Options{})

	require.Error(t, module.MountRoutes(nil))
	require.Error(t, module.MountRoutes(http.NewServeMux()))
}

func TestDocStoreContract(t *testing.T) {
	module := NewModule(Options{})
	store := module.DocStore()
	require.NotNil(t, store)
	require.Equal(t, 4, store.Count())

	overview, ok := store.Get("overview")
	require.True(t, ok)
	require.Equal(t, "Inventory Module Overview", overview.Title)
}

func TestMountRoutes_MountsDocsEndpoints(t *testing.T) {
	store, err := loadDocStore()
	require.NoError(t, err)

	module := &Module{
		component: &stubComponent{},
		docStore:  store,
	}

	mux := http.NewServeMux()
	require.NoError(t, module.MountRoutes(mux))

	tocReq := httptest.NewRequest(http.MethodGet, "/docs", nil)
	tocRes := httptest.NewRecorder()
	mux.ServeHTTP(tocRes, tocReq)
	require.Equal(t, http.StatusOK, tocRes.Code)

	var tocPayload struct {
		ModuleID string `json:"module_id"`
		Docs     []struct {
			Slug  string `json:"slug"`
			Title string `json:"title"`
		} `json:"docs"`
	}
	require.NoError(t, json.NewDecoder(tocRes.Body).Decode(&tocPayload))
	require.Equal(t, AppID, tocPayload.ModuleID)
	require.Len(t, tocPayload.Docs, 4)

	docReq := httptest.NewRequest(http.MethodGet, "/docs/overview", nil)
	docRes := httptest.NewRecorder()
	mux.ServeHTTP(docRes, docReq)
	require.Equal(t, http.StatusOK, docRes.Code)
	require.Contains(t, docRes.Body.String(), `"slug":"overview"`)
}

func TestManifestEndpoint_IncludesDocsHintForInventoryModule(t *testing.T) {
	store, err := loadDocStore()
	require.NoError(t, err)
	module := &Module{
		component: &stubComponent{},
		docStore:  store,
	}

	registry, err := backendhost.NewModuleRegistry(module)
	require.NoError(t, err)

	mux := http.NewServeMux()
	backendhost.RegisterAppsManifestEndpoint(mux, registry)

	req := httptest.NewRequest(http.MethodGet, "/api/os/apps", nil)
	res := httptest.NewRecorder()
	mux.ServeHTTP(res, req)
	require.Equal(t, http.StatusOK, res.Code)

	var payload struct {
		Apps []map[string]any `json:"apps"`
	}
	require.NoError(t, json.NewDecoder(res.Body).Decode(&payload))
	require.Len(t, payload.Apps, 1)

	docsHint, ok := payload.Apps[0]["docs"].(map[string]any)
	require.True(t, ok)
	require.Equal(t, true, docsHint["available"])
	require.Equal(t, "/api/apps/inventory/docs", docsHint["url"])
	require.EqualValues(t, 4, docsHint["count"])
}
