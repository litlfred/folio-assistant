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


## A TWELFTH, and it was outside the directory this audit swept

Found 2026-09-26, by CI rather than by looking: `cat-harness/skills/graph-management/kg-detangle.ts`.

Its `walk()` was a bare `readdirSync` recursion with no gitignore awareness —
the same shape as the eleven — but it is not under `cat-harness/scripts/`, which
is where this bean enumerated. So the count was right for the directory it
asked about and **the scope was the thing that was wrong**. A scanner is not
defined by living in `scripts/`.

### What it cost, which is more than the other eleven so far

The detangler's output is a **pinned measurement**, committed under
`test/results/detangle/`, so the pollution did not merely produce a noisy report
— it was **committed as the graph's shape**:

| `cat-harness/schemas` | `size` | `cohesion` |
|---|---|---|
| fresh checkout | **227** | 0.82 |
| a container where a gate had run `bun install` in a publishable subpackage | 1441 | 0.96 |

`cat-harness/schemas/block-qa-schema/node_modules/` — 2719 gitignored files —
counted as graph nodes, and the 1441 was what `main` carried. Every reader of
that sidecar, and the generated `docs/uml/overview/` pages that copy its
numbers, had a six-fold overcount for `cat-harness/schemas`.

It also made the check **unfalsifiable in the direction that matters**: green in
any container where the subpackage had been built, red on a clean runner, and
`kg:detangle:check` is step 37 of the `typescript` job — skipped behind main's
accepted `bun test` red, so CI had never once evaluated it. The first thing that
did was a new job deliberately built to run those checks without `bun test`
(bean `v625`), and it was red on its first run.

Fixed by calling `gitCorpus`, whose docblock already named the `rsi6` instance
of exactly this. Local and CI now both compute 227.

### The remedy this argues for, which is not "add one to the list"

A list of scanner FILES goes stale the moment one moves or a new one is written
elsewhere — this bean's own count is the demonstration. What is checkable is the
inverse: **does any committed artefact change when a subpackage's
devDependencies are installed?** That is one experiment over the whole corpus
and needs no enumeration.

### Adds to "Done when"

- [ ] the sweep is re-scoped from `cat-harness/scripts/` to every
      `readdirSync`/glob walk in the repository, wherever it lives. The
      enumeration missed one, and the one it missed was the only one whose
      output is committed
- [ ] MEASURED AFTER, and this is the clause that does not rot: with every
      publishable subpackage's devDependencies installed, run the full writer
      set and confirm NO committed artefact differs from a clean checkout's.
      Today `cat-harness/schemas.detangle.json` differs by 1214 nodes
