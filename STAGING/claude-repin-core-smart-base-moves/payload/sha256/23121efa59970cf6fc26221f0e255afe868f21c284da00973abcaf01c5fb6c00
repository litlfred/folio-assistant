---
# folio-assistant-81vy
$schema: bean/1.0.0
title: 'DEPLOYMENT AWARENESS: the agent must know its UI surface — gh-pages, local server, MCP or chat-only — because it decides which tools apply'
status: completed
type: task
created_at: 2026-09-20T17:17:15Z
updated_at: 2026-10-09T13:33:00Z
parent: folio-assistant-5a3l
---

Owner, 2026-09-20, verbatim:

> agent should be aware of how ui is deployed (e.g. ghpages , no XSS, etc),
> local server, w/ or w/o mcp, chat discussion only.  part of skills to know
> which tools

## What this adds to the parent epic

`5a3l` establishes that **topology** (where things live) and **operating
mode** (what the harness is doing) are orthogonal, and that named scenarios
are their product. This names a third thing the agent must read off that
product: **which TOOLS it may use, and what it must not assume about the
surface it is rendering onto.**

The four the owner names are not one axis:

| | what it constrains |
|---|---|
| **gh-pages** | static host — no server-side execution, so **nothing can be sanitised, authorised or computed at request time** |
| **local server** | dynamic — a request-time surface exists |
| **with / without MCP** | whether tool calls are available at all |
| **chat discussion only** | there is no UI; the conversation IS the surface |

The last is the sharpest, and it is easy to forget: **a skill that assumes a
page exists is wrong in chat-only mode**, and that mode is the one an agent is
most often in.

## Measured 2026-09-20 — the XSS discipline is ENFORCED but not EXPLAINED

The no-XSS constraint the owner names is already real in this repository, and
already tested twice:

- `cat-harness/test/sticky-todos.e2e.ts:340` — *"content reaches the DOM as
  TEXT, never as markup"*
- `cat-harness/test/discarded-items.e2e.ts:215` — *"the body is rendered as
  TEXT, never as markup"*

**What is missing is the WHY.** Neither test, nor any skill, says that this
discipline follows from the deploy target being static — that a gh-pages site
has no request-time sanitisation, so escaping at render is the only line of
defence. A rule enforced without its reason is the failure this repository has
paid for repeatedly and recorded twice today: `kg-export.ts`'s "COMMITTED
artefact" comment defended a right choice with a false reason, and a reader
who checks a reason and finds it hollow concludes the constraint is
imaginary.

So the first, cheapest piece of this bean is **connecting the existing tests
to the topology that makes them necessary.**

## This is the capability model again, on the rendering side

Earlier today the owner settled that the WRITE path is several tools chosen by
capability and permission — `git-push`, `github-api`, `github-connector`. This
is the same shape for the RENDERING side: what the agent may do depends on
what the environment provides, and it must ask rather than assume.

`dp1j` already carries the consequence: **browse must stay fully useful with
zero write capability**, or a reader without credentials meets a broken
interface. The same holds here — a skill must degrade to chat-only rather
than assume a board.

Whether these are new `CapabilityDefinition`s (`static-host`, `local-server`,
`mcp-available`) or a different mechanism is open. Capabilities are
**environment probes**, and "am I rendering to a static host" is arguably an
architectural fact declared by whoever built the site rather than something to
probe — which is exactly the distinction `lean-mcp`'s docstring already draws
about reach versus probing. **Decide that before adding probes.**

## Done when

- [x] A skill states the deployment surfaces and what each forbids
- [x] The existing no-XSS tests cite the topology that makes them necessary
- [x] Skills that assume a UI say so, and degrade to chat-only
- [x] Whether these are capabilities or declared facts is settled, not assumed

## Relates to

`5a3l` (parent — the two axes), `dp1j` (browse must work with no write
capability; same degradation rule), `deployment-auth` (the existing skill on
this surface), and the `github-api` / `github-connector` capabilities declared
this session.

## Closed 2026-10-09

Closed on evidence (bean-coordination.md):
- Worktree branch: `claude/81vy-deployment-awareness`
- Commit SHA: `213622e872ba8601835ce750a1f9276f9a1e4fc6`
- Evidence:
  1. Skill created: `cat-harness/skills/ui/ui-core/deployment-awareness.md` states the 4 deployment surfaces (gh-pages, local server, with/without MCP, chat-only), their constraints, and degradation discipline. Added to `package-manifest.json` and generated reference docs.
  2. The no-XSS test comments in `cat-harness/test/sticky-todos.e2e.ts:688` and `cat-harness/test/discarded-items.e2e.ts:217` explicitly state that gh-pages has no request-time sanitisation, so escaping at render is the required line of defence against XSS.
  3. `deployment-awareness.md` defines the degradation discipline to chat-only mode (parallel to `dp1j`), requiring UI artefacts to degrade to clean structured markdown (tables, lists, outlines).
  4. Settled that deployment surfaces are declared architectural facts / context, not environment capabilities / probes: static vs dynamic hosting cannot be inferred by runtime environment probes, but is declared by the harness and instance topology.
  5. Test evidence:
     - `bun run typecheck`: clean pass (exit 0)
     - `bun test scripts/tests/skill-manifest-coverage.test.ts`: 6/6 tests pass
     - Committed and pushed to `claude/81vy-deployment-awareness` on remote.
