---
# folio-assistant-eayu
title: 'who-iris separation: generic DSpace code to the platform; IRIS-specific code flagged'
status: in-progress
type: task
priority: normal
created_at: 2026-09-30T22:52:49Z
updated_at: 2026-09-30T22:52:58Z
parent: folio-assistant-vke6
---

## Why
Owner ruling 2026-09-30, verbatim: "dspace scripts generic in folio-assistant. iris specific tools for now ok in who-iris/ but make sure fails QA finding".

who-iris/ is a staged instance that will move to its own CONTENT repository (litlfred/who-iris). kg-separation / bootstrap FR-7: a content repository holds no code. who-iris-tools is NOT authorised.

## Done when
- every code file under who-iris/ is classified generic vs IRIS-specific, with a reason
- generic DSpace/catalogue code lives in the platform, parameterised by instance
- a kg:audit finding FAILS (non-blocking severity) while a staged content instance holds code, naming each file; passes on a clean instance
