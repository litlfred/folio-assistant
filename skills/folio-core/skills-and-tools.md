---
name: skills-and-tools
description: >
  A skill states a capability generically; a Tool node carries the concrete
  mechanism. Read before writing or editing any skill, and whenever a skill is
  about to name a vendor, a CLI, a binary or an API endpoint.
---

# Skills and Tools — the skill says what, the Tool says how

**A skill is a capability stated generically. A Tool content node is one
concrete way to exercise it.** One skill may be satisfied by several Tools; a
Tool names the skills it satisfies through its `satisfies` field.

This is the standard operating procedure for every skill in the harness, not a
guideline for new ones. A skill that names GitHub, names the `beans` binary, or
embeds a shell invocation **has swallowed a Tool**, and the swallowing is what
makes a layer un-portable.

Decided 2026-09-18 by the repository owner. Schema for the Tool node:
`docs/architecture/agent-harness-minimum.md` §"Strawperson"; carrier
convention (Zod authoritative, JSON-LD and JSON Schema generated) in
[`directory-conventions`](directory-conventions.md) §"What lives in the
`schemas` graph".

## The test, in one line

> **Would this sentence still be true on a different forge, a different
> binary, a different machine?** If yes it is skill. If no it is Tool.

Applied to the two cases that motivated the rule:

| sentence | verdict |
|---|---|
| "Open a change proposal as soon as there is one commit to hang it on." | **skill** — true anywhere |
| "`gh pr create`", or the REST call it wraps | **Tool** — one forge, one transport |
| "Claim the item before you work, so a sibling session does not pick it up." | **skill** |
| "`beans update <id> --status in-progress`" | **Tool** |
| "If the CLI is unavailable, the store is still writable by hand." | **skill** — the *fact* is portable |
| "Edit the `status:` line in the front matter of `beans/defs/<id>--*.md`." | **Tool** |

That last pair is the one people get wrong. **Having a fallback is a property
of the capability; performing the fallback is a mechanism.** The skill must say
a fallback exists and when to reach for it, because an agent that does not know
one exists will stop. What it must not do is spell out the edit.

## Every bean skill has (at least) two Tools

The work-plan skills are the worked example, because the harness has carried
both mechanisms for a while without naming them as two:

| Tool | when |
|---|---|
| `beans` CLI | normal case — installed via `scripts/install-beans.sh` |
| hand edit / `scripts/beans-fallback.ts` | CLI absent or cannot be installed here |

Both satisfy the same skills. Neither is the skill. A fresh container has no
`beans` on `PATH`, so an agent that only knows the CLI is an agent that reads
the plan and touches nothing — which is exactly the 2026-09-18 failure where a
session completed two merged PRs' worth of durable work **unclaimed**. The
fallback is not a degraded mode to mention in passing; it is a second Tool with
equal standing, and the skill must present it that way.

## The harness assumes no MCP — and knows how to emit one

**`agentic-harness` must work with no MCP server running.** Everything it needs
is files in directories the instance declares: skills in the `kg` graph, Tool
nodes beside them, the work plan in the `beans` graph. An agent with nothing but
a filesystem and `agent-harness.json` can read all of it.

MCP is **acknowledged as a future transport, not assumed as the present one.**
Where a downstream instance runs a server, `skill_list` / `skill_fetch` /
`work_plan_prime` are a convenience over the same files — and `ToolDefinition`
accordingly declares `invoke.mcp` as **one optional arm** beside `shell` and
`container`. A Tool whose *only* invocation is an MCP call is not usable by the
harness that defines it.

**That is a statement about dependency, not about ignorance.** MCP is an
*output* of this harness: [`mcp-projection`](mcp-projection.md) is how an agent
takes a Tool node describing a CLI and produces a working MCP service from it,
[`mcp-assembly`](mcp-assembly.md) covers composing several into one namespace,
and [`mcp-contract`](mcp-contract.md) checks the result still matches its
sources. The harness is the thing that knows the mapping; it just does not need
the result in order to run.

This is a real constraint and not a formality. It is what makes the harness
bootstrappable: the layer that defines what a Tool *is* cannot require a tool
server to read its own definitions without arguing in a circle. It is also why
sovereign-compute and air-gapped operation are reachable later without a second
design — an instance with no server loses a transport, not a capability.

So when this skill says "reach a Tool through the graph", the floor is: read
`agent-harness.json`, find the `kg` entry, open the directory. Anything richer
is an optimisation an instance may offer.

## GitHub is a Tool node, not a layer

The four PR-choreography skills — `prepare-merge-auto`, `pickup`, `watch`,
`coordinate` — assume a forge. The proposal on the table was to split them into
a sixth repository, `agent-harness-github`, so the harness could run on GitLab
or on sovereign compute with no forge at all.

**Measured before deciding, on `main` 2026-09-18.** `coordinate.md` is 731
lines with 94 matches for GitHub-ish terms — but only **12** of those are
concrete invocations (`mcp__github__*`, `gh pr`, `gh api`). The other 82 are
conceptual: "pull request", "PR", "GitHub" as a noun. Across all four skills:
1,404 lines, of which the genuinely forge-bound mechanism is on the order of a
few dozen lines.

So the split would have moved 1,404 lines of portable prose to isolate about
twelve lines of mechanism. **Isolate at the Tool layer instead**: the skills
stay in `agentic-harness`, stated generically, and a `github` Tool node carries
the invocations. Adding GitLab later is then a second Tool node satisfying the
same skills — not a repository, not a fork, and not a rewrite of the prose.

### Vocabulary — name the concept, not the vendor's word for it

GitHub calls it a pull request; GitLab calls it a merge request; Gerrit calls it
a change. A skill that says "pull request" has picked one vendor's noun, which
is a milder form of the same defect.

**Prefer the neutral term on first use and the local term thereafter**, rather
than scrubbing every occurrence — a skill written entirely in invented
vocabulary is unreadable, and unreadable is worse than mildly GitHub-flavoured.
The rule is that an agent must never have to *resolve a vendor noun to act*: it
is fine for a skill to say "pull request (PR)" once and use PR after it; it is
not fine for the only statement of what to do to be `gh pr create`.

## Writing or editing a skill — the checklist

1. **Grep your own draft** for vendor names, binaries, endpoints, file paths
   under a tool's control, and flag characters. Each hit is a Tool that has not
   been declared.
2. **State the capability first**, in a sentence that survives the mechanism
   being replaced.
2b. **If an input reaches a command line, give it a type that cannot be a
   payload** — and put free prose on stdin. See
   [`untrusted-input`](untrusted-input.md); `check:tools` fails CI on a
   violation.
3. **Say a mechanism exists and where to find it** — never inline it. A Tool is
   reached the same way a skill is: resolve the `kg` graph from the instance's
   `agent-harness.json` and read from the directory it names. Not a remembered
   path, and — see below — not necessarily a tool call.
4. **Say when each Tool applies** if there is more than one, because choosing
   between them is judgement and judgement is skill.
5. **Name what happens when no Tool is available.** Three states, as everywhere
   here: the Tool worked, the Tool is absent and here is the fallback, and *we
   could not tell* — which is never rendered as success.

## Where this stands — the schema is real, the migration is half done

**`schemas/tool.ts` exists**, `tools/` holds **24** nodes, and
`bun run check:tools` fails when a `satisfies` names a skill that does not exist.
So a Tool is something you can reach for rather than a shape described in prose.

Four of the 24 were authored by hand (`beans-cli`, `beans-manual`, `github`,
`pages-publish`). The other twenty are the **migration of this instance's
existing MCP surface** into `tools/mcp.ts` — every `server.tool()` registration
the server serves, now with a declared contract and a declared set of skills it
satisfies.

### How that migration was done, because the method matters more than the result

**The contracts were read from the registrars, not from the source text.**
`bun run mcp:capture` mounts each `register*` export against a capture object
and reads the real Zod shapes. The first attempt regex-scanned
`server.tool("name", "description", {shape}, handler)` and produced parameter
names lifted out of the *description prose* — `skill_fetch` appeared to take
`Examples`, `Local` and `Reference`, and `paper_preferences` an `Action`.
Authoring `io` from that would have shipped a contract agreeing with nothing,
which is worse than no contract because the next check trusts it.

A test compares the two sides on every run: every served tool has a node, every
node's ports are served, and the required/optional split agrees. That is what
keeps the migration true rather than true-on-the-day.

### Two things the vocabulary could not express, and what was added

**Cardinality.** `folio_init.authors`, `stakeholder_map.paths` and
`readme_sync.only` are lists, so `ToolInput.repeated` was added rather than
minting an `ArrayOfRepoPath` beside every scalar type — which would have
multiplied the `$defs` and broken the identity property the shared vocabulary
exists for.

**In-process invocation.** Seventeen of the twenty have no shell equivalent at
all; they are TypeScript functions. `invoke.inProcess` names the module.
The existing refusal of an mcp-only Tool still stands and does not reach this
case: an in-process function is runnable by the harness directly, and it is the
projection *source* rather than something to proxy.

### The remaining debt

**Many skills still carry their invocations inline.** Measured after the
migration: 24 Tools cover **24 of 143** skills, up from 11. Most of the
remainder is fine — a great many skills are pure judgement
(`interaction-modality`, `one-voice-style-guide`) and have no mechanism to name.
`check:tools` reports the count rather than failing on it, for exactly that
reason. What it cannot tell you, and what needs a human eye, is which of the
uncovered skills *describe an action* — those are the ones whose mechanism is
still swallowed.

### A `satisfies` edge is checkable against the skill's own contract

**`satisfies` is the one part of a Tool node a schema cannot check, and it was
being written on judgement alone.** `bun run check:tools` now compares a Tool's
`io` against `schemas/skills/<skill>/input.schema.json` for every skill it
claims: **every `required` property of the contract must appear as an input on
the Tool.** If it does not, the Tool cannot exercise the skill and the edge is
false.

**What is compared, and what deliberately is not.** Names only. A skill's
contract is free-form JSON Schema; a Tool's `io` is named ports referencing
shared `$defs` IRIs. The shapes are not structurally comparable, and pretending
otherwise gives a check that is either vacuous or wrong. Types are excluded on
*evidence*: measured across the 22 contracts here, nearly every property is a
bare `{"type": "string"}`, so a type comparison would pass on anything.

A mismatch that is "only" a naming difference — `path` against `targetPath` — is
a **finding**, not a false positive to suppress. Two names for one input, across
a skill and the Tool claiming to implement it, means an agent reading the
contract cannot call the Tool.

**Three states, as everywhere.** No contract (the common case, not a defect) is
`undefined`; a contract requiring nothing is `[]` and passes; a contract present
but unparseable is reported and **fails**, never counted as agreement.

**It caught two edges on its first run, both written the previous day and both
wrong.** `translation-validate` claimed `content-validate`, whose contract
requires `targetPath` — validating a `.po` against its `.pot` is not validating
a folio's content. `workflow-complete` claimed `dmn-authoring`, whose contract
requires `decisionName` and `inputVariables` — what you supply to *write* a
decision table, not to *answer* one. Both edges are dropped, which is why
coverage reads 24 rather than 26: the earlier number counted two skills as
covered by Tools that could not perform them.

### Which uncovered skills actually need one — `bun run tools:coverage`

The count alone does not say which. A grep for shell blocks over-reports badly:
52 of the 118 uncovered skills contain one, because a skill may legitimately
QUOTE a command while stating its capability generically.

The corpus carries a better signal — **BPMN task type**. A process step is a
`serviceTask` (runs without a person) or a `userTask` (performed by one), and
the diagrams already say which. Triaged on that, plus an I/O contract under
`schemas/skills/`: **16** skills have strong automation evidence, **3** are
userTask-only, **52** are genuinely ambiguous, **47** show nothing. The read
shrinks from 118 files to 52.

**The reframing matters more than the numbers.** `interaction-modality` was the
standing example of a pure-judgement skill, and two activities name it: a
`serviceTask` that reads the preferences file — a mechanism — and a `userTask`
about how to frame a question — judgement. Ten of the sixteen strongest
candidates are both.

> **The question is not "is this skill a Tool?" but "which PART of it is."**

A skill with both halves is not mis-modelled. Migrating it is a **split**: the
mechanical half becomes a Tool, the judgement half stays as prose. Expecting a
clean move is what makes the migration look bigger than it is.

So when you write or edit a skill: follow the checklist above and reference a
Tool. When you read one that inlines `gh pr create` or `beans update`, that is
the debt, not the pattern — do not propagate it.

Authoring a Tool node: `tools/index.ts`, calling `defineTool`. It is TypeScript
rather than JSON so a malformed node fails at `tsc` and in the editor, which is
the carrier decision applied to instances as well as to the schema. `io` ports
reference the shared vocabulary in `schemas/tool-types.ts` by absolute IRI —
never a hand-written string, because a reference nothing checks is a reference
that is eventually wrong.
