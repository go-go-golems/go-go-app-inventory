package backendmodule

import (
	"embed"
	"fmt"

	gepprofiles "github.com/go-go-golems/geppetto/pkg/engineprofiles"
)

var (
	inventoryBuiltinRegistrySlug = gepprofiles.MustRegistrySlug("inventory")
	inventoryDefaultProfileSlug  = gepprofiles.MustEngineProfileSlug("inventory")
	inventoryVisibleProfileSlugs = []gepprofiles.EngineProfileSlug{
		gepprofiles.MustEngineProfileSlug("default"),
		gepprofiles.MustEngineProfileSlug("inventory"),
		gepprofiles.MustEngineProfileSlug("analyst"),
		gepprofiles.MustEngineProfileSlug("assistant"),
	}
)

//go:embed profiles/profiles.yaml
var inventoryBuiltinProfilesFS embed.FS

func BuiltinProfileRegistrySlug() gepprofiles.RegistrySlug {
	return inventoryBuiltinRegistrySlug
}

func DefaultProfileSlug() gepprofiles.EngineProfileSlug {
	return inventoryDefaultProfileSlug
}

func VisibleProfileSlugs() []gepprofiles.EngineProfileSlug {
	return append([]gepprofiles.EngineProfileSlug(nil), inventoryVisibleProfileSlugs...)
}

func LoadBuiltinProfileRegistry() (*gepprofiles.EngineProfileRegistry, error) {
	data, err := inventoryBuiltinProfilesFS.ReadFile("profiles/profiles.yaml")
	if err != nil {
		return nil, fmt.Errorf("read inventory builtin profiles: %w", err)
	}
	registry, err := gepprofiles.DecodeEngineProfileYAMLSingleRegistry(data)
	if err != nil {
		return nil, fmt.Errorf("decode inventory builtin profiles: %w", err)
	}
	if registry == nil {
		return nil, fmt.Errorf("decode inventory builtin profiles: registry is nil")
	}
	registry.DefaultEngineProfileSlug = inventoryDefaultProfileSlug
	return registry, nil
}
