---
# folio-assistant-h32d
title: 'Memory and todos: one schema, attachable to any KG node, stickies in the rendered folio'
status: todo
type: task
created_at: 2026-09-19T00:58:13Z
updated_at: 2026-09-19T00:58:13Z
---


**Requirements capture, 2026-09-19.** Stated by the author; recorded verbatim in
substance before any design, because it arrived as one long message and the
author types with difficulty. Nothing here is my synthesis unless marked so.

Supersedes the framing of `folio-assistant-7sf1` (move MEMORY.md into the kg
graph), which is now the narrow first slice of this.

## 1. The model

**Memory workflows are GENERIC — not per actor kind.** The same mechanism
serves a human and an agent; what differs is the storage and the trigger point.

| | memory | workflow management |
|---|---|---|
| human actor | **todos** | *— nothing —* |
| agent actor | **`MEMORY.md`** | **beans** |

**Triggers**, and there are two kinds:

- **Content-based**, actor-agnostic: *"this is something new"*, *"you have not
  seen this in a while"*.
- **Actor-specific and deliberate**: *"I want to dispatch an agent with a
  specific memory context for a narrow task."*

**The associations are part of the SKILLS.** Memory and todos attach to:

- tasks
- processes
- decision tables
- folios
- any other content type
- or at the **top level** of the folio

**Todos act like stickies**, and the **human actor can alter their contents** —
unlike a generated artefact.

**One metadata schema base, shared by todos and memory**, for cross-referencing:
issues, PRs, beans, human actors, roles, tasks, SHAs, and so on.

**Memories are overlaid in DEPENDENCY ORDER**, the same way other context
setting composes. *(Author's open question: a tool node with a library for
this?)*

## 2. The rendering — stickies in just-the-docs

- A todo on a web page shows at the **top of the page as a sticky icon with a
  count**.
- Opening them shows the stickies **on the page, positioned relative to the
  content they are assigned to**.
- The user can **expand and contract individual stickies**.
- **Stacking follows the hierarchy of business subprocesses.**
- A **toggle icon in the navbar tiles** shows todos.
- Opening the todo icon opens, **in the main display, a panel with all the
  stickies neatly lined up**.
- The user can **pick a sticky up and move it off the display panel**, making it
  **fixed on the web page** (floating).
- **Closing a floating sticky returns it to the display panel.**
- While floating, it is **greyed out on the sticky panel**; clicking the greyed
  (disabled) entry also returns the sticky.
- **`[x]` icon** closes an open sticky.
- **Pencil icon** edits the markdown.

## Status

CRDM Phase 1 — needs captured, not yet synthesised into requirements, not
started. No GitHub issue yet: CRDM requires one for feature work and forbids
creating it without the author's permission, so that is the next ask.

Issue scan done 2026-09-19 — nothing existing covers this. Open issues are
#203 (business requirements gathering — CRDM), #202, #201 (migration records),
#247 (cross-agent skill install), #204 (IG incremental build).
