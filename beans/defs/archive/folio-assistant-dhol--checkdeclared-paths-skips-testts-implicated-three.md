---
# folio-assistant-dhol
title: check:declared-paths skips *.test.ts — implicated three times now
status: completed
type: task
priority: normal
created_at: 2026-09-20T12:08:49Z
updated_at: 2026-09-20T13:28:04Z
parent: folio-assistant-zzmr
---

Found 2026-09-20 while moving CRDM into its own subgraph (bean `g43o`):
**two tests broke on hardcoded paths**, which is precisely the defect
`check:declared-paths` exists to prevent.

- `scripts/tests/log-writer.test.ts` composed
  `../../processes/crdm-requirements.bpmn`. Worse than a plain
  break: it went ENOENT and the test reported *"the process does not
  declare folio:log"* — a false finding about the CORPUS rather than
  about itself.
- `scripts/tests/todos.test.ts` had already paid for this once. Its own
  comment says so: *"this is the second hardcoded path in a test to break
  today"*, and, explicitly, *"`check:declared-paths` cannot catch this:
  it skips `*.test.ts`. That exemption is worth revisiting."*

So the exemption has now been implicated three times, by two different
relocations.

## Why this is not a drive-by widening

The exemption presumably has a reason, and **finding out is the work**.
Candidates, none verified:

1. **Fixtures.** A test that builds a throwaway tree writes literal paths
   into it by necessity — `"skills/folio-core/a.md"` inside a `mkdtemp`
   fixture names nothing in this repository and must not be resolved
   against the declaration.
2. **Assertions about the layout itself.** A test pinning that
   `bootstrap/skills/` is declared has to name it.
3. **Volume.** The check refuses a literal unless it is marked with a
   reason; if tests carry hundreds, turning it on is a large annotation
   pass before it is a fix.

(1) is the likely one and it is also the answer: the distinction is not
test-versus-source but **fixture-versus-corpus**. A literal naming a path
in a temp directory is fine; a literal naming a path in THIS repository is
the defect, and the existing `declared-path-literal: <reason>` marker
already expresses "I know, and here is why".

## Done when

- [ ] the reason for the `*.test.ts` exemption established — read the
      check's history, not guessed
- [ ] measured: how many literals in tests name a real repository path
      versus a fixture path
- [ ] if the fixture/corpus split holds, the exemption narrowed to
      fixtures rather than removed
- [ ] the two already-fixed call sites left as they are — both now resolve
      through the declaration

---

## Resolved 2026-09-20 — and the bean's own hypothesis was the wrong shape

### 1. The reason for the exemption: **there is none**

Established by reading, not guessed, as this bean required. The clause
`!e.name.endsWith(".test.ts")` was present in the module's **first commit**
(`da36111ea3`), uncommented. A 71-line commit message that argues every other
scoping decision with measurements does not mention it. Neither does the
header's own §"What it does not look at", which exists to list exclusions and
argues two of them at length.

So none of the three candidates above was the reason. **It was written, never
argued** — which is why it survived three breakages: there was nothing to
disagree with.

### 2. The measurement: four populations, not two

443 literals in `*.test.ts` name a declared prefix.

| | count |
|---|---|
| names nothing that resolves — fixture trees **and test vectors** | 183 |
| names a real DIRECTORY — layout assertions **and** corpus refs | 224 |
| names a real FILE — corpus references | 36 |

The bean proposed **fixture-versus-corpus**. That is under-resolved. Two
populations it did not anticipate are large and are neither:

- **Test vectors.** `check(["folio/paper/ch/x.qa.json"])` is path-shaped
  *data* passed to the function under test. `"@id": "library/who-anc-2016/
  nodes/rec-007"` is an **identifier and not a path at all**.
- **Layout assertions.** `expect(discoverLocalPackages(ROOT)["folio-assistant"])
  .toContain("src/skills")` pins what the declaration yields. It *has* to name
  it literally — that is the assertion.

A line-local fixture heuristic (is the literal joined against a variable
traced to `mkdtemp`?) scored **161 of 407** and misfiled the rest.

### 3. The fix: no heuristic, because the ratchet already does it — and better

The exemption was **removed, not narrowed**, and the fixture machinery was
never built. The existing per-file baseline separates the populations
*dynamically*:

- a fixture or vector names nothing, scores once into its file's baseline, and
  never moves again;
- a corpus reference **resolves**, so it is an `artefact` and is not counted —
  and the moment somebody relocates the file it names, it stops resolving, its
  file goes above baseline, and the gate fires.

That is the case a static heuristic **provably cannot** catch: a literal that
looks like a fixture path today *because the file it named was moved
yesterday*. Which is precisely `log-writer.test.ts`.

**36 test literals currently resolve** and are now protected — among them the
CRDM diagrams in `bpmn-translate.test.ts` (this bean's own relocation) and
`editing-hci-validation.bpmn` five times in `corpus-gate.test.ts`.

Falsified rather than assumed: renamed `crdm-deliver.bpmn`, watched
`bpmn-translate.test.ts` go 0 → 1 with the literal named, restored, watched the
gate go quiet.

### The cost, stated plainly

Baseline 18 → **425 across 98 files**; 407 of that is tests. The baseline's
`_comment` now says a test's entry is **usually not debt** and must not be
treated as a cleanup target, because the obvious next move — "425, let us
burn it down" — would be someone deleting fixture literals for nothing.

Two tests pin the property so the exclusion cannot come back silently: one
that tests are scanned at all, one that test literals naming real artefacts
dereference. Both are floors rather than counts.

Verification: `bun run gates` **56/56**; `bun test` **3770 pass, 0 fail**.

### Left open, deliberately

The **224** literals naming a real declared directory from a test. Recorded
debt on the same contract as source's original 152 — visible in one number,
can only go down. Burning it down is a separate argument and not this bean's.

### Revised within the hour — the count was still wrong

The design above ("no heuristic needed, the ratchet already does it") shipped
and was **wrong for a reason it took one merge to expose**. Merging `main`
brought a sibling's new `schemas/folio-dir.test.ts`, and the gate immediately
fired on it — with **two literals that were both entirely correct**: a test
vector inside a synthetic `directories: [{ path: "beans/" }]`, and a layout
assertion `expect(folioDir(root)).toBe(join(root, "folio"))` that *has* to name
`folio` because that is the assertion.

A test that builds a fixture tree names declared directories by necessity. So
counting test files fires on **every new test** — the *"a check that cries wolf
is a check somebody switches off"* failure this module's header names twice.
Reaching it by a different route does not make it a different failure.

**What replaced it: a witness list.** `resolves` in the baseline records every
literal that resolves today as `<file>::<literal>`. The gate fires when a
recorded witness stops resolving — relocation, and nothing else. Test files
leave the count ratchet entirely.

This also closed a defect in existing code. `declared-paths.test.ts` asserted
*"every literal admitted as an artefact dereferences"* over a list whose
membership test **is** `existsSync`. **Structurally vacuous — it could never
fail**, and worse than useless: relocate an artefact and the literal silently
leaves `artefacts` for `refused`, so the assertion goes on passing over a
shorter list, reporting health while the exact defect it names happens
underneath it. A committed witness list is what makes it assert something.

Falsified in **both** directions this time, which the first pass did not do:

| | result |
|---|---|
| renamed `crdm-deliver.bpmn` | witness named, **exit 1** |
| restored it | exit 0 |
| new test building a `mkdtemp` fixture | **silent** — the case the count got wrong |

**The source baseline never moved: still 18 across 11 files.** Scanning tests
cost no recorded debt at all; it bought 23 test witnesses (96 total). The
earlier claim of "425 across 98 files" was the count design and is obsolete.

Two guards pin it: tests never appear in `files`, and the witness list is
non-empty. Both are floors, and both open with a vacuity check — the failure
this bean just found twice.

Verification: `bun run gates` **56/56**; `bun test` **3785 pass, 0 fail**.
