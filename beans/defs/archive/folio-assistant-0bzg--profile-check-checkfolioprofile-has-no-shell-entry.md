---
# folio-assistant-0bzg
title: 'PROFILE CHECK: checkFolioProfile has no shell entry point — three options, none chosen'
status: completed
type: task
priority: normal
created_at: 2026-09-20T10:45:46Z
updated_at: 2026-09-20T14:12:30Z
parent: folio-assistant-d308
---


Found 2026-09-20 while authoring the `9x17` Tool node. **Not caused by that work**
— it is the state `profile-check.ts` has always been in, and authoring a node over
the group is what made it legible.

## The measurement

`cat-harness/content/pipeline/profile-check.ts` has **no `import.meta.main`**.

| export | non-test callers | reachable from a shell? |
|---|--:|---|
| `readDeclaredFolioProfile` | 4 | yes — `validate.ts`, `qa-sweep.ts` |
| `checkFolioProfile` — the CONFORMANCE check | 1 | **no** |
| `formatProfileCheck` | 1 | no |
| `readFolioProfile` | **0** | no caller at all |

The single caller of the conformance check is
`cat-harness/adapters/document/tools/validate.ts`, which registers MCP tools and
has no `import.meta.main` either. So the check runs only inside an MCP session.

## Why that is a finding rather than a preference

`content-profiles` is explicit that this check catches what schema validation
**structurally cannot** — a block valid against its schema but wrong for its
content profile, because adapters partition disjointly while profiles nest. It is
the second of two checks for a reason.

And `schemas/tool.ts` refuses the obvious shortcut of giving it a Tool node as it
stands: *"A Tool reachable only over MCP is not usable by the harness that defines
it, and projecting it would emit a server that proxies itself."*

**This is the third case `covered-is-not-reachable` names and had no example
of — a mechanism with no command at all.** The other three instances were skills
covered by Tools that did not perform their central act. This is the shape
underneath them, and it is invisible to `tools:coverage` by construction.

`readFolioProfile` having **zero** non-test callers is a separate, smaller
question in the same file: dead export, or the entry point somebody started and
did not finish?

## Options, with what each costs

1. **A `check:profile` script**, wired like `check:corpus-gate`. Cheapest, and it
   puts the check where every other gate is — but the platform carries no folio,
   so it would sit in `SCRIPT_EXEMPTIONS` as `no-folio` and never run here, which
   is honest but means the entry point is added and still unexercised.
2. **A `qa-sweep` axis.** The check is per-block and `qa-sweep` already writes
   per-block sidecars, so a verdict would be committed beside its subject and get
   the "never checked" / "checked and clean" distinction for free. Costs more: an
   axis is a registered criterion, not a script.
3. **Leave it MCP-only, and say so.** Defensible on one argument: a profile
   judgement is made while authoring, and an authoring session is exactly where
   MCP reaches. The cost is that nothing outside a session can ever ask the
   question, so CI cannot.

**Recommendation: option 2.** The check's shape already matches what `qa-sweep`
does — per block, verdict worth keeping, and the third state mattering — and it is
the only option where the answer becomes durable rather than printed. Option 1
adds an entry point that this repository can never run; option 3 keeps a
structural gap that `content-profiles` says matters.

**Not decided here.** Choosing is a change to the pipeline's public surface and
belongs with the owner, which is why this is a bean rather than a commit.

## If nothing is decided

Status quo: the conformance check keeps working inside MCP sessions and stays
unreachable from CI. Nothing regresses; the gap simply stays, now written down.

## Done when

- [x] one of the three chosen, by a person — the `qa-sweep` axis
- [x] whichever is chosen, `covered-is-not-reachable` gains this as its worked
      example of the no-command case — **case 4** in its table, with the
      generalisation the case actually cost (see below)
- [x] `readFolioProfile` is **not** dead: `checkFolioProfile` calls it at
      `profile-check.ts:147`, and `profile-scoping.test.ts:169` pins the
      two-caller distinction in a test — *"Two callers, two right answers"*



---

## DECIDED 2026-09-20 — a `qa-sweep` axis

Owner chose **option 2, the `qa-sweep` axis**, and then clarified across the whole
set: **"all for triggers or tools as appropriate"**.

So the axis is the trigger, and the question of whether `checkFolioProfile` also
deserves a Tool node is answered by the same principle rather than by this bean's
original either/or: if a caller should be able to invoke it by name, that is a
Tool; the sweep firing it per block is a trigger. Both may exist.

What the axis must carry, from this bean's own argument: the profile check catches
what schema validation STRUCTURALLY cannot, so its verdict is not a refinement of
the schema verdict and must not be folded into it.


---

## 2026-09-20: BUILT — the `profile-conformance` axis

Registered in `EXTENDED_AUTOMATED_CHECKERS` as `profile-conformance`, wrapping
`checkFolioProfile`. So the conformance check now has a caller outside MCP, and a
sweep writes its verdict into the per-block sidecar where it outlives the run.

### Its own criterion, never folded into the schema verdict

This bean's own argument required it: the profile check answers a question schema
validation cannot reach, so a combined verdict would report one judgement where
there are two — and the hidden one is the one with no other source.

### Cached per process, and that is not an optimisation

`checkFolioProfile` walks the whole folio. Calling it per block would re-walk once
per block, which is bean `4n37`'s defect — `probeAll` re-spawning 25 subprocesses
per call — in a different costume. The profile and the manifests cannot change
mid-sweep, so one walk is not a cache of something volatile; it is not repeating
work. Same shape as the existing lazy `bib-qa` report load in that file.

### The bug my first version shipped, found by RUNNING it

I guarded could-not-determine on `ProfileCheckResult.profile === undefined`. **That
field is never `undefined.`** `checkFolioProfile` resolves through
`readFolioProfile`, which turns an undeclared profile into `"paper"` — correct for
a validator, since the wider vocabulary is the safe thing to validate against. So
the guard never fired, and the axis reported:

```
{"result":"pass","notes":"conforms to the declared `paper` profile (default (no harness.config.json))"}
```

**A pass on a folio that declares nothing** — exactly the laundering the axis
exists to prevent, and the note contradicted itself in the same breath
("declared … (no harness.config.json)").

Fixed by asking `readDeclaredFolioProfile`, whose documented purpose is keeping
declared apart from resolved. **Not** by matching on `declaredBy`'s wording: that
is prose, and a check that silently stops firing when a sentence is reworded is
worse than one that never existed.

Now reports, on this repository: `n/a` — *"the folio declares no content profile
(undetermined (no harness.config.json)) — could not determine, not conformant"*.

### All three states reached, because n/a alone proves nothing

The platform declares no `contentType`, so an axis tested only here would return
`n/a` forever and look implemented while checking nothing. Four tests over
temporary folios:

| fixture | result |
|---|---|
| `contentType: document`, holding a `theorem` | **fail** — `kind-outside-profile`, 2 blocks checked, remedy names `contentType: "paper"` |
| `contentType: paper`, the SAME blocks | **pass** — the control; profiles nest, so `theorem` is inside `paper` |
| no `harness.config.json` | **n/a**, and the test asserts declared-undefined WHILE resolved-`paper` |

The `paper` control earns its place: without it the violation could have come from
a broken walk or a bad kind table rather than from the kind being outside THIS
profile.

**One fixture mistake worth recording**: my first fixture used
`export default { kind: "theorem" }`, a plain object literal, and
`readBlockManifest` requires `export default <builder>({ … })`. It reported
`blocksChecked: 0`, so every assertion would have passed over nothing. The test
file says so, because the next person writing a block fixture will reach for the
object literal too.

### A correction to this bean's own measurement

It recorded `readFolioProfile` as having **0 non-test callers**. That was an
artefact of my grep excluding `profile-check.ts` itself: `checkFolioProfile` calls
it internally, so it is not a dead export. The "dead or unfinished?" question the
bean raised does not arise.

## Done when

- [x] one of the three chosen, by the owner — the `qa-sweep` axis
- [x] built, registered, and its verdict written per block
- [x] all three states reached in tests, not just the one this repo produces
- [x] could-not-determine kept distinct from pass, with the trap that broke it recorded
- [ ] `covered-is-not-reachable` gains this as its worked example of the no-command case
- [ ] whether `checkFolioProfile` also wants a Tool node, per "triggers or tools as
      appropriate" — the axis is the trigger; a named command would be the Tool


---

## CLOSED 2026-09-20 — all three criteria met, and the third was a measurement not a change

**Criterion 3 needed checking, not doing.** The box asked for a caller *or* a
record of death, and the answer was already the former: `readFolioProfile` is
called by `checkFolioProfile` (`content/pipeline/profile-check.ts:147`), which the
axis now reaches. Better, the distinction the axis rests on is already *tested* —
`scripts/tests/profile-scoping.test.ts:169` says it in words: **"Two callers, two
right answers."** `readFolioProfile` answers *"what may this folio contain"* and
defaults to `paper`; `readDeclaredFolioProfile` answers *"what did anybody say"*
and returns `undefined`. Recording it as dead would have been false.

**Criterion 2 was the one with work in it**, and the case is genuinely distinct
from the three the skill already carried. Cases 1–3 are about a missing node or a
missing skill. This one had **both** and was still unaskable:

| | what exists | what is missing |
|---|---|---|
| case 4 | a skill, a mechanism, an MCP tool | **a command** — in-process only |

`checkFolioProfile`'s only caller registered MCP tools, so it was reachable by an
MCP-connected agent and by nothing else: not a gate, not a sweep, not a person at
a shell. It is the hardest of the four to notice **because the mechanism *is*
reachable** — to one caller class — so every instrument answering "can this be
reached" says yes. The rule written down: *ask which callers, not whether.*

### The generalisation, which is the part worth more than the axis

The first version of the axis reported **`pass` on a folio declaring no content
type** — precisely the laundering it exists to prevent. It guarded on
`ProfileCheckResult.profile === undefined`, and that field is *never* `undefined`.

> **A library's defaulting is usually what erases the third state.** When you give
> a library function its first entry point, the value it resolves for its own use
> is not the value a verdict may report.

`readFolioProfile` defaulting to `paper` is **correct for a validator** — the
wider vocabulary is the safe thing to validate against — and wrong for a reporter.
Caught by running it, not by reading it.

### Verified

- `covered-is-not-reachable` — 260 lines, under the 280 `skill-is-brief`
  threshold; sidecar 4 pass / 0 fail / 0 unknown at hash `0cee3ea7904e`
- `bun run kg:audit:check` — exit 0
- the axis's own tests (`profile-conformance-axis.test.ts`) reach `pass`, `fail`
  and `n/a`, rather than only the state this repository happens to produce
