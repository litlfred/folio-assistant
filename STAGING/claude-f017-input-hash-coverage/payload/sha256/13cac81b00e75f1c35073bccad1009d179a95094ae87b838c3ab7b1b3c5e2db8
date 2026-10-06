---
# folio-assistant-hx65
title: 'S0 main green: five red jobs on cdb0a018, submodule pins, orphan-sidecar ruling'
status: completed
type: task
priority: critical
created_at: 2026-10-01T08:14:33Z
updated_at: 2026-10-01T15:09:20Z
parent: folio-assistant-7x5n
---

Failing on main cdb0a018 (gh api jobs): Repository gates #13 'workflow skill refs'; TypeScript #7 'bun test'; E2E #7 'playwright test'; Skill-registration chain #5 'registration chain is current'; Docs site #7 'Regenerate skill instruction pages'. Four merges landed before CI finished.

## Done when
- [x] each failing job named with step and cause (PR #1774 body; root cause: take-main merges 198a96f2e and 48aab0bd7 reverted PR0's checkout aggregates and regressed the submodule pins)
- [x] fix PR merged on per-job verified green — #1774 → a249bd309e67 (every job green on f00ebed), with #1769 (84b8b41) landing most of the restoration
- [x] submodule pins — SUPERSEDED by owner ruling (keep PR0's pins 7a91356 / c5e5e25); the bump to upstream f75a216 / 3046412 is its own follow-up bean. Original note: NOT TAKEN. Every committed artefact on main was generated at PR0's pins 7a91356 / c5e5e25 (9962556c9), which a merge regressed to f70a56c / 920c772; restored to 7a91356 / c5e5e25 (owner 2026-10-01: keep PR0's pins). At ebfa406 / 03832a8 our readme pipeline does not write bootstrap-tools' new generated-by banners; a later bump is its own change.
- [x] readme:subgraphs — log could not be read (proxy denies the log host); the check is GREEN on main since #1774/#1771, so the question is moot. Original note: not read: job logs redirect to a blob host the proxy denies. `readme:subgraphs:check` was stale on main and is regenerated in #1774.
- [x] owner ruling on 8 detangle + 1 kg-qa orphan sidecars recorded: WIDEN THE SCAN to each instance's own skills/, keep the files (owner, 2026-10-01)

## Owner rulings applied 2026-10-01 (S0, PR #1774)
- Orphan sidecars: kg-detangle also scans every instance's declared `skills` directories (checkoutDirectories), topics inherited from the instances each stacks on. The 8 orphaned detangle sidecars moved with their subjects (git mv); none deleted. The kg-qa orphan cleared once the declarations were restored. The hard `--gate-direction` keeps the literal scan until PR3 (bean 63wl): widened, it reports 104 wrong-direction edges that were dangling before (91 harness BPMN refs to skills PR1 moved up).
- who-iris IRIS code: a QA WARNING, not a failure ("QA warning. not failure.. ok b/c small # tools"). content-instance-holds-code is `minor` and still names the five files (bean eayu).
- READMEs: "Each repo owns its README". readme:sync:all skips an instance that is a git submodule (bean kye5). LANDED ON MAIN via #1769 (`isSubmoduleRoot` in readme-sections.ts), so #1774 carries no copy of it; nothing pushed to bootstrap-tools from S0.
- W3C library sources: "Add methodology citations". Three methodology nodes with `evidence:` (prov-o-provenance, odrl-policies, json-ld-serialisation), ported from #1769 (bean 6306). Supersedes bean f1qz's reading that no methodology relies on them.
## Owner rulings 2026-10-01 (relayed to the S0 agent)
Pins: restore PR0's bootstrap 7a91356 / bootstrap-tools c5e5e25. READMEs: each repo owns its own; folio-assistant stops regenerating and checking submodule READMEs. W3C sources: methodologies cite them (evidence:), reusing #1769; the test stays.


## Upstream done 2026-10-01
bootstrap f75a2167d226 (#1), bootstrap-tools 30464126ed93 (#4): READMEs reproducible (published-IRI term links) and each repo checks its own README in CI. S0 keeps PR0 pins; the pin bump to these is a follow-up after S0.


## Summary of Changes
Main is green (Code-quality gates green from 84b8b41; #1774 merged a249bd3 carrying the owner's widen-scan and who-iris-warning rulings). Root cause: two take-main-side merges (198a96f2e, 48aab0bd7) undid placement PR0a and regressed the submodule pins; restored by #1769 and #1774.
