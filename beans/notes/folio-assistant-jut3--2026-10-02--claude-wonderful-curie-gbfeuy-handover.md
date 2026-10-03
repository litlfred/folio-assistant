---
# note on folio-assistant-jut3 from claude/wonderful-curie-gbfeuy-handover
$schema: folio-bean-note/v1
bean: folio-assistant-jut3
branch: "claude/wonderful-curie-gbfeuy-handover"
created: "2026-10-02"
---
## handover: jut3 feature session 2026-10-02

## Handover report: smart-trust IG site at Publisher parity (#824), plus the AST export and the separation rehearsals

- **Session:** https://claude.ai/code/session_01DnFZtVpff4o7puqWazGvKN
- **Written:** 2026-10-02 ~20:50 UTC. Requested by the owner: *"Use skill Prepare for Handover … send to Merge Manager"*.
- **Role and mandate:**
  - feature session for bean `jut3`, issue #824 (smart-trust's IG site in just-the-docs at IG Publisher parity);
  - its spin-offs: IG AST formats (`l0lq`), release binaries (`b8ip`), and the smart-* separation rehearsal (`rbz3` under epic `n3ni`, issue #1767);
  - the AST export in litlfred/fhir-ig-publisher.
- **Merge policy, owner verbatim:** *"Do NOT merge to main yourself. When your PR is green on every CI job, mark it "Ready for review", add the label `ready-to-merge`, and comment "ready: <head sha>". The Merge Steward … merges it."*

### Where I'm going (current arc)
Get #1766 merged: smart-trust's IG site, the IG AST schemas, release pointers, and the Liquid raw-block fix. After that:
- re-run the fork rehearsals against `main`, now that stage D and plan Q4 (#1861) are in;
- get the fhir-ig-publisher AST export (litlfred/fhir-ig-publisher#8) reviewed.

Done means:
- #1766 merged;
- #8 reviewed by the owner;
- `rbz3` updated with rehearsal rounds 2–3.

### Done so far
- **#1861 merged:** plan Q4, the IG chrome ships with the harness. `chromeFileFor` looks in `themes/` first, and `smart-base/themes/chrome.json` is in place.
- **#1880 merged:** skill `pr-description` (issue #1879). The skill encodes the owner's PR rules verbatim:
  - *"PR should be readable for human for first time…"*;
  - *"updates to PRs should be mainly comments, not on orignial text, except: … status … changes in scope (don't ovweite, show history…)"*;
  - *"maximize use of x-ref and links to beans/epics etc and the dashboard"*.
  
  Bean `19wc` is closed in this handover commit.
- **litlfred/fhir-ig-publisher:**
  - **Fork `master`** reset to HL7 `master` (`8301fee4`), as the owner asked: *"i do want litlfred/fhir-ig-publisher to be back to main agsint hl7 branch. what's ahead/main should be feature branch."* The 9 commits that were ahead (Carl Leitner's 2023 FML work) are preserved on `feature/fml-structuremap` @ `e382dc36`.
  - **AST branches:** the three were combined into `claude/ast-export` (owner: *"stacked … combined into one"*). PRs #6 and #7 are closed into it.
  - **PR #8:** got a human-readable description and a code review: 3 blockers and 8 major findings. Owner chose **"1 2"**: guard the incremental path first, then fix everything. Both are done; see In flight.
- **Fork rehearsals:**
  - litlfred/smart-trust#3 is at `7ff6286a`.
  - litlfred/smart-base#1 is at `b21a78da`, rounds 1–3. Round 3 proved that Q4 lets the harness carry the chrome.
- **Cross-session coordination:**
  - the page-weight session (`session_013WbQekVypi9A6YQbLDXMmJ`, #1885/#1886) agreed not to rebuild #1766's linked `ig-pages.css`/`ig-chrome.css`;
  - after #1766 merges, it will add cross-instance chrome sharing and a Publisher-style index layout (name+description columns, the Publisher's category order, a Contents box).

### Next in queue
1. **#1766: merge `main` again.** It is `dirty` against `main` `8f89ebd1`. Use `bun run merge:main`. If it refuses, resolve by hand:
   - the only authored conflicts last time were a bean and `artefact-verification.json`, both additive;
   - generated IG pages take `main`'s side, then regenerate with `bun run smart-trust:pages && bun run smart-base:pages && bun run smart-immunizations:pages && bun run regen`;
   - revert `cat-harness/docs/assets/library/index.json` if its only change is `refScan` counts (environment-dependent).
2. #1766: `bun run gates`. Known non-issues: `translation:catalogue:check --base "$base"` is CI-only; `wireframes.qa-results.json` is rewritten by a gate, so revert it; heavy tests time out under load, so re-run them alone. Then push, wait for CI, re-add `ready-to-merge`, and comment `ready: <sha>`.
3. When #1766 is ready, then again when it merges: message `session_013WbQekVypi9A6YQbLDXMmJ`. Both pings are promised.
4. After #1766 merges, update bean `rbz3`, which lives on #1766's branch, with rehearsal rounds 2–3 (detail is in litlfred/smart-base#1 `REHEARSAL.md`). Then re-run both fork rehearsals on `main`.
5. Comment on #824 at each push to #1766 (owner preference).

### In flight
| item | kind | state | next action | owner |
|---|---|---|---|---|
| litlfred/folio-assistant#1766 `claude/wonderful-curie-gbfeuy` @ `00e30f8c` | PR | **conflicted** with `main` `8f89ebd1`; no CI on this head; `ready-to-merge` removed | merge `main`, regen, gates, push; relabel when green | this session |
| litlfred/fhir-ig-publisher#8 `claude/ast-export` @ `33e6a49` | PR (draft) | all CI green (build, CodeQL, Trivy). B1–B3 and M1–M8 fixed with tests; `mvn test` 58/58. `IncrementalPlan.INCREMENTAL_GUARD = true` | owner review. The guard is lifted only after a real incremental round is diffed against a full build (W8) | owner |
| litlfred/smart-base#1 `separation/stage-e-rehearsal` @ `b21a78da` | PR (do not merge) | rounds 1–3 done | re-run on `main` (stage D + Q4 landed) | this session |
| litlfred/smart-trust#3 `separation/stage-e-rehearsal` @ `7ff6286a` | PR (do not merge) | round 2 done | re-run on `main` | this session |
| `jut3`, `l0lq`, `b8ip`, `rbz3`, `ntyj`, `ha24` | beans | in progress, on #1766's branch. `ntyj` and `ha24` unblocked in `00e30f8c`: `qrnz` completed | update or close as #1766 lands | this session |

### Blockers and dependencies
| blocker | waits on | since | expires / re-check |
|---|---|---|---|
| #1766 merge | #1766 green on a head that includes `main` | 2026-10-02 ~18:50 UTC (`main` moved again) | re-check at the next pickup |
| lifting #8's guard | a real IG Publisher run: W2 measurement, W7 end to end, W8 diff | 2026-10-02 | the owner's call |
| smart-trust `-definitions` pages (bean `wnhh`) | `hl7.fhir.r5.core` in the package cache | 2026-10-01 | `#1816`'s session owns it |

### Decisions pending (owner)
- **WHO-specific DAK code in `fhir-harness/`.** #1766 adds `fhir-harness/scripts/dak-views.ts` and a DAK API hub step in `ingest-ig-artifacts`. Stage D wants `fhir-harness` WHO-free, and no gate catches the strings.
  - **Recommendation (default):** open a follow-up bean after #1766 merges, to move them to smart-base.
  - **Alternative:** move them inside #1766 now. That is bigger and delays the merge.
- **Beans dashboard deep links.** The dashboard (`/beans/`) has no per-bean or per-epic link, because scope lives only in page memory. Adding a URL parameter would let PR bodies link an epic's view. That would be a follow-up; not opened yet.

### Unpushed or at-risk state
- **Deliberately not pushed:** 2 commits on local branch `glossary-split` (`88755b94`, `b14c943b`), in worktree `.claude/worktrees/agent-a5d8262ad38002fd3`. They split the schema-fields glossary page per instance. Superseded by `main`'s first-letter split (`4f47481d`); discard them.
- **Scratchpad:** worktrees and logs only. Every branch with work is pushed, and nothing is needed to resume.
- **No background jobs running.** No secrets were involved.

### How to resume
1. Read this note, then #1766's last comments (`33239f45` and `00e30f8c`): they describe the merge and the bean fix.
2. Run `bun run merge:main` on `claude/wonderful-curie-gbfeuy`, then follow "Next in queue" 1–3.
3. Check litlfred/fhir-ig-publisher#8 for owner review comments. Its PR body follows the `pr-description` skill: Scope history and Status are updated in place, everything else goes in comments.
