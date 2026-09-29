---
doc_id: arxiv-2602.16554v1
doc_title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION"
section_id: sec-004-autoinformalization
section_title: "Autoinformalization"
section_number: null
pages: 2-3
source_pdf: 2602.16554v1.pdf
source_sha256: 765ef86c1c0d4518
toc_source: outline
---
for expert review. This round-trip design ensures both machine-verified correctness and human-
verifiable semantic alignment. The framework employs a frontier LLM agent based on Claude Code
that engages multi-turn agentic interactions—iteratively refining outputs based on compiler feedback,
faithfulness checks, and tool-augmented exploration of Mathlib. Figure 1 illustrates the overall
architecture.
3.1
AUTOFORMALIZATION
Statement Extraction.
Given a LATEX paper, the agent first extracts all mathematical statements,
including definitions, theorems, lemmas, propositions, corollaries, and remarks into a structured
JSON representation. Each statement corresponds to a single mathematical result from the paper.
It includes a unique identifier (e.g., Def 1, Thm 2), the mathematical content in natural language,
explicit dependencies on other statements, and proof sketches when available. The extraction runs
2
LATEX
Paper
Extract
Formalize
Verify
Auto-formalization
Auto-
informalization
LATEX
Blueprint
Figure 1: MerLean architecture. Autoformalization extracts statements from a LATEX paper, formalizes
them into Lean 4, and verifies faithfulness. Autoinformalization translates the verified code back into
a human-readable LATEX blueprint or file.
for multiple iterations, where each pass reviews and refines the previous output: expanding vague
phrases like “by standard arguments” into concrete proof steps, adding missing intermediate lemmas,
and ensuring statements are ordered so that dependencies precede dependents.
Iterative Formalization.
For each extracted statement, the agent enters a compile-fix loop. It
generates Lean 4 code consisting of one or more declarations, writes them to the appropriate file
in the library structure, and compiles it. Each statement typically produces multiple declarations,
as the agent autonomously introduces auxiliary definitions, helper lemmas, and typeclass instances
to support the target result. If compilation fails, the error messages (type mismatches, unknown
identifiers, tactic failures, etc.) will be parsed and fed back to the agent, which analyzes the errors and
produces a corrected version. This loop continues until either the code compiles without errors and
warnings, or until it reaches a maximum attempt limit. During this process, the agent has access to
several diagnostic tools provided via lean-lsp-mcp, a Model Context Protocol server that exposes
Lean’s language server capabilities directly to the agent, lean goal for inspecting proof states at
specific positions, lean hover info for type signatures and documentation, and semantic search
tools (leansearch, loogle) for discovering relevant Mathlib lemmas. The agent can also grep
through Mathlib source code to find usage patterns and verify that referenced lemmas actually exist.
Faithfulness Checking.
Compilation alone is insufficient: an LLM can produce code that type-
checks but misrepresents the mathematics (e.g., proving a trivial statement instead of the intended
theorem) (Lin et al., 2025). After a successful build, MerLean reflects on whether the result matches
the original meaning. If yes, the program continues to the next statement; otherwise it continues to
attempt.
Axiom Handling.
