---
# folio-assistant-fsl7
title: Repoint remaining hand-rolled block scanners at the module loader
status: completed
type: task
priority: normal
created_at: 2026-08-08T13:25:41Z
updated_at: 2026-08-26T14:11:38Z
---

Follow-up to jwd9, which replaced the source-text scan with module imports in conjectural-propagation-audit and conditional-class-banner-audit and added write-verification to prune-transitive-deps.

Still scanning source text:

- qa-checkers-extended.ts strips uses/cites from .ts text to decide whether an LP hint refers to this block or a downstream one. It is a SYNCHRONOUS checker, so it cannot await an import; repointing needs either a sync loader or a restructure of that criterion to inspect named fields instead of doing text surgery on everything-except-three-fields.
- readBlockManifest in qa-utils.ts is regex-based but builds its kind alternation from BLOCK_KINDS, so it cannot drift. It is the sync path walkBlocks depends on. Fine as is unless a sync loader appears.

Not urgent. Filed so the remaining scanners are known rather than rediscovered.

## 2026-08-08 — the first bullet's *bug* is fixed; the repoint itself is not

Bullet 1 said `qa-checkers-extended.ts` "strips uses/cites from .ts text to
decide whether an LP hint refers to this block or a downstream one", and that
repointing needs a sync loader or a restructure. Looking at it turned up a live
defect underneath, worth separating from the refactor:

**The strip list was three fields; the schema has nine.** `compute-lp-dual-present`
stripped `uses`, `cites` and `interprets`, then grepped everything else. But
`examples`, `proofs`, `defines`, `requires`, `mathlibLinks` and `blocks` are
reference fields too — they hold labels and paths pointing at OTHER blocks — and
an LP token in any of them read as evidence that THIS block computes LP duals.
Demonstrated with fixtures: `examples`, `proofs` and `defines` each produced a
spurious `fail` before the change.

Fixed by making the list complete and naming it: `REFERENCE_ARRAY_FIELDS` /
`REFERENCE_SCALAR_FIELDS` + `stripReferenceFields`, sited next to the criterion
with a note that adding a reference field to the schema means adding it here.
`scripts/tests/qa-checkers-lp-dual.test.ts` pins both directions — the criterion
still fires on a real LP solver whose witness lacks its dual certificate, and
stays quiet for a token in each of the six reference fields.

Verified inert on real content: the criterion was run over all 3523 blocks of
the `qou` folio before and after — identical output, zero diff. (All pass there
today, so the corpus alone is a weak signal; the fixtures are what carry the
evidence, and three of them failed before the change.)

### What is still open here, and why it is a decision rather than a task

The mechanism is still text surgery on `.ts` source. Two ways forward, and they
are not equivalent:

- **A true allowlist** — read `label`, `title`, `tags`, `script`, `witness`
  instead of "everything except the reference fields". Cleaner, and immune to a
  new reference field being added. But it NARROWS the gate: a block whose only
  LP token lives in an `authorNotes` body would stop being checked. That is a
  behaviour change with a real miss mode, so it wants a deliberate call rather
  than being slipped in under a refactor.
- **A sync loader**, which bullet 1 already names. Still absent.

Until one of those, the complete denylist is the honest middle: same behaviour
as before except for the bug, and the failure mode is now "someone added a
schema field and forgot this list", which the comment addresses.

Bullet 2 (`readBlockManifest`) is untouched and still fine as filed.

Leaving this bean `todo` — its actual subject, the repointing, is undone.

## 2026-08-08 — bullet 1 closed by owner decision; the bean stays open for the loader

Put to the owner with the three options and their trade-offs. The ruling:
**leave the LP criterion as it now stands.**

So bullet 1 is closed — not by being repointed, but by the defect underneath it
being fixed and the remaining refactor being judged not worth its risk:

- the **true allowlist** was declined because it narrows the gate. Reading only
  `label`/`title`/`tags`/`script`/`witness` would stop checking a block whose
  only LP token lives in an `authorNotes` body. Trading a known-safe behaviour
  for a silent miss mode is the wrong direction for a criterion whose job is to
  demand evidence.
- the **complete denylist** stands as the honest middle: identical behaviour to
  before except for the bug, tested in both directions, and inert across all
  3523 blocks of the `qou` folio.

Its remaining failure mode is "someone adds a reference field to the schema and
forgets `REFERENCE_ARRAY_FIELDS`". That is now a comment away from the schema it
mirrors, and a test file named for the criterion.

**The bean stays `todo`, and its subject is now only the sync loader** — bullet
1's original ask. That is worth doing when someone is already in loader work, as
it retires the text-surgery class across every synchronous checker rather than
one criterion. It is not worth opening on its own account, and it is not
blocking anything.

Bullet 2 (`readBlockManifest`) unchanged and still fine as filed.

## 2026-08-10 — a third scanner, and it had a live bug (bullet 3)

The inventory above was incomplete. `loadChapterGraph` in the same file reads
**chapter manifests** with `blocks: \[([\s\S]*?)\]` — a third hand-rolled scan,
and the one that has now cost something. See `mcp1` / #99.

The non-greedy match stops at the first `]`, **including one inside a comment**.
A note in the qou paper reading "…and it has `uses: []` today" sat mid-array and
every block listed below it vanished from `blockPos` — **45 of 3498 blocks,
across 7 of 19 chapters**.

That is not a miscount. `checkDetanglerNoForwardRef` returns `pass` when a block
has no position (`myPos === undefined` reads as "not listed"), and edges pointing
at an unpositioned block are skipped too. The criterion reported clean on
material it had never looked at, and nothing downstream could distinguish
"checked and fine" from "never checked".

The reverse direction was worse: a slug quoted inside a comment counted as a real
entry, which both invented a block and advanced `within`, shifting every later
position in that chapter by one. Six such phantoms existed — most were fragments
of section titles caught between quotes, but one was a **real label** mentioned
in a comment, which is the case most likely to produce a plausible wrong answer
rather than an obviously broken one.

Fixed in #99 by stripping `//` comments before matching, quote-aware so a
`"https://…"` in a title survives. 8 tests.

**Why this belongs on this bean rather than closing with #99.** The fix repairs
this scanner; it does not retire the class. A regex over `.ts` source is
defeated by anything the source may legitimately contain, and the failure is
silent by construction — the checker cannot tell an empty parse from a clean one.
That is the argument for the sync loader, made concretely rather than in
principle.

It does not change the owner's ruling on bullet 1, which was about narrowing a
gate, not about parsing. But it does move this bean from "filed so the remaining
scanners are known rather than rediscovered" to "one of them has already
mis-parsed real content and hidden findings behind a pass". Still not blocking;
now with a demonstrated cost.


## 2026-08-15 — bullet 3 is half-discharged, and the half that mattered is not

`1690d08` ("manifest parsing: read the array, not the text that looks like one")
adds `parseManifestStringArray`, which is the right implementation and strictly
better than the stopgap: it **masks** strings and comments index-preservingly
rather than stripping them, then matches the array by **bracket depth**. So a
`]` inside a comment cannot terminate it, a `https://` inside a literal survives,
and — unlike the stopgap — a legitimately nested array is handled.

It has a 113-line test file. This is the class being retired properly rather
than patched, which is what this bean asks for.

**But `loadChapterGraph` was not repointed at it.** The position map that every
detangler criterion depends on — the exact code path `mcp1` was a bug in — still
runs `stripLineComments` plus the non-greedy `blocks: \[([\s\S]*?)\]`. Two
parsers now derive block positions from the same manifests by different means:
`build-foreshadows.ts` on the new one, `loadChapterGraph` on the old.

Measured on the qou corpus today: **they agree, 0 disagreements across 3515
slugs**, so this is latent rather than live. The stopgap handles the two shapes
that actually occur (a `]` in a comment, a slug quoted in a comment). It would
diverge on a nested array inside a `blocks: [...]`, which no manifest currently
has.

So the remaining work here is small and worth doing while the context is fresh:
point `loadChapterGraph` at `parseManifestStringArray`, drop `stripLineComments`
and its test if nothing else uses them. Not urgent — nothing is wrong today —
but two parsers for one job is how the next divergence starts, and this bean
exists precisely to stop scanners being rediscovered.


## 2026-08-15 — bullet 3 closed: loadChapterGraph is on the real parser

`parseManifestStringArrays` added — same masking and depth-scan as the
single-array version, returning every occurrence in source order, because a
chapter manifest holds one `blocks: [...]` per section and per subsection and
the position map walks them in order. That is why the existing function was not
a drop-in.

`loadChapterGraph` now reads through it. `stripLineComments` is deleted: it had
no production caller left, only its own test.

Its test survives, repointed. The two cases in it came out of the corpus — a `]`
inside a comment, a slug quoted inside a comment — and they are worth keeping as
regressions regardless of which parser answers them. Four cases added that the
stopgap could not have passed: every section's array returned in order, a nested
array not ending the scan, and a field name inside a string not winning over the
real field. That last one is bug 2 from `parseManifestStringArray`'s own notes,
which the stopgap never addressed — stripping comments does nothing about a
`blocks: [...]` quoted inside an `authorNotes` body.

Verified behaviour-preserving: forward references on qou read **194 before and
194 after**, matching the 0-disagreement measurement taken before the change.
677 tests, lint clean.

**Bullet 3 is done.** Bullets 1 and 2 stand as previously ruled — bullet 1 closed
by owner decision, bullet 2 fine as filed. The bean's remaining subject is the
sync loader, unchanged: worth doing when someone is already in loader work, not
worth opening on its own account.

## 2026-08-16 — bullet 2 closed: readBlockManifest was admitting a non-block

Bullet 2 said `readBlockManifest` "is regex-based but builds its kind
alternation from BLOCK_KINDS, so it cannot drift. Fine as is unless a sync
loader appears."

The alternation cannot drift. The **matching** could, and did — in the
permissive direction, which is the worse one. Both regexes ran against raw
source, so a builder call or a `label:` inside a string literal or comment made
an ordinary file look like a manifest.

`content/pipeline/witness-substitution-audit.ts` carries a self-test:

```ts
parseWitnessList(`export default proposition({ label: "prop:x" });`)
```

`walkBlocks` yielded that audit script as a content block labelled `prop:x`.
Every per-block checker ran on it and filed results under a label no block
holds. Blocks walked: **3521 → 3520**.

Fixed by matching against a string- and comment-masked copy and reading the
label through `parseStringField`. Both primitives already live in
`uses-field.ts` after this session's consolidation, so this is a repoint rather
than a fifth parser — which is what this bean has been asking for throughout.

Seven tests, including the exact corpus shape (a manifest's source passed as a
template literal to the function under test) and the guard that a real manifest
still reads.

**Bullet 2 is closed**, and not by the sync loader. The remaining subject is
unchanged: bullet 1 was closed by owner decision, bullet 3 by `#116`, and a true
sync loader is still absent — but the class this bean was filed to track,
"scanners that read source text and can be fooled by what source text may
legitimately contain", is now materially smaller. Every manifest read in the
pipeline goes through the masked scanner.

## 2026-08-16 — the walk was wrong in BOTH directions

`#125` fixed `walkBlocks` **admitting** a non-block. Asking the complement —
does it **miss** real ones? — found 63 that it did.

Chapter manifests list 3571 slugs; the walk yielded 63 fewer. All 63 are
`prose()` connective tissue with no `label:` (chapter intros and outros, the
notation register, the author's note), all render into the paper, and all carry
27,390 words of narrative plus `.qa.json` sidecars that `qa-sweep` — which
iterates `walkBlocks` — could never refresh.

Fixed by separating the two questions the one enumeration was answering.
`walkBlocks(root, { includeUnlabelled })` defaults to **false**, which is right
for the dependency graph: a block with no label cannot be a node. `qa-sweep`
opts in, because its question is "what prose ships?" not "what is in the
graph?". Unlabelled blocks are yielded under their **slug**, which is the
identity their existing sidecars already use.

`readUnlabelledBlockManifest` is masked like `readBlockManifest`, and a test
pins that neither mode readmits the `#125` shape — a looser path added beside a
fix is how the fix gets undone.

**Measured before landing, and the measurement changed the recommendation.** I
had argued this option was "the smallest change and the loudest", on the
assumption that 27,390 unchecked words would produce a large batch of findings.
Across the 63 blocks: **1286 applicable criterion runs, 0 failures** (819 runs
skipped by `applies_to`, correctly — a chapter outro is not a proposition).

An earlier count of 126 failures was my own error: I invoked the checkers
directly and bypassed the `applies_to` filter that `qa-sweep` applies at line
367, so `compute-prop-has-probe` and `-has-consumer` fired on prose. Caught
before it was reported as a risk.

So the change is cheap AND quiet. The prose was clean; it simply could not be
seen to be.

## 2026-08-26 — the loader exists; bullet 2 is repointed behind an opt-in

Bullet 2 was filed as "fine as is **unless a sync loader appears**". One
appeared. Bun's `require` loads a TypeScript ES module synchronously, so
`walkBlocks` — a sync generator with fourteen production callers, which is the
whole reason it reads identity out of source text — can now import a block
without becoming async.

`loadBlockModuleSync` in `content/pipeline/block-module.ts`. Cost, measured over
300 generated manifests plus 10 non-block helpers, cold:

    regex readBlockManifest   16.0 ms   0.052 ms / file
    loadBlockModuleSync       67.1 ms   0.216 ms / file

Four times the regex, 0.76 s across three and a half thousand blocks. Matches
the 0.66 ms/block the async loader measured in `jwd9`.

### The textual read is wrong in three ways, and one of them is a wrong answer

Not asserted — demonstrated, and pinned in
`scripts/tests/block-walk-verify.test.ts`:

| source                             | regex reads           | the block *is*         |
|------------------------------------|-----------------------|------------------------|
| `label: LBL` (a constant)          | `undefined` → skipped | `prop:computed`        |
| an earlier `label:` in a helper    | `not-the-block`       | `prop:real`            |
| `proposition({label:"theorem:x"})` | `theorem:x`           | rejected by the schema |

Row 2 is the sharp one. It is not a miss, it is a confident wrong answer — a
sidecar and a graph node keyed to a label the block does not have. Same shape as
the `root`-is-a-stem bug that reported "0 siblings across 3486 blocks" and
looked plausible enough to nearly publish.

### The candidate gate stays textual, and that is load-bearing

Importing a module runs it, and a content tree holds scripts as well as
manifests — `content/pipeline/qa-agent-drain-queue.ts` in this repo starts a
sweep at import time. So `readBlockManifest`'s masked builder-call match now
decides *what may be executed*, and the loader decides *what it is*. Two tests
pin the gate: a helper with a top-level side effect is never imported, and
neither is the `#125` shape (a builder call inside a template literal).

Writing this turned up a mistake in my own first cut. I had gated verification
on the file having a textual `label:`, which meant the computed-label case —
one of the three the change exists to fix — never reached the loader at all. The
test caught it. The label is a question about identity, not about candidacy; the
gate is the builder call alone.

### The measurement ran, and the default is flipped

I first wrote that the corpus "lives in the folio repo, not here, and this
session had no access to one". That was wrong, and wrong in the cheap way:
`add_repo litlfred/qou` attached it in one call. I asserted a limitation I had
never tested. The measurement it was blocking takes about a second.

`bun run content/pipeline/verify-block-walk.ts /home/user/qou/content/quantum-observable-universe`

    QA mode    (includeUnlabelled)  textual 3557 blocks / 450 ms
                                    verified 3557 blocks / 1475 ms
    graph mode (default)            textual 3494 · verified 3494, identical
                                    (kind, label, ts) triples

    blocks only the verified walk finds  0
    blocks only the textual walk finds   0
    blocks whose identity differs        0
    blocks that would not import         0

So on `qou` the flip is a **no-op plus one second**. Its value is not fixing
something broken there; it is that the three failure classes become impossible
rather than merely absent-so-far, and that the walk stops depending on a parser
that can drift. `verify` defaults to `true`; `verify: false` is the escape
hatch.

Two things the run itself turned up:

- **A folio needs its platform symlink.** Importing a block resolves its
  imports, and `qou/content/schema/builders.ts` re-exports through
  `<folio>/folio-assistant`, which `scripts/setup-folio-assistant.sh` creates.
  Without it all 3557 blocks fail to load. The walk still yields every one of
  them under its textual identity and says so — the fallback doing its job —
  but the first run printed 3557 warning lines and buried the one line that
  said what to fix. Now capped at five named files plus a summary that names
  the likely cause.
- **The warning budget was process-global**, so a second walk in the same
  process (`qa-sweep` calls `usesGraphHash` before its own) would have had its
  genuine failures silently swallowed by the first walk having spent it. Scoped
  per walk.

And the flip broke `verify-block-walk` itself — both of its arms had been
relying on the default, so it started comparing the verified reading with
itself. Both arms now state `verify` explicitly.

### Why it was opt-in first

`walkBlocks(root, { verify: true, onLoadFailure })`. Default `false`.

Fourteen tools consume this generator, and this repo has twice learned that
changing what the walk enumerates must be measured against real content before
it lands: `#125` admitted a non-block, `qou/3fui` missed 63 real ones — and in
that case the measurement *reversed* the recommendation the change had been
argued on. The corpus that would settle it is in the folio repo, not here, and
this session had no access to one.

So the flip is staged, not deferred indefinitely.
`bun run content/pipeline/verify-block-walk.ts <content-root>` walks both ways
and prints every disagreement, every block only one mode finds, every block that
will not import, and what the flip costs in wall-clock. Run it against `qou`;
flip the default on what it prints.

A block that fails to import is reported and **still yielded**, carrying its
degraded textual identity. Dropping it would trade a loud problem for a silent
coverage hole, which is `qou/3fui` in reverse.

### Still open

Nothing in this bean's subject. Both scanners are addressed: bullet 1 closed by
owner decision, bullet 2 repointed at the loader and the default flipped on a
measurement.

What a future reader should know rather than rediscover: the default was
measured against **one** corpus. Another folio should be run through
`verify-block-walk.ts` before its walks are trusted to verify, and
`verify: false` is there when it disagrees.
