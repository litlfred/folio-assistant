---
# note on folio-assistant-p5wm from claude/awesome-fermi-ua31th-handover
$schema: folio-bean-note/v1
bean: folio-assistant-p5wm
branch: "claude/awesome-fermi-ua31th-handover"
created: "2026-10-02"
---
## handover: awesome-fermi-ua31th 2026-10-02

## Handover report: smart-* separation / library IRIs / coordination (awesome-fermi-ua31th)

- **Session:** https://claude.ai/code/session_013WbQekVypi9A6YQbLDXMmJ
- **Written:** 2026-10-02 ~20:50 UTC, owner asked: "Use skill Prepare for Handover … send to Merge Manager".
- **Role and mandate:** feature agent on #1767 (smart-* separation) and the owner's follow-ups. MERGE POLICY (owner, verbatim): "Do NOT merge to main yourself. When your PR is green on every CI job, mark it "Ready for review", add the label `ready-to-merge`, and comment "ready: <head sha>". The Merge Steward session … merges it."

### Owner rulings in force (2026-10-02, verbatim)
- "use dynamic loading rather than html generation wherever possible"
- "404 githubpages is a hack. does not work according to stanrds"
- "each link/page needs to be materialized on the CDN (gh-pagees), just load the content from the KG json(ld) assets already published. updated skills/tools"
- "no query strings... each asset gets its own IRI"
- "the view page is a rendering of that asset, a different page. fix IRIs"
- "asset doesnt know about its renderings"

### Where I'm going (current arc)
Get the library IRI work (#1899), the coordination rule (#1903) and glass cards (#1918) to green and hand them to the steward; then Publisher-style IG pages (#1901, after #1766) and page-weight phase C (bean gp2f).

### Done today
- #1877 preview cap (MAX_PREVIEWS=10) merged; STAGING purge dba9db83 (67 previews removed, 3.19 GB left).
- #1871 smart-trust branding, #1886 coordination rule + bean gp2f — merged.
- qou#7494 (fgkb, fsh-guts) opened; needs `/prepare-merge` + owner "merge it".

### In flight
| item | kind | head SHA (pushed) | state | next action | owner |
|---|---|---|---|---|---|
| #1899 library path IRIs (#1881) | PR, draft | 9b3dee959ead1da1edfe2c81004e7d033624879b | complete; local gates 209/210 (only translation:catalogue:check, local-only); **conflicts with main → CI never started** | merge main, `checkout --theirs`/`git rm` generated conflicts, `bun run regen`, `check:l1-complete -- --write`, gates, push, then ready-to-merge | this session / steward |
| #1903 collision review (#1891) | PR, draft | cffeb97f8a7cc685271540968930bda5fc2ab499 | complete; checks passed locally; **conflicts with main → CI never started** | same merge+regen loop, then ready-to-merge | this session / steward |
| #1918 glass cards (#1900) | PR, draft | d1f5d3e417026e4408d720804232a4bfad753184 | WIP: agent hit the rate limit after "run regen again for fixed point, then gates"; conflicts with main | merge main, regen to fixed point, gates; lands after #1899 (uses its `view` field) | this session |
| claude/awesome-fermi-ua31th-preview-target | branch, no PR (deliberately) | 951a10d19d3c693d7319e98cc4f4dca68fff76bc | superseded WIP (previews to gh-pages-staging); kept so the design isn't lost | none unless #1868 picks a separate hosting branch/repo | — |
| #1901 Publisher-style IG pages (+ footer, owner 2026-10-02) | issue | — | not started | start after #1766 merges (#1766 session will ping) | this session |
| #1902 LHS rail | issue | — | navbar session (01Cw8JgZ) owns, after #1808 | forward owner's "On this page" answer | navbar session |

### Blockers and dependencies
| blocker | waits on | since | re-check |
|---|---|---|---|
| #1899/#1903 CI | merge with main (both `dirty`) | 2026-10-02 18:54 | next session start |
| #1918 | #1899 merging (the `view` field) | 2026-10-02 | when #1899 merges |
| #1901 | #1766 merging | 2026-10-02 | #1766 session ping |
| #1908 (navbar session: todo IRIs) | #1899 merging; they take content-node @base/@context | 2026-10-02 18:46 | ping them when #1899 merges |

### Decisions pending (owner)
- #1868 Pages cancellation by staging pushes: options posted; default option 3 (note delay in preview comment) + issue for option 1.
- "On this page — sorta OK, but not quite": 1 wrong items / 2 placement-styling / 3 both; default leave as is.
- Older: cpmo crosswalks (default referenced only); DTH candidates; service-user label; smart-kg pin cites→conforms; qou#7494 merge.

### Unpushed or at-risk state
- None unpushed: every worktree checked, `git log @{u}..HEAD` empty.
- Scratchpad worktrees under the session scratchpad (wt-*) are disposable; all branches pushed.
- Pending routine trig_01HFQqx5iekAhJxw4rwp4Kvt already fired.

### How to resume
1. Read this note; `git fetch` and check #1899 / #1903 mergeable state.
2. Run the merge-main + regen loop on #1899 first (cat-harness files the steward is holding out of 70lx B1), then #1903, then #1918.
3. On green: mark Ready, label `ready-to-merge`, comment `ready: <sha>`; then ping the navbar session (#1908) that #1899 merged.
