---
name: latex-build-cache
user_invocable: true
description: >
  LaTeX build performance. What works is the iterative loop: a static
  preflight with no TeX, Tool `tex-install` for an engine, Tool
  `paper-feature-build` for quick changed-chapter builds with latexdiff,
  then the full build. Both standard preamble/diagram caching mechanisms
  failed on this toolchain, so there is no cache; read the negative
  results before attempting one.
allowed-tools: Read Bash Grep Glob Edit Write Skill
---

# LaTeX build performance — findings + what's safe

## The iterative loop (use this)

Each step is a Tool node, so `tools` search finds it. Run them from the FOLIO.

| step | Tool | needs TeX | what it tells you |
|---|---|---|---|
| 1. static preflight | `latex-preflight` | no | the fatal-pdflatex classes (undefined control sequence, duplicate `\newcommand`, math-delimiter imbalance) in seconds |
| 2. engine | `tex-install` | — | installs TeX Live once per container (~5 GB, 10-20 min, run in the background) |
| 3. feature build | `paper-feature-build` | for the PDFs | only the changed chapters, typeset, plus a colored and a plain latexdiff of each |
| 4. full build | `paper-latex-build` | yes | the whole paper |

Step 3 is the one that makes iteration cheap: on a 2,900-block paper the
render takes about 20-40 s and each PDF compiles a few chapters, not the whole
book. Without a TeX engine it still renders and runs step 1's checks on the
result, and says it skipped the PDFs.

**The preamble.** The paper print template is
`folio-assistant-sci/adapters/paper/latex/paper-preamble.tex`: class,
packages, styling, and the macros the renderer emits. A folio's own
**notation** (its symbol macros, and any unicode map that encodes a font
choice) stays with the folio as a fragment, by default
`<paper dir>/latex/notation-preamble.tex`, appended after the template. See
the README beside it.

**The preload.** The platform pipeline is dependency-injected: the build throws
"Value registry not configured" unless the folio's preload has run (by default
`scripts/preload-registry.ts`). The preload must import the SAME platform
checkout the tool runs from, normally the folio's `folio-assistant/` link, or
it configures a different module instance and the build still throws.

A from-scratch compile re-parses the heavy preamble on **every latexmk
pass** and re-renders **every** diagram. Both standard caching mechanisms
failed on this toolchain (texlive-full 2023), so the default build is
plain inline-preamble + full latexmk.

## Negative results (read before re-attempting a cache)

| Attempt | Verdict | Why (verified on a real engine) |
|---------|---------|---------------------------------|
| **Preamble format** (`mylatexformat` → `paper.fmt`, `%&paper`) | ❌ unusable | mylatexformat **gobbles everything between `%&fmt` and `\begin{document}`** (log: *"start reading document on input line N (\begin{document})"*). That silently drops the per-paper **manifest macros** (`\mymacro` …) AND any per-render `\usepackage` (memoize). A format can only carry what's dumped from `latex/preamble.tex`; per-paper/per-render preamble content can't ride along. |
| **memoize** (per-box diagram cache) | ❌ unusable for tikzcd | This TeXLive's memoize **lacks its tikz library** (`\usetikzlibrary{memoize}` → "I did not find the tikz library"). The manual `memoize` environment **breaks tikzcd's `&` catcode**. Extraction is also a 2-pass tool needing `pdfrw` (python) or `PDF::API2` (perl) — installable, but moot without box marking. The diagrams are `tikzcd`, so no boxes cache. |
| **tikz externalization** (`\tikzexternalize`) | ❌ aborts on tikzcd | The `external` library collects until `\end{tikzpicture}`; tikzcd ends with `\end{tikzcd}` → *"File ended while scanning…"* fatal. Only hooks `tikzpicture`. |

**`standalone` externalization *works* but is NOT worth doing** (measured
2026-06-15, real engine): render each `tikzcd` to its own `.tex` → `.pdf`
→ `\includegraphics` compiles cleanly — but **diagrams are not the
bottleneck.** A `tikzcd` renders in ~0 ms (10 inline added 0 ms over
baseline, within noise); a `standalone` sub-build *costs* ~0.63 s of
pdflatex startup per diagram. Caching them is **net-negative.** Do NOT
pursue the standalone diagram cache.

> **Why not "cache each block's PDF and concatenate"?** LaTeX is a
> single-pass global typesetter — a block's numbering / pagination / refs
> depend on everything before it. Only *self-contained boxes* (diagrams)
> are cacheable — and per the measurements below, caching even those is
> net-negative here.

## Measured: where the build time actually is (2026-06-15, real engine)

Installed `texlive-full` via `install-tex.sh`; measured the real paper:

- **Real `main.tex`, one pass: 14.0 s.** Body (2944 blocks) ≈ **95%**;
  preamble/startup ≈ **5%** (~0.7 s); diagrams ≈ **0%**. The body is the
  single-pass global typeset — **intrinsically uncacheable** in pdflatex.
- Hotspots: the two math/table-heavy chapters — chapter-A (3.5 s) +
  chapter-B (3.3 s) ≈ 40%; the rest a ~1 s/chapter tail.
- **~50% of the body is the 2944 `\marginnote` annotations, not math:**
  one pass 19.5 s → **9.2 s** with `\marginnote` no-op'd (→ 8.9 s also
  dropping hyperlinks). Parallel per-chapter compile (4 cores) = **1.85 s**
  (~10×). Both are *preview* levers — the published PDF is unchanged. The
  first is wired as `FAST_PREVIEW=1` (see What works).
- `.fmt` saves only ~0.45 s of startup = **~3% of a pass** (and is broken
  on this preamble: per-doc macro drop + `^^H` unicode corruption). Skip.

**Whole-pipeline CI ranking** (LaTeX is NOT the dominant cost): witness
regen (Python, ~36 min, gated by `skip_witnesses`) ≫ `texlive-full`
install ×3 (~3–6 min) ≫ LaTeX compile (~2–3 min) ≫ bun render.

**The only real win — a prebuilt CI image**: run the TeX jobs in
`container: ghcr.io/<org>/<paper>-paper-builder` instead of installing
`texlive-full` in each job, and rebuild the image
(`paper-builder-image.yml`) on pushes touching its Dockerfile plus a
monthly cron.

## What works (use these)

| Tool | Role |
|------|------|
| [`cat-harness-tools/scripts/install-tex.sh`](../../../../cat-harness-tools/scripts/install-tex.sh) | Get a TeX engine into the sandbox. Idempotent. **This is how you compile/verify at all.** |
| [`adapters/paper/latex/feature-build.sh`](../../../adapters/paper/latex/feature-build.sh) (Tool `paper-feature-build`) | Quick draft: compiles ONLY the changed chapters (not the full paper) with the **inline** preamble, + per-chapter latexdiff (colored + plain). Speedup is from fewer chapters, not a format. **Sets `FAST_PREVIEW=1` by default** (margins off, ~2× on top). |
| **`FAST_PREVIEW=1`** env flag | Read by `generate-main-tex.ts`: no-ops `\marginnote`, skipping the 2944 per-block source/issue/Lean icons that cost **~50%** of compile (19.5 s → 9.2 s). Body byte-identical; **published builds leave it unset**. The biggest single *preview* speedup. |

## Getting a TeX engine in the sandbox

The sandbox usually ships **no `pdflatex`**. Run:

```bash
cat-harness-tools/scripts/install-tex.sh     # run with run_in_background: true (~5 GB, ~10-20 min)
```

It disables the firewalled launchpad PPAs (`ondrej/php`, `deadsnakes`),
installs `texlive-full` + `latexmk`, and verifies. `pdflatex` is usable
once `kpsewhich memoize.sty` returns a path.

## Quick feature build

```bash
folio-assistant/folio-assistant-sci/adapters/paper/latex/feature-build.sh \
  [--base origin/main] [--chapters slug1,slug2] [--paper <slug>] [--notation <file>] [--preload <file>]
# → build-feature/changed.pdf + per-chapter <c>.diff-color.pdf / .diff-plain.pdf
```

Uses the inline preamble (NOT `%&paper` — that gobbles manifest macros).
Cross-refs to chapters not in the build resolve to `??` (preview only).

## Verifying a build-pipeline change WITHOUT a TeX engine

CI is often `$`-billing-blocked (private-repo runs complete in 0s with
0 jobs = startup/billing failure, not code). Without `pdflatex`:

Run `paper-feature-build` anyway: it renders the paper, runs the preflight on
the result, and skips only the PDFs. By hand, from the folio:

```bash
P=folio-assistant
cat $P/folio-assistant-sci/adapters/paper/latex/paper-preamble.tex \
    <paper dir>/latex/notation-preamble.tex > /tmp/fb/preamble.tex
bun run --preload scripts/preload-registry.ts $P/cat-harness-tools/pipeline/build.ts \
  <paper dir>/<paper>.ts --out-dir /tmp/fb/chapters \
  --generate-main --main-out /tmp/fb/main.tex --preamble /tmp/fb/preamble.tex
bun run $P/folio-assistant-sci/pipeline/latex-preflight.ts /tmp/fb/main.tex   # exit 0 = no fatal classes
```

For a real compile, install TeX (above) and run
`latexmk -pdf main.tex`. The preflight gates every PR even when the heavy
compile job no-ops.

## References

- CI billing signature: `litlfred/qou` `AGENTS.md` §"CI billing failures".
