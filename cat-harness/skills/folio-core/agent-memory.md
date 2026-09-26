---
name: agent-memory
description: >
  Durable memory for a subagent — the three entry labels and what each promises,
  why entries are authored as graph nodes rather than in the generated file, the
  injection budget that silently truncates, and archiving as the third state
  between "reaches everybody" and "deleted".
adapters: [document, paper, dak]
profiles: [document, paper]
consulted: true
graph-kinds:
  - memory
  - waiver
---

# Subagent memory — what a durable entry may claim

A subagent declaring project memory gets its own directory; the first **200
lines (or 25 KB)** of that directory's `MEMORY.md` are injected into its system
prompt at start, and it reads and writes the directory as it works.

**Maintaining it is part of the work, not a chore after it.** A session that
establishes a durable fact in an agent's area adds it in the same change; a
session that re-measures a number updates the entry with the fresh value and
date. **A memory file that only accretes becomes the thing it exists to
prevent.**

## Every entry carries exactly one of three labels

| label | what it promises |
|---|---|
| **STABLE** | a path, a command, a rule. Trustworthy as written. |
| **TRAP** | a specific way the task goes wrong, **with the evidence that established it**. |
| **BASELINE** | a measured number, stored with the command that produced it and the date, **and never quoted as a current answer**. |

**TRAP is the reason to have memory at all.** Every genericity failure a project
pays for was paid for once; a TRAP is what stops it being paid for twice. An
entry that merely restates a rule is STABLE — a trap needs the incident.

**A `baseline` with no measurement is refused by the schema**, and that rule bit
immediately and correctly the first time it was structural rather than prose:
all three entries labelled BASELINE stored no number — they were *tables of
commands to run*. **A table of how to measure is a stable fact, not a
measurement**, and they were relabelled. A watcher whose subject is a live
signal should hold no such numbers at all, because every one of them goes stale
by design.

## Entries are authored as nodes; the file is generated

**Edit the node, then assemble.** One entry per file, each declaring its own
`$schema`, a label, a summary, and the agents it reaches. The assembly check
gates it, so **an entry edited and never assembled fails the build** rather than
quietly never reaching the agent.

**One entry can reach several agents, and that is the point.** Before this, a
fact two agents needed had to be written into two files — measured here, three
subject areas were.

**The generated file is written only between its markers**, exactly as the
README sync is. That is what keeps each file's hand-written session log intact:
those are the agent's own running notes, and a whole-file regenerator deletes
them. A file with no markers is reported as *not opted in*, left alone, and
never counted as up to date.

## The budget truncates silently, so it is checked two ways

**Keep the injected file under the line budget.** The harness drops the
overflow without saying so — the generated file still reads perfectly well
without the part the agent never saw.

Checking entry *headings* against the budget is not enough, and the gap is
worse than the one it catches. After evidence moved into detail files, one
region ended nine lines past the cut while its last entry's **heading** sat
comfortably inside — and a heading-position check returned nothing. **A
truncated entry is worse than a dropped one, because it still looks complete to
the agent reading it.** Check both: an entry whose heading falls past the
budget, and a region whose *end* does.

An entry too long to fit declares its evidence as **detail**, split at a body
marker and written beside the injected file — and **pruned** when the entry
stops declaring one, so a stale detail file cannot outlive the claim it
supported.

## Archiving is the third state, and the check order is load-bearing

Retiring an agent **archives its memory; it does not delete it.** An archived
entry is a node of the graph that reaches no agent's prompt — the state between
*untagged, so reaches everybody* and *gone*. When one agent here was retired,
seven of its twelve entries had no other reader, two of them traps written by
other sessions, and the only remaining agent with a related subject was already
at 189 of its 200 lines. Deleting them would have thrown away work somebody else
paid for. **Same discipline as a scrapped work item.**

**Archived must be checked BEFORE the untagged rule.** An archived entry has no
agent tag once its agent is gone, so checking it second hands it to *every*
agent — the exact opposite of archiving. Measured while doing precisely that:
two entries went untagged, pushed an agent 39 lines over budget, and dropped one
of its own traps past the line the harness truncates at.

**Do not re-home an entry into an agent that does not own the subject.** Budget
is not the constraint — a detail split makes room. The constraint is that
forcing a fact into an unrelated lane is the *invent a role to absorb a tool*
failure the reachability criteria exist not to force. Archive it, record why,
and say what would justify un-archiving it.

## Scoping: by agent today, by role eventually

Memory is knowledge, and knowledge belongs to the lane — so it should scope by
**role**. Generation still goes through the agent axis, which means **tagging a
lane is additive and changes no generated byte.** Keep it that way: wiring the
two axes together is the composition mistake the role model already paid for
once.

Two things worth knowing before you add an entry. A CI watcher is a *mechanical*
role — judgement-free, which is what makes a system lane the correct home rather
than a convenient one — while a guard that exercises judgement is not settled by
the same argument, because judgement is the one thing a system lane excludes.
And measured after the lanes were tagged here, **every live entry carries one**,
so the "untagged reaches everybody" escape hatch currently has no instances: an
untagged entry added now goes to every agent in a corpus where nothing else
does.

## A memory entry never outranks a skill

The agents defer to `skills/` as the source of truth. **Memory summarises; the
skill governs. Where the two disagree, the skill wins and the memory entry is
wrong — fix it.**

## The instance's two declared assets are maintained here too

`README.md` and `AGENTS.md` are not documentation somebody else owns. They are
**declared assets with a declared purpose**, and the owner put their upkeep in
this skill (2026-09-20, issue #592):

> it is an asset and has a defined purpose (that is part of skills of mantiaing
> agent memroies)

| role | purpose | layer | delivery |
|---|---|---|---|
| `instance-readme` | what the instance **is**, for a reader | `context` | read as a file |
| `agent-instructions` | what a cold agent **does** here, in order | `context` | read as a file |
| agent memory | durable facts an agent must have without asking | `context` | **injected** |

**This table is DECLARED, not described.** All three columns are `ASSET_ROLES`
in `schemas/cat-harness.ts` — one record of objects, per ROLE, never per asset.
Per asset would be eleven instances each spelling out what `instance-readme` is
for and the eleventh saying something slightly different; three parallel
`Record<string, …>` maps would be the same failure one level up, where a role
gains a purpose and no layer and reads as governed anyway. `layer` and
`delivery` are **required** on `AssetRoleDef`, so a new role decides them at the
keyboard rather than at CI.

**The layer column is why a step writing one of these is a defect rather than
an update.** The owner, on issue #592: *"its static content at process runtime
and treated as an asset like memories"* — which is `context` word for word, and
the same layer agent memory holds, which is what *"like memories"* asks for.
`processMayWriteAsset(role)` answers it, through the same `layerIsWritable`
rule the graph kinds use: assets and directories cannot come to disagree about
what `context` permits, because there is one rule and not two spellings of
`=== "state"`. For a role this layer does not govern it returns `undefined` —
the third state, and never to be read as permission.

**The delivery column is mechanical rather than a matter of taste.** Memory is
spliced into a prompt, so it pays a budget — `MEMORY.md`'s first 200 lines,
*with the overflow dropped silently*. A file is opened, so nothing truncates
it. That is why `AGENTS.md` may be long and an entry here may not, and why a
fact that must arrive unasked belongs here rather than there. It is asserted
rather than stated: `asset-roles.test.ts` measures this repository's own
`AGENTS.md` past the 200-line budget, which is legal *only* because its
delivery is `file` — switch the role to `injected` and the test says so before
a reader finds out by losing half the file.

**`AGENTS.md` augments the README; it never restates it.**

> agents.md should give good coldstart instructions (dont duplicatae readme.md)
> but augment.

So the split is by question, not by audience: the README answers *what is
this*, `AGENTS.md` answers *what do I do, in what order*. A session that
establishes a durable fact about an instance updates the one whose question it
answers — and if it answers neither, it is a memory entry.

`bun run check:subgraph-coverage` reports any instance missing either asset,
and `bun run check:asset-roles` keeps the declaration single: a required role
`ASSET_ROLES` does not govern, a role a running process would be allowed to
write, or an asset restating `purpose`, `layer` or `delivery` on itself. That
last one is asked of the RAW declaration on purpose — `KgAssetSchema` is a
non-strict `z.object` and drops an unknown key without a word, so after
parsing the evidence is gone. It has happened: a `purpose` written into
`cat-harness/cat-harness.json` read as if it carried one and no consumer ever saw
it, which is worse than absent because absent is visible.
Both are required of every instance: one with a README and no `AGENTS.md` is
readable by a person and mute to an agent, and the reverse leaves a reader
following instructions with nothing saying what they are in.
