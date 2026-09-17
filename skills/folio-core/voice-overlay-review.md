---
name: voice-overlay-review
description: >
  Reviews content blocks against active voice profiles loaded from
  folio.config.json. Layers voice-specific editorial rules on top of
  the base one-voice scholarly standard. Each voice contributes
  terminology, spelling, formatting, and structural rules that the
  reviewer checks sequentially.
roles: [reader, collaborator, owner]
triggers:
  - "voice review"
  - "check voice"
  - "who style"
  - "editorial style"
  - "voice overlay"
allowed-tools: Read Edit Bash Grep Glob
---

# Voice Overlay Review

> **Relationship to one-voice-audit.** The base `one-voice-audit` enforces
> the project-wide scholarly standard (status leaks, emoji, AI slop, etc.).
> This skill **layers on top**: it loads the folio's active voice profiles
> from `folio.config.json` → `voices.active[]` and checks each block
> against the union of those voices' rules. If no voices are active,
> this skill is a no-op — the base audit is sufficient.

## When to use

- As a sub-pass of `editor` when the folio has active voices.
- Before `prepare-merge` on any branch.
- On demand: "check WHO style", "voice review", "editorial style check".
- Driven by `one-voice-integration-watcher` for continuous review.

## How voices work

### 1. Voice profiles are data, not code

Each voice is a JSON file under `voices/` (in the platform) or
`voices/` (in the folio repo, for custom voices). A voice profile
contains:

- **`id`** — stable identifier (e.g. `who-editorial`)
- **`name`** — human-readable name
- **`description`** — what this voice is and where it comes from
- **`sources`** — the documents this voice is derived from
- **`rules[]`** — the editorial rules this voice adds
- **`appliesTo[]`** — optional block-kind filter
- **`criteria[]`** — QA criterion IDs this voice contributes

### 2. Rules have categories

| Category | What it governs | Example |
|----------|----------------|----------|
| `spelling` | Orthographic conventions | British vs American English |
| `punctuation` | Comma, period, dash rules | No Oxford comma, no period after titles |
| `terminology` | Preferred/prohibited terms | People-first language, GRADE terminology |
| `citation` | Reference formatting | NLM/Vancouver style |
| `person` | Narrative person/voice | First-person plural "we" |
| `register` | Tone and formality | Economy, concreteness |
| `structure` | Structural conventions | Recommendation phrasing, section ordering |
| `formatting` | Visual/typographic rules | Number formatting, date format |
| `accessibility` | Accessibility requirements | Alt text, reading order |
| `methodology` | Methodological conventions | GRADE framework, systematic review language |

### 3. Rules can carry automated patterns

A rule's `patterns[]` array holds regex patterns for automated checking.
A rule's `terminology[]` array holds correct/incorrect term pairs.
Both are checked mechanically by the QA sweep; rules without patterns
are checked by agent review.

## Workflow

### 1. Load active voices

```bash
# Read folio.config.json → voices.active[]
VOICES=$(jq -r '.voices.active[]?' folio.config.json 2>/dev/null)
if [ -z "$VOICES" ]; then
  echo "No active voices — base one-voice audit is sufficient."
  exit 0
fi
```

### 2. For each active voice, load its profile

Look up `voices/<id>.json` in the platform first, then in the folio repo.
Merge all rules from all active voices into a single rule set.

### 3. Check each block against voice rules

For each content block under review:

1. **Filter by `appliesTo`** — skip if the block's kind is not in the
   voice's scope.
2. **Terminology check** — scan the block's `.md` for any `incorrect`
   terms from the voice's `terminology[]` entries.
3. **Pattern check** — run each rule's `patterns[]` against the block.
4. **Structural check** — for rules in `structure` / `methodology`
   categories, assess whether the block follows the convention
   (agent-judged, not grep-based).

### 4. Report findings

For each finding:
- Write to the block's `<block>.qa.json` sidecar.
- Criterion ID: the voice's criterion from `criteria[]`, or
  `voice-<voice-id>-<rule-id>` as fallback.
- Reviewer: `{ kind: "agent", id: "voice-overlay-review" }`.

### 5. Triage and fix

| Band | Examples |
|------|----------|
| **Auto-discharge** | Spelling corrections (British → American), punctuation fixes, simple terminology swaps |
| **Author-assist** | Structural rewrites, methodology compliance, complex terminology choices |
| **Defer** | Rules where the voice conflicts with folio-specific conventions |

## Voice conflict resolution

When two active voices have conflicting rules:
1. **More specific wins.** A voice scoped to `['definition']` wins over
   one scoped to all kinds, for definition blocks.
2. **Higher severity wins.** A `critical` rule overrides a `minor` one.
3. **Ask the author.** If neither rule is clearly more specific or more
   severe, escalate via the standard author-ask protocol.

## Cross-references

- [`one-voice-audit`](one-voice-audit.md) — the base scholarly audit.
- [`one-voice-style-guide`](one-voice-style-guide.md) — the base voice profile.
- [`one-voice-integration-watcher`](one-voice-integration-watcher.md) — drives both.
- `voices/*.json` — the voice profile definitions.
- `schemas/voices.ts` — the voice profile TypeScript schema.
