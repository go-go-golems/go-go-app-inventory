package backendmodule

import (
	"context"
	"net/http"

	"github.com/go-go-golems/go-go-app-inventory/pkg/backendcomponent"
	"github.com/go-go-golems/geppetto/pkg/inference/middlewarecfg"
	gepprofiles "github.com/go-go-golems/geppetto/pkg/profiles"
	"github.com/go-go-golems/go-go-os-backend/pkg/backendhost"
	webchat "github.com/go-go-golems/pinocchio/pkg/webchat"
	webhttp "github.com/go-go-golems/pinocchio/pkg/webchat/http"
)

const AppID = backendcomponent.AppID

// Module adapts the inventory backend component to the shared backendhost
// contract used by composition runtimes.
type Module struct {
	component backendcomponent.Component
}

type Options struct {
	Server                *webchat.Server
	RequestResolver       webhttp.ConversationRequestResolver
	ProfileRegistry       gepprofiles.Registry
	DefaultRegistrySlug   gepprofiles.RegistrySlug
	MiddlewareDefinitions middlewarecfg.DefinitionRegistry
	ExtensionSchemas      []webhttp.ExtensionSchemaDocument
	WriteActor            string
	WriteSource           string
	ConfirmMountPath      string
}

var _ backendhost.AppBackendModule = (*Module)(nil)
var _ backendhost.ReflectiveAppBackendModule = (*Module)(nil)

func NewModule(opts Options) *Module {
	componentOpts := backendcomponent.Options{
		Server:                opts.Server,
		RequestResolver:       opts.RequestResolver,
		ProfileRegistry:       opts.ProfileRegistry,
		DefaultRegistrySlug:   opts.DefaultRegistrySlug,
		MiddlewareDefinitions: opts.MiddlewareDefinitions,
		ExtensionSchemas:      append([]webhttp.ExtensionSchemaDocument(nil), opts.ExtensionSchemas...),
		WriteActor:            opts.WriteActor,
		WriteSource:           opts.WriteSource,
		ConfirmMountPath:      opts.ConfirmMountPath,
	}
	return &Module{
		component: backendcomponent.NewInventoryBackendComponent(componentOpts),
	}
}

func (m *Module) Manifest() backendhost.AppBackendManifest {
	manifest := m.component.Manifest()
	return backendhost.AppBackendManifest{
		AppID:        manifest.AppID,
		Name:         manifest.Name,
		Description:  manifest.Description,
		Required:     manifest.Required,
		Capabilities: append([]string(nil), manifest.Capabilities...),
	}
}

func (m *Module) MountRoutes(mux *http.ServeMux) error {
	return m.component.MountRoutes(mux)
}

func (m *Module) Init(ctx context.Context) error {
	return m.component.Init(ctx)
}

func (m *Module) Start(ctx context.Context) error {
	return m.component.Start(ctx)
}

func (m *Module) Stop(ctx context.Context) error {
	return m.component.Stop(ctx)
}

func (m *Module) Health(ctx context.Context) error {
	return m.component.Health(ctx)
}
