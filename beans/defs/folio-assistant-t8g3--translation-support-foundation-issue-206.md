---
# folio-assistant-t8g3
title: 'Translation support foundation (issue #206)'
status: in-progress
type: task
priority: normal
created_at: 2026-09-17T22:07:18Z
updated_at: 2026-09-19T00:41:16Z
---


_2026-09-19T00:41:16Z_ — Checked 2026-09-19 on main at 17dc1e6 — CANNOT DETERMINE, and that is the finding. This bean has an EMPTY body: a title naming issue #206 and nothing else, so there is no statement of what 'translation support foundation' includes or what would close it. Artefacts that exist: translations/ with ar, es, fr, ru and zh; scripts/translate-bpmn.ts; scripts/translation/ with a README and extract_script_strings.py. Whether that is the foundation this bean meant is not answerable from the bean. Needs a body before it can be triaged.

_Body written 2026-09-19. This bean was opened 2026-09-17 with a title and an
issue number and nothing else; what follows is **reconstructed from
[issue #206](https://github.com/litlfred/folio-assistant/issues/206) and from
what is on disk**, not recovered from the session that opened it. Where the
original scope and this reconstruction differ, the issue wins._

## What the owner asked for

Issue #206, still **open** (reopened after [PR #213](https://github.com/litlfred/folio-assistant/pull/213)
merged), with 18 comments. Gettext-style `.pot` support fully integrated, with
smart-base and the IG Publisher as the reference implementations to analyse
rather than reinvent. The requirements that constrain the design:

- **Official vs unofficial is a human-adjudication distinction.** Official means
  a person signed off. Unofficial means agentic, starting from `.po` if any.
- **Official goes stale when its source changes**, and recovers only by a new
  human sign-off. This is the same auto-stale-on-edit shape the QA sidecars
  already use, applied to a different subject.
- **An official translation is persisted as its own translated content node,
  inside the source content node.** Not a sidecar beside it, not a parallel
  tree.
- **Sign-off is available at any level of the `content/` hierarchy**, so the
  unit of adjudication is a subtree, not a block.
- **A language switcher in the left navbar**, beside the QR code and reading
  preferences, defaulting to the six UN languages, with locale support.
- Most content block kinds should support translation — **the issue asks for an
  audit** to establish which do.
- Consolidate the existing skills and documentation into one, and give the
  workflow a BPMN representation.

## What exists on disk, 2026-09-19

`translations/` carries `ar`, `es`, `fr`, `ru`, `zh` — five, which with English
is the six UN languages. `fr` holds `.pot`, `.po` and `.ts` triples for
`agent-onboarding`, `crdm-methodology` and `index`.

`scripts/translation/` holds the port: `extract_translations.py`,
`inject_translations.py`, `extract_script_strings.py`, and pull scripts for
Crowdin, Weblate and Launchpad, plus `translation_config.py` and
`translation_security.py`. `scripts/translate-bpmn.ts` handles diagram labels
(bean `8xx6` continues that). Schemas: `schemas/translation.ts` and
`schemas/translation-tools.ts`.

## What that does NOT establish

Nothing on disk answers the official/unofficial distinction, the staleness rule,
the in-node persistence of a translated content node, subtree sign-off, or the
navbar switcher. The pipeline half is built; the **adjudication model** — which
is most of what the issue asks for — is not visible here.

## Todo
- [ ] audit which block kinds support translation, and record the answer
- [ ] model official vs unofficial, and where sign-off is recorded
- [ ] staleness: an official translation whose source changed must say so
- [ ] translated content node persisted within its source node
- [ ] sign-off at an arbitrary level of the content hierarchy
- [ ] language switcher in the left navbar, six UN languages, locale-aware
- [ ] consolidate the translation skills and docs into one
- [ ] BPMN for the translation workflow

## Done when
Issue #206 can be closed by its author — which no agent may do on its own say-so.
