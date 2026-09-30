---
# folio-assistant-r0tm
title: 'ADAPTERS CLOSURE (yj6r): ruling request — hoist adapters/document + adapters/paper across three instances; paper-first is FREE and the 15 was 16'
status: draft
type: task
priority: normal
created_at: 2026-09-30T11:06:49Z
updated_at: 2026-09-30T11:08:23Z
parent: folio-assistant-vke6
---

The eighth and last escape cluster on bean `yj6r` is the one that cannot be done
by halves. This is the ruling request for it. **Plan only — no source file in
this repository is changed by this work**, and every number below was re-derived
in this session rather than carried from the previous one.

## Context — what is being decided, in plain words

Two facts about the layout, stated so nothing below needs a file opened.

The repository is **pre-split**: five instances share one checkout as top-level
directories, and each declares what it depends on in its own `<instance>.json`.
Read out of those files today, the stack is

    bootstrap  <  bootstrap-tools  <  cat-harness  <  folio-assistant-core  <  folio-assistant-sci

`cat-harness` declares `needs: ["bootstrap"]`; `folio-assistant-core` declares
`needs: ["cat-harness"]`; `folio-assistant-sci` declares
`needs: ["folio-assistant-core"]`. Lower may not import higher. An **escape** is
a module under `cat-harness/` whose resolved relative import lands in an
instance above it. After the split each escape becomes a circular dependency
between two repositories.

`yj6r` has driven that count **15 → 12 → 8 → 5 → 2** across seven tranches, all
by the same remedy: the *consumer* moves up, the schema stays. The last two
escapes are one cluster —

    cat-harness/adapters/document/intake-records.ts        -> folio-assistant-core/schemas/dublin-core
    cat-harness/adapters/document/intake-records.test.ts   -> folio-assistant-core/schemas/dublin-core

— and the previous tranche stopped on them, recording that hoisting the
directory that holds them would *remove 2 escapes and create 15*.

**What differs depending on your answer:** whether ~20 files leave
`cat-harness/` for two other instances in the next few days, whether that
happens as one change or two, and whether the axis this bean exists to drive
reaches 0 at all — or is recorded as deliberately parked at 2 with the reason
written down.

---

## 1. The re-derived measurement — 2 is right, 15 is wrong, and the direction of the error matters

Method: every relative `import` / `export … from` / `import()` / `require()`
specifier under the five instance directories was resolved against the
filesystem and the resulting edge classified by the `needs` stack above. The
hoist was then **simulated** — the move applied to a path map in memory, every
specifier re-resolved against the new locations — rather than performed. Nothing
was written to the repository; the script lives in this session's scratchpad and
is thrown away with it.

| measurement | previous agent | re-derived here | verdict |
|---|---|---|---|
| escapes today | 2 | **2** | agrees |
| escapes created by hoisting `adapters/document/` alone | 15 | **16** | **previous count low by one** |
| escapes created by hoisting `adapters/paper/` alone | not measured | **0** | **not measured before, and it changes the plan** |
| escapes after the full closure | not stated | **0** | — |

### The created-escape count is 16, not 15

Breaking it down against the previous agent's own decomposition
(*"6 in adapters/paper/index.ts, 9 across 6 scripts/tests"*):

| source | edges | agrees? |
|---|---|---|
| `cat-harness/adapters/paper/index.ts` | 6 | yes |
| `cat-harness/adapters/paper/tools/lean.ts` | **1** | **missed** |
| `cat-harness/scripts/tests/` — 6 files | 9 | yes |
| **total created** | **16** | |

The missed edge is `adapters/paper/tools/lean.ts:22`,
`import { LEAN_DIR, REPO_ROOT } from "../../document/paths.js"`. It matters
beyond the arithmetic: it shows the paper adapter reaches into the document
adapter from a **tool**, not only from its class-extension in `index.ts`, so the
coupling is 7 edges from `adapters/paper/` rather than 6.

**One false positive worth naming, because any grep-based counter hits it.** A
naive count also reports two edges out of `cat-harness/src/builtin-adapters.ts`.
Both are inside that file's docblock, in a fenced code sample showing the
`switch` the file exists to replace. They are not imports. The real figure is 16
either way; I say it because the bean's own method would report 18 here and a
future re-derivation that lands on 18 is not a regression.

### The number that was never taken, and that reverses the conclusion

**Hoisting `adapters/paper/` on its own creates ZERO escapes. The axis stays at
2.**

The reason is the direction of the one coupling: `adapters/paper/` reaches out
of its own directory **only into `adapters/document/`** — 7 edges, and nothing
else, verified by listing every out-of-directory specifier in the tree. Move
`paper/` up to `folio-assistant-sci/` while `document/` stays in `cat-harness/`,
and all 7 become *downward* edges from sci into cat-harness. Downward is legal,
and legal transitively: `allowedFromNeeds` in
`cat-harness/schemas/layer-direction.ts` resolves a layer's permitted targets as
`{layer} ∪ ancestors(layer)`, so sci → cat-harness is allowed through
core → cat-harness without sci declaring cat-harness itself.

So the previous agent's closing sentence — ***"doing half of it is strictly
worse than doing none"*** — is **false for one of the two halves**. It is true
of the document half and false of the paper half, and nothing in the record
distinguished them, because only the document half was ever measured.

### The four states, measured

| state | escapes from `cat-harness` | landable? |
|---|---|---|
| today | **2** | (this is `main`) |
| hoist `document/` only | **16** | no — worse than today |
| hoist `paper/` only | **2** | **yes — no change to the axis** |
| hoist both + the 6 tests | **0** | yes |

---

## 2. Every file that moves, and why that instance

**20 files.** Each destination is grounded in a declaration that already exists
in the repository, not in a judgement made here.

### To `folio-assistant-sci/adapters/paper/` — 2 files

    cat-harness/adapters/paper/index.ts
    cat-harness/adapters/paper/tools/lean.ts

**Why sci.** Two independent declarations already say so.
`cat-harness/src/builtin-adapters.ts` declares the paper adapter
`layer: "sci"` in the `BUILTIN_ADAPTERS` table. And
`cat-harness/scripts/partition/instance-rules.ts` puts the prefix
`"adapters/paper/"` in its `repo: "sci"` block, alongside `latex/`,
`computations/` and `scripts/render-tex/`. Neither is my reading of what feels
science-shaped; both are existing machine-readable classifications that the
directory has simply never matched.

### To `folio-assistant-core/adapters/document/` — 12 files

    index.ts            intake-records.ts        intake-records.test.ts
    paths.ts            resolver.ts
    tools/_pipeline.ts  tools/audit.ts           tools/bib.ts
    tools/qa.ts         tools/render.ts          tools/transform.ts
    tools/validate.ts

**Why core.** Same two declarations, same shape: `BUILTIN_ADAPTERS` declares the
document adapter `layer: "core"`, and `instance-rules.ts` lists the prefix
`"adapters/document/"` in its `repo: "core"` block.

### To `folio-assistant-core/adapters/document/`, beside their subjects — 6 files

    cat-harness/scripts/tests/audit-tools.test.ts
    cat-harness/scripts/tests/chat-prompt-injection.test.ts
    cat-harness/scripts/tests/pipeline-resolution.test.ts
    cat-harness/scripts/tests/qa-tools.test.ts
    cat-harness/scripts/tests/transform-bib-tools.test.ts
    cat-harness/scripts/tests/validate-pipeline-guard.test.ts

**Why they move.** These are the 9 of the 16 created escapes. They move on the
rule the ingest/materialisation tranche set and the changeset tranche reused:
**a test does not leave its subject to make a count fall.** Placement follows
the convention those tranches established — a test sits *beside* its subject in
the target instance, not in a `tests/` subdirectory as under `cat-harness/`.

### A finding that is not arithmetic, and that you should weigh before saying yes

**`adapters/document/` is not purely core code.** Inside it:

- `tools/audit.ts`, `tools/qa.ts`, `tools/transform.ts` and `tools/validate.ts`
  each export a `registerPaper…Tools` function — four **sci-layer** registrars
  living in the document adapter's directory.
- `tools/render.ts`'s own header says it registers three document tools *and*
  three paper tools that "need TeX Live". `instance-rules.ts` already classifies
  the sibling `adapters/mcp-server/tools/render.ts` as `sci` for exactly that
  reason.
- `resolver.ts` exports a class named `PaperResolver`. Bean `zlmp` recorded this
  independently as *"classified core by its `adapters/document/` path while its
  contents are the paper resolver"*.

So hoisting the directory wholesale relocates five files' worth of paper/LaTeX
code **into the core layer**. That is not an escape — core is above sci's
consumers only in the sense that sci imports down into it, which is legal — but
it is a misfiling, and it is the same misfiling `yj6r` opened over. The plan
below does **not** try to fix it: splitting the four `registerPaper*` exports out
is a genuine code change with genuine risk, and folding it into a move is how a
move stops being reviewable. It is named so that a future reader does not
discover it and conclude the tranche was careless.

---

## 3. Every re-point

### Imports

- **7 specifiers inside `adapters/paper/`** (`../document/…` ×6 in `index.ts`,
  `../../document/paths.js` in `tools/lean.ts`) become paths reaching from
  `folio-assistant-sci/` into whichever instance holds `document/` at that
  moment — `cat-harness/` after step 1, `folio-assistant-core/` after step 2.
- **9 specifiers in the 6 test files**, rewritten to their new sibling paths.
- **No specifier inside `adapters/document/` changes**: its only out-of-instance
  import is the `dublin-core` one, which becomes an *inside-instance* import the
  moment the directory lands in core, and the rest are relative to files moving
  with it. This is the whole point of the move.

### `BUILTIN_ADAPTERS` — the re-point with a behaviour change hiding in it

`cat-harness/src/builtin-adapters.ts` holds two `module` strings,
`"adapters/paper/index.ts"` and `"adapters/document/index.ts"`, resolved by
**variable path** against `ROOT = resolve(import.meta.dir, "..")` — that is,
against `cat-harness/`. They become

    ../folio-assistant-sci/adapters/paper/index.ts
    ../folio-assistant-core/adapters/document/index.ts

Three things follow, and the third is the one to notice.

1. Because the specifier is a variable, **no static-import gate can see these
   edges** — not `check:partition`, not `check:reference-direction`, not the
   counter I used above. They are real upward references that every measurement
   in this thread is structurally blind to.
2. They are also exactly what the file was designed for. Its docblock: *"After
   the split that import does not resolve in a core-only checkout, and the
   module fails to load before any of its own error handling runs."* The
   `existsSync` probe plus the honest `fallbackReason` already handle an absent
   adapter. The move makes the declaration finally describe reality.
3. **`init-folio.ts:199` composes the path instead of looking it up:**
   `` `./${platformDir(assistant)}/adapters/${o.contentType}/index.ts` ``. After
   the move `document` and `paper` are in *different instances*, so one composed
   template cannot produce both. Every folio scaffolded after the move would
   write an `adapterModule` pointing at a path that does not exist.
   `init-folio.test.ts:216` pins the substring `adapters/document/index.ts`, so
   the test passes either way — **the gate does not catch this.** The fix is to
   read the destination from `BUILTIN_ADAPTERS` rather than compose it, which is
   the same one-source-of-truth argument the file already makes for itself.

### Instance declarations — two new directory entries

Both receiving instances gain one entry each, modelled on core's existing
`core-scripts` entry:

```jsonc
// folio-assistant-core.json           // folio-assistant-sci.json
{ "id": "core-adapters",               { "id": "sci-adapters",
  "path": "adapters/",                   "path": "adapters/",
  "dependents": "skip",                  "dependents": "skip",
  "description": "…",                    "description": "…",
  "graphKinds": ["code"] }               "graphKinds": ["code"] }
```

**On `holds` and `renderable`:** these are **not** fields of a directory entry.
They are fields of the **graph kind**, declared once in
`cat-harness/schemas/graph-kind-registry.ts`. The `code` kind is already
registered there with `renderable: false, holds: "content"`, and its comment
gives the reason for each: code is authored with an intention and you would
re-author rather than regenerate it (`content`), and it is not wired to the site
build as pages (`renderable: false`). So no kind is being invented and nothing
"has not decided" — the entries above are complete as written. Both instances
may use the kind: it is owned by `cat-harness`, which is below both.

`cat-harness`'s own `cat-harness-adapters` entry **stays**, and stays honest:
`adapters/` still holds `mcp-server/`, `manifest-entries.ts`, `bib-mcp-cli.py`
and `README.md` after both subdirectories leave, and `mcp-server/` imports
neither of them.

### Partition rules

The `"adapters/paper/"` prefix in the `sci` block and `"adapters/document/"` in
the `core` block stop matching anything — the scan root is `cat-harness/`. Per
the practice the three previous tranches set: **remove the dead entry, keep its
reasoning in place as a note**, because a rule naming a path its own scan can no
longer see fires on nothing while reading as an adjudication.

### Documentation, and the translations that must move with it

`adapters/document/` and `adapters/paper/` are named by path in
`harness.config.example.json` and in `docs/installation.md` +
`docs/architecture.md` **in four languages** (en, es, fr, ru), plus
`docs/guides/new-content-type.md` and `docs/guides/writing-a-document.md`. Also
`cat-harness/content/docs/guides-writing-a-document/where-things-are.md`.

Two workflows (`publish.yml`, `discoverability-docs.yml`) run TypeDoc over
`adapters/paper/schemas/` — **a directory that does not exist**. Those
references are already dead and are not this move's to fix; noted so the next
reader does not mistake them for a break this caused.

---

## 4. What breaks, in what order

### The biggest risk, and it is measured rather than feared

**`tsconfig.json`'s `include` list is per-directory, and it does not name the
destinations.** It covers `cat-harness/adapters/**/*.ts` and, of core, only
`folio-assistant-core/schemas/**/*.ts`. It names nothing under
`folio-assistant-sci/` at all.

Measured with `tsc --listFiles` on this checkout:

    files under cat-harness/adapters/{document,paper}/ in the typecheck program   14 of 14

All fourteen. After the move, unless `include` gains
`folio-assistant-core/adapters/**/*.ts` and
`folio-assistant-sci/adapters/**/*.ts` **in the same commit**,
`bun run typecheck` goes **green while covering fourteen fewer files** — and no
gate reports a shrinking program. That is precisely the failure this very
tsconfig's own comment block is a monument to: *"A green `tsc` therefore said
nothing about most of the pipeline."*

**This has already happened, three times, unreported.** Also measured here:

    .ts files now under folio-assistant-core/scripts/              31
    of those in the typecheck program                               2

Twenty-nine files that the earlier `yj6r` tranches moved up are outside the
typecheck program today. The two that are in it
(`glossary-extract.ts`, `glossary-page.ts`) are there only because something in
`cat-harness/` still imports them transitively. No tranche reported this,
because the gate that would report it is the one that stopped looking. It is
**not** this plan's to fix, and it is the strongest single argument for doing
the `include` edit in the same commit as the move rather than as a follow-up.

### Gate-by-gate

| gate | step 1 (paper → sci) | step 2 (document + tests → core) |
|---|---|---|
| escape count (this bean's axis) | 2 → **2**, unchanged | 2 → **0** |
| `check:partition` | 0 → 0 (scan root is `cat-harness/`; blind to both) | 0 → 0 |
| `typecheck` | red until `include` gains the sci path — **in the same commit** | red until `include` gains the core path — same commit |
| `bun test` | passes: `bunfig.toml` preloads and discovers by pattern, not by directory list | same |
| `check:undeclared-files` | **red until `folio-assistant-sci.json` declares `adapters/`** — same commit | same, for core |
| `check:code-accounting` | shifts between instances; green today, no threshold crossed | same |
| `root-scan-census` | **instance-scoped.** cat-harness loses rows it will not regain, and core/sci run no equivalent census, so those rows are counted **nowhere** | same |
| `check:reference-direction` | **already exits 1 on `main`**, unrelated to this. Its prose-occurrence count will rise, because the move must write the destination instance's name into `cat-harness/` files to say where the code went | same |
| `readme:sync:check`, `bun run readme:subgraphs` | regenerate — the subgraph READMEs enumerate files under their directory | same |

The `root-scan-census` row is the same coverage loss the ingest/materialisation
tranche reported at 68 → 67 and the last-four tranche at 66 → 65. **Three times
now** makes it a property of moving anything up, not an accident of one file —
and it deserves a bean of its own rather than a third footnote.

### One PR or a sequence?

**A sequence of two, and the second is the only one that has to be atomic.**

- **Step 1 — `adapters/paper/` → `folio-assistant-sci/adapters/paper/`.**
  2 files. Leaves the escape axis at **2, exactly where `main` is now.** Every
  gate green, provided `tsconfig.include` and `folio-assistant-sci.json` are
  edited in the same commit. Independently reviewable, independently revertable,
  and it lands the sci half of the three-instance move with nothing staked on
  step 2 ever happening.
- **Step 2 — `adapters/document/` + its 6 tests → `folio-assistant-core/`.**
  18 files. Takes the axis **2 → 0**. This one *is* atomic: the directory, the
  tests, the declaration, the tsconfig entry and the `init-folio` re-point ship
  together or the tree does not typecheck.

`continual-progress` wants commits pushed early and is satisfied: step 1 is a
genuinely green, genuinely landable increment. **There is no state in which the
axis reads 15 or 16 unless the document half is done first** — which this
ordering exists to avoid.

---

## 5. What I could not determine

Reported as undetermined, not as clean.

1. **Whether `folio-assistant-sci` can host executable TypeScript without other
   consequences.** It declares `library/`, `skills/voices/`, `methodologies/`
   and `test/results/` — no code directory — and holds exactly one `.ts` file
   today (`contributions.ts`, which `check:code-accounting` already reports as
   "accounted for by nothing"). Step 1 makes sci the first instance in that
   position. I did not find a gate that forbids it; **I also did not find one
   that confirms it is fine.**
2. **The `BUILTIN_ADAPTERS` variable-path edges are unmeasurable by any gate
   here, including mine.** After the move, `cat-harness/` holds two string
   literals reaching up into two instances above it. Whether that counts as an
   escape is a question about the *axis definition*, and it is not settled
   anywhere I could find.
3. **Whether `cat-harness → bootstrap-tools` is itself an escape.** The same
   measurement found **20** resolved imports from `cat-harness/` into
   `bootstrap-tools/`, and `cat-harness` declares `needs: ["bootstrap"]` — not
   `bootstrap-tools`. If those are legal, something treats the two as one layer,
   and I did not find what. If they are not, this axis reads 22, not 2. Out of
   scope for this ruling; flagged because it would change the headline number.
4. **I did not run `bun run gates`.** This is a plan-only session with no source
   change to gate. Every gate verdict in the table above is derived from reading
   the gate's scope, not from running it against a performed move.
5. **Whether the 6 tests belong beside their subjects or in a core `test/`
   tree.** I followed the convention the previous tranches set. That convention
   was set for `scripts/`, and an `adapters/` directory may want a different one.

---

## 6. Recommendation

**Do step 1 now, and step 2 next, as two PRs.**

The reason is not a preference between layouts. It is that the fact which
justified stopping — *"doing half of it is strictly worse than doing none"* —
turns out to be true of one half and false of the other, and the false half is
**two files that cost nothing on the axis**. Landing it converts an
all-or-nothing three-instance move into an ordinary two-step one, with a real
green checkpoint in the middle that a reviewer can look at on its own.

The three things that must be in the *same commit* as each move, because each
fails silently rather than loudly: the `tsconfig.json` `include` entry, the
`<instance>.json` `adapters/` declaration, and (step 2 only) the `init-folio.ts`
re-point.

### The options, compared

| | what happens | axis after | risk | reversible? |
|---|---|---|---|---|
| **A — two PRs, paper then document** *(recommended)* | step 1 lands 2 files, axis unchanged at 2; step 2 lands 18, axis 0 | **0** | lowest: the only atomic part is step 2, and step 1 is revertable alone | yes, per step |
| **B — one PR, whole closure** | all 20 files, one review | **0** | one 20-file diff across three instances; a revert takes the whole thing | yes, as one unit |
| **C — step 1 only, park step 2** | paper → sci lands; `document/` stays put | **2** | lowest of all, but the bean's "reads 0" box stays unearned | yes |
| **D — do nothing; record the parking** | nothing moves; `yj6r`'s box is marked parked with the 16/0 measurement | **2** | no code risk; the misfiling and the 3× unreported census loss stay | n/a |

**If you say nothing, I do D** — record the corrected measurement (16 not 15,
and paper-first is free) on the bean and the issue, and move nothing. That is
the safe default because every option but D moves files, and this session was
scoped to plan only.

What does **not** differ between A, B and C: no schema moves down into
`cat-harness/schemas/`. The cheap fix that `yj6r` §"The cheap fix works and is
WRONG" forbids is not reachable from any of these.

### The question

**Which of A, B, C or D should the next session carry out?**



---

## Where this was put to the owner

Posted as a comment on issue #1558, the escape-tranche issue, 2026-09-30:
<https://github.com/litlfred/folio-assistant/issues/1558#issuecomment-5909945678>.
The comment and this bean carry the same text; the bean exists so the ruling
request survives the issue thread.

Parent epic: `folio-assistant-vke6` (SPLIT). Sibling: `folio-assistant-yj6r`,
whose last unticked box this would earn.

**Status is `draft` deliberately** — nothing is claimed and no work is in
flight. It becomes `todo` when the owner picks A, B or C, and `scrapped` with
the reason recorded if they pick D.
