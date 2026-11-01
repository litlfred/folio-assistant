---
name: deployment-awareness
description: >
  The agent must know its UI surface — gh-pages, local server, with/without MCP,
  or chat discussion only — because deployment surfaces are declared architectural
  facts that decide which tools apply, forbid request-time assumptions, and
  require graceful degradation to chat.
adapters: [document, paper, dak]
profiles: [document, paper]
---

# Deployment awareness — UI surfaces, host constraints, and chat degradation

The owner, 2026-09-20:

> agent should be aware of how ui is deployed (e.g. ghpages , no XSS, etc),
> local server, w/ or w/o mcp, chat discussion only.  part of skills to know
> which tools

Epic `5a3l` establishes that **topology** (where things live) and **operating
mode** (what the harness is doing) are orthogonal axes. Deployment awareness is
the product of those axes applied to the **interaction surface**: it tells the
agent **which tools apply**, what it **must not assume** about the host, and how
to **degrade gracefully** when no graphical canvas exists.

---

## The four deployment surfaces and their constraints

These four surfaces are not a single sliding scale; they govern different
layers of interaction and hosting:

| Surface | Nature | What it provides | What it constrains / forbids |
|---|---|---|---|
| **gh-pages** | Static host | Zero-maintenance static file serving, public or branch-staged hosting | **No server-side execution.** Nothing can be sanitised, authorised, or computed at request time. No custom response headers (MIME types are fixed to GitHub's extension table). Every piece of content must reach the DOM as TEXT / escaped, never raw markup (render-time escaping is the *only* line of defence against XSS). |
| **local server** | Dynamic host | Request-time execution (e.g. Bun `serve:rendering`), exact MIME types (`application/ld+json`), containment checks, loopback binding | Requires a running local process and runtime environment. Cannot assume public reachability without an explicit tunnel or gateway. |
| **with / without MCP** | Tool protocol | Tool calling, structured RPC, resource queries, work plan access | **Without MCP**, tool calls are unavailable; interaction happens through files, shell commands, or chat text. **With MCP**, the agent can query graphs, fetch skills, and update state directly. |
| **chat discussion only** | Pure conversation | Direct dialog with the user | **No UI canvas exists.** The conversation transcript *is* the surface. Any skill assuming a browser DOM, a board, or an interactive window must degrade gracefully to chat-native text. |

---

## 1. Static host (`gh-pages`) — why escaping is the only defence

On a static host like GitHub Pages, files are served directly from storage
without an application server intercepting the request:

1. **No request-time sanitisation or computation:**
   There is no server-side template engine, no middleware sanitiser, and no API
   gateway to inspect or reject malformed or hostile payloads before they reach
   the browser.
2. **Escaping at render is the whole depth:**
   On a dynamic server, input might be sanitised upon upload, filtered upon
   retrieval, or scrubbed by a templating layer. On `gh-pages`, none of these
   exist. Content authored in files or graphs (such as todos, notes, or
   `fsh-guts/` items) reaches the client directly via JSON. If the client-side
   render does not insert that content as **text** (e.g. `textContent`,
   `createTextNode`) rather than `innerHTML`, the application is immediately
   vulnerable to Cross-Site Scripting (XSS).
3. **No custom header enforcement:**
   As detailed in [`serving-renderings`](serving-renderings.md), GitHub Pages
   serves files according to its own extension table. It cannot set
   `Content-Type: application/ld+json` for `.jsonld`. The harness accommodates
   this by publishing `.json` alongside `.jsonld`, rather than pretending Pages
   can be configured to emit custom headers.

---

## 2. Dynamic host (`local server`) — exact types and containment

When the UI is backed by a local server (such as `bun run cat serve:rendering`):

1. **Request-time enforcement:**
   The server reads declared media types and sets exact `Content-Type` headers
   (e.g. `application/ld+json`, `application/schema+json`), allowing strict
   JSON-LD parsers to operate correctly.
2. **Path containment and binding:**
   A local server enforces real-path containment so symlinks cannot leak files
   outside the published root, and binds loopback (`127.0.0.1`) by default to
   prevent unintended network exposure.
3. **No reliance on server-side second chances:**
   Even when running under a local server, client-side rendering must continue
   to escape content as text. The same UI code serves both local and `gh-pages`
   deployments; it must never relax escaping because a dynamic server happens to
   be present during development.

---

## 3. Protocol availability (`with / without MCP`)

The agent interacts with the harness through different channels depending on
whether the Model Context Protocol (MCP) server is running:

- **With MCP (the tools layer's MCP server in `--stdio` or `--http` mode):**
  The agent has access to structured tools: `skill_list`, `skill_fetch`,
  `work_plan_prime`, `beans`, and content adapter tools. It should invoke tools
  directly rather than scraping files or inventing shell workarounds.
- **Without MCP (standard CLI or standalone container):**
  Tools cannot be called via RPC. The agent resolves skills directly from the
  declared `kg` graph in `<instance>.json` (`schemas/kg/cat-harness.ts`) and uses
  scripts (`bun run cat ...`) and filesystem reads.

A skill must not fail simply because MCP is unavailable; it must specify both
the MCP tool path and the filesystem/CLI equivalent (as documented in
`AGENTS.md` and `skills/kg/kg-core/directory-conventions.md`).

---

## 4. Chat discussion only — the graceful degradation discipline

Agents frequently run in pure chat sessions: in an interactive terminal, a PR
comment review, or an IDE assistant panel with no webview attached.

> **Rule:** A skill that assumes a web page or board exists is wrong in
> chat-only mode.

### Graceful degradation rules

1. **Never assume a rendered DOM:**
   Skills governing visual artefacts—such as [`harness-tiles`](harness-tiles.md),
   [`board-windows`](board-windows.md), and [`kg-viewer`](kg-viewer.md)—must
   treat the visual UI as a *projection* of underlying data, not the source of
   truth.
2. **Degrade to chat-native structured text:**
   When operating in chat-only mode:
   - A board with sticky notes degrades to a Markdown table or checklist.
   - A window open/close state degrades to an outline of active inspection targets.
   - A graph visualisation degrades to an indented hierarchy or JSON-LD summary.
   - A tile status degrades to a one-line status badge in chat.
3. **Parallels to browse-without-write (`dp1j`):**
   Bean `dp1j` established that browsing must remain fully functional with zero
   write credentials. Similarly, UI inspection and manipulation skills must
   remain completely informative in chat mode without throwing "window not found"
   or demanding a browser context.

---

## Declared architectural facts vs. environment capabilities

A critical architectural distinction is whether deployment surfaces are
**capabilities** or **declared architectural facts**:

| Concept | Nature | Mechanism | Example |
|---|---|---|---|
| **Capability** | An environment probe | Tested dynamically at runtime by inspecting the environment | "Is `git` installed?", "Is port 4007 free?", "Does the token have repo write scope?" |
| **Deployment Surface** | An architectural fact / context | Declared statically by configuration or scenario topology | "This folio publishes to GitHub Pages", "The server is a static host", "Current mode is chat-only" |

### Why deployment surfaces must NOT be probed

1. **Probes cannot answer architectural intent:**
   An environment probe can inspect the local filesystem or check if a port is
   open, but it cannot know whether the committed HTML in `docs/` will be pushed
   to GitHub Pages, synced to an S3 bucket, or viewed via a local file URI.
   "Am I rendering to a static host" is an architectural fact declared by
   whoever configured the site.
2. **Category errors produce brittle fallbacks:**
   Attempting to probe deployment topology (e.g. checking if `gh-pages` branch
   exists or pinging `github.io`) yields false negatives in offline environments,
   sparse checkouts, or pre-deployment staging.
3. **Where the declaration lives:**
   Deployment surfaces and topologies are declared in instance configurations
   (`<instance>.json`, `<name>.config.json`), role graphs, or workflow
   definitions (`scenarios/*.json`, `beans/workflows/`). The agent reads these
   declared facts from the context rather than probing.

---

## Summary checklist for agent behaviour

Before rendering content, selecting tools, or reporting UI state:

- [ ] **Check the host:** If publishing or rendering to `gh-pages`, ensure all
  dynamic content reaches the DOM as text. Never rely on server-side filters.
- [ ] **Check the protocol:** If MCP is absent, use declared graph paths and CLI
  tool equivalents; do not stall waiting for tool RPC.
- [ ] **Check the canvas:** If running in chat-only mode, degrade visual UI
  concepts (boards, windows, tiles) to clean markdown outlines, tables, and lists.
- [ ] **Read declared facts:** Rely on declared configuration for deployment
  targets rather than attempting runtime network or host probes.
