package backendmodule

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

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
