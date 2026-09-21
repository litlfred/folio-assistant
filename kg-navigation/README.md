# kg-navigation

**How an agent finds the knowledge graph, and the skill that governs its task,
before it knows the layout.**

Staged as a top-level named subgraph ahead of the repository split
([#223](https://github.com/litlfred/folio-assistant/issues/223)), at the
owner's direction (2026-09-20), alongside
[`folio-assistant-core/`](../folio-assistant-core/README.md).

## Two bodies, one subject — and that is not a bug to delete

The name `kg-navigation` was carried by **two different skills in two
instances** when this directory was made. Bootstrap's has since been renamed
`bootstrap-kg-navigation`, so the collision is gone; the reason for two bodies
is not:

| where | precondition |
|---|---|
| [`bootstrap/skills/bootstrap-kg-navigation.md`](../bootstrap/skills/bootstrap-kg-navigation.md) | **nothing installed** — no MCP server, no `skill_fetch`, no `beans`, no build |
| [`skills/kg-navigation.md`](skills/kg-navigation.md) | the tooling is reachable — the MCP pair, and the filesystem fallback |

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

## Why top-level and not `cat-harness/skills/kg-navigation/`

`skills/` is already declared as this repository's `cat-harness` graph **in
full**. A nested entry would be a declaration inside a declaration — the defect
[#263](https://github.com/litlfred/folio-assistant/issues/263)'s own comment
names, where a consumer beneath the outer path cannot tell which declaration
owns what it finds. A sibling directory has one owner and no ambiguity.

## Known gap, and it predates this move

`bun run kg:audit` reports, in
`test/results/kg-qa/skills/roles/kg.kg-qa.json`:

> no role carries `"kg-navigation"` and no activity names it — reached, if at
> all, by direct invocation.

and five findings in `bootstrap.kg-qa.json` of the form *"needs skill
`kg-navigation`, but its lane's role `onboarding-agent` does not carry it."*
So the bootstrap diagram asks for this skill five times and the role in that
lane does not have it. **This move does not fix that** — it is a role-graph
binding, not a location — and it is recorded here rather than left in a sidecar
because a finding nobody reads is a finding nobody fixes.
