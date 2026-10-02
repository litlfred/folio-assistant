---
# folio-assistant-yzsj
title: 'gh-pages RACE IS BACK: xd1s closed with nine push sites grouped; three are outside it now and docs-site has NO retry — main went red 19:53'
status: completed
type: task
priority: normal
created_at: 2026-09-20T20:02:00Z
updated_at: 2026-09-20T21:48:19Z
parent: folio-assistant-1xhc
---

Found 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus) after merging #589, whose
`Docs site (GitHub Pages)` run **failed on `main`**. The failure is not #589's
content — it is the publish-ref race, and it is the one `xd1s` closed.

## What actually failed

Run 308, `4af80f84cf`, 19:53:01Z:

```
[command]/usr/bin/git push origin gh-pages
 ! [rejected]        gh-pages -> gh-pages (fetch first)
error: failed to push some refs
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref.
```

Byte-for-byte the error `docs-site.yml:59` names in its own comment as *"what
PR #297 hit on 2026-09-18"*. Run 310 then **succeeded** on `cdbde30b`, so
`main` is green again and this is not an outage — which is exactly why it will
keep happening quietly.

## The state `xd1s` left, and the state today

`xd1s` is `completed`, on the finding that *"a group serialises only the jobs
that NAME it"* and the fix that **all nine push sites** name `gh-pages-push`.
That invariant does not hold any more. Measured on this tree, every workflow
touching `gh-pages` and the groups it declares:

| workflow | in `gh-pages-push`? |
|---|---|
| `blueprint.yml` | yes |
| `docs-site.yml` | yes |
| `lean_ci.yml` | yes |
| `publish.yml` | yes |
| `feature-staging.yml` | **no — deliberately, with a measurement** |
| `discoverability-docs.yml` | **no — no stated reason** |
| `deploy-folio.yml` | **no concurrency block at all** |

Re-run this before quoting it; it is a property of the workflow files, which
move.

**`feature-staging`'s opt-out is correct and must not be "fixed".**
`feature-staging.yml:94` carries the reason and the evidence: a pending job in
a shared group is **cancelled**, not queued — `cancel-in-progress: false`
governs the RUNNING job, not the pending one — so a third arrival silently
drops the second. Measured 2026-09-19 across three different branches in 17
seconds. `xd1s`'s own second note records the same mode firing routinely. So
the group cannot be completed by simply adding the three back; that trade was
already made and measured, and re-making it re-introduces silent drops.

## The actual gap: the group's most dependent member has no fallback

`feature-staging` opted out **and compensated** — three attempts, rebasing
between (`feature-staging.yml:734`, *"`gh-pages` is the most contended"*).

`docs-site.yml` did the opposite. It is **in** the group, so it trusts it, and
it has **no retry at all**: `grep -niE "retry|attempt|rebase|for i in|until "`
over the file returns **nothing**. Its publish is a bare
`peaceiris/actions-gh-pages@v4`, which does not retry.

So the one publisher that fires on **every push to `main`**, and is the one a
person actually looks at, is the only one with neither an opt-out plus retry
nor protection from the three pushers outside the group. That is why run 308 is
fatal where a staging race is merely slow.

## Why this is worth fixing rather than tolerating

`check:ci-health` on the same tree reports **31 of 100** recent `gh-pages`
deployments `cancelled`, against 67 succeeded and 0 failed. Its own text
separates self-inflicted double-pushes (`bm6d`, 8 of them) from *"several
sessions racing for the publish ref"* — the rest. A third of publishes are lost
to contention on the path that renders **goal 2** (the LHS navbar with folios)
and **goal 3** (who-iris with themed assets). Neither goal can be reviewed from
a description; both are judged by looking at the published site.

Note the `check-ci-health` prose attributes the racing to bean `6pfo`. It does
not fit: `6pfo` is *"publish staging metadata as a KG graph"*, a different
subject. That citation should point here or at `xd1s`.

## The fix this points at

Give `docs-site.yml` the fetch-rebase-retry `feature-staging` already has,
rather than trying to widen the group. It costs nothing when uncontended,
needs no trade against the pending-cancellation mode, and turns a red main into
a slower green. `discoverability-docs.yml` and `deploy-folio.yml` should then
either join the group or say why not — an opt-out with a measurement is fine,
an opt-out with silence is what made this invisible.

**Not started, and not claimed** — filed so the next session does not
re-diagnose it from the same log. `xd1s` is `completed` and is **not** this
bean's to reopen; this is the residue after it, not a claim that it was wrong.

## CORRECTION, same session: the fix above understates it, and the exposure is wider

The section above recommends *"give `docs-site.yml` the fetch-rebase-retry
`feature-staging` already has"*. Measured before starting, that is **not a
transplant**, and `docs-site` is **not the only one exposed**.

### Why it is not a transplant

`feature-staging` checks `gh-pages` out itself into `pages/`, commits, and
pushes — so it *can* wrap its own `git push` in a loop
(`feature-staging.yml:738`, three attempts, `pull --rebase` between, backing
off through `scripts/backoff-sleep.ts`).

`docs-site` hands the whole clone-replace-commit-push to
`peaceiris/actions-gh-pages@v4` in one step. **The race window is inside the
action**, so there is nothing to wrap. Adding a retry means replacing the
publish step with a manual loop — on a path that carries documented
full-replace semantics (`docs-site.yml:384`, *"`keep_files: true` is NOT the
fix"*) and a post-push verifier that reads `.staging-restored.json` and
deliberately fails the job to avoid the `plj1` silence. That is surgery on the
publish path, not a robustness tweak, and it is why this bean stays **filed,
not started** rather than being done on an agent's own judgement.

### The exposure is ONE workflow, not four — measured, not read

A first pass here said four workflows publish through `peaceiris` with no retry
(`blueprint`, `docs-site`, `lean_ci`, `discoverability-docs`) and called
`discoverability-docs` the sharpest case for being outside the group as well.
**That was read off the workflow FILES and is wrong about this repository.**
`xd1s` already said so in prose; this bean's own rule is never to quote a count
from prose, so it was measured:

| workflow | runs EVER in this repo | retry | in `gh-pages-push` |
|---|---|---|---|
| `feature-staging.yml` | **1210** | yes (8) | **no — deliberately** |
| `docs-site.yml` | **313** | **none** | yes |
| `blueprint.yml` | **0** | none | yes |
| `lean_ci.yml` | **0** | none | yes |
| `discoverability-docs.yml` | **0** | none | no |
| `publish.yml` | 1, in June | partial | yes |

A workflow that has never run cannot lose a race and cannot cause one. So
three of the four "exposed" files are not exposed to anything, and
`discoverability-docs` — named above as the worst case — is pushing to nothing.

### What is actually true, and it is worse than the first reading

**Two workflows contend for `gh-pages` here. The lock separates them.**

- `docs-site` is **inside** `gh-pages-push`, where its only fellow members are
  three workflows that have never run. The lock holds it against **nobody**.
- `feature-staging` is **outside** the lock, by a deliberate and measured
  trade, and runs **1210** times against `docs-site`'s 313 — roughly four
  pushes to `gh-pages` for every one of docs-site's.

So `docs-site` carries the cost of a serialisation group that protects it from
zero actual pushers, and meets the one real contender with no lock and no
retry. That is why 19:53 was fatal: the group was never going to help, and
there was nothing else.

It also means **completing the group cannot fix this**. Adding the three
never-run workflows changes nothing, and adding `feature-staging` is the trade
already measured and rejected (a pending job is cancelled, not queued). The
lock is not an incomplete fix; on this repository it is the wrong instrument.

### What this does to the fix

It shrinks it to one workflow and confirms the one hard part. `docs-site` has
to survive losing to `feature-staging`, and the only way to do that is to make
its push retryable — which means replacing the `peaceiris` step, because the
race window is inside the action.

There is **no cheap half** on this repository. The obvious cheap moves —
adding `discoverability-docs` to the group, giving `deploy-folio` a
`concurrency` block — are edits to workflows that have never run. They would
look like progress in the diff and change nothing that happens, which is the
failure this whole bean is about.

`06kg` still applies to HOW, not to how many: whatever loop is written reuses
`scripts/backoff-sleep.ts` rather than open-coding `sleep`, since that is the
one backoff implementation and it was made one for this exact ref.

## CORRECTION 2, 2026-09-20 21:09 — the compensation is defeated by the render log

Above, twice, this bean says `feature-staging` *"opted out **and compensated**
— three attempts, rebasing between"*, and rests the whole asymmetry on that.
**Measured on a live failure, the compensation does not hold.** `stage` on
PR #612 (`0da595551b`):

```
   82ccc62..e870503  gh-pages   -> origin/gh-pages
Auto-merging _render-log/2026-09-20.jsonl
CONFLICT (content): Merge conflict in _render-log/2026-09-20.jsonl
Rebasing (1/1)
error: could not apply f2a2836... staging(claude-sharp-fermi-xvs06i)
```

The retry **ran**, lost the race as designed, attempted its
`pull --rebase origin gh-pages`, and the rebase **conflicted** — so the loop
exited 1 on attempt **1** rather than retrying twice more.

### The mechanism, and why it is structural rather than a bug

`renderLogPath(at)` (`schemas/render-log.ts:287`) returns
`_render-log/${day}.jsonl`: **one file per calendar day, shared by every
session.** `feature-staging.yml:753-758` commits it in the SAME commit as the
deploy, deliberately:

> THE LOG IS NOW ATOMIC WITH THE DEPLOY … a preview can no longer exist with
> no entry saying where it came from.

Two sessions append at EOF of the same day's file; the loser rebases onto the
winner; git cannot merge two appends to the last line.

**The property that makes the log trustworthy is the one that defeats the
retry.** Neither half is wrong on its own, and the file already half-knows it:
`feature-staging.yml:643` records the render log as *"a ~38% rise in write
volume, after which attempt 2 started losing the race"*, and fixed the VOLUME
by folding the log into one commit — which made the conflict **certain**
rather than merely likely, because every deploy commit now always touches the
shared file.

### What it changes

- **Worse than stated:** it is not one exposed workflow. `docs-site` loses the
  race with no retry; `feature-staging` loses to the *conflict* despite one.
  Two publishers, two different failures, both dropping pushes.
- **Better than stated:** this half has a cheap standard fix the other does
  not — a `.gitattributes` **`merge=union`** driver for `*.jsonl`. An
  append-only log is the textbook case: both sides' lines are kept, order
  within a day is not load-bearing, and the rebase resolves itself with no
  change to deploy logic.

That is small enough to split from the `peaceiris` question rather than wait on
it. **Not done** — it changes the conflict semantics of the path the site ships
from, which is why the rest of this bean waits on a ruling. Raised on #605.

**One re-run, spent, and it passed**: the push carrying the main merge
re-triggered `stage` on `a3b9a0c28d`, all 8 checks green. So the failure was
contention, not #612's comment-only diff — which could not touch
`_render-log/` at all.

## The `merge=union` half, measured — and the carrier that would have failed

Scoped 2026-09-20 so the ruling needs no investigation.

**The risk is smaller than it looks.** A union merge can corrupt a file that
is not append-only, so the question is how many `.jsonl` files it would reach:

| | |
|---|---|
| `.jsonl` tracked on `main` | **0** |
| `.jsonl` on `gh-pages` | **1** — `_render-log/2026-09-20.jsonl` |

It would apply to exactly the one append-only file it is meant for. Nothing
else can be affected, which removes the only real objection.

**But a committed `.gitattributes` is the WRONG carrier, and it would fail
silently.** The rebase happens in `feature-staging`'s `pages/` checkout of
`gh-pages`, so the attribute has to be in effect on that branch — and
`gh-pages` is the one branch that cannot hold it. `docs-site` publishes with
`peaceiris` as a **full replace**, and `restore-staging.ts:311` already records
that exact mechanism deleting exactly this file:

> `docs(gh-pages)` full replace, deleted `_render-log/2026-09-20.jsonl`

So a committed `.gitattributes` on `gh-pages` would be removed by the next full
replace and quietly stop applying — and the conflict would return looking like
a NEW defect rather than a regression. **A fix that disappears is worse than
none**, which is this bean's own theme one turn later.

**The carrier that survives** is `$GIT_DIR/info/attributes`, written into the
`pages/` checkout by the workflow immediately before the rebase:

```
*.jsonl merge=union
```

Local to that checkout, never committed, nothing for a full replace to delete,
and re-established every run by construction rather than by anybody
remembering. `merge=union` is a built-in driver, so nothing joins the trust
boundary.

That makes this half **one line written in one workflow step** — no deploy
logic touched, no committed state, and no file but the render log reachable.

Still not done. Cheaper than first thought is not the same as ruled on.

## CORRECTION, 2026-09-20 — a sibling shipped the same fix, and the convergence

**Everything in the section below happened and is accurate. It is no longer
what is in the tree.** `scripts/git-union-attr.sh` was removed and its work
handed to `scripts/render-log-union-attr.sh` (bean `pb4n`, PR #625), which a
sibling session merged into `main` **six minutes after** PR #624 landed this
one. Two sessions solved one problem twice, neither able to see the other's
branch, and `main` briefly carried both.

**Kept theirs, not mine, and the reason is a measurement rather than courtesy.**
Mine wrote `*.jsonl merge=union`; theirs writes `_render-log/*.jsonl`. Probed
on a scratch checkout carrying only the narrow rule:

```
_render-log/probe.jsonl : merge: union
some/other/data.jsonl   : merge: unspecified
```

A conflict on a `.jsonl` that is **not** append-only is real information, and
mine would have unioned it away silently. Their scope is correct and mine was
over-broad; their tests also reproduce the CI conflict end to end and assert
**both** sides' lines survive, where mine only asserted `check-attr`.

**Two of my script's properties were better, so they were ported in rather than
lost with the file**: the `check-attr` self-verification that exits 1 on a
silent no-op, and `grep -x` so a longer line containing the rule is not
mistaken for it. Plus `--absolute-git-dir`, which replaced a four-line `case`
block. The header argument below — that a committed `.gitattributes` on
`gh-pages` is **deleted by the next full replace** and so stops applying — is
the decisive reason for the carrier and was only on mine, so it moved across
too. Both beans reached `info/attributes`; only this one recorded why a
committed file would *stop working* rather than merely be ugly.

### And the sibling's calls carried the defect #624 had just fixed

Two of their four call sites read `bash cat-harness/scripts/render-log-union-attr.sh`
inside the `cleanup` job, which checks the platform out at `source/`. Measured,
not inferred:

```
broken literal  -> rc=127   bash: cat-harness/...: No such file or directory
correct literal -> rc=0
```

Under `bash -e` that **aborts the step**, so the retry those calls exist to
protect would have died at the first rejection — the retry present, and not
running. That is `7iog` for the second time in one evening, in the same file,
from a different session. A rule nobody can see does not stop at one author.

`render-log-union-attr.test.ts` now resolves **every** call against its job's
checkout layout and `working-directory:`, then maps it back into the
repository — a miniature `7iog`, scoped to this one script. Falsified by
reverting one site: it fails with
`cleanup: cat-harness/scripts/render-log-union-attr.sh -> outside the platform checkout`.
The test that shipped alongside the defect matched the call as a **substring**,
which is why it passed over both.

## SHIPPED, 2026-09-20 — the `merge=union` half, on the owner's ruling ("605b - go")

`scripts/git-union-attr.sh`, called once per `gh-pages` checkout in all three
jobs of `feature-staging.yml`. Plain shell rather than a `bun` script
deliberately: `gatesFrom` extracts a gate from any line starting with `bun`,
so a TypeScript helper would have needed a `SCRIPT_EXEMPTIONS` entry the way
`backoff-sleep.ts` does. There are 41 `.sh` helpers already; this is house
style, not an exception.

**Verified before shipping, on a scratch repo, in both directions.** Two
clones append to the same day's `_render-log/day.jsonl`; the loser rebases:

- without the attribute — `CONFLICT (content)`, `UU _render-log/day.jsonl`,
  `could not apply`: the CI failure reproduced exactly;
- with it — rebase exit 0, **0 conflicts, both entries present**, three lines,
  every one still valid JSON, no markers injected.

**The script verifies itself and fails loudly.** It ends with `check-attr`
and exits 1 unless git reports `merge: union`. Falsified by mutation: with the
write neutered it exits **1** with `::error::git-union-attr: attribute did not
take effect — … merge: unspecified`; unmutated it exits **0**. A silent no-op
here is the exact failure this exists to prevent, so it is not left to trust.
Idempotent: three runs leave one line.

`--absolute-git-dir`, not `--git-dir`: the latter answers relative to the
repository, so it is `.git` wherever the caller stands, and it also resolves
the case where `actions/checkout` leaves `.git` as a file.

### Live CI evidence, and its limit

`Feature Staging` run 1264 on `2afa2c8a86` (PR #624) exercised this for real —
`event: pull_request`, so GitHub used that PR's own workflow file.

**Step "Let a same-day render-log append merge instead of conflicting":
`conclusion: success`.** That green is load-bearing rather than decorative: the
script exits 1 unless `git check-attr` reports `merge: union`, so a passing step
is one where the attribute demonstrably took effect in the real `pages/`
checkout.

**What it does not show.** The deploy then logged `pushed on attempt 1` — it
WON its race, so the rebase never ran. So:

| | verified where |
|---|---|
| the attribute is installed and active in a real checkout | **CI** |
| a same-day append rebases cleanly instead of conflicting | **scratch repo only** |

A scratch repo is a model. It reproduced `CONFLICT (content)` /
`UU _render-log/<day>.jsonl` / `could not apply` byte-for-byte and the fix
resolved it keeping both lines, which is strong — but the first CI run that
actually LOSES a race is what confirms it end to end. That will happen on its
own the next time two sessions deploy within the same minute; manufacturing
contention to force it would prove less than waiting for the real thing.

### And the retry was broken anyway, in three of four loops

Found in the loops this was going into, filed as **`7iog`**: three of the four
`backoff-sleep.ts` calls name a path that does not exist at run time, because
`cleanup` checks the platform out at `source/` and `cleanup-dispatch` runs with
`working-directory: pages`. Under `bash -e` a missing module aborts the step —
so those retries never retried, and the first lost race ended the job. Fixed
here, since a retry that aborts survives nothing and this ruling was to make it
survive.

`check:command-paths` does **not** catch it, falsified directly: with one site
reverted it still reports *"✓ every repository-relative path inside a fenced
command resolves"* and exits 0. The path does resolve — from the repository
root, which is not where it runs. That reader gap is `7iog`'s subject.

## SHIPPED, half (a) — `docs-site`'s publish, on the owner's "go all"

`peaceiris/actions-gh-pages@v4` is gone from `docs-site.yml`, replaced by
`scripts/publish-gh-pages.sh`. The action clones, replaces and pushes in ONE
step, so the race window was inside it and there was nothing to wrap — which is
why this workflow had no retry at all.

### A REBASE would have been the wrong retry, and that is the finding

The obvious fix was to give `docs-site` the loop `feature-staging` has. That is
wrong, and the reason is worth keeping.

`feature-staging` rebases correctly because its commit adds or removes **one**
`STAGING/<slug>/` directory — replaying it onto whoever won touches nothing
else. **This commit replaces the WHOLE TREE.** Rebasing it onto a newer
`gh-pages` would re-apply that replacement over whatever landed in between,
deleting a preview a sibling had just deployed. That is bean `plj1` exactly,
re-created by the mechanism meant to make the deploy safer.

So each attempt **re-reads and rebuilds** rather than replaying: fetch, reset,
re-run the restore against the branch's CURRENT contents, lay `_site` down,
commit, push.

**That makes the retry strictly better than one attempt rather than merely
luckier.** `docs-site.yml` already named the flaw it closes — the restore runs,
then the action re-clones, and *"everything between this read and that clone is
a window in which a `feature-staging` deploy could land a preview this push then
removes"*. Re-restoring per attempt shrinks that window to the last attempt's
instead of carrying a stale read into a push minutes later.

### Verified end to end on a scratch remote

- **Uncontended**: full replace (a seeded `STAGING/foo/` removed, as the restore
  is what preserves previews), `.nojekyll` carried, commit message exactly
  `docs(gh-pages): site from <sha>`, "published on attempt 1".
- **Contended**, with a `git` shim failing the first push and landing a rival
  commit first: *"push rejected; re-reading gh-pages and rebuilding"*, then
  attempt 2 reset to the rival's commit and pushed. **The final commit's parent
  was the rival's commit** — the proof that a re-read happened rather than a
  replay over a stale base.

### Two tests were passing VACUOUSLY, and my own change is what exposed it

The three workflow-wiring tests in `restore-staging.test.ts` all keyed on
`peaceiris/actions-gh-pages@`. Removing the action made **one** fail loudly and
**two pass over nothing**: `indexOf` returned `-1`, and both `verify > publish`
and the `keep_files` slice are satisfied by `-1`.

That is the `6tkl` shape, introduced by the change the tests exist to guard. All
three are rewritten to assert a `-1` as a failure before any ordering is
compared, plus a new one pinning the re-read invariant — falsified by swapping
`reset --hard` for `pull --rebase`, which fails it.

## Done when

- [x] A ruling on ONE shared publishing step vs four copies. **NO SHARED
      STEP**, owner's "Go", 2026-09-21 — see below
- [x] `*.jsonl merge=union` via `$GIT_DIR/info/attributes` in the `pages/`
      checkout — NOT a committed `.gitattributes`, which a full replace
      deletes. **Done 2026-09-20** (`git-union-attr.sh`, three call sites),
      with the three broken `backoff-sleep` paths fixed alongside (`7iog`)
- [x] `docs-site.yml`'s publish survives a losing race. **Done 2026-09-20**
      (`publish-gh-pages.sh`, rebuild-per-attempt). `blueprint.yml` and
      `lean_ci.yml` are NOT done and do not need to be: both have **0 runs**
      ever here, so neither can lose a race
- [x] `discoverability-docs.yml` and `deploy-folio.yml` either name the group
      or carry a stated reason, the way `feature-staging.yml:94` does.
      **Already true 2026-09-21, and this bean was wrong about both** — see
      the verification below
- [x] `check-workflows`' `gh-pages-ungrouped` finding is re-checked. **It is
      running and it does catch this shape**; the disjunction above was
      missing its third branch — see below
- [x] `check-ci-health`'s `6pfo` citation points at the right bean. Fixed by
      a sibling on 2026-09-20 — `ci-health.ts:1123` records the change

Related: `xd1s` (completed, the group), `eoix` and `pdxk` (archived, the
pending-cancellation measurement), `bm6d` (self-inflicted double-push), `6pfo`
(mis-cited here), `1xhc` (parent).



---

## The retry's own failure mode is `pb4n`, not covered here — 2026-09-20

Opened from PR #603, whose `stage` job failed differently from the runs above:
the push was rejected as expected, the retry rebased as designed, and then

```
CONFLICT (content): Merge conflict in _render-log/2026-09-20.jsonl
error: could not apply e415631... staging(claude-elegant-albattani-0byaig)
```

**This bean is about preventing the race; `pb4n` is about the retry surviving
it.** The retry handles a REJECTION and cannot handle a CONTENT CONFLICT, and
every run appends to the same day's `_render-log/<date>.jsonl`, so two
interleaved runs on one day conflict by construction rather than by luck.

That matters for scoping the fix here: the table above records
`feature-staging.yml` as outside `gh-pages-push` **deliberately, with a
measurement**, so the retry is load-bearing by design and cannot be assumed
away. Restoring the concurrency invariant makes the collision rarer, not
impossible.

Proposed there: `.gitattributes` on `gh-pages` scoping `merge=union` to
`_render-log/*.jsonl` — correct semantics for an append-only log, and narrow
on purpose.


## VERIFIED 2026-09-21 — three of the four open boxes were already satisfied

Re-derived rather than taken, because this bean's own rule is never to quote a
count from prose, and its own tables have gone stale twice.

### `check-workflows` runs, and it catches the shape

```
$ bun run check:workflows
Workflows: 39
✓ ... every gh-pages push is protected by the `gh-pages-push` queue or a retry
```

The box offered a disjunction — *"either it is not running or it does not
catch this shape"* — and the answer is **neither**. It runs, it catches it,
and it finds nothing because there is nothing to find. Worth recording as a
shape: a check reporting clean is evidence only once you have asked WHY it is
clean, and this bean assumed the two failure branches without asking.

### `discoverability-docs.yml` opted out AND said why, at line 32

> `NO shared gh-pages-push group here, deliberately — see the retry below.`

...followed by the measurement: #300 put all three of its jobs in the group,
and because they run in parallel with no `needs:`, one runs, one pends, and
the third cancels the pending one — *"a lost publish EVERY RUN"*. This bean
recorded it as **"no stated reason"**. It has one, and it is the same
pending-cancellation argument `feature-staging` carries.

### `deploy-folio.yml` does not publish to `gh-pages` at all

This bean listed it as **"no concurrency block at all"**, under a heading
about workflows touching `gh-pages`. Measured: it has no `peaceiris` step, no
`git push`, no `branch:` — its only mention of `gh-pages` is one comment
saying the SPA that `publish.yml` publishes must not be blocked. A workflow
that does not push cannot be missing a group.

### And the live-pusher count, which is the number that matters

| workflow | runs ever | pushes gh-pages |
|---|---|---|
| `feature-staging.yml` | 1210+ | yes |
| `docs-site.yml` | **332** | yes |
| `blueprint.yml` | **0** | yes |
| `lean_ci.yml` | **0** | yes |
| `discoverability-docs.yml` | **0** | yes |
| `deploy-folio.yml` | 0 | **no** |
| `publish.yml` | 1, in June | yes |

**Two workflows actually contend.** Everything else is a workflow that has
never run, or one that does not push.

### `docs-site` on `main` since the fix

Last five runs on `main`: **4 success, 1 cancelled, 0 failed.** The
cancellation is run 331 superseded by run 332 nine seconds later — the
workflow-level `docs-site-${{ github.ref }}` group doing what it should, since
a superseded site build finishing is worse than it stopping. The job-level
`gh-pages-push` carries `cancel-in-progress: false`, so the *push* is still
queued rather than dropped. That is the two-group arrangement working as
designed, not a residue of the race.

## The one box left is the ruling, and the measurement above changes the question

> A ruling on ONE shared publishing step vs four copies

**The premise is four copies; two of them have never run.** The live pair is
`docs-site` and `feature-staging`, and they differ in exactly the property the
retry strategy depends on — `docs-site.yml` says so itself:

> A REBASE WOULD HAVE BEEN THE WRONG RETRY ... `feature-staging` rebases
> correctly because its commit touches one `STAGING/<slug>/`. This commit
> replaces the WHOLE TREE, so replaying it onto a newer `gh-pages` would
> re-apply that replacement over whatever landed in between — `plj1` again,
> re-created by the safety mechanism.

So a shared step would have to carry both strategies and a flag to pick
between them, which is two implementations with a conditional rather than one.
`06kg` is the precedent against copying a BACKOFF — one behaviour with one
correct implementation — and both of these already call
`scripts/backoff-sleep.ts`. The thing that is duplicated is not duplicated.

**Recommendation: no shared step.** Left open rather than ticked, because the
box asks for a ruling and reversing a proposal on an agent's own judgement is
what this bean elsewhere declines to do.


## RULED 2026-09-21 — no shared publishing step, and the bean closes

The premise was *four copies*; **two of them have never run**. The live pair
is `docs-site` (332 runs) and `feature-staging` (1210+), and they differ in
exactly the property the retry strategy depends on — `docs-site.yml` states it
itself:

> A REBASE WOULD HAVE BEEN THE WRONG RETRY ... `feature-staging` rebases
> correctly because its commit touches one `STAGING/<slug>/`. This commit
> replaces the WHOLE TREE, so replaying it onto a newer `gh-pages` would
> re-apply that replacement over whatever landed in between — `plj1` again,
> re-created by the safety mechanism.

A shared step would have to carry both strategies plus a flag to choose
between them: two implementations with a conditional, not one. And `06kg`, the
precedent cited for consolidating, is about copying a **backoff** — one
behaviour with one correct implementation — which both already share via
`scripts/backoff-sleep.ts`. **The thing that is duplicated is not
duplicated.**

Everything else in this bean is done: the `merge=union` half shipped, the
`docs-site` retry shipped, and the three remaining boxes were verified already
satisfied on 2026-09-21 (two of them by findings this bean had recorded
wrongly — `discoverability-docs` DOES state its reason, and `deploy-folio`
does not push to `gh-pages` at all).
