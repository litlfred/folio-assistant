# AGENTS.md — kg-navigation

What binds everywhere is the repository's [`AGENTS.md`](../AGENTS.md); what
this layer *is* is [`README.md`](README.md). This layer exists for the agent
who does not yet know the layout — which may be you, right now.

## If you are cold, read the skill, not the directory

Ask for it: `skill_list`, then `skill_fetch`. **Do not open a path under
`skills/` from memory.** The graph an instance declares is what resolves, and
a hardcoded path is how a skill goes missing the moment the layout moves —
which is the exact failure this layer is about.

## Two bodies, one subject. Do NOT delete one as a duplicate.

| where | precondition |
|---|---|
| [`bootstrap/skills/bootstrap-kg-navigation.md`](../bootstrap/skills/bootstrap-kg-navigation.md) | **nothing installed** — no MCP server, no `skill_fetch`, no `beans`, no build |
| [`skills/kg-navigation.md`](skills/kg-navigation.md) | the tooling is reachable — the MCP pair, and the filesystem fallback |

They answer the same question **under different preconditions**, so neither is
a copy of the other and merging them would leave one caller unable to run what
it was given. The name collision that made them look like duplicates is gone;
bootstrap's is now `bootstrap-kg-navigation`. The reason for two bodies is
not gone.

If you find yourself about to "consolidate" these, the question to answer
first is: **which precondition does the surviving body assume?** Whichever you
pick, the other caller is broken.

## Do not put a count in either body

Both carried line counts and both had drifted. A count in prose is a claim
nothing checks.

---

*A declared asset of this instance ([`kg-navigation.json`](kg-navigation.json), role
`agent-instructions`). Issue #592.*
