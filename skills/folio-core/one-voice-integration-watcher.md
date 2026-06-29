---
name: one-voice-integration-watcher
roles: [reader, collaborator, owner]
user_invocable: true
inherits: local/integration-watcher
watch_arg: one-voice
description: >
  One-voice integration watcher — watches origin/main + open active
  PRs + newly-opened PRs for content-block changes (`.md`, `.ts`,
  proof files), runs the per-block QA suite covering scholarly voice,
  AI-slop detection, section/chapter fit, canonical-vs-deprecated
  notation usage, and domain-boundary placement.
  Persists every finding to a sibling `<block>.qa.json` audit
  report (multi-reviewer, per-field SHA staleness). The watcher
  NEVER stops — when no events arrive it falls back to idle-sweep
  of the staleness backlog, rebuilding the audit knowledge base
  that feeds future content reviews. Inherits shared mechanics
  (Monitor, subscriptions, queue, ledger, idle sweep, author-ask,
  watch-prepared-PRs, witness-drift recovery, billing-quick-fail
  flake, sibling-PR comment protocol) from
  `local/integration-watcher`.
allowed-tools: Read Edit Write Bash Grep Glob Agent Monitor Skill
---

# /one-voice-integration-watcher

A concrete instance of [`local/integration-watcher`](integration-watcher.md).
The parent encodes the shared mechanics (Monitor, subscriptions,
queue, ledger, idle sweep, author-ask, watch-PRs-you-prepare,
sibling-PR comment protocol, witness-drift recovery, billing
quick-fail, post-completion one-voice). This file fills the nine
domain-specific slots A-I.

**Setup:** use `NAME=one-voice-integration-watcher` everywhere the
parent's §1 references `${NAME}`. Files land at
`.beans/one-voice-integration-watcher-queue.json` and
`.beans/one-voice-integration-watcher-ledger.md`.

**Persistent operation (binding).** Per the repo owner's standing
preference, this watcher **never stops** in foreground sessions.
When no main commits or PR events arrive in a TICK window, the
watcher pulls the next staleness-backlog block (§5 inherited
from the parent, §5d auto-pull policy). The QA reports it writes
during these idle windows ARE the knowledge base that informs
future content reviews — the staleness map of which criteria are
fresh, stale, or never-audited per block.

## Slot A — Goal statement

Every content block under `content/` has a current, multi-criterion
QA report. Specifically:

1. **Scholarly voice is the default** for every `.md` narrative AND
   every proof body (docstrings, expository comments).
   Deviations require an explicit author marker in the block's
   `.ts` manifest (`tags: ["non-scholarly-voice-exception"]`).
2. **AI-slop is zero-tolerance.** Status-update phrasing,
   commentary-on-own-work, lecturer-cadence padding, and
   characteristic LLM tells are removed on detection.
3. **Block placement matches declared chapter / section.** A
   block that doesn't fit its section / chapter context moves or
   is promoted / demoted.
4. **Canonical notation only.** Notation that the project's
   notation register marks as deprecated is replaced; the notation
   register is the authoritative target.
5. **Domain boundaries preserved.** If the project partitions
   content into domains with declared boundaries, a block must not
   silently cross them; a specialisation must declare itself.
   (If the project has no such partition, this criterion is inert.)

Findings are persisted as **multi-reviewer** entries in
`<block>.qa.json`, so script, agent, and human adjudications
co-exist per criterion. The most-recent entry whose `field_hash`
matches the present source files is the "current verdict".

## Slot B — §3 trigger filter

For a `MAIN <sha> <msg>` line (or PR commit event):

```bash
SHA=<event sha>
changed=$(git diff-tree --no-commit-id --name-only -r "$SHA")

# Any content-block sibling triple change triggers.
is_in_scope=false
echo "$changed" | grep -qE '^content/.*\.(md|ts|lean)$' && is_in_scope=true

# Skill-file changes that affect the audit rubric ALSO trigger
# (one-voice-audit, one-voice-style-guide, the registry).
echo "$changed" | grep -qE '(one-voice-(audit|style-guide|integration-watcher)\.md$)|(pipeline/qa-(sweep|staleness|criteria-registry|checkers-voice|utils|section-title-audit)\.ts$)|(schemas/block-qa\.ts$)' && is_in_scope=true
```

> **Chapter-scoped title audit (not per-block).** Section / subsection
> / chapter titles are audited by the standalone
> `content/pipeline/qa-section-title-audit.ts` (criterion
> `voice-section-title-coherence`), since titles live on chapter
> manifests rather than block triples. A chapter-manifest change
> (caught by the `^content/.*\.(md|ts|lean)$` trigger above) should
> re-run that script and, for any flagged title, dispatch the agent
> story-coherence pass per `one-voice-style-guide` §Title Conventions.

For PR review-comment events, pass through if the comment body
mentions: `scholarly`, `voice`, `tone`, `AI slop`, `LLM`,
`status leak`, `domain boundary`, `canonical`, `deprecated
notation`, OR cites a content-block label.

## Slot C — §4b dispatch table

| Specialist | When to run |
|------------|-------------|
| `content/pipeline/qa-sweep.ts` | Always (re-runs every automated criterion on the changed-block set; refreshes sidecar JSON) |
| `content/pipeline/qa-staleness.ts` | After every sweep — produces the post-event freshness map |
| `one-voice-audit` (skill) | Always — applies mechanical fixes for `voice-status-leak`, `voice-emoji-content`, `voice-unicode-crash` (Category A/C/E auto-fixes per the skill) |
| `one-voice-style-guide` (skill, agent dispatch) | For `voice-scholarly-default`, `voice-ai-slop` adjudication — non-automated; agent reads the .md + proof file and writes a reviewer entry |
| `chapter-complexity-review` (skill, agent dispatch) | For `fit-section-chapter` adjudication — agent compares block topic + kind against section/chapter context |
| `ontologist` (skill) | If `notation-canonical` fires — disambiguates which canonical symbol is intended |
| `critical-path-analysis` (skill) | If `domain-boundary-correct` fires — re-runs the cross-domain dependency trace |
| `remark-audit` | If kind is `remark` and `fit-section-chapter` fires (often a dangling remark) |

**Proof ↔ narrative coupling rule:** for every block where a proof
file exists, `voice-scholarly-default` covers both files; for
`domain-boundary-correct` the proof file is authoritative.

## Slot D — §4c finding taxonomy

| Finding | Severity | Description |
|---------|----------|-------------|
| `voice-status-leak` | critical | Status marker in body prose (`**Done**`, `(TODO)`, `(TBD)`, `**Pending.**`, `**Completed**`) |
| `voice-unicode-crash` | critical | Unicode character outside fenced code that crashes `pdflatex` (`↦`, `⁻`, `─`, `✅`, …) |
| `voice-ai-slop` | critical | Characteristic LLM tells: "Let me", "Here's what", "I'll go ahead", repeated First/Second/Third cadence, over-use of "essentially", "comprehensive", "leverage", "streamline" |
| `domain-boundary-correct` | critical | Proof / content silently crosses a declared domain boundary, or specialises without declaring it |
| `voice-emoji-content` | major | Emoji as content outside tables |
| `voice-first-person-work` | major | First-person work tone in prose (`we'll add`, `let me`, `needs more work`) |
| `voice-time-stamped-notes` | major | Time-stamped narration (`as of 2026-…`, `after the recent push`, `in the current draft`) |
| `voice-scholarly-default` | major | Block prose / proof docstring not in scholarly third-person voice without author opt-out marker |
| `fit-section-chapter` | major | Block kind or topic does not fit its declared sub-section / section / chapter |
| `notation-canonical` | major | Deprecated notation per the project's notation register |
| `voice-editorializing` | minor | Forbidden phrases (`surprisingly`, `remarkably`, `it is worth noting that`, `a beautiful result`) |

## Slot E — §4d discharge bands

| Band | Examples |
|------|----------|
| **Auto-discharge** | `voice-status-leak` (delete the marker), `voice-emoji-content` (substitute words in body / leave ✓✗ in tables), `voice-unicode-crash` (replace with LaTeX math equivalents), `voice-time-stamped-notes` (delete the temporal qualifier), `notation-canonical` (mechanical rewrite per notation register), `voice-editorializing` (delete or rephrase) |
| **Author-assist** | `voice-scholarly-default` rewrites (substantive prose surgery, may need to preserve author intent), `voice-ai-slop` cleanup that touches > 5 sentences (mechanical first pass is fine; structural rewrite needs author), `fit-section-chapter` (move block, promote/demote kind, split section), `domain-boundary-correct` (move the specialisation to a sibling block on the correct side) |
| **Defer** | `voice-editorializing` in a passage the author has explicitly marked acceptable, glossary-block status leaks where the marker is part of the term being defined, `notation-canonical` hits inside historical / deprecated-on-purpose remarks |

## Slot F — §4e author-ask templates

For `voice-scholarly-default` / `voice-ai-slop`:

> Block `<label>` at `<url>` reads as `<characterisation>` (e.g. "first-person work narration in the proof body", "lecturer cadence in the section intro"). Sample passage: "<verbatim quote, 1-2 sentences>". Question: 1) rewrite in scholarly voice, 2) author has marked this an explicit exception (add `non-scholarly-voice-exception` tag), 3) demote to prose / remark with `interprets` (acknowledges informal status)?

For `fit-section-chapter`:

> Block `<label>` (kind `<kind>`, topic `<topic-keywords>`) sits under `<section>` in `<chapter>` but its content reads as `<alt-topic>`. Section currently has `<N>` blocks of which `<M>` cover the alt-topic. Question: 1) move block to `<alt-section>`, 2) keep here + add explicit connecting prose to `<sibling-block>`, 3) split section into two?

For `notation-canonical`:

> Block `<label>` at `<url>` uses `<deprecated-notation>`. The canonical form per the notation register is `<canonical>`. Question: 1) apply mechanical rewrite, 2) this block intentionally discusses the deprecated form (add explicit `deprecated:` callout), 3) extend the notation register to permit the alt-form?

For `domain-boundary-correct`:

> Block `<label>` has a proof at `<url>` that specialises beyond its declared domain, but the .md does not acknowledge the specialisation. Generic blocks and specialisations should live in separate files. Question: 1) move the specialised evaluation to a sibling block in the appropriate domain directory, 2) add an explicit "specialisation" banner to the .md, 3) refactor the proof to stay generic?

## Slot G — §5a backlog discovery

```bash
# 1. Enumerate every content block under the project.
find content -name '*.ts' \
  | xargs grep -l 'export default (definition\|theorem\|lemma\|proposition\|corollary\|conjecture\|example\|remark\|proof\|prose\|equation\|diagram\|simulator)(' \
  | sort -u > /tmp/_ov_blocks.txt

# 2. Run the staleness scanner; harvest blocks that are
#    missing / stale / partial under the watcher's criteria.
cd content && bun run pipeline/qa-staleness.ts \
  <paper> --json > /tmp/_ov_staleness.json

# 3. Rank blocks by:
#    - "missing-sidecar" first (never audited)
#    - then "stale" (had an audit, but source changed)
#    - then "partial" (some criteria fresh, others not)
#    Within each rank, prefer blocks recently touched on main.

# Source-of-truth backlog: the union of (missing-sidecar) + (stale).
jq -r '.blocks[] | select(.status == "missing-sidecar" or .status == "stale" or .status == "partial") | .label' \
  /tmp/_ov_staleness.json > /tmp/_ov_backlog.txt
```

The watcher's idle sweep (§5 inherited) pulls the next item from
this list. New items appear automatically as main commits modify
content.

## Slot H — §5b prioritisation

Override the parent's default rule with:

1. **Severity-weighted recent activity** — blocks touched by a main
   commit in the last 7 days, ranked by the highest-severity
   criterion currently stale/missing.
2. **Missing-sidecar** before stale — a never-audited block has zero
   coverage, ranked above blocks with at least some fresh entries.
3. **Per-section coverage** — within a chapter, prefer the section
   with the lowest fresh-criterion percentage (so coverage advances
   evenly).
4. **Downstream dependents** — count `uses[]` edges incoming; more
   dependents → earlier (a stale audit on a heavily-referenced
   block has wider blast radius).
5. **Alphabetical** as tie-breaker.

## Slot I — §6 invariants

| Invariant | Check |
|-----------|-------|
| Every modified `.md` / `.ts` / proof file in this branch has a refreshed `<block>.qa.json` with `reviewed_sha` ≥ branch HEAD | `git diff origin/main --name-only \| while read f; do qa="${f%.*}.qa.json"; [ -f "$qa" ] && git log -1 --format=%H -- "$qa" > /dev/null; done` |
| No new automated critical findings on `git diff` | `bun run content/pipeline/qa-sweep.ts <changed-section> --ci` exits 0 |
| `<block>.qa.json` JSON is valid against the `block-qa/v1` schema | `jq '.$schema == "block-qa/v1"' "$qa"` returns true |
| No block carries a `tags: ["non-scholarly-voice-exception"]` marker without an associated `notes` field in the QA report describing the rationale | grep-style audit |
| The notation register has not regressed (no new symbol added to a deprecated mapping) | git diff the project's notation register for additions to the "deprecated" tables |

If any invariant fails on a proposed commit, **block the commit**,
queue the violation as `critical`, and ask the author (per
parent §6).

## Multi-reviewer protocol

Per criterion, the QA report stores an **array** of reviewer
entries. The watcher's update rule:

1. **Compute current source hashes** (`md`, `ts`, proof).
2. **Find the most-recent fresh entry** (matching `field_hash`).
3. If a fresh entry already exists from a higher-authority
   reviewer (human > agent > script), preserve it and skip.
4. Otherwise append a new entry; do **not** delete prior entries.
5. The current-verdict resolution is: most recent entry where
   `field_hash` matches present source files. Ties broken by
   reviewer kind ranking (`human` > `agent` > `script`).

This way, a script run that finds "pass" is overruled by a later
agent or human entry that finds "fail" (on the same source), and
vice versa, but the audit trail is preserved.

## Quick-start

```bash
# Audit one section (writes <block>.qa.json files)
cd content
bun run pipeline/qa-sweep.ts <paper>/<chapter>

# See the staleness map afterwards
bun run pipeline/qa-staleness.ts <paper>/<chapter>

# Restrict to one criterion
bun run pipeline/qa-sweep.ts <paper>/<chapter> \
  --only voice-status-leak,notation-canonical

# CI gate (exits 1 on critical)
bun run pipeline/qa-sweep.ts <paper> --ci
```

## Domain-specific anti-patterns (extends parent)

- ❌ **Overwriting a human reviewer entry with a script entry.**
  Always APPEND; never replace.
- ❌ **Editing `<block>.qa.json` by hand** to mark a fail as pass.
  Re-run the sweep; if the script disagrees with author intent,
  resolve via the `non-scholarly-voice-exception` tag on the
  block's `.ts` (then re-run, and the script will record the new
  field_hash on the next pass).
- ❌ **Discharging a `voice-scholarly-default` finding via the
  auto-fix band** when the rewrite would touch more than five
  sentences. That is structural; ask the author.
- ❌ **Treating a `domain-boundary-correct` failure as a notation
  issue.** It is a content-architecture issue (block belongs to the
  wrong domain); fix by moving content, not by renaming symbols.

## Checklist (extends parent)

- [ ] Slot G discovery produced a non-empty backlog (or
      everything is fresh under all criteria)
- [ ] `qa-sweep.ts` ran on every changed section in this branch
- [ ] `qa-staleness.ts --ci` returns 0 (no missing-sidecar +
      no stale entries across the branch's changed scope)
- [ ] No `<block>.qa.json` was deleted; prior reviewer entries
      are preserved
- [ ] Every `voice-ai-slop` or `voice-scholarly-default` finding
      was either auto-mechanically reduced OR escalated via
      §4e author-ask (never silently passed)
- [ ] Slot I invariants check pass before any own-branch commit
```
