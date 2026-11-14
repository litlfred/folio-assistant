import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

// ── jh2j's remaining half: the TeX scripts that had no declared command ──
//
// Seven files, none with a `package.json` script, so nothing in the
// repository named them — `d308`'s premise exactly. Three are reachable and
// get a node; `render-latex` and `generate-block-tex` are LIBRARIES reached
// through their consumers (the criterion that already exempted
// `pdf-extract` and `pdf-structure` in `81t5`); and two are recorded on the
// bean rather than noded, for reasons that are findings:
//
//   `generate-main-tex.ts`  exits 1 having printed a STACK TRACE from its
//                           own source, so it has no refusal to document.
//   `latexmk-compile.sh`    compiles LaTeX with a security boundary
//                           (shell-escape only on trusted events) and NO
//                           skill in the corpus is about compiling. The
//                           `yean` shape — a mechanism with no skill —
//                           which is the owner's call to author.
//
// **The exit-2 contract across the family** (owner ruling on jh2j):
// `validate-tex`, `audit-tex-source`, and `headless-render-qc` (along with
// `latexmk-compile.sh` and `generate-main-tex.ts`) exit 2 on
// could-not-determine when run in the platform without content or when
// inputs are missing, matching `latex-preflight` and `latex-overfull`.
//
// None of the skills these satisfy carries an input contract, so
// `check-tools` cannot verify these edges against one. A clean run does not
// mean the edge was tested — the same caveat `l1-complete-check` records.

export default toolFactory((t) =>
  defineTool({
    id: "tex-snippet-validate",
    title: "TeX snippet validation (AST)",
    description:
      "Parse every `tex` snippet in a folio's blocks and report what will not compile — structural, not textual: it reads an AST rather than matching patterns. Complementary to `latex-preflight`, which gates a main.tex before a compile, and to `latex-overfull`, which reads a log after one.",
    install: { none: true },
    invoke: { shell: "bun run cat latex:validate" },
    io: {
      inputs: [
        { name: "paper", schema: t("Slug"), required: false, arg: { flag: "--paper" }, description: "One folio by slug. Absent, every folio the content root holds." },
        { name: "file", schema: t("RepoPath"), required: false, arg: { flag: "--file" }, description: "A single `.md` block, for the narrow case." },
        { name: "compile", schema: t("Flag"), required: false, arg: { flag: "--compile" }, description: "Also compile each snippet with pdflatex — needs a TeX distribution, which the base `requires` does NOT claim." },
        { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" } },
        { name: "warningsLog", schema: t("RepoPath"), required: false, arg: { flag: "--warnings-log" }, description: "Write a QA-compatible log to this path." },
      ],
      outputs: [
        { name: "report", schema: t("Text"), description: "Per snippet, what will not compile. With no folio to scan it reports `Files scanned: 0` and exits 2 (could-not-determine). Read the scanned count before reading the verdict." },
      ],
    },
    satisfies: ["latex-validation"],
    // Not an alternative to its two siblings (their I/O differs, so none is
    // derived). They are complementary, and the sequence says why:
    // preflight gates the source BEFORE a compile, this parses the snippets
    // IN it, overfull reads the log AFTER. Naming them alternatives would tell
    // a caller that running one covers another.
    requires: { runtime: ["bun"], network: false },
  }),
);
