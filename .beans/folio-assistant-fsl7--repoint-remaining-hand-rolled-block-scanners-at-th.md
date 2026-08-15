---
# folio-assistant-fsl7
title: Repoint remaining hand-rolled block scanners at the module loader
status: todo
type: task
created_at: 2026-08-08T13:25:41Z
updated_at: 2026-08-08T16:05:00Z
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
