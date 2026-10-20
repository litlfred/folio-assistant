---
name: latex-compilation
user_invocable: true
description: >
  Compile LaTeX source documents into PDF using latexmk and pdflatex,
  with safe shell-escape isolation across trusted and untrusted environments.
allowed-tools: Bash run_command
---

# LaTeX Compilation Skill

## Purpose

Compile LaTeX source files (e.g. `main.tex`, standalone chapters, diffs) into
PDF documents using the platform's TeX toolchain (`latexmk`, `pdflatex`, and `biber`).

## Required Capabilities

- **`latex-compiler`**: Full LaTeX distribution with `latexmk` and `biber` installed
  and executable on the host path. Detection method: `latexmk --version`.

## Mechanisms & Tools

- **Tool Node:** `latexmk-compile` (satisfies `latex-compilation`).
- **Script:** `cat-harness-tools/scripts/latexmk-compile.sh <tex-file> [latexmk-args...]`

### Usage

```bash
# Monolithic paper compilation
cat-harness-tools/scripts/latexmk-compile.sh main.tex

# Quiet compilation with extra arguments
cat-harness-tools/scripts/latexmk-compile.sh diff.tex --quiet

# Standalone glossary / appendix compilation
cat-harness-tools/scripts/latexmk-compile.sh standalone-glossary.tex
```

## Security Boundary — Safe Shell-Escape

`-shell-escape` allows LaTeX to invoke arbitrary external binaries. To prevent
untrusted TeX payloads from executing code in CI environments:

1. **Trusted events (`push`, `workflow_dispatch`):** Shell-escape is enabled
   (`pdflatex -shell-escape %O %S`).
2. **Untrusted events (`pull_request`, `pull_request_target`, etc.):** Shell-escape
   is strictly disabled (`pdflatex %O %S`).

## Exit Code Contract

In adherence to the platform's exit code standard:

| Exit Code | Meaning | Condition |
|---|---|---|
| **0** | Success | Compilation succeeded and PDF was produced. |
| **1** | Failure / Error | Syntax errors, unresolved references, or fatal TeX errors. |
| **2** | Could-not-determine | Missing positional argument `<tex-file>`, or target file not found on disk. |
| **127** | Command not found | `latexmk` or `pdflatex` missing from the environment. |
