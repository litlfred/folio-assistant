---
# folio-assistant-5o3a
title: Nothing checks the graph-kind docs against BASE_GRAPH_KINDS — prose drifted through three clean merges
status: completed
type: bug
priority: normal
created_at: 2026-09-18T18:30:40Z
updated_at: 2026-09-19T08:44:11Z
---


Found 2026-09-18 while verifying `main` after merging #267 and #268, not by any
check. That is the finding.

#266 collapsed the graph kinds `workplan` (at `beans/`) and `process-state` (at
`beans/workflow/`) into a single `beans` kind, with `beans/beans.json` naming
the `defs` and `workflows` nodes inside it. It changed `BASE_GRAPH_KINDS` in
`schemas/agent-harness.ts` and left every description of that map untouched:

- `skills/folio-core/directory-conventions.md` — the table still listed both
  retired kinds at a path that no longer exists. `AGENTS.md` designates this
  file the source of truth, so an agent following it would write
  `graph: "workplan"` and be refused by the registry.
- `schemas/agent-harness.ts` — its own doc comment opened "Five, and
  deliberately none of them renderable" over a map of four, and still argued
  for the split #266 had removed.
- `AGENTS.md` — described an intermediate state of #266's branch, before that
  PR's own reconcile commit `93511cdf`, asserting the declaration had no
  work-plan directory when it declares `beans/`.

#269 fixed all three. **This bean is the guard, not the fix.**

Why it survived: three PRs merged across the change (#266, #267, #268), every
one textually clean, every check green at every point. `gen-skill-docs --check`
verifies the generated mirror matches its hand-authored source — it cannot
notice that both are describing a registry they no longer match. No check
crosses from prose to code.

**Proposed guard.** A test asserting every kind named in the skill's graph-kind
table exists in `BASE_GRAPH_KINDS` plus the kinds registered by layers above
(today just `folio`, via `schemas/folio-graph-kind.ts`). Parse the table's first
column from the Markdown; the table is machine-readable already. Same shape as
`scripts/tests/skill-manifest-coverage.test.ts` (#268), which guards the
manifest-vs-disk direction.

Two things to decide before writing it, neither obvious:

1. **Which direction, or both.** A kind in the docs that the registry lacks is
   the defect above and should be hard. A kind in the registry the docs omit is
   also a gap but a milder one, and making it hard means every new kind must
   land with its prose in the same PR — which may be the right answer, but it is
   a policy choice, not a bug fix.
2. **Whether the historical references are exempt.** #269's rewrites
   deliberately name `workplan` and `process-state` in prose, to preserve the
   superseded design and stop someone re-proposing it. A naive parse must not
   read those as live claims. Scoping to the table's first column handles it,
   but only because the table is the machine-readable part — which is the
   argument for scoping there rather than grepping the file.

Not urgent. The instance is fixed; this closes the class.

## Worked 2026-09-19 — the guard, and the drift had already recurred

### Two decisions, made rather than deferred

The owner said "go", so both calls in this bean are made, with the reasoning
written down so either is cheap to overrule.

**1. Both directions hard.** Table-names-unknown-kind is the measured defect;
registry-kind-missing-from-table is the same class reversed. Measured before
choosing: **both directions were already clean**, so making the reverse hard
costs nothing today and locks in a property the corpus has rather than demanding
work to reach it. The price the bean named — every new kind lands with its prose
in the same PR — is the right one in a repo whose recurring defect is two
spellings of one fact. Softening it is one assertion.

**2. Scoped to the table's first column**, as proposed. Verified this is
structural rather than a dressed-up grep: the file holds exactly two pipe-tables
and this one is located by its header row, `| kind | declared by | holds |
renderable |`. A header that is absent or duplicated **throws** — a table the
test cannot find is not an empty table, and a silent pass over nothing is the
failure mode this bean is about.

### The bean's own references had drifted, twice over

- It names `schemas/agent-harness.ts`. That file does not exist; the registry is
  `schemas/cat-harness.ts:166`.
- `kg` was renamed to **`cat-harness`** on 2026-09-19, with `kg` kept in
  `GRAPH_KIND_ALIASES` as a deprecated alias — the same class of change as #266,
  hours before this guard was written.

### The prose was fixed once and drifted again, in the file that DEFINES the map

`BASE_GRAPH_KINDS`'s doc comment opened **"Four, and deliberately none of them
renderable"** over a map of **fourteen**. This bean records #269 correcting the
previous version of that same sentence — "Five" over a map of four. Corrected,
then wrong again.

So the number is **removed, not corrected**: the map is the only answer to how
many, and the sentence now says so. Same fix `AGENTS.md` applied to
`KG_CRITERIA`, and for the same reason — a count in prose is a claim that has to
be maintained, it was maintained wrongly twice, and
`Object.keys(BASE_GRAPH_KINDS).length` is checkable and free. Two stale `kg`
references in the same comment fixed with it.

### Verified by perturbing every direction

| probe | result |
|---|---|
| add a `workplan` row the registry lacks | fail, naming `workplan` |
| delete the `voices` row from the table | fail, naming `voices` |
| rename the table header | **throws**, naming the line it looked for |
| restored | 3 pass |

`folio` is registered by the layer above (`schemas/folio-graph-kind.ts`), so the
test imports it for that side effect — without it the registry omits `folio` and
the table reads as over-documented, a false finding that would have made the
first run a puzzle.

### Not done

Guarding `kg` → `cat-harness` in *prose* generally. The file legitimately
discusses `kg` historically, and deliberately keeps the name for `kg:audit`,
`kg-export`, the `kg-qa` sidecars and the `kg` QA family — so a text check there
would read those as live claims, which is the trap scoping to the table avoids.

## Done when

- [x] a test asserts the table's first column against the registry, both directions
- [x] the historical-prose exemption handled by scoping rather than by a skip-list
- [x] the table-not-found case throws rather than passing vacuously
- [x] the live drift in the registry's own doc comment fixed, and its count removed
      rather than re-corrected
