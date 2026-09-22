---
# folio-assistant-jijc
title: DECLARATION_FILENAME exists and 21 non-test call sites bypass it, so the REPLACE ruling is a 121-file sweep instead of one constant
status: completed
type: bug
priority: normal
created_at: 2026-09-21T07:14:08Z
updated_at: 2026-09-22T07:23:02Z
parent: folio-assistant-vke6
---


Opened 2026-09-21 by session_01AYHimvYMmf8h8e9fFN6dW5, as the separable half of
the owner's REPLACE ruling on `b5f0` — the half that is **correct under either
filename**, so it cannot be wasted by a later change of mind and needs no
further decision.

## Measured before starting, 2026-09-21

| | |
|---|---|
| declarations on disk | 12 (a 13th, `cat-harness/docs/_data/harness.json`, is generated Jekyll data — **not** a declaration) |
| TypeScript files naming the string | 121 (357 occurrences) |
| **non-test bypasses** | **20** across 10 files — 18 inside `cat-harness/`, 2 outside it |
| test-fixture occurrences | ~100 |
| workflow `.yml` files | 2 |

Two independent methods agreed on 20: a grep over double-quoted literals, and
the checker written for this bean.

## The check came FIRST, and that was the point

The substitution is mechanical and therefore not the interesting half. Without
a gate it regresses the first time anyone types the filename again — so
`check:declaration-filename` was written, **watched go red on all 20**, and only
then were they fixed.

## The rule, and the four classes it refuses to fail on

> A quoted string literal whose **whole value** is the declaration filename, in
> a non-test `.ts` file, outside the constant's own definition.

Whole-value is what keeps it free of judgement: a path is built by
`join(root, "harness.json")`, where the filename is the entire string. Prose
mentioning the file is a sentence, never a whole-string literal.

| counted, not failed | why |
|---|---|
| prose in messages and doc comments | a rename REWORDS these. Failing them would demand error text be assembled from constants, which nothing asks for |
| test fixtures | **a judgement, not a measurement** — see below |
| template literals building a path | 0 on this corpus; implemented and proven against a planted case anyway |
| call sites outside `cat-harness/` | 2, and fixing them needs a boundary decision — see below |

## Two things the work turned up that are worth more than the refactor

**1. `docs/_data/harness.json` is a DIFFERENT FILE.** Found because the first
draft of the template rule accepted a bare `/` before the filename and reported
`` `docs/_data/harness.json is stale.` `` as construction. It is Jekyll data,
not an instance declaration, and **it must not be renamed** under the REPLACE
ruling. A hand-run sweep over the basename would take it, which is exactly how
a rename breaks a site build. The rule narrowed to interpolation-only and the
class went back to zero; the trap is now a named test.

**2. `instanceConfigFilename(name)` ALREADY EXISTS** in
`schemas/harness-config.ts`, returning `` `${name}.config.json` `` — the exact
REPLACE target — alongside `resolveHarnessConfigPath()` and a
`check:instance-config` gate. So REPLACE is not starting from nothing: the
naming function, the resolver and a gate are built. `check-undeclared-files.ts`
now imports **both** `DECLARATION_FILENAME` and `instanceConfigFilename` — the
before and after of the ruling, side by side in one import.

## The two classes left open, deliberately

**Cross-instance (2 sites, `folio-assistant-core/schemas/library-ref.ts`).**
`folio-assistant-core` imports **nothing** from `cat-harness` today. Using the
constant there would create this repository's first cross-instance code
dependency; giving core its own copy would make two constants, which is this
bean's own defect one layer up. That is `vke6`'s decision, not a refactor's.
Counted **with their locations**, never silently excluded — a count alone
cannot be acted on, and excluding them would be the `dh4f` shape.

**Test fixtures (~100).** A fixture writing `join(root, "harness.json")` is
constructing the file the code under test looks for. Route it through the
constant and the test passes **vacuously** after a rename — the fixture moves
with the code and nobody learns the contract changed. Pinning is defensible;
so is ~100 hand-edits being unacceptable. This is a judgement and it is left
as one rather than decided silently by a checker.

## Verification

Gate red on 20 → green. `bun run typecheck` clean. 11 tests, of which
**5 go red when both halves of the rule are stubbed to `false` and 5 stay
green** — the five that stay green are the false-positive guards, one per
class above. The ratio was RUN, not estimated: an earlier draft of the test
header said "three".

## Done when

- [x] `check:declaration-filename` reports a non-test call site that builds the
      declaration path from a literal, with prose, fixtures, template
      construction and cross-instance sites each classified rather than lumped
- [x] The bypasses inside `cat-harness/` are routed through the constant
- [x] Wired into `code-quality-gates.yml` so it runs in CI
- [x] **Owner ruled 2026-09-21:** the 2 cross-instance sites import the
      constant through the dependency `folio-assistant-core` ALREADY declared
      (`"needs": ["cat-harness"]`) — nothing new was created
- [x] **Owner ruled 2026-09-21:** the test fixtures are migrated, not pinned —
      112 sites across 36 files, 15 of them object keys
- [x] **Done 2026-09-21.** The workflow `.yml` files are CLASSIFIED, not
      counted. *The second clause — "this check has no opinion on them" — was
      the defect rather than a scope note, so it is corrected here rather than
      ticked as written.*

*Ticked IN PLACE 2026-09-21. The rulings and what they cost are in the section
below; this list is the one a reader and every tool consult, so it is the one
that has to be true. An appended second copy is the `shadow-checklist` defect
`sfhr` shipped a detector for — and that detector caught this bean while the
copy was being written, which is the third time this session a check I built
has found my own work.*

*Issue link, recorded on creation.* **[#669](https://github.com/litlfred/folio-assistant/issues/669)** — shipped in [PR #657](https://github.com/litlfred/folio-assistant/pull/657).

Written in the same turn the issue was opened, rather than later. `oh78` exists
because the session working it opened four issues from beans and carried none
of the links back; this bean is its author's first chance to not repeat that,
and `check:bean-issue-links` is the check that would otherwise have found it.

---

## OWNER RULINGS, 2026-09-21 — both open classes closed, both AGAINST the recommendation

Asked with the trade-offs stated. The owner took the other option on both, and
both are now done.

### 1. Test fixtures — **migrate**, not pin

112 sites across 36 files. My recommendation was to pin them, on the argument
that a migrated fixture passes *vacuously* after a rename. The owner ruled
migrate; the argument is recorded here rather than re-litigated, because it
remains the thing to check if a future rename lands green and nobody believes
it.

**15 of the 112 were object KEYS**, not values —
`repo({ "harness.json": '{"name":"x"}' })` in `content-type.test.ts` — and
became computed keys, `[DECLARATION_FILENAME]:`. A value-only replace would
have produced a syntax error on all 15.

### 2. Cross-instance — **import it**, and the dependency was ALREADY declared

I framed this as "core imports nothing from `cat-harness`, so this creates the
first cross-instance dependency". **That framing was wrong and the declaration
says so**: `folio-assistant-core/harness.json` already carries

```json
"needs": ["cat-harness"]
```

and `partition/instance-rules.ts` already states the direction — *"core reading
harness is downward"*. So nothing was created. A declared dependency existed
and the code simply was not using it. Both sites import the constant now, and
`check:partition` reports **0 wrong-direction edges, 0 unassigned**.

Worth keeping: *"nothing imports it"* and *"nothing may import it"* are
different claims, and I reported the first as if it established the second.

## Two defects this work produced, both caught by the repo's own gates

**The migration script mistook a TERNARY COLON for an object key.** The regex
was `"harness\.json"(\s*:)`, and

```ts
entry.name === "harness.json" ? "harness.json" : null
```

has a `:` after the second literal. It became `[DECLARATION_FILENAME]` — an
array — and `tsc` produced four type errors on it. The typechecker caught what
the regex could not; the same rule with no typed consumer would have shipped.

**A blanket migration cannot tell a literal that IS the code from a literal
DESCRIBING code.** `check-declaration-filename.test.ts` feeds fixture *source
text* to the checker. Rewriting those literals left every detection test
passing while asserting nothing — the checker looks for a string the fixtures
no longer contained. Reverted, and the file now carries a header saying why its
literals must stay literal.

## The gate paid for itself before it was merged

Merging 47 commits of `main` in brought **two new bypasses** —
`harness-tiles.ts:205` and `compose-docs.ts:113` — written by other sessions
while this bean was being worked. Exactly the regression the check exists to
stop, caught within ten minutes of the merge. Both fixed.

---

## The workflow half, 2026-09-21 — the count was hiding two different things

**Re-measured on `main` at `0fc29b9`** — 3 occurrences in 3 files. *This bean's
own header says 2*, which is why it was measured again rather than quoted:

| occurrence | verdict |
|---|---|
| `docs-site.yml:284` — *"the `stub` in harness.json"* | **stale.** The stub is in `cat-harness/cat-harness.json` (`"stub": "cat-harness"`, read) |
| `health-check.yml:7` — *"Declared in `harness.json` as the `health` graph"* | **stale.** That graph is entry `health` → `test/health/results/`, in the same file |
| `code-quality-gates.yml:605` — `docs/_data/harness.json` | **correct.** Jekyll's data file, still on disk, must NOT be renamed |

All three are comments. So a bare count of **3** told a future rename to change
three things, one of which must never change.

### The defect was asymmetric rigour inside one checker

The TypeScript side classifies with care — whole-value literal, prose, fixture,
template — and argues in its own header that *"a rename REWORDS these"*. The
YAML side had **one bucket**: does the file contain the string. *"Cannot import
a constant"* was doing duty as *"cannot be wrong"*, and those are different
claims.

**Falsified before anything was written.** A real step planted in
`health-check.yml`:

```yaml
- name: PLANTED bypass
  run: cat cat-harness/harness.json
```

— a step reading a file that does not exist — produced `✓ no call site names
the retired harness.json`, **exit 0**. And the count stayed at 3, because it
counted FILES: a second occurrence in an already-listed file did not move the
number either.

`classifyWorkflowLine` now gives it the same three-way split, and a `use`
FAILS. With the plant in place it exits 1 and names the line; with the plant
removed: workflow prose **0**, jekyll **1**.

### The second defect, found by writing the fix for the first

**`cat-harness.json` contains `harness.json`.** The corrected `docs-site.yml`
comment names `cat-harness/cat-harness.json` — and the naive `indexOf`
classifier counted the correction as the defect.

The TypeScript side was never exposed to this: its whole-value rule tests
`"harness.json"` *with the quotes*, so `"cat-harness.json"` never matched. The
YAML side needed the equivalent, and `boundedIndexOf` is it — a match must not
be preceded by a filename character. The same collision class as the
`docs/_data` rule this file already carried, one character further left.

Guarded in both directions: the current declaration must not match, and the
retired one must still.

### Still open on this bean — nothing

All six Done-whens are ticked. The two the owner ruled on (fixtures migrated,
cross-instance imports) keep the arguments against them recorded above, because
both remain the thing to check if a future rename lands green and nobody
believes it.

### Found alongside, NOT fixed here

`AGENTS.md` says the health graph is *"declared in `folio-assistant.config.json`"*
— wrong on the file family (`.config.json` is the folio config; the declaration
is `<instance>/<instance>.json`) and on the instance (it is `cat-harness`).
Queued as its own bean rather than pivoted to.

## NOT closed 2026-09-21 — its own gate reports an open judgement on it

Swept up by `fkjo` as an in-progress bean with all six boxes ticked, and
re-derived rather than closed. `check:declaration-filename` is real, is wired
at `code-quality-gates.yml:636`, and passes with *"no call site names the
retired `harness.json`"*.

But its own output carries:

    test fixtures      11  (an open judgement on bean `jijc`, not a finding)

while box 5 records the owner's ruling that *"the test fixtures are migrated,
not pinned — 112 sites across 36 files"*. The gate and the box disagree about
whether anything is left, and the gate is the side that re-derives itself
every run.

**Left open deliberately.** Either the 11 are the remainder of the 112 and the
box was ticked early, or they are a residue the ruling permits and the gate's
wording is stale. Both are one measurement away and neither is safe to assume
— closing on the ticks is exactly what `fkjo` exists to stop.

## Closed on re-derived evidence, 2026-09-22

Every `## Done when` item was ticked while the bean stayed open. Re-derived
against `main` at `2ce66fc`: **`check:declaration-filename` is declared in
`package.json` and wired into `code-quality-gates.yml`**, which is items 1 and
3; the owner's two rulings and the `.yml` classification are recorded in the
body above.

Closed by **evidence, not authorship** — `bean-coordination` §"Closing a bean
whose work has already landed".
