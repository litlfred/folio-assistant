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
