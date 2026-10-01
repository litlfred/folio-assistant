---
# folio-assistant-9y9j
title: 'JSON-LD VOICE: the rules every emitted JSON-LD document is written and reviewed against, cited to the held W3C texts'
status: in-progress
type: task
created_at: 2026-10-01T16:24:38Z
updated_at: 2026-10-01T16:24:38Z
parent: folio-assistant-scfh
---

Owner, 2026-10-01: 'make sure that these issues are part of the one voice for jsonld'; then chose option 1 — a new voice, with 'jsonld' added as a voice target, owned by cat-harness, each rule cited (check:voices enforces citations).

Rules (from jcet and the PROV measurement, each to be cited verbatim to a held source):
1. object properties are links (@type @id), never literals — measured: 100 activities in 9 PROV reports carry agent/hadRole/hadPlan as @value
2. a link's value is the node's release address (<iriBase><version>/<path>[#frag], the check:node-iris rule); where none exists, keep the literal AND raise a finding
3. no @base in a remote context (JSON-LD 1.1 §4.1.3) — measured: works today only through jsonld.js
4. no context fetched at run time; an external context is held locally with its sha256
5. coercion attaches to TERMS: a compact-IRI key does not inherit a term's @type
6. PROV is written in PROV-JSONLD's shape (W3C Member Submission 2024)

## Done when
- [x] ~~'jsonld'~~ 'code' is a voice target (owner: "a voice for a coding agent, in a code authoring or review task"); judgesBlocks keeps it off folio prose
- [x] folio-assistant-core/skills/voices/linked-data/voice.json, 7 rules, in force for authoring-agent and code-reviewer in Process_CodeChangeReview / Process_CodeReview; check:voices green; every quote verified verbatim (owner 2026-09-21: the platform holds no voice content, so NOT cat-harness)
- [x] json-ld-serialisation and prov-o-provenance methodology nodes point at the voice; prov-o cites library/w3c-2024-prov-jsonld
- [ ] regen fixed point; CI
