---
# folio-assistant-xd1g
title: 11 root-rooted scans have no gitignore awareness — ramz's sibling audit, answered
status: todo
type: task
created_at: 2026-09-25T16:21:48Z
updated_at: 2026-09-26T04:01:08Z
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

