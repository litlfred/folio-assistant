---
name: lean-environment-setup
description: >
  Sets up and troubleshoots the Lean 4 environment for Claude Code sessions.
  Ensures elan, lake, lean are installed so the paper-assistant MCP's Lean
  tools are operational. Handles sandboxed/cloud environments where downloads
  may be restricted.
allowed-tools: Read Edit Bash Grep Glob
---

# Lean Environment Setup

## ⮕ FAST ROUTE — read this BEFORE declaring Lean "unavailable"

> On **any** Lean env/tool failure — LSP "no valid project path",
> `leansearch` SSL error, `lake exe cache get` 403, `elan toolchain
> install` SSL/`failed to parse release data`, empty `~/.elan/toolchains/`,
> `lake build` timeout — **do NOT conclude "Lean is unavailable."** Several of
> these (cache-403, toolchain-host-firewalled, leansearch/loogle SSL) have
> **documented workarounds in this very file** (§"Mathlib cache 403 fallback"
> + §"Web-sandbox addendum" + §"Offline Mathlib search"). The recurring
> failure mode is *agents re-deriving these workarounds — or giving up —
> instead of grepping for them.*
>
> **Discipline:** when a tool or environment operation fails, FIRST
> `grep -ri "<error keyword>" .claude/skills/ skills/ AGENTS.md docs/`
> **before** declaring the capability unavailable. Only after the documented
> workarounds are tried and hit a *hard* network block may you fall back to a
> rigorous hand-audit — and then say so explicitly.
>
> **If the install is long/uncertain, DELEGATE it to a sub-agent** (see
> §"Delegate the install to a sub-agent" near the foot of this file) so the
> main task is not blocked on a multi-minute toolchain fetch + mathlib build.

## Architecture

All MCP functionality — including Lean tools — is served through a single
`paper-assistant` MCP server. There is **no separate lean-lsp MCP entry**.
The paper-assistant detects lean/lake on the PATH and enables Lean tools
automatically.

## When to Use This Skill

- At session start when the Lean build status reports Lean as unavailable
- When paper-assistant Lean tools fail with "No such file or directory: 'lake'"
- When a user says "set up Lean" or "install Lean"

## Prerequisites

The paper-assistant's Lean tools require these on the PATH:

1. **elan** — Lean toolchain manager (`~/.elan/bin/`)
2. **lean** — the Lean compiler (installed via elan)
3. **lake** — the Lean build tool (installed with lean)
4. **uv** — Python package manager (optional, for uvx-based tools)
5. **ripgrep** — for local symbol search (optional)

## Setup Procedure

### Step 1: Check current state

Use the `lean_status` MCP tool. It reports the current mode
(local/remote/local-degraded/none) and what's missing.

### Step 2: Install Lean toolchain

Use the `lean_setup` MCP tool. It handles the full installation:
elan, lean, lake, uv, ripgrep, lake update, Mathlib cache, and build.
Safe to re-run — skips already-installed components.

If `lean_setup` fails (e.g., 403 errors from network restrictions in
sandboxed environments), proceed to Step 3.

### Step 3: Diagnose network restrictions

In sandboxed/cloud environments (GitHub Codespaces, Claude Code cloud,
CI runners), outbound HTTPS to `github.com` or `raw.githubusercontent.com`
may be blocked. Test:

```bash
curl -sSf --max-time 5 https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -o /dev/null && echo "OK" || echo "BLOCKED"
curl -sSf --max-time 5 https://github.com/leanprover/lean4/releases -o /dev/null && echo "OK" || echo "BLOCKED"
```

If blocked, local Lean installation may be impossible. The workarounds
below cover most sandbox cases before that conclusion is warranted.

### Step 4: Verify Lean tools via paper-assistant

After setup, verify with the `lean_status` MCP tool. If mode is
`local`, Lean is fully operational.

## Docker-based setup (offline)

If a paper-assistant Docker image is available, all tools (Lean, TeX,
Bun) are pre-installed and ready to use without any network access:

```bash
docker run --rm --entrypoint "" \
  -v $(pwd):/work -w /work \
  <paper-assistant-image>:latest \
  bash -c "lean --version && lake --version && pdflatex --version | head -1"
```

Render hooks can auto-detect Docker and use the image as a fallback when
local tools are missing.

## Fallback: Structural Analysis Without Lean

When Lean is not installed, agents can still:

- Read `.lean` files with the Read tool
- Search for `sorry` with Grep
- Validate content object schemas via `paper-assistant` MCP
- Check cross-references between `.ts` manifests and `.lean` files
- Verify naming conventions (label → declaration mapping)
- Audit `status` fields against file contents

What agents **cannot** do without Lean:

- Type-check proofs
- Get goal states at positions
- Search Mathlib via the hosted leansearch/loogle services — but the
  **offline grep substitute** below works with or without Lean
- Verify axiom dependencies
- Get autocompletions or hover info

### Offline Mathlib search — when hosted leansearch/loogle are SSL-blocked

In a web sandbox the hosted search services (`loogle.lean-lang.org`,
`leansearch.net`) may fail with `SSL: CERTIFICATE_VERIFY_FAILED`
(self-signed cert in the proxy chain), so the `lean_loogle` /
`lean_leansearch` MCP tools error out. Use these **offline** substitutes
— they need no network:

1. **Grep the Mathlib source** (closest analogue to a loogle name/substring
   search; works *with or without* Lean installed). The full source ships
   with any clone and with a cache restore — thousands of `.lean` files
   under `.lake/packages/mathlib/Mathlib/`:
   ```bash
   grep -rn "theorem det_succ_row_zero" .lake/packages/mathlib/Mathlib/
   grep -rn "det_fin" .lake/packages/mathlib/Mathlib/LinearAlgebra/Matrix/
   ```
2. **`lean_local_search` (MCP)** — offline; searches declarations in the
   current project + imported modules (once a file is loaded).
3. **`lean_hover_info` / `lean_declaration_file` (MCP)** — offline once a
   file is loaded; type signature / source of a known name.

**Why not run loogle locally?** loogle is a Lean exe that imports and indexes
*all* of Mathlib, so it needs Mathlib oleans for **its own** toolchain, which
may pin a newer toolchain than the repo cache; standing it up means a
from-source Mathlib rebuild that cannot reuse commit-pinned cache oleans. The
grep route answers the same questions in seconds.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No such file or directory: 'lake'" | lean not on PATH | `export PATH="$HOME/.elan/bin:$PATH"` or install elan |
| elan install 403 | Network restrictions | Use the GitHub-release manual install (§"Web-sandbox addendum" item 1) |
| "lake update" hangs | Git fetch blocked | Check `git ls-remote` works for mathlib4 |
| Lean tools timeout | Workspace not built | Run `lake build` at the **repo root** (root workspace builds all paper packages) |
| **`lake exe cache get` → 403 on all shards** | **Mathlib cache host blocked from this network** | **See "Mathlib cache 403 fallback" below — clone mathlib source locally + git insteadOf** |
| **`lean_diagnostic_messages` MCP times out at 60s** | **No prebuilt oleans + cache 403** | **Same fix as cache 403 above — local clone unblocks LSP** |
| "toolchain not installed" | Wrong lean version | `elan toolchain install $(cat lean-toolchain)` from the repo root |
| paper-assistant shows `✗ lean` | lean not on PATH | Add `$HOME/.elan/bin` to PATH in shell profile |


## Where the cache workaround went

This skill was 587 lines, and 419 of them were one workaround for `lake exe
cache get` returning 403 — a case most sessions never hit, read by every session
that loads the skill. It now sits beside this file. Nothing was deleted.

| what | where |
|---|---|
| FAST ROUTE, architecture, prerequisites, setup, Docker, no-Lean fallback, troubleshooting | **here** |
| Mathlib cache 403 fallback — packing oleans, orphan branch, chunking | [`lean-environment-setup/mathlib-cache-fallback.md`](lean-environment-setup/mathlib-cache-fallback.md) |

Go there only once the FAST ROUTE below has actually failed.
