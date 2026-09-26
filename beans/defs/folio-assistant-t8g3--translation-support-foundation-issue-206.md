---
# folio-assistant-t8g3
title: 'Translation support foundation (issue #206)'
status: in-progress
type: task
priority: normal
created_at: 2026-09-17T22:07:18Z
updated_at: 2026-09-19T00:41:16Z
parent: folio-assistant-bzyu
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

## Verified against the tree, 2026-09-19 — and the body above is WRONG

I wrote the body above earlier today (PR #318) and said the adjudication model
"is not visible on disk". **That is false.** Every requirement in issue #206 has
an implementation. I reached the wrong conclusion by grepping for a `.ts`
implementation of an "adjudication model" and never opening
`schemas/translation.ts`, the two BPMN processes, or `docs-ui.js`.

Measured on `main` at `965fa6e`:

| #206 requirement | where it lives |
|---|---|
| gettext `.pot` fully integrated | `scripts/translation/` — extract, inject, and pulls for Crowdin, Weblate, Launchpad |
| official = human sign-off; unofficial = agentic | `schemas/translation.ts:43-48`, and the distinction is explicitly "not quality" |
| official goes **stale** when the source changes | `schemas/translation.ts:55-58` — `sourceHash` is SHA-256 of the source `.md`, mismatch sets `stale: true`; stale stays VISIBLE with a warning rather than hidden |
| translated node persisted **within** the source node | `schemas/translation.ts:361` — `Subdirectory name within content nodes`, default `translations` |
| sign-off at **any level** of the hierarchy | `schemas/translation.ts:61-65` — "## Sign-off levels", block / section / chapter / folio, a lower-level sign-off overriding a higher one |
| navbar language icon beside the QR code | `docs/assets/js/docs-ui.js:765` — `tileButton(GLOBE_GLYPH, "Language", "language")` |
| six UN languages | `translations/{ar,es,fr,ru,zh}` plus English |
| BPMN representation | **two**: `translation-workflow.bpmn` and `human-translation-workflow.bpmn` |
| consolidated skill | `skills/folio-core/translation-manager.md` |
| roles | `translation-adjudicator`, `translation-coordinator` |

`translation-workflow.bpmn` models the whole adjudication loop end to end:
Extract POT -> Produce PO -> Inject -> round-trip QA -> `Write status.json
(unofficial)` -> human sign-off gateway -> `Write status.json (official)` ->
`Check staleness (source hash)` -> `Translation marked stale (re-enter at
Extract)`. `src/tools/translation.ts` reads and writes that `status.json` and
exposes the sign-off.

**The staleness mechanism is the QA sidecar's, not a second one** — a
content-hash comparison that auto-stales on edit. So the concern I raised when
scoping this (that a new freshness mechanism would repeat bean `nytj`) does not
apply.

### Two real findings, both small

`docs/_includes/language-selector.html` and
`docs/_includes/translation-warning.html` are **orphaned**: the only `{% include %}`
anywhere in `docs/` is `landing.html`. `docs-ui.js` does both jobs itself — it
mounts the globe tile, and `translation-manager.md` says in terms "**Do not**
manually add `{% include translation-warning.html %}` — `docs-ui.js` handles it
automatically", in the same breath as recording that `qa-translation-badge.html`
was **deleted, not deprecated**. These two look like the same cleanup, left
undone.

**Deleted 2026-09-19 on the owner's instruction, with the condition they set:
only if the functionality found a home.** Verified that it had, for both:

- `translation-warning.html` -> `docs-ui.js:1283` injects the unverified-
  translation warning from the page's own front matter, guarded against
  duplication by `!document.querySelector(".fa-translation-warning")`.
- `language-selector.html` -> `buildLanguageBar()` renders all six UN
  languages, highlights the current one in the same `#3b82f6`, and **greys out
  locales with no translation** — which the include's own comment promised but
  its Liquid never implemented. It also adds a remembered locale and global
  locale persistence, neither of which the include had.

A whole-repo sweep found no `{% include %}` of either: every remaining mention
was prose telling people not to use them, or a `docs-ui.js` comment. That
comment is updated — it described reading "the language-selector include (if
present)", and the fallback now scans `[data-locale]`, which `buildLanguageBar`
emits itself, so the behaviour survives the deletion.

### What this bean now needs

Not implementation. Someone should walk #206's requirement list against the
table above and decide whether anything the owner meant is still missing —
**the issue is still open, and only its author can close it.** This is a
verification, not a verdict.

### 2026-09-24: block-kind audit (the owner asked for one)

Full audit, with file:line evidence and measured extractor output:
[`cat-harness/docs/proposals/translation-block-audit.md`](../../cat-harness/docs/proposals/translation-block-audit.md).
Nothing in the code was changed.

**Verdicts.** No kind is supported end to end, because nothing renders a
translated block: the Markdown and LaTeX renders read the source `.md`, and
translated pages under `docs/<locale>/` are whole pages.

- **Partial:** `prose`; `definition`, `theorem`, `lemma`, `proposition`,
  `corollary`, `conjecture`, `proof`, `example`, `remark`, `algorithm`,
  `simulator`; `table`. Their bodies are extracted, but math inside the msgid
  is corrupted by the `_…_` and `*…*` strippers.
- **Unsupported:** `equation`, which should be excluded because it is all
  math. `diagram` and `figure`, whose caption and narrative live in the `.ts`,
  which nothing extracts; injecting into a figure also deletes the image.

**Top gaps:**

- G1: no math protection.
- G2: `po-inject.ts:433` deletes every blank line and merges paragraphs.
- G3: inline code, links and images are stripped and never restored.
- G4: `extractFromManifest` has no caller, so titles and captions are never
  extracted.
- G5: there is no translated render path.

**Storage.** The per-locale `.po` files match the owner's model ("source =
pot, translations in the .pot file per locale"). The `.pot` does not: it is
copied into every target-locale directory, 363 templates against 19
catalogues, and the copies differ only in their headers. `translation_extract`
writes to `translations/en/`, a directory that `docs-ui.js:107` says will
never exist. This is reported, not changed.
