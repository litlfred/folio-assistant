---
# folio-assistant-b5f0
title: 'INSTANTIATION: what it means to instantiate a harness — the config file, the slot, and the process that cannot be started'
status: todo
type: task
created_at: 2026-09-20T15:23:54Z
updated_at: 2026-09-20T15:23:54Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-20, across three messages:

> "migration to cat-harness.config.json as an instance declaration in root.
> also need bootstrap.config.json to declare its instance data upon
> initialization. this should be part of ALL harness initializations. (not
> dependency, but initiation = create UI/start workflow beans todos, install
> directories etc. to a working state). this is a 'Working KG' or active or
> 'Dynamic'. otherwise it is static KG like in library/ (+/- if assets are
> materialized, KG regenerated from sources)."

> "instantiating a harness means that you get a slot in the LHS navbar = set of
> controls on folio"

> "integrate/consolidate/x-ref"

**This bean is the integration point, not a fifth proposal.** Three of the four
parts are already beaned; the value here is the seam between them and the two
things nobody has written down. Every claim below was measured 2026-09-20
against `origin/main` at `dc78e7ccf`, and the measurement is given so the next
reader can re-run it rather than trust it.

## What already exists, per part

| the ask | where it already lives | state |
|---|---|---|
| `cat-harness.config.json` at root | **`zkgs`**, and it is RULED | ruling recorded, blocked on #477 |
| a slot on instantiation | **`nvbr`**, **`603s`**; seam built in `sticky-contribution.ts` | seam exists, navbar does not |
| the initialization process | `bootstrap/workflows/initialize-harness.bpmn` | **exists and is unreachable** — `7u3g` |
| `bootstrap.config.json` | nothing | **new**, and see the roast below |
| Working/Dynamic vs static KG | `holds: content \| context \| state` | **already an axis**, under another name |

## 1. The rename is ruled, and today's phrasing says something DIFFERENT

`zkgs` carries the ruling verbatim — *"mv to root at `cat-harness.config.json`
as will all instantiated instances (not just materialized KGs). `root/` is where
instantiation is tracked."* — and generalises it to a convention:
**`<declared instance name>.config.json` at the instantiation root.**

But `zkgs` ruled on `harness.config.json`, **the CONFIG**. Today's wording is
*"`cat-harness.config.json` as an **instance declaration** in root"*. Those are
two different files and both are at the root right now:

    harness.json          the DECLARATION — directories, graphs, dependents,
                          assets, stickies.        schemas/cat-harness.ts
    harness.config.json   the CONFIG — contentType, adapter, feedbackDir,
                          viewer, readme.          schemas/harness-config.ts

So this needs settling before anyone writes code, because the two answers
diverge immediately:

- **If they MERGE into one file**, the separation is undone. It is load-bearing
  and recent: on 2026-09-20 qou needed BOTH — `harness.json` to say the folio
  tree is at `content/`, `harness.config.json` to say the folio is a `paper` —
  and the file that shipped carries a `_comment` distinguishing them because
  the distinction was not obvious even to the agent writing it.
- **If they STAY SEPARATE**, then `cat-harness.config.json` beside `harness.json`
  is WORSE naming than today: the one suffixed `.config` is the config, and the
  one with no suffix is the declaration. Nothing in either name says which is
  which. `<name>.json` + `<name>.config.json` would at least pair them.

The ruling does not decide this, because the question had not been asked when it
was made.

## 2. `bootstrap.config.json` is mostly `zkgs`'s convention, plus one real problem

Bootstrap is **already an instance**: `bootstrap/harness.json` declares
`name: "bootstrap"`, two directories, two assets and a sticky. Under `zkgs`'s
convention its root file is `bootstrap.config.json` **by derivation** — nothing
new needs inventing, which is the consolidation this bean exists to record.

What IS new is *"declare its instance data **upon initialization**"*. That is a
file describing **what initialization did**, and this repository has a hard axis
for that. Measured from `schemas/cat-harness.ts`:

    beans   state      todos  state      uploads  state    health  state
    library content    voices content     tools   content  schemas content
    interaction        context

`AGENTS.md`: *"a step writing to a `context` graph is a defect rather than an
update."* A config is read at start. A record of what a process did is `state`.
**A `.config.json` written by the initializer is state wearing a config's name**,
and the convention would spread that naming to every instance at once.

Either it is two files (declared config, and an instantiation record in a
`state` graph), or the convention has to say that `<name>.config.json` is
process-written — which contradicts what `.config` means everywhere else here.

## 3. The process you want to make universal CANNOT BE STARTED

This is the one that decides sequencing, and it is measured, not argued.

`bootstrap/workflows/initialize-harness.bpmn` exists and is declared the single
entry point. It is also invisible to the engine — bean **`7u3g`**: `workflowDirs`
composes `<kgdir>/workflows`, i.e. `bootstrap/processes/`, which does not
exist; the diagrams sit at `bootstrap/workflows/`, a **sibling**. So
`workflow_list` and `workflow_start` cannot see it, and `kg:audit` has never
written a sidecar for it.

And `folio_init` installs no workflow at all: `grep -c '\.github/workflows'
cat-harness/scripts/init-folio.ts` → **0** (measured for `52dz`).

> **"Part of ALL harness initializations" is not implementable today.** Nothing
> can list the process, and nothing installs it. `7u3g` is a hard prerequisite,
> not a related item.

## 4. The process is itself under-documented — by this repo's own rule

Measured on `initialize-harness.bpmn`:

    activities   3
    folio:skill  8      ✓
    folio:bean   0      ✗
    folio:tool   0

`skills/workflow/bpmn-processes.md:30` requires **both**: the skill that
implements a step, and `<folio:bean>` *"where it touches the work plan"*. The
owner's own description of initiation is *"create UI/start workflow beans
todos"* — it touches the work plan by definition, and carries no bean marker.

Whatever else lands, **the entry-point process gets its `<folio:bean>` markers
and a tool declaration before it is made mandatory.** A mandatory step that the
audit has never seen is a mandate with no enforcement.

## 5. "Working/Dynamic KG vs static KG" is a THIRD name for an existing axis

`holds` already partitions exactly this: `content` (a process produces it),
`context` (reads, never writes), `state` (writes as it runs). "Working / active /
dynamic" is `state`. "Static like `library/`" is — measured — **`content`, not a
separate static kind.**

The parenthetical is the tell: *"(+/- if assets are materialized, KG regenerated
from sources)"*. **A KG regenerated from sources is not static, it is DERIVED.**
So the real question has three answers, not two:

| | rebuildable? | deleting it costs |
|---|---|---|
| authored | no | the work |
| derived (regenerated from sources) | **yes** | a rebuild |
| runtime state | no | the record, irrecoverably |

That third column is what `deletion-requires-confirmation` turns on, and
`holds` does **not** currently capture it: `library` and `voices` are both
`content` whether or not they were generated. **If anything is missing from the
model it is `derived`, not `dynamic`** — and adding "dynamic/static" on top of
`holds` gives two vocabularies for one question, which the `AGENTS.md` banner
names as the failure mode: *"a rule stated in two places is a rule free to
drift."*

## 6. The slot: the seam is built, the navbar is not, and nothing guarantees it

`schemas/sticky-contribution.ts` already inverts ownership exactly as asked —
*"a layer owns what it can serve, and the layer above does not enumerate it"* —
and `bootstrap/harness.json` declares its own card. So *"instantiating gives you
a slot"* is **already true for stickies**.

Two gaps, both measured:

- `grep -rln "navbar" cat-harness/schemas cat-harness/src` → **nothing**. There
  is no navbar mechanism; `nvbr` and `603s` are the beans for it.
- The **root** instance's `harness.json` declares **no** `stickies`. So the seam
  is optional, and instantiation does not currently *produce* a slot — it merely
  permits one. Making the slot a consequence of instantiating is the actual ask
  and is not what the code does.

## Done when

- [ ] **owner:** does `cat-harness.config.json` REPLACE `harness.json`, or sit
      beside it? (§1 — the ruling predates the question, and the two answers
      diverge immediately)
- [ ] **owner:** is `<name>.config.json` process-WRITTEN at initialization? If
      yes, it is `state`, and the naming needs to say so (§2)
- [ ] `7u3g` fixed — the entry-point process is listable — BEFORE initialization
      is made mandatory anywhere (§3)
- [ ] `initialize-harness.bpmn` carries `<folio:bean>` on every activity that
      touches the work plan, and its tools are declared (§4)
- [ ] settle whether the missing axis is `derived` rather than `dynamic` (§5)
- [ ] instantiation PRODUCES a slot rather than permitting one; the root
      instance declares its own (§6, with `nvbr`/`603s`)

## Cross-references

- **`zkgs`** — the ruling and the `<name>.config.json` convention; blocked on #477
- **`7u3g`** — bootstrap/workflows scanned by nothing. **Prerequisite.**
- **`nvbr`**, **`603s`** — the LHS navbar
- **`52dz`** — `folio_init` writes no workflows (measured there)
- **`zzmr`** — parent epic, the KG's own structure

## How this bean was produced — the method, so it can be repeated or faulted

Recorded on the owner's instruction (*"self-document how you did"*), because a
review of five claims is only as good as the way they were obtained.

**Every claim above is a command, not a memory.** The rule this session kept
re-learning is that the repository contradicts a confident reading roughly as
often as it confirms one — three times in the preceding hours, each time in the
direction of "the thing you assume is already half-built". So the order was:

1. **Look for prior art before forming an opinion.**
   `grep -rn "cat-harness.config"` found `zkgs` **carrying the owner's own
   ruling**, which turned the first part of the request from a proposal into a
   consolidation. Had the roast been written first, it would have argued
   against a decision already made.
2. **Read the artefact, not its name.** `bootstrap/` was assumed to be a
   directory of skills. `find bootstrap -type f` showed `bootstrap/harness.json`
   — bootstrap is *already an instance*, which is what makes
   `bootstrap.config.json` a derivation rather than an invention.
3. **Count, do not characterise.** "Is the process documented?" became
   `grep -coE '<folio:skill'` vs `<folio:bean>` → **8 and 0**. A sentence
   ("mostly documented") would have hidden the whole finding.
4. **Check the negative.** `grep -rln "navbar"` returning *nothing* is a load-
   bearing result: it says the slot mechanism does not exist, which no positive
   search would have established.
5. **Re-read the owner's words against the code's words.** "instance
   declaration" versus `zkgs`'s "config" is a two-word difference that changes
   which file is renamed. That is §1, and it came from putting the quote and
   the schema side by side rather than paraphrasing either.

**One measurement failed and is worth recording.** The first attempt to read
`holds` per graph kind used a single regex over `cat-harness.ts` and printed
*nothing* — an empty result that could have been read as "no graph declares
`holds`". It was a broken pattern, not a finding. The second attempt keyed off
the declaration block and returned nine rows. **An empty grep is a claim that
needs its own check**, which is the same rule this repository applies to a
health report that goes quiet.

**What was deliberately NOT done:** no file was renamed, no workflow edited, no
`<folio:bean>` marker added. The request was to bean and to roast. Five of the
six sections end in an owner question precisely because the answers change the
code, and `b5f0` §1 in particular cannot be implemented in either direction
without a ruling that does not yet exist.

## CORRECTION to §3, 2026-09-20 — `7u3g` is SCRAPPED, and §3 rests on it

§3 called `7u3g` *"a hard prerequisite, not a related item"* and said the
initialization process *"cannot be started"* because nothing can list it.
**`7u3g` was scrapped on `main` the same day** (PR #541), and the scrap is
right.

There is no bootstrap blind spot. `bootstrap/` is a **separate instance**, and
`scripts/tests/instance-graph-isolation.test.ts` enforces that a nested
instance's graph stays out of the first's — written against a real leak live on
2026-09-19, when `findBpmnDirs` walked the tree and
`_kg/folio-assistant.jsonld` carried **88** references to
`Process_InitializeHarness`. The root NOT seeing bootstrap's diagrams is the
invariant working, not a defect.

So §3's conclusion inverts: *"part of ALL harness initializations"* is not
blocked by an unlistable process. `workflow_list` not starting bootstrap's
diagrams from cat-harness's root is **correct behaviour**, and
`isExecutable="false"` means the engine was never going to drive them anyway
(see the §4 correction above, which found the same thing from the other side).

### I implemented the scrapped fix before reading the scrap, and it failed the way the scrap says

Declared `bootstrap/workflows/` in `cat-harness/harness.json`; every measure I
chose said it worked — `workflowFiles` 58 → 61, the three diagrams visible,
four roles bound, **0 dangling `bindsLane` edges**. Then
`a second instance in the tree stays out of the first's graph` **failed**.

**That failure was in my own `gates --all` output and I did not read it.** I
read the tail, saw `translate-bpmn` and `gen-docs-pages` stale, fixed those,
and never read the rest of a run that had already told me the answer. Reverted
in full.

I am the **fourth** session at this and the **third** to get as far as editing
`harness.json`. `kg-qa.ts`'s `nested-instance-audited` criterion was written
earlier the same day and describes the failure mode in advance; the finding it
scopes says *"a nested instance may name it, and this audit does not read one"*.
Three of us read that disclaimer as boilerplate.

**What is left of §3:** nothing about listability. The open question is only
whether `folio_init` should install an initialization step at all, and
`folio_init` writing zero workflows is a fact about `folio_init`, not about
bootstrap.

## What DID survive, and it is small

`bootstrap/workflows/log-message.bpmn` had **no `BPMNDiagram` element at all** —
zero shapes, zero edges. A BPMN file with no diagram interchange cannot be drawn
by any tool, whoever scans it, so this is a defect of the file and not of the
declaration. DI authored: pool, two lanes, six nodes, five edges with the yes/no
labels.

Verified to be independent of the reverted change: with the DI in place and
`bootstrap/workflows/` **not** declared, `instance-graph-isolation` passes 5/5
and `render:bpmn:check` passes — the root correctly does not want an SVG for a
file it does not scan. **No SVG was committed**, for that reason.

> **Do not "fix" the missing SVG by declaring the directory.** That is the dead
> end three sessions have now walked into.

## RULED, owner, 2026-09-20 — §1: REPLACE

> "1 REPLACE"

`cat-harness.config.json` **replaces** `harness.json`. One file per instance at
the instantiation root, carrying both what the instance IS and where its
directories are — not two files side by side.

That settles the question `zkgs`'s ruling did not reach. `zkgs` named the
convention `<declared instance name>.config.json` while ruling on the CONFIG
(`harness.config.json`); this says the DECLARATION (`harness.json`) folds into
the same file rather than sitting beside it.

### What this costs, so the implementer is not surprised

The two files have different schemas and different readers:

    harness.json          schemas/cat-harness.ts      directories, graphs,
                          readDeclaration()           dependents, assets, stickies
    harness.config.json   schemas/harness-config.ts   contentType, adapter,
                          readHarnessConfig()         feedbackDir, viewer, readme

Merging them means one schema and one reader, and every consumer of either
moves. Measured constraints already known:

* **`dependents` is REQUIRED on every directory entry** and `readDeclaration`
  THROWS without it — not a warning. qou hit this on 2026-09-20: every pipeline
  entry point died at module load and `run-validate` reported nothing rather
  than a problem. A merged schema must keep that loudness.
* **Both halves are load-bearing at once.** qou needs the declaration to say
  its folio tree is at `content/` AND the config to say the folio is a `paper`.
  A merge must not make either optional.
* **`zkgs` blocks on #477**, which renames the instance to `cat-harness` — the
  filename derives from the declared `name`, so this lands after it.
* Bootstrap's file becomes `bootstrap.config.json` by the same derivation. It
  already declares itself in `bootstrap/harness.json`, so this is a rename
  plus a merge, not new content.

### Still open under this ruling

Whether the merged file is process-WRITTEN at initialization (§2). If it is, a
`.config.json` is `state` wearing a config's name, and the convention spreads
that naming to every instance at once. The ruling does not decide it.

---

## OWNER RULING, 2026-09-21 — §1 reconfirmed and WIDENED

Asked in session_01AYHimvYMmf8h8e9fFN6dW5 as the `goal-review` sweep's single
question, with the migration cost measured first. The owner's words, verbatim:

> 1 bit should also bootstrap and folio-assistant configs/instantatioon

Option 1 was **REPLACE** — `<name>.config.json` becomes the single declaration
at an instantiation root and `harness.json` goes. So §1 stands as ruled on
2026-09-20, and the addition is the new part: **`bootstrap/` and the
`folio-assistant-*` instances are in scope too.** One rule, no exemption.

### What that settles, and what it does not

**Settles:** `603s` shipped `harness-tiles.ts` discovering instances by
scanning for `harness.json` and recorded *"this bean's question 1, answered:
`harness.json` is what names an instance"*. That answer is now superseded by a
ruling. The scanner is repointed, not defended.

**Settles:** bootstrap is not exempt from this rule. `hfkl` is the bean that
carries what bootstrap IS exempt from (a visualiser); it is not exempt from
carrying its own config. That is a narrower exception than "bootstrap is the
exception" reads.

**Does NOT settle** — and this is derived from the ruling rather than stated in
it: the filename comes from the declared `name`, so `folio-assistant-core/`
and `folio-assistant-sci/` cannot be renamed until `hso8` is answered
(`folio-assist-core` on main vs `folio-assistant-core` on disk and on the
branch). The ruling does not name them; it says they are in scope.

**Does NOT settle** §2 — whether the merged file is process-WRITTEN at
initialization, which is what decides whether a `.config.json` is `state`
wearing a config's name. Still the owner's.

### Migration cost, measured 2026-09-21 before the question was asked

| | |
|---|---|
| declaration files on disk | **12** (a 13th, `cat-harness/docs/_data/harness.json`, is generated data, not a declaration) |
| `.config.json` files today | **1** — `cat-harness.config.json`, at the repo root, named by exactly **1** TypeScript file |
| TypeScript files naming the old string | **121** (357 occurrences) |
| **non-test string literals bypassing `DECLARATION_FILENAME`** | **21** |
| workflow files | 3 |

`DECLARATION_FILENAME` already exists at `cat-harness/schemas/cat-harness.ts:84`
and **21 non-test call sites do not use it**. Those bypasses are a latent
defect whichever way this was ruled; routing them through the constant is what
makes the rename a day's work rather than a sweep of 121 files.

## Done when — added by this ruling

- [ ] The 21 non-test literals are routed through `DECLARATION_FILENAME`
      FIRST, as a separable change that is correct under either filename
- [ ] `bootstrap/` carries its own config, and `hfkl` records that the
      bootstrap exception is about a visualiser and not about this
- [ ] The `folio-assistant-*` instances are migrated once `hso8` is answered
- [ ] `AGENTS.md`, `zkgs`'s Done-when and `603s`'s recorded answer are
      corrected, or each says why it still reads the other way

*Recorded, not implemented. This bean belongs to another session; a ruling is
evidence, and evidence is not a claim on the work.*

## OWNER RULING, 2026-09-21 — §2 settled: **authored config a scaffolder seeds**

Asked with the evidence rather than as an open question, because the code
answers the literal half of it. §2 read:

> Whether the merged file is process-WRITTEN at initialization. If it is, a
> `.config.json` is `state` wearing a config's name.

### What is measured

**Two processes write the declaration**, so the literal answer is *yes*:

| site | what it does |
|---|---|
| `scripts/init-folio.ts` | **creates** it when scaffolding a new folio |
| `scripts/ensure-landing-sticky.ts:550` | `if (!already) writeFileSync(join(root, DECLARATION_FILENAME), insertDirectoryEntry(raw, FOLIO_DIRECTORY_ENTRY))` — **repairs** it, adding a `folio` directory entry to an instance that does not declare one |

### The ruling

The owner chose **authored config that a scaffolder seeds**. The name stays as
ruled in §1: `<name>.config.json`, not a `state`-flavoured name.

The reason the literal *yes* does not carry the classification: **neither
writer maintains the file.** `init-folio` creates it once and
`ensure-landing-sticky` only fires on `!already` — both are create-or-repair,
not a process keeping a value current. And the file is committed and heavily
hand-authored: `folio-assistant-core/harness.json` carries a ~1,900-character
`_comment` recording an owner ruling and a correction, which is not something a
process writes.

> **A process may CREATE or REPAIR the declaration. It never maintains it.**

That is the rule this ruling establishes, and it is what keeps the `holds:
content | context | state` axis honest: `state` is for a graph a running
process keeps current, and a file whose content is prose an author wrote is not
that, however it first arrived on disk.

## Done when — added by this ruling

- [ ] The create-or-repair rule is written into the skill that owns the
      `holds` axis (`content-context-and-state-graphs`), not only here — a
      rule that lives in one bean is a rule with no home
- [ ] `ensure-landing-sticky`'s write is documented AS a repair at its call
      site, so a later reader does not take it for maintenance and reclassify
      the file

## §1 REVERSED, owner, 2026-09-21 — the OTHER option, `<name>.json` + `<name>.config.json`

> "rename the stub need cat-harness.config.json and cat-harness/cat-harness.json,
> same for folio-assistant (instance, declration)"
> — and, when the conflict with the REPLACE ruling was put back to them, "1".

**This bean asked the question and then recorded the wrong half as settled.**
§1 offered two options and said the ruling *"does not decide this, because the
question had not been asked when it was made"*. The 2026-09-20 ruling — `"1
REPLACE"` — then answered it as MERGE, and `6n23`/#695 implemented that
faithfully. The owner has now taken the option §1 itself described:

> `<name>.json` + `<name>.config.json` **would at least pair them**.

### Why the merge was worth reversing, in the terms §1 already used

§1's own objection to `cat-harness.config.json` beside `harness.json` was that
*"nothing in either name says which is which"*. The merge did not remove that;
it **moved** it. After #695 the tree carried two different schemas, with two
different readers, under one filename shape:

    <root>/cat-harness.config.json             contentType, feedbackDir, skills
                                               HarnessConfigSchema / readHarnessConfig
    cat-harness/cat-harness.config.json        name, directories, stub, assets
                                               CatHarnessDeclarationSchema / readDeclaration

Told apart only by which directory they sat in. The split gives each its own
name and the pair is legible without knowing where you are.

### What made it cheap, and it was NOT this bean

`#695` did the hard half. It replaced the fixed `DECLARATION_FILENAME` with a
SUFFIX plus `findDeclarationFile`, which takes the file whose **filename stem
equals its own declared `name`**. Moving the suffix was then one edit.

That check is also what answered migration-plan I.8, whose objection had been
the reason not to do this at all: *"a FIXED declaration filename is what lets a
consumer open a repo it has never seen. A per-repo config name fails silently —
a resolver deriving it from the DIRECTORY finds nothing when the repo is cloned
elsewhere."* Nothing derives a filename from a directory. A declaration is
SELF-IDENTIFYING, so a renamed clone still resolves, and `kg-export.test.ts`
now asserts that property where it used to assert the fixed name.

### The failure mode the change had, three times, in three places

A bare `.json` suffix matches almost every file; `.config.json` matched almost
none. Every defect this migration produced was that one shape:

| where | what it claimed | cost |
|---|---|---|
| `content-types-base.ts` marker fallback | `dak.json` is a harness marker | a DAK repo reported as carrying a harness it has not got |
| `check-undeclared-files.test.ts` | `tsconfig.json` is a declaration | JSONC comments threw a parse error |
| `findDeclarationFile` broken-file path | a malformed `folio/landing.json` is a broken declaration | `readDeclaration` taken down by a landing sticky |

**The suffix is not the discriminator; agreeing with your own `name` is.** Each
was fixed by keying on `CONFIG_SUFFIX` or by going through
`findDeclarationFile` — never by widening the guess.

### Done

12 declarations renamed; the ROOT's merged file split back into
`folio-assistant.json` + `folio-assistant.config.json`; `CONFIG_SUFFIX` and
`instanceDeclarationFilename` added so the two filenames have two spellers;
`init-folio` and the test fixtures write two files again. 5172 unit tests,
89 gates, 222 browser tests — all green.

