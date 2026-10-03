---
# folio-assistant-9hxd
title: 'CREDENTIALS (iii): credentials/ declaration (needs, profile, registry) for bootstrap-tools and folio-assistant'
status: todo
type: task
created_at: 2026-10-02T06:31:22Z
updated_at: 2026-10-02T06:31:22Z
parent: folio-assistant-5a3l
blocked_by:
    - folio-assistant-vobp
---

From the proposal cat-harness/docs/proposals/credentials-needs-and-supply.md §2.3–2.4 (D3=A). Register three graph kinds: credential-needs (context), credential-profile (context), credential-registry (state). Write the needs for every secret in §1.1. The profile is personal-github with the App (D1=A). Declare sign-artefact as a need with no supply yet (D4=A). bootstrap-tools carries its own file, tagged with $schema and with no import (falsifier 4). Contains no values. Not built yet.

## Done when
- [ ] both instances declare credentials/ and the kinds validate
- [ ] every secrets.* reference in both repositories maps to a declared need
