---
# folio-assistant-26tu
title: 'DECLARED-BUT-ABSENT: agent-skills declares a voices graph at voices/ and ships none, now also on the old path'
status: completed
type: task
priority: normal
created_at: 2026-09-21T16:55:33Z
updated_at: 2026-09-22T06:37:51Z
parent: folio-assistant-vuip
---

Pre-existing, surfaced while migrating voices to <stub>/skills/voices (bean btuv).

agent-skills/agent-skills.config.json declares id=voices path=voices/ and agent-skills/voices/ does not exist. That is the dh4f defect: a consumer scans nothing and reports a clean run over it.

Left ALONE deliberately rather than removed. The entry's description states real intent — 'a shared base plus one override per vendor, on the owner's ruling of 2026-09-20' — so it is a declaration ahead of content, not an accident, and deleting another instance's roadmap is not a migration decision.

Two things are now true of it at once: the directory is absent, and the path names the PRE-migration layout while who-style-guide and folio-assistant-sci have moved to skills/voices/.

## Done when

- agent-skills either ships its voices at skills/voices/ or drops the declaration until it does;
- whichever way, the path matches the convention the other instances now use.


## 2026-09-21 — the PATH is realigned; ship-or-drop is still open

`agent-skills.json` declared `path: "voices/"`, the pre-migration layout,
while `who-style-guide` and `folio-assistant-sci` moved to `skills/voices/`
because a voice IS a skill (bean `btuv`). Now `skills/voices/`.

**This closes the second `Done when`, not the first.** The directory is still
absent either way — realigning it only means that when the voices arrive they
land where every consumer already looks, instead of at a path the convention
has left behind. The declaration's own description says the entry is
deliberate, roadmap ahead of content, so dropping it is this instance's call
and not a migration decision (`deletion-requires-confirmation`).

Visible in the voices viewer as `agent-skills  agent-skills/skills/voices
DECLARED BUT ABSENT` — the `dh4f` state reported rather than smoothed over.

- [ ] agent-skills either ships its voices at `skills/voices/` or drops the
      declaration until it does — **the owner's**
- [x] whichever way, the path matches the convention the other instances use

## Settled — owner, 2026-09-22: SHIP the base voice

Chosen over dropping the declaration, shipping base + vendor overrides
together, and leaving it absent.

### `agent-skill-authoring`, 12 rules, `provenance: evidence`

At `agent-skills/skills/voices/agent-skill-authoring/voice.json`. A bare
`folio-voice/v1` profile, not a voice skill: the owner's 2026-09-20 ruling
keeps these rules unstructured — *"preference leave unstructured schema,
agentic review b/c of best practice drift, not formal"* — so there are no
patterns, no terminology pairs and no schema gate over them.

**It is the corpus's first `evidence` voice.** That value had no member
anywhere, and its gloss names by title the very paper two of these rules cite
("an arXiv paper reporting what 138,000 SKILL.md files actually contain").
Settling `iy1n` is what made the value mean "the rules are cited"; this is what
made it non-empty.

Every one of the 12 quotes was verified verbatim against the ingested section
file before the voice was written — 12 checked, 0 misses — rather than
transcribed from a reading.

### Vendor overrides

Owner, same day: *"vendor overides go in sub-sub-grahiphs like voice/vendors or
voices-vendors"*. The reserved `vendors/` subdirectory inside this same
declared graph, with each override naming this voice in its `extends` field.
`voiceFilesIn` had to learn to descend — it scanned one level and would have
skipped every override in silence. See `directory-conventions.md`
§"A sub-sub-graph".

### Three consequences of shipping, all real

1. The DECLARED-BUT-ABSENT row is gone from the voices viewer.
2. `handler:index` and `docs:harness` needed regenerating — agent-skills now
   publishes a voices graph.
3. A test asserted *"at least one declared directory is absent today"* and went
   red. Its own comment had named the hazard: closing the gap and a reader that
   DROPS absent directories look identical from the corpus. Rewritten around a
   FIXTURE (an instance declaring a directory that is not there), plus a second
   assertion that every declared directory is accounted for — so it tests the
   reader rather than the defect, and nothing can make it vacuous.

## Done when

- [x] agent-skills ships its voices at `skills/voices/`
- [x] the path matches the convention the other instances use
