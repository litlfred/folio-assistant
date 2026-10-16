---
name: tool-authoring
description: >-
  How concrete Tools are authored, structured, packaged, and registered across
  the separated multi-repository platform: defining Knowledge Graph Tool nodes,
  implementing TypeScript handlers in the tools repository, registering MCP tools,
  isolating toolchain dependencies, and validating tool-to-skill alignment.
governs:
  - cat-harness-tools/src/tools
  - cat-harness/tools
---

# Tool Authoring — from capability to concrete mechanism

> Skill id: `tool-authoring` · Package: `folio-core`
> Companion: [`skills-and-tools`](skills-and-tools.md)

**A skill states a capability generically. A Tool node in the Knowledge Graph
carries the concrete specification, and the tools repository contains the
executable implementation.**

When authoring or modifying tools in the separated architecture:
1. **The Skill** (`skills/`) defines what an agent or user accomplishes, free
   from vendor or CLI specifics.
2. **The Tool Node** (`cat-harness/tools/`) declares the tool in the Knowledge
   Graph with its I/O contracts, capability bindings (`satisfies`), and
   execution metadata.
3. **The Concrete Implementation** lives in the dedicated tools repository
   (`cat-harness-tools/` or `<name>-tools/`), maintaining its own standalone
   dependencies, build scripts, ambient type definitions, and test suites.

---

## 1. Repository Boundary & Layout

The platform splits content/schemas from tool implementations:

| layer | repository | role & contents |
|---|---|---|
| **Graph & Schemas** | `litlfred/cat-harness` | Declarative Tool nodes in `tools/` (using `defineTool` from `schemas/tool.ts`), schema definitions, and skill contracts. |
| **Tool Execution** | `litlfred/cat-harness-tools` | Executable TypeScript implementations in `src/tools/`, MCP server in `src/server.ts`, ambient moddle/type definitions in `types/`, standalone `package.json` (`@litlfred/cat-harness-tools`), `tsconfig.json`, and `bunfig.toml`. |

This split guarantees that a content-only consumer or reader does not drag
along heavy runtime dependencies, SDKs, or compiler toolchains.

---

## 2. Step-by-Step Tool Authoring Lifecycle

### Step 1: Identify or Author the Skill Contract

Before writing code, identify the generic capability the tool satisfies:
- Find the skill in `skills/` (e.g., `skills/sdlc/sdlc-core/package-release.md`).
- If the skill accepts inputs, verify or define its `input:` JSON Schema
  contract in the skill's front matter or under `schemas/skills/`.

### Step 2: Implement the Handler in `cat-harness-tools`

Create a dedicated module under `cat-harness-tools/src/tools/<tool-name>.ts`:
1. **Use Zod for input validation**: Define explicit input schemas with descriptions.
2. **Support three-state returns**:
   - `success`: action completed with verified outcome.
   - `failure`: action failed with actionable error message.
   - `undetermined`: prerequisites or state could not be inspected — never report
     "clean" or "success" when an audit or check was skipped.
3. **Keep handlers deterministic and pure where possible**: Isolate file system
   writes or network calls behind explicit arguments or testable adapters.

Example handler:
```typescript
import { z } from "zod";

export const PackTarballInputSchema = z.object({
  instanceRoot: z.string().describe("Root directory of the instance to pack"),
  outDir: z.string().optional().describe("Output directory for the .tgz tarball"),
});

export type PackTarballInput = z.infer<typeof PackTarballInputSchema>;

export async function packTarball(input: PackTarballInput) {
  // Implementation...
}
```

### Step 3: Register with the MCP Server

In `cat-harness-tools/src/tools/` or `cat-harness-tools/src/server.ts`:
- Export a registrar function: `register<ToolName>Tools(server: McpServer)`.
- Register the tool with `server.tool(name, description, schema, handler)`.
- Re-export the tool from `cat-harness-tools/src/index.ts` if it is part of the
  public programmatic API.

### Step 4: Declare the Tool Node in the Knowledge Graph

In `tools/<id>/<id>.ts`, one folder per Tool (Step 4b):
- Default-export `toolFactory((t) => defineTool({ … }))` (`schemas/tool-folders.ts`, `schemas/tool.ts`).
- Link to the skill via `satisfies: ["<skill-id>"]`.
- Map I/O ports to shared vocabulary in `schemas/tool-types.ts` via absolute IRIs.
- Specify invocation target:
  - In-process: `invoke: { inProcess: "@litlfred/cat-harness-tools#<export>" }`
  - CLI: `invoke: { command: "bun run ...", args: [...] }`

Example:
```typescript
// tools/pack-tarball/pack-tarball.ts
export default toolFactory((t) => defineTool({
  id: "pack-tarball",
  satisfies: ["npm-kg-distribution", "package-release"],
  title: "Pack Knowledge Graph into npm tarball",
  description: "Runs `bun pm pack` to build a deterministic .tgz tarball.",
  io: {
    inputs: [
      { name: "instanceRoot", type: "https://schema.org/Text", required: true },
    ],
    outputs: [
      { name: "tarballPath", type: "https://schema.org/Text", required: true },
      { name: "sha256", type: "https://schema.org/Text", required: true },
    ],
  },
  invoke: {
    command: "bun cat-harness-tools/scripts/pack-tarball.ts",
  },
}));
```

### Step 4b: A new folder is a named subgraph of its harness — declare it

If what you are adding needs a **new folder**, decide first which of three
kinds of folder it is. Each has exactly one way to be declared, and the place
the folder sits decides which (owner, 2026-10-14):

1. **A folder directly under the harness root** (a new code area, a new
   graph): an entry in the harness's own declaration (`<harness>.json`, e.g.
   `cat-harness.json`), under `directories`, with an `id`, the `path`, its
   `graphTypologies` and a one-line `description`.
2. **A folder inside a folder the harness already declares**: declared
   **from within**, in that directory's own `<dir>.json` (as
   `skills/skills.json` declares `voices`). This is not a matter of taste:
   `check:layout-norms` fails a new top-level entry whose path lies inside
   another declared directory (the pairs it only lists are a baseline). Add `subgraph: true` when the new folder is a subgraph
   of the INSTANCE rather than a part of its parent's graph (bean `cmsl`:
   `voices` is the first kind, `beans.json`'s `defs` the second).
3. **A folder that holds ONE node** — one Tool, one voice: it is **not
   declared**. It sits inside the declared graph that owns the node and is
   found through that graph's reader, as each voice folder is found by its
   `voice.json`. Never declare one Tool's folder as a `tools` directory:
   discovery loads ONE `tools/index.ts` per harness and refuses a harness
   that declares two `tools` directories. The Tool's folder is found by
   that `index.ts` (`toolsFromFolders`), as each voice is by its `voice.json`.

Both declared forms say what a folder holds the same way, by its
`graphTypologies`: a from-within entry names its own kind (`voices.json`
declares `vendors` as `voice-vendors`), it does not inherit its parent's.

**One folder per Tool, always** (bean `tdir`, owner 2026-10-15: *"migrate
all impacted repos … to sub-folders as is strongly recommended behaviour"*).
A Tool is declared in `tools/<id>/<id>.ts` inside the harness's declared
`tools` directory: the folder, the file stem and the Tool's `id` are one
string, the file default-exports `toolFactory((t) => defineTool({ … }))`, and
the folder also holds whatever is that Tool's alone (its script, fixtures,
tests). `tools/index.ts` only calls `toolsFromFolders`
(`schemas/tool-folders.ts`), which refuses a folder that breaks the
convention, so discovery is unchanged. Helpers several Tools share go in
`tools/lib.ts`, which declares no Tool. A `defineTool(` anywhere else in the
directory is an inline declaration, and `check:tools` reports it.

The source stays TypeScript on the default branch; the JSON-LD of each Tool
(`<base>/tools/<id>.jsonld`, its own IRI) and the JSON Schema of each I/O type
are written when the site is published, never committed.

Why declaring is part of the process, not tidying:

- **A folder nothing declares is a folder nothing reasons about.** No check
  catches it for you: `check:undeclared-files` sweeps the repository root
  only, so a new undeclared folder inside a harness passes it.
- **Declared directories are what can be mounted and exported.** A remote
  mount lays down declared directories only, so an undeclared code folder is
  missing downstream (cat-harness-tools' `tools/` was, until 2026-10-14). A
  harness's package `exports` are derived from its declared, shipped `code`
  directories (`check:package-exports`, bean `7pvn`), so an undeclared one
  cannot be imported by package name either. A from-within id cannot yet be
  mounted on its own: `remote-mount` reads top-level entries only (bean
  `2j2r`, needed by `mo75`).
- `bun run cat harness:dirs` then materialises every declared directory, so
  the folder exists in every checkout rather than only in yours.

### Step 5: Test the Tool

Author fast unit tests in `cat-harness-tools/test/` or whole-checkout integration tests in `cat-harness-tools/test/coordinator/`:
- Test valid arguments and expected outputs.
- Test invalid inputs and error handling.
- Verify with `bun test cat-harness-tools/test/<tool>.test.ts` or `bun test cat-harness-tools/test/coordinator/<test>.test.ts`.

### Step 6: Validate Reachability and Skill Coverage

Run verification gates:
```sh
bun run cat check:tools             # verifies satisfies edges match existing skills & types agree
bun run cat tools:coverage          # checks automated coverage across skills
```

---

## 3. Toolchain & Ambient Types Isolation

1. **Ambient Type Definitions**:
   If a tool uses external libraries that lack TypeScript types (such as Moddle
   XML parsers like `bpmn-moddle` or `dmn-moddle`), place ambient declaration
   files in `cat-harness-tools/types/*.d.ts` and include them in
   `cat-harness-tools/tsconfig.json`. Never place tools-specific ambient types
   in content-only subgraphs.

2. **Bundled Dependencies**:
   Tools declare their runtime dependencies in `cat-harness-tools/package.json`.
   Subgraphs that only import schemas or markdown docs must not list tool runtime
   dependencies in their manifests.

3. **Packaging**:
   The tools package is packaged and published using `bun pm pack` as
   `@litlfred/cat-harness-tools`.
