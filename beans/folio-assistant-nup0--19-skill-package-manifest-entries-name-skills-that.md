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
