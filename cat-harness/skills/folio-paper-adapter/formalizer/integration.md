---
part-of: formalizer
description: >
  Detail for `formalizer`, split out of it so the parent stays a short entry
  point. NOT a skill of its own — reached through the parent.
---

# formalizer — how Lean output meets the rest of the folio

Where proofs land, how dependencies are added, and how a declaration connects
to its content block, the blueprint and the ontologist. Read when wiring a
finished proof in, not while writing it.

## Proof State Export

**Preferred (MCP):** Use `lean_goal` with the file path and line/column of the
sorry position. Returns structured goal state directly — no scripting needed.

## Integration with Ontologist

1. **Before formalization**: Ontologist runs, produces resolved `glossary.json`
2. **During formalization**: Formalizer checks every term against the glossary
3. **On type mismatch**: Formalizer reports back to Ontologist for re-evaluation
4. **After `lake build`**: If build fails, Ontologist re-scans for type conflicts

## Lean Output Structure

The Lean source tree lives **per paper** under `content/<paper>/lean/`,
with the repo's root `/lakefile.toml` aggregating every package into a
single Lake workspace. See [Root Lake workspace
(standardized)](#root-lake-workspace-standardized) below for the
canonical layout, package registry, and build commands. Do **not**
create a top-level `lean/` directory — that layout is deprecated.


## Adding New Dependencies

When a proof requires a library not in `lakefile.toml`:

1. Add the `[[require]]` entry to the relevant `lakefile.toml`
2. Run `lake update` — this fetches the dep into `.lake/packages/`
3. Run `lake exe cache get` if the dep has prebuilt oleans
4. Run `lake build` to verify everything compiles
5. **Only commit**: `lakefile.toml` and `lake-manifest.json`
6. **Never commit**: `.lake/`, `lake-packages/`, `build/` (all gitignored)

The MCP server will pick up new dependencies automatically after `lake build`.

### Toolchain compatibility (critical)

All `[[require]]` deps in a Lean project **must agree on the same
`lean-toolchain` version**. A mismatch causes build failures — often
cryptic Lake API errors in transitive deps like proofwidgets.

**Before adding or changing a dependency:**

1. Check the new dep's `lean-toolchain`:
   ```bash
   git ls-remote --refs <repo-url> HEAD
   # then check lean-toolchain at that commit, or:
   cat .lake/packages/<dep>/lean-toolchain
   ```
2. Compare against every other dep's toolchain:
   ```bash
   for pkg in .lake/packages/*/; do
     echo "$(basename $pkg): $(cat $pkg/lean-toolchain 2>/dev/null)"
   done
   ```
3. If they disagree, **do not proceed**. Find a compatible version.

**How to find a compatible version:**

- Check the new dep's `lake-manifest.json` for the Mathlib commit it
  was tested against:
  ```bash
  cat .lake/packages/<dep>/lake-manifest.json | grep -A3 mathlib
  ```
- Use **that same Mathlib commit hash** as `rev` in your `lakefile.toml`.
  This ensures all transitive deps (proofwidgets, batteries, aesop, etc.)
  resolve to versions tested together.

**Pin to commit hashes, not tags or branch names:**

- `rev = "master"` or `rev = "main"` — breaks when upstream updates.
- `rev = "v4.16.0"` — tag may target a different Lean version than
  you expect (Mathlib version numbers ≠ Lean version numbers).
- `rev = "f897ebcf72cd..."` — **preferred**. Reproducible and stable.

**When `lake update` changes `lean-toolchain` automatically:**

Lake overwrites `lean-toolchain` if a dep requires a different version.
This makes the file dirty and blocks `git pull`. Fix with
`git checkout lean-toolchain` before pulling, then let `lake update`
set it again.

### Recovery from broken `.lake/`

When dependency resolution is broken, **move** (don't delete) the
`.lake/` directory and re-resolve:

```bash
mv .lake /tmp/lake-backup-$(date +%s)
lake update
```

Using `mv` to `/tmp` is safer than `rm -rf` — you can recover if
the new resolution also fails.

### Root Lake workspace (standardized)

The repo is a **single Lake workspace** rooted at `/lakefile.toml`
with one `lean-toolchain` at the root.  Every paper is a Lake
**package** declared via `[[require]]`. Prefer running `lake` from
the **repo root**:

```bash
lake build           # build all papers
lake build MyPaper   # just one library
lake exe cache get   # Mathlib cache for the workspace
```

Per-paper `cd content/<paper>/lean && lake build` still works as a
standalone build path, but CI, the MCP `lean_build` tool, and the
skills here all prefer the root workspace.  The registry mapping
short-form package names to paper directories lives in
`folio-assistant/schemas/lean-packages.ts`.

## Blueprint Synchronization

The Formalizer must keep Lean declarations in sync with the blueprint:

1. Every Lean declaration referenced by `\lean{}` in
   `blueprint/src/content.tex` must exist in the Lean source
2. When a `sorry` is resolved, update the blueprint entry to add `\leanok`
3. When adding new theorems, add a corresponding entry to
   `blueprint/src/content.tex` with `\lean{}` and `\uses{}` edges
4. The `-- Ref: [key]` in Lean must match `\cite{key}` in the blueprint
   where applicable, ensuring bibliography consistency across both systems

## Content Object Integration

The authoritative source of truth is the **content object** triple, not raw
LaTeX. Every formalizable block is defined by three sibling files:

```
content/<paper>/<chapter>/
  <block-name>.ts    ← Manifest: kind, label, lean.ref, uses[]
  <block-name>.md    ← Narrative (markdown + TeX snippets)
  <block-name>.lean  ← Lean formalization (when required by kind)
```

### Block kind determines Lean requirements

| Block kind | Lean required? | Completeness criteria |
|-----------|---------------|----------------------|
| `definition` | **Yes** (enforced) | `.ts` has `lean.ref` (URI form `pkg:Decl`), sibling `.lean` exists, compiles |
| `theorem`, `lemma`, `proposition`, `corollary` | **Expected** (warning) | Same as definition |
| `example`, `remark`, `conjecture` | Optional | `.lean` only if author requests |
| `prose`, `equation`, `diagram` | N/A | No Lean needed |

### Workflow with content objects

1. **Read the `.ts` manifest** to get `lean.ref` (parse with
   `parseLeanRef()` from `folio-assistant/schemas/lean-packages.ts`
   to extract `{ package, decl, module, name }`) and `uses[]`
2. **Check `uses[]`** to understand upstream dependencies — ensure they're
   formalized first (dependency DAG ordering)
3. **Write/update the sibling `.lean` file** in `content/<paper>/<chapter>/`
4. **Update the `.ts` manifest**: set `lean.ref` to the package-qualified
   URI `"<pkg>:<Decl.Path>"` (per the project authoring conventions; legacy `lean.decl` /
   `lean.file` shape is removed)
5. **Run validation**: `bun run content/pipeline/validate.ts` to check
   cross-references and constraint rules

### Glossary terms in narrative `.md`

If you author or update the `.md` sibling alongside a Lean file, defined
terms (any slug in any block's `defines: [...]`) **must** be wrapped in
`:defterm[…]{#slug}` (canonical site) or `:refterm[…]{#slug}` (every
other mention). Do **not** add `\emph{}` or plain-text mentions of
defined terms. The Lean side is unaffected by this contract — Lean
declarations are linked via `lean.ref`, not glossary slugs — but the
validator will flag stray plain-text mentions in the narrative
companion. See `local/glossary-build`.

### The `uses[]` dependency graph

The `uses` field in `.ts` manifests forms a narrative dependency DAG.
**List only immediate neighbors** — if A depends on B and B depends on C,
A lists only B (not C). Transitive deps are derived by walking the graph.
Run `bun run pipeline/prune-transitive-deps.ts` to enforce this.

- When formalizing a theorem, walk the `uses[]` graph to check that all
  upstream blocks are already formalized (or have `sorry`-bridged stubs)
- The Lean import graph should mirror the `uses[]` graph
- Use `uses[]` to prioritize: formalize blocks with the most dependents first

