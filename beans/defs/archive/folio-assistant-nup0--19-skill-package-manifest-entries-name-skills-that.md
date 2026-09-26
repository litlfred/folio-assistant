---
# folio-assistant-nup0
title: 19 skill-package manifest entries name skills that do not exist — resolve or retire, per package
status: completed
type: bug
priority: normal
created_at: 2026-09-18T18:20:54Z
updated_at: 2026-09-19T05:48:15Z
---


Found 2026-09-18 while registering nine unlisted `folio-core` skills (PR for
the Tools-schema-carrier decision). Three packages list skills with no `.md`
behind them, so `scripts/generate-registry.ts` publishes a registry naming
skills that cannot be fetched:

| package | listed | files on disk | dangling |
|---|---|---|---|
| `authoring-document` | 4 | 0 | 4 |
| `authoring-math` | 6 | 0 | 6 |
| `authoring-who-smart-guidelines` | 10 | 1 | 9 |

They are not typos, and they are not one problem:

- **`authoring-document` is a half-finished rename.** Two of its four —
  `document-authoring`, `normative-statements` — exist under
  `skills/folio-document-adapter/`, which carries **no `package-manifest.json`
  at all**. So the package was moved and the manifest was left behind, and the
  four skills in the new home are themselves unregistered for the opposite
  reason. Fixing this is: write the adapter's manifest, delete the old one.
- **`authoring-math` names six skills that exist nowhere in the tree** —
  `lean-formalization`, `latex-authoring`, `proof-verification`,
  `scientific-visualization`, `hypothesis-generation`,
  `scientific-critical-thinking`. Either planned-and-unwritten or moved into
  `folio-paper-adapter` under other names; `find` says the names themselves are
  absent, so this needs a decision rather than a lookup.
- **`authoring-who-smart-guidelines` has 9 of 10 dangling** and is the one most
  likely to be genuinely unwritten (`l2-dak-authoring`, `l3-fhir-authoring`,
  `fhir-validation` …), since the DAK work is live elsewhere in the repo.

Each needs a per-package decision — renamed, moved, or never written — which is
editorial work on packages this session does not own, which is why it is a bean
and not a fix.

**Already guarded.** `scripts/tests/skill-manifest-coverage.test.ts` pins these
19 exactly as `KNOWN_DANGLING` and fails on a twentieth, so the number can only
go down. The opposite direction (a file with no manifest entry) is a hard gate
and is clean as of that commit. Shrink `KNOWN_DANGLING` as each package is
resolved; a second test fails if an entry is removed from the list without the
package actually being fixed, so the ratchet cannot be unwound by editing it.

Not urgent: nothing is broken that was working, and the registry has published
these for as long as they have existed. It is a correctness debt with a known
size, which is the state a bean is for.

## Correction — measured 2026-09-18, bean `m4zg`

**The premise in this bean's title is wrong, and the number is wrong.** It was
measured against each package's own directory listing. Three of the manifests
here — `authoring-document`, `authoring-math`, `authoring-who-smart-guidelines` —
are **bundle** definitions: they curate a set of skills whose instruction bodies
live in *other* directories (`skills/folio-document-adapter/`,
`schemas/skills/<name>/`, `.claude/skills/local/`) or in a **remote package**
(`skills/remote-packages/claude-scientific-skills.json` supplies
`scientific-visualization`, `hypothesis-generation`,
`scientific-critical-thinking`). A bundle manifest listing a skill it does not
itself hold is the design, not a defect.

Measured against the **instance** instead of the folder:

| check | count |
|---|---|
| manifest entries naming no `.md` in their own package dir | 19 |
| of those, resolvable elsewhere in this instance | 16 |
| of those, supplied by a declared remote package | 3 |
| **truly unresolvable** | **0** |

`bun run kg:audit` now carries this as the `manifest-skill-exists` criterion
(critical), resolving against `knownSkills()` **plus** remote-package
declarations, so the correct question is asked on every run. Writing it the
naive way first would have deleted three correct entries.

**The real defect in this area was elsewhere**, and `m4zg` fixed it:
`skills/content-lifecycle/` was missing from `LOCAL_PACKAGES` in
`src/tools/skill-fetch.ts` while **52** `<folio:skill ref>` activities named its
eight skills — so `workflow_next` handed an agent `content-validate` and
`skill_fetch` answered "package not found".

## Worked 2026-09-19 — the 19 were already resolved; a hole they left was not

**The title's premise is dead twice over and I nearly acted on it a third time.**
`m4zg` corrected 19 → 0 truly unresolvable; `d3e63f15a` then closed the ratchet —
`KNOWN_DANGLING` is `[]`, `skills/authoring-document/` is gone,
`skills/folio-document-adapter/package-manifest.json` is written, and
`manifest-skill-exists` passes. Verified all of that on `f098b530` before
touching anything.

**What was actually left.** Two checkers disagreed for two hours and the corpus
followed whichever ran last.

- 20:12 — `m4zg` builds `manifest-skill-exists` to resolve against
  `remote-packages/`, and records the near-miss in the bean and in
  `kg-audit.ts:772`: *"collapsing them would have had this criterion demand the
  deletion of three correct manifest entries the first time it ran. That very
  nearly happened."*
- 22:18 — `d3e63f15a`, a different session, sets out to fix the same
  two-definitions defect by pointing `skill-manifest-coverage.test.ts` at the
  shared `knownSkills()`. But `known-skills.ts` had never read
  `remote-packages/`, so that was a **third** definition. Under it the three
  `authoring-math` entries read as dangling and were deleted, on the evidence of
  a `git log --diff-filter=A` search finding no file ever added for any of
  them — the wrong question, since a remote skill has no file here by design.

**I restored the three, and that was wrong.** The deciding question is not
whether the skills exist somewhere but whether anything here can offer them.
Measured: `shallow-clone` is only a Zod enum value; `src/tools/skill-fetch.ts`
and `scripts/generate-registry.ts` contain **no** mention of `remote-packages/`;
the single real consumer, `scripts/generate-docs.ts`, reads those files for
Docker requirements, which is what `schemas/skill-package.ts` documents them as
providing. So an entry resolvable only that way publishes a name `skill_fetch`
answers "not found" for — the exact defect this bean was opened about.

Reverted the restore. `d3e63f15a` stands.

**The fix is therefore the opposite of my first attempt.** The allowance in
`manifest-skill-exists` was protecting the wrong answer, so it is closed: a
remote declaration no longer resolves a manifest entry. `remotePackageSkills`
stays, moved from `kg-audit.ts` into `scripts/known-skills.ts` beside
`knownSkills`, and is used to **classify** the finding — "declared by a remote
package nothing syncs" and "named nowhere at all" have different remedies, and a
finding that does not say which is one somebody measures again.
`manifestResolvableSkills` names the wider question so the union is a call-site
choice rather than an accident of which module scanned which directory. That
accident is what made the third definition.

**Verified.** Probe: adding `scientific-visualization` back takes
`manifest-skill-exists` from `pass`/0 to `fail`/1 with the classifying detail,
and removing it returns to `pass`/0 — so the gate bites rather than being
vacuous. **Falsification criterion from the opening brief held**: `skill-servable`
is still 0 findings in every workflow sidecar and `check:workflow-refs` is
unchanged, so the narrow and wide questions did not collapse. Zero manifests
currently claim a remote skill, so this closes a hole rather than fixing a live
break, and it is honest to say so.

`scripts/tests/manifest-remote-resolution.test.ts` (5 tests) holds the rule
against a synthetic instance — a criterion with nothing to find cannot show that
it would find it — plus the evidence the change rests on, including a pinned list
of the five readers of `remote-packages/` with each one's role, so a sixth is
visible. Grepping for `shallow-clone` was the first attempt at that and is not
evidence: it cannot tell an implementation from a comment, and it flagged the
comment this change itself added.

The underlying gap — a declaration that overstates what exists — is bean `wlqd`,
with the two options and their costs.

## Summary of Changes

- `scripts/known-skills.ts` — `remotePackageSkills()` moved here from
  `kg-audit.ts`; `manifestResolvableSkills()` names the wider question. Kept
  **separate** from `knownSkills()`, because folding remote skills into the
  servable set would make `skill-servable` pass for a skill this instance cannot
  serve.
- `scripts/kg-audit.ts` — the allowance closed, the finding classified, the
  measurement written down at the point of decision.
- `scripts/tests/manifest-remote-resolution.test.ts` — new, 5 tests.
- `scripts/tests/skill-manifest-coverage.test.ts` — header records the other half
  of its own reading, and cross-references the new test.
- Bean `wlqd` opened for the declaration-without-implementation gap.

No manifest changed. The 19 were already resolved; what is added is the guard
that stops them coming back through a door nobody had closed.
