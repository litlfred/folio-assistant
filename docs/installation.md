---
layout: default
title: Installation
nav_order: 2
---

# Installation
{: .no_toc }

1. TOC
{:toc}

---

## Prerequisites

folio-assistant runs on [Bun](https://bun.sh) and connects to an LLM agent over
MCP. The platform itself only needs Bun; individual content types pull in
heavier toolchains (LaTeX, Lean, the FHIR IG Publisher) which are checked at
runtime and can be installed on demand.

| Requirement | Needed for | Install |
|-------------|-----------|---------|
| **Bun ≥ 1.0** | the framework (always) | `curl -fsSL https://bun.sh/install \| bash` |
| Git + git-lfs | content repositories | `apt install git git-lfs` |
| LaTeX (`latexmk`, `texlive`) | rendering papers | `apt install texlive-full latexmk biber` |
| Lean 4 (via `elan`) | formalizing papers | `curl …/elan-init.sh \| sh -s -- -y` |
| Java 21 + IG Publisher + SUSHI | WHO SMART IGs (L3) | see [WHO SMART IG guide](guides/who-smart-ig.html) |
| `pandoc`, `ripgrep` | conversions, search | `apt install pandoc ripgrep` |

You do not need all of these — install only what the content types you author
require. The built-in capability probe tells you what is missing.

## Clone and install

```sh
git clone https://github.com/litlfred/folio-assistant.git
cd folio-assistant
bun install
```

## Check your environment

The `--check-deps` probe reports which capabilities are present and gives an
install hint for anything missing:

```sh
bun run src/index.ts --check-deps
# or via the npm script
bun run check-deps
```

## Run the server

folio-assistant is an MCP server. It speaks two transports:

```sh
# stdio transport — what LLM harnesses (Claude Code, etc.) launch
bun run src/index.ts --stdio

# HTTP transport — for a long-running shared instance / the web UI
bun run src/index.ts --http

# point it at the content repo you are authoring (defaults to ../.. )
bun run src/index.ts --stdio --repo /path/to/your/content-repo
```

There are convenience scripts in `package.json`:

```sh
bun run start          # default (stdio)
bun run start:http     # HTTP transport
bun run test           # unit tests (bun test)
bun run test:e2e       # Playwright end-to-end tests
bun run lint           # eslint
```

## Configure for your folio

Copy the example config into your **content** repository (not into
folio-assistant) and adjust it for your content type:

```sh
cp folio.config.example.json /path/to/your/content-repo/folio.config.json
```

```json
{
  "contentType": "paper",
  "adapter": "paper",
  "adapterModule": "./adapters/paper/index.ts",
  "feedbackDir": "folio-assistant/feedback",
  "skills": ".claude/skills/local"
}
```

---

## Connecting an LLM harness

folio-assistant exposes its tools over MCP, so any MCP-capable agent harness can
drive it. Below are configurations for the common ones. In every case the agent
launches the server over **stdio**.

### Claude Code

Add folio-assistant as an MCP server. Project-scoped config lives in `.mcp.json`
at the root of your content repo:

```json
{
  "mcpServers": {
    "folio-assistant": {
      "command": "bun",
      "args": ["run", "/path/to/folio-assistant/src/index.ts", "--stdio", "--repo", "."]
    }
  }
}
```

Or register it from the CLI:

```sh
claude mcp add folio-assistant -- bun run /path/to/folio-assistant/src/index.ts --stdio --repo .
```

Claude Code also reads `AGENTS.md` / `CLAUDE.md` natively and honours the
`SessionStart` hook in `.claude/settings.json` — so the work-plan primer runs
automatically when a session starts.

### Antigravity

Antigravity reads `AGENTS.md` natively and supports MCP servers and a
`SessionStart` lifecycle hook. Add the server to its MCP config (JSON format
shared with Gemini CLI):

```json
{
  "mcpServers": {
    "folio-assistant": {
      "command": "bun",
      "args": ["run", "/path/to/folio-assistant/src/index.ts", "--stdio", "--repo", "."]
    }
  }
}
```

Wire the session-start primer to Antigravity's `SessionStart` hook so each
session is primed with the work-plan — point the hook command at the shared
script `scripts/session-start-coord-sweep.sh` (the same script every harness
uses; only the hook-config format differs per tool).

### Gemini CLI

Gemini CLI reads `AGENTS.md` / `GEMINI.md` natively. Register the MCP server in
its settings and reuse the same `SessionStart` script:

```json
{
  "mcpServers": {
    "folio-assistant": {
      "command": "bun",
      "args": ["run", "/path/to/folio-assistant/src/index.ts", "--stdio", "--repo", "."]
    }
  }
}
```

### Any other MCP client

Point your client at the stdio command above, or run the HTTP transport
(`bun run start:http`) and connect over HTTP. The MCP server exposes a
`work_plan_prime` tool that any MCP-connected agent can call to get identical
live work-plan priming, regardless of harness.

> **Why this works across harnesses.** The discipline lives in `AGENTS.md` (a
> Linux Foundation agent standard read natively by Claude Code, Gemini CLI,
> Antigravity, Cursor, Copilot, and others); the live state is exposed both as a
> per-harness `SessionStart` hook over one shared script and as the
> `work_plan_prime` MCP tool. See the [architecture](architecture.html) page.
