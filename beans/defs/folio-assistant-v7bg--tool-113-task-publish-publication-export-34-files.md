---
# folio-assistant-v7bg
title: 'TOOL 1/13: Task_Publish — publication & export (34 files, 19 entry points)'
status: in-progress
type: task
priority: high
created_at: 2026-09-20T04:34:11Z
updated_at: 2026-09-20T16:39:06Z
parent: folio-assistant-d308
---

Group 1 of 13 in `d308`. **34 files, 19 entry points** — the largest loose surface in the repo.

`kg-export`, `pages-bootstrap`, `gen-*-jsonld`, `gen-site-jsonld`, `site-links`,
`serve-rendering`, `strip-preview-seo`, `staging-*`, `readme-sections`,
`readme-links`, `gen-schema-docs`, `gen-skill-docs`, `harness-schema-export`.

**BPMN:** `authoring-a-paper · Task_Publish` and `authoring-a-document ·
Task_Publish`, both `serviceTask`, both already ref `content-publish`.

**Target repo (#223):** splits — the site half is `folio-assist-core`, `kg-export`
and `pages-bootstrap` are `agentic-harness`. That split is a finding, not a
problem: it is the one group whose files do not all go to one repo, so it is also
the one most likely to be two Tools rather than one.

## Done when
- [ ] a Tool node whose `invoke` names one entry point
- [ ] `satisfies` includes `content-publish`
- [ ] `selection` filled — `when` / `limits` / `cost`, per the schema `main` added
- [ ] `tool-coverage` no longer lists `content-publish` as uncovered
- [ ] the other 15 files in the group reachable only through it

---

## 2026-09-20: first node landed, and it was not the one this bean expected

**`kg-graph-export` is in the graph.** `bun run kg:export`, satisfies
`kg-export`, verified: typecheck, eslint, 43 tool tests, `check:tools`, the
command actually running, and 38 gates in the fast set.

It exists because of a gap `check:tools` could not report. `kg-export` was
already `satisfies`-covered **five times** — `pages-publish`, `serve-rendering`
and the three schema carriers — and **none of them runs an export.** The command
that builds the graph rendering was reachable from no node.

`check:tools` was right throughout. Coverage relates a Tool to a **skill**, and a
skill can be satisfied by the *neighbours* of its mechanism while the mechanism
stays invisible. That is this epic's premise, found in the graph rather than
argued from a bean — and on the skill `shzs` had just been corrected to call
covered. So **both readings were needed**: covered-by-skill and
reachable-by-mechanism are different questions, and `d308` is the second one.

## This bean is really two, and the split is the table's own

`d308`'s table already said the target repo splits — *"folio-assist-core (site) /
agentic-harness (kg-export)"*. That was written and then not acted on. Acting on
it:

1. **The graph half** — `kg-export` ✅ done; `ns-export`, `gen:jsonld`
   (context + block + library), `kg-viewer`. `agentic-harness`.
2. **The site half** — `pages-bootstrap`, `site-links`, `sync-docs-harness`,
   `gen-themes-css`, `gen-avatars-css`, `gen-bootstrap-graph`,
   `strip-preview-seo`, `staging-*`, `restore-staging`, `feature-build`.

**And the site half's skill needs checking before a node, not after.** The
obvious candidate is `content-publish` (tier A, uncovered) — but
`content-publish` is about a **folio** publishing its content, and these files
publish the **platform's own docs site**. The nearer skills, `docs-generation`
and `build-docs`, are both already in the covered list. So the site half may be
the same covered-by-skill / uncovered-by-mechanism shape as the graph half was.
Measure it; do not assume it, which is the mistake this bean already made once.

## Done when — REPLACES the list above

- [x] `kg-graph-export` node, verified, with its finding recorded
- [x] `ns-export` reachable — `ns-vocabulary`, maintaining `ns/vocabulary.jsonld`
- [x] `gen-jsonld-context` reachable — `content-context`, maintaining
      `ns/content/v1.jsonld`
- [ ] `gen-block-jsonld` / `gen-library-jsonld` — deliberately NOT nodes yet:
      they write one `.jsonld` per block and per library item, so `maintains`
      (one artefact string) does not fit. They belong with the content pipeline,
      invoked from a folio, and forcing them here would mint a declaration that
      names one file out of hundreds
- [ ] `kg-viewer` — needs a skill decided first. It generates a page that makes
      the graph legible, which is neither `kg-export` (data) nor
      `serving-renderings` (serving). Do not pick one to make the node validate
- [ ] which skill the site half actually serves, established from the diagrams
      and the covered list rather than assumed
- [ ] a node for the site half once that is known
- [ ] the 15 can't-tell files confirmed as folio-invoked, not unused


---

## 2026-09-20, second unit: two more nodes, and both gates that refused them were right

**`ns-vocabulary`** maintains `ns/vocabulary.jsonld`; **`content-context`**
maintains `ns/content/v1.jsonld`. Both published by
`.github/workflows/docs-site.yml`, verified by reading it rather than assuming.
`kg:schema:check` now reports **5 maintained**.

Two gates refused the work, and neither was wrong:

- **`check:tools`** refused `--layer` as `Text`: an argv word that can hold
  arbitrary characters can hold a shell payload. The fix for an enumerable input
  is the enum, so `NamespaceLayer` joined `tool-types`, guarded in both
  directions. Worth noting the default for a new type is **unsafe** — fail-closed,
  and correct.
- **`kg:schema:check`** refused both `maintains` declarations. It had encoded
  *"an artefact a Tool maintains is produced by the schema exporter"*, true of
  the three original carriers and nothing else. These two are the first
  counterexample. Scoped, tested, and the cost of the scoping opened as `6f1x`
  rather than absorbed.

## What this unit actually demonstrated, beyond two nodes

`d308`'s premise is that code with no node is invisible even when its skill looks
served. Both refusals are the same premise seen from the other side: **the
existing checks encoded assumptions that were true only of the graph's current
shape.** Adding a node is not just filling a gap — it is the first load the
assumptions have taken.

That is an argument for continuing one node at a time with the full gate set
between, rather than batching the remaining eleven. Each node is a probe.


---

## MEASURED 2026-09-20 — two capabilities share the word "publish", and each is broken the opposite way  ⟵ BLOCKER

> **⚠ TWO OF THE THREE READINGS BELOW ARE NOW SETTLED — read the SHARPENED
> section at the end of this bean first.** Reading 2 is **refuted**; reading 1 is
> **evidenced** from `draft-to-publication.bpmn`. Only reading 3
> (does `release-please.yml` get its own skill?) is still the owner's.

Read `content-publish`'s declaration and every publishing mechanism in the repo,
rather than reasoning from the bean's title.

### `content-publish` has a contract and no mechanism here

Its declared contract requires **`versionIncrement`**, with `releaseNotes` and
`target` optional. Its prose is about a **folio's** content reaching the world:

> Update version numbers (semantic versioning) · Create publication metadata
> (`publication-request.json` for FHIR IGs) · Build final artifacts (IG Publisher
> build, LaTeX compilation) · Create release branches and tags · Create GitHub
> releases with release notes · Deploy to publication platform (smart.who.int,
> arXiv, etc.)

Measured: **nothing here produces `publication-request.json`** (zero references),
and the platform carries no folio. `publish.yml` is *"Build & Publish"* but its
inputs are `source_branch` / `feature_branch` / `publish_branch` — it builds a
content pipeline and pushes artefacts. It does no version increment and cuts no
release.

So a node over `publish.yml` claiming this skill would **fail `check:tools`**, and
rightly: the contract requires a `versionIncrement` port the mechanism has no
notion of. That makes this the **third unsatisfiable contract** after
`latex-authoring` (`jh2j`).

### `release-please.yml` is a mechanism with no skill

It *does* cut releases — semver + CHANGELOG + GitHub release + tag — but for **the
7 published packages under `tools/`**, and it **derives** the bump from
conventional-commit types rather than taking one:

> feat: minor bump · fix: patch · feat!: major · Owner reviews the cut release on
> GitHub, then triggers the publish workflow with `target=pypi`.

And **no skill in the corpus mentions `release-please`, semver or CHANGELOG.** The
only release-adjacent skill is `upstream-version-adoption`, which is about
*consuming* an upstream release, not cutting one. That is the `yean` shape exactly.

### Why this is the owner's and not mine

Three readings, and they are different designs rather than degrees of the same one:

1. **`content-publish` is folio-side and stays unsatisfiable here** — record it
   beside `latex-authoring`, and its mechanism lives in a folio repo this
   measurement cannot see (`d308`'s own correction).
2. **Its contract is wrong** — `versionIncrement` as a required *input* describes a
   manual flow, and this platform derives the increment. If the contract should
   describe the derived form, that is a change to a published contract.
3. **`release-please` wants its own skill** — "cut a release of the platform's own
   packages" is a capability nobody has stated, and authoring it is a claim about
   the capability vocabulary that every dependent instance inherits. `yean`
   established that call is the owner's.

They are not exclusive — 1 and 3 can both be true — but each is a design act, and
none is a Tool node I can write honestly today.

### Done when

- [ ] **which of the three readings** — the owner's call
- [ ] if 3: a skill for cutting the platform's own package releases, then a node
      over `release-please.yml`
- [ ] if 2: `content-publish`'s contract revised, and the `versionIncrement`
      required-input decision recorded
- [ ] if 1: recorded as the third unsatisfiable contract, and tier A's count says
      why


---

## SHARPENED 2026-09-20 — two of the three readings are now settled by evidence; ONE question survives

The BLOCKER above offered the owner three readings. Two of them are answerable
from the graph, and I answered them by reading it rather than handing all three
over.

### Reading 1 is EVIDENCED, not a choice — `content-publish` is folio-side

`cat-harness/processes/draft-to-publication.bpmn` carries three tasks
reffing `content-publish`, and the third is exactly the flow the skill's prose
describes:

| line | element | what it is |
|---|---|---|
| 91 | `Task_BuildDraft` — *"Build the draft publication"* | `serviceTask`, `<folio:skill ref="content-publish"/>` |
| 176 | `Task_AuthorizeRelease` — *"Authorise the release"* | **`userTask`** — a person decides |
| 185 | `Task_PublishRelease` — *"Version, tag and publish"* | `serviceTask`; documentation: *"Version bump, release notes, tag, build the final artifacts, deploy to the publication platform."* |

So `content-publish`'s required `versionIncrement` is not a contract defect —
it is an input a **person supplies at `Task_AuthorizeRelease`**, one step
upstream, in the publication manager's lane. That kills reading 2: the contract
describes the flow its own diagram draws. And it confirms reading 1 positively
rather than by absence — the skill has a mechanism, in a folio, invoked from a
diagram that lives here. Nothing in this repository is owed a node for it.

Recorded as the third unsatisfiable-**here** contract beside `latex-authoring`
(`jh2j`) — with the distinction that matters: `latex-authoring` is unsatisfiable
because no mechanism exists anywhere yet; `content-publish` is unsatisfiable
*here* because its mechanism is a folio's, by design.

### Reading 3 survives, and it is genuinely the owner's

`release-please.yml` cuts real releases — semver bump, CHANGELOG, GitHub release,
tag — for the **7 published packages under `tools/`**, and **no skill in the
corpus names it.** Re-verified by reading bodies, not names: the only skills
matching `release-please|semver|CHANGELOG` are `upstream-version-adoption`
(reading an *upstream's* changelog as a claim to be checked against
`git diff --stat pinned..candidate`) and `diff` (a per-block git-log viewer).
Zero hits for `release-please` or `semver` anywhere in `skills/` or
`methodologies/`. That is the `yean` shape exactly: a mechanism with no skill.

Authoring "cut a release of the platform's own packages" is a claim about the
**capability vocabulary that every dependent instance inherits** — `yean`
established that call is the owner's, not an agent's.

### Done when — REPLACES the three-reading list above

- [x] ~~reading 2: `content-publish`'s contract is wrong~~ — **refuted**;
      `versionIncrement` is supplied by `Task_AuthorizeRelease`
- [x] reading 1 **evidenced** from `draft-to-publication.bpmn`; recorded as
      unsatisfiable-here-by-design, and tier A's count says why
- [ ] **reading 3: does `release-please.yml` get its own skill?** — the owner's
      call, and the only question left on this bean
- [ ] if yes: the skill, then a node over `release-please.yml`
