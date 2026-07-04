/*
 * Frontend renderer for generated inventory cards.
 *
 * The backend (chathost ArtifactExtractor -> hub.Publish) emits a
 * ChatWidgetInstance with widgetName "inventory.card" and a props payload of the
 * form { title, subtitle?, fields?: [{label, value}], footer? }. chat-provider
 * projects it into the timeline; ChatMessages renders it through the widget
 * registry, so registering this defineWidget is all that is needed to show the
 * card in the chat window.
 *
 * See design-doc/06 §8 (Generated card strategy).
 */
import { defineWidget, type WidgetProps } from '@go-go-golems/chat-provider';

interface CardField {
  label?: string;
  value?: unknown;
}

interface InventoryCardProps {
  title?: string;
  subtitle?: string;
  fields?: CardField[];
  footer?: string;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

function InventoryCard({ props, status }: WidgetProps) {
  const card = (props ?? {}) as InventoryCardProps;
  const fields = Array.isArray(card.fields) ? card.fields : [];

  return (
    <div className="inventory-card" data-part="inventory-card" data-status={status}>
      <div className="inventory-card-header">
        <span className="inventory-card-title">{card.title?.trim() || 'Card'}</span>
        {card.subtitle?.trim() ? <span className="inventory-card-subtitle">{card.subtitle}</span> : null}
      </div>
      {fields.length > 0 ? (
        <dl className="inventory-card-fields">
          {fields.map((field, idx) => (
            <div className="inventory-card-field" key={`${field.label ?? 'field'}-${idx}`}>
              <dt>{asString(field.label)}</dt>
              <dd>{asString(field.value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {card.footer?.trim() ? <div className="inventory-card-footer">{card.footer}</div> : null}
    </div>
  );
}

export const inventoryCardWidget = defineWidget('inventory.card', InventoryCard);
