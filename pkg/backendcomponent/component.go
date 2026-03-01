package backendcomponent

import (
	"context"
	"fmt"
	"net/http"

	"github.com/go-go-golems/geppetto/pkg/inference/middlewarecfg"
	gepprofiles "github.com/go-go-golems/geppetto/pkg/profiles"
	webchat "github.com/go-go-golems/pinocchio/pkg/webchat"
	webhttp "github.com/go-go-golems/pinocchio/pkg/webchat/http"
	plzconfirmbackend "github.com/go-go-golems/plz-confirm/pkg/backend"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
)

const AppID = "inventory"

const (
	defaultWriteActor       = "inventory-backend-component"
	defaultWriteSource      = "http-api"
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
	ExtensionSchemas      []webhttp.ExtensionSchemaDocument
	WriteActor            string
	WriteSource           string
	ConfirmMountPath      string
}

type InventoryBackendComponent struct {
	server                *webchat.Server
	requestResolver       webhttp.ConversationRequestResolver
	profileRegistry       gepprofiles.Registry
	defaultRegistrySlug   gepprofiles.RegistrySlug
	middlewareDefinitions middlewarecfg.DefinitionRegistry
	extensionSchemas      []webhttp.ExtensionSchemaDocument
	writeActor            string
	writeSource           string
	confirmMountPath      string
}

func NewInventoryBackendComponent(opts Options) *InventoryBackendComponent {
	registrySlug := opts.DefaultRegistrySlug
	if registrySlug.IsZero() {
		registrySlug = gepprofiles.MustRegistrySlug("default")
	}
	writeActor := opts.WriteActor
	if writeActor == "" {
		writeActor = defaultWriteActor
	}
	writeSource := opts.WriteSource
	if writeSource == "" {
		writeSource = defaultWriteSource
	}
	confirmMountPath := opts.ConfirmMountPath
	if confirmMountPath == "" {
		confirmMountPath = defaultConfirmMountPath
	}
	return &InventoryBackendComponent{
		server:                opts.Server,
		requestResolver:       opts.RequestResolver,
		profileRegistry:       opts.ProfileRegistry,
		defaultRegistrySlug:   registrySlug,
		middlewareDefinitions: opts.MiddlewareDefinitions,
		extensionSchemas:      append([]webhttp.ExtensionSchemaDocument(nil), opts.ExtensionSchemas...),
		writeActor:            writeActor,
		writeSource:           writeSource,
		confirmMountPath:      confirmMountPath,
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
	if m.server == nil {
		return fmt.Errorf("inventory backend component server is nil")
	}
	if m.requestResolver == nil {
		return fmt.Errorf("inventory backend component request resolver is nil")
	}
	if m.profileRegistry == nil {
		return fmt.Errorf("inventory backend component profile registry is nil")
	}

	chatHandler := webhttp.NewChatHandler(m.server.ChatService(), m.requestResolver)
	wsHandler := webhttp.NewWSHandler(
		m.server.StreamHub(),
		m.requestResolver,
		websocket.Upgrader{CheckOrigin: func(*http.Request) bool { return true }},
	)
	timelineHandler := webhttp.NewTimelineHandler(
		m.server.TimelineService(),
		log.With().Str("component", "inventory-chat").Str("route", "/api/apps/inventory/api/timeline").Logger(),
	)

	mux.HandleFunc("/chat", chatHandler)
	mux.HandleFunc("/chat/", chatHandler)
	mux.HandleFunc("/ws", wsHandler)
	webhttp.RegisterProfileAPIHandlers(mux, m.profileRegistry, webhttp.ProfileAPIHandlerOptions{
		DefaultRegistrySlug:             m.defaultRegistrySlug,
		EnableCurrentProfileCookieRoute: true,
		WriteActor:                      m.writeActor,
		WriteSource:                     m.writeSource,
		MiddlewareDefinitions:           m.middlewareDefinitions,
		ExtensionSchemas:                append([]webhttp.ExtensionSchemaDocument(nil), m.extensionSchemas...),
	})
	mux.HandleFunc("/api/timeline", timelineHandler)
	mux.HandleFunc("/api/timeline/", timelineHandler)
	mux.Handle("/api/", m.server.APIHandler())
	plzconfirmbackend.NewServer().Mount(mux, m.confirmMountPath)
	mux.Handle("/", m.server.UIHandler())

	return nil
}

func (m *InventoryBackendComponent) Init(context.Context) error {
	if m == nil || m.server == nil {
		return fmt.Errorf("inventory backend component is not initialized")
	}
	return nil
}

func (m *InventoryBackendComponent) Start(context.Context) error {
	if m == nil || m.server == nil {
		return fmt.Errorf("inventory backend component is not initialized")
	}
	return nil
}

func (m *InventoryBackendComponent) Stop(context.Context) error {
	return nil
}

func (m *InventoryBackendComponent) Health(context.Context) error {
	if m == nil || m.server == nil {
		return fmt.Errorf("inventory backend component server is not initialized")
	}
	return nil
}
