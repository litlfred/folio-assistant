---
layout: default
title: 'Feature-request detection (CRDM trigger)'
parent: Skill instructions
---

{: .note }
> Generated from [`methodologies/crdm/crdm-detect.md`](https://github.com/litlfred/folio-assistant/blob/main/methodologies/crdm/crdm-detect.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/methodologies/crdm/crdm-detect.md){: .fa-edit-source }

{% raw %}
# Feature-request detection (CRDM trigger)

Detect when a user request is a **feature request** (platform capability change)
rather than a **content request** (writing, editing, reviewing folio content).
When a feature request is detected, the agent enters the CRDM requirements
workflow rather than implementing directly.

## Detection signals

Scan every user request for these categories of phrasing. A single match is
enough to flag; two or more from different categories is high confidence.

### Direct capability requests

Phrases where the user explicitly asks for new functionality:

- "I need a way to …", "can you add …", "we need a tool that …"
- "there should be a skill for …", "add a QA check for …"
- "the renderer should support …", "make the pipeline do …"
- "can we add a new block kind for …", "we need a content type for …"
- "it would be great if the agent could …"
- "the agent should …", "the agent needs to …", "we will need to …"
- "build me …", "create a tool …", "develop a feature …"

### Workflow gap descriptions

Phrases where the user describes a process that does not work today:

- "right now I have to manually …", "there is no way to …"
- "the current process for … is broken", "this workflow doesn't handle …"
- "we can't do … yet", "it's missing …", "it doesn't support …"
- "every time I need to …, I have to …" (manual workaround pattern)
- "other people need to be able to …"

### Platform-level change requests

Phrases that imply changes to folio-assistant itself (not folio content):

- "change the schema to …", "modify the pipeline …"
- "add a new adapter …", "the constraint should …"
- "update the CI to …", "the workflow should fire when …"
- "the MCP tool needs to …", "register a new tool for …"
- "the upstream change requests to …", "upstream asks" — a change asked of a
  tool this platform DEPENDS ON is still a platform change; the folio is not
  where it lands either way
- References to files under `schemas/`, `content/pipeline/`, `adapters/`,
  `src/`, `scripts/`, `.github/workflows/`

### Cross-cutting concerns

Phrases that affect multiple folios or content types:

- "for all papers …", "every folio should …", "across all content types …"
- "when any user …", "the platform should …"
- "this needs to work for both document and paper folios"

### Review-surfaced needs

Phrases that emerge during content review:

- "this review process would be easier if …"
- "we need a way to triage these comments …"
- "the feedback workflow should …"
- "stakeholders need to be able to see …"
- "can we make the review process more …"

### Self-declared genre

The mirror of `"Migration record: …"` below. Some documents say what they are in
their own first line, and a **proposal** or a **design document** argues for a
change that does not exist yet — which is a feature request whichever category
its sentences fall into.

- "Proposal: …" as a document's OPENING line
- "design document for …"

Anchored to the opening line on purpose. A document that *mentions* a proposal
is not one: #187 asks for a write-up of a merged proposal's changes and is not
a feature request, while #199 IS that write-up. An unanchored `proposal` costs
that distinction — measured, not supposed.

## What is NOT a feature request

Do not trigger CRDM for:

- "Write the next section of chapter 3" — content authoring
- "Fix the typo in the overview" — content editing
- "Run content_validate" — tool invocation
- "What does this block kind mean?" — information request
- "Review chapter 5" — content review within existing workflow
- "Create a bean for …" — work-plan management
- "Migration record: …" — a record of work already DONE, not a request for
  work; the tense is the signal
- Bug reports about existing features (unless they imply a redesign)

## On detection — what to do

Do NOT use the term "CRDM" with the user. It is internal methodology jargon.

**If new session** and the first request is a feature:
1. Acknowledge the request as a feature/capability change
2. Explain that you will help them work through the requirements before building
3. Start Phase 1 (needs assessment)

**If existing session** and the user is already in a CRDM cycle:
1. Incorporate the new request into the current requirements document
2. Continue with the current phase

**If existing session** and the user is doing content work (not in CRDM):
1. Synthesise what you have heard as a feature need
2. Ask the user:
   - "This sounds like a platform change rather than content work. Would you
     like to pause and work through the requirements now, or should I note it
     for later?"
   - If **pause**: enter CRDM Phase 1, return to content work when done
   - If **later**: create a bean with as much context as possible, linking to
     any relevant GitHub issue

## Issue association

Feature work should be linked to a GitHub issue:

1. **Scan open issues** for a match — search by title/body keywords
2. **If match found** — ask user: "This looks related to #NNN — should I add
   your requirements there?"
3. **If no match in open issues** — scan recently closed issues
4. **If no match at all** — ask the user to create an issue (do NOT create
   without permission)
5. **Do not proceed without an issue link** — the issue is where stakeholders
   do feature sign-off; without it, there is no review surface

Requirements may span multiple issues. The agent should link to all relevant
ones and note the relationship.

## After implementation

When a PR is merged that addresses a feature from this process:

1. **Post a summary comment** on the linked GitHub issue describing what the
   PR accomplished
2. **PRs are for code review** (agent and human coders, code reviewers)
3. **Issues are for CRDM stakeholders** — the requestor, the BA, and updates
   from the coding team for feature sign-off
4. Many beans per issue — they are not synonymous

## A feature is a COLLABORATION you are joining, not a fix you are making

Owner, 2026-09-21, and this is the framing the rest of this file sits inside:

> when agent in discussion with human and a feature comes up, it starts or
> engages w/ existing collaborative design requiremnts between this user,
> other users/authors/etc. other agents. treat the design/feature process as
> such. it's not a one off fix... put it into epcis/stories.etc.
> update/create needed artefacts and link to them under the appropriate
> harnesse's docs/ page.

### The default that is wrong

A feature surfaces mid-conversation, the agent understands it, and the agent
builds it. The conversation felt like the requirements gathering, so it stands
in for them. Everything needed to review the decision — the alternatives, the
reason, who else it affects — stays in a chat log that nobody else will read
and that is gone tomorrow.

**That is the failure this section exists to name.** It does not look like a
mistake at the time; it looks like being responsive.

### What to do instead

**1. Assume the conversation is not the first.** Before treating a feature as
new, look for the collaboration it belongs to: an open issue, an epic, a bean,
a sibling session's branch, a spec. This repository has many of each and they
are cheap to search. A feature that arrives without a home usually has one.

**2. There are OTHER PARTICIPANTS, and they are not all present.** Other
authors, other users, other agents working other branches. Two consequences:

- the record has to be legible to somebody who was not in the conversation —
  which is what the issue is FOR, as against the PR (code review) and the
  bean (work plan);
- a sibling session may already be solving it. Check before you build, and if
  their answer differs from yours, that is a design discussion to have on the
  issue rather than a merge conflict to win.

**3. Structure it: epics and stories, not a task.** A feature that is worth
doing is worth a place in the roadmap. This store's hierarchy is
`milestone → epic → feature → task`, and `check-bean-parents` enforces that
every open bean has a home. A feature filed as a bare task with no parent
lands in the roadmap's Miscellaneous section, which is where work goes to stop
being planned.

**An epic cannot parent an epic here.** When the subject already has an epic,
the new work is a FEATURE under it — a second epic beside it splits one
subject across two roots, which is how a roadmap becomes unreadable.

**4. Write the artefacts, and LINK them from `docs/`.** The owner's
instruction is specific and it is the part most often skipped: *"update/create
needed artefacts and link to them under the appropriate harnesse's docs/
page."*

An artefact nobody can navigate to is an artefact nobody will read. The
harness that owns the capability owns the link — so a change to cat-harness's
pipeline is linked from cat-harness's `docs/`, not from wherever the agent
happened to be working. Which harness owns it is usually answered by which
instance declares the directory the change lands in.

### The test

> **If this session ended now, could somebody who was not in it pick the
> feature up — find what was decided, what is still open, and who else is
> affected — without reading the chat?**

If the answer is no, the collaboration has not been joined yet, whatever has
been built.

### What this does NOT mean

It does not mean every small change becomes an epic. The trigger is the same
one `opening-brief` uses: **irreversibility and surprise**, not size. A
one-line fix to a typo in a generated file is a fix. A one-line change to a
schema that three instances resolve against is a feature, because other people
have to live with it.

Nor does it mean stopping work to do paperwork first. `continual-progress`
still holds — branch, commit, push, open the PR from commit #1. The point is
that the *record* is collaborative, not that the *work* pauses.
{% endraw %}
