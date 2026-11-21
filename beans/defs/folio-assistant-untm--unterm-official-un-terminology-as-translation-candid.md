---
# folio-assistant-untm
$schema: bean/1.0.0
title: 'UNTERM: official UN terminology as translation candidates and glossary QA terms'
status: todo
type: task
parent: folio-assistant-v8bg
priority: normal
tags:
    - translation
    - unterm
    - needs-network-access
created_at: 2026-11-18T08:40:00Z
updated_at: 2026-11-21T16:30:00Z
---

**Repository:** `litlfred/cat-harness-tools`. Work it there; the adapter lives in `scripts/lib/translation-sources/`.

**Who can work it:** an agent that can reach `https://unterm.un.org`. Cloud Claude sessions can't, because the environment's network policy refuses that host (proxy 403, checked 2026-11-18 06:31Z). A local agent (Antigravity, Claude Code on the owner's machine) can.

**Owner request (2026-11-18):** "https://unterm.un.org/unterm2/ need to include... is there a nightly archive?"

## Context (already merged)

The block translation feedback work landed in cat-harness-tools #2432 and #2433, and cat-harness #1380:
- Candidates per (msgid, locale) live in the `translation-candidates/v1` sidecar.
- Candidate kinds: `official`, `agent`, `open-mt`, `web-service`, `human`.
- Auto-pick rank: official, adjudicated, human, web-service, agent, open-mt. A QA failure demotes a candidate, and stale candidates are never auto-picked.
- **Owner amendment:** an official candidate is auto-picked as official (`chosen.how = "auto-official"`, not fuzzy) only on an EXACT match of its `sourceText` to the entry's msgid (and msgctxt). It must also name its source, here `unterm:<entry id>`. A near-match or a missing sourceText ranks first but stays fuzzy and unofficial until a collaborator chooses it.

## Steps

1. **Investigate first and report before building.** Post the findings as a comment on the PR, or as the first section of its description:
   - Is there a bulk download, a nightly or periodic archive, an export (TBX, CSV, JSON) or a public API? Give the URLs and formats. Does it cover all six languages (ar, en, es, fr, ru, zh), with entry ids, subject or domain, and the source document?
   - What are the terms of use and the reuse licence? Can the terms be stored in a public GitHub repo and redistributed alongside CC BY 3.0 IGO content? **Quote the exact wording, with its URL.**
   - Rate limits, and whether credentials are required.
2. **If the licence forbids storing or redistributing the terms, stop** and report. Don't build anything.
3. **Otherwise build the adapter** in `scripts/lib/translation-sources/unterm.ts`:
   - Fetch from the archive or API.
   - Store a pinned, dated snapshot with its sha256. Follow the repo's dependency and verification rules, and resolve nothing at run time without a pin.
   - Emit `official` candidates with `source.id = "unterm:<entry id>"`, `sourceText` set to the exact English term as UNTERM gives it, `source.version` set to the snapshot date, and `at`.
   - Feed the matched terms to the glossary QA token check, so a translation that drops an official term fails QA.
   - Add tests: an exact match is auto-official and not fuzzy; a near-match (whitespace, case, punctuation or wording) is fuzzy and plain auto; a missing sourceText is fuzzy and plain auto.
4. **Document it** in cat-harness's `translation-candidate-source.md`, with the source, licence, refresh cadence and how to refresh the snapshot.
5. **PR.** Open it as a draft. When the full tier is green, add the labels `release` and `ready-to-merge`, and comment `ready: <head sha>`. **Don't merge.** Tell the owner the PR number; the merge manager merges it.

## Rules

- Never skip tests. No model identifiers in commits, PRs or code.
- Nothing from memory: every licence or format claim cites the page it comes from.

## Done when

- [ ] the archive or API, the licence and the rate limits are reported, with quotes and URLs
- [ ] if allowed: the adapter, a pinned snapshot, official candidates, glossary QA terms, tests and docs
- [ ] full tier green, `ready:` posted, merged by the merge manager

_2026-11-21T16:30Z_ — parent set to `folio-assistant-v8bg` (open workstreams): open with no parent failed fa main's `every open bean belongs to an epic` test (Code-quality on 1d9a41d2).
