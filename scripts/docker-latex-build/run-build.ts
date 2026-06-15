// Node.js-compatible wrapper for content/pipeline/build.ts
// Works around Bun-specific import.meta.dir/main used in the pipeline.
// Usage: npx tsx scripts/docker-latex-build/run-build.ts [same args as pipeline/build.ts]

import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(__dirname, "../../content");
const pipelineDir = join(contentDir, "pipeline");

// Dynamic import of the build modules (use file:// URLs for Node ESM compat)
const buildMod = await import(pathToFileURL(join(pipelineDir, "build.ts")).href);
const { buildPaper } = buildMod;
const mainTexMod = await import(pathToFileURL(join(pipelineDir, "generate-main-tex.ts")).href);
const { generateMainTex, generateStandaloneAppendixTex } = mainTexMod;

// ── Argument parsing with bounds checking ───────────────────────
function getArgValue(args: string[], flag: string, fallback: string): string {
  const idx = args.indexOf(flag);
  if (idx < 0) return fallback;
  if (idx + 1 >= args.length) {
    console.error(`Error: ${flag} requires a value`);
    process.exit(1);
  }
  return args[idx + 1];
}

const args = process.argv.slice(2);
const defaultPaper = join(contentDir, "quantum-observable-universe/quantum-observable-universe.ts");
// Only treat args[0] as a paper path if it's a positional argument (not a --flag).
// Allows `npx tsx run-build.ts --generate-main --main-out main.tex` with no path.
const firstPositional = args[0] && !args[0].startsWith("--") ? args[0] : undefined;
const paperPath = resolve(firstPositional || defaultPaper);
const outDir = resolve(getArgValue(args, "--out-dir", join(contentDir, "../chapters")));
const printMode = getArgValue(args, "--print-mode", "compact") as "formal" | "compact";
const noInlineRefs = args.includes("--no-inline-refs");

console.log(`Building paper: ${paperPath}`);
console.log(`Output dir: ${outDir}`);
console.log(`Print mode: ${printMode}${noInlineRefs ? " (inline refs disabled)" : ""}\n`);

const result = await buildPaper(paperPath, {
  printMode,
  compactInlineRefs: !noInlineRefs,
});

// Print issues
for (const issue of result.issues) {
  const icon = issue.level === "error" ? "✗" : issue.level === "warning" ? "⚠" : "ℹ";
  console.log(`  ${icon} ${issue.message}`);
}

// Write chapter output
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

for (const [num, latex] of result.chapters) {
  const slug = result.chapterSlugs.get(num);
  const filename = slug ? `${slug}.tex` : `chapter-${num}.tex`;
  const outPath = join(outDir, filename);
  writeFileSync(outPath, latex);
  console.log(`  → ${outPath}`);
}

// Generate main.tex from paper manifest + shared preamble
if (args.includes("--generate-main")) {
  const mainOutPath = resolve(getArgValue(args, "--main-out", "main.tex"));
  const preamblePath = resolve(getArgValue(args, "--preamble", join(contentDir, "../latex/preamble.tex")));
  const chaptersDir = getArgValue(args, "--chapters-dir", "chapters/");

  const paperMod = await import(pathToFileURL(paperPath).href);
  const paperData = paperMod.default;

  const excludeChapterIndices = new Set(result.appendixChapters.keys());

  const mainTex = generateMainTex(paperData, {
    preamblePath,
    chaptersDir,
    chapterSlugs: result.chapterSlugs,
    excludeChapterIndices,
    phantomLabels: result.appendixPhantomLabels,
  });
  writeFileSync(mainOutPath, mainTex);
  console.log(`\n  → main.tex: ${mainOutPath}`);

  // Generate standalone .tex files for each appendix chapter
  const mainOutDir = dirname(mainOutPath);
  for (const [_idx, info] of result.appendixChapters) {
    const appendixTex = generateStandaloneAppendixTex(paperData, info.slug, info.title, {
      preamblePath,
      chaptersDir,
    });
    const appendixPath = join(mainOutDir, `standalone-${info.slug}.tex`);
    writeFileSync(appendixPath, appendixTex);
    console.log(`  → standalone: ${appendixPath}`);
  }
}

const errorCount = result.issues.filter((i: { level: string }) => i.level === "error").length;
const warnCount = result.issues.filter((i: { level: string }) => i.level === "warning").length;
console.log(`\n${errorCount ? "✗" : "✓"} Build complete — ${errorCount} error(s), ${warnCount} warning(s)`);

if (errorCount > 0) {
  process.exit(1);
}
