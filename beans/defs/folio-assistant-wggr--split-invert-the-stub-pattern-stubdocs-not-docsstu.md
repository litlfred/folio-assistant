---
# folio-assistant-wggr
title: 'SPLIT: invert the stub pattern — <stub>/docs not docs/<stub>, so a repo is one directory'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T11:51:29Z
updated_at: 2026-09-19T15:44:31Z
parent: folio-assistant-vke6
---

Owner direction, 2026-09-19: "dont do docs/<stub> tools/<stub> etc, rather do <stub>/docs and <stub>/tools. update the references/graph/dirs and then move is much cleaer.... this dir is this repo. and we can do more QA here before separation. so there would be in top-level only bootstrap/ cat-harness/ f-a-core/ etc. all content migrated to respective expexted dirs. also keeps URI/IRIs not so redundant."

## What changes

The stub pattern INVERTS. `docs/<stub>/`, `tools/<stub>/`, `skills/<stub>/` become `<stub>/docs/`, `<stub>/tools/`, `<stub>/skills/`. The top level then holds one directory per instance and nothing else that belongs to an instance.

WHY IT IS BETTER, and each reason is independent:

1. SEPARATION BECOMES A MOVE, NOT A SIFT. Today extracting cat-harness means walking every top-level directory and taking the `cat-harness/` subdirectory out of each. After, it is one `git mv` of one directory. The current `repo-partition.ts` exists precisely because the cut is hard to compute; under the inversion the directory IS the answer.
2. THIS DIRECTORY IS THIS REPO. A reader opening `cat-harness/` sees everything that repository will contain, rather than reconstructing it from eight places.
3. THE IRIs STOP REPEATING THEMSELVES. `.../folio-assistant/docs/folio-assistant/...` is the shape today. The stub appears once.
4. QA BEFORE SEPARATION. Everything can be checked in one checkout while the pieces are still together — which is the argument for doing this BEFORE the split rather than as part of it.

## How to do it, and the order is the whole plan

DECLARATION AND READERS FIRST, FILES SECOND. Update `harness.json`, `schemas/cat-harness.ts` defaults, and every consumer to resolve the new shape while the files are still where they are; verify green; and only then `git mv`. That way the move is the cheap half and the gates prove it landed rather than being the thing that discovers the breakage. The reverse order makes every gate red at once with no way to tell which failure is which.

This is affordable now in a way it was not this morning: `directoryForGraph()` and `kgRoots()` exist and 90 of 127 hardcoded declared-path literals are drained, so most consumers already ask the declaration. `check:declared-paths` names the ones that do not — the remaining 37 are the work list, not a guess.

## Two questions the owner has not answered

- DOES `bootstrap/` BECOME A STUB LIKE THE REST, or stay top-level? It is already in the new shape, which is a useful accident. But it is also the one thing that must be readable BEFORE any stub is resolved, so an argument exists for it being special. Asked, not assumed.
- DO `beans/` AND `todos/` STAY TOP-LEVEL? The owner said earlier they do not take the stub pattern, because they are never overlaid. If that holds, the top level is `bootstrap/ cat-harness/ f-a-core/ beans/ todos/` — five entries, not three.

## Collision to watch: fsh-guts

PR #403 (`claude/brave-hypatia-r820sf`) adds `fsh-guts/` as a NEW top-level directory — the not-rendered store for deprecated material — and moves the four proposals into it. That is a sixth top-level entry and it is not an instance stub, so whatever rule this bean settles has to say where a non-instance top-level directory stands. Verified on the branch, not from its description.

Same PR is a live conflict for a different reason: it deletes `docs/folio-assistant/proposals/`, which now holds `bootstrap.md` created after they branched. Raised on the PR rather than resolved unilaterally.

## Sibling sessions in flight, measured 2026-09-19 ~11:50 UTC

Four PRs opened within the hour, all of which this move would conflict with if it landed first: #410 (roadmap epics, beans only), #409 (readme:audit in CI — which will make a dead README link a RED BUILD once this moves docs), #408 (note anchors), #403 (fsh-guts, above). `ListAgents` reports no live peer session, so coordination is through this bean and the PRs, not messaging.

THE SEQUENCING CONSEQUENCE: this touches nearly every path in the repo, so it should land when the in-flight set is small, and the four above should merge first. A move of this size that jumps the queue costs four sessions a conflict each.

## Answered — bootstrap is top-level, and is the ONE exception

Owner, 2026-09-19: "boottreap is top level but will be a part of cat-harness (one exception for top-leve vs repo name)".

THE RULE, stated fully: a top-level directory's name IS a repository name. Exactly one directory breaks it — `bootstrap/`, which sits at top level but SHIPS INSIDE cat-harness.

WHY THE EXCEPTION IS THE RIGHT ONE, and it is not convenience. Bootstrap's whole job is to be readable BEFORE the reader knows which stub to resolve. Putting it at `cat-harness/bootstrap/` makes that circular: an agent would have to already know cat-harness is the harness in order to find the file that tells it what a harness is. Every other directory can be found once you know the instance; this one is what you read to find out.

So `bootstrap/` is top-level for RESOLUTION and part of cat-harness for OWNERSHIP, and those two facts do not have to agree. Worth saying plainly because a later reader will see a top-level directory that no repository is named after and try to tidy it away.

## Still open, and the answer above sharpens rather than settles it

"One exception" and the earlier rule that `beans/` and `todos/` take no stub cannot both be read the loose way. Two readings reconcile them and they lead to different trees:

(a) THEY STAY TOP-LEVEL — then there are three exceptions, not one, and the rule as stated is wrong.

(b) THEY LIVE IN EXACTLY ONE STUB — `cat-harness/beans/`, `cat-harness/todos/`. "Takes no stub pattern" then means what it originally meant: they are never OVERLAID across instances, one directory per instance merging into a whole. That is a different claim from "sits at the top level", and (b) keeps the exception count at one.

(b) is the reading consistent with both statements, so it is what this bean assumes until told otherwise. Recorded rather than silently adopted because it moves two committed stores and every path that reads them, and being wrong about it is expensive.

`fsh-guts/` from PR #403 is a third case the rule has to answer: a top-level directory that is neither a repository name nor bootstrap. Under (b) it is a second exception, which the rule as stated does not allow.

## Answered — beans/ and todos/ stay top-level (reading (a))

Owner, 2026-09-19: "beans/ todos/ stay top-level". This bean had recorded reading (b) as its working assumption and (b) is WRONG. Corrected here rather than edited away, because the next reader should see that the loose reading was tried and rejected.

WHAT THE RULE ACTUALLY IS, restated so it covers every case now known:

The top level holds three kinds of thing.

1. INSTANCE STUBS, each named after the repository it becomes: `cat-harness/`, `f-a-core/`, `f-a-sci/`. This is the set separation walks.
2. NON-INSTANCE STORES that are never overlaid and belong to no single instance: `beans/`, `todos/`, and `fsh-guts/` (PR #403). "Takes no stub pattern" means exactly this — not that they sit anywhere in particular, but that there is one of each and it is not composed from per-instance parts.
3. `bootstrap/` — instance-SHAPED (it ships inside cat-harness) but not named after a repository. This is the one exception the owner named, and it is an exception within category 1, not against the whole top level.

So "one exception for top-level vs repo name" is a claim about the INSTANCE-shaped directories: every one is named after its repository except bootstrap. It was never a claim that the top level contains nothing else.

That reading makes all three owner statements consistent — beans takes no stub, bootstrap is the one exception, top level holds bootstrap/ cat-harness/ f-a-core/ — where (b) had to contradict the first to keep the second.

## What this settles for the migration

The directories that MOVE are exactly the per-instance parts of `docs/`, `tools/`, `skills/`, `schemas/`, `library/`, `voices/`, `translations/`. The stores that DO NOT move are `beans/`, `todos/`, `fsh-guts/`, and `bootstrap/` is already where it will stay.

That is a smaller migration than the first framing implied, and it removes the expensive half: no committed work-plan store moves, so no path that reads a bean or a todo changes, and `.beans.yml` and `WORKFLOW_DIR` — the two duplicates `check:harness-dirs` gates because neither can be removed — are untouched.

## Measured — a config file that names the site root will NOT be caught by the code guard

_2026-09-19T13:40Z, on `0f110b294`._ Pass 1 moved the site root by changing one
function, and every one of 73 code references already went through
`siteDir`/`siteDirFor`. That was true, and it is why the code half looked free.

`.gitignore` is not code. It named the site root **five times**, every one
still `docs/`, while `docs-site.yml` had already been pointed at
`./folio-assistant/docs` — so it broke in both directions at once:

- `!docs/assets/js/` and `!docs/_includes/*.js` stopped reaching the moved
  tree, so the blanket `*.js` rule swallowed it. The three files already there
  survive only because git does not untrack what is tracked; a NEW asset under
  the site root would have been invisible to `git add`. **The comment beside
  that negation records this exact failure happening before**, verbatim:
  "`git add` reported nothing and the file would simply never have deployed."
- `docs/.bundle/` and `docs/vendor/` stopped reaching it too, unignoring the
  bundler gem tree — which the same comment prices at **3,080 files and 53 MB**
  that any `git add -A` sweeps into a commit. Measured that morning;
  reintroduced that afternoon by this move.

**Neither was visible, and the reason generalises past `.gitignore`.** A
working tree that predates the move still HAS a `docs/`, holding build
residue, so the stale rules went on matching something. A rule that matches
the wrong thing reads exactly like a rule that matches the right thing —
which is why "I moved the site root and nothing broke" was not evidence.

Fixed, and guarded in `site-dir-single-answer.test.ts`: it asserts what git
DOES to a probe path (assets stay addable, build state stays ignored) rather
than how the rule is spelled, and it is perturbed both ways — reverting either
half fails it alone.

### What this means for the `cat-harness` rename, which is the next step

The guard composes its probes from `siteDirFor(ROOT)`, so renaming the stub
flips it to red until `.gitignore` follows. That is the intended behaviour and
should not be worked around.

Checked each non-`.ts` file that can name the site root, rather than assuming:

- [ ] **`.github/workflows/*.yml` — outstanding, and the largest.**
      `docs-site.yml` carries `folio-assistant/docs` in five places, including
      a literal `source: ./folio-assistant/docs` and the `paths:` trigger that
      decides whether the workflow fires AT ALL; `feature-staging.yml` the
      same. A stale `paths:` is the `xom7` shape — the site silently stops
      redeploying, and nothing says so.
- [x] **`eslint.config.mjs` — already fixed in pass 1, and it is the pattern
      to copy.** Its ignore glob was `docs/**/_includes/`, which broke the
      moment the stub inverted and got a Jekyll Liquid fragment linted as
      TypeScript. It is now `**/docs/**/_includes/`, which the comment states
      "survives the site root moving in EITHER direction" — a glob loose
      enough to be indifferent to the layout beats a literal that has to be
      maintained, wherever correctness does not need the precision.
- [x] `.gitignore` — fixed and guarded above.

**`folio-assistant/docs/_config.yml` is a TRAP, not a to-do.** It carries
`baseurl: "/folio-assistant"`, and I nearly listed it as something the rename
must update. It must NOT be touched. `baseurl` is the PUBLISHED base path,
which on GitHub Pages follows the REPOSITORY name — it is unrelated to the
stub directory the sources happen to sit in. Renaming `folio-assistant/` to
`cat-harness/` changes where the sources live and nothing about where they
publish. Anyone running a find-and-replace of `folio-assistant` across the
repo breaks every published URL in one commit, and the site would still build
green.

That is the same `canonicalUrl`-vs-path distinction the declaration already
draws, arriving in a file that is not the declaration.

The lesson to carry, not just the list: **pass 1's "it was one function" was a
measurement over `.ts` only.** Every config format in the repo spells the site
root a second time, none is covered by the guard that made pass 1 look cheap,
and one of them looks like it needs updating when it must be left alone.
