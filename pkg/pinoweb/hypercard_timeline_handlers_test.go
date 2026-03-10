package pinoweb

import (
	"context"
	"encoding/json"
	"testing"

	chatstore "github.com/go-go-golems/pinocchio/pkg/persistence/chatstore"
	timelinepb "github.com/go-go-golems/pinocchio/pkg/sem/pb/proto/sem/timeline"
	webchat "github.com/go-go-golems/pinocchio/pkg/webchat"
	"github.com/stretchr/testify/require"
)

func semFrameForTest(t *testing.T, eventType, id string, seq uint64, data map[string]any) []byte {
	t.Helper()
	raw, err := json.Marshal(map[string]any{
		"sem": true,
		"event": map[string]any{
			"type":      eventType,
			"id":        id,
			"seq":       seq,
			"stream_id": "stream-1",
			"data":      data,
		},
	})
	require.NoError(t, err)
	return raw
}

func TestHypercardTimelineHandlers_SuggestionsProjectToSingleAssistantEntity(t *testing.T) {
	webchat.ClearTimelineHandlers()
	t.Cleanup(webchat.ClearTimelineHandlers)
	registerHypercardTimelineHandlers()

	store := chatstore.NewInMemoryTimelineStore(100)
	projector := webchat.NewTimelineProjector("conv-suggestions", store, nil)

	require.NoError(t, projector.ApplySemFrame(context.Background(), semFrameForTest(
		t,
		"hypercard.suggestions.start",
		"suggestions-turn-1",
		10,
		map[string]any{"suggestions": []string{"Show current inventory status", "What items are low stock?"}},
	)))
	require.NoError(t, projector.ApplySemFrame(context.Background(), semFrameForTest(
		t,
		"hypercard.suggestions.update",
		"suggestions-turn-1",
		11,
		map[string]any{"suggestions": []string{"Summarize today sales"}},
	)))
	require.NoError(t, projector.ApplySemFrame(context.Background(), semFrameForTest(
		t,
		"hypercard.suggestions.v1",
		"suggestions-turn-1",
		12,
		map[string]any{"suggestions": []string{"Summarize today sales", "Show margin report"}},
	)))

	snap, err := store.GetSnapshot(context.Background(), "conv-suggestions", 0, 100)
	require.NoError(t, err)
	require.Equal(t, uint64(12), snap.Version)
	require.Len(t, snap.Entities, 1)

	entity := snap.Entities[0]
	require.Equal(t, "suggestions:assistant", entity.Id)
	require.Equal(t, "suggestions", entity.Kind)
	require.NotNil(t, entity.Props)

	props := entity.Props.AsMap()
	require.Equal(t, "assistant", props["source"])
	require.Equal(t, nil, props["consumedAt"])
	require.Equal(t, []any{"Summarize today sales", "Show margin report"}, props["items"])
}

func TestHypercardTimelineHandlers_WidgetErrorProjectsStatusAndResult(t *testing.T) {
	webchat.ClearTimelineHandlers()
	t.Cleanup(webchat.ClearTimelineHandlers)
	registerHypercardTimelineHandlers()

	store := chatstore.NewInMemoryTimelineStore(100)
	projector := webchat.NewTimelineProjector("conv-widget-error", store, nil)

	require.NoError(t, projector.ApplySemFrame(context.Background(), semFrameForTest(
		t,
		"hypercard.widget.error",
		"widget-call-1",
		42,
		map[string]any{
			"itemId": "widget-call-1",
			"error":  "yaml: unmarshal errors: mapping key artifact already defined",
		},
	)))

	snap, err := store.GetSnapshot(context.Background(), "conv-widget-error", 0, 100)
	require.NoError(t, err)
	require.Equal(t, uint64(42), snap.Version)
	require.Len(t, snap.Entities, 2)

	byID := map[string]*timelinepb.TimelineEntityV2{}
	for _, entity := range snap.Entities {
		byID[entity.Id] = entity
	}

	statusEntity, ok := byID["widget-call-1:status"]
	require.True(t, ok)
	require.Equal(t, "status", statusEntity.Kind)
	require.NotNil(t, statusEntity.Props)
	statusProps := statusEntity.Props.AsMap()
	require.Equal(t, "error", statusProps["type"])
	require.Equal(t, "yaml: unmarshal errors: mapping key artifact already defined", statusProps["text"])

	resultEntity, ok := byID["widget-call-1:result"]
	require.True(t, ok)
	require.Equal(t, "hypercard.widget.v1", resultEntity.Kind)
	require.NotNil(t, resultEntity.Props)
	resultProps := resultEntity.Props.AsMap()
	require.Equal(t, "widget-call-1", resultProps["toolCallId"])
	require.Equal(t, "yaml: unmarshal errors: mapping key artifact already defined", resultProps["error"])

	resultBody, ok := resultProps["result"].(map[string]any)
	require.True(t, ok)
	require.Equal(t, "widget-call-1", resultBody["itemId"])
	require.Equal(t, "yaml: unmarshal errors: mapping key artifact already defined", resultBody["error"])
}

func TestHypercardTimelineHandlers_CardUpdateProjectsStreamingCardResult(t *testing.T) {
	webchat.ClearTimelineHandlers()
	t.Cleanup(webchat.ClearTimelineHandlers)
	registerHypercardTimelineHandlers()

	store := chatstore.NewInMemoryTimelineStore(100)
	projector := webchat.NewTimelineProjector("conv-card-update", store, nil)

	require.NoError(t, projector.ApplySemFrame(context.Background(), semFrameForTest(
		t,
		"hypercard.card.update",
		"card-call-1",
		77,
		map[string]any{
			"itemId": "card-call-1",
			"title":  "Low Stock Card",
			"name":   "Low Stock Card",
			"data": map[string]any{
				"artifact": map[string]any{
					"id":   "artifact-card-1",
					"data": map[string]any{"sku": "WA-100"},
				},
				"runtime": map[string]any{
					"pack": "kanban.v1",
				},
				"card": map[string]any{
					"id":   "runtime-low-stock",
					"code": "({ ui }) => ({ render() { return ui.text(\"low stock\"); } })",
				},
			},
		},
	)))

	snap, err := store.GetSnapshot(context.Background(), "conv-card-update", 0, 100)
	require.NoError(t, err)
	require.Equal(t, uint64(77), snap.Version)
	require.Len(t, snap.Entities, 1)

	entity := snap.Entities[0]
	require.Equal(t, "card-call-1:result", entity.Id)
	require.Equal(t, "hypercard.card.v2", entity.Kind)
	require.NotNil(t, entity.Props)

	props := entity.Props.AsMap()
	require.Equal(t, "card-call-1", props["toolCallId"])
	require.Equal(t, "streaming", props["status"])
	require.Equal(t, "streaming Low Stock Card", props["detail"])

	resultBody, ok := props["result"].(map[string]any)
	require.True(t, ok)
	require.Equal(t, "Low Stock Card", resultBody["title"])
	require.Equal(t, "Low Stock Card", resultBody["name"])

	dataBody, ok := resultBody["data"].(map[string]any)
	require.True(t, ok)
	runtimeBody, ok := dataBody["runtime"].(map[string]any)
	require.True(t, ok)
	require.Equal(t, "kanban.v1", runtimeBody["pack"])
	cardBody, ok := dataBody["card"].(map[string]any)
	require.True(t, ok)
	require.Equal(t, "runtime-low-stock", cardBody["id"])
	require.Equal(t, "({ ui }) => ({ render() { return ui.text(\"low stock\"); } })", cardBody["code"])
}

func TestHypercardTimelineHandlers_CardReadyOverridesStreamingStatus(t *testing.T) {
	webchat.ClearTimelineHandlers()
	t.Cleanup(webchat.ClearTimelineHandlers)
	registerHypercardTimelineHandlers()

	store := chatstore.NewInMemoryTimelineStore(100)
	projector := webchat.NewTimelineProjector("conv-card-ready", store, nil)

	require.NoError(t, projector.ApplySemFrame(context.Background(), semFrameForTest(
		t,
		"hypercard.card.update",
		"card-call-2",
		100,
		map[string]any{
			"itemId": "card-call-2",
			"title":  "Welcome to Disco Fever!",
			"data": map[string]any{
				"artifact": map[string]any{"id": "disco-fever-hello-world", "data": map[string]any{}},
				"card": map[string]any{
					"id":   "discoFeverHelloWorldCard",
					"code": "({ ui }) => ({ render() { return ui.text(\"hello\"); } })",
				},
			},
		},
	)))
	require.NoError(t, projector.ApplySemFrame(context.Background(), semFrameForTest(
		t,
		"hypercard.card.v2",
		"card-call-2",
		101,
		map[string]any{
			"itemId": "card-call-2",
			"title":  "Welcome to Disco Fever!",
			"data": map[string]any{
				"artifact": map[string]any{"id": "disco-fever-hello-world", "data": map[string]any{}},
				"card": map[string]any{
					"id":   "discoFeverHelloWorldCard",
					"code": "({ ui }) => ({ render() { return ui.text(\"hello\"); } })",
				},
			},
		},
	)))

	snap, err := store.GetSnapshot(context.Background(), "conv-card-ready", 0, 100)
	require.NoError(t, err)
	require.Equal(t, uint64(101), snap.Version)
	require.Len(t, snap.Entities, 1)

	props := snap.Entities[0].Props.AsMap()
	require.Equal(t, "success", props["status"])
	require.Equal(t, "ready", props["detail"])
}
