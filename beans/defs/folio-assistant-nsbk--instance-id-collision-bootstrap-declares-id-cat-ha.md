---
# folio-assistant-nsbk
title: 'INSTANCE ID COLLISION: bootstrap declares id ''cat-harness'' too, so its 5 skills are dropped from the overlay and unreachable'
status: todo
type: bug
priority: high
created_at: 2026-09-22T13:54:27Z
updated_at: 2026-09-22T13:54:53Z
parent: folio-assistant-1swy
---

_2026-09-22T14:00:00Z_ — Found while fixing `oe98`'s dead links. `oe98` went 262 non-resolving → 5, and the last 5 would not move. They are not a link defect at all; they are the visible edge of this.

## The collision

Two instances declare a directory with the **same id**:

    root instance   cat-harness.json   id "cat-harness"      -> skills/      => cat-harness/skills
    bootstrap       bootstrap.json     id "cat-harness"      -> skills/      => bootstrap/skills

`AGENTS.md` states the override rule outright and it is correct as designed:

> **Overrides match on the entry's `id`, not its `path`** — matching on path makes two knowledge graphs out of one relocation, and every consumer then scans a directory that is not there.

So the root's entry wins and **`bootstrap/skills` is dropped from the overlay entirely.** The mechanism is working as specified. The accident is that two unrelated directories were given one id.

Measured:

    kgDirectories(cat-harness)  ->  cat-harness -> /home/user/folio-assistant/cat-harness/skills
                                    (bootstrap/skills appears nowhere)
    skillMdDirs(cat-harness)    ->  18 dirs; the only bootstrap entry is ../bootstrap/tools

## What it costs, and one of the costs is a false claim in `AGENTS.md`

**Five real skills are unreachable.** `bootstrap/skills/` holds `bootstrap-kg-navigation.md`, `confirm-harness.md`, `discussion.md`, `log-message.md` and `root-readme.md`. They are present, current, and invisible to `skill_list` and `skill_fetch`.

That contradicts the banner in `AGENTS.md`:

> **A dependency's skills ARE reachable** — `resolveSkillDirs` … computes the cross-instance overlay and `LOCAL_PACKAGES` … is built from it, so `skill_list` and `skill_fetch` serve a dependency's packages. This entry said the opposite until 2026-09-19 — *"no caller … not yet reachable"* — and a stale gap notice is worse than none.

The general claim is right and the mechanism exists. **It is false for `bootstrap` specifically**, for this one reason, and the banner's own argument applies to itself: an agent that believes a dependency's skills are reachable will not go looking when bootstrap's are missing.

**Five orphaned pages on the published site.** `docs/reference/skill-instructions/` still carries a page for each — written when the directory was still discovered, never regenerated since (mtime 06:05, hours older than every sibling), and never pruned. They are the 5 pages `oe98` cannot fix: their `../bootstrap/skills` prefix comes from `skillMdDirs` returning a path that climbs out of the instance, and no live group produces them any more.

**The generator cannot see this.** `gen-skill-docs.ts` guards *collisions* — two groups claiming one published name, which it fails the run over, writing mode included, on the stated reasoning that *"dropping a document is not a staleness problem that a re-run fixes"*. It has no equivalent for the inverse: a page it no longer produces. `--check` compares what the generator writes against what is committed, so a file it never writes is outside the comparison entirely.

## Why it is filed rather than fixed

Renaming a declared id is a **cross-instance** change. The id is the override key, so changing either side alters what every consumer resolves, and `bootstrap` is the floor of the stack — `AGENTS.md` calls it *"what the stack rests on"*. Which side should be renamed, and to what, is a judgement about the instance naming scheme rather than a defect with one correct repair. Doing it on an agent's own initiative is exactly the speculative change this repository forbids.

Note that the SAME pair collides harmlessly on a second id: both declare `bootstrap-render`, root as `bootstrap/tools/` and bootstrap as `tools/`, which resolve to the same directory. So the override does the right thing there. That is worth knowing before anyone "fixes" the mechanism rather than the names.

## Done when

- [ ] Whichever id is renamed, it is the owner's call — and the other instances are checked for the same shape rather than this one pair being fixed in isolation
- [ ] `bootstrap/skills`' five skills are reachable by `skill_list` / `skill_fetch`, verified by asking for one by name rather than by reading the resolver
- [ ] The five orphaned pages regenerate with resolving links, OR are removed with the owner's confirmation — never deleted on an agent's initiative
- [ ] `gen-skill-docs.ts` reports a page it no longer owns, the way it already reports a dropped document. Byte-comparison structurally cannot see an unwritten file
- [ ] `AGENTS.md`'s "a dependency's skills ARE reachable" is re-checked against bootstrap specifically, since the banner's own history is about a stale claim in that exact sentence
