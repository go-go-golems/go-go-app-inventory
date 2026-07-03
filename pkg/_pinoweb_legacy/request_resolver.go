package pinoweb

import profilechat "github.com/go-go-golems/go-go-os-chat/pkg/profilechat"

type StrictRequestResolver = profilechat.StrictRequestResolver

func NewStrictRequestResolver(runtimeKey string) *StrictRequestResolver {
	return profilechat.NewStrictRequestResolver(runtimeKey)
}
