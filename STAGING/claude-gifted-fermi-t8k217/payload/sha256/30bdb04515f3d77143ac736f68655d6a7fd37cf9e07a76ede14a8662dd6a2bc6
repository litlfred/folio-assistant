---
# folio-assistant-sd5v
title: 'SPDX 3 applicability: where it should, could and should not be used — impact on processes, tasks and gates'
status: in-progress
type: task
priority: normal
created_at: 2026-10-03T10:14:26Z
updated_at: 2026-10-03T10:44:49Z
parent: folio-assistant-zzmr
---

Owner, 2026-10-03: deep analysis of where SPDX v3 could/should/should not be used (test results, QA reports, tool definitions...), impact analysis on missing processes/tasks and on existing ones. Deliverable: cat-harness/docs/proposals/spdx-3-applicability-2026-10-03.md. Not building anything: owner decisions first.

## Done when
- [x] proposal written and linked from proposals index
- [ ] owner has answered the decisions (D1-D5) or deferred them — D4 answered (validation built); D1 deferred to bean `ffv7`; D2, D3, D5 not taken up


## Progress, 2026-10-03

- [x] SPDX 3.0 ingested (`library/omg-2024-spdx-3-0`), NIST 3.1 deck ingested, 3.1-RC1 schema queued, methodology node `spdx-3` (ingested, NOT adopted)
- [x] licence-id validation: `check:source-licence` validates every `stated` id as an SPDX expression over License List 3.29.0, pinned in `external-schemas/spdx-license-list.json` (owner: *"go ahead with licence-id validation, that's it for now"*)
- D1 (build SPDX documents?) — **waiting on downstream feedback, bean `ffv7`**. Owner asked "why would we need spdx at all? just export? what consumes?": nothing does today.
- D2–D5: not taken up; the owner stopped the scope at validation.

## Overlap findings (owner asked: where is authoritative, what is duplicative or unneeded, who consumes)

Measured by three read-only sweeps on 2026-10-03. Recorded here so they are not lost; none is acted on.

**Licence.** Authoritative: `library/<id>/licence.json` (fed by `intake.json` licence); the repo's own: `LICENSE` + `LICENSE-CONTENT.md`. Duplicates written independently: `THIRD-PARTY-NOTICES.md` (read by nothing), who-iris catalogue `materialization.gates.copyright` (no `licence.json` behind it), README §License, `NOTICE`, `package.json` `license`. **Contradiction:** glossary files declare `license: CC-BY-4.0` and publish it as `dcterms:license` in `docs/assets/glossary/*.skos.jsonld`, against `LICENSE-CONTENT.md`'s CC BY 3.0. Downstream: published library manifests (`meta.licence`), glossary SKOS, who-iris site, npm.

**Hash / fixity.** Authoritative: the bytes → `structure.json` `source.sha256` → manifest `meta.source_sha256`; for materialised copies `materialization.fixity`, the only record re-hashed by a gate. Unchecked duplicates: `intake.files[].sha256` (nothing reads the hash, only the array length), `extraction.json` sha256, fsh-guts sidecar prose. Unneeded: 16-hex section front-matter prefix, `binary-release` digest (no instances).

**Bibliographic.** Authoritative: the Dublin Core record where one exists, else `referenced.json` identity; `library-title.ts` resolves titles. Duplicates: catalogue node `title` (unchecked, and the viewer prefers it), `intake.title` (never read by the resolver), methodology `origin` prose, `external-schemas` version (e.g. BPMN record says 2.0, library entry 2.0.2). Three separate title resolvers with different orders.

**Provenance.** Authoritative: `materialization.provenance` + fixity (bytes), `intake.source` (capture event), workflow-history PROV (who did what). Duplicates: DC `provenance` repeats intake `capturedAt/By`; `referenced.json` upstream URL held three times; intake upstream (`/items/<uuid>`) vs catalogue (`/handle/…`) never compared. Unread: `read_from` / `read_at`.

**Version.** Authoritative: `<instance>.json` `version`. The release workflow derives its version from the tag and reads neither that nor `package.json` — the three can disagree. Unneeded: `cat-harness-tools/package.json` version, `0.0.0` skill-package versions.

**Dependencies.** Authoritative: `<instance>.json` `needs[]`; `python-deps.ts`. Duplicate: `dependencies.folioAssistant` (merged at read time, no drift gate). Unneeded: skill `dependsOn` (only a legacy generator reads it). `depends-on.ts` FHIR export is derived but emits mostly gaps (few instances declare `canonicalUrl`).

**Agent identity.** Five spellings of "who": `QaReviewer`, `ReviewerRef`, `Attribution`, `inspected_by`, PROV agent; 0 of 5,896 QA reviewer entries resolve to an actor. `oa:` (Web Annotation) is declared and never instantiated.

**Where SPDX would sit if ever built:** generated from these authoritative records at export — never a new authored copy.
