---
# folio-assistant-xcyh
title: The KG viewer must be translated
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T00:23:01Z
updated_at: 2026-09-19T05:37:41Z
---


_2026-09-19T00:23:43Z_ — OWNER, 2026-09-19: 'kg viewer needs to be translated too'. The viewer (scripts/kg-viewer.ts, merged in #307) emits ~30 English UI strings inline in generated HTML and JS: the facet heading 'Kind', 'Nodes', the search placeholder, 'Select a node.', 'No node matches.', 'none', 'No links to or from this node.', 'referenced by', the undeclared-property warning sentence, the could-not-load message and its 'This is not an empty graph.' follow-up, and the '… and N more' truncations. WHAT MAKES THIS NON-TRIVIAL, AND WHY IT SHOULD NOT BE DONE THE OBVIOUS WAY: this repo already has translation machinery — translation_extract/inject over GNU gettext .pot/.po, translation_signoff with a source hash, translation_status coverage, and scripts/translate-bpmn.ts for diagram labels — but ALL of it is aimed at authored MARKDOWN content, not at strings embedded in a generated artefact. Extracting from generated HTML would put the generator's output into the .pot, so regenerating would churn every entry and invalidate every sign-off. The strings should be lifted into a declared table in kg-viewer.ts, extracted from THAT (the source), and the generator should emit the chosen locale's table into the page. SECOND HALF, easy to miss: the DATA is English too. Node titles, descriptions and skill summaries come from the corpus, so a translated chrome over English content is half a translation — and the honest scope question is whether the viewer translates its own UI only, or also consumes translated content where a .po exists for it. Worth deciding before building, not after. THIRD: locale selection. The owner's action-icon tiles bean (1le7) names 'languages' as a tile, so the viewer's locale should come from the same mechanism rather than a second one. Gated by gjli (accessibility): a language switcher is a UI control and needs an accessible name, a keyboard path, and lang attributes that actually change so a screen reader switches voice.


*OPENING BRIEF — 2026-09-19, branch `claude/xcyh-viewer-i18n`*

**What and why.** `scripts/kg-viewer.ts` generates a single-file page carrying
~30 English UI strings inline. Extracting from the GENERATED HTML would put
generator output into the `.pot`, so every regeneration churns every entry and
invalidates every sign-off.

**What I know, measured this session.** The machinery is gettext over
`content/pipeline/pot-extract.ts` (`formatPot`) and `po-inject.ts` (`parsePo`),
with a per-artefact extractor on top: `extractMarkdown` for prose,
`content/pipeline/bpmn-translate.ts` + `scripts/translate-bpmn.ts` for diagram
labels. `translate-bpmn` is the precedent for a NON-markdown artefact — extract
from the SOURCE, write `translations/<locale>/<stem>.pot`, inject per locale.
Locale selection on the docs site is the `fa-locale` localStorage key, written
by `mountLanguageSwitcher` / `mountPageLanguageBar` in `docs/assets/js/docs-ui.js`.
`translations/` today holds ar, es, fr, ru, zh, each with at least `index.po`,
all agent-generated and unofficial.

**Route.** (1) Lift the chrome strings into a declared table beside the
generator, each entry English text plus a translator comment. (2) A
`--extract` orchestration writes `translations/<loc>/kg-viewer.pot` through the
SHARED `formatPot`; a `--check` reports drift between the table and each `.po`.
(3) The generator reads each locale's `.po` through the SHARED `parsePo` at
generate time and embeds the catalogues; the page picks a locale at runtime
from `?lang=` then `fa-locale` then `navigator` then `en`. No second pipeline.

**Boundary, stated rather than half-solved.** The CHROME is translated. The
DATA is not — node titles, descriptions and graph property names come from the
corpus and stay in English — and the page says so in the locale the reader
chose.

**How I will know it worked.** English output stays byte-comparable to today
(`tests/kg-viewer.e2e.ts` asserts exact English strings; if one changes I have
broken the artefact rather than translated it). New e2e coverage for the
switcher, and the a11y gate re-run including an RTL locale. **Falsifier:** if
the switcher cannot be driven from the keyboard, or axe fails in a non-English
locale, the approach is wrong rather than unfinished.

**Not doing.** Corpus-data translation — recorded, not attempted. No CI wiring
for the new check. No per-locale page directories: one artefact, one relative
path to `../<stub>.jsonld`.
