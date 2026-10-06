---
# folio-assistant-6mk7
title: 'A refused packages.fhir.org did not lead the agent to fhir-cache-seed-npm: symptom-to-Tool lookup is missing, and the mirror the skill names does not exist'
status: in-progress
type: bug
priority: high
created_at: 2026-10-06T06:31:37Z
updated_at: 2026-10-06T06:42:37Z
parent: folio-assistant-rwmf
---

Owner, 2026-10-06: *"why didnt you know about the tool already? what KG process broke down?"*

## What happened
Session https://claude.ai/code/session_01EcBv3uwKYcnNbCC6BcPG92 needed SUSHI clean on three IG repositories (owner preference). SUSHI failed: packages.fhir.org is refused by the egress proxy. The agent told the owner "SUSHI can't run in this container" and moved on. The owner pointed at the answer ("github.com clone egress. check tools"): Tool `fhir-cache-seed-npm` (fhir-harness/tools/index.ts) exists for exactly *"an environment that cannot reach packages.fhir.org"*.

## Why the graph did not surface it
1. **The MCP server was down** (`folio-assistant` CONNECTION_CLOSED at session start), so `skill_list` / `skill_fetch` / Tool lookup were unavailable. AGENTS.md says to fall back to the `kg` graph declared in `<instance>.json`. Nothing prompted that fallback when a capability was missing.
2. **The diagnostic that sees the symptom does not name the remedy.** `ig-cache.sh doctor` prints `network: packages.fhir.org UNREACHABLE` and stops.
3. **No symptom-to-Tool index.** A Tool says what it does. Nothing lets an agent go from "host X refused" to the Tool whose description names X. The only prose pointer is deep in `fhir-ig-base/ig-publisher-fork.md` §"Without packages.fhir.org".
4. **The documented gap-closer does not exist.** That skill names `--mirror https://github.com/litlfred/fhir-package-mirror` for the 24-25 pinned HL7 versions that are on neither npm nor publisher sites. Measured the same day, that repository does not exist (`list_repos`: no match; `ls-remote` asks for credentials). With the seeder, smart-trust still lacks 25 packages, so SUSHI still cannot run here.

## Done when
- [ ] `ig-cache.sh doctor`, and any check that finds packages.fhir.org unreachable, names `fhir-cache-seed-npm` and its command
- [ ] the skill an agent reads before running SUSHI points at the seeder (the owner chooses which skill that is)
- [ ] the owner decides on a general symptom-to-Tool lookup (for example a `remedies:` field on a Tool, keyed by the host or error it addresses, with a gate keeping it non-empty for network-dependent Tools)
- [ ] `litlfred/fhir-package-mirror` exists and is filled from a machine that reaches packages.fhir.org, or the skill stops naming it
- [ ] MEASURED AFTER: in a container with packages.fhir.org blocked, SUSHI on smart-trust exits 0 using only documented tools

_2026-10-06T06:42:37Z_ — Claimed by claude/bold-brahmagupta-c8eoku — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
