// @ts-check
__package__({
  name: 'ui.card.v1',
  title: 'UI Card Runtime Pack',
  category: 'runtime-pack',
  version: '1',
  description: 'Structured UI-card runtime pack for classic HyperCard-style cards.',
});

doc`
---
package: ui.card.v1
---
The ui.card.v1 pack exposes a small structured UI DSL for classic HyperCard-style cards. Cards
compose ui.panel([...]) from simpler primitives such as text, button, input, row, column, badge,
and table. The VM remains responsible for semantic state selection and action dispatch. The host
owns actual rendering and event plumbing.
`;

__doc__('ui.panel', {
  summary: 'Compose the root container for a classic ui.card.v1 card.',
  tags: ['dsl', 'ui-card', 'layout'],
});

doc`
---
symbol: ui.panel
---
Use ui.panel([...]) as the outer container for a card. Most inventory cards return one panel with
rows, buttons, tables, and badges inside.
`;

__doc__('ui.row', {
  summary: 'Lay out child widgets horizontally.',
  tags: ['dsl', 'ui-card', 'layout'],
});

doc`
---
symbol: ui.row
---
Use ui.row([...]) for compact horizontal groups such as field label + input or button bars.
`;

__doc__('ui.column', {
  summary: 'Lay out child widgets vertically.',
  tags: ['dsl', 'ui-card', 'layout'],
});

doc`
---
symbol: ui.column
---
Use ui.column([...]) for stacked actions or narrow grouped controls.
`;

__doc__('ui.text', {
  summary: 'Render plain text content.',
  tags: ['dsl', 'ui-card', 'text'],
});

doc`
---
symbol: ui.text
---
Use ui.text(...) for headings, descriptions, and inline labels that do not need user interaction.
`;

__doc__('ui.button', {
  summary: 'Render a button that emits a handler invocation when clicked.',
  tags: ['dsl', 'ui-card', 'actions'],
});

doc`
---
symbol: ui.button
---
Use ui.button(label, { onClick: { handler, args } }) to declare a semantic button action. The VM
handler decides what runtime actions to dispatch.
`;

__doc__('ui.input', {
  summary: 'Render a text input with a semantic change handler.',
  tags: ['dsl', 'ui-card', 'forms'],
});

doc`
---
symbol: ui.input
---
Use ui.input(value, { onChange: { handler, args } }) to bind text entry to a card handler. The
host feeds the changed value back through args.value.
`;

__doc__('ui.table', {
  summary: 'Render a read-only table with headers and rows.',
  tags: ['dsl', 'ui-card', 'data'],
});

doc`
---
symbol: ui.table
---
Use ui.table(rows, { headers }) for compact grid views such as inventory listings, sales logs, and
report metrics.
`;

__doc__('ui.badge', {
  summary: 'Render a small status badge.',
  tags: ['dsl', 'ui-card', 'status'],
});

doc`
---
symbol: ui.badge
---
Use ui.badge(text) for lightweight status summaries such as totals, success messages, and empty
state markers.
`;
