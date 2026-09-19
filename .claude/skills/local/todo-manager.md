# todo-manager — see `skills/folio-core/`

**This is a stub. The skill lives in the `kg` graph, not here.**

`skill_fetch("todo-manager")` serves
[`skills/folio-core/todo-manager.md`](../../../skills/folio-core/todo-manager.md)
— `LOCAL_PACKAGES` in `src/tools/skill-fetch.ts` holds `skills/folio-core` and
no `.claude/skills/local` entry — so that file is what an agent asking for this
skill by name has always received.

A 369-line hand-authored copy sat here until 2026-09-19 and diverged from the
servable one by 261 diff lines. It was **not** servable, carried no front
matter, and lacked `## Check before you create` — the STRICT rule that exists
because an unguarded `beans create` produced 14,688 duplicate beans. Meanwhile
the onboarding guide, in five languages, pointed here as the "full discipline".
Four rules it carried and the servable copy did not were ported across first;
nothing was dropped. Bean `tdmg`.

The skill is now three, because the one file had grown to 396 lines against a
400-line ceiling while carrying three separable disciplines:

| skill | what it governs |
|---|---|
| [`todo-manager`](../../../skills/folio-core/todo-manager.md) | bean mechanics: the CLI, the STRICT check before `beans create`, the fallback when the CLI is absent, the status vocabulary, coordination |
| [`opening-brief`](../../../skills/folio-core/opening-brief.md) | what you say **before** starting a bean or a topic |
| [`turn-reporting`](../../../skills/folio-core/turn-reporting.md) | what you say **during and after** each turn, including the STRICT "next"-line rule |

Same discipline as `CLAUDE.md` and `GEMINI.md`: one source of truth, thin
pointers to it. Do not re-add content here — edit the skill.
