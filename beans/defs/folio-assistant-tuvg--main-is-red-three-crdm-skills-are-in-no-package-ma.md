---
# folio-assistant-tuvg
title: 'MAIN IS RED: three crdm skills are in no package manifest and carry a retired roles: field'
status: todo
type: bug
created_at: 2026-09-26T04:09:28Z
updated_at: 2026-09-26T04:09:28Z
parent: folio-assistant-1xhc
---

Measured 2026-09-26 on `origin/main` at `6840b14097b`. **This fails every open PR, not one.**

## The two failures

Both name the same three files, added by main's commit `7edf7b7ed5a` (*"feat: CRDM Phase 4b prioritization, SDLC/release skills, CRDM phase detail skills"*):

    cat-harness/skills/crdm/crdm-needs-assessment.md
    cat-harness/skills/crdm/crdm-impact-analysis.md
    cat-harness/skills/crdm/crdm-requirements-template.md

| gate | what it says |
|---|---|
| `skill package manifests cover the package` (test) | all three are unlisted in `cat-harness/skills/crdm/package-manifest.json` |
| `check:retired-front-matter` | all three carry `roles:`, retired from skill markdown |

## It is main's, established rather than assumed

- `git show origin/main:cat-harness/skills/crdm/package-manifest.json | grep -c 'needs-assessment|impact-analysis|requirements-template'` → **0**. Not listed on main either.
- No fix exists to port: the 25 most recently updated remote branches were checked for a manifest listing any of the three. **None does.**

## The proposed patch

1. Add the three basenames to the `skills` array in `cat-harness/skills/crdm/package-manifest.json`.
2. Remove the `roles:` key from each file's front matter. That field is retired — 325 annotations across 140 files, read by nothing, dangling from its first commit (record: `fsh-guts/retired/skill-roles-front-matter.md`). If a skill should declare who performs it, that is bean `y1w9`, and the field has to be declared before it is written.

Not applied here: this is not the work of whoever's PR happens to notice it, and `check:retired-front-matter` plus the manifest belong to the crdm package. Reported with the patch rather than widened into an unrelated PR.

## Why this keeps happening — the same shape landed yesterday

`decision-methodology-selector.md` shipped unlisted in `folio-core`'s manifest on 2026-09-25 and was fixed within hours. **This is the second occurrence in two days**, so the class is worth a gate at the point of authoring rather than a fix per occurrence: a new skill file and its manifest entry are one change, and nothing makes an author write both.

## Done when

- [ ] The three are listed in the crdm package manifest.
- [ ] The retired `roles:` key is gone from all three.
- [ ] `bun test -t 'every skill file is listed in its package manifest'` and `bun run check:retired-front-matter` are green on main.
- [ ] A decision is recorded on whether authoring a skill without its manifest entry should be caught earlier, given two occurrences in two days.

## CORRECTED 2026-09-26 — this bean named ONE cause; there are THREE, across five failures

The first version of this bean reported *"two gates"*. That was **wrong**, and
wrong the same way twice in one session: a failure list was read partially and
the remainder dropped silently. CI on `f641c1ffcbe` reported **five** test
failures; the local sweep had four and this bean named two of them.

The full set, each established against `origin/main` rather than inferred:

| # | failing test / gate | root cause |
|---|---|---|
| 1 | `the sweep over the real tree > is clean, and scanned enough files…` | **A** |
| 2 | `the graph-kind exemption > the exemption guards a non-empty set, and only that set` | **A** |
| 3 | `check:retired-front-matter` | **A** |
| 4 | `skill package manifests cover the package` | **B** |
| 5 | `the real corpus — and the gate can actually fail > no NEW drift` | **C** |
| — | `this repository's own corpus > the committed index is up to date and valid` | **regeneration — fixed**, `bun run translation:index` |

### Cause A — the retired `roles:` field, in FOUR files across TWO packages

Not three in crdm. `cat-harness/skills/workflow/branch-freshness.md` carries it
too, and on `origin/main` it reads literally:

    roles: [reader, collaborator, owner]

Those three actor ids **have never existed in any commit** — which is the whole
reason the field was retired (325 annotations across 140 files, read by nothing;
record: `fsh-guts/retired/skill-roles-front-matter.md`).

Files: `skills/workflow/branch-freshness.md`,
`skills/crdm/crdm-needs-assessment.md`, `skills/crdm/crdm-impact-analysis.md`,
`skills/crdm/crdm-requirements-template.md`.

Failure 2 is the same cause seen from the other side: that test asserts the
exemption guards a **non-empty set and only that set**, and expects
`branch-freshness.md` to be a `folio-memory/v1` entry (where `roles:` is a live
axis). It is not one — it is a skill. So the file is in the guarded set for the
wrong reason, and the test is doing its job.

### Cause B — three crdm skills in no package manifest

Unchanged from this bean's first version, and still unfixed on main:
`crdm-needs-assessment.md`, `crdm-impact-analysis.md`,
`crdm-requirements-template.md` are absent from
`cat-harness/skills/crdm/package-manifest.json`.

### Cause C — translated pages published with no `.po` catalogue

**A separate defect this bean missed entirely.** Five locales × several pages
are published with no catalogue and no `UNCATALOGED` record:

    error {ar,es,fr,ru,zh}/accessibility:  published with no `.po` catalogue
    error {ar,es,fr,ru,zh}/content-types:  published with no `.po` catalogue
    …

`cat-harness/docs/{ar,es,fr,ru,zh}/accessibility.md` all exist on `origin/main`;
no matching `.po` does. The gate's own remedy: add the catalogue, or record it
in `UNCATALOGED` with a reason and a date.

### Established, not assumed

- `git show origin/main:…/branch-freshness.md | grep '^roles:'` → present.
- `git show origin/main:…/crdm/package-manifest.json | grep -c …` → **0**.
- The locale pages are in `git ls-tree origin/main`; no `.po` is.
- `git diff --name-only origin/main HEAD` over those paths returns only
  **generated** `kg-qa` sidecars — regeneration output for main's new files,
  not edits to any source.

### Done when

- [ ] `roles:` removed from all **four** files (or, where a file really is a
      `folio-memory/v1` entry, declared as one — that is the exemption).
- [ ] The three crdm skills listed in the crdm package manifest.
- [ ] Each published translated page has a `.po` catalogue, or an `UNCATALOGED`
      entry with a reason and a date.
- [ ] `bun test` green on `main` for all four tests, and
      `bun run check:retired-front-matter` green.
- [ ] A decision on catching an unlisted skill at authoring time — **third**
      occurrence of that shape in two days.
