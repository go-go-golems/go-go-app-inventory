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
	require.ElementsMatch(t, []string{"docs"}, manifest.Capabilities)
}

func TestManifestContractWithChat(t *testing.T) {
	component := NewInventoryBackendComponent(Options{
		Chat: func(*http.ServeMux) error { return nil },
	})
	manifest := component.Manifest()

	require.ElementsMatch(t,
		[]string{"docs", "chat", "chat-sessions", "ws", "frontend-tools", "profiles"},
		manifest.Capabilities,
	)
}

func TestLifecycleWithoutChatIsHealthy(t *testing.T) {
	component := NewInventoryBackendComponent(Options{})

	require.NoError(t, component.Init(context.Background()))
	require.NoError(t, component.Start(context.Background()))
	require.NoError(t, component.Health(context.Background()))
	require.NoError(t, component.Stop(context.Background()))
}

func TestMountRoutesRequiresMux(t *testing.T) {
	component := NewInventoryBackendComponent(Options{})

	require.Error(t, component.MountRoutes(nil))
	require.NoError(t, component.MountRoutes(http.NewServeMux()))
}

func TestMountRoutesDelegatesToChat(t *testing.T) {
	mounted := false
	component := NewInventoryBackendComponent(Options{
		Chat: func(mux *http.ServeMux) error {
			mounted = true
			return nil
		},
	})

	require.NoError(t, component.MountRoutes(http.NewServeMux()))
	require.True(t, mounted)
}

func TestStopDelegatesToChatStop(t *testing.T) {
	stopped := false
	component := NewInventoryBackendComponent(Options{
		ChatStop: func(context.Context) error {
			stopped = true
			return nil
		},
	})

	require.NoError(t, component.Stop(context.Background()))
	require.True(t, stopped)
}
