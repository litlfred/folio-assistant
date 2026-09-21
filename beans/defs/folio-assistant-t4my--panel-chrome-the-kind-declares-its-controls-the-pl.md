---
# folio-assistant-t4my
title: 'PANEL CHROME: the kind declares its controls, the platform fixes the frame, badges ride the avatar'
status: todo
type: task
priority: normal
created_at: 2026-09-20T21:46:57Z
updated_at: 2026-09-20T21:46:57Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R10 + R7. Unit 6 of 10.

The owner: *"each content type controls its own avatar, visualtion/rendering. but
assume they can open a full screen panel w/ fixed controls like [x] or [linksrc] or
[edit] or what not depedning on conent."*

**CRDM Q7, answered: the kind declares its controls; the platform fixes the chrome.**
`[x]` is always present and always in the same place — a reader learns the frame
once — and each content type declares which of the known controls it offers. The
platform VALIDATES that a declared control exists, so a typo is a finding rather
than a missing button.

This extends Q4 rather than contradicting it: Kind already owned the avatar and the
zoom threshold; it now owns its whole rendering, under a fixed frame.

**And R7 falls out of it**: a node rendered as its avatar carries the same badge,
from the same query as R6. Nothing renders content as an avatar today, so there is
nowhere to put one until unit 4 lands.

**Carry the capability lesson from `pb04`**: an `[edit]` that the pipeline cannot
perform is worse than no button — on a private repository it 404s for exactly the
reader who cannot edit, which reads as "this page is broken". A declared control
that the environment cannot serve is HIDDEN, and the reason is reported.

## Done when

- [ ] a declared control set per kind, validated against a known list
- [ ] `[x]` fixed: same place, same behaviour, every kind
- [ ] a control the pipeline cannot perform is hidden, with the reason reported rather than swallowed
- [ ] the same badge on the avatar and on the open window, from one query
