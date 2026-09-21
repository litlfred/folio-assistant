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
When a feature request is detected, the agent works through requirements rather
than implementing directly.

## Which requirements methodology — the fork this detection now carries

**Detecting a feature request no longer selects CRDM by itself.** Since
2026-09-21 (issue #730, the owner's option A) there are **two** parallel
requirements methodologies, and `methodology-adoption` forbids blending them.
The signals below tell you a request needs requirements; this fork tells you
whose.

| | governs | requester | the answer depends on |
|---|---|---|---|
| **`crdm`** — this methodology | stakeholder-facing WHO/IG work: needs assessment, BPA, stakeholder sign-off | content developers, via a BA | a folio's subject matter |
| **[`spec-kit`](../spec-kit/spec-kit.md)** | folio-assistant feature development; software-development best practice, closer to a scrum process | **tool developers** | nothing a folio says — **content-agnostic** |

The owner's words, 2026-09-21: *"CRDM stays for stkaeholder facing WHO/IG
work…..spec-kit is specific to folio assistant feature development requests by
tool developers not content developers (content agnostic, more scrum methodology
process) for best practives of software development"*.

**Most of the signals listed below are now spec-kit's**, not CRDM's — the
"Platform-level change requests" and "Direct capability requests" categories
especially, since both describe somebody building the tooling. Read the
categories as *this needs requirements*, then apply the fork.

Two things bind under **either** methodology and are not a reason to pick one:
the issue-association rules at the end of this file, and the spec-before-code
gate.

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
{% endraw %}
