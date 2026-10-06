---
# folio-assistant-xd1g
title: 11 root-rooted scans have no gitignore awareness — ramz's sibling audit, answered
status: completed
type: task
priority: normal
created_at: 2026-09-25T16:21:48Z
updated_at: 2026-09-27T16:36:36Z
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

**`cat-harness/skills/kg/graph-management/kg-detangle.ts` walks from `ROOT` and skips
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
`skills/kg/graph-management/`. The caveat said the list is a floor; this is the first
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
`cat-harness/skills/kg/graph-management/kg-detangle.ts`, both measured
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


## Re-measured 2026-09-27, and the list has moved

Of the eleven this bean names, **one has been converted since** --
`check-subgraphs` now asks git. Ten remain, plus `audit-coverage` (which
`biz4` hands over). So **11 bare walkers today**. `biz4`'s neighbouring note
that "six scanners have adopted gitCorpus" is true repo-wide but not of these
eleven, and that is the number this bean is about.

Done-when 2 is largely met already: `gitCorpus` in `schemas/git-corpus.ts` is
the shared rule, with 8 adopters. What was missing is adoption, a matching
helper for the glob-shaped callers, and the guard.

## Done-when 3 -- A SYNTACTIC CHECK DOES NOT WORK, measured

I built one and it failed its own falsifier, so it is not shipped. The numbers,
so the next reader does not rebuild it:

| filter | root-rooted scanners found | of this bean's twelve |
|---|---|---|
| binds a root const AND enumerates anything | **62** undeclared | all |
| enumeration SEEDED at a root const | **4** | 1 of 12 |

62 is unusable -- most are scanners reading one declared directory, which is
fine -- and declaring 62 exemptions I have not read would be the empty
exemption the check exists to refuse. 4 misses eleven of the twelve, because
they seed a recursion helper or pass the root as a PARAMETER. There is no
middle setting: the shapes are not syntactically distinguishable.

**What does work is behavioural**, and it is two-sided. Plant a file under a
gitignored tree the scanner's own denylist does NOT name, then compare the old
corpus with the new:

    before (bare walk + hand denylist)  35
    after  (gitScan, source=git)        34
    swept by old and not new            _kg/library/planted/manifest.jsonld
    in new and not old                  0   <- the conversion LOST nothing

Both halves are needed. Excluding ignored files is the point; losing real ones
is the risk, and a count going down looks like success either way. That control
is now a test rather than a session log.

## Landed

- `gitScan(root, pattern)` in `schemas/git-corpus.ts` -- Done-when 2's "stated
  once" for the glob-shaped callers. A Bun `Glob` over git's list rather than a
  git pathspec, because a pathspec's star crosses a path separator and a Bun
  single star does not: porting a pattern would change what it matches without
  changing a character of it. The no-git fallback is REPORTED in `source`, not
  silent (`kg-detangle`'s `corpusFallbacks` rule).
- `check-source-licence` converted, 1 of 11. Its hand-written denylist was an
  exact under-approximation of `.gitignore` -- `node_modules` is line 1 and
  `cat-harness/ingest-staging/` is line 219 -- so it named the two ignored
  trees somebody had been bitten by and a third swept in silently. That is
  `ramz`'s shape, confirmed rather than assumed.

## Open, and needs a decision before the other ten

Done-when 3's mechanism. Options as I see them: a behavioural probe per
scanner (reliable, needs each scanner to expose its corpus); an `@corpus`
declaration on every filesystem-enumerating script, `3srh`-style (63 files, one
line each, but the classification is the real work); or accept the syntactic
floor as advisory, which is the `1xhc` shape this repository has just spent a
PR arguing against.


## All eleven converted -- 2026-09-27, PR #1456

Done-when 1 is met: every one of the eleven enumerates from git.

| scanner | before | after | swept |
|---|---|---|---|
| check-source-licence | 35 | 34 | planted `_kg/.../manifest.jsonld` |
| check-code-accounting | 1472 | 1471 | `block-qa-schema/dist/index.d.ts` |
| check-viewer-backticks | 890 | 889 | the same file |
| ns-export (minted terms) | 936 | 935 | the same file |
| check-agents-claims | 1290 | 1290 | -- |
| check-image-roles | 1294 | 1294 | -- |
| check-docs-templates | 6 | 6 | -- |
| bpmnFiles x3 (lane, process, glossary-export) | 74 | 74 | -- |
| audit-coverage / census | -- | -- | -- |

Nothing gained anywhere, so every one is a strict narrowing. Two live
instances: `check-code-accounting`, whose subject IS accounting for code, was
counting gitignored build output as repository source; and `ns-export` would
have minted a namespace term from a generated `.d.ts`.

Done-when 2: `gitScan(root, pattern)` for the glob caller and
`gitFiles(root, keep)` for the ten walks, both in `schemas/git-corpus.ts`. The
dot rule deliberately does NOT come for free -- git's corpus includes
`.github/` and `.claude/`, so folding one in would silently change what several
scanners read.

## Done-when 3 -- ANSWERED, and the answer is not a gate

The syntactic check failed its own falsifier (62 loose / 4 tight, the tight one
missing eleven of twelve; numbers in the earlier entry). The guard is
behavioural and lives with the conversions:
`scripts/tests/git-corpus-conversions.test.ts`, one case per scanner,
asserting BOTH directions -- nothing the new corpus admits was absent from the
old, and everything the old admitted and the new does not is gitignored. Plus a
case asserting the control itself still discriminates, so it cannot go vacuous.

A scanner that regresses to a bare walk fails its own case. That is "number
twelve is caught" by a different mechanism than the bean assumed, and the
reason the assumed one does not work is recorded above rather than left for the
next agent to rediscover.

## A correction worth keeping

I measured `audit-coverage`'s `census` over the REPOSITORY ROOT -- 31437 files
before, 14135 after, 17302 swept, all gitignored -- and nearly committed it as
what that scanner had been doing. It is not: `census` is called on declared
graph directories only, none of which holds ignored content, and the sidecar
moves by timestamp and script hash alone. Caught by diffing the sidecar
numerically rather than trusting the number in hand. A measured number on the
wrong input is worse than none, because it reads as evidence.

## Still open

The standing warning *"never run audit:coverage in this container"* is now
unexplained rather than answered: with `census` asking git, and with every
declared directory clean, I could not reproduce what it warns about. It may be
stale, or about a container whose declaration set differs. Left recorded rather
than deleted.

---

## Reconciling the two sessions on this bean — 2026-09-27T08:4x

Two sessions worked `xd1g` in parallel. The entries above are BOTH kept, and
they do not conflict: one converted the eleven scanners the bean names, the
other found a twelfth (`kg-audit`) and measured the whole remaining set. The
merge of `schemas/git-corpus.ts` was likewise additive -- `gitScan` (glob
callers), `gitFiles` (walk callers) and `corpusPredicate` (a single-file test)
are three shapes of one rule, not three versions of one function.

**The sibling's correction is right, and it lands on my own claims.** Their
entry says counting walks counts a SHAPE rather than an EFFECT, and that across
this bean's lifetime exactly one scanner (`kg-detangle`) ever had a live effect.

I checked my eleven against that standard rather than defending them. Of the
four whose CORPUS changed -- `check-code-accounting` 1472->1471,
`check-viewer-backticks` 890->889, `ns-export` 936->935 (all three dropping the
gitignored `block-qa-schema/dist/index.d.ts`), and `check-source-licence`
35->34 against a file I planted -- **not one moved a committed verdict**. Every
sidecar that moved in those commits moved by `script_hash` and `updated_at`
alone, measured by diffing them numerically.

So: **all eleven conversions are LATENT, zero live**. My PR #1456 body implied
otherwise by calling `check-code-accounting` a live instance -- its corpus was
live, its output was not -- and that has been corrected there too.

**Where I think the two sessions' conclusions differ, and it is narrow.** The
sibling writes that a sweep "would be unfalsifiable work: no test could show it
fixing anything", and proposes a DETECTOR instead: *does a scanner's committed
output change when gitignored content is present?*

The sweep as done is falsifiable at the CORPUS level -- the two-sided control in
`scripts/tests/git-corpus-conversions.test.ts` shows per scanner exactly which
files were dropped, that each is gitignored, and that none was lost. What it
does NOT show is the output question, which is the sibling's point exactly. So
their detector is not an alternative to this work; it is the layer above it, and
it is the thing still missing.


---

_2026-09-27T07:09:15Z_ — Claimed by claude/kg-detangle-git-corpus — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## `kg-audit.ts` IS one of the disk-walking scanners — measured, with the files named

2026-09-26, found while diagnosing a CI failure on PR #1425. Recorded with an
important caveat attached, below, because the obvious conclusion turned out to be
wrong.

`kg-audit.ts` builds its page corpus with a bare `readdirSync` walk that excludes
only three names — `_site`, `node_modules`, `vendor`:

    if (e.name.startsWith("_site") || e.name === "node_modules" || e.name === "vendor") continue;

**A name list cannot be complete, and this one is not.** Measured in this
container against `git ls-files --others --ignored --exclude-standard`: SIX
gitignored `.md` / `.html` files exist here that a fresh checkout does not have,
and not one of them matches an excluded name —

    _kg/cat-harness/index.html
    _kg/fixtures/cat-harness/index.html
    _kg/fixtures/folio-assistant/index.html
    _kg/folio-assistant-i18n-fixture/index.html
    _kg/folio-assistant/index.html
    cat-harness/schemas/block-qa-schema/.pytest_cache/README.md

All six are read and concatenated into `pages`, which every criterion asking
"is this mentioned on a page?" is evaluated against. So that corpus is
environment-dependent, which is this bean's subject exactly.

There is a second bare walk in the same file, `skillFiles()`, not yet measured.

### The caveat, and it is the part that matters

**This is NOT established as the cause of the CI failure I was chasing**, and I
nearly recorded it as one. The mechanism fit perfectly — red in CI, green in this
container, a disk walk reading six files CI cannot see. I wrote the `gitCorpus`
fix and ran the writer, and **not one sidecar changed.** The only diff was
`kg-qa.manifest.json`'s `script_hash`, which moved because I had edited the
script.

So the six files demonstrably affect nothing in today's corpus. What the fix buys
is that they CANNOT start affecting it — a latent environment dependence rather
than a live one, which is worth fixing and is not worth claiming as a diagnosis.

Two reproductions were needed to get to that: this container clean, and a
pristine `git clone` of the exact commit with `bun install --frozen-lockfile` and
nothing else. Both exit 0. That second one is the measurement this bean should
insist on generally — "green on my machine" is worth nothing when the whole
subject is the machine.

### The fix, written and held back

`gitCorpus(repoRoot, ["*.md", "*.html"])`, with a predicate that drops a file
only when it is under the repository AND git does not list it — so a layer in a
SIBLING checkout (`docsLayers` can return one) is kept rather than silently
dropped, and `undefined` from `gitCorpus` keeps everything, because git being
unable to answer is not an empty answer.

Held out of PR #1425 rather than tacked onto it: it belongs to this bean on its
own merits, not to that PR on a coincidence.

### Adds to "Done when"

- [x] `kg-audit.ts` identified as a disk-walking scanner, with the six files it
      wrongly reads NAMED rather than described
- [ ] the `gitCorpus` fix for it lands, on its own change. MEASURED AFTER: the
      six files are present and no sidecar differs from a pristine clone's
- [ ] `skillFiles()` in the same file — the second bare walk, not yet measured


## `kg-audit`'s page corpus now asks git — and the OTHER walk is measured CLEAN rather than fixed

2026-09-26. The held fix landed, with the two things it was missing: a home where
it can be tested, and a test that can fail.

### Fixed: the page-corpus walk

`corpusPredicate` now lives in `schemas/git-corpus.ts` beside `gitCorpus`, and
`kg-audit.ts` imports it. Four states kept apart, each with a test:

| case | answer | why |
|---|---|---|
| git listed it (tracked, or untracked-and-not-ignored) | in | a file a contributor just wrote is part of the corpus; `--cached` alone would make the audit disagree with itself between `git add` and `git commit` |
| under the repo, git did not list it | **out** | gitignored — the defect |
| not under the repo | in | `docsLayers` can return a SIBLING checkout, which cannot be judged by this corpus; dropping it would be a clean run over unread content (`dh4f`) |
| git could not answer | in, everything | an unanswerable question is not an empty answer |

**Mutation-tested by hand**, four mutations, each red on the test that names it:
`undefined` read as an empty corpus; outside-the-repo dropped; the trailing
separator removed from the prefix test (so `<root>-other/…` reads as inside);
and the gitignored case admitted, i.e. the defect restored.

### NOT fixed, because it has no measured exposure: `skillFiles()`

The second bare walk. Measured against
`git ls-files --others --ignored --exclude-standard` over the real kg roots:

    cat-harness/skills   ignored=0  untracked=0
    bootstrap/skills     ignored=0  untracked=0

The 17 ignored `.md` under a `skills/` path in this container are all inside
`node_modules/playwright/.../skills/playwright-cli/`, which is **not** under
`ownKgRoots(root)`, so the walk never reaches them. It also walks DECLARED roots
rather than every docs layer, and filters through `isSkillMd`.

So it is latently unguarded and currently clean. **Left alone deliberately: a fix
with no measured effect is a fix no test can demonstrate**, and shipping one into a
hot path would be the same over-claim this bean exists to catch, pointed inward.
The one-line predicate is now exported and applies the day it matters.

### A finding that belongs to `9v4m`, found by trying to test this

`kg-audit.ts` has **no `import.meta.main` guard**. Its body is top-level and ends
`process.exit(0)`, so *importing* it runs the entire audit and then kills the
process — which is why the first version of this test produced audit output and no
test summary, and why the predicate had to move rather than be exported in place.

**That is the mechanism for `9v4m`'s `declared-directory-resolves` failure**, which
I had recorded as "a sibling in the same process" and left without a named cause.
The test spawns an import of every module that resolves a declared directory;
`kg-audit.ts` is one, so the test ITSELF runs the audit and rewrites sidecars. On a
clean tree those writes are no-ops and `git status` is unchanged, so it passes. On a
dirty tree they regenerate against uncommitted sources and produce real
modifications — the 13 it reported. **The probe causes the writes it detects.**
Cross-referenced on `9v4m`; the remedy is a guard on `kg-audit.ts`, which is a
structural change to a 2000-line top-level script and is not taken here.

### Done when

- [x] `kg-audit.ts`'s page corpus asks git — landed, tested, mutation-tested
- [x] `skillFiles()` measured — 0 ignored, 0 untracked under the real kg roots;
      not fixed, and the reason recorded
- [ ] an `import.meta.main` guard on `kg-audit.ts`. MEASURED AFTER: importing it
      writes nothing and does not exit the importing process. Owner's call — it
      restructures a hot script


## The remaining scanners MEASURED — one live defect in the whole set, and it was already fixed

2026-09-27, on the owner's instruction to measure the rest rather than trust the
count. The result changes how this bean should be read.

### The enumeration, with its basis stated

`git ls-files '*.ts'`, excluding tests:

| | |
|---|---|
| non-test `.ts` calling `readdirSync` | **227** |
| already asking git (`gitCorpus`) | 5 — `check-context-emission`, `check-kind-validators`, `gen-uml-overview`, `kg-audit`, `kg-detangle` |
| unguarded | **222** |
| of those, RECURSIVE **and** seeded from a root identifier | **2** |

222 is not 222 defects. A `readdirSync` over one declared directory cannot read
gitignored content unless gitignored content is there, and most of these scan a
fixture, a temp directory, or a single declared subdirectory. **The dangerous
shape is a recursive walk seeded from a repository root**, which is what this
bean's "root-rooted" meant, and that narrowing is a STATIC approximation — it
requires the seed to be a root identifier at the call site, so it can miss a
scanner that computes its root indirectly. Stated rather than presented as
exhaustive.

### The two, and their exposure measured rather than reasoned

**`content/pipeline/orphan-verdict-sweep.ts`** — walks
`join(repoRoot, BLOCK_QA_RESULTS_DIR)` = `test/results/block-qa`.
Ignored files under `cat-harness/test/results`: **0**. Untracked: 0. No exposure.

**`scripts/external-schemas.ts`** — walks `directoriesForGraph(root, "code")` and
`directoriesForGraph(root, "schemas")`, and `cat-harness/schemas` holds **2743
gitignored files** in this container: the same `block-qa-schema/node_modules` that
took `kg-detangle` from 227 nodes to 1441. So the walk genuinely reads files a
fresh checkout does not have — **1004 of them are `.ts`**, which is the extension
it keeps.

And then the decisive measurement: of those 1004, **0 contain `@context`**, which
is the filter the extraction applies before taking any URL. So the effect on the
output today is **nil**. Latent, not live — the same verdict as `skillFiles()`.

### What this means for the bean, and it is a correction of emphasis

Across every scanner examined in this bean's lifetime, **exactly one had a live
effect: `kg-detangle`**, and it is fixed. `kg-audit` was fixed today and its
exposure was latent (6 files read, 0 sidecars changed). `skillFiles()` and both
scanners above are latent with 0 live effect.

So "11 root-rooted scans have no gitignore awareness" is true as stated and
**overstates the live risk**, because it counts a shape rather than an effect. The
distinction that matters is LIVE versus LATENT, and it can only be settled per
scanner by asking what its filter admits — not by counting walks.

A sweep of all 222, or even of the 2, would therefore be unfalsifiable work: no
test could show it fixing anything. What is worth building instead is a DETECTOR —
does a scanner's committed output change when gitignored content is present? That
is the question every one of these measurements had to answer by hand.

### Done when

- [x] the remaining scanners enumerated and measured, with the enumeration's
      basis stated and its approximation admitted
- [x] `external-schemas.ts` — 1004 ignored `.ts` read, 0 matching the `@context`
      filter, so 0 live effect
- [x] `orphan-verdict-sweep.ts` — 0 ignored files under its scan root
- [ ] a detector, not a sweep: for each generated artefact, does its writer's
      output change when gitignored content exists beneath its scan root?
      MEASURED AFTER: it reports `kg-detangle`'s pre-fix state as live and the
      latent ones as latent, distinguishing them WITHOUT a hand measurement


## A 3-command reproduction, measured 2026-09-27 (PR #1462)

`audit:coverage` is one of the gitignore-unaware root-rooted scans, and the
failure it produces is *indistinguishable from a stale committed sidecar* — it
even tells you to commit the wrong thing.

Symptom: `bun run audit:coverage:require-all` and `:strict` both exit 1 with

    the committed sidecar at cat-harness/test/results/audit-coverage.qa-results.json
    disagrees with this run — run `bun run audit:coverage` and commit it.

The whole disagreement is ONE directory. Diffed semantically rather than by
`git diff`, which calls the sidecar binary:

    cat-harness.directories   committed:   [cat-harness/schemas, folio-assistant-core/schemas, large-datasets/schemas]
                              regenerated: [... , "schemas"]
    schemas.directories       committed:   [bootstrap/schemas, cat-harness/schemas, folio-assistant-core/schemas,
                                            large-datasets/schemas, large-datasets/sources]
                              regenerated: [... , "schemas"]

`schemas/` is `schemas/generated/` — **ignored by `.gitignore:25`** and holding
8 generated files (`SKILLS.md`, `index.json`, the `*.schema.json` several
package manifests reference). A fresh CI clone has no generated output, so the
committed sidecar cannot contain it, and any checkout that has run the
generators cannot match the committed sidecar.

Proof, non-destructive:

    mv schemas /tmp/held && bun run audit:coverage:require-all   # -> 0
                            bun run audit:coverage:strict        # -> 0
    mv /tmp/held schemas  && bun run audit:coverage:require-all  # -> 1

## Why this one is worth its own line

The other scans in this bean report a wrong COUNT. This one reports a wrong
REMEDY: following the message commits a gitignored directory into the sidecar,
which then disagrees with CI in the other direction. So the gate is not merely
noisy locally — acting on it breaks the branch.

Noted while verifying PR #1462 (kg:audit needs-closure skill resolution). Not
fixed there: it is this bean's subject, not that PR's.

## Done-when 3 SHIPPED on the owner's ruling -- 2026-09-27

The owner chose (options "1 3") to ship the syntactic census despite my
objection that a check which cannot fail is the `1xhc` pattern. Recorded here
as their decision, and in `scripts/root-scan-census.ts`'s own docblock, rather
than re-argued.

**Built so it fails on something real.** Advisory on the findings -- gating on
a backlog is the wall somebody switches off, which is `2krx`'s reasoning and it
is right. HARD on the drift: the sidecar at
`cat-harness/test/results/root-scan-census.qa-results.json` is committed and
`root-scan-census:check` exits 1 when it disagrees with the tree. That is
`audit-coverage`'s arrangement, and it is what "cannot drift" actually
requires.

### The defect it had for one run, and why it matters here of all places

First output: **"57 enumerating scripts, 1 asks git"** -- on a tree where eleven
had just been converted. A conversion REMOVES the `readdirSync` the population
was keyed on, so every fixed scanner dropped out of the denominator instead of
moving to its good side. **The headline would have got worse as the corpus
improved.** That is this bean's own failure shape, committed inside the census
built to report on it. `ENUMERATES` now admits the git spellings and the first
test pins the property.

Now: **66 enumerating, 10 ask git; 3 seeded at a root and not git-aware** --
`check-artifact-index`, `gen-default-boards`, `sync-docs-harness`. **None was in
this bean's eleven.** So the census found three candidates on its first honest
run, which is the strongest argument for the owner's call over my objection.

### Still a floor, and it says so in its own output

Both filters are syntactic: the loose one over-counts (a walk over one declared
directory is fine), the tight one under-counts (a recursion helper or a root
passed as a parameter defeats it -- a test asserts that miss rather than
papering over it). The GAP between 66 and 3 is the finding: it is why a
syntactic check cannot answer this question, and why the real guard stays
behavioural in `scripts/tests/git-corpus-conversions.test.ts`.

### Obligations the new gate owes, both met

`check:artefact-verification` -- declared under `verified` with the four
consumer-side questions its test asks. `check:partition` -- harness, for
`check-subgraphs.ts`' reason.

### One CI red worth keeping

My own test asserted `swept > 0`, true only because this container has build
residue a clean checkout does not. **This bean's defect, in the test guarding
the fix for it.** Reproduced by moving `dist/` aside; fixed so the suite passes
both with the residue and without.
