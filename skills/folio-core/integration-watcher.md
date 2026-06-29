---
name: integration-watcher
roles: [reader, collaborator, owner]
user_invocable: false
description: >
  Abstract parent skill for domain-specific **integration watchers**.
  Encodes the shared mechanics — Monitor on `origin/main`, PR
  subscriptions, per-event QA dispatch, queue + ledger, idle backlog
  sweep, idle author-ask dispatcher, watch-PRs-you-prepare protocol,
  voice-pass on PR diff, witness-drift CI recovery, billing-quick-fail
  flake handling — that every concrete watcher inherits. Children
  fill nine domain-specific slots; everything else is shared here.
allowed-tools: Read Edit Write Bash Grep Glob Agent Monitor Skill
---

# integration-watcher (abstract parent)

A concrete watcher (this skill's child) **watches incoming activity**
on a focused content axis — proofs, derivation discipline,
compute-chain wiring, voice, structure, or any future domain — runs a
domain QA pipeline on every detected change, queues findings, attempts
auto-discharge where possible, and asks the author for the rest.

Concrete children fill the slots below for one QA axis each. Typical
axes (a project picks the ones it needs):

| Child | Domain | Goal |
|-------|--------|------|
| `proof-integration-watcher` | Proof QA (narrative + formal layer) | No bare gaps, no axiom growth, formal-layer compile check, no naked conjectures with provable scaffolding |
| `canonical-watcher` | Derivation discipline | No undisclosed free parameters, no numerology, no coefficient fits (per the project's derivation-discipline statement) |
| `compute-integration-watcher` | Cross-layer compute wiring | Every provable/derived block has a probe + production consumer |
| `detangler-integration-watcher` | Structural QA (graph + density) | No new forward refs, sections within the block-count band, no new cross-chapter forward edges |
| `one-voice-integration-watcher` | Content-block voice + fit + framework | Scholarly voice (narrative + proof bodies), zero AI-slop, block fit to section/chapter, canonical-vs-deprecated notation; persists per-block `<block>.qa.json` audit reports (multi-reviewer, hash-keyed staleness) |
| `devils-advocate-watcher` | Adversarial "why is this wrong" review | For every block + formal sibling, construct the strongest referee objection; multiple adversarial lenses + adjudicator; emits `da-*` sidecars; gated by the refutation-scope rule + corpus-grep checklist |

## Domain slots (every child must fill)

| Slot | Where in this parent | What the child provides |
|------|----------------------|-------------------------|
| **A. Goal statement** | top of child | One-paragraph driving function |
| **B. §3 trigger filter** | §3 | Domain-specific patterns: which file paths / commit subjects / PR comment keywords trigger the §4 pipeline |
| **C. §4b dispatch table** | §4b | Which specialist skills/scripts to invoke per event, in parallel |
| **D. §4c finding taxonomy** | §4c | The set of violation/finding kinds the domain recognizes |
| **E. §4d discharge bands** | §4d | Domain-specific examples of Auto-discharge / Author-assist / Defer findings |
| **F. §4e author-ask templates** | §4e | Domain-specific question forms (numbered choices, file/line citations) |
| **G. §5a backlog discovery** | §5a | What to enumerate from the codebase at backlog-sweep time |
| **H. §5b prioritisation** | §5b | Domain-specific ranking rule for the backlog |
| **I. §6 invariants** | §6 | Per-commit checks the watcher enforces on its own branch |

Everything else — §1, §2, §4a, §4f, §5c-§5m, §7-§9, anti-patterns,
checklist — is defined here and inherited verbatim.

## 0. Invocation as `/integration-watch [args]`

This parent skill is **abstract — `user_invocable: false`**.
The `/integration-watch` slash command is implemented by
[`integration-watch`](integration-watch.md), which acts as the single
entry point and dispatches to one or more concrete children. Keeping
the dispatcher and the abstract parent separate avoids duplicating
the slash-command routing.

This section documents the **invocation grammar** that the dispatcher
must implement; the parent only describes shared mechanics that every
concrete watcher inherits.

When the user invokes `/integration-watch` directly the dispatcher:

| User input | Behaviour |
|------------|-----------|
| `/integration-watch` (no arg) | **Ask which.** Use `AskUserQuestion` capped at 4 chips, role-gated. Do NOT auto-pick. |
| `/integration-watch <axis>` | Dispatch the named child watcher |
| `/integration-watch all` or comma/space list | Dispatch **all** named watchers in parallel — each gets its own Monitor, its own queue/ledger, its own PR subscription set (deduped). |
| `/integration-watch <unknown>` | List the available children, reject the unknown name, re-prompt via `AskUserQuestion`. |

**No-arg full-context preamble (per §4e rule):** before the
`AskUserQuestion`, write a short chat message naming each available
watcher and its one-line QA axis, then surface the structured chip set.

## 0a. Repo-owner preferences (binding for all watchers)

Per AGENTS.md §"User accessibility" the repo owner types with
difficulty and prefers a small set of binding behavioural defaults.
These override the historical watcher defaults — every child inherits
them.

1. **One branch / one PR for related things.** Group many related
   fixes (especially backlog items) into a single branch + single PR.
   Don't open small per-item PRs. See §5j step 1 ("Cluster
   aggressively") and §5g step 5 for the merge-prompt sequencing.
2. **Don't spawn more than one agent at a time without explicit
   consent.** Sequential foreground work is the default; parallel
   agent dispatch requires affirmative user approval per batch. See
   §5m for the full rule and the narrow exceptions (read-only tool
   calls in one response are still fine; agent spawns are the
   constraint).
3. **Group a lot — backlog batches are large by default.** When the
   backlog has 4-20 related items in the same finding bucket, do them
   all in one branch, stacked as multiple commits if they need
   different commit messages. Don't split into N small branches.

These rules supersede any "default to parallel" / "one PR per item"
framing earlier in this document. When in doubt: cluster more,
dispatch fewer agents, ask before parallelising.

## 0c. Sibling coordination

Per AGENTS.md §"User accessibility" item "Coordinate intent with
sibling branches":

- **At workplan start** (new branch / new tranche), list active
  sibling PRs via `mcp__github__list_pull_requests` (open) and
  recently-updated `claude/*` branches via `mcp__github__list_branches`.
  Identify siblings whose scope overlaps (same chapter, same source
  file, same domain).
- **Post a 1-3 sentence intent comment** on each genuinely-overlapping
  sibling PR. Format: "Starting <theme> on <branch>; will touch
  <file or scope>; flag conflicts to me." Don't comment on every
  sibling; don't make noise on the PR. Skip if no overlap.
- **Inform siblings of critical findings** as they land. If you
  discover something a sibling is waiting on, post on the sibling PR
  proactively — don't wait for them to step on the rake.
- **During idle (per §0b 5-minute trigger)** ALSO check sibling PRs
  for coordination updates that affect your branch's scope.
  `mcp__github__pull_request_read get_comments` on each watched
  sibling; new comments addressed to "all watchers" or referencing
  your branch's keywords are actionable backlog items.

This rule supersedes the historical "post on the PR only when asked"
framing — proactive coordination on workplan start + during idle is
now the default.

## 0d. AskUserQuestion accessibility

Per AGENTS.md §"User accessibility" item "Default `AskUserQuestion` to
`multiSelect: true` + 🟡 marker": the repo owner types with difficulty.

- **Default `multiSelect: true`.** Single-select forces the user to
  type "1, 2" as free text when multiple options apply. Most watcher
  decision points are not mutually exclusive, so multi-select is the
  safer default.
- **Prefix questions with 🟡** to mark the agent as waiting / blocked
  on input. Consistent use lets the user scan chat history and find
  every pending decision.
- **Phrase questions to allow optional notes**: "Pick all that apply;
  add 'Other' with a free-text note if needed."
- Single-select is OK only for genuinely mutually-exclusive actions.

## 0b. Idle-time backlog policy (5-minute trigger)

Per AGENTS.md §"Agent work-plan policy" item 4 (5-minute idle
trigger): when this watcher has been idle for > 5 minutes (no
substantive output beyond TICK heartbeats or empty acks),
automatically start processing backlog without waiting for the user
to prompt. Walk the priority order:

1. **Session todos** (beans work-plan).
2. **Current-PR todos** — open-PR body checklist + unresolved
   review-comment threads on the branch's PR (via
   `mcp__github__pull_request_read get_review_comments` and `get` for
   the body).
3. **Integration-watcher queue items** — this watcher's own
   `.beans/<name>-queue.json` first, then sibling watchers'. Prefer
   items whose `block_or_script` overlaps the current PR's scope.
4. **Refresh stale sidecars + witnesses.** The QA pipeline depends on
   `*.qa.json` sidecars and `*.witness.json` files staying in sync
   with the source they audit. Treat the following as actionable
   backlog whenever idle:

   - **Sidecar staleness** — any block where either:
     (a) the SHA-256 prefix of the current source file content differs
     from the value stored under `source_hashes.{...}` in the
     `.qa.json`, OR
     (b) the SHA-256 prefix of the current checker script differs from
     the `criteria.<crit>[-1].reviewer.script_hash` value stored for
     the criterion's most recent entry. (Both stored hashes are
     12-character SHA-256 prefixes computed by the qa-sweep code;
     recompute with the same algorithm — see
     `content/pipeline/qa-sweep.ts` for the canonical helper.)
     Refresh by deleting the stale `criteria.<crit>` entry from the
     `.qa.json` and running
     `bun run content/pipeline/qa-sweep.ts <path> --only <crit>`
     (or invoke `/integration-audit <axis>` for a whole axis at once).
   - **Section-title sidecar staleness** — the chapter-scoped
     `content/<paper>/section-title-audit.qa.json` sidecars are a
     *separate* kind (title/structure machine findings + agent
     title-coherence verdicts), refreshed by
     `qa-section-title-audit.ts`, **not** qa-sweep. Regenerate with
     `bun run content/pipeline/qa-section-title-audit.ts --report-only
     --write-sidecar --thorough`. The `--thorough` flag folds every
     contained block's source content + descendant subsections into a
     per-section subtree hash, so a recorded title verdict re-opens
     (`pending`) when any descendant drifts. Keep the committed
     sidecars in thorough mode.
   - **Witness staleness** — any `*.witness.json` where either:
     (a) `witness.scriptCommitSha` differs from the current `HEAD` git
     commit SHA on the producer script's containing file
     (`git log -1 --format=%H -- <producer>`), OR
     (b) `witness.scriptHash` (SHA-256 prefix of the producer script's
     file content) differs from a freshly-computed hash of the current
     producer script. Refresh by re-running the producer with
     `2>&1 | tee /tmp/<script>.log` per the long-compute logging
     discipline.
   - **Detection budget** — capped at ≤ 10 sidecars / ≤ 3 witnesses
     per idle pass to avoid burying the visible queue items; remaining
     stale entries get logged for the next idle window.
   - **No silent regen** — every refresh that changes a sidecar or
     witness gets a commit on the current branch with a
     `chore(qa-sweep|witness)` message naming the producer + criterion
     + count of entries updated.
   - **Witness producer ≠ available** — if a witness's producer script
     crashes (e.g. blocked on a host fetch, a long compute killed), do
     NOT delete the sidecar. File a queue item naming the producer +
     the specific blocker and move on.

5. **Cross-cutting cleanups** (bare-URL reference upgrades, deferred
   bibliography items, glossary backfills).

For this skill's children specifically:

- The watcher's queue file is the primary backlog source (item 3).
  When triggered, read the queue, pull the highest-priority
  `needs-author` or unresolved `triage` item, and apply the §4 → §5 →
  §6 child-specific procedure on it.
- If the queue is empty/all-terminal, fall through to item 4
  (cross-cutting cleanups). Don't sit idle if there's reachable
  cleanup work.
- The "pause" command from the user IS a terminal state — do not
  pursue backlog after the user says "pause" or "stop until I'm back".
  Only the explicit "resume" / "continue" restart command lifts the
  pause.

This rule exists because integration-watcher sessions often spend long
stretches in idle monitor-TICK mode after the in-flight tranche lands.
Productive idle is "work the next queue item", not "TICK heartbeats
forever".

## 1. Baseline + setup (run once per session)

```bash
# Repo identity — declared once, referenced everywhere below.
# Read from the project config / git remote, not hard-coded.
OWNER=<repo-owner>
REPO=<repo-name>

# Bootstrap the queue + ledger under .beans/ (queue tracked as a bulk-JSON
# coordination queue; ledger gitignored — both survive branch switches)
mkdir -p .beans
NAME="<your-watcher-name>"
[ -f ".beans/${NAME}-queue.json" ] || \
  echo '{"items":[],"audited":{},"reviewed_up_to":{}}' > ".beans/${NAME}-queue.json"
[ -f ".beans/${NAME}-ledger.md" ] || cat > ".beans/${NAME}-ledger.md" <<EOF
# ${NAME} — session ledger

| ts (UTC) | event | scope | findings | action |
|----------|-------|-------|----------|--------|
EOF

# Stash main baseline so §5f timeout-recovery can diff cleanly
git fetch origin main 2>/dev/null
git rev-parse origin/main > "/tmp/_${NAME}_main.sha"
```

Queue file shape (children may extend with extra fields but must keep
this core):

```json
{
  "items": [
    {
      "id": "<sha1-12 of block-or-script + finding-class>",
      "block_or_script": "<label or path>",
      "paths": { "ts": "...", "md": "...", "formal": "...", "py": "..." },
      "finding": "<domain-specific from Slot D>",
      "severity": "critical | major | minor",
      "source": "watch:main:<sha> | watch:pr:<N>:<event-ts> | backlog",
      "source_sha": "<full SHA of the commit that triggered or backlogged this item>",
      "evidence": "<one paragraph: file:line + offending text>",
      "attempts": [ { "ts": "...", "tactic": "...", "outcome": "fail|partial|ok" } ],
      "status": "queued | in-progress | resolved | needs-author | wontfix | queued-for-removal",
      "asked_author_at": null
    }
  ],
  "audited": {
    "<block-or-script>": {
      "ts": "<ISO-8601 ts of last audit pass>",
      "sha": "<full SHA of main HEAD at audit time>",
      "criteria": ["<domain-specific finding-class>", "..."]
    }
  },
  "reviewed_up_to": {
    "<criterion>": "<full SHA of main HEAD at which all commits up-to-and-including have been audited under this criterion>"
  }
}
```

Schema notes:

- **`source_sha`** on every queue item records the commit that
  triggered the finding. For backlog items, set to the main HEAD at
  backlog-pass time.
- **`audited[<block>]`** is an object (not a bare timestamp). The `sha`
  records WHICH main HEAD the audit was against; the `criteria` array
  records WHICH finding-classes (Slot D) were checked.
- **`reviewed_up_to[<criterion>]`** is the per-criterion pointer to the
  most recent main commit at which the watcher has completed a full
  sweep under that criterion. Used by §5l resume to compute the
  unreviewed-commits queue.

The idle backlog sweep (§5) skips blocks whose `audited` entry covers
the current set of criteria AND was taken at a SHA ≥ the most recent
change to the block's source files. Anything else gets re-audited.

## 2. Active watching

### 2a. Watch `origin/main` (Monitor poll)

Arm exactly **one** persistent Monitor per session. Each new commit
line triggers the §4 per-event pipeline. **Emit every commit** — do
not cap with `head -N`, or fast bursts silently drop tail commits.

```
Monitor:
  description: "origin/main new commits — <NAME>"
  persistent: true
  command: |
    last=$(git ls-remote origin main 2>/dev/null | cut -f1)
    while true; do
      cur=$(git ls-remote origin main 2>/dev/null | cut -f1)
      if [ -n "$cur" ] && [ "$cur" != "$last" ]; then
        git fetch origin main 2>/dev/null
        # Use %H (full SHA) so downstream `git diff-tree` / `git show`
        # calls don't risk abbreviation ambiguity in long sessions.
        git log --reverse --format='MAIN %H %s' "$last..$cur"
        last=$cur
      fi
      gh_now=$(date -u +%s)
      if [ -z "$last_pr_check" ] || [ $((gh_now - last_pr_check)) -gt 300 ]; then
        printf 'TICK %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        last_pr_check=$gh_now
      fi
      sleep 300
    done
```

The `TICK` heartbeat (every 5 min) lets the foreground agent (a)
re-list open PRs and subscribe to any new ones, (b) pull a backlog
item if the queue was idle in the interval.

If the Monitor reports `[Monitor timed out — re-arm if needed]`, apply
**watch.md §5b** timeout-recovery (compare baseline SHA against current
`origin/main`, walk the missed range) before re-arming.

### 2b. Subscribe to PRs

**At setup** subscribe to: (a) own PR (if pushed) and (b) every open PR
updated in the last 7 days.

```python
own = <PR number of HEAD branch>
mcp__github__subscribe_pr_activity(owner=OWNER, repo=REPO, pullNumber=own)

prs = mcp__github__list_pull_requests(
  owner=OWNER, repo=REPO,
  state="open", sort="updated", direction="desc", perPage=40
)
cutoff = now() - 7d
for pr in prs:
  if parse(pr["updated_at"]) >= cutoff and pr["number"] != own:
    mcp__github__subscribe_pr_activity(owner=OWNER, repo=REPO, pullNumber=pr["number"])
```

**Continuously:** at every `TICK` heartbeat, re-list open PRs and
subscribe to any new ones. Subscription is idempotent.

### 2c. Continuous main-following for own PRs (MANDATORY)

Every new commit landing on `origin/main` (detected via the §2a Monitor
poll) **must** trigger an own-PR rebase walk via §5g step 7
**unconditionally** — independent of whether the §3 trigger filter
matches the commit's scope or §4 dispatch runs any specialists.

The rationale: a watcher session that lets its own PRs accumulate
"behind by N commits" against `origin/main` ships dirty work to
reviewers and risks GitHub's "needs rebase" state silently when the
user comes back to merge.

**Fire rule** (every Monitor commit line):

```
on new main commit SHA detected by Monitor:
  1. Refresh local main tracking: git fetch origin main
  2. Walk every own PR (this watcher created in this session)
     per §5g step 7 — worktree rebase + force-with-lease push.
     Witness-drift conflicts auto-resolve via §5f.
  3. THEN (independently) check §3 trigger filter and dispatch
     §4 specialists if in-scope.
```

The walk in step 2 is **idempotent** (a no-op when no own PRs are
behind), so applying it on every commit is cheap.

**Cross-PR rebase caveat (per-session limitation):** the commit-signing
wrapper some repos use emits "missing source" errors when invoked from
a worktree opened by a session that didn't author the commits being
rebased. A watcher session can only auto-rebase PRs it OPENED IN THAT
SAME SESSION — not sibling PRs from other sessions. For sibling PRs,
surface the "behind by N" finding to the user via the §5e idle
author-ask dispatcher instead.

### 2d. Stop conditions

- User says *"stop watching"*, *"unsubscribe"*, or `/unwatch`.
- Branch merged or closed → unsubscribe own PR; keep sibling
  subscriptions if user still wants coordination.
- Session ends.

To stop: call `TaskStop` on the Monitor and
`mcp__github__unsubscribe_pr_activity` on every subscribed PR. Record
the stop event in the ledger.

## 3. Trigger filter — does this event match the domain?

Children fill **Slot B** with the domain-specific filter. The parent
only requires the filter return a boolean `is_in_scope=true|false` and,
if false, that the event be recorded as a one-liner in the ledger and
otherwise skipped.

Common shapes children typically check:

- **File path patterns** in the changed-files list
- **`.ts` block kind** of any touched `content/.../**/*.ts`
- **PR comment body keywords** (for review-comment events)

If `is_in_scope=false`, emit a one-liner to the ledger and return.

### 3a. On-new-commit derivation-completion detection (MANDATORY)

In addition to the domain trigger filter, every watcher must check
whether the incoming commit **closes** a previously-flagged "open" item
in the queue. The check runs **before** the §4 pipeline so the same
event drives both new-violation detection AND queued-item resolution.

```bash
SHA=<incoming commit>
changed=$(git diff-tree --no-commit-id --name-only -r "$SHA")

# Step 1 — look for canonical-form arrivals. Heuristic patterns
# (children override in Slot B-derivation). Content blocks use builder
# calls (`export default theorem({ ... })`), not literal `kind:` fields.
# The formal-layer check fires when an unproved-gap count drops to zero.
new_propositions=$(
  echo "$changed" | while read f; do
    if [[ "$f" =~ ^content/.*\.ts$ ]]; then
      git show "$SHA:$f" 2>/dev/null \
        | grep -qE "export default (theorem|proposition|lemma|corollary)\(" \
        && ! git show "$SHA^:$f" 2>/dev/null \
        | grep -qE "export default (theorem|proposition|lemma|corollary)\(" \
        && echo "$f"
    fi
  done
)
```

A more reliable alternative: load the affected `.ts` modules via the
content pipeline's TypeScript loader and inspect the parsed `kind` field
directly — heuristic grep is a session-local fast-path.

For each newly-arrived derivation, search the queue for items whose
`status` is in `{queued, needs-author}` and which reference the
now-derived label (directly or transitively via `uses[]`). For each
hit:

1. **Audit downstream impact.** If the queued item was flagged "open"
   because it depended on this derivation, the dependency is now
   closed. Re-classify per §4d.
2. **Trigger removal candidacy.** If the queued item was a placeholder
   or probing block waiting for the canonical form, mark `status:
   queued-for-removal` (see §3b below).
3. **Update the ledger** with a `derivation-completion` row citing both
   the new commit SHA and the queue item id.

This prevents the watcher from carrying stale "open problem" framings
after the actual closure lands.

### 3b. Removal-over-banner policy (MANDATORY for legacy / superseded)

When a canonical derivation lands and supersedes a legacy / deprecated /
probing block, the watcher's correct response is **remove the legacy
block**, not banner-tag it in place. Banner-tagging is reserved for
blocks that **remain on the canonical chain** with an open piece
(acknowledged-stub); legacy blocks that have been superseded should
leave the paper.

Removal decision matrix:

| Legacy-block shape | Action |
|--------------------|--------|
| Block whose `kind: remark` explicitly says "*superseded*" / "*retained for historical context*" / "*legacy*" | **Remove file** + rewire `uses[]` to the superseding block |
| Falsification report consumed by a summary block | **Remove file**; the summary block carries the negative result |
| Probing block / negative-result attempt whose conclusion is "doesn't close" / "incomplete" | **Remove file** unless the methodology is reused elsewhere |
| Acknowledged-stub that is **still on the canonical chain** | **Banner-tag** (do NOT remove); the block is canonical with one open piece |
| Block that consumes an undisclosed input self-acknowledgedly | **Remove the affected section** (not the whole file); keep the canonical form |

When a child watcher detects a queued-for-removal item, it should:

1. Open a follow-up PR with the file deletion (+ `uses[]` rewires in
   chapter manifests and downstream consumers).
2. **Not** silently delete content in the on-going PR — the removal is
   a separate, reviewable change.
3. Cite the superseding block in the removal PR description.

### 3c. On-new-commit skill-availability detection (MANDATORY)

In addition to the domain trigger filter (Slot B) and the §3a
derivation-completion check, every watcher must check whether the
incoming commit (or batch in the unreviewed range) **added a new skill
file** under `.claude/skills/`:

```bash
SHA_RANGE="<LAST_REVIEWED>..<NEW_SHA>"
git diff --name-only --diff-filter=A "$SHA_RANGE" \
  -- '.claude/skills/local/*.md' '.claude/skills/*/*.md'
```

For each new skill file:

1. **Read the frontmatter** — extract `name`, `roles`, `description`,
   `inherits`.
2. **Decide relevance** to this watcher's domain (Slot A goal). A new
   skill is relevant when its `description` mentions a file kind /
   pattern this watcher audits, OR it is a sibling integration-watcher
   child (`inherits: local/integration-watcher`), OR it provides a new
   specialist this watcher could dispatch via Slot C.
3. **Surface to the user via `AskUserQuestion`** with 3 chips: `Adopt
   now` / `Defer to follow-up branch` / `Not relevant`.
4. **Record the decision in the watcher's ledger** under a `### New
   skills` subsection so future sessions don't re-prompt.

This rule applies to skill files only. Skills landing on sibling PRs
that haven't merged yet do NOT trigger this check — only `main` commits
count.

## 4. Per-event QA pipeline

When the trigger filter passes, fan out to the domain specialists **in
parallel**. The parent owns the orchestration; the child provides the
specialist list.

### 4a. Scope reduction

Compute the changed-block set / changed-script set / changed-witness set
from the event SHA:

```bash
SHA=<event sha>

# changed content blocks (label = kebab basename minus -proof suffix)
changed_blocks=$(git diff-tree --no-commit-id --name-only -r "$SHA" \
  | grep -E 'content/.*\.(md|ts)$' \
  | sed -E 's|.*/||; s|\.[^.]+$||; s|-proof$||' \
  | sort -u)

# changed scripts
changed_py=$(git diff-tree --no-commit-id --name-only -r "$SHA" \
  | grep -E '^computations/.*\.py$' | sort -u)

# changed witness JSONs
changed_witnesses=$(git diff-tree --no-commit-id --name-only -r "$SHA" \
  | grep -E '\.witness\.json$|\.derivation\.json$' | sort -u)
```

### 4b. Dispatch (parallel `Agent` calls)

Children fill **Slot C** with a table of `Specialist | When to run |
What it checks`. Launch all applicable specialists in a single response
with multiple `Agent` tool calls (NOT sequentially).

**Sidecar-aware dispatch.** Before dispatching a specialist on a block,
check the block's `.qa.json` sidecar for the relevant criterion:

1. Read `<block>.qa.json` → `criteria[<criterion>]` entries.
2. If an entry exists with `result: "pass"` and its `field_hash`
   matches the current file hash → **skip** (block already audited and
   passes).
3. If the entry is stale (hash mismatch) or `result: "fail"` →
   **re-audit**.
4. If no entry exists → **audit** (first time this criterion has been
   evaluated on this block).

This avoids re-auditing the blocks that already pass on each incoming
commit. Only changed blocks and previously-failing blocks get
dispatched.

**Recording results.** After each specialist completes, update the
sidecar with:
- `result`: pass/warn/fail
- `field_hash`: current file hashes
- `reviewer`: `{ kind: "agent", agent_model: "<model>", agent_date:
  "<ISO>", agent_skill: "<skill>" }`
- `evidence`: hits array (on fail/warn)
- `reviewed_at`: ISO date

Multiple reviewer entries per criterion are allowed. The most recent
entry whose `field_hash` matches current sources is authoritative.

Cap each agent's report at ~400 words.

### 4c. Synthesize findings

Apply the `proof-editor` §3 "Synthesize" rules (same in every domain):

1. **Deduplicate** across specialists.
2. **Cluster** by affected block/script.
3. **Severity rank**: critical / major / minor.
4. **Map to queue items** (one queue item per finding) — finding kind
   comes from the child's **Slot D**.

### 4d. Attempt fixes (collaborator+ only)

Every finding falls into one of three discharge bands. Children fill
**Slot E** with domain-specific examples; the band structure is shared:

| Band | Shape | Action |
|------|-------|--------|
| **Auto-discharge** | Finding has a known mechanical fix (registry migration, tactic application, banner addition, cite move, …) | Apply the mechanical fix; re-run the relevant scanner / validator to confirm; commit |
| **Author-assist** | Finding requires human judgement (semantic, architectural, scope) | Open one author ask per stuck block (see §4e) |
| **Defer** | Finding is acknowledged / opt-out / minor stylistic | Mark `wontfix` in queue with reason |

### 4e. Author asks — one ask per stuck block

When a finding lands in the **Author-assist** band, post one ask either
on the source PR (if the trigger was a PR event) or via
`AskUserQuestion` (if the trigger was a main commit and a foreground
user is present).

**Always lead with full context in chat, then ask a structured
question.** Two-part pattern:

1. **Context preamble (chat text).** Before the `AskUserQuestion` call,
   write a short chat message: the finding (one sentence, with
   severity); the affected file (GitHub blob URL, `.md` preferred per
   AGENTS.md "Always provide GitHub links"); evidence (verbatim quote
   with line numbers); what was attempted and what failed.
2. **Structured question.** Then call `AskUserQuestion` with a tight
   numbered-choice set (2-4 options), each option mapping directly to a
   queue-action. The question stem must be one sentence; the options
   carry the detail.

Format (children fill Slot F with domain-specific question forms):

```markdown
**<watcher-name> ask — `<block-or-script>`** (from <source-pr-or-commit>)

- Finding: <one sentence, with severity>
- File: <github-blob-url to `.md` (or formal/py file if domain-specific)>
- Evidence: `<file:line>` — `<verbatim quote of offending text>`
- Attempted: <which scanners/specialists/tactics were tried>
- Question: <one yes/no or numbered choice>
```

**One ask per stuck block, batched per round.** If the author hasn't
answered in 24 h (async setting), restate once and move on. Do not
block the queue on a single unanswered ask.

### 4f. Update the queue + ledger

After each event:

```bash
ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "| $ts | <event> | <scope> | <N critical / N major / N minor> | <N auto / N asked / N deferred> |" \
  >> ".beans/${NAME}-ledger.md"
```

Update `.beans/${NAME}-queue.json` with new items + status changes via
`Edit`.

### 4g. Refresh spawned PRs against main *(superseded by §2c)*

The continuous main-following rule is now §2c (mandatory, unconditional
on every main commit, **before** §3 / §4 dispatch). §4g remains as a
redundant safety net: if §2c somehow didn't fire (e.g. the Monitor
crashed between detection and rebase walk), the §4 pipeline completion
can also trigger §5g step 7 as a fallback. The rebase runs in a
worktree; witness-drift conflicts auto-resolve via §5f; substantive
conflicts halt the rebase and surface as an author ask per §4e.

## 5. Idle backlog sweep

When the queue has been quiescent for ≥ 10 minutes (no main commits, no
PR events, no in-flight discharge attempts), pull the next backlog item.

### 5a. Discovery (run once at session start, refresh every 50 items)

Children fill **Slot G** with the domain's enumeration recipe (typically
a `find` + `grep` pipeline OR an existing aggregator script).

### 5b. Prioritisation

Children fill **Slot H** with the domain's ranking rule. Common factors:

1. Severity (critical > major > minor).
2. Downstream dependents (more dependents → earlier) via `uses[]`.
3. Last-audit recency (older → earlier) from `queue.audited[]`.
4. Alphabetical as tie-breaker.

### 5c. Per-item processing

Apply §4 — exactly the same pipeline as for incoming events. The
`source` field on each queue item becomes `backlog`.

### 5d. Quiescence + heartbeat — AUTO-PULL FROM QUEUE WHEN IDLE

A backlog item is preempted by any incoming event. Resume the backlog
when the queue is quiescent again. The number of in-flight backlog items
is capped by §5m's parallelism cap (currently 4) when items are
independent; items sharing state serialise.

**Auto-pull policy (MANDATORY).** On every Monitor TICK heartbeat where:

1. No incoming event has arrived during this TICK window
2. The count of items currently in `status: in-progress` is below the
   parallelism cap (per §5m, default 4)
3. `.beans/${NAME}-queue.json` contains at least one item with `status:
   queued` (or `status: needs-author` whose author ask has been
   outstanding ≥ 7 days — the §5e re-ask cadence)

→ **Pull the highest-priority queued item per §5b and start §5c
processing on it immediately.** Do not wait for a user prompt. The
heartbeat one-liner is for periods when the queue is *empty*, NOT for
periods when the queue is non-empty and the agent is choosing not to
work.

Sub-agent dispatch. For long-running items the watcher should launch the
work via `Agent(run_in_background=true)` so the foreground stays
responsive. Update the item's status to `in-progress` immediately on
dispatch and back to `resolved` / `needs-author` on completion.

Foreground vs background. Use foreground for items whose findings the
watcher itself must consume to decide what to queue next. Use background
for items whose deliverable is a standalone PR / commit / handover doc.

**Empty-queue heartbeat.** Only when the queue truly has no queued or
eligible needs-author items, and the session has been entirely quiescent
for ≥ 60 minutes, emit a one-liner:

> `<watcher-name>` idle — backlog at N items, queue at M items (0
> eligible for auto-pull), in-progress at K items, next refresh in
> <next discovery time>.

…and keep the Monitor armed. (If the queue has eligible items but the
agent didn't auto-pull, that is a policy violation — fix the watcher's
TICK handler, do not work around with the one-liner.)

### 5d-bis. Own-PR-CI-wait counts as idle (MANDATORY)

After you push a PR you authored this session, **do not stop**. The
webhook subscription will deliver CI/review events when they arrive;
meanwhile the agent is idle in §5d's sense and MUST pull the next
backlog item:

1. **Push + subscribe + immediately re-enter §5d auto-pull.**
2. **Pick a non-overlapping item.** The new item's scope must not touch
   files modified in the in-flight PR. Use `git diff origin/main..HEAD
   --name-only` on the in-flight branch to compute the exclusion set.
3. **Open the next item on a NEW branch off `origin/main`** — not off
   the in-flight PR's branch.
4. **Webhook events still preempt.**
5. **Exhaust the queue, not your patience.** Continue batching until (a)
   the queue is empty, (b) every remaining item touches files in an
   in-flight PR, or (c) the user says "stop" / "park" / "switch to X".

### 5e. Idle author-ask dispatcher

When the watcher enters an idle window AND the queue contains items
needing author input, batch the open asks and surface them via
`AskUserQuestion` (foreground) OR as a single consolidated own-PR
comment (PR-driven session) OR as a "Pending author asks" section in the
ledger (headless).

Triggers (in priority order):

1. Items with `status: needs-author` that have never been asked
   (`asked_author_at: null`).
2. Items with `status: queued` that have aged > 24 h without any
   discharge attempt and are in the **Author-assist** band.
3. Items with `status: needs-author` that were asked > 7 days ago and
   never resolved — **re-ask once**, then mark `wontfix` with `reason:
   author-unresponsive`.

Per round, pull **up to 3** asks, group by block, surface as one
consolidated message. After each ask, set `asked_author_at: "<ISO ts>"`.
Cap consecutive asks per block at 3; beyond that mark `wontfix` with
`reason: ask-fatigue`.

**Anti-pattern:** never auto-mark a `needs-author` item as `resolved`
based on inferred user assent. Only an explicit author reply or commit
closes it.

### 5f. Witness-drift CI failure pattern (RECOVERY RECIPE)

A compute/witness validation CI job re-runs the project's computations,
regenerates witnesses, and fires a drift check. It triggers on formal /
compute source edits AND on any `*.witness.json` / `*.derivation.json`
change.

**Failure mode:** even a comment-only edit can trigger validate.
Validate runs many scripts; one regenerates a witness that has drifted
on main since the last refresh (e.g. a `files_scanned` count moved when
a new probe landed without a witness refresh). The drift check fires.

**The pattern is endemic.** Main's own commit log shows repeated
`post-rebase drift refresh` / `post-push drift refresh` entries — author
+ sibling agents do this routinely.

**Sub-case: quick-fail = billing.** If a CI job fails in **under ~60
seconds**, the runner almost never reached the validators. This is a
billing / queue / quota condition on the CI account, **not** a content
failure. Treat as a flake: do NOT rebase, do NOT regenerate witnesses,
do NOT diagnose validators. Document in ledger as `quick-fail /
billing` and proceed per §5g step 5(b).

**Recovery recipe** (apply IN ORDER) for genuine multi-minute validate
failures:

1. **Pull fresh main.** `git fetch origin main`. If ≥ 5 commits landed,
   jump straight to step 2.
2. **Rebase.** `git rebase origin/main`. Witness conflicts are expected
   on the auto-regenerated audit witnesses.
3. **Take main's witnesses.** `git checkout --ours <witness>` for each
   conflicted file (in rebase context `--ours` = main). `git add
   <witness>`.
4. **Continue.** `git rebase --continue`. If the same conflict reappears
   on a later commit, repeat step 3.
5. **Force-push.** `git push --force-with-lease`.

**Do not** hand-edit witness JSON, do not regenerate witnesses on your
branch as a "fix" (by the time CI runs, main moves again), and do not
rebase reactively after every single CI failure — only after exhausted
local diagnosis.

### 5g. Watch PRs you prepare

When a watcher (or any skill it dispatches) **prepares a PR**, the
watcher **must** add the new PR to its subscription set immediately and
follow up on review activity. Author oversight expectation: *"watch PRs
you prepare for review comments and respond if you can. if not ask
author. once done, ask author if they want to merge and provide link"*.

Per prepared PR:

1. **Subscribe.** Right after `create_pull_request`, call
   `mcp__github__subscribe_pr_activity` with the new PR number. Add to
   the ledger under "watching".
2. **Request automated reviews from the available bots.** Call
   `mcp__github__request_copilot_review`. Any other automatic reviewer
   (e.g. `gemini-code-assist`) runs on PR open if configured; if it
   doesn't post within a few minutes, check for a quota-limit comment
   and document in the ledger. Don't wait for human review.
3. **Triage every review event** per coordinate §5a:
   - `accept` → fix the small thing, push
   - `accept-with-modification` → fix differently, reply
   - `reject-with-reason` → reply on the thread
   - `escalate` → ask the author via §4e
4. **Pre-push stale-base check.** Every fix-push triggers a fresh CI
   run. Before each fix-push, run `git fetch origin main` and check the
   delta. If main moved ≥ 3 commits and any touch your PR's diff scope,
   rebase first (per §5f).
5. **Done check + merge via `/prepare-merge-auto`.** When (a) every open
   review thread is resolved or replied to AND voice has been applied or
   noted n/a (§5h), (b) every CI check is green OR documented as a flake
   (§5f), (c) the diff still reflects the original intent — invoke
   `/prepare-merge-auto`. The skill handles sibling coordination, final
   rebase, review-comment resolution, structured user questions (if
   blocked), and merge.
6. **Stop on merge.** Once merged (or closed), call
   `mcp__github__unsubscribe_pr_activity`. Record outcome in ledger.

7. **Rebase spawned PRs on main movement.** Every time a new commit
   lands on `origin/main` and the §3 / §4 per-event triage completes,
   walk **every PR this watcher has opened that is still open** and
   ensure each one is current with `origin/main`:

   ```bash
   # One `git fetch origin` outside the loop refreshes every
   # remote-tracking ref the loop will use.
   git fetch origin

   # Extract branches under the "### Watching" subsection. The closing
   # pattern is `^## ` (next top-level header), NOT `^### `.
   pr_branches=$(awk '/^### Watching/,/^## /' \
       ".beans/${NAME}-ledger.md" \
       | grep -oE 'claude/iw-[a-z0-9-]+' | sort -u)

   for pr_branch in $pr_branches; do
     pr_num=$(gh pr list --head "$pr_branch" --state open \
              --json number --jq '.[0].number')
     [ -n "$pr_num" ] || continue   # closed / no open PR; skip

     behind=$(git rev-list --count "origin/$pr_branch..origin/main")

     # Diff-scope overlap: which files did MAIN change since the branch
     # diverged, intersected with files the BRANCH changed since
     # divergence? Use merge-base, not a two-tip diff.
     base=$(git merge-base "origin/main" "origin/$pr_branch")
     # `xargs -r` skips the inner command when the file list is empty.
     touches_diff=$(
       git diff --name-only "$base" "origin/$pr_branch" \
       | xargs -r -I {} git log --oneline "$base..origin/main" -- {} \
       | wc -l
     )

     # Rebase trigger: ≥ 3 commits behind OR ≥ 1 file in the
     # intersection of (main-changed-since-base) ∩ (branch-changed).
     if [ "$behind" -lt 3 ] && [ "$touches_diff" -eq 0 ]; then
       continue
     fi

     # Rebase in a worktree. Use a SUBSHELL so the per-iteration
     # `trap … EXIT` is scoped to this iteration.
     (
       worktree=$(mktemp -d /tmp/iw-rebase.XXXXXX)
       trap 'git worktree remove --force "$worktree" 2>/dev/null; \
             rm -rf "$worktree"' EXIT

       git worktree add "$worktree" "origin/$pr_branch" >/dev/null

       # Explicit if/then/else so rebase-conflict and push-fail are
       # distinguishable.
       if ( cd "$worktree" && git rebase origin/main ); then
         if ( cd "$worktree" && git push --force-with-lease \
                origin "HEAD:$pr_branch" ); then
           echo "REBASED + PUSHED $pr_branch"
         else
           echo "PUSH FAILED on $pr_branch (lease rejected / remote moved) — retry next cycle"
         fi
       else
         ( cd "$worktree" && git rebase --abort 2>/dev/null ) || true
         echo "REBASE CONFLICT on $pr_branch — flag to author (§4e)"
       fi
       # trap fires on subshell exit, cleaning THIS iteration's worktree.
     )

     # Update ledger row with last-rebase-against-main SHA on success.
   done
   ```

   Witness-drift conflicts on the auto-regenerated audit witnesses
   auto-resolve via the §5f recipe. Substantive conflicts halt the
   rebase and surface as an author ask per §4e. This step keeps spawned
   PRs current **automatically** between main-event triages.

### 5j. Backlog-found issue — spin up your own PR

When the **idle backlog sweep** (§5) finds an issue that is NOT already
addressed by an open PR, the watcher's default action is to **create a
PR on its own branch** to resolve it, then follow §5g.

Workflow:

1. **Cluster aggressively — one branch / one PR per related tranche.**
   Group nearby backlog items (same chapter, same file, same finding
   kind) so one PR addresses a coherent tranche, not a single one-line
   fix. **Default to "big batch".** Sequencing within the PR: stack
   commits per sub-group, each on the same branch so reviewers read one
   diff.
2. **Branch.** Create a new branch via `mcp__github__create_branch`,
   named using the **integration-watcher convention**:

   ```
   claude/iw-<TYPE>-<DESCRIPTIVE-STUB>
   ```

   - `<TYPE>` — short tag for which watcher is spinning up the PR
     (matching the child's domain prefix), or `meta` for changes to the
     integration-watcher skill family itself.
   - `<DESCRIPTIVE-STUB>` — kebab-case slug naming the issue, 3-6 words
     that read clearly in a `gh pr list` output.

   The `iw-` infix is the **mandatory marker** that ties the branch back
   to the integration-watcher family — the discovery handle any
   watcher-spawned-PR sweep can grep. Random suffixes are not part of
   the convention; on collision append `-v2` / `-v3`, don't randomise.
3. **Apply fixes.** Use `mcp__github__push_files` or `git push` from a
   temp local branch.
4. **Open PR** via `mcp__github__create_pull_request` with a descriptive
   title + body citing the backlog source.
5. **Subscribe + request copilot review** per §5g step 1-2.
6. **Triage** review threads per §5g step 3.
7. **Voice + done check + merge prompt** per §5h and §5g step 5.

**When to escalate to the user instead of opening a PR:**

| Condition | Action |
|-----------|--------|
| Backlog item is one quick fix (< 5 min, < 50 lines) and clearly mechanical | Open PR directly, don't ask first |
| Backlog item touches > 5 files OR introduces new content blocks OR makes a semantic claim | Surface to user via §4e first; only open PR after user confirms |
| **Backlog item is VERY large** (> 200 lines, > 20 files, semantic refactor, unfamiliar domain) | **Do NOT open a PR.** Write a **handover document** at `docs/audits/<YYYY-MM-DD>-<short-task>-handover.md`. See §5k. |

### 5k. Handover doc for very-large backlog issues

When a backlog issue exceeds the watcher's discharge capacity, produce a
handover doc rather than attempt the fix:

```markdown
# Handover: <issue title>

**Scope:** <one paragraph>
**Discovered by:** `<watcher-name>` backlog sweep on <date>
**Severity:** <critical | major | minor>
**Estimated effort:** <hours / days>

## Background
<context — why this matters, where the issue lives>

## What the watcher found
<verbatim queue items + evidence>

## Suggested approach
1. <step 1>
2. <step 2>

## Specialist skill recommended
`<skill-name>` (collaborator role)

## Acceptance criteria
- [ ] <criterion 1>
- [ ] <criterion 2>
- [ ] CI green (or §5f flake documented)
- [ ] Voice sweep applied
```

Then surface to user via §5e: "I found a very-large issue (<title>).
Handover doc at `<url>`. Should I dispatch `<specialist-skill>` to take
it, hold for a future session, or expand the watcher to attempt it?"

### 5i. Sibling-PR findings — post comment, don't fix

When a watcher detects an in-scope finding on **a PR it did not create**
(a sibling PR owned by another agent or a human author), the watcher
**must not** push a fix to the sibling branch. Instead, post a single
coordination comment on the sibling PR:

```markdown
**<watcher-name> sibling-PR ask — `<block-or-script>`**

- Finding: <one sentence, with severity>
- File: <github-blob-url to `.md` on the sibling PR head>
- Evidence: `<file:line>` — `<offending text>`
- Attempted: (none — not auto-fixing on sibling branches per §5i)
- Suggested fix: <one-paragraph proposal>
- Owner-agent action: address on your branch and reply with the commit
  SHA, or reply with rationale for skipping.
```

Rationale: cross-branch fixes silently diverge. The right move is to
surface the finding, suggest the fix, and let the owner integrate.

**Rate-limit.** One sibling-PR comment per finding per round. If a
sibling PR accumulates ≥ 3 unaddressed findings, batch them into a
single follow-up comment (one round only); after that, mark the PR's
items `wontfix-sibling-unresponsive` and surface to the author per §5e.

**Exceptions** (when direct cross-branch action IS appropriate):
- Cherry-picking a sibling's commit into your branch — that's pull, not
  push.
- The author explicitly authorises the cross-branch action.

### 5h. Post-completion voice review on prepared PRs

When a prepared PR (per §5g) lands its **last substantive fix**, run
`local/one-voice-audit` on the **diff scope** before the merge prompt:

- **PR touches `.md` content** → run the §1 greps (status leaks, emoji,
  work-tracker words, first-person tone, unicode crashes) on the diff.
  Apply mechanical fixes. Push as `style: voice sweep on PR diff`. Then
  the §5g step 5 merge prompt.
- **PR is content-free** (only formal-layer, `.ts`, `.py`, witness JSON,
  or skill `.md`) → voice is a **no-op**; record that in the ledger and
  the merge-prompt reply ("voice: n/a, PR scope is X only").

### 5l. Resume protocol — suggest next action on session start

When a watcher starts (fresh session OR `/integration-watch`
invocation), **before** arming the Monitor, compute the resume state and
surface a structured suggestion to the user.

**Procedure:**

1. **Load persisted state.** If `.beans/${NAME}-queue.json` exists,
   parse it. Read `reviewed_up_to[<criterion>]`, `items[]` with `status
   ∈ {queued, in-progress, needs-author}`, and `audited[]`.

2. **Compute the unreviewed-commits queue.** For each criterion `C`:

   ```bash
   git fetch origin main 2>/dev/null
   # jq --arg passes $C safely (no shell-quoting injection).
   LAST=$(jq -r --arg c "$C" '.reviewed_up_to[$c] // empty' "$QUEUE")
   CUR=$(git rev-parse origin/main)
   if [ -n "$LAST" ] && [ "$LAST" != "$CUR" ]; then
     # If main was force-pushed (history rewrite) `git log $LAST..$CUR`
     # would error. Fall back to "history diverged" handling.
     if git merge-base --is-ancestor "$LAST" "$CUR" 2>/dev/null; then
       git log --reverse --format='%H %s' "$LAST..$CUR" > "/tmp/_${NAME}_${C}_missed"
     else
       printf 'HISTORY_DIVERGED %s last=%s cur=%s\n' "$C" "$LAST" "$CUR" \
         > "/tmp/_${NAME}_${C}_missed"
     fi
   elif [ -z "$LAST" ]; then
     # No prior pointer (first run). Fall back to "backlog only" mode.
     printf 'NO_PRIOR_POINTER %s\n' "$C" > "/tmp/_${NAME}_${C}_missed"
   else
     : > "/tmp/_${NAME}_${C}_missed"   # LAST == CUR: nothing new
   fi
   ```

   The result per criterion: a list of commit SHAs not yet audited.
   Trigger §3 filter on each; only the in-scope ones become §4
   dispatches.

3. **Compose the resume-suggestion summary** (full-context preamble per
   §4e), then ask the user via `AskUserQuestion` what to do next.
   Standard 4-option chip set:

   ```markdown
   `<watcher-name>` resume — session state:

   | Indicator | Value |
   |-----------|------:|
   | Open queue items (queued + in-progress + needs-author) | N |
   | Unreviewed main commits per criterion (sum across Slot D) | M |
   | Last fully-audited main HEAD (across all criteria) | <SHA[:12]> |
   | Current main HEAD | <SHA[:12]> |
   | Delta | <N commits> |

   Top-3 oldest unaddressed asks: …
   Top-3 highest-severity queue items: …
   Newest in-scope main commit not yet audited: <SHA[:12]> "<msg>"
   ```

   Then the AskUserQuestion:
   - Option A: **Triage unreviewed commits first** (recommended when
     delta > 0 and any are in-scope)
   - Option B: **Continue backlog sweep** (recommended when delta == 0
     or the backlog has needs-author items)
   - Option C: **Dispatch a specific chapter / target** (free-form
     fallback)
   - Option D: **Just watch passively** — arm Monitor, no proactive work

4. **Record on every full sweep.** After §4 scans the **entire** missed
   range `LAST..CUR` under criterion `C`, update `reviewed_up_to[C] =
   CUR` — the scanned-up-to-and-including HEAD, **not** just the newest
   in-scope commit. The pointer advances when the scan is *complete*,
   regardless of how many commits passed §3. After §5 backlog sweep
   completes a block `B`, update `audited[B] = { ts, sha: <main HEAD at
   sweep time>, criteria: [<Slot D criteria checked>] }`.

5. **Resume-suggestion frequency.** Run at session start and whenever
   the user types `/integration-watch resume` or `<watcher>:status`.

The combination of `reviewed_up_to[criterion] +
audited[block].{sha,criteria}` makes the audit ledger fully replayable.

### 5m. Sequential-by-default; parallel agents require explicit consent

Repo-owner preference: **don't spawn more than one agent at a time
unless explicit consent.** This overrides the historical
"parallel-by-default" model.

**Default rule:** while idle, the watcher does its own work
**sequentially in the foreground** — one backlog item / one PR triage /
one criterion sweep at a time. Foreground reads (`Read`, `Grep`, `Bash`
for inspection) can still run in parallel within a single response; the
constraint is on **agent dispatch** (`Agent(...)` calls).

**Explicit-consent escalation:** if the watcher believes a parallel
batch is genuinely justified, it must (1) surface an `AskUserQuestion`
describing the proposed batch (count, per-agent scope, expected total
wall time); (2) wait for affirmative consent ("continue" / "proceed" /
"go ahead" / explicit `yes`; silence does not); (3) cap the granted
batch at the explicitly-named size (default 4 if the user says "parallel
ok"); subsequent rounds need fresh consent.

**Anti-parallel cases** (always sequential even with consent):

- Anything touching the same `.beans/${NAME}-queue.json` write (race).
- Anything touching the same exclusive build lock.
- Anything that depends on a prior step's output (rebase → validate,
  format → lint).
- Tasks where the user is mid-asking.

**Acceptable parallel-without-consent exceptions** (narrow):

- Multiple `Read` / `Grep` / `Bash`-inspection tool calls in a single
  response — these are not agent spawns.
- The §4b QA-specialist dispatch when reacting to an incoming event and
  the specialists are read-only — but if the dispatch would exceed 3
  agents, ask first.

**Default invariant:** in an idle window with K ≥ 2 independent tasks,
the watcher **picks the highest-priority one, works it
foreground-sequential, and ships before reaching for the next.** Batch
consent is the escape hatch, not the default.

## 6. Goal-driven invariants

Children fill **Slot I** with the domain's invariant checks. The parent
enforces this pattern: every invariant is checked before every
own-branch commit; failure blocks the commit, queues the violation as
`critical`, and asks the author.

## 7. Output style

- One line per event when nothing changed (`<sha>  no <domain> scope`).
- A short structured block when findings exist:

  ```
  <source> <sha> — <msg>
    findings: N critical, N major
    discharged: N  asked: N  deferred: N
    queue: M (K in-progress)
  ```
- An author ask when escalating (see §4e).
- End-of-session: tail of the ledger + queue stats.

## 8. Integration

- **Built on**: `local/watch` (Monitor scaffolding), `local/coordinate`
  (PR triage helpers).
- **Dispatches**: see each child's Slot C.
- **Produces**: `.beans/${NAME}-queue.json` (live state) +
  `.beans/${NAME}-ledger.md` (event log).
- **Complements** other watchers — each owns one axis. Coordinate via
  `/coordinate` if the user is running more than one.

## 9. Role gating

- **reader**: may run in audit-only mode (queue + ask; no edits, no
  commits, no PR comments).
- **collaborator**: may auto-discharge Auto-discharge band findings, may
  commit on this branch, may post asks on PRs.
- **owner**: same as collaborator plus may commit to main when
  explicitly requested (still requires per-commit user approval per
  AGENTS.md "Executing actions with care").

## Anti-patterns (shared across all children)

- ❌ Re-implement scanner/analyser logic here. Always delegate to
  existing specialists / scripts.
- ❌ Subscribe to **every** open PR. Only last-7-day-active set + own PR
  + newly-opened (per TICK).
- ❌ Open > 1 ask per round on the same block. Batch findings.
- ❌ Edit `.ts` manifests to add a `status:` field (status is derived).
- ❌ Touch protected files (the deployment whitelist files, etc.).
- ❌ Hand-edit witness JSON to "fix" drift.
- ❌ Auto-merge a PR without explicit author approval.

Children add their own domain-specific anti-patterns.

## Checklist (shared across all children)

- [ ] Queue + ledger initialised under `.beans/`
- [ ] Main baseline SHA stashed
- [ ] Monitor armed on `origin/main` with TICK heartbeat
- [ ] Subscribed to own PR + every sibling PR active in 7 days
- [ ] Auto-subscribe on every TICK for newly-opened PRs
- [ ] Per-event pipeline delegates to specialists in parallel
- [ ] Auto-discharge band uses scanner-verified mechanical fixes
- [ ] Author asks are one-per-block, batched per round
- [ ] Backlog sweep prioritised per Slot H
- [ ] Invariants checked before every own-branch commit
- [ ] GitHub blob URLs (`.md` first) included in every author ask
- [ ] Prepared PRs followed up per §5g (subscribe + copilot review +
      merge prompt)
- [ ] Voice sweep applied or noted n/a on every prepared PR before merge
      prompt (§5h)
