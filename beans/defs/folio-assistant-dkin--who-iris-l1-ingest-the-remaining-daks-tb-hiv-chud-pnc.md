---
# folio-assistant-dkin
$schema: bean/1.0.0
title: 'who-iris: L1-ingest the remaining DAKs (TB, HIV, CHUD, PNC, SRV, SMBP, STI) with their per-task annotations'
status: todo
type: task
priority: high
tags:
    - who-iris
    - dak
    - bpmn
    - needs-repo-access
created_at: 2026-11-18T08:40:00Z
updated_at: 2026-11-18T08:40:00Z
---

**Repository:** `litlfred/who-iris`. Work it there.

**Who can work it:** an agent that can push to litlfred/who-iris. Cloud Claude sessions can't, because the Claude GitHub App isn't installed on that repo. A local agent (Antigravity, Claude Code on the owner's machine) using the owner's GitHub login can.

**Owner request (2026-11-18):** "All of the DAK documents have annotations for the BPMNs that describe the tasks. Are all of those ingested and attached to the BPMN's tasks appropriately/computably?" The owner then chose option D of findings litlfred/smart-base#438: L1 extraction, then matching with adjudication, written into the BPMN sidecar, emitted to the KG as `dak-task`, and checked by a report-only QA.

## Where things stand

- **Done, merged in smart-base:**
  - #438: the findings.
  - #439: the task-annotation sidecar, the KG emission and the QA.
  - #440: dak-task-annotations reads the TB DAK layout and IG-page annotation lists (`--ig-page`); extract-bpmn reads ad-hoc sub-processes.
- **Done, IMMZ sidecars:** litlfred/smart-immunizations#167.
- **WHO DAK sidecar PRs:** smart-dak-immz#15, smart-dak-tb#3, smart-tuberculosis#1, smart-dak-chud#1. The owner ruled "merge"; a merge session is handling them.
- **Missing, and this bean's job:** who-iris has L1 entries only for ANC, FP and IMMZ. **TB, HIV, CHUD, PNC, SRV, SMBP and STI are not ingested.** Each DAK's per-task "NOTES AND ANNOTATIONS" tables therefore reach nothing.

## Steps

1. **Set up.** Clone litlfred/who-iris and run `bun install --frozen-lockfile`. Mount the pinned layers (`bun run cat-harness-tools/scripts/remote-mount.ts`, or what the repo's AGENTS.md says), then read AGENTS.md and follow it.
2. **Find each source.** For each DAK (TB, HIV, CHUD, PNC, SRV, SMBP, STI), find the published WHO DAK document in WHO IRIS: the PDF and its handle or DOI. Record title, ISBN, year and licence. Use the same L1 library-entry layout as the existing ANC, FP and IMMZ entries (copy their structure; don't invent one).
3. **Ingest each one as L1** with the repo's existing ingestion pipeline (the one that produced the ANC, FP and IMMZ entries): text, structure, figures and tables. One PR per DAK, or one PR for all of them, whichever the pipeline makes cleaner.
4. **Keep the task annotations.** Each business process's "NOTES AND ANNOTATIONS" table or list must come through as structured rows, not flattened prose: activity id, activity name, description, persona or swimlane, data elements, decision points, linked requirement ids and decision-table ids. Check them against the format smart-base's `dak-task-annotations` reads (litlfred/smart-base#439, #440).
5. **Check the matching.** For each DAK that has a BPMN repo (smart-dak-tb or smart-tuberculosis, smart-dak-chud, smart-dak-pnc, smart-dak-srv, smart-dak-smbp, smart-hiv), run smart-base's `dak-task-annotations` against the new L1 entry and that repo's BPMN. Report per DAK: tasks matched, tasks unmatched, annotations unmatched. **Don't hand-match the unmatched ones.** They go to adjudication by the DAK owners (seven items already wait there).
6. **QA.** Run the repo's full checks and fix anything the ingestion caused. Never skip, disable or quarantine a test.
7. **PR.** Open it as a draft. When the full tier is green, add the labels `release` and `ready-to-merge`, and comment `ready: <head sha>`. **Don't merge.** Tell the owner the PR number; the merge manager merges it.

## Rules

- No model identifiers in commits, PRs or code.
- Source text is quoted verbatim, with page numbers. Nothing from memory.
- WHO IRIS is the source. If a DAK isn't published there, say so in the PR and skip it rather than substituting another source.

## Done when

- [ ] TB, HIV, CHUD, PNC, SRV, SMBP and STI are each an L1 entry in who-iris (or recorded as not published)
- [ ] each entry's per-task annotations are structured rows that dak-task-annotations can read
- [ ] the matching report, per DAK, is in the PR
- [ ] full tier green, `ready:` posted, merged by the merge manager
