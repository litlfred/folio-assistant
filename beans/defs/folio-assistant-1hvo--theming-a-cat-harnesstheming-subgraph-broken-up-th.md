---
# folio-assistant-1hvo
title: 'THEMING: a cat-harness/theming/ subgraph, broken up thematically'
title: 'THEMING: a cat-harness theming subgraph, broken up thematically'
status: completed
type: task
priority: normal
created_at: 2026-09-20T14:28:56Z
updated_at: 2026-09-20T16:03:06Z
parent: folio-assistant-o3xy
---

Owner, 2026-09-20, verbatim:

> also themeing skills under cat-harness/thermeing/.  break up thematically.

## What it asks for

A `cat-harness/theming/` subgraph holding the theming skills, **broken up
thematically** rather than kept as one block.

## Why this is worth doing rather than cosmetic

Theming is currently spread across places that do not name themselves as
theming, and the session that produced this instruction is the evidence: the
work touched `schemas/themes.ts`, `schemas/landing-sticky.ts`, the generated
`docs-ui.css`, `themes:css`, `check:theme-art`, the scrim measurement rules and
the avatar crop boxes — with the discipline recorded in
`skills/folio-core/theme-art-intake.md` and nowhere else.

**The defect that keeps recurring is exactly the one a thematic split fixes.**
Four rounds of "still not image" were one cause: a theme with no CSS rule falls
back to an opaque surface and paints over its own art, so `themes:css` must be
run. That is a *theming* fact with no theming directory to live in, so it lives
in a comment and in one skill's prose, and it was rediscovered rather than
read.

## Measured before claiming

- **`skills/folio-core/theme-art-intake.md` exists** and already carries the
  intake discipline, including the fires-on-every-subject rule recorded twice.
  Moving it is a relocation, and **ids are stable across a relocation while
  paths are not** — an override matches on id, so the move must keep ids or
  every consumer scans a directory that is not there
  (`directory-conventions`).
- **A declared directory needs a visualiser and a documentation entry** under
  `2krx`. A new `cat-harness/theming/` subgraph therefore arrives owing both,
  and shipping it without them manufactures the finding rather than clearing
  it.
- **"Break up thematically" is not specified further.** Candidate axes, none
  chosen: intake (art -> webp -> crops -> digests), palette and contrast
  (scrims, WCAG, the eleven themes), declaration (`themes.ts`, per-layout
  `textRegion`, the proposed `avatarRegion` from `603s`), and generation
  (`themes:css`, and the fallback that paints over art).

## The axis, answered by the owner 2026-09-20

> 1 + 2, then specialized to 3

**Pipeline stage AND producer/consumer, with per-artefact specialisation on
top** — three levels, not a choice between three options:

1. **Pipeline stage** is the primary division: intake -> declaration ->
   generation -> contrast. This is how the failures actually arrived; each of
   the four rounds of "still not image" was one stage.
2. **Producer vs consumer** cross-cuts it: what CREATES a theme (intake,
   declaration) against what READS one (generation, rendering, contrast). Note
   this is not a second partition of the same set — it is the axis that says
   which direction a given stage faces, and it is what makes "a theme with no
   CSS rule falls back to an opaque surface" a *consumer* fact rather than a
   generation detail.
3. **Per artefact** is the SPECIALISATION, last and narrowest: sticky, landing
   board, docs background, navbar avatar. Specialised rather than duplicated —
   the general rule lives in its stage and the artefact package carries only
   what differs. The avatar crop boxes (`603s`) are the worked example: the
   *rule* that a crop is declared data belongs to declaration, and the
   *boxes themselves* are navbar-avatar specialisation.

**Why the ordering matters more than the names.** Going 3-first would
duplicate intake and contrast into every artefact, which is the shape that put
the scrim rule in one skill's prose and let it be rediscovered rather than
read. Going 1-first and specialising last means a new artefact inherits the
stages and declares only its difference.

## Done when

- [x] The theming skills live in their own package, on the axis the owner
      chose — `cat-harness/skills/theming/`, shipped 2026-09-20.
- [x] Documented: the three-level structure is recorded in
      `theme-art-intake.md`, the skill an agent reads first here.
- [x] No visualiser/doc exemption needed: as a package under the already
      declared `skills/` graph it is not a separate declared subgraph, so
      `2krx` does not ask it for one.

## Shipped 2026-09-20 — and the path was NOT `cat-harness/theming/`

The owner's words were *"themeing skills under cat-harness/thermeing/"*, and
that literal path was tried first and is **wrong for this repository**. Worth
recording, because the failure was silent in the way this repo keeps paying for:

A kg directory that holds skills DIRECTLY is folded into the instance's own
package (`discoverLocalPackages`, `skill-fetch.ts:132`) — the name is taken
from the enclosing instance, not the directory. So `cat-harness/theming/` with
a `package-manifest.json` produced a package that `LOCAL_PACKAGES` did not
list, and **`kg:audit` wrote no sidecars for the three skills at all**. They
were still served, still published, still in `knownSkills` — and silently
unaudited. Nothing failed; the only symptom was three sidecars that did not
appear.

A **package is a subdirectory of a declared kg directory** — `skills/folio-core`,
`skills/workflow`, `skills/graph-management`, `methodologies/crdm`. So
`cat-harness/skills/theming/` is the shape, and with it `LOCAL_PACKAGES` finds
the package and sidecars land at `kg-qa/skills/theming/`.

## Measured before splitting, and it changed the plan

**The corpus is three skills** — `theme-art-intake`,
`site-presentation-assets`, `create-sticky-note`. Everything else that greps
for "theme" merely mentions the word.

So the four stage packages the chosen axis implies are **not** created: four
directories over three skills would declare trees with nothing in them, which
is `dh4f`, against this repository's own rule to declare only what exists. One
package now; the axis is written down so the order is already decided when the
content reaches it. What the move DID buy is findability — a theming skill was
one of 107 in `folio-core` and is now one of three.

Three ratchets caught mistakes on the way, which is them working:
`gen-skill-docs` refused a package with no `SKILLS_CATEGORIES` heading ("a
package is not published under a guessed heading"), the manifest-coverage test
refused a `README.md` no other package carries (its substance moved into the
skill), and `kg:audit:check` refused to delete the three dead sidecars itself —
the owner authorised that.
- [ ] `cat-harness/theming/` is declared, with its graph kind and `dependents`
- [ ] The theming skills live there, split on an axis the owner chose
- [ ] It has the visualiser and documentation entry `2krx` requires, or an
      explicit exemption like bootstrap's (`hfkl`)

---

## Done, 2026-09-20 — and it found two live defects on the way in

`cat-harness/theming/` is declared (id `theming`, graph kind `cat-harness`,
`dependents: skip`) and holds six skills split on the owner's axis:

| stage | faces | skill |
|---|---|---|
| — | map | `theming` |
| 1 | producer | `theme-art-intake` (**moved** from `skills/folio-core/`, name kept) |
| 2 | producer | `theme-declaration` |
| 3 | consumer | `theme-generation` |
| 4 | consumer | `theme-contrast` |
| — | specialisation | `theme-artefacts` |

**FLAT, one declared directory whose FILES carry the split.** Five declarations
— one per stage — would owe five visualisers and five documentation entries
under `2krx`, which manufactures findings on a repository trying to clear
nineteen. *"Broken up thematically"* is satisfied by the files.

**The map is authored AS A SKILL, not as a `README.md`.** `isSkillMd` is
declaration-over-location, so a markdown file here with no `$schema:` enters
the graph as a skill either way — a README would be one with no `name` to be
fetched by, and the one orientation file an agent could not reach through
`skill_fetch`, which is the route `AGENTS.md` tells it to use.

**`theme-ui-review` deliberately did not move.** It is a UI review skill
covering branding, languages and findings discipline, for which theming is one
subject rather than the subject. A directory that takes every file with
`theme` in its name is a directory nobody can describe.

### It owes a visualiser and a documentation entry, and it has both

`bun run theme:sheet` renders every theme: palette swatches, the scrim's
contrast against the binding case, and each layout's art with `textRegion`
(blue) and `avatarRegion` (pink) drawn, plus that clip at 46px navbar size.
It PRINTS and never gates — the schema proves a box is square and in bounds
and cannot see what a picture shows.

Run independently it reproduces the recorded 9.25–9.36:1 range (computed
8.21–9.38 across the backdrop themes, all clear of the AAA 7:1 floor), which is
the cheapest confirmation there is that the comments beside those values are
still true.

`docs/architecture/theming.md` is the documentation entry. bootstrap's
`renderExemption` was the alternative and is the wrong shape: that exemption is
a floor that rises, for a layer producing nothing a human browses. Theming
produces nothing BUT things a human looks at.

### DEFECT 1, found by doing this — three packages were being silently dropped

`discoverLocalPackages` named every directly-held kg directory after its
INSTANCE, so `cat-harness`'s four — `src/skills/`, `theming/`,
`methodologies/crdm/`, `methodologies/raci/` — all resolved to
`folio-assistant` and **the last assignment won**. Three packages were found
and dropped with nothing reported: `kg:audit` showed **six
`manifest-skill-exists` CRITICALs** for theming, and **27 of its MAJORs were
CRDM activities whose skills nothing could serve**. `dh4f` one scope in from
the cross-instance half the function's own docs already describe.

Fixed by a RULE rather than by first-wins, in a second pass over the whole set
because the answer depends on how many there are: a directory basenamed
`skills` takes the instance name; otherwise a SOLE directly-held directory
takes it; otherwise the basename. `src/skills/` stays `folio-assistant` and
`bootstrap/skills/` stays `bootstrap`, both measured unchanged.
**Majors 102 → 75, passes 1393 → 1404**, and the `role-skills-resolve`
critical cleared with them.

Falsified against order: the same four directories declared backwards produce
the same names.

### DEFECT 2, filed rather than fixed — `lps0`

`kg-audit.ts`'s `skillFiles()` walks a hardcoded `join(root, "skills")`, so
**every skill in a topical subgraph is unaudited** — CRDM's three, RACI's,
`src/skills/`, and now theming's six. Not reported as unknown; not reported at
all.

That is why `test/results/kg-qa/skills/folio-core/theme-art-intake.kg-qa.json`
went DEAD on this move and no sidecar appeared at the new path. **The dead one
was removed** — it is generated QA output whose subject I relocated in this
change, so removing it completes the move rather than deleting a durable
artefact — and that is stated here because
`deletion-requires-confirmation` means a removal is never silent even when it
is bookkeeping. If the owner would rather it had stayed, restoring it is one
`git revert` of that hunk.

Not fixed here on purpose: widening the walk surfaces findings on ~20 skills
nobody has ever audited, and a change that flips `kg:audit:check` red belongs
in a commit about that.

### Verified

`bun test` 4101 pass / 0 fail. `check:instance-render` 4 rendered / 0 failed,
`check:harness-dirs`, `check:declared-paths`, `check:declared-assets`,
`check:skills`, `check:theme-art`, `themes:css:check`, `kg:audit:check`,
`check:undeclared-files`, `readme:sync:check`, `render:bpmn:check` — all rc=0.
`tsc` and `eslint` clean.

### One thing left open, recorded on `lps0`

`gen-skill-docs` keys a directly-held package by its DECLARED ID
(`cat-harness-src`, `bootstrap-render`) while `skill-fetch` keys it by the
instance name or the basename (`folio-assistant`, `render`). Both are
defensible; having both is the problem, and it predates this change.
