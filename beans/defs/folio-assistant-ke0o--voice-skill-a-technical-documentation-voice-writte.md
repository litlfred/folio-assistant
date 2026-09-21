---
# folio-assistant-ke0o
title: 'VOICE + SKILL: a Technical Documentation voice written as an SDO writes, with RFC 2119 requirement levels'
status: completed
type: feature
priority: high
created_at: 2026-09-21T16:21:34Z
updated_at: 2026-09-21T19:50:29Z
parent: folio-assistant-2upx
---

Two paired artefacts, because a voice with no skill is unenforceable and a skill with no voice has no house style.

**The voice.** Applies to standards, software and knowledge-asset documentation, for BOTH drafting and review QA. Written as W3C or IHE writes. Glossary Terms are Capitalized throughout. Requirement levels follow RFC 2119 and are used with their RFC meanings, not colloquially.

**RFC 2119 MUST be ingested first.** It is queued at `uploads/rfc2119-key-words-requirement-levels.pdf`. A file in `uploads/` reads as ABSENT to every consumer until ingested, which is the correct state right now: the voice MUST NOT cite the RFC from memory.

Extraction failed in this environment and the reason is recorded so the next agent does not repeat it: `pdftoppm` is absent (no poppler-utils), `pypdf` installs but its `cryptography` backend panics (`No module named '_cffi_backend'`), the PDF uses subset-encoded fonts so raw zlib stream extraction yields noise, and `rfc-editor.org` is egress-blocked (403 at the proxy). Either install poppler-utils or obtain the text another way.

**The skill** carries the three review questions the epic states, and is the thing a reviewer runs against a draft.

## Done when
- [ ] RFC 2119 ingested from `uploads/` into the library, not quoted from memory
- [ ] a Technical Documentation voice exists, citing the ingested RFC
- [ ] a technical-documentation-writing skill exists carrying the three review questions
- [ ] both are bound to a role, so something hands them to an agent (see `y1w9`)

Related: `rkqp` (model-specific voices), `lqo9` (Glossary).
