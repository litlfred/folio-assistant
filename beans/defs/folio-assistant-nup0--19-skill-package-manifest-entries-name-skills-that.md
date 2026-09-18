---
# folio-assistant-nup0
title: 19 skill-package manifest entries name skills that do not exist — resolve or retire, per package
status: todo
type: bug
created_at: 2026-09-18T18:20:54Z
updated_at: 2026-09-18T18:20:54Z
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
