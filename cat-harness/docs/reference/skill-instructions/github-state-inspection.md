---
layout: default
title: 'Reading GitHub state'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/github-state-inspection.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/github-state-inspection.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/github-state-inspection.md){: .fa-edit-source }

{% raw %}
# Reading GitHub state — resolve the ref, do not compose the URL

> Skill id: `github-state-inspection` · Capability: `review` · Package: `folio-core`

Every question of the form *"is it published?"*, *"why is this 404?"*, *"did
that deploy?"* has an authoritative answer in a **ref**, and a misleading one
in an HTTP request. This skill says which to reach for and in what order.

## The rule

> **A published URL is LOOKED UP in the publish ref's tree. It is never built
> from the source path.**

`folio-assistant/docs/guides/agent-onboarding.md` publishes to
`/guides/agent-onboarding.html`. The `folio-assistant/` segment is a
source-tree stub that Jekyll does not carry into the site. Anyone composing
the URL from the source path gets a 404 and concludes the page is missing.

**And a source path moves under you.** The worked example below was
`docs/folio-assistant/proposals/bootstrap.md`; the stub pattern inverted it to
`folio-assistant/docs/proposals/` (bean `wggr`), and then proposals were
relocated out of the site entirely to `fsh-guts/proposals/` — and back INTO it on
2026-09-23, to `cat-harness/docs/proposals/`, on the owner's ruling that a
proposal belongs in the `docs/` of the stub that needs it. The sentence is kept
rather than rewritten because what it describes did happen; what is kept and
addressable but **deliberately unpublished** — so that page has no URL at all
now. Three moves in one day, and a URL composed from any remembered source
path would have been wrong after each. The third move is the worst case for
composing, because the composed URL is not merely the wrong path: it asserts a
page exists where the repository has decided none should.

This is the same defect `AGENTS.md` records for generated README links —
*"It composed links instead of resolving them"*, where all twenty-three
chapter PDF links were 404 and always had been — arriving one layer up, in an
agent's own reasoning rather than in a generator.

## First check for ANY deployment question

**Look at the branch.** Not the site.

```sh
git ls-remote origin refs/heads/gh-pages        # does the publish ref exist at all
git fetch origin gh-pages
git ls-tree --name-only FETCH_HEAD              # what is at the root
git ls-tree -r --name-only FETCH_HEAD | grep -i <thing>   # where does it actually live
```

For a staging preview, the subtree is `STAGING/<branch-slug>/`, and
`git ls-tree --name-only FETCH_HEAD STAGING/` lists every branch with a live
preview. The slug replaces `/` with `-`: `claude/festive-galileo-s7ibx0`
becomes `STAGING/claude-festive-galileo-s7ibx0/`.

The MCP GitHub tools answer the same question without a fetch —
`get_file_contents` with `ref: "refs/heads/gh-pages"` and a directory path
returns the listing. Use whichever is to hand; both read the ref, which is the
point.

## Present on the ref is not the same as SERVED — read the Pages deployment

The step above is authoritative for *what exists*. It is not authoritative for
*what a reader gets*, and the gap between them has a mechanism worth knowing.

Pages-from-a-branch publishes through a `pages build and deployment` run, and a
new push to the publish ref **cancels the run already in flight**. So a commit
can sit on `gh-pages` with the file plainly there while the last *successful*
deployment is an older tree.

```sh
git log --format='%h %ad %s' --date=iso -10 origin/gh-pages   # how fast is the ref moving
```

and the deployments themselves, which only the API has:

```
actions_list  method: list_workflow_runs
              workflow_runs_filter: { branch: "gh-pages", event: "dynamic" }
```

Read `conclusion` per run, not just the newest — `cancelled` is the one that
misleads, because nothing is red and yet nothing shipped from that commit.

Measured 2026-09-20, on a repository with four concurrent agent sessions:
**64 commits to `gh-pages` in 90 minutes**, and **6 of the last 10 Pages
deployments `cancelled`**. The pattern was exact rather than random — each
staging deploy pushes *two* commits about ten seconds apart, the payload
(`staging(<slug>): from <sha>`) and then `render-log: rendered …`, and the second
reliably cancels the first's build. Two pushes, two builds, one of them always
wasted.

So when a preview 404s and the file **is** on the ref:

1. Check whether a deployment has succeeded *since* the commit that added it.
   A `cancelled` newest run with an older success means the tree being served
   predates your push.
2. Check whether your subtree survives in that older tree too — on a ref this
   busy, `git cat-file -e <commit>:<path>` over the recent commits answers
   "was it ever missing" directly, and a path present at every one of them rules
   the ref out as the cause entirely.
3. Only then is the question about Pages rather than about the repository, and
   it is a wait-or-escalate, not a fix.

**What this does not license.** A `cancelled` run is an explanation to verify,
never one to assert: it is equally consistent with a page that is serving fine.
From a container that cannot reach the host, the honest report is the mechanism
plus what you could and could not establish — not "it is probably propagation".

## Why `curl` is not the first check, and often not evidence at all

Three distinct failures produce an identical-looking result, and only one of
them means the page is missing:

| what you see | what it can mean |
|---|---|
| `404` | the page is not published — **or** your URL was composed wrong |
| `000`, `CONNECT tunnel failed, response 403` | the agent's proxy blocks the host. Says **nothing** about the site |
| `200` on a stale page | the deploy has not run yet; the old build is still served |

In a Claude Code container, outbound HTTPS goes through a proxy that **blocks
`github.io`**. A `curl` against a Pages URL from here returns `000` and a 403
tunnel error regardless of whether the page exists. Reporting that as "could
not determine whether it rendered" is honest but useless when the ref was
sitting there with the answer.

**"Could not determine" is a third state and must never be rendered as a
pass** — but it is also not a place to stop when another source can determine
it. Reach for the ref first, and a fetch only to confirm something the ref
cannot tell you (that a redirect works, that a asset loads).

## CI state — read check RUNS on the head sha

Commit *statuses* and check *runs* are different APIs and this repository uses
the second. `pull_request_read` with `method: "get_status"` returns
`{"state":"pending","total_count":0,"statuses":[]}` on a PR whose eight checks
are green, because there are no legacy statuses to report. Use
`method: "get_check_runs"`.

Two further traps:

- **Check the sha.** A `check_suite.completed` event names a `head_sha` that
  may already be superseded by your own later push, and the staging workflow's
  own commits appear as shas that are not PR heads at all. Compare against the
  PR's current head before concluding anything.
- **`mergeable_state: "unknown"`** means GitHub has not finished computing it,
  not that the PR is fine. `"dirty"` is a real merge conflict and is work now.

## Order of resort

1. **The ref** — `git ls-tree` / `get_file_contents`. Authoritative for what
   exists and where.
2. **The API** — check runs, PR state, branch list. Authoritative for what
   happened.
3. **The workflow run** — `actions_list` / `get_job_logs`. Authoritative for
   *why* it happened.
4. **An HTTP fetch** — last, and only for what the first three cannot answer.
   From an agent container, treat a failure as a proxy result until proven
   otherwise.

## Where the agent goes wrong, measured

2026-09-19. A new proposal page was published and I reported that I *could not
verify it rendered*, on the strength of two `curl` calls that returned `000`
because the proxy had refused the tunnel — and I had built the URL from
`docs/folio-assistant/proposals/` rather than resolving it. One
`git ls-tree -r FETCH_HEAD | grep proposal` showed the page present at
`proposals/bootstrap.html`. Both halves of the error — a composed URL and a
fetch mistaken for evidence — are what this skill exists to prevent.
{% endraw %}
