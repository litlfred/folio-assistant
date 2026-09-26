---
# folio-assistant-xd1g
title: 11 root-rooted scans have no gitignore awareness — ramz's sibling audit, answered
status: todo
type: task
priority: normal
created_at: 2026-09-25T16:21:48Z
updated_at: 2026-09-26T11:19:41Z
parent: folio-assistant-ahvw
---

`ramz`'s third box, asked and answered 2026-09-25.

`ramz` fixed ONE scanner: `check-context-emission` walked the filesystem behind
a hand-written denylist and swept 145 gitignored documents as repository
content. It was found by accident — a clean checkout failing a test about code
nobody had touched — so the bean asked *"which others?"*.

**Eleven**, under `cat-harness/scripts/`, each walking from the instance or
repository root with no gitignore awareness:

`check-agents-claims`, `check-code-accounting`, `check-docs-templates`,
`check-image-roles`, `check-lane-documentation`, `check-process-documentation`,
`check-source-licence`, `check-viewer-backticks`, `glossary-export`,
`ns-export`, and `check-subgraphs`.

`check-subgraphs` is the mildest of them — it walks DECLARED directories, so
its roots are derived rather than guessed — but it is still not ignore-aware
within them. Only `scan-repo-content` and `check-context-emission` ask git.

**How this was measured**, so the next reader can re-run it rather than trust
the list: every `scripts/*.ts` carrying a `new Glob("**…")` or a hand-written
`walk(…)`, whose root is `REPO`/`ROOT`/`INSTANCE_ROOT`, and which mentions
none of `ls-files`, `exclude-standard`, `gitignore`. That is a syntactic
filter, so it can miss a scanner spelled differently; it is a floor, not a
count.

## Done when

- [ ] Each of the eleven either enumerates from git (or from the declaration)
      or carries a written reason why a bare walk is right for it — a build
      output scanner legitimately wants files git ignores.
- [ ] The rule is stated once and reused, not re-implemented eleven times.
      `contentDocuments`' `gitListed` is the working version; it wants to be
      shared before it is copied.
- [ ] A check asks the question, so number twelve is caught rather than
      discovered by a contributor with residue on their machine.

## Two properties to keep, from `ramz`

Tracked-PLUS-untracked-not-ignored, never `--cached` alone: a file written and
not yet staged is part of the change under test. And `undefined` (ask
something else) must stay distinct from `[]` (git looked, there are none) —
collapsing them is how a check reports a clean corpus it never read.

## Four of the eleven are done — and three fired on ONE day

2026-09-26, while fixing bean `rsi6`. The trigger was not a sweep of this
list: a new gate installed a publishable package's devDependencies, and three
scanners on it broke within minutes of each other, all on the same
`node_modules/`.

| scanner | what it did |
|---|---|
| `check-subgraphs` | reported **31 broken links**, every one inside a third-party README pointing at its own repository (`sucrase` → `./CONTRIBUTING.md`, `expect-type` → `./src/index.ts`) |
| `check-kind-validators` | **crashed** — `ENOENT` from `statSync` on a dangling `node_modules/.bin/tsserver` symlink, killing the sweep entirely |
| `gen-uml-overview` | crashed the same way, producing no overview at all |

**That is the argument this bean was missing.** The list read as eleven latent
risks; what it actually describes is eleven scanners that are correct only
while nothing untracked appears in a declared directory — a condition no one
controls and any contributor can break by running `bun install` one level
down. Two of the three did not merely over-report: they DIED, so the check
reported nothing rather than reporting too much.

And the second failure mode is worth naming separately, because gitignore
awareness does not fix it: **a dangling symlink is a fact about the tree, not
a reason to stop.** Both crashes were an unguarded `statSync` in a walk. The
fallback paths now catch it.

## Done

- [x] `check-context-emission` (bean `ramz`) — first, and the one that named
      the rule.
- [x] `check-subgraphs`
- [x] `check-kind-validators`
- [x] `gen-uml-overview`
- [x] **The rule is stated once**: `cat-harness/scripts/git-corpus.ts`,
      `gitCorpus(dir, pathspec)`. This bean asked for that *"before it is
      copied"*; it was copied a second time within a day of being written, so
      the extraction happened at the third caller rather than the second.

## Still open — TEN of the original eleven

`check-agents-claims`, `check-code-accounting`, `check-docs-templates`,
`check-image-roles`, `check-lane-documentation`, `check-process-documentation`,
`check-source-licence`, `check-viewer-backticks`, `glossary-export`,
`ns-export` — minus any that turn out to walk a directory where a bare walk is
RIGHT.

Note the arithmetic, because it is the finding and not a bookkeeping detail:
**one** of the four fixed above was on this bean's list (`check-subgraphs`).
`check-kind-validators` and `gen-uml-overview` were NOT — they were found by
breaking, not by the survey. The survey's own method is a syntactic filter
over `scripts/*.ts`, and it said so; two misses on the first day it was tested
is what that caveat is worth in practice. The list is a floor. That question is still per-scanner: a build-output scanner legitimately
wants files git ignores, and this bean's second Done-when has always allowed a
written reason instead of a fix.


## A THIRTEENTH, and the first one whose output is COMMITTED — `kg-detangle` (2026-09-26)

Found the way this bean predicts: not by sweeping the list, but by a gate writing
to the tree while `bun run gates` judged it, caught by the new between-gates tree
guard (bean `ymsu`).

**`cat-harness/skills/graph-management/kg-detangle.ts` walks from `ROOT` and skips
only dot-prefixed entries.** No `ls-files`, no `exclude-standard`, no gitignore.

### Measured, four ways, on one tree

`cat-harness/schemas`, files matching the detangler's own
`EXT = /\.(md|bpmn|dmn|json|ts)$/`:

| count | value |
|---|---|
| bare walk (what the detangler does) | **1441** |
| … excluding `node_modules/` | 228 |
| … excluding `node_modules/` and `dist/` | **227** |
| `git ls-files` matching EXT | **227** |

So the committed sidecar's `size: 1441` counts **1214 files of somebody else's
dependency tree as knowledge-graph nodes**, and `cohesion: 0.96` is computed over
them. The tracked answer is 227 and `cohesion: 0.82`.

**Blast radius is exactly one group.** Every committed `*.detangle.json` was
compared against `git ls-files` over its own `group`; `cat-harness/schemas` is the
only disagreement.

### Why this one is worse in KIND than the eleven

The eleven over-report or die inside a check, and the run ends. This one's output
is **committed** and then **republished**: `gen-uml-overview` reads the sidecar, so
`cat-harness/docs/uml/overview/cat-harness.md` and `.../cat-harness/schemas.md` both
carry `| 1441 | 0.96 | 25 | 4 |` on `main` today. A transient over-count is a bad
run; this is a wrong number in a published document, pinned.

It also inverts what the tree guard's own remediation text tells you to do —
*"regenerate and COMMIT what is stale"* — because here the two writers disagree and
following that advice commits whichever ran last. Measured in sequence on one tree:
`bun test` leaves 227, then `bun run kg:detangle` restores 1441.

### The cause, and it is this bean's own trigger again

`cat-harness/schemas/block-qa-schema` acquired `node_modules/` and `dist/` when bean
`rsi6` / #1372 made the only published package actually build. Same untracked tree,
same day, same mechanism as `check-subgraphs`, `check-kind-validators` and
`gen-uml-overview` above — a fourth scanner on the identical residue.

### Why the survey could not have found it

The method is *"every `scripts/*.ts` carrying a `new Glob` or a hand-written
`walk(…)`"*. **This file is not under `scripts/`** — it is a skill node under
`skills/graph-management/`. The caveat said the list is a floor; this is the first
miss that is outside the searched directory rather than spelled differently inside
it. Worth widening the filter past `scripts/` before the count is quoted again.

### NOT fixed here, and the reason is a placement decision, not effort

The rule is already extracted — `gitCorpus` in `cat-harness/scripts/git-corpus.ts`,
exactly as this bean asked. Using it from `kg-detangle.ts` needs somewhere to import
it FROM, and **nothing under `skills/` imports from `scripts/` today**:

1. import `scripts/git-corpus.ts` from `skills/` — mints the first such edge, into
   the reference-direction rule #1222 is currently generalising
2. move `git-corpus.ts` into `schemas/` — both sides already import from there
   (`kg-detangle` takes `../../schemas/detangle-sidecar.ts`), but it relocates a
   module five scripts import
3. inline the git call — which this bean forbids in as many words: *"stated once and
   reused, not re-implemented eleven times."*

(3) is out. (1) versus (2) is an architecture call that collides with an open PR, so
it is queued for the owner rather than guessed at.


## FIXED 2026-09-26 — the thirteenth is done, and the owner settled the placement

`kg-detangle` now asks git. `cat-harness/schemas` goes from a committed **1441**
(1442 by the time `main` was merged — it climbs on its own) to **229**, and the
group's verdict from *"1 clause(s) fail"* to `CANDIDATE`. The republished table in
`docs/uml/overview/cat-harness.md` and `.../schemas.md` reads `229 | 0.82 | 26 | 2`.

### The owner's ruling, and why it picked the home the import graph already allowed

> *"Skills don't know about scripts… Scripts need to be part of tools."*

So `git-corpus.ts` moved from `scripts/` to **`schemas/`**. Measured, not reasoned:

| direction | edges today |
|---|---|
| `skills/` → `scripts/` | **0** — importing from where it lived would have minted the first |
| `skills/` → `schemas/` | established (`kg-detangle` already takes `detangle-sidecar.ts`) |
| `tools/` → anything | **only** `../schemas/*`, three imports |

`tools/` was not the answer despite the ruling's second clause: a rule placed there
is unreachable from `schemas/` and `scripts/` without inverting the one edge
`tools/` has. `schemas/` is legal from all four directions **now** and still legal
**after** scripts become tools, because `tools/` → `schemas/` is already that edge.

**The precedent is exact rather than analogous.** `schemas/layer-direction.ts` is a
shared verdict used by `check:partition` in `scripts/` and by `kg-detangle` in
`skills/` — same shape, same two callers (bean `j79e`). `git-corpus.ts` sits beside
it and carries the same two tags.

### THREE states, because the second version of the fix invented a fourth case

`gitCorpus` answers `undefined` for a directory that **is not there**, which is a
determined empty rather than an unknown. `SCAN` still names
`cat-harness/src/skills`, removed by #760 — so the first version dutifully reported
*"git could not enumerate 1 directory"* about a directory whose answer is perfectly
known. A could-not-determine manufactured out of a fact is as bad as the reverse.

    absent      -> [] , reported as a stale SCAN entry for a person to remove
    git refused -> a bare walk, reported, so a number pinned from one is legible
    git answers -> that list, filtered to EXT and the same dot-prefix rule

Neither report fails the run: `gates` must stay runnable where git cannot be asked,
and editing `SCAN` is not a script's call. **That stale entry is a live `dh4f`
instance and is now visible on every run rather than silent.**

### An obligation that travels with a directory, not with a module

Eight targeted checks passed and `bun test` still failed: every `.ts` under
`schemas/` must carry `@graphNode`, and an untagged file is `undeclared`, never a
pass. `scripts/` has no such rule, so the move made the file undeclared without
changing a line of it. My first attempt added `@module` — three siblings had it —
and the test still failed, because the tag asked for is a different one.
**Matching the shape of a neighbour is not reading the rule.**

### Verification

`bun test` — **11783 pass, 1 fail**, and the one is `no NEW drift, and nothing
unreadable`, `main`'s own `t8g3` blocker, checked by NAME. tsc and eslint clean.
`kg:detangle:check`, `uml:overview:check`, `check:partition`,
`check:kind-validators`, `check:subgraphs`, `check:context-emission`,
`check:code-accounting`, `check:harness-dirs` each PASS, run one at a time rather
than through `bun run gates` — every false reading this session came from running
the gate set while editing the tree.

### Still open on this bean

The **ten** original scanners are untouched. And one thing noticed in passing, left
for the owner because correcting guidance is not a side effect of a fix:
`scripts/schema-nodes.ts` says *"Three modules carry it"* of `@graphNode none` and
names three files; there are at least eight in `schemas/` alone. A count in prose
gone stale, which is the failure mode this repository warns about in its own
conventions.

## The same finding arrived TWICE in one hour, from two instruments — and the counts disagreed

Recorded because the convergence is evidence about this bean's method, not just
about `kg-detangle`.

The section above found it via the between-gates tree guard while `bun run gates`
judged the tree, and numbered it the **thirteenth**. A second session
(PR #1399) found the SAME defect in the SAME file about an hour later by a
different route entirely: a new `skill-registration-chain` CI job, built to run
five `--check` commands without `bun test` masking them, went red on
`kg:detangle:check` on its first run. That session numbered it the **twelfth**.

**Twelfth vs thirteenth is not a disagreement about the defect** — both name
`cat-harness/skills/graph-management/kg-detangle.ts`, both measured
`cat-harness/schemas` at 1441 against a clean checkout's 227, and both traced it
to `block-qa-schema/node_modules`. The counts differ because this bean's
enumeration was a syntactic filter over `scripts/*.ts` and neither count is
re-derivable from it: one of us was counting the original eleven plus this,
the other had a different starting list. **Neither number should be quoted.**
The enumeration is the thing to distrust, which is what the `Done when` below
already says — re-scope from `scripts/` to every walk in the repository, and
replace the file list with the experiment (install a subpackage's
devDependencies, run the writers, diff the committed artefacts).

That two independent instruments caught it within the hour, and that BOTH were
built for other purposes, is the argument for the experiment over the list: the
list found it never, and the list is what this bean shipped with.

The duplicate fixes converged too — that PR called `gitCorpus` and REFUSED
(exit 2) where `main`'s keeps the walk as a declared fallback via `corpusOf`.
`main`'s is the incumbent and the merge takes it; the refusing variant is noted
here only because the choice is real: a fallback that is documented and reached
only when git cannot answer is not the silent one that caused this.

