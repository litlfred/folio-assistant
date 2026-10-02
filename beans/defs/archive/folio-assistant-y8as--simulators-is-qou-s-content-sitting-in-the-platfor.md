---
# folio-assistant-y8as
title: simulators/ is qou's content sitting in the platform, and qou reaches into the submodule to find it
status: completed
type: task
priority: normal
created_at: 2026-09-19T15:03:52Z
updated_at: 2026-09-20T20:00:00Z
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

_2026-09-19T15:11:36Z_ — Half 1 of 2 is open: litlfred/qou#7444, branch claude/simulators-from-platform. NOT merged — qou requires /prepare-merge plus an explicit 'merge it' from the author, and its AGENTS.md says 'looks good' is not merge permission.

WHAT LANDED IN QOU: the 11 HTML files (456 KB), folio.config.json repointed from 'folio-assistant/simulators' to 'simulators', and 15 live references repointed across content manifests, AGENTS.md, README.md and a skill doc.

THREE FINDINGS THE MOVE SURFACED, none of which it caused.

1. TWO REFERENCES WERE ALREADY DANGLING. descent_rate_probe.html and multi_level_jet_sum.html are named by descent-rate-probe-sim.ts and multi-level-jet-sum-sim.ts and exist in NEITHER repository — not in the platform's eleven, not in qou. They are repointed with the rest, so they are broken at the new path exactly as they were at the old one. Their own QA sidecars already describe the subjects as stubs with todo-html deferred, so this is known and recorded, not new. Verified file by file: 9 of 11 referenced simulators resolve after the move.

2. TWO FILES IN THE PLATFORM ARE REFERENCED BY NOTHING: double_slit.html and empty.html. empty.html is 32 bytes and nothing in either repo names it — a leftover, not a fixture, which answers open question 3 on this bean. They moved anyway: unreferenced qou content is still qou content, and deciding whether to delete them is a separate call from deciding where they live.

3. FOUR FILES IN QOU MENTION THE OLD PATH AND WERE DELIBERATELY LEFT ALONE: two *.qa.json sidecars and two docs/audits/ documents carry it inside verdict and audit PROSE describing what was true when written — one literally reads 'the .ts is a stub with tag todo-html and html: ... deferred'. Rewriting them falsifies the record, and the sidecars are generated besides.

NOT VERIFIED, and stated on the PR rather than implied away: qou's own content validation has not been run. Its tooling comes from the folio-assistant submodule, which is not checked out in this shallow clone — qou's package.json declares only build:docs. The change is verified structurally (files present, config parses, every reference checked against the filesystem), not by loading the manifests through the pipeline.

ALSO NOTED ON THE PR: editing the 11 content manifests stales their *.qa.json sidecars by hash. Expected, and for the QA sweep to regenerate rather than for me to hand-edit.

STILL TO DO — half 2, in this repository, and ONLY after qou#7444 merges: drop simulators/, and fix what names the literal. Found so far: content/pipeline/readme-sections.ts:301 defaults to it, adapters/mcp-server/server.ts:2115 serves from repo root, scripts/repo-partition.ts:530 lists it in a package prefix array (which would then name nothing — the same silent-miss shape the test/ move hit), LICENSE-CONTENT.md and README.md name it as platform code, and platform-boundary-guard's memory carries two TRAPs about it that should change from 'live hazard' to 'fixed'.

_2026-09-19T15:45:20Z_ — HALF 2 DONE, in this repository. qou#7444 merged at 4827c00fc; this branch removes the platform's copy and repairs what named it.

THE FALSIFIER DID NOT FIRE. Before deleting, all 11 files were sha256-compared between /home/user/folio-assistant/simulators and qou main at 4827c00fc: 11 SAME, 0 DIFF, 0 missing. Had any differed, the platform would have held an edit qou never received and the deletion would have lost work — that was the stated stop condition.

WHAT WAS REPAIRED, and two of them were NOT on the list carried in the note above — they were found by a final sweep after the planned six were done:

1. harness.config.example.json:15 — "dir": "folio-assistant/simulators". This is the example a NEW folio scaffolds from, so it would have taught the wrong path to every folio created after the move. Now "simulators", with a comment contrasting it against `viewer`, which legitimately does point into the platform because the viewer IS platform code.
2. skills/folio-paper-adapter/rendering-fixes.md:376 — documented `html: "folio-assistant/simulators/file.html"` under the heading "Current format (required)". That is the skill an author reads to learn how to write a simulator block. Now "simulators/file.html" plus a line saying the path is folio-relative. Its generated copy under docs/reference/skill-instructions/ was regenerated with gen-skill-docs.ts, not hand-edited.

The planned six: content/pipeline/readme-sections.ts (default is now the folio-root `simulators`, and the undetermined-state hint no longer asks "is the platform submodule checked out?" — it asks whether the directory is declared and the checkout complete), adapters/mcp-server/server.ts:2115, scripts/repo-partition.ts:530, LICENSE-CONTENT.md:14, README.md:387, and the two platform-boundary-guard TRAPs.

server.ts:2115 IS NOT WHAT THE NOTE ABOVE SAID. It was recorded as "serves standalone HTML simulators from repo root". Read: the route tests `!path.slice(1).includes("/")`, so a path with a slash never reaches it — it could never have served `/simulators/x.html` or `/folio-assistant/simulators/x.html`. Its REPO_ROOT is findContentRepoRoot(), the FOLIO's root, and qou has a real root-level ruby-3d-viewer.html that it does serve. So the route is generic and live; only its COMMENT claimed simulators. The comment was the defect, and deleting the route would have broken a live page.

HOW SIMULATORS ARE ACTUALLY SERVED, since the above raised it: viewer/index.html:5039 sets simFrame.src = simUrl(simBlock.html, ...), i.e. straight from the block's `html` field, resolved relative to wherever the viewer is hosted. So `simulators/x.html` resolves exactly as `folio-assistant/simulators/x.html` did. The move is transparent to the viewer and no viewer change was needed.

repo-partition.ts kept its `declared-path-literal` comment and lost only the `simulators/` prefix: a simulator is subject matter, so NO platform package is its target — not folio-asst-sci either. docs/architecture/future-state.md was corrected the same way in two places.

VERIFIED: tsc --noEmit exit 0; bun test 2755 pass / 0 fail / 56 skip across 201 files; eslint clean on the three changed .ts; check:declared-paths, check:declared-assets, check:harness-dirs, readme:audit, agent-memory:check all PASS; readme-sections.test.ts 17 pass. Boundary-guard memory went 185 -> 189 lines, inside the 200-line injection budget bean 4kiw is about.

NOTED, NOT FIXED — ci-health-watcher's MEMORY.md is 206 lines on main, 7 over the budget, and this branch does not touch it. agent-memory.ts reports the overflow is the hand-written tail rather than an entry, so nothing is silently dropped. Pre-existing and someone else's; recorded here rather than widening this PR.

WHAT REMAINS NAMING THE OLD LITERAL, all deliberate: readme-sections.ts's two comments and both memory nodes now read in the PAST tense as the worked example; placement.md says "until it"; two test files describe the regression they guard. These are records of why the rule exists, and rewriting them would erase the evidence for it.

## Evidence

Tagged `ready-to-close` by the `bbbl` sweep, 2026-09-20. **Not closed** — the
owner confirms the batch (`bun run check:ready-to-close`).

**Both halves landed, and the falsifier is recorded as having been run.** qou
`#7444` merged at `4827c00fc`; before deleting the platform's copy all 11 files
were sha256-compared against qou `main` at that commit: **11 SAME, 0 DIFF, 0
missing**. The bean states this was the stop condition — had any differed, the
platform would have held an edit qou never received. That is a re-derivation
the author actually performed and wrote down, which is rarer than the claim.

**Verification it carries**: `tsc --noEmit` exit 0; `bun test` 2755 pass / 0
fail / 56 skip; `eslint` clean on the three changed `.ts`; `check:declared-paths`,
`check:declared-assets`, `check:harness-dirs`, `readme:audit` and
`agent-memory:check` all pass.

**What this session could NOT re-derive**: qou's own content validation, which
the bean is explicit about and does not claim — *"NOT VERIFIED, and stated on
the PR rather than implied away"*. Its tooling is in a submodule this clone does
not carry. Also noted there and not fixed: editing the 11 manifests stales their
`*.qa.json` sidecars by hash, left for the QA sweep to regenerate.

---

_2026-09-20T20:00Z_ — **CLOSED on the owner's confirmation of the `ready-to-close`
batch, 2026-09-20.** The evidence above is what was confirmed against; nothing
new was measured at closing time, and this note says so rather than implying a
re-derivation that did not happen.

The `ready-to-close` tag is spent and removed: `check:ready-to-close` reports a
tag on a closed bean as one to take off, so leaving it would make the queue
report a defect on its own success.
