#!/usr/bin/env bash
# generate-readme.sh — Regenerates README.md from the current project state.
#
# Usage: ./scripts/generate-readme.sh [--check]
#   --check   Print diff and exit non-zero if README.md would change (for CI)
#
# This script assembles README.md from static prose and dynamic sections
# derived from the actual file tree.  Metadata extraction (paper titles,
# chapter order, Lean modules, etc.) is handled by readme-metadata.ts
# via bun, avoiding GNU-specific shell tools for portability.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

OUT="$(mktemp)"
trap 'rm -f "$OUT"' EXIT

# ── Extract metadata via bun (portable) ─────────────────────────────────────

META="$(bun run scripts/readme-metadata.ts)"

# jq-free JSON access via bun one-liners
json_get() { echo "$META" | bun -e "const d=JSON.parse(await Bun.stdin.text()); $1"; }

# ── Helpers ──────────────────────────────────────────────────────────────────

section() { printf '\n## %s\n\n' "$1" >> "$OUT"; }
subsection() { printf '\n### %s\n\n' "$1" >> "$OUT"; }
line() { printf '%s\n' "$1" >> "$OUT"; }

# ── Header ───────────────────────────────────────────────────────────────────

cat >> "$OUT" << 'HEADER'
# Quantum Observable Universe

[![Lean CI](https://github.com/litlfred/qou/actions/workflows/lean_ci.yml/badge.svg)](https://github.com/litlfred/qou/actions/workflows/lean_ci.yml)
[![Build & Publish](https://github.com/litlfred/qou/actions/workflows/publish.yml/badge.svg)](https://github.com/litlfred/qou/actions/workflows/publish.yml)
[![Blueprint](https://github.com/litlfred/qou/actions/workflows/blueprint.yml/badge.svg)](https://github.com/litlfred/qou/actions/workflows/blueprint.yml)

A formal mathematics paper exploring the Quantum Observable Universe (QOU)
with machine-checked **Lean 4** formalization, **content-object architecture**
(TypeScript + Markdown + Lean triples), and an interactive **Folio Assistant**
platform for browsing, reviewing, and exploring the work.
HEADER

# ── Content-Object Architecture ──────────────────────────────────────────────

section "Content-Object Architecture"

cat >> "$OUT" << 'ARCH'
Content is organized as **atomic knowledge units** — each definition,
theorem, remark, or proof is a self-contained file triple:

```
content/<paper>/<chapter>/
  <block>.ts    ← Typed manifest (kind, label, dependencies, metadata)
  <block>.md    ← Narrative content (Markdown + TeX snippets)
  <block>.lean  ← Lean 4 formalization (when required by block kind)
```

The pipeline validates content objects against Zod schemas, checks
cross-references, renders LaTeX, and runs AST validation before
producing `chapters/*.tex` output. LaTeX is a **rendering target**,
not the source of truth.
ARCH

# ── Papers ───────────────────────────────────────────────────────────────────

section "Papers"

line "The repository hosts multiple papers as a **folio**:"
line ""
line "| Paper | Directory |"
line "|-------|-----------|"

json_get '
  for (const p of d.papers)
    console.log(`| ${p.title} | \`content/${p.dir}/\` |`);
' >> "$OUT"

# ── Chapters (main paper) ───────────────────────────────────────────────────

section "Chapters (Quantum Observable Universe)"

line "Each chapter is also published as a standalone PDF on GitHub Pages —"
line "useful when you only want the relevant slice of the paper rather than"
line "the full document.  The **PDF** column links to the standalone build;"
line "the **Directory** column links to the source content objects."
line ""
line "| # | Directory | Title | Standalone PDF |"
line "|---|-----------|-------|----------------|"

json_get '
  const PAGES = "https://litlfred.github.io/qou/papers/quantum-observable-universe";
  // Front-matter group is bundled into a single front-matter.pdf
  const FRONT_MATTER = new Set(["introduction", "notation", "glossary", "index-of-definitions"]);
  let chNum = 0;
  for (const c of d.chapters) {
    let pdfCell = "—";
    if (c.kind === "chapter") {
      if (FRONT_MATTER.has(c.dir)) {
        pdfCell = `[front-matter.pdf](${PAGES}/chapters/front-matter.pdf)`;
      } else {
        pdfCell = `[${c.dir}.pdf](${PAGES}/chapters/${c.dir}.pdf)`;
      }
      console.log(`| ${chNum} | \`${c.dir}/\` | ${c.title} | ${pdfCell} |`);
      chNum++;
    } else if (c.kind === "appendix") {
      pdfCell = `[${c.dir}.pdf](${PAGES}/${c.dir}.pdf)`;
      console.log(`| App | \`${c.dir}/\` | ${c.title} | ${pdfCell} |`);
    } else {
      // index-of-definitions etc — bundled in front-matter
      if (FRONT_MATTER.has(c.dir)) {
        pdfCell = `[front-matter.pdf](${PAGES}/chapters/front-matter.pdf)`;
      }
      console.log(`| — | \`${c.dir}/\` | ${c.title} | ${pdfCell} |`);
    }
  }
' >> "$OUT"

# ── Lean 4 Formalization ────────────────────────────────────────────────────

section "Lean 4 Formalization"

cat >> "$OUT" << 'LEAN_INTRO'
The Lean 4 formalization lives in `content/quantum-observable-universe/lean/`
and covers the key mathematical structures, mass-parameter derivations,
knot theory, and categorical constructions from the manuscript.
LEAN_INTRO

subsection "Coverage"

line ""
line "Live snapshot from \`scripts/lean-coverage.ts\` (regenerated on each \`main\` publish):"
line ""
line "| Block kind | Total | With Lean sibling | Fully formalized |"
line "|------------|------:|------------------:|-----------------:|"

json_get '
  const c = d.leanCoverage;
  if (!c) {
    console.log("| _coverage stats unavailable_ | — | — | — |");
  } else {
    console.log(`| Provable claims (theorem/lemma/proposition/corollary) | ${c.provable_total} | ${c.provable_with_lean} | **${c.provable_sorry_free} sorry-free (${c.provable_percent}%)** |`);
    console.log(`| Conjectures (open) | ${c.conjectures_total} | ${c.conjectures_with_lean} | **${c.conjectures_class_axiomatized} class-axiomatised (${c.conjectures_percent}%)** |`);
    console.log(`| Definitions | ${c.definitions_total} | ${c.definitions_with_lean} | — |`);
  }
' >> "$OUT"

line ""
line "Class-axiomatised conjectures follow the conditional-class convention"
line "(CLAUDE.md §3b): the conjecture is encoded as a Lean \`class\` with"
line "explicit field axioms, and downstream theorems carry the class as an"
line "\`[Instance]\` hypothesis — so dependent results are fully verified"
line "by Lean modulo a single, named, axiomatised input."

subsection "Modules"

line "| Module | Source |"
line "|--------|--------|"

json_get '
  for (const m of d.leanModules)
    console.log(`| \`${m.name}\` | \`${m.source}\` |`);
' >> "$OUT"

subsection "Knot Registry"

cat >> "$OUT" << 'KNOTS'
Every knot in the formalization carries an Alexander-Briggs index, a QOU
physical identity, a SnapPy-verified hyperbolic volume, and a persistent
link to [The Knot Atlas](http://katlas.org/).

| A-B Index | QOU Identity | Hyperbolic Volume | Knot Atlas |
|-----------|-------------|-------------------|------------|
| 0₁ | Neutrino (SU(2) vacuum) | 0 | [0_1](http://katlas.org/wiki/0_1) |
| 3₁ | Electron (Gen 1, B₃ monodromy) | 0 (torus knot) | [3_1](http://katlas.org/wiki/3_1) |
| 4₁ | Muon (Gen 2, mass residue) | 2.0298832128 | [4_1](http://katlas.org/wiki/4_1) |
| 0₁ | Photon (exceptional divisor) | 0 | [0_1](http://katlas.org/wiki/0_1) |

Every `sorry` in the Lean source is preceded by a `-- Ref: [key] url` comment
linking to the foundational reference that would resolve the gap.
KNOTS

# ── Folio Assistant ──────────────────────────────────────────────────────────

section "Folio Assistant"

cat >> "$OUT" << 'FOLIO'
The **Folio Assistant** (`folio-assistant/`) is the platform layer providing:

- **MCP Server** — Model Context Protocol server for AI-assisted editing
- **Viewer** — Web-based paper viewer with paper/visualizer toggle
- **Chat UI** — Assistant interface with role-based access (reader/collaborator/owner)
- **Simulators** — Interactive WebGL/HTML visualizations
- **Feedback** — User feedback collection (committed to main)
- **Auth** — Dual OAuth (Google viewers + GitHub collaborators)
FOLIO

subsection "Interactive Simulators"

line "| Simulator | File |"
line "|-----------|------|"

json_get '
  for (const s of d.simulators)
    console.log(`| ${s.name} | \`${s.file}\` |`);
' >> "$OUT"

# ── Published Artefacts ──────────────────────────────────────────────────────

section "Published Artefacts (GitHub Pages)"

cat >> "$OUT" << 'ARTEFACTS'
> **Note:** If GitHub Pages is not publicly accessible, use the GitHub source
> links in the rightmost column to browse the repository directly.

| Artefact | GitHub Pages | GitHub Source |
|----------|-------------|--------------|
| Folio landing page | [index.html](https://litlfred.github.io/qou/) | [home_page/](https://github.com/litlfred/qou/tree/main/home_page) |
| Paper viewer | [papers/quantum-observable-universe/](https://litlfred.github.io/qou/papers/quantum-observable-universe/) | [folio-assistant/viewer/](https://github.com/litlfred/qou/tree/main/folio-assistant/viewer) |
| Paper (PDF) | [quantum-observable-universe.pdf](https://litlfred.github.io/qou/quantum-observable-universe.pdf) | [content/](https://github.com/litlfred/qou/tree/main/content) |
| Blueprint (interactive graph) | [blueprint/](https://litlfred.github.io/qou/blueprint/) | [blueprint/src/](https://github.com/litlfred/qou/tree/main/blueprint/src) |
| Lean interactive docs | [docs/](https://litlfred.github.io/qou/docs/) | [content/.../lean/](https://github.com/litlfred/qou/tree/main/content/quantum-observable-universe/lean) |
| Schema docs (TypeDoc) | [schema-docs/](https://litlfred.github.io/qou/schema-docs/) | [content/schema/](https://github.com/litlfred/qou/tree/main/content/schema) |
| Axiom / Gap Report | [axiom-report.txt](https://litlfred.github.io/qou/axiom-report.txt) | [.github/scripts/](https://github.com/litlfred/qou/tree/main/.github/scripts) |
| Dependency Graph | [dependency-graph.svg](https://litlfred.github.io/qou/dependency-graph.svg) | CI-generated |
| Proof Objects Manifest | [proof-objects.json](https://litlfred.github.io/qou/proof-objects.json) | CI-generated |
| Glossary | [glossary.json](https://litlfred.github.io/qou/glossary.json) | CI-generated |
| Feature branch drafts | [drafts/](https://litlfred.github.io/qou/drafts/) | CI-generated |
ARTEFACTS

# ── Project Structure ────────────────────────────────────────────────────────

section "Project Structure"

cat >> "$OUT" << 'STRUCTURE'
| Path | Description |
|------|-------------|
| `content/` | **Authoritative content objects** (`.ts` + `.md` + `.lean` triples) |
| `content/schema/` | Type system, Zod schemas, builder functions |
| `content/pipeline/` | Validation, rendering, build pipelines |
| `content/quantum-observable-universe/` | Main paper — chapters, appendices, Lean |
| `content/quantum-observable-universe/lean/` | Lean 4 formalization (`lakefile.toml`, `QOU/`) |
| `folio-assistant/` | Platform: MCP server, auth, viewer, chat UI, simulators |
| `folio-assistant/viewer/` | Paper viewer SPA + Pyodide cache |
| `folio-assistant/simulators/` | Interactive HTML/WebGL visualizations |
| `blueprint/src/` | LeanBlueprint source (dependency graph) |
| `deploy/` | Remote MCP deployment (Docker Compose, Caddy, auth) |
| `.github/workflows/` | CI/CD: Lean build, publish, blueprint, deploy |
| `.claude/skills/` | AI skill definitions (local + synced packages) |
| `scripts/` | Build, setup, and utility scripts |
| `main.tex` | LaTeX preamble (rendering target, not source of truth) |
| `chapters/*.tex` | Generated LaTeX chapters (from content pipeline) |
| `references.bib` | Auto-generated BibTeX (source: `content/schema/references.ts`) |
| `home_page/` | Jekyll landing page for GitHub Pages |
STRUCTURE

# ── CI/CD ────────────────────────────────────────────────────────────────────

section "CI/CD Workflows"

line "| Workflow | Purpose |"
line "|----------|---------|"

json_get '
  for (const w of d.workflows)
    console.log(`| \`${w.file}\` | ${w.description} |`);
' >> "$OUT"

# ── Building ─────────────────────────────────────────────────────────────────

section "Building"

cat >> "$OUT" << 'BUILD'
### Content validation and LaTeX generation

```bash
bun install                          # Install dependencies (root + content/)
bun run validate                     # Validate content objects
bun run build:content                # Generate chapters/*.tex from content objects
```

### Paper compilation

```bash
latexmk -pdf main.tex               # Compile PDF from generated LaTeX
```

### Lean formalization

```bash
cd content/quantum-observable-universe/lean
lake build                           # Build all Lean modules
```

### Folio Assistant

```bash
cd folio-assistant && bun install
bun run start                        # Start MCP server
bun run start:http                   # Start in HTTP mode
```

### Schema documentation

```bash
bun run build:docs                   # Generate TypeDoc documentation
```
BUILD

# ── License ──────────────────────────────────────────────────────────────────

section "License"

cat >> "$OUT" << 'LICENSE'
[![CC BY 4.0](https://licensebuttons.net/l/by/4.0/88x31.png)](https://creativecommons.org/licenses/by/4.0/)

This work is licensed under a
[Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).

You are free to share and adapt this material for any purpose, provided
appropriate credit is given, a link to the license is provided, and any
changes made are indicated.
LICENSE

# ── Write or check ──────────────────────────────────────────────────────────

if [[ "${1:-}" == "--check" ]]; then
  if diff -q README.md "$OUT" > /dev/null 2>&1; then
    echo "README.md is up to date."
    exit 0
  else
    echo "README.md is out of date. Run: ./scripts/generate-readme.sh"
    diff README.md "$OUT" || true
    exit 1
  fi
fi

cp "$OUT" README.md
echo "README.md updated."
