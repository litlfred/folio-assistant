---
# folio-assistant-xcyh
title: 'The KG viewer must be translated'
status: todo
type: task
priority: normal
created_at: 2026-09-19T00:23:01Z
updated_at: 2026-09-19T00:23:43Z
---


_2026-09-19T00:23:43Z_ — OWNER, 2026-09-19: 'kg viewer needs to be translated too'. The viewer (scripts/kg-viewer.ts, merged in #307) emits ~30 English UI strings inline in generated HTML and JS: the facet heading 'Kind', 'Nodes', the search placeholder, 'Select a node.', 'No node matches.', 'none', 'No links to or from this node.', 'referenced by', the undeclared-property warning sentence, the could-not-load message and its 'This is not an empty graph.' follow-up, and the '… and N more' truncations. WHAT MAKES THIS NON-TRIVIAL, AND WHY IT SHOULD NOT BE DONE THE OBVIOUS WAY: this repo already has translation machinery — translation_extract/inject over GNU gettext .pot/.po, translation_signoff with a source hash, translation_status coverage, and scripts/translate-bpmn.ts for diagram labels — but ALL of it is aimed at authored MARKDOWN content, not at strings embedded in a generated artefact. Extracting from generated HTML would put the generator's output into the .pot, so regenerating would churn every entry and invalidate every sign-off. The strings should be lifted into a declared table in kg-viewer.ts, extracted from THAT (the source), and the generator should emit the chosen locale's table into the page. SECOND HALF, easy to miss: the DATA is English too. Node titles, descriptions and skill summaries come from the corpus, so a translated chrome over English content is half a translation — and the honest scope question is whether the viewer translates its own UI only, or also consumes translated content where a .po exists for it. Worth deciding before building, not after. THIRD: locale selection. The owner's action-icon tiles bean (1le7) names 'languages' as a tile, so the viewer's locale should come from the same mechanism rather than a second one. Gated by gjli (accessibility): a language switcher is a UI control and needs an accessible name, a keyboard path, and lang attributes that actually change so a screen reader switches voice.
