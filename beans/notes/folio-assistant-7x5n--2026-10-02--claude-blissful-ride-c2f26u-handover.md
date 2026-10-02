---
# note on folio-assistant-7x5n from claude/blissful-ride-c2f26u-handover
$schema: folio-bean-note/v1
bean: folio-assistant-7x5n
branch: "claude/blissful-ride-c2f26u-handover"
created: "2026-10-02"
---
## handover: merge steward 2026-10-02

## Handover report: Merge Steward (lead session)

- **Session:** https://claude.ai/code/session_01ToWZR4RgTRCWeSsgxsSQfT
- **Written:** 2026-10-02 ~19:10 UTC, ahead of an expected stall.
- **Role:** merge steward. I merge green PRs serially ("trains") and drive the separation epic `7x5n`. The owner has authorised merging green PRs.

### Where I'm going (current arc)
1. Drain the merge queue, putting PRs that touch cat-harness first, so the cat-harness and cat-harness-tools seeding review can start.
2. Build the merge pipeline as its own epic, `hfag` (#1894). It blocks `7x5n`.
3. **No seeding** until the owner says so. 70lx B1 is **paused**; its plan is in the session scratchpad and is lost if the container goes.

### Done today
- **Merged (about 50 PRs in total)**, including:
  - trains 1–4 (train 4 is #1893);
  - #1875, the process regroup (63wl);
  - #1873, vocabulary mappings;
  - #1886, #1878, #1859, #1862, #1822 and #1798.
- **Closed as landed:** #1857, #1805 and #1799.
- **Owner rulings recorded:**
  - a `heavy-mover` label, applied to #1873, #1812, #1801, #1756 and #1735;
  - `seed:ready --rehearse` is opt-in;
  - #1892 resolves its merge conflicts by taking main's generated files and regenerating;
  - #1812 deletes 22 more duplicate sidecars;
  - #1892 writes a methodology page.

### In flight
| PR | what | state | next |
|---|---|---|---|
| #1812 | Q-A PR4, delete duplicate kg-qa sidecars (mine, heavy mover) | d440fbc pushed, CI running | merge when green; it touches cat-harness-tools |
| #1888 | refused-merge handback skill and `merge-refusal.bpmn` (bean `zacz`) | agent, red CI on WIP | finish |
| #1892 | three merge-queue papers, requirements note, methodology page | agent | methodology page, then gates |
| #1894 | epic `hfag`: merge-train.bpmn, merge-priority.dmn, merge-steward role, merge-queue skill | agent done, CI pending | waits on #1888 and #1895; `nok9` re-parent needs an owner decision (retype it, or add a milestone) |
| #1895 | tools: merge:train, merge:overlap, merge:leftover (bean `blgm`) | pushed, gates not run | gates, then merge |
| #1896 | seed:ready plus GW_SeedReady in kg-separation (bean `hcpz`) | agent, 2 real test failures (XML comment, partition) | fix |
| (new) | rename special branches to the `cat-` prefix (qa-reports, …) | agent, inventory stage | report the affected sessions to the steward; **rename only after the steward says "go"** |

### Queue state at 19:00 UTC
- **Ready to merge but conflicted:** #1764, #1804, #1808, #1816 and #1819. Their owners need to merge main in.
- **Waiting on another PR:** #1898 waits on #1899.
- **Seeding is NOT ready:**
  - 27 open PRs touch cat-harness (the limit is 5);
  - 5 touch cat-harness-tools (#1899, #1812, #1801, #1790, #1764);
  - 4 heavy movers are still open (#1812, #1801, #1756, #1735).

### Blockers and dependencies
- **CPU:** 4 CPUs at load about 16. A regenerate takes 35+ minutes under load.
- **Disk:** filled once today and was freed (about 9 GB free now). Check `df -h /` before any heavy step.
- **Permissions:** taking `--theirs` on generated conflicts needs owner approval; it was given for #1892.
- **MCP workflow tool:** it writes instance files into the main checkout, not into an agent's worktree.
- **Safety-check routine:** `trig_012Tkjzfa93eN9uXUtkJNFgu` fires at 19:45 UTC. Re-arm it 45 minutes later.

### How to resume
1. Read this note.
2. Run `bun run merge:overlap` once #1895 has landed; until then, list ready-to-merge PRs over REST.
3. Merge #1812 when it is green.
4. Then take the next ready, green, up-to-date PR, putting cat-harness first.

### Update 19:15 UTC
- **#1812 merged** (6e3f515) after deleting 22 more duplicate sidecars (owner "1"); #1873 merged. Heavy movers still open: #1801, #1756, #1735.
- **Handover skills** in #1912: `prepare-for-handover`, `handover-report`, `stalled-agent-triage` (+ `processes/sdlc/stalled-agent-triage.bpmn`), bean `w8j8`. Regen in progress; CI red only on stale generated files.
- **Branch renames, owner-approved 2026-10-02 ("do all four renames as recommended") — coordination state:**
  - `state` → `cat-state`: fs43 session 01KC89Kn notified; rename scheduled 19:19 UTC (send_later trig_0184DXjWjYk3XhPnKyTbBXgP) unless it asks to hold. Head was d913ea45b.
  - `qa-reports` → `cat-qa-reports`: session 01LKpuPo (#1764/#1801) **asked to HOLD** until it pushes dual-name support on #1801 (ETA ~2 h) and says green; then a 30-min no-push window; check `qa-reports-prune` isn't running first.
  - `fhir-ast/*` → `cat-fhir-ast/*` (smart-trust, smart-base): waits on session 01PricYF making #1816 dual-name.
  - `lake-cache/*` → `cat-lake-cache/*` (folio repos, e.g. qou): waits on #1913 merging and folio pins; those repos need `add_repo` access.
- **Owner decision pending:** the two `qa-reports-spike*` branches (nobody reads them; no deletion proposed).
