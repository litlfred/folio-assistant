---
layout: default
title: 'Related work: find it, sort it, ask'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/related-work-coordination.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/related-work-coordination.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/related-work-coordination.md){: .fa-edit-source }

{% raw %}
# Related work: find it, sort it, ask

Owner, 2026-09-23 (issue #1023): *"when CRDM is initiated/updated through human agent chat discussions existing beans need to be searched for relevance and categorized (and summarized), same for issues (e.g. github). ask user if they want to coordinate. judgement is used to determine how"*.

## When

- **CRDM:** a requirement is **initiated or updated** in a human-agent chat. `crdm-issue-linking.bpmn` calls `Process_RelatedWork` before it scans for an issue to link.
- **Methodology adoption:** `methodology-from-source.bpmn` calls it after ingesting the source.
- Anywhere else a new piece of work is about to start and could collide with work in flight.

## Search (all three, every time)

| where | how | why |
|---|---|---|
| beans | `beans list --json`, then match on titles **and bodies**; include recently completed beans | a completed bean is a decision already made |
| issues | the repository's issues, open and closed | an open issue may already own the requirement |
| open PRs | the repository's open pull requests | a PR touching the same files is the collision worth finding first |

## Categorize and summarize (judgement)

Every hit gets exactly one category and a one-line summary giving its state and why it is in that category:

| category | meaning |
|---|---|
| **overlaps: coordinate** | the same thing, or changes the same files or process; left alone, the two will collide |
| **affected by** | this work will change what that item sees or does |
| **out of scope** | related, but deliberately not part of this work; say why |
| **unrelated** | a false match; list it only if a reader might assume otherwise |

This is judgement, not keyword matching. A title match is a lead, and the body decides the category.

## Ask

Put **one** question to the user, in the order context, then options, then recommendation (`interaction-modality` §4.1). Typical options:

- work in parallel and follow the other item's conventions;
- wait for it to land;
- build on its branch;
- note only.

Recommend one of them. **Do not link, block, merge or comment on another item before the answer.** Coordinating is a commitment made on behalf of that item's owners.

## Record

- Write the choice where it will be found: bean links (`--blocked-by`, `--parent`), a section in the issue or PR body, or "note only".
- A declined coordination is recorded too.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Related work: find, sort, summarize, ask to coordinate](../../processes/related-work.html) | Search beans for relevance; Search issues and open PRs; Categorize and summarize; Record and act on the answer |

