---
# folio-assistant-hx65
title: 'S0 main green: five red jobs on cdb0a018, submodule pins, orphan-sidecar ruling'
status: todo
type: task
priority: critical
created_at: 2026-10-01T08:14:33Z
updated_at: 2026-10-01T11:36:41Z
parent: folio-assistant-7x5n
---

Failing on main cdb0a018 (gh api jobs): Repository gates #13 'workflow skill refs'; TypeScript #7 'bun test'; E2E #7 'playwright test'; Skill-registration chain #5 'registration chain is current'; Docs site #7 'Regenerate skill instruction pages'. Four merges landed before CI finished.

## Done when
- [ ] each failing job named with step and cause
- [ ] fix PR merged on per-job verified green
- [ ] submodule pins bootstrap ebfa406, bootstrap-tools 03832a8; translation templates re-extracted
- [ ] readme:subgraphs cause (02f16ae98bb) read from the job log
- [x] owner ruling on 8 detangle + 1 kg-qa orphan sidecars recorded: WIDEN THE SCAN to each instance's own skills/, keep the files (owner, 2026-10-01)


## Owner rulings 2026-10-01 (relayed to the S0 agent)
Pins: restore PR0's bootstrap 7a91356 / bootstrap-tools c5e5e25. READMEs: each repo owns its own; folio-assistant stops regenerating and checking submodule READMEs. W3C sources: methodologies cite them (evidence:), reusing #1769; the test stays.


## Upstream done 2026-10-01
bootstrap f75a2167d226 (#1), bootstrap-tools 30464126ed93 (#4): READMEs reproducible (published-IRI term links) and each repo checks its own README in CI. S0 keeps PR0 pins; the pin bump to these is a follow-up after S0.
