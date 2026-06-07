package backendmodule

import (
	"context"
	"net/http"

	gepprofiles "github.com/go-go-golems/geppetto/pkg/engineprofiles"
	"github.com/go-go-golems/geppetto/pkg/inference/middlewarecfg"
	"github.com/go-go-golems/go-go-app-inventory/pkg/backendcomponent"
	"github.com/go-go-golems/go-go-os-backend/pkg/backendhost"
	"github.com/go-go-golems/go-go-os-backend/pkg/docmw"
	webchat "github.com/go-go-golems/go-go-os-chat/pkg/webchat"
	webhttp "github.com/go-go-golems/go-go-os-chat/pkg/webchat/http"
	"github.com/pkg/errors"
)

const AppID = backendcomponent.AppID

// Module adapts the inventory backend component to the shared backendhost
// contract used by composition runtimes.
type Module struct {
	component backendcomponent.Component
	docStore  *docmw.DocStore
	docErr    error
}

type Options struct {
	Server                *webchat.Server
	RequestResolver       webhttp.ConversationRequestResolver
	ProfileRegistry       gepprofiles.Registry
	DefaultRegistrySlug   gepprofiles.RegistrySlug
	MiddlewareDefinitions middlewarecfg.DefinitionRegistry
	ConfirmMountPath      string
}

var _ backendhost.AppBackendModule = (*Module)(nil)
var _ backendhost.ReflectiveAppBackendModule = (*Module)(nil)
var _ backendhost.DocumentableAppBackendModule = (*Module)(nil)

func NewModule(opts Options) *Module {
	componentOpts := backendcomponent.Options{
		Server:                opts.Server,
		RequestResolver:       opts.RequestResolver,
		ProfileRegistry:       opts.ProfileRegistry,
		DefaultRegistrySlug:   opts.DefaultRegistrySlug,
		MiddlewareDefinitions: opts.MiddlewareDefinitions,
		ConfirmMountPath:      opts.ConfirmMountPath,
	}
	docStore, docErr := loadDocStore()
	return &Module{
		component: backendcomponent.NewInventoryBackendComponent(componentOpts),
		docStore:  docStore,
		docErr:    docErr,
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
	if err := m.component.MountRoutes(mux); err != nil {
		return err
	}
	if m.docStore == nil {
		return nil
	}
	return docmw.MountRoutes(mux, m.docStore)
}

func (m *Module) Init(ctx context.Context) error {
	if m.docErr != nil {
		return errors.Wrap(m.docErr, "load inventory docs store")
	}
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

func (m *Module) DocStore() *docmw.DocStore {
	return m.docStore
}
