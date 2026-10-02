---
# folio-assistant-mac1
title: Re-seed both fhir-ast caches with the git-tree InputDigest (needs FHIR network)
status: todo
type: task
priority: high
tags:
    - agy
    - needs-network
created_at: 2026-10-02T15:30:31Z
updated_at: 2026-10-02T15:30:31Z
parent: folio-assistant-uhkv
blocking:
    - folio-assistant-wnhh
---

Child of `wnhh` in substance: it is the last step that bean records as needed.

**For a local agent WITH FHIR network access** (`packages.fhir.org`, `tx.fhir.org`). The cloud session that opened this cannot reach them; it can restore and verify, not build.

## Why

Both `fhir-ast/*` caches were seeded with the OLD `InputDigest`, which hashed gitignored files too, so `ig-cache.sh verify` on any clean clone reads `stale-inputs` (smart-trust recorded `b2bbbfc4…`, a clean clone computes `c1023d82…`). The fix is now on `litlfred/fhir-ig-publisher@claude/ast-export` (`b9004fb`, owner-landed from fork #6), together with the Publisher's optional dependencies (`cf52eb7`, fork #7), so no manual classpath step is needed any more.

## Steps (from `~/space_cats`, siblings `fhir-ig-publisher`, `folio-assistant`, `smart-trust`, `smart-base`)

1. Build the exporter and write its classpath (`ig-cache.sh seed` reads `cp.txt`):
   `cd ~/space_cats/fhir-ig-publisher && git fetch && git switch claude/ast-export && git pull && mvn -f ast-export/pom.xml -q install && mvn -f ast-export/pom.xml -q dependency:build-classpath -Dmdep.outputFile=cp.txt`
2. Each IG at a CLEAN checkout of its main (no stray files — though they no longer change the digest):
   `cd ~/space_cats/smart-trust && git fetch && git switch main && git pull`
   (same for `smart-base`).
3. Seed from `~/space_cats` (so `$PWD/fhir-ig-publisher/ast-export` is found), one IG at a time:
   `cd ~/space_cats && bash folio-assistant/fhir-harness/scripts/ig-cache.sh seed --ig-root smart-trust --push`
   `cd ~/space_cats && bash folio-assistant/fhir-harness/scripts/ig-cache.sh seed --ig-root smart-base --push`
   `seed` refuses a candidate below 90 % of the incumbent's resources or edges; if it does, STOP and report the counts — do not `--force`.
4. Check before pushing anything else: `bash folio-assistant/fhir-harness/scripts/ig-cache.sh verify --ig-root smart-trust` must print `fresh`.

## Boundaries (owner rulings)

- Push ONLY to `fhir-ast/smart.who.int.trust` and `fhir-ast/smart.who.int.base` on the IGs' own repos. Never `main`, never a new repository for a package cache.
- Do not take FHIR packages from the npm registry — that namespace is squatted.

## Done when

- Both branches carry a new commit whose `manifest.json` `inputs.inputDigest` is `c1023d82…` (smart-trust at `25771f6a`) / `bd074bf9…` (smart-base), or the digest of the commit actually built, with `sourceRevision` naming it.
- `ig-cache.sh restore` + `verify` on a FRESH clone reads `fresh` for both — the cloud session re-checks this and records it on `wnhh` and #1816.
