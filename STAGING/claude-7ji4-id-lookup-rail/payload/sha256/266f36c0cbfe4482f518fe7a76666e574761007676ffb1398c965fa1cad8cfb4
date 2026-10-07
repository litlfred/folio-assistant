---
# folio-assistant-5blc
title: 'Digital Transformation Handbook (DTH): a voice, an L1 document subtype on Reference Architecture + DIIG concepts, and a source of methodologies / processes / glossary'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T18:16:53Z
updated_at: 2026-10-04T10:16:01Z
parent: folio-assistant-qvxh
---

Owner, 2026-10-01 (during stage D, #1767), attaching 9789240116191-eng.pdf (DTH for health product catalogue): 'use for one voice for "Digital Transformation Handbook" a specific type of a L1 document that uses the Reference Architecture and DIIG concepts', then 'also as source of methodologies / processes / glossary'. Same session: commit 27078551 on main uploaded four WHO DTHs to uploads/ (primary health care 9789240093362 — already in smart-base/library; supply chain architecture 9789240101197; health product catalogue 9789240116191; the DRAFT Reference Architecture for DPI-H).

Queued, not started: stage D (#1795) was in flight; this belongs to D5 (L1 kind, bean qvxh) and the library half is bean tyo0.

## Done when
- [x] the three new handbooks ingested into smart-base/library via the ingest pipeline (bean tyo0), licence read from each
- [x] a DTH voice in smart-base (voices graph), derived from the handbooks' own register, as the WHO digital-health voice was from its corpus
- [x] DTH declared as a subtype of the L1 document kind (qvxh), whose required structure names the Reference Architecture and DIIG concepts it uses — read from the handbooks, not assumed
- [x] methodologies, processes (BPMN) and glossary terms the handbooks define, each extracted with a citation to its handbook section; owner reviews the list before they are authored
- [x] no empirical claim from a handbook enters a formal statement
- [x] (owner 2026-10-03) contradictions recorded as ALTERNATIVES, none chosen — smart-base/findings/dth-term-alternatives.json + generated dth-terms.md, gated by smart-base:dth-terms:check (#1984, PR #1985)
- [x] (owner 2026-10-03) one DIIG seven-phase figure as source: DIIG §1.1 Fig. 1.1.1; dth.json cites it first and names PHC Fig. 6 / SC Fig 5 / PC Fig. 4 as reproductions
- [x] (owner 2026-10-03) SVG rendering of DIIG Fig. 1.1.1 — bean 70zt
- [x] (owner 2026-10-03) RA "Actor" explained against F-A and SG, with one PROPOSED change per layer (not applied)
- [x] owner decided the three Actor proposals (2026-10-03: all approved; F-A applied, RA comment and SG issue drafted)
- [ ] owner sends the RA comment and files the SMART Base issue (smart-base/findings/)

*2026-10-01* — Owner, two placement rules for the DTH kind: (1) "DTH should fit in somewhere in DIIG process ideally and utlized the Ref Arch" — so dth.json is placed as a step/output of the DIIG process (Digital Implementation Investment Guide, smart-base/library/9789240010567-eng) and draws its architecture sections from the Reference Architecture for DPI-H; (2) "some DTHs written befroe draft Ref Arch, but should really have been refernces" — the Reference Architecture is the normative reference a DTH cites, and the earlier DTHs (primary health care 9789240093362, supply chain 9789240101197, product catalogue 9789240116191) are read as instances that should have referenced it. The Ref Arch draft is ingested by bean tyo0 (PR #1826) as who-dpi-h-reference-architecture-draft-v1, licence CC BY-NC-SA 3.0 IGO on the owner's statement. Propose the design to the owner before authoring dth.json.

_2026-10-03T10:52:39Z_ — Claimed by claude/dth-voice-alternatives — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


*2026-10-03* — **Owner review of dth-candidates-2026-10-02.md**, verbatim, relayed from https://claude.ai/code/session_015Q15h1fg2Hh9MJXfAqr4h7:

> "go on DRK voices. contradictions -> alternative approaches/definitions. use one DIIG seven phase figure as source. need SVG rendering maybe as bean. RA Actor - give bigger explanation. explain changes to RA and/or F-A and/or SG. make a docs page under smart-base showing the glossary/terms differences findings"

("DRK" was read as DTH by the relaying session.) Issue #1984; branch claude/dth-voice-alternatives; session https://claude.ai/code/session_01Gr4236N1VpvD7cDWvtA856. SVG rendering of DIIG Fig. 1.1.1: bean 70zt.

Progress against the done-when list, as measured on main today: the three handbooks are ingested (tyo0, #1826). The DTH voice is smart-base/skills/voices/who-digital-transformation-handbook (f113cb246). dth.json extends l1 (56657f79d, #1830). The candidate list is 1d0afddc6.


*2026-10-03* — **Owner ruling on the three Actor proposals**, verbatim, relayed from https://claude.ai/code/session_015Q15h1fg2Hh9MJXfAqr4h7:

> "1. F-A mapping, 2. Draft RA comment, 3. SMART Base proposal"

All three approved. (1) F-A mapping APPLIED in PR #1985: closeMatch from the glossary's role entry to RA §3.7.2 and to SMART Base GenericPersona, plus one sentence in role-model. (2) RA public comment DRAFTED as smart-base/findings/ra-actor-comment.md and not posted; the owner sends it. (3) SMART Base issue DRAFTED as smart-base/findings/smart-base-persona-issue.md and not filed; the ingested copy is not edited.

## Progress 2026-10-04 (wm63 session)

- **Handbooks ingested:** tyo0 is closed on evidence (#1826; licences stated; check:source-licence green).
- **No empirical claim in a formal statement:** measured, not assumed. The repository holds 0 `.lean` files, and no theorem, lemma, proposition, definition, axiom or corollary block cites any of the handbooks (9789240093362, 9789240101197, 9789240116191, 9789240010567, the DPI-H RA). The rule stands for anything added later.
- **DIIG Fig. 1.1.1 SVG:** done in #2062 (bean 70zt).
- **Remaining:** the owner sends the RA comment and files the SMART Base issue (smart-base/findings/).
