---
# folio-assistant-fq5u
title: 'DOWNSTREAM TOOLS IN QA: a run record per downstream tool, and QA goes stale when its inputs change — LSI first'
status: todo
type: feature
priority: high
created_at: 2026-09-29T23:46:01Z
updated_at: 2026-09-29T23:46:01Z
parent: folio-assistant-1swy
---

**Owner, 2026-09-29:** *"also how do we know tools like LSI are run succesfully... not primary to pieple, but downstream. should be part of QA process (dependences = stall QA)"* — then chose **"Generalize after #1483"**.

## What exists (measured 2026-09-29)
- LSI (latent semantic index) is draft PR #1483 / issue #1482 / bean `ansc`, branch `claude/brave-hawking-511rrx`, NOT merged. It adds kg:audit criterion **`lsi-index-fresh`**: a large-enough prose graph with no index, or an index older than its graph's last change, is a finding (severity minor). It detects corpus staleness by fingerprint; it does NOT record whether the LSI run itself succeeded.
- Other downstream tools with INVISIBLE failure today: the site search index (`search-data.json`, built implicitly by Jekyll; nothing checks it — empty would ship green), staging generators (`|| true`), publish.yml witness regeneration / `check-witnesses` / atlas render, dispatch-only API doc builds. `check:ci-health` sees whole-run conclusions only, so all read green.
- Staleness machinery that exists but not for these: block QA sidecars (`field_hash`/`script_hash`/`deps_hash`/`def_hash`, `entryIsFresh`), `folio-test-run/v1` data/process hashes, render manifest input hashes (no outcome, no CI caller), `check:maintained-artefacts` (presence, not freshness), `publish-verify` VERIFIERS.

## Design (owner's choice)
One QA criterion family generalizing `lsi-index-fresh`: every downstream tool is a Tool node that `maintains` its output with DECLARED inputs and records its run outcome. QA reads:
- **stale** when a declared input's hash changed since the recorded run (dependencies ⇒ stale QA);
- **not-run / failed** when there is no successful run record — never green (the three-state rule);
- **fresh** only when a successful run's recorded input hash matches the current one.

## Done when
- [ ] #1483 merged (this builds on `lsi-index-fresh`) — BLOCKED until then
- [ ] the criterion family exists, with LSI as its first member (run outcome + input fingerprint)
- [ ] the site search index is the second member, with a pre-publish verifier (present, parses, non-empty, entries ≈ page count)
- [ ] a downstream tool with no declaration is itself a finding
- [ ] stale / not-run surface where people already look (`bun run health` or the kg:audit report)
