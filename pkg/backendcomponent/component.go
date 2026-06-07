package backendcomponent

import (
	"context"
	"fmt"
	"net/http"

	gepprofiles "github.com/go-go-golems/geppetto/pkg/engineprofiles"
	"github.com/go-go-golems/geppetto/pkg/inference/middlewarecfg"
	chatservice "github.com/go-go-golems/go-go-os-chat/pkg/chatservice"
	webchat "github.com/go-go-golems/go-go-os-chat/pkg/webchat"
	webhttp "github.com/go-go-golems/go-go-os-chat/pkg/webchat/http"
)

const AppID = "inventory"

const (
	defaultConfirmMountPath = "/confirm"
)

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

type Options struct {
	Server                *webchat.Server
	RequestResolver       webhttp.ConversationRequestResolver
	ProfileRegistry       gepprofiles.Registry
	DefaultRegistrySlug   gepprofiles.RegistrySlug
	MiddlewareDefinitions middlewarecfg.DefinitionRegistry
	ConfirmMountPath      string
}

type InventoryBackendComponent struct {
	service         *chatservice.Component
	profileRegistry gepprofiles.Registry
}

func NewInventoryBackendComponent(opts Options) *InventoryBackendComponent {
	registrySlug := opts.DefaultRegistrySlug
	if registrySlug.IsZero() {
		registrySlug = gepprofiles.MustRegistrySlug("default")
	}
	confirmMountPath := opts.ConfirmMountPath
	if confirmMountPath == "" {
		confirmMountPath = defaultConfirmMountPath
	}
	return &InventoryBackendComponent{
		service: chatservice.New(chatservice.Options{
			Server:          opts.Server,
			RequestResolver: opts.RequestResolver,
			ProfileAPI: &chatservice.ProfileAPIOptions{
				Registry:                        opts.ProfileRegistry,
				DefaultRegistrySlug:             registrySlug,
				MiddlewareDefinitions:           opts.MiddlewareDefinitions,
				EnableCurrentProfileCookieRoute: false,
			},
			ConfirmMountPath: confirmMountPath,
		}),
		profileRegistry: opts.ProfileRegistry,
	}
}

func (m *InventoryBackendComponent) Manifest() AppManifest {
	return AppManifest{
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

func (m *InventoryBackendComponent) MountRoutes(mux *http.ServeMux) error {
	if mux == nil {
		return fmt.Errorf("inventory backend component mount mux is nil")
	}
	if m.profileRegistry == nil {
		return fmt.Errorf("inventory backend component profile registry is nil")
	}
	return m.service.MountRoutes(mux)
}

func (m *InventoryBackendComponent) Init(ctx context.Context) error {
	if m == nil || m.service == nil {
		return fmt.Errorf("inventory backend component is not initialized")
	}
	return m.service.Init(ctx)
}

func (m *InventoryBackendComponent) Start(ctx context.Context) error {
	if m == nil || m.service == nil {
		return fmt.Errorf("inventory backend component is not initialized")
	}
	return m.service.Start(ctx)
}

func (m *InventoryBackendComponent) Stop(ctx context.Context) error {
	if m == nil || m.service == nil {
		return nil
	}
	return m.service.Stop(ctx)
}

func (m *InventoryBackendComponent) Health(ctx context.Context) error {
	if m == nil || m.service == nil {
		return fmt.Errorf("inventory backend component server is not initialized")
	}
	return m.service.Health(ctx)
}
