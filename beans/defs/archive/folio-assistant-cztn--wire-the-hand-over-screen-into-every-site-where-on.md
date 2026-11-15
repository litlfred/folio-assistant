---
# folio-assistant-cztn
$schema: bean/1.0.0
title: WIRE THE HAND-OVER SCREEN into every site where one agent's, tool's or person's text reaches another model
status: completed
type: task
priority: normal
created_at: 2026-10-07T19:29:00Z
updated_at: 2026-10-07T21:38:21Z
parent: folio-assistant-ieum
---

Owner 2026-10-07: 'work: Connecting the hand-over screen to the places that hand work between agents'. #2390 shipped screenHandover/fenceUntrusted with ONE caller (the chat prompt). This bean: measure the hand-over sites from the code (not guessed), wire the screen or the fence into each, refuse-never-repair per H3/H9.

## Done when
- [x] sites listed, each with what flows, structured or free text, and what guards it today
- [x] each LLM-reaching site screened (structured) or fenced (free text), with a test
- [x] sites deliberately left unwired are listed with why

Session: https://claude.ai/code/session_01FWGdsHong3XHiU7CMRWmfo


## Summary of Changes

Every in-code site where foreign text reaches a model is guarded: `guardUntrusted` (screen + fence + quarantine notice; JSON leaves screened) in both chat routes, the document system prompt, both triage copies and branch characterization; `screenHandover` on `workflow_complete` (control fields refuse, the note quarantines and is folded to one line; the screened copy is what is passed on). Sites left unwired, each with its reason, are listed in skill `zero-trust-handover` §'Where the screen is wired'. Merged in #2454.
