package backendcomponent

import (
	"context"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestManifestContract(t *testing.T) {
	component := NewInventoryBackendComponent(Options{})
	manifest := component.Manifest()

	require.Equal(t, AppID, manifest.AppID)
	require.Equal(t, "Inventory", manifest.Name)
	require.True(t, manifest.Required)
	require.ElementsMatch(t, []string{"chat", "ws", "timeline", "profiles", "confirm"}, manifest.Capabilities)
}

func TestLifecycleRequiresServer(t *testing.T) {
	component := NewInventoryBackendComponent(Options{})

	require.Error(t, component.Init(context.Background()))
	require.Error(t, component.Start(context.Background()))
	require.Error(t, component.Health(context.Background()))
	require.NoError(t, component.Stop(context.Background()))
}

func TestMountRoutesValidatesRequiredDependencies(t *testing.T) {
	component := NewInventoryBackendComponent(Options{})

	require.Error(t, component.MountRoutes(nil))
	require.Error(t, component.MountRoutes(http.NewServeMux()))
}
