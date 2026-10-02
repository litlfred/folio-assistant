---
# note on folio-assistant-apcg from claude/fervent-brahmagupta-rbwhzm
$schema: folio-bean-note/v1
bean: folio-assistant-apcg
branch: "claude/fervent-brahmagupta-rbwhzm"
created: "2026-10-02"
---
## handover: KG/library consolidation 2026-10-02

## Handover report: KG / library-sciences consolidation (session_01CVV)

- **Session:** https://claude.ai/code/session_01CVVoavPoCHMLA7AASxG8cH
- **Written:** 2026-10-02 ~20:50 UTC. Reason: the owner asked, through the `prepare-for-handover` skill (#1912). The session's two subagents had just been cut off by a usage limit ("resets 8:40pm (UTC)").
- **Role and mandate:** Owner: "Consolidate stalled agents related to KG / information sciences / library sciences etc. Pay attention to sibling work on staging for repo separation." and "take over any beans/feature branches/PRs you need to". MERGE POLICY (owner, verbatim): "Do NOT merge to main yourself. When your PR is green on every CI job, mark it "Ready for review", add the label `ready-to-merge`, and comment "ready: <head sha>". The Merge Steward session (named "Separation") merges it". The merge steward (session_01ToWZR4RgTRCWeSsgxsSQfT) assigned placement PR3, PR5 and PR6 to this session.

### Where I'm going (current arc)
Finish placement PR6 (`apcg`, the library/ingestion split). It is the last blocker on the library-ingest beans `y4uj` and `mwzd`, so landing it unblocks them. In parallel, finish the `k74z` follow-up that fixes the vocabulary drift D1–D3. Done means #1898 and #1911 both green, labelled `ready-to-merge`, and merged by the steward.

### Done so far (merged 2026-10-02)
- #1817 bh4q (`@base` in each content document's own context), #1837 / #1846 terminology adjudication and follow-ups, #1839 / #1849 visualiser wireframes and follow-ups, #1841 Dublin Core renderings, #1842 KG audit bugs (pgzn, 676g, v556), #1865 closing beans bh4q and yag0.
- #1867 tlat (placement PR5): it landed through train 3 at `0538c262`, and I closed the PR by hand because the bot had moved its head. The owner ruled "1" on 2026-10-02: `sample-import-run.ts` stays in core.
- #1875 63wl (placement PR3), merged at `89ca7f24`. The owner confirmed "1" on 2026-10-02: keep the removal of `processes.detangle.json` (commit `10dfb22c7`).
- #1873 k74z: vocabulary-mapping tables with a FHIR ConceptMap round trip, merged at `89f4a61a`. Owner rulings, verbatim, 2026-10-02:
  - "1 and 1... How vocabulary mappings are declared (k74z).---> needs to support FHIR Concept Maps downstream"
  - "more so, that existing FHIR Concept Maps are representable, (dont need injection of mapping standard -> fhir stds)"
  - "we still want to able to produce FHIR ConceptMaps, just we dont need to assume injective map onto FHIR conceptmaps... may be lossy. but should be injective on the inverse image of FHIR ConceptMaps into mapping stadard."
  - Formally: ι : C → M is lossless; π : M → C may lose things but reports every loss; π∘ι = id_C. This was tested on the 174 HL7 example ConceptMaps.

### Next in queue
1. **#1898 (apcg):** fix the red "TypeScript — tests, lint, types (hard)" check (job 110981736745, on `a007cca40d`), then run regen and gates and push.
2. **#1898:** do NOT post `ready` until **#1899** (session_013Wb's library-paths PR for issue #1881, currently an open draft at `9b3dee959`) has merged. Then merge main, and carry #1899's edits into the split: its `library-ingestion.md` paragraph "A publication, not a file — an external reference (owner, 2026-10-02)", its `asset-extraction.md` edit and its `package-manifest.json` line. Choose the half of the split by the layering rule. Send session_013Wb the old→new path map. This order was agreed with session_013Wb.
3. **#1911 (D1–D3):** finish the regen, check that it reports 0 unrepaired, run the gates, and verify the merged-graph role-label test. Then mark it ready.
4. **D5 owner question** (below). Then D4, the library licence held as an `@json` literal, but only after #1899 merges, because both touch `gen-library-jsonld.ts`.

### In flight
| item | kind | state | next action | owner |
|---|---|---|---|---|
| #1898 apcg, placement PR6 (issue #1897), branch `claude/placement-pr6-apcg` | PR, draft | head `49722781e172eb7873b6461bbe4d5e23716efce2`, a WIP(handover) commit; CI red on the earlier `a007cca40d` | finish the TypeScript fix; wait for #1899 | this session (agent cut off) |
| #1911 lodp, vocab drift D1–D3 (issue #1910), branch `claude/vocab-drift-d1-d3` | PR, draft | head `5dfc3bade62de834da2a486b8c4c2044c8b26abc`, a WIP(handover) commit on top of the feature commit `95219a3f2c`; regen may be incomplete | regen, gates, ready | this session (agent cut off) |
| #1899 library paths (session_013Wb) | PR, draft | open at `9b3dee959` | none for us; it gates #1898's `ready` | session_013Wb |

### Blockers and dependencies
| blocker | waits on | since | expires / re-check |
|---|---|---|---|
| #1898 `ready` | #1899 merged | 2026-10-02 17:25 UTC | re-check on each #1899 event; if it slips by several hours, ask session_013Wb before reversing the order |
| y4uj, mwzd (library ingest) | apcg (#1898) | 2026-10-01 | when #1898 merges |
| ybwt (PR1) last box | 29 `document-intake` refs (PR6's) + 3 `ig-ast-delta` refs (no PR planned) | 2026-10-02 | after #1898 |

### Decisions pending (owner)
- **D5** (not yet asked): a schema module's `summary` goes to `dcterms:title`, while every other node type sends `summary` to `rdfs:comment`. The #1911 agent was going to check whether this is deliberate (git blame, its consumers) and put it to the owner as ≤4 numbered options with a default. This is still to do.
- **D3** was not answered by the owner. The stated default, option 1 (follow `sl9u`), is being applied in #1911 and is recorded there as a default rather than a ruling.

### Unpushed or at-risk state
- Nothing unpushed in any worktree with work. `git log @{u}..HEAD` is empty for `claude/placement-pr6-apcg` and `claude/vocab-drift-d1-d3`.
- `.claude/worktrees/agent-a423df9ee11f169de` (`claude/placement-pr5-tlat`) has one local merge (`b1a072375`) plus regen output, deliberately NOT pushed. #1867 is closed and its content is on main, so this is disposable.
- Subagents a12fc268… (apcg) and a3c9ce7c… (D1–D3) were cut off at the usage limit. Their in-memory plans are lost; the WIP commit messages above say where each stopped.
- No background jobs are worth keeping. Every regen is reproducible with `bun run regen`.

### How to resume
1. Fetch `claude/placement-pr6-apcg`, read the job log of `a007cca40d` (110981736745), reproduce the failure with `bun test`, fix it, then run `bun run regen`, `render:bpmn:check`, `bat:sync:check` and `typecheck`, and push. Remove the `merge-main` label if the bot races your pushes.
2. Fetch `claude/vocab-drift-d1-d3`, run `bun run regen` and `vocab-mappings:check`, then the tests for kg-export, glossary-export and fsh-guts. Push, and mark it ready once green.
3. Watch #1899. When it merges, carry its edits into #1898 (item 2 of "Next in queue") and post `ready: <sha>`.
