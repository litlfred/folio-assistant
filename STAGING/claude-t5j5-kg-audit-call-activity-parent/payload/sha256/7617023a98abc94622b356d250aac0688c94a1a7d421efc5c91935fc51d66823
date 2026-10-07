---
# folio-assistant-x3h9
title: 'HARNESS CORE: gettext .pot/.po pipeline + accessibility are core, not folio-only (issue #223)'
status: todo
type: task
created_at: 2026-09-18T17:04:14Z
updated_at: 2026-09-18T17:04:14Z
parent: folio-assistant-bzyu
---

## The ask

Owner, [#223 comment](https://github.com/litlfred/folio-assistant/issues/223#issuecomment-5733305682), 2026-09-18T16:55:40Z, verbatim:

> in agentic-harness core, i still want support for .pot/po gettext and translation pipeline. also core accessability issues where applicable (e.g. skills and expectations should be descrinbed even if not in tooling)

## Why it is a separation-of-concerns item and not a translation item

#223 is the split of `agentic-harness` from `folio-assist-core`. The risk this
guards against is the translation pipeline and the accessibility conventions
being classified as **folio/content** concerns and landing on the wrong side of
the split — at which point a Tool repo or a KG repo, which are harness instances
but not folios, cannot be translated or held to the accessibility conventions.

The gettext pipeline that exists today (`scripts/translate-bpmn.ts`,
`content/pipeline/bpmn-translate.ts`, the POT/PO machinery) was built against
content. Whether it is harness-layer or core-layer has not been decided.

## The second half is the one that gets dropped

"**skills and expectations should be described even if not in tooling**" — i.e.
accessibility is a documented expectation of the harness, binding on skill
bodies and agent behaviour, not only on whatever the tooling happens to check.
A skill that is only an `allowed-tools` list cannot carry it. This is prose in
the harness conventions, and it is the part a purely mechanical reading of the
comment will skip.

Relevant standing context: the repo owner types with difficulty and
`.folio/interaction.json` already requires every question to be answerable by
selecting from four-or-fewer numbered options with a marked recommendation and
a stated default. That is an existing accessibility expectation with no tooling
behind it — the precedent for what this bean is asking to generalise.

## Not yet established

- which layer owns the gettext pipeline (harness vs core) — the actual decision
- whether `agent-harness.json` (PR #251) needs a translation/accessibility
  declaration, or whether these are conventions with no schema surface
- what "core accessibility issues where applicable" covers beyond the
  interaction modality already implemented

Depends on #251 landing, which is where the harness layer is being defined.
