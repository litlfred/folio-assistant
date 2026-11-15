---
# note on folio-assistant-ho66 from claude/lucid-shannon-o8zop1
$schema: folio-bean-note/v1
bean: folio-assistant-ho66
branch: "claude/lucid-shannon-o8zop1"
created: "2026-10-03"
---
## Standalone rehearsal measured: 469 / 12 failing, discovery misses 2 / 1

Measured 2026-10-03 ~08:40Z by the Parcel B session (https://claude.ai/code/session_01SmeBn6QZsDFaNQ4GtuC2sd). I ran `seed:ready --layer <L> --rehearse --text` from #1896's branch (head 705085e, level with main). It is read-only: the layer is copied into a scratch directory, and nothing is seeded, pushed or commented.

## Verdict: "Ready to seed?" → not yet, for both layers

| criterion | cat-harness | cat-harness-tools | kind |
|---|---|---|---|
| heavy movers open | 2 (#1764, #1801) | 2 | queue |
| open PRs touching the next layer | 5 | 19 | queue |
| open PRs touching the layer | 33 | 5 | queue |
| open PRs renaming or deleting in it | 4 | 0 | queue |
| **green standing alone, as sibling clones** | **469 failing tests** | **12 failing tests** | **structural (this bean)** |
| **discovery with no aggregate root** | **misses 2:** cat-harness-tools, folio-assistant-core | **misses 1:** folio-assistant-core | **structural** |

The queue rows clear as PRs merge. The two structural rows do not: they are this bean's work, and `ybsz`'s.

## What the 469 look like (first ten the rehearsal printed)
Many assert facts about the WHOLE repository, which a standalone cat-harness can't see. Examples:
- "every declaration in this repository is a Knowledge Graph declaration";
- "who-iris's own theme resolves by reference";
- "a catalogued IRIS item expands to its Handle IRI";
- "livesAt matches where each instance actually sits".
Others need a corpus that lives in another layer: "there are descriptors to check", "PROPERTY_SKILLS > every skill named exists". So the fix is mostly scoping: a test either runs against its own layer's corpus, or it moves to the layer that holds the subject. It is not a matter of loosening assertions.

## cat-harness-tools' 12
These include:
- "this instance's own kinds > every declared validator resolves";
- "instance-qualified references (bean quda)";
- "instanceRootsIn > finds EVERY instance of THIS repository";
- "materialiseDirectories > this instance declares uploads, and reaches a library";
- "a directory declares the theme it renders on".

## Discovery
In a sibling layout with no aggregate root, discovery cannot find the instances that need a layer directly. The rehearsal expects to find cat-harness-tools and folio-assistant-core beside cat-harness, and finds neither. #1896's handover first flagged this ("sibling discovery misses 2 and 1"). It is unchanged.
