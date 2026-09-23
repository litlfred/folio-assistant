---
# folio-assistant-a6kl
title: 'L1 GATE WAS A NO-OP IN CI: check:l1-complete ran from the repo root and found no declaration'
status: completed
type: bug
priority: critical
created_at: 2026-09-20T10:20:54Z
updated_at: 2026-09-21T10:10:00Z
parent: folio-assistant-kupb
---

FOUND 2026-09-20 while excising `directoryForGraph`, and it predates that work.

`.github/workflows/code-quality-gates.yml` runs `bun run check:l1-complete` and `-- --check` from the REPOSITORY ROOT. The script resolved its corpus with `checkAll(resolve("."))` -- the CWD. The repository root carries no `harness.json`: the declaration is one level down, in `cat-harness/`. So `directoryForGraph(repoRoot, "library")` returned undefined, `checkAll` returned `[]`, the script printed **'no library/ entries -- nothing to check'** and **exited 0**.

FOUR DOCUMENTS, 1,402 TRACKED FILES, NOT CHECKED. And `--check` passed for the same reason rather than a second one: an empty report list has no stale sidecars, so the freshness gate was green over nothing too.

THE SCRIPT'S OWN COMMENT HAD THE RULE RIGHT and then broke it, on the next line:

> // Absent declaration is "nothing to check", never "complete".
> const lib = directoryForGraph(root, "library");
> if (!lib || !existsSync(lib)) return [];

`[]` IS 'complete' to every caller. Stating a rule is not enforcing it.

AND SO DID THE TEST. `ingest-and-l1.test.ts` carried `test("no library/ is 'nothing to check', not 'complete'")` -- the name is exactly right -- asserting `expect(checkAll(root)).toEqual([])`. The assertion encoded the defect its own name forbids, so the gap was pinned rather than caught.

WHEN IT BROKE is worth knowing and I have not established it. The split into `cat-harness/` moved the declaration away from the CWD; before that, `resolve(".")` and the instance root were the same directory. So this was almost certainly silent from the split onward, and the gate looked green the whole time. Bean `wggr` tracks the split.

## Fixed here
- `checkAll` THROWS `NoDeclaredLibrary` rather than returning `[]`, for both 'no declaration' and 'declared but absent' (the second is the `dh4f` shape).
- the CLI resolves `INSTANCE_ROOT` (the directory holding the declaration) instead of the CWD; `--root=` still overrides, so a folio checking its own corpus is unaffected.
- the test now asserts the throw, with the CI story in a comment so the assertion cannot quietly revert to `[]`.
- verified: from the repo root the gate now reports all four entries and every derivable requirement green, and `--check` reports 4 current verdicts.

## Swept 2026-09-21 — nothing live found, and the guard is the gate's own

The open question was whether any OTHER gate in `code-quality-gates.yml` shares
the CWD-vs-instance-root defect. It does not. Measured rather than reasoned:

- the workflow wires **75** distinct `bun run` gates;
- **6** resolve a root from the CWD — `check:actor-reach`, `check:bean-parents`,
  `check:declared-assets`, `check:harness-dirs`, `check:l1-complete`,
  `check:workflow-paths`;
- run from CI's ACTUAL cwd (the repository root) all six find a NON-EMPTY
  corpus: 27 actors, 177 open beans, 12 instances, 342 beans present, 72
  workflow invocations, 4 library entries. None reports the `nothing to check`
  shape this bean is about.
- across all 33 workflows there are **31** `working-directory:` steps and
  **0** of them run any of the six. So no gate is invoked from a root other
  than the one it was measured at.

`check:bean-parents` and `check:harness-dirs` print no corpus count, which is
the shape that HIDES this defect — both were opened by hand rather than
inferred from a silent exit 0, and both hold a real corpus. `check-bean-parents.ts`
documents its third state deliberately (*"A repository with no bean store is
**not** a failure"*), so its exit 0 is defensible on its own terms.

## The falsification, and what it actually showed

Sweeping for absence proves little, so the defect was REINTRODUCED: the four
call sites at `check-l1-complete.ts:906,931,956,971` were reverted from
`instanceRootFor(resolve("."))` to `resolve(".")` and the gates re-run.

    reintroduced -> check:l1-complete            rc=2
                    "No `library` graph is declared under <repo>.
                     This is NOT a pass. Treat it as unknown."
    restored     -> check:l1-complete            rc=0

    does any OTHER gate catch it?
      check:anchor-names     rc=0     check:partition         rc=0
      check:workflow-paths   rc=0     check:harness-dirs      rc=0
      check:command-paths    rc=0     check:declared-assets   rc=0

**The gate self-guards and nothing else does.** What holds the line is the
OTHER half of this bean's fix — `checkAll` throwing instead of returning `[]` —
not the root resolution. Reverting the root alone still fails, loudly, because
the throw converts an empty corpus into a refusal. That is the half worth
keeping if the two ever have to be told apart.

## A claim corrected in `check-workflow-paths.ts`

Its module doc said the successor class *"has its own reader —
`check:anchor-names` … between them the path is accounted for at both ends."*
The run above falsifies the second clause: `check:anchor-names` audits ANCHOR
NAMES (`REPO_ROOT`, `INSTANCE_ROOT`, `PLATFORM`), and these four call sites
pass an inline expression under no named anchor at all, so it is structurally
blind to them. Corrected in place here — the accurate statement is that the
script end is guarded by the script's own refusal, not by an external reader.

## Queued rather than done here

- a generic reader for the class (every corpus-walking gate pins its corpus
  non-empty) — today that is a per-check TEST convention applied at ~14 sites
  with no cross-gate reader. New bean; `6tkl` and `pzdv` are both completed and
  neither built one.
- `check-l1-complete.ts:718` declares a LOCAL `instanceRootFor` returning
  `string | undefined` while `cat-harness.ts:2495` exports one of the same name
  returning `string` and throwing. Not imported, so not a shadowing bug — but
  one name with two meanings, which is `check:anchor-names`' own shape one level
  up, and that check sees anchor names rather than function names. New bean.

## Summary of Changes

Both halves of this bean are now landed and merged (#674, `ce71f60`).

The FIX shipped earlier: `checkAll` throws `NoDeclaredLibrary` rather than
returning `[]`, and the CLI resolves the instance root instead of the CWD.

The SWEEP shipped here, and closed the "Still open" question with a measurement
rather than an assurance: 75 gates wired, 6 resolve a root from the CWD, all 6
find a non-empty corpus from CI's actual cwd, and 0 of the 31
`working-directory:` steps across 33 workflows run any of them.

The falsification is the part worth keeping. Reintroducing the defect leaves
`check:l1-complete` at rc=2 and SIX other gates at rc=0 — so the gate
self-guards and nothing external reads this class. That corrected a claim
`check-workflow-paths.ts` was making about `check:anchor-names`, in place.

Follow-ups, both under `1xhc`: `iym1` (no cross-gate vacuity reader) and `12ws`
(`instanceRootFor` means two different things in two files).
