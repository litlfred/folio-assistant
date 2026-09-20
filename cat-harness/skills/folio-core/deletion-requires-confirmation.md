---
name: deletion-requires-confirmation
description: >
  An agent never removes a durable artefact on its own initiative. Report what
  would go, with sizes and ages, and wait for the user to say so. Covers what
  counts as durable, the non-destructive move for each kind, and the rule that
  a workflow whose shape deletes something counts as a deletion nobody decided.
allowed-tools: Read Grep Glob Bash
---

# Deletion requires explicit confirmation

**One rule, and it has no exceptions worth the word:**

> **An agent does not remove a durable artefact on its own initiative. It
> reports what it would remove — with sizes, ages and what each one is — and
> waits for the user to say so.**

"On its own initiative" is doing the work in that sentence. The rule is not
about malice or about big deletions. It is about the gap between *an agent
decided this was no longer needed* and *a person decided it*, and the whole
point is that the second is cheap to obtain and the first is never recoverable
from the outside.

**And that is exactly why a WAIVER is not an exception to it.** The owner may
grant the `deletion` gate in advance — for a session, for a process run, for a
named artefact class — and a grant of that kind is *the person deciding*, which
is the side of the gap this rule protects. What is never permitted is the agent
supplying the decision itself, under any name. A waiver carries the grantor,
their **verbatim words**, one gate class, a scope and an expiry, and one
missing field means there is no waiver and this rule stands unchanged:
[`confirmation-waiver.md`](confirmation-waiver.md).

Two things a `deletion` waiver never reaches, and both are here rather than in
the waiver skill because this is where a reader looks for them. **It is never
blanket** — a grant over build artefacts is not a grant over content, and a
scope that does not plainly cover the case in front of you does not cover it.
And **it never reaches a bean**, because `AGENTS.md`'s *never delete ANY bean*
is a prohibition rather than a confirmation anybody is owed; `scrapped`, with
reasons, is always available, so there is nothing there to give back.

## Why removing something is not the inverse of creating it

Creating a file and deleting one look symmetric and are not, for three reasons
that all cut the same way.

**A deletion destroys the evidence that it happened.** A wrong file is visible
and gets fixed; a removed one is absent, and absence looks exactly like "there
was never anything here". Nobody greps for a thing they do not know existed.

**The person who pays is not the person who acted.** A sibling session, a
reviewer following a link, the next agent to pick up the thread — none of them
were in the room, and none of them can tell your deliberate removal from an
accident. `AGENTS.md` states the strongest instance of this for beans, and
states the reason generally: *"a scrapped bean records that something was
considered and rejected, which is what stops the next agent re-entering the
same dead end; a deleted one leaves a sibling unable to tell abandonment from
accident."* **That reasoning is not about beans.** Substitute "staging
preview", "witness", "library source" and it is unchanged.

**Asking is nearly free and reverting often is not.** The cost of confirming
is one line in a report and one word back. The cost of a wrong deletion is
whatever it took to produce the thing, plus the time somebody spends
discovering it is gone, plus — in the worst and commonest case — never
discovering it at all.

> **This skill is the general rule; `AGENTS.md` carries one instance of it.**
> Where the two overlap, this is the source of truth and the `AGENTS.md` entry
> is a pointer. Do not restate the bean rule here as a second, competing rule
> — it is the same rule, applied to one store.

## What counts as durable

The test is not "is it committed" and not "is it large". It is:

> **Could somebody other than me want this later, and would they be able to
> tell it was removed on purpose?**

If the answer to the first is yes and to the second is no, it is durable.

**Durable — confirm before removing:**

| artefact | why | the non-destructive move |
|---|---|---|
| a **bean** (`beans/defs/*.md`) | records that something was considered; ids are referenced from commits, issues and other beans | set `status: scrapped` with the reasons; `beans archive` MOVES resolved ones |
| a **todo** (`todos/items/*.md`) | it is a *person's* outstanding work, not an agent's | ask the person; an agent may neither close nor remove one |
| a **staging preview** (`STAGING/<slug>/` on the publish branch) | it is the artefact a human assesses a rendered change from — **unless the PR merged**, when the main site now shows the same thing | **merged → removed automatically; the merge IS the confirmation** (owner, 2026-09-20). Otherwise: while the PR is open, the `staging:cleanup` label applied by a person; once closed unmerged, a `feature-staging.yml` dispatch with `cleanup_slug` + a matching `cleanup_confirm`, since the label cannot reach a closed PR (bean `w2g5`) |
| a **published page** on the site | a URL somebody has linked or bookmarked | say what would 404 and let the owner decide; a redirect is often the answer |
| a **QA verdict or witness** (`test/results/**`) | the previous answer is what separates "this broke today" from "this has been broken since it was written" | regenerate it in place; never remove the file to make a sweep clean |
| **library / uploads content** | every knowledge-graph reference to a source resolves through `library/`; a file in `uploads/` reads as absent to every consumer while still on disk | move it forward through the pipeline, or ask |
| a **workflow instance** (`beans/workflows/*.json`) | it is where a running process got to; a sibling session is reading it | complete or discard the instance through the engine, which records the fact |
| a **branch, tag or ref** somebody else pushed | it is the only copy of work that is not on `main` | leave it; say it looks finished with |

**Not durable — rewrite or remove freely:**

- scratch files in a scratchpad or temp directory, and anything you created
  this session that nothing else has seen;
- build output: `_site/`, `_kg/`, `dist/`, `node_modules/`, `test-results/`;
- **a generated artefact being rewritten in place by its own generator.** A
  regenerator that overwrites its output is not deleting anything — the
  contract is that the file is derived. The distinction is *in place*: writing
  a fresh `kg-qa` sidecar over the old one is regeneration; removing a sidecar
  whose subject you could not load is a deletion, and a false pass besides.

Three cases sit on the line and all three resolve the same way — **ask**: a
file you believe to be an orphan, a directory you believe to be empty, and a
file whose only reference you have just removed. In each, the belief is exactly
what would be wrong if you are wrong.

**Establish which instance owns a node before you propose removing it.** In a
multi-instance layout a file that looks orphaned here may be declared from
somewhere else. [`placement`](placement.md) is the skill for that question;
it is the same question in the other direction and does not need restating here.

## What to do instead

**Report, do not act.** The report is the deliverable, and it is not a
one-liner:

- **Name every artefact.** Assert by naming, never by counting — "4 previews
  are orphaned" is a statistic and "`STAGING/claude-d2kp-live-verdicts` (36.8
  MB, last deployed 11 days ago, PR #378 merged) matches no open pull request"
  is something a person can answer.
- **Give the size and the age**, because that is what the decision turns on.
- **Say what is lost if it goes**, and say it in terms of what would differ —
  a 404 on a link, a reviewer unable to compare, a sibling unable to tell
  abandonment from accident.
- **Recommend one option and mark it as your recommendation**, then say what
  happens if they say nothing. This is the same frame
  [`interaction-modality`](interaction-modality.md) §4.1 requires of every
  handed-over decision: context, options with their costs, recommendation,
  then the question. A reader must be able to answer without opening anything.

**Prefer the move that keeps the record.** Almost every case has one:
`scrapped` over deleted, archive over remove, redirect over 404, regenerate
over unlink, a label over a workflow step.

**When the user does say so, do exactly that and no more.** A confirmation to
remove one thing is not a confirmation to remove the class it belongs to. If
the scope is ambiguous, the answer is another question, not an inference.

## The failure this skill was written from — bean `plj1`

Not a hypothetical, and not an agent typing `rm`.

`docs-site.yml` published the site with `peaceiris/actions-gh-pages@v4`,
`keep_files: false`, no `destination_dir`. That action's own implementation
does, at push time:

```
git clone --depth=1 --single-branch --branch gh-pages <remote> workDir
git rm -r --ignore-unmatch '*'      # everything on the branch, STAGING included
cp -R publish_dir/* workDir/
```

So **every push to `main` that touched `docs/` deleted every open pull
request's review preview.** Measured on the real `gh-pages` history,
2026-09-19: three consecutive deploys removed 1, 3 and 1 previews, every one
their parent commit carried.

Four things about it are worth carrying forward:

1. **Nobody decided it.** There was no deletion step, no flag saying "remove
   previews", no line anyone wrote with that intent. The *shape* of the
   workflow deleted them. A deletion nobody decided is still a deletion that
   requires confirmation — and since there is nobody to ask at push time, the
   answer is that the workflow must not be shaped that way.

   > **The policy changed on 2026-09-20 and this example is untouched by it.**
   > A **merged** PR's preview is now removed without a label, because the
   > merge is a person's decision that the content belongs on `main` — a
   > stronger confirmation than a label. `plj1` deleted the previews of
   > **open** PRs: work nobody had accepted, mid-review. Nothing in the new
   > policy reaches an open PR, and the one-directory-at-a-time shape this
   > bean forced on the job is unchanged. The lesson stands exactly as
   > written.
2. **It overrode a written policy that said the opposite.**
   `feature-staging.yml` removes a preview on PR close **only** with a
   `staging:cleanup` label, and otherwise posts *"Staging preview retained …
   so reviewers can continue comparing"*. One workflow's implicit behaviour
   beat another's explicit rule, and the explicit one was the one a human had
   read.
3. **It was completely silent.** The staging deploy succeeded, the bot
   commented the URL on the PR, the check run was green — and an unrelated
   merge removed the artefact minutes later. A reviewer following the link got
   a 404 with nothing anywhere saying why. This is the first property in this
   skill: the deletion destroyed its own evidence.
4. **What it destroyed was the thing merge discipline depends on.**
   `AGENTS.md` is explicit that a human cannot assess a rendered artefact from
   a description of it. The preview *is* the assessment.

Fixed in #377 by restoring `STAGING/` into the publish directory before the
push — which keeps both halves, since the main site is still a full replace so
a removed page goes, while the previews are part of what is published.

### The sequel, and why "no remedy" is its own hazard — bean `w2g5`

The same family, 2026-09-19, and it cuts the other way. `cleanup` in
`feature-staging.yml` removes a preview only on a `staging:cleanup` label, and
only on the `pull_request_target: closed` event — so once a PR is closed the
label can no longer reach it, and re-running the old run replays a payload that
still carries no label. Meanwhile `staging-preview-orphans` can only ever name
a preview whose PR is *already* closed. **The one remedy the finding documented
was unreachable for every artefact it could ever name.**

That is not a safe failure. It leaves a person holding a report with no
sanctioned action in it, and the two unsanctioned ones are a hand-pushed
`gh-pages` commit — this skill's whole subject — or switching the check off. A
policy of "confirm before removing" needs a removal that can actually be
confirmed; otherwise the confirmation has nowhere to go. The fix was a
`workflow_dispatch` path whose confirmation input repeats the slug, and which
re-evaluates liveness at removal time rather than trusting a report that may be
a day old.

**And the check itself had the opposite defect at the same moment**: it read
"no open pull request" as "abandoned" and named a branch that had been
committed to two minutes earlier. Reporting rather than acting is what kept
that from becoming a deletion — but a report that names live work still invites
one, which is why the list a person is asked to act on has to be as careful as
the action itself.

## Applying it to your own code

Two tests, both cheap, both derived from `plj1`:

**Does anything you are writing remove something as a side effect of doing
something else?** A full-replace publish, a `--prune`, a cleanup step, a cache
eviction, a `git rm` that globs. If so, name what it removes, in the code, and
make sure a person chose it.

**If it is a sweep, does it act or does it report?** A checker that finds
accumulation will be tempted to clear it. `test/health/checks.ts` is the
worked counter-example in this repository: five checks, four of which are
about artefacts piling up, and every `action` on every finding names something
a *person* does. The daily workflow that runs them opens an issue and removes
nothing.

## Checklist

- [ ] Is the thing durable by the test above? If unsure, it is.
- [ ] Is there a non-destructive move — scrap, archive, redirect, regenerate,
      label? Prefer it, and say you preferred it.
- [ ] Have you **named** each artefact, with its size and age and what is lost?
- [ ] Have you given a recommendation, and said what happens on silence?
- [ ] Did the user confirm **this** removal, rather than a similar one?
- [ ] Does any code you wrote remove something as a side effect? Say so in the
      code, and check a person chose it.
