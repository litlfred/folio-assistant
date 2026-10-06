---
# folio-assistant-lptq
title: 'DELETED 2026-10-02: qa-reports-spike and qa-reports-spike-b, with the SHAs to restore them'
status: completed
type: task
priority: low
created_at: 2026-10-02T23:24:30Z
updated_at: 2026-10-06T06:26:36Z
parent: folio-assistant-fs43
---

Owner, 2026-10-02, asked for the state of these two branches and then ruled:
*"qa-reports-spike branches: delete both"*. **The owner deleted them, not the agent**
— see §"Who deleted them" below, because the agent could not. This bean exists so the
deletion is reversible, because a deleted branch's commit is unreachable and
unrecoverable once nothing names it.

## To restore

    git branch qa-reports-spike   76893badc5ee66620e3f254e385dec7ead80e17e
    git branch qa-reports-spike-b 43c8b09a2c07b056b901985fed523439a83d5857
    git push origin qa-reports-spike qa-reports-spike-b

Both heads were re-verified immediately before deletion and were **unchanged** from
the state the owner was shown, so the ruling applied to exactly these commits.

## Who deleted them, and why it was not the agent

**Both deletion routes are refused for an agent in this environment**, measured
2026-10-02 before the ruling was carried out:

| route | result |
|---|---|
| `gh api -X DELETE .../git/refs/heads/<branch>` | *"Write access to this GitHub API path is not permitted through this proxy"* |
| `git push origin --delete <branch>` | `RPC failed; HTTP 403` |

The proxy reported healthy and both pushes and merges worked in the same window, so
this is a policy denial on ref deletion specifically rather than a broken credential.
`/root/.ccr/README.md` says to report such a denial rather than work around it, so the
agent reported it and handed the owner the command.

**The owner ran it** and confirmed *"(branches deleted)"*. Verified afterwards:
`gh api repos/litlfred/folio-assistant/git/matching-refs/heads/qa-reports-spike`
returns an **empty list**, so neither `qa-reports-spike` nor `qa-reports-spike-b`
remains on the remote. A matching-refs prefix query covers both names in one call, and
an empty array here is a real answer rather than the vacuous kind, because the same
query returned two entries while the branches existed.

Worth keeping because the first draft of this bean said *"Deleted by the Merge Manager
on that word"*, which was false in the one respect a deletion record must get right:
**who did it**. The agent had reported the denial in chat and then wrote the bean from
the ruling rather than from what it had actually been able to do.

## What they held, measured rather than assumed

| branch | head | kind | tree | top-level |
|---|---|---|---|---|
| `qa-reports-spike` | `76893ba` | **orphan** | 4835 files | `main/`, `pr/` |
| `qa-reports-spike-b` | `43c8b09` | **orphan** | 967 files | `pr/` only |

Both were written by `folio-qa-bot` on 2026-10-01, with commit subjects of the form
`qa-reports: main/<sha> (966 files, 7898557 bytes)` and
`qa-reports: pr/1764/<sha> (966 files, 7898557 bytes)`. So they are ref-keyed QA
report stores — prototypes of the mechanism arc `3fva` productionises — and
**`qa-reports` (`7ddc0af`) already exists** as the real store, which is what made
these superseded.

**Nothing referenced them.** `git grep` over `origin/main` for `qa-reports-spike`
returned no match, so no script, workflow or declaration named either branch.

## A measurement error worth keeping, because it nearly became the report

My first pass reported *"files vs main: 0"* for both, from
`git diff --name-only origin/main...<sha>`. That was an artefact: both branches are
ORPHANS, so there is no merge base, the three-dot form has nothing to diff against,
and the empty output reads as "no difference" rather than "the question was
malformed". `git merge-base` returning nothing is what exposed it. The real sizes are
the tree counts above.

Same shape as the other traps recorded today: a command that cannot answer produces
empty output, and empty output reads as a clean answer.

## Why a bean rather than only a chat message

`deletion-requires-confirmation` — an agent never removes a durable artefact on its
own initiative; it reports what would go, with sizes and ages, and waits. That
happened. What the skill does not cover, and this bean adds, is that the owner's
"yes" should leave a durable trace: a chat transcript is not the corpus, and the
next agent auditing special branches should find out what used to be there and how to
get it back rather than inferring from an absence.



## Parent: `fs43`, and why that one

Filed under the state-branch arc rather than the separation arc `7x5n`. These two
branches were prototype **declared state branches** — orphan, ref-keyed stores written
by a bot — which is `fs43`'s subject (*process-written state off `main` onto declared
branches*), not `7x5n`'s (instance separation). Arc `3fva`, whose subject is QA and
test evidence specifically, would have been the closest fit but **is not a bean**: it
exists only as an arc name in PR titles, so it cannot be a parent.

Stated rather than silently chosen, because which epic a bean belongs to is an
assertion and not derivable — the same rule `check:partition` applies to modules.


## Summary of Changes

**Closed on evidence, 2026-10-06** (re-measured on main at 2fdbb5109a by session_01QSd18GZBc9NJNMy6GV9v7D, not quoted from earlier notes). Status history: never completed before, so not an owner reopen; no holder.

A record bean, no checklist. `git/matching-refs/heads/qa-reports-spike` is empty: both branches are gone. Both restore SHAs (76893ba, 43c8b09) still resolve on GitHub with their recorded subjects, so the restore commands here still work until GitHub garbage-collects them. Nothing on main reads either branch. Closing keeps the record in the store.
