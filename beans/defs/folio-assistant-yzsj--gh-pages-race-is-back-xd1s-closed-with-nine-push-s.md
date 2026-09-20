---
# folio-assistant-yzsj
title: 'gh-pages RACE IS BACK: xd1s closed with nine push sites grouped; three are outside it now and docs-site has NO retry — main went red 19:53'
status: todo
type: task
priority: normal
created_at: 2026-09-20T20:02:00Z
updated_at: 2026-09-20T20:33:25Z
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

## Done when

- [ ] A ruling on ONE shared publishing step vs four copies (see the
      correction above — `06kg` is the precedent against copying)
- [ ] `docs-site.yml`'s publish survives a losing race, with the failure
      reproduced before the fix and the fix shown to pass — **and the same for
      `blueprint.yml` and `lean_ci.yml`, which are equally exposed**
- [ ] `discoverability-docs.yml` and `deploy-folio.yml` either name the group
      or carry a stated reason, the way `feature-staging.yml:94` does
- [ ] `check-workflows`' `gh-pages-ungrouped` finding is re-checked — `xd1s`
      added it, and three workflows are outside the group today, so either it
      is not running or it does not catch this shape
- [ ] `check-ci-health`'s `6pfo` citation points at the right bean

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
