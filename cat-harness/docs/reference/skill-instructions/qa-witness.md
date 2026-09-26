---
layout: default
title: 'QA witnesses'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/qa-witness.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/qa-witness.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/qa-witness.md){: .fa-edit-source }

{% raw %}
# QA witnesses — the published projection of every verdict

A **QA witness** is what a reader sees when they open the QA badge beside a
heading on the docs site. One JSON document per subject, all of them
`"$schema": "qa-witness/v1"`, all of them committed under
`test/results/witnesses/` and **published** at `/assets/qa/`.

Those are two different questions. Where a witness LIVES follows provenance —
it is a QA process's output, so it belongs in the declared `test/results/`
tree with everything else a QA reviewer produced. Where it is SERVED FROM is
unchanged: every `data-qa-src` in a generated page says `/assets/qa/…`, and
the publishing workflows copy the directory into `_site/assets/qa/` after
Jekyll runs. It sat in `docs/` until 2026-09-19 only because that is where
Jekyll could reach it, which is a fact about the build and not about the
artefact.

Measured 2026-09-19: **134 documents — 113 `block`, 20 `kg`, 1
`translation`.**

## It is a projection, not the verdict

This is the distinction to hold on to, because getting it backwards is how a
fix lands in the wrong place.

The **verdict** is produced by a sweep and lives beside its subject —
`*.qa.json` beside a content block, `test/results/kg-qa/**/*.kg-qa.json` for a skill or a
diagram. The **witness** is the same verdict rendered for the web, flattened
into the shape the panel draws and placed where the site can fetch it.

So a wrong verdict is fixed in the checker; a verdict that reads wrongly on the
page is fixed in `content/pipeline/qa-witness.ts` or in `docs-ui.js`. Editing a
file under `test/results/witnesses/` by hand fixes neither — it is generated, and the
next `gen-docs-pages` run discards the edit.

## The three families, and why the distinction is load-bearing

`family` is a field in the document, not only a suffix on the filename.

| family | subject | verdict comes from |
|---|---|---|
| `block` | a content block | the QA sweep's `*.qa.json` |
| `kg` | a process, decision, role or skill | `kg-audit`'s `*.kg-qa.json` |
| `translation` | a page's locale coverage | the translation sweep |

They matter apart because **their witnesses are not equally specific.** A
`block` document's criteria are checked by genuinely different scripts —
`qa-checkers-voice.ts` on one criterion, `qa-checkers-extended.ts` on the next
— so a per-criterion `scriptHash` is real information. A `kg` document's
criteria all come from one auditor, so the same field is the same value
repeated, and the auditor's identity is recorded once in
`skills/kg-qa.manifest.json` rather than in each sidecar (bean `cflw`).

Read a per-criterion hash as evidence about that criterion only in the `block`
family.

## Reading one

- **`state`** — the roll-up: `pass`, `fail`, `warn`, `unknown`, `unswept`.
- **`counts`** — how many criteria landed in each result. A clean sweep still
  says how much it checked, which is the difference between "nothing wrong" and
  "nothing looked at".
- **`criteria[]`** — one entry per criterion, each with `result`, optional
  `evidence` quoted verbatim from the content, and `witnesses[]`.
- **`witnesses[]`** — who ruled, and on what. `kind` is `script`, `agent` or
  `human`. A script witness carries the checker's id and `scriptHash`; an agent
  witness carries its model and session; `freshness` says whether the inputs
  have moved since.
- **`sidecars[]`** — the repo paths of the verdicts this was projected from.
  Follow these to change anything.

**Worst first.** The panel partitions criteria into loud (`fail`, `warn`,
`unknown`) and quiet (`pass`, `n/a`) and folds the quiet behind one control
that states its own count. A corpus that is passing is the normal case, so the
fold is what keeps the two rows that need reading at the top.

## Three states, everywhere

`unknown` and `unswept` are not `pass`, and neither is an absent field.

- A criterion the sweep could not evaluate is `unknown`, never `pass`.
- A field the producer does not record — `kg-audit` keeps no timestamp — is
  rendered "not recorded", never blank. A blank cell reads as a value the
  reader failed to notice.
- A projection that cannot be fetched says so and names the file. A panel that
  opens empty is indistinguishable from a subject with nothing to report.

## Do not write a spec against a live verdict

The trap this family has already paid for, twice in one day.

`test/qa-panel.e2e.ts` read a real sidecar and asserted the panel put its one
`fail` first. Then the finding was correctly adjudicated to `pass`, the block
went to zero failures, and a test of the PANEL went red because the CONTENT got
better. **A verdict is not a fixture.** The corpus is supposed to reach zero
failures.

Drive the shape from the real document and put the state under test back in
yourself — and locate the criterion **by id**, never by index, because index
and render order coincide only while nothing sorts above it.

## Where things are

| | |
|---|---|
| projections (committed) | `test/results/witnesses/**/*.{block,kg,translation}.json` |
| projections (published) | `/assets/qa/…`, copied into `_site` by `docs-site.yml` and `feature-staging.yml` |
| schema + builder | `content/pipeline/qa-witness.ts` |
| written by | `scripts/gen-docs-pages.ts` |
| drawn by | `docs/assets/js/docs-ui.js` (`qaBuildPanel`) |
| block verdicts | `content/**/*.qa.json` |
| kg verdicts | `test/results/kg-qa/<subject-dir>/<stem>.kg-qa.json` — the tree MIRRORS the subject's path, because four basenames already collide across packages. Path from `kgQaSidecarPath` in `schemas/kg-qa.ts`, never composed by hand. Auditor in `skills/kg-qa.manifest.json` |

The schema lives in `content/pipeline/` rather than `schemas/` because it is
the pipeline's own output shape. Worth knowing when you go looking for it in
the declared `schemas/` graph and do not find it.
{% endraw %}
