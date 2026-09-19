---
# folio-assistant-y8as
title: 'simulators/ is qou''s content sitting in the platform, and qou reaches into the submodule to find it'
status: todo
type: task
priority: normal
created_at: 2026-09-19T15:03:52Z
updated_at: 2026-09-19T15:03:52Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-19: *"all simulators/ need to go into qou"*.

Queued, not started — raised mid-turn, and the standing instruction is to
queue rather than pivot.

## The defect, measured on `main` at `b833d8f92`

`simulators/` in this repository holds **11 HTML files, 456 KB**, and they are
not ambiguous about whose they are:

    beta_decay_braid.html        knot_atom_diagrams.html
    beta_decay_halflife.html     knot_periodic_table.html
    brings_surface.html          q_double_slit.html
    double_slit.html             quantum_brings_surface.html
    double_slit_simulator.html   valley_stability.html
    empty.html

Knots, quantum double slits, beta decay, Bring's surface. That is the
*Quantum Observable Universe* folio's subject matter, sitting in the platform
— the violation `AGENTS.md` opens with: *"If you are about to write subject
matter here (a chapter, a constant, a vocabulary), you are either in the wrong
repo or writing something that belongs in the folio as data."*

**And the direction of the reference makes it worse.** `litlfred/qou`'s
`folio.config.json` (clone at `c98c47345`):

```json
"simulators": {
  "dir": "folio-assistant/simulators",
  "pyodideCache": true
}
```

qou has **no `simulators/` of its own** — it reaches *into the platform
submodule* to find its own content. So the folio's content lives in the
platform and the folio points at the platform to get it back. The fix is not
only to move files; it is to reverse that arrow.

## What references it here, and why some of it is already known-bad

`git grep simulators` over `*.ts *.json *.yml *.md`, excluding `beans/` and
generated docs:

| where | what |
|---|---|
| `content/pipeline/readme-sections.ts:301` | `let dir = "folio-assistant/simulators"` — the default when a folio declares none |
| `adapters/mcp-server/server.ts:2115` | serves standalone HTML simulators from the repo root |
| `LICENSE-CONTENT.md:14`, `README.md:387` | both name `simulators/` as platform code |
| `.claude/agent-memory/platform-boundary-guard/MEMORY.md:99,175` | **two live TRAPs about this exact literal** |

That last row matters: the boundary guard already carries *"the simulator
directory as the literal `folio-assistant/simulators`"* as a named genericity
failure, and separately records that rendering "directory absent" as "this
folio has no simulators" replaced a correct nine-row table with a sentence.
The knowledge that this is wrong is already in the corpus; what is missing is
the move.

## The constraint that decides how this gets done

**This session's `litlfred/qou` is attached read-only** (`access: "read"`).
Moving files *out* of the platform is a PR here; putting them *into* qou is a
PR there, and that needs push access to qou. Whoever picks this up either
re-attaches qou with `access: "push"` or hands the qou half to a session that
has it.

The two halves must also land in an order that never leaves qou unable to find
its simulators: **qou gains `simulators/` and repoints `folio.config.json`
FIRST**, and only then does the platform drop the directory. Reversed, every
qou build between the two merges renders a simulator table for a directory
that is not there — and per the TRAP above, that failure prints as "this folio
has no simulators" rather than as an error.

## Open, and not decided here

1. **What does `readme-sections.ts` default to once nothing sensible remains?**
   Today it falls back to `folio-assistant/simulators`. After the move that
   literal names a directory that exists nowhere, so the honest answer is
   probably "no default — could not determine", which is the third state the
   skill already prescribes.
2. **Does the MCP server still serve them?** `server.ts:2115` serves from the
   platform repo root. If the files are in the folio, either the tool resolves
   the folio's configured directory or it stops being the platform's job.
3. **`empty.html`** — is it a fixture something tests against, or a leftover?
   If a test depends on it, it is platform test material and does not move.

## Done when

`simulators/` does not exist in this repository, qou carries its own and
declares `"dir": "simulators"`, no platform code names the literal
`folio-assistant/simulators`, and the two boundary-guard TRAPs about it are
updated to say it was fixed rather than that it is a live hazard.
