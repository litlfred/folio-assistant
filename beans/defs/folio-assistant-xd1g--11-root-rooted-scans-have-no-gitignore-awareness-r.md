---
# folio-assistant-xd1g
title: 11 root-rooted scans have no gitignore awareness — ramz's sibling audit, answered
status: todo
type: task
priority: normal
created_at: 2026-09-25T16:21:48Z
updated_at: 2026-09-26T09:38:39Z
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
