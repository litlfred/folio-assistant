---
# note on folio-assistant-ob3m from claude/quirky-hypatia-k3aoh4
$schema: folio-bean-note/v1
bean: folio-assistant-ob3m
branch: "claude/quirky-hypatia-k3aoh4"
created: "2026-10-02"
---
## handover: ob3m series driver 2026-10-02

## Handover report: ob3m series driver + site/todos rulings (session_01Cw8JgZEDT5VqQ5ergjdMjB)

- **Session:** https://claude.ai/code/session_01Cw8JgZEDT5VqQ5ergjdMjB
- **Written:** 2026-10-02 ~21:15Z. Asked by the owner: *"Use skill Prepare for Handover as pushed to litlfred/folio-assistant#1912. send to Merge Manager"*.
- **Role and mandate:** drive the ob3m wireframe-findings PRs to green and ready. **Never merge**: the steward ("Separation / Merge Manager") merges. The ready protocol is: mark Ready, add `ready-to-merge`, comment `ready: <sha>`.
- **Owner ruling that binds the in-flight state:** *"stop"*, 18:3xZ. The two merge agents were stopped and the 19:01Z check-in disabled. #1804, #1808 and #1819 have been **paused** since then.

### Where I'm going (current arc)
1. Finish the ob3m series (#1804, #1808, #1819). Once all three land, tell session_013WbQekVypi9A6YQbLDXMmJ ("Smart-base landing page"); that was promised.
2. Carry the owner's 2026-10-02 rulings on the site:
   - stickies panel without the tile icons (#1907);
   - `/todos/` with the stickies panel and without the graph list (#1909);
   - the site landing (#1904);
   - todos as one JSON-LD graph (#1908).

### Done so far (this session)
- **Merged:** #1798, #1822, #1857 (per-PR bean notes), #1856 (merge-main bot crash fix), #1828 (staging orphans). #1805 landed via merge train 4.
- **Closed as landed:** #1799, landed via #1822 (merge commit f77bbc7).
- **Issues filed:**
  - #1904: site root landing; ruling revised, see below.
  - #1908: todos in the KG; slice of bean `h32d`.
  - #1902: sidebar scoping. Filed by session 013Wb, owned by me as a follow-up after #1808.

### In flight
| item | kind | state (pushed SHA) | next action | owner |
|---|---|---|---|---|
| #1804 one-name | PR, paused | head `3ad2870f3`, **conflicts** with main (`document-kinds/index.html`, generated; the bot refuses it) | see the handover-1804 row | needs a driver; **owner said stop** |
| `claude/quirky-hypatia-k3aoh4-handover-1804` | branch (no PR) | `ef5fbc5f9cc`: #1804 head + main `cea2925` merged, conflicts resolved, **regen and gates not run** | verify nothing from main is lost, `bun run regen` + `docs:harness` + `viewer:nav:audit`, gates; then fast-forward the PR branch to it | same |
| #1808 sidebar-rail | PR, paused | head `96d11ed6e`, conflicts: ob3m bean + `docs-ui.js` (#1805 tooltips vs `mountSidebarRail`) | see the handover-1808 row | same |
| `claude/quirky-hypatia-k3aoh4-handover-1808` | branch (no PR) | `7b0e9c7e3`: 128 commits ahead of the PR head; "Merge origin/main (#1873) into sidebar-rail", **regen and gates not verified** | merge the current main again, union the ob3m bean, regen, gates; push to the PR branch | same |
| #1819 strip-pinned | PR, paused | head `3ece4fd5d`, conflict: ob3m bean | see the handover-1819 row | same |
| `claude/quirky-hypatia-k3aoh4-handover-1819` | branch (no PR) | `26d23ef1a12`: two merges of main (train 4, then `cea2925`), conflicts resolved, **regen and gates not run** | regen, gates; push to the PR branch | same |
| #1907 stickies: no tile strip | draft PR, issue #1905 | head `6ceea3c76`, CI pending. Earlier reds: skill-registration, `gen-lsi-viz` test, bean-parents. The agent says the skos line is a warning only, and main emits it too | wait for green, then ready protocol | agent `ace9940416103c3e8`, resumed after a 429 |
| #1909 `/todos/` page | draft PR, issue #1906, bean `72gk` | head `806fc6031`, main merged, CI pending | wait for green, then ready protocol | agent `abc54b9ba0202f477`, resumed after a 429 |
| #1908 todos in the KG | issue | not started | starts when #1899 merges (session 013Wb will ping) | me |
| #1902 sidebar scoping | issue | not started | starts after #1808 lands | me |
| #1904 site landing | issue | not started; ruling settled | awaiting the owner's go | me |

### Blockers and dependencies
| blocker | waits on | since | re-check |
|---|---|---|---|
| #1804, #1808, #1819 conflicts | an owner go after *"stop"*, then a driver | 18:3xZ | the next owner message |
| ob3m bean text conflicts (#1808, #1819) | a manual union; the bot refuses `beans/defs/*` by design. Future notes use `beans/notes/` (#1857) | 17:xxZ | on resume |
| #1908 | #1899 merge (shared thin-page shell; library-only IRI fix) | 18:46Z | session 013Wb ping |
| #1902 | #1808 landing | 18:28Z | after #1808 |
| merge-main bot cannot push workflow-file merges (no `workflows` scope) | #1829 | earlier | — |

### Decisions pending (owner)
- **#1904, site landing, ruling (verbatim, 2026-10-02):** *"Flag it, with a default (recommended). The chosen instance's own `<name>.config.json` carries `"site": { "landing": true }`. If exactly one harness is instantiated, it is the landing page and no flag is needed. That covers smart-trust. If there are several and none is flagged, a gate fails. If more than one is flagged, then neutral hub with listing of harnesses, todos,"*. Open question: when to start. Options were after #1808 (recommended), design only now, or full build now. The owner dismissed the question.
- **Todos clutter:** the no-JS "Open notes" tile listing sits in every page footer (`footer_custom.html`, owner ruling 2026-09-21 *"simple tile based listing"*). Options:
  1. move it to the todos page and leave a one-line link in the footer (recommended);
  2. one line per note;
  3. both;
  4. leave it.

  The owner dismissed the question.
- **Six other state pages** (beans, health, issue-marks, qa, swimlane-glossary, uploads) still carry the "State graphs this harness declares" list. #1909 changed only `/todos/`. Raised on #1906.

### Unpushed or at-risk state
- **Scratchpad worktrees** (session-local, lost with the container):
  - `hm-1818`, `hm-1819` and `hm-1822` hold superseded hand-merges. #1818 and #1822 are merged; #1819 is superseded by the handover-1819 branch. Nothing is lost.
  - `onename-wt` and `sub-wt` hold stale regen debris on old heads. Both can be rebuilt; nothing is lost.
- **Scripts in the scratchpad** (lost with the container; each rebuilds in minutes):
  - `ready-once.sh`: applies the ready protocol only if the head is done, core checks pass, the PR is not dirty, and there is no existing `ready:` comment for that SHA.
  - `hand-merge2.sh`: runs main's `merge-base.ts`. **Do not use it when kg-qa and derived-results conflicts coexist**: the deletion defect recorded on #1854.
  - `manual-merge.sh`: plain merge, take `--theirs` for generated files, regen, then verify `comm -23 <(git ls-tree -r --name-only origin/main|sort) <(git ls-files|sort)` is empty.
- **No secrets** are involved.

### How to resume
1. Read the owner's latest message: #1804, #1808 and #1819 are paused under *"stop"*. Do not push to their branches without a go.
2. With a go, take the handover-1804/1808/1819 branches. For each:
   - merge the current `origin/main`;
   - union the ob3m bean (keep every line, one valid `updated_at`);
   - regen (writers → `readme:subgraphs` → `state:visualizer` → `docs:harness` last), then `viewer:nav:audit`;
   - run the `comm` check, then `bun run gates`;
   - push to the PR branch, then apply the ready protocol.
3. #1907 and #1909: when CI is green on every job, apply the ready protocol. #1908 starts on the #1899 ping.
