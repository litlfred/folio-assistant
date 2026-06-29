---
layout: default
title: /detangler-integration-watcher
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/detangler-integration-watcher.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/detangler-integration-watcher.md) — do not edit here.

{% raw %}
# /detangler-integration-watcher

A concrete instance of `local/integration-watcher`. The parent encodes
the shared mechanics. This file fills the nine domain-specific slots A–I.

**Setup:** use `NAME=detangler-integration-watcher` everywhere the
parent's §1 references `${NAME}`. Files at
`.beans/detangler-integration-watcher-queue.json` and
`.beans/detangler-integration-watcher-ledger.md`.

**Additional baseline cache.** Beyond the parent's §1 setup, cache a
graph baseline so per-event deltas are comparable:

```bash
( cd content && python3 pipeline/content-graph-analysis.py --json ) \
  > /tmp/_detangler_watcher_graph_baseline.json 2>/dev/null
```

Refresh after a clean event (see Slot D).

## Slot A — Goal statement

Zero new logical forward references on landing commits (**excluding
refs sourced from preview chapters — see below**), no section pushed
out of the block-count band, no new cross-chapter forward edges, no new
topic-mixed blocks, and the reorganization map updated alongside every
move. The section graph trends toward lower energy. Forward edges that
exist for architectural reasons (deliberate cross-chapter callbacks) are
accepted and recorded as `wontfix: architectural`.

### Preview-chapter exclusion (STRICT)

Forward references whose **source** lives in a *preview chapter* are
info-only — never findings, never invariant violations. Preview chapters
preview future material (an introduction motivates the work) or are
reference lookups (a notation/symbol index); forward refs from them are
the expected reading pattern. Maintain the preview list per project
(default: introduction, notation). Apply the filter in Slots B, C, D, I.

### Story coherence (STRICT)

**Detanglement is not just edge counting.** Every section and every
chapter must tell **a single coherent story** — a narrative arc that
motivates the blocks inside and connects to the surrounding sections /
chapters. Sections that are *collections of blocks sharing keywords* but
not a narrative are tangle by another name. The watcher enforces:

1. **Each section has its own story.** Its title names the story (and
   the label must not be generic — see `generic-section-name`); its
   first block is a `prose` lead establishing what the section is about,
   what the reader just left, and a one-sentence preview of what comes
   next (non-binding — no forward `uses[]` required). Block ordering
   follows the story (definitions → propositions → proofs → remarks /
   examples), not authoring order.

   **Lead length scales with section size:**

   | Section size (non-prose blocks) | Lead length |
   |---|---|
   | ≤ 5 | 1 paragraph |
   | 6 – 12 | 2 paragraphs |
   | 13 – 20 | 3 paragraphs |
   | > 20 | 4 paragraphs |

   Each paragraph plays a distinct role; don't pad with restated
   content. **Lecturer-opening cadence** ("The previous section gave us
   X. The question this section settles is Y. The first move is Z."),
   not a list of block titles. When drafting leads at scale, rotate among
   many opener patterns (≥ 30 across ≥ 5 categories is the floor); drafts
   that all open the same way are a story violation.

2. **Each chapter has its own story.** Its first section (or first prose
   block) frames what the chapter establishes, states its dependencies
   on earlier chapters (named, not just by `uses[]`), and outlines the
   sections in narrative order. The last section/block closes the loop.

**Story-missing is a finding, not a `wontfix`.** When dispatching a
split, the watcher **must** produce a draft story for each new section
(Slot F template); the author approves the story along with the split.
Renaming a section is story-changing — record old → new name AND the new
story summary in the reorganization map.

## Slot B — §3 trigger filter

For a default-branch or PR commit event, mark it structural when the
diff (with `git diff-tree -M` rename detection) touches: a paper or
nested chapter manifest; a block manifest's graph-topology fields
(`uses` / `interprets` / `proofs` / `examples` / `kind` / `label` /
`defines` / `tags`); a new `.ts` block (A-status); or a block rename
(R-status). If a structural change lands without updating the
reorganization map in the same commit, set `reorg_map_stale` (a finding,
not a skip). For PR review-comment events, pass through if the comment
mentions forward ref, section, reorder, split, merge, move, topic,
dense, sparse, or cites a content-block label.

## Slot C — §4b dispatch table

| Specialist | When to run | What it checks |
|------------|-------------|----------------|
| `content-graph` (analysis + proposals) | **always** | forward-ref / cross-chapter / sparse / dense / coupling / isolated heuristics; split/merge/move/reverse proposals |
| `chapter-complexity-review` | a chapter manifest changed, OR ≥ 1 block's `uses[]` changed within a chapter | graph-energy delta + optimal section ordering |
| `block-density` | a block `.md` was edited/added/renamed | single-topic, length limit, embedded-table extraction |
| `critical-path-analysis` | a provable block's `uses[]` changed | whether the change breaks a logical chain |
| `content-validation` | always | schema constraint rules |

Launch the parallel calls in a single response with multiple `Agent`
tool uses. Cap each agent's report at ~400 words. After dispatch,
compute the delta against the cached baseline (counts derive from the
analysis tool's `findings[]` array — it does not export summary
scalars). If the event is clean, promote the snapshot to baseline.

## Slot D — §4c finding taxonomy

| Finding | Severity | Description |
|---------|----------|-------------|
| `uses-resolve-broken` | critical | `uses[]` cites a missing target |
| `critical-path-break` | critical | a move/removal broke a logical chain reaching a downstream provable |
| `cross-chapter-forward` | critical | a new forward cross-chapter edge to a non-existent block |
| `defterm-undeclared` | critical | a new reference-directive with no matching `defines` |
| `forward-ref` | major | a new **logical** forward reference (span > 3 OR cross-section); only logical edges count (see severity gate) |
| `dense-section` | major | section pushed over the upper block-count band |
| `sparse-section` | major | section dropped below the lower band (excludes intro/overview) |
| `topic-mixing` | major | a block violates the single-topic rule |
| `placement-violation` | major | a block in the wrong chapter / with a forward dep / density overrun / cross-chapter forward |
| `reorg-map-stale` | major | structural change without updating the reorganization map |
| `oversized-block` | minor | a block exceeds the length limit without topic-mixing |
| `embedded-table` | minor | a block embeds a large table — extract to a `table` block |
| `intra-chapter-energy` | minor | graph energy rose without a new forward-ref finding (room to reorder) |
| `cross-section-coupling` | minor | a new edge crossing many sections |
| `isolated-block` | minor | a block with no incoming or outgoing edges |
| `missing-section-story` | major | a section has no opening prose AND blocks aren't narratively ordered — a *collection*, not a *story* |
| `section-lead-too-short` | minor | a large section's opening lead doesn't scale to it |
| `section-lead-block-title-list` | minor | a lead lists block titles instead of motivating — a mechanical-generation tell |
| `generic-section-name` | major | a section label matches a generic pattern (`*-part-N`, `*-extras`, `misc-N`) — split without a story-naming step |
| `missing-chapter-intro` | major | a chapter has no opening narrative section/block |
| `abrupt-chapter-ending` | minor | a chapter's last section ends without a closing prose block |
| `section-narrative-drift` | minor | block ordering within a section isn't narrative-coherent |
| `remark-ratio` | info | the remark/example ratio drifted outside its band |
| `preview-source-fwd-ref` | info | a forward ref sourced from a preview chapter — info-only |

### Excluded forward-reference patterns (STRICT)

Three classes are **never** flagged as forward references even if the
target is later in source order:

1. **Statement → own proof.** A `prf:foo` block belongs *after* its
   statement `prop:foo`/`lem:foo`/`thm:foo`/`cor:foo` (including
   qualified-variant proof names) — this is the correct reading order.
2. **Preview-chapter source** — see the preview exclusion above
   (tagged `preview-source-fwd-ref` if surfaced, never escalated).
3. **Storytelling forward references.** A forward reference is a *defect*
   **only when the reader must RELY ON the target to follow the argument
   made here** — i.e. a **logical** forward reference (both source and
   target carry logical content AND the source builds on the target).
   References where the source is a narrative block, or merely *cites* a
   later table/diagram, are **storytelling** and never flagged;
   references into an appendix or a framing chapter are **structural**
   and never flagged. Run the project's forward-ref classifier on every
   `.ts` change; flag only NEW non-waived logical edges. The sanctioned
   logical forward references are the project's explicit
   `FOUNDATIONAL_LATE` allowlist (used-early / developed-late objects,
   each justified inline). Disposition of a logical-forward-ref finding —
   exactly three fixes: **promote** the target earlier; **demote to
   storytelling** (express as an `interprets`/narrative pointer, or
   invert/drop the often-backwards edge); or **add to
   `FOUNDATIONAL_LATE`** with justification.

When adding a new exclusion class, document the pattern, the
false-positive count it eliminates, and the filter location in the
analysis script.

## Slot E — §4d discharge bands

| Band | Examples |
|------|----------|
| **Auto-discharge** | `embedded-table` extraction; `intra-chapter-energy` where the fix is an **intra-section** block swap that resolves a span-1 forward edge AND no single-topic hit on either block AND the validator passes post-swap |
| **Author-assist** | section split (always paired with per-new-section story drafts), section merge, cross-chapter move, new section, topic-mixing split, `critical-path-break`, `reorg-map-stale`, `missing-section-story` / `generic-section-name` / `missing-chapter-intro` |
| **Defer** | architectural backward edge (`wontfix: architectural`); single-occurrence span-1 forward edge between adjacent sections; `isolated-block` flagged for a content pass; `remark-ratio` within ±20% of the band edge |

**Auto-discharge safety net (STRICT).** Every auto-discharge MUST: run
the validator post-edit and exit clean; re-snapshot the graph and verify
the forward-ref count didn't increase, no section left the band, and the
cross-chapter count didn't increase; **revert** and reclassify as
`needs-author` if any check fails. **Section merge is deliberately NOT
auto-discharge** — it renames labels and ripples through cross
-references; always escalate.

## Slot F — §4e author-ask templates

For `dense-section` — **the ask MUST carry a per-new-section story
draft**; a split without stories is not actionable. Propose a K-way
split (K chosen so each section lands in the band), each section with a
drafted 1-sentence narrative arc and block count, and offer: accept
as-drafted / approve splits but rewrite stories / re-split differently /
defer (mark deliberately dense). Provide analogous templates for
`missing-section-story` / `generic-section-name` (draft a 1-paragraph
story; offer accept / rewrite / rename / merge), `missing-chapter-intro`
(draft a 3-paragraph intro: framing, dependencies, outline; offer
accept / rewrite / reference-chapter wontfix), `sparse-section` (offer
merge-prev / merge-next / keep), `cross-chapter-forward` /
`placement-violation` (offer move-source / move-dep / architectural
wontfix), `critical-path-break` (offer bridge block / restore edge /
intentional-break escalation), and `reorg-map-stale` (offer append entry
now / defer to a larger PR / revert).

## Slot G — §5a backlog discovery

Run the full graph analysis with proposals and JSON; run the
block-density audit across every paper; list recent block renames not
yet reflected in the reorganization map. Convert each finding,
proposal, and density hit into a queue item with `source: backlog`.

## Slot H — §5b prioritisation

1. Severity — critical → major → minor → info.
2. Forward-ref span — chapter-span first, then large section-span, then
   small section-span last.
3. Downstream impact — count blocks transitively depending on the
   affected block via `uses[]`.
4. Section-density distance — farthest outside the band first.
5. Last-audit recency — older first.
6. Alphabetical tie-breaker.

## Slot I — §6 invariants

Every check derives from the post-edit graph + density snapshots
(`findings[]` array; no summary scalars):

| Invariant | Check |
|-----------|-------|
| Logical forward-ref count never increases on own-branch commits (excluding preview sources) | non-preview logical-edge count ≤ baseline |
| No section newly leaves the block-count band | if pre-edit in-band, post-edit in-band |
| Cross-chapter forward edges don't grow (excluding preview sources) | non-preview count ≤ baseline |
| No new topic-mix | density audit exits clean and the topic-mix count does not increase |
| Reorganization map updated alongside every block move | the move commit includes both the manifest AND the map |
| Schema clean | the validator exits 0 |
| No new `missing-section-story` | every newly-created section's first block is `prose` |
| No new `generic-section-name` | no new section label matches the generic pattern |
| No new `missing-chapter-intro` | every touched chapter without a prior intro gains one (prose at index 0, a dedicated intro section, a moved intro block) or is tagged reference-only |
| No new `section-narrative-drift` | within each touched section, ordering follows definitions → (proposition/lemma/theorem immediately followed by its proof)* → examples/remarks; each `interprets: X` block follows `X` |
| Reorganization map records new-section stories | a new section's map entry includes a 1-sentence story summary |

If any invariant fails on a proposed commit, **block the commit**, queue
the violation as `critical`, revert the working tree, and ask the
author (per parent §6).

## Domain-specific anti-patterns (extends parent)

- Auto-execute a section **split** or **merge** — both are judgement
  calls (new/removed labels, rippling cross-references); always escalate.
- Forget the reorganization map — enforced as a hard invariant.
- Discharge a finding downstream of a proof gap without consulting the
  proof watcher's queue — a `critical-path-break` may be a proof issue.
- Treat architectural backward edges as fixable — `wontfix:
  architectural` by design.
- Split a dense section without writing a story for each new section —
  the split is **not actionable** without per-new-section stories, and a
  `<source>-part-1`/`-part-2` split is a `generic-section-name` finding.
- Pretend a section/chapter without a story is fine — the edge metrics
  may pass while the narrative is incoherent; *detanglement is not edge
  counting*.
- Auto-fix a `missing-chapter-intro` without surfacing the draft — the
  arc is editorial, not mechanical.
{% endraw %}
