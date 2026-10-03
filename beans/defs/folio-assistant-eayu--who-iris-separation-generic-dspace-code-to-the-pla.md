---
# folio-assistant-eayu
title: 'who-iris separation: generic DSpace code to the platform; IRIS-specific code flagged'
status: in-progress
type: task
priority: normal
created_at: 2026-09-30T22:52:49Z
updated_at: 2026-10-01T08:56:29Z
parent: folio-assistant-vke6
---

## Why
Owner ruling 2026-09-30, verbatim: "dspace scripts generic in folio-assistant. iris specific tools for now ok in who-iris/ but make sure fails QA finding".

who-iris/ is a staged instance that will move to its own CONTENT repository (litlfred/who-iris). kg-separation / bootstrap FR-7: a content repository holds no code. who-iris-tools is NOT authorised.

## Done when
- every code file under who-iris/ is classified generic vs IRIS-specific, with a reason
- generic DSpace/catalogue code lives in the platform, parameterised by instance
- a kg:audit finding FAILS (non-blocking severity) while a staged content instance holds code, naming each file; passes on a clean instance


## Progress 2026-10-01 (branch claude/magical-archimedes-4qkfxp-who-iris-code)
- Moved to folio-assistant-core/scripts/ (instance root as argument): check-catalogue.ts, gen-covers.ts, lib/bytes.ts, lib/local-path.ts, gen-covers.test.ts, local-path.test.ts.
- Stay in who-iris (IRIS-specific): scripts/gen-iris-pages.ts, scripts/tests/{gen-iris-pages,catalogue-links}.test.ts, themes/themes{,.test}.ts.
- kg:audit criterion content-instance-holds-code (major) fails on who-iris with those 5 files; bootstrap passes; new optional declaration field separation: content|tools.
- Open: no PR yet (caller's instruction); who-iris-tools not authorised.

## Owner ruling 2026-10-01 — a QA WARNING, not a failure (S0, bean hx65, #1770)
Owner, verbatim (relayed by the lead session): "QA warning. not failure.. ok b/c small # tools". The five IRIS-specific files STAY in who-iris/; no who-iris-tools repo.
Applied in PR #1774: content-instance-holds-code severity major -> minor (cat-harness/schemas/kg-qa.ts, with the ruling as its warrant); the detection is kept and still names every file — content-holds-code.test.ts now asserts severity minor AND the exact five files. kg-separation.md updated. Also restored who-iris.json separation: content, which a take-main merge on the #1728 branch (473805a37) had dropped, so the criterion had silently gone n/a on main.
