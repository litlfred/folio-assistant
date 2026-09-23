---
layout: default
title: KG navigation
nav_order: 43
lang: en
---

# kg-navigation

> The skill itself is [`skills/kg-navigation/kg-navigation.md`](../skills/kg-navigation/kg-navigation.md).
> This page was that package's README and AGENTS.md, moved here when it was
> folded into cat-harness (bean `byql`): a skill package holds skills only.

**How an agent finds the knowledge graph, and the skill that governs its task,
before it knows the layout.**

A skill package of the cat-harness knowledge graph. It was a top-level named
subgraph from 2026-09-20 to 2026-09-23 and was folded back in at the owner's
direction (bean `byql`) — see below.

## Two bodies, one subject — and that is not a bug to delete

The name `kg-navigation` was carried by **two different skills in two
instances** when this directory was made. Bootstrap's has since been renamed
`bootstrap-kg-navigation`, so the collision is gone; the reason for two bodies
is not:

| where | precondition |
|---|---|
| [`bootstrap/skills/bootstrap-kg-navigation.md`](../../bootstrap/skills/bootstrap-kg-navigation.md) | **nothing installed** — no MCP server, no `skill_fetch`, no `beans`, no build |
| [`kg-navigation.md`](../skills/kg-navigation/kg-navigation.md) | the tooling is reachable — the MCP pair, and the filesystem fallback |

The line counts that used to be in this table are gone: a count in prose is a
claim nothing checks, and both had already drifted.

They answer the same question under different preconditions, so neither is a
copy of the other and deleting either would leave a real case uncovered.
Bootstrap's **must** stay in bootstrap: it is phase one with nothing installed,
and a bootstrap that reached into another instance for its first skill would
fail in exactly the cold-start case it exists for.

What a named subgraph buys is that both can be **addressed** without either
shadowing the other. Before this, the tooled one lived inside the `folio-core`
package and the two were distinguishable only by path.

## Why it is a package under `cat-harness/skills/`, and was not for three days

From 2026-09-20 it was a top-level instance (`kg-navigation/`, with its own
`kg-navigation.json`). That instance declared no `needs`, so when bean `j79e`
gave `kg:detangle` a direction classifier, its edges could only be reported
as **undetermined**: nothing said which layer it sat in. The owner's ruling,
2026-09-23: *"Make them visualization of an existing harness"*, and of the
options, **fold into cat-harness**. Its layer is now cat-harness's.

**Why here, and not `cat-harness/kg-navigation/skills/`** — measured, not
argued. `skill_fetch` names a directly-held directory basenamed `skills`
after its INSTANCE, and a harness's only directly-held directory also takes
the instance name. Either placement would have served this package as
`cat-harness`. A subdirectory of the declared `skills/` graph takes its own
basename, as `folio-core` and `crdm` do.

The old argument against this location — *"a nested entry would be a
declaration inside a declaration"* (#263) — was about a SECOND declaration.
There is none now: `skills/` owns this directory like every other package.

## Known gap, and it predates this move

`bun run kg:audit` reports, in
`test/results/kg-qa/scenarios/kg.kg-qa.json`:

> no role carries `"kg-navigation"` and no activity names it — reached, if at
> all, by direct invocation.

and five findings in `bootstrap.kg-qa.json` of the form *"needs skill
`kg-navigation`, but its lane's role `onboarding-agent` does not carry it."*
So the bootstrap diagram asks for this skill five times and the role in that
lane does not have it. **This move does not fix that** — it is a role-graph
binding, not a location — and it is recorded here rather than left in a sidecar
because a finding nobody reads is a finding nobody fixes.

## For agents working on kg-navigation

This section was the package's `AGENTS.md`, moved here unchanged.

### If you are cold, read the skill, not the directory

Ask for it: `skill_list`, then `skill_fetch`. **Do not open a path under
`skills/` from memory.** The graph an instance declares is what resolves, and
a hardcoded path is how a skill goes missing the moment the layout moves —
which is the exact failure this layer is about.

### Two bodies, one subject. Do NOT delete one as a duplicate.

| where | precondition |
|---|---|
| [`bootstrap/skills/bootstrap-kg-navigation.md`](../../bootstrap/skills/bootstrap-kg-navigation.md) | **nothing installed** — no MCP server, no `skill_fetch`, no `beans`, no build |
| [`kg-navigation.md`](../skills/kg-navigation/kg-navigation.md) | the tooling is reachable — the MCP pair, and the filesystem fallback |

They answer the same question **under different preconditions**, so neither is
a copy of the other and merging them would leave one caller unable to run what
it was given. The name collision that made them look like duplicates is gone;
bootstrap's is now `bootstrap-kg-navigation`. The reason for two bodies is
not gone.

If you find yourself about to "consolidate" these, the question to answer
first is: **which precondition does the surviving body assume?** Whichever you
pick, the other caller is broken.

### Do not put a count in either body

Both carried line counts and both had drifted. A count in prose is a claim
nothing checks.
