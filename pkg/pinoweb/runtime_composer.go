package pinoweb

import (
	"fmt"

	"github.com/go-go-golems/geppetto/pkg/inference/middlewarecfg"
	"github.com/go-go-golems/glazed/pkg/cmds/values"
	profilechat "github.com/go-go-golems/go-go-os-chat/pkg/profilechat"
	infruntime "github.com/go-go-golems/pinocchio/pkg/inference/runtime"
)

type RuntimeComposerOptions = profilechat.RuntimeComposerOptions
type RuntimeComposer = profilechat.RuntimeComposer

func NewRuntimeComposer(parsed *values.Values, options RuntimeComposerOptions) *RuntimeComposer {
	registry, err := newInventoryMiddlewareDefinitionRegistry()
	if err != nil {
		panic(fmt.Sprintf("pinoweb: build middleware definitions: %v", err))
	}
	return newRuntimeComposerWithDefinitions(
		parsed,
		options,
		registry,
		middlewarecfg.BuildDeps{},
		defaultInventoryMiddlewareUses(),
	)
}

func newRuntimeComposerWithDefinitions(
	parsed *values.Values,
	options RuntimeComposerOptions,
	definitions middlewarecfg.DefinitionRegistry,
	buildDeps middlewarecfg.BuildDeps,
	defaultMiddlewares []infruntime.MiddlewareUse,
) *RuntimeComposer {
	return profilechat.NewRuntimeComposerWithDefinitions(
		parsed,
		options,
		definitions,
		buildDeps,
		defaultMiddlewares,
	)
}
