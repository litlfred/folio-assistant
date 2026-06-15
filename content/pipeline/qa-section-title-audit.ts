/**
 * Title coherence + conciseness audit (chapter-scoped).
 *
 * A title is the reader's table-of-contents view of the story. The
 * ownership hierarchy is: the **paper** is responsible for its
 * **chapter** titles, each **chapter** for its **section** titles, and
 * each **section** for its **subsection** titles. Every title should be
 * (a) **short and concise** and (b) **coherent read against its
 * responsible parent** — meaningful without hunting for context.
 *
 * Two failure classes are audited:
 *
 *  1. **Mechanical / conciseness defects** (flagged automatically):
 *     - `split-artifact`  — trailing ` : <tag>` left by the
 *       chapter-restructure auto-split (e.g. "Confinement operator
 *       selection : vs", "… genus completeness : characterisation").
 *       Meaningless out of context. **Hard defect** (exit 1).
 *     - `trailing-colon`  — title ends in a bare `:`. **Hard.**
 *     - `empty`           — blank title. **Hard.**
 *     - `too-long`        — over the length budget. **Soft warn.**
 *     - `compound`        — three-plus comma-joined concepts
 *       ("A, B, C, and D"); not concise. **Soft warn.**
 *     - `duplicate` / `sibling-echo` — same title twice / "X : tag"
 *       beside a sibling "X". **Soft warn.**
 *
 *  2. **Voice / story coherence** (needs an agent): does each title,
 *     read against its responsible parent, follow the narrative and
 *     stand on its own? Emitted as a per-chapter worklist
 *     (`todos/section-title-audit.json`, gitignored) carrying the
 *     parent chain so an agent can adjudicate. Criterion id:
 *     `voice-section-title-coherence` (chapter-scoped; see the note in
 *     `qa-criteria-registry.ts`). This audit is NOT a per-block sweep
 *     criterion — titles live in chapter manifests, not blocks.
 *
 * Math (`$…$`) is stripped before colon/length checks so signature
 * titles ("… $\mathrm{st} : \mathbf{No} \to \mathbb{R}$") and
 * legitimate subtitles ("Mass predictions: per-particle …") are not
 * mis-flagged — only the trailing ` : <tag>` artifact / bare trailing
 * colon are hard defects.
 *
 * Usage:
 *   bun run content/pipeline/qa-section-title-audit.ts             # all papers
 *   bun run content/pipeline/qa-section-title-audit.ts <paper>     # one paper
 *   bun run content/pipeline/qa-section-title-audit.ts --report-only   # never exit 1
 *   bun run content/pipeline/qa-section-title-audit.ts --max-len 64    # length budget
 *   bun run content/pipeline/qa-section-title-audit.ts --toc <chapter> # TOC tree + weights
 *   # record an agent title-coherence verdict (after --write-sidecar):
 *   bun run content/pipeline/qa-section-title-audit.ts --verdict \
 *       --chapter <paper>/<chapterDir> --list                         # show slots
 *   bun run content/pipeline/qa-section-title-audit.ts --verdict \
 *       --chapter <paper>/<chapterDir> --section <label|title> \
 *       --result <pass|revise|accept> [--reviewer <who>] [--note "why"]
 *   # add --thorough to either --write-sidecar or --verdict to gate
 *   # staleness on per-section subtree hashes (contained block content +
 *   # descendant subsections — all (grand*)-children), not just the
 *   # chapter manifest. Use it consistently for write + regen.
 *
 * @module content/pipeline/qa-section-title-audit
 */
import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

process.chdir(resolve(import.meta.dir, "..", ".."));

const args = process.argv.slice(2);
const reportOnly = args.includes("--report-only");
// Emit committed per-paper sidecars (machine findings + manifest hash +
// agent-review slots). CI regenerates then `git diff --exit-code`s them,
// so a chapter-manifest edit without a re-run fails CI ("sidecars stale").
const writeSidecar = args.includes("--write-sidecar");
// `--toc [chapterDir]` prints the chapter→section→subsection tree with
// per-node block weights + framework flags (for dynamic reorg review),
// then exits.
const tocIdx = args.indexOf("--toc");
const tocMode = tocIdx >= 0;
const tocChapter = tocMode && args[tocIdx + 1] && !args[tocIdx + 1].startsWith("--") ? args[tocIdx + 1] : undefined;
const maxLenIdx = args.indexOf("--max-len");
const MAX_LEN = maxLenIdx >= 0 ? Number(args[maxLenIdx + 1]) : 72;
const paperArg = args.find((a) => !a.startsWith("--") && a !== String(MAX_LEN));

// `--verdict` records (or lists) an agent title-coherence verdict in a
// chapter's committed sidecar agent slot. Run `--write-sidecar` first to
// create the slots, then:
//   --verdict --chapter <paper>/<dir> --list
//   --verdict --chapter <paper>/<dir> --section <label|title>
//             --result <pass|revise|accept> [--reviewer <who>] [--note "why"]
// The verdict is stamped with the live manifest hash, so it carries
// forward through later `--write-sidecar` runs only while the chapter
// manifest is unchanged (a title edit re-opens the slot as `pending`).
const verdictMode = args.includes("--verdict");
const vList = args.includes("--list");
const valOf = (flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : undefined;
};
const vChapter = valOf("--chapter");
const vSection = valOf("--section");
const vResult = valOf("--result");
const vReviewer = valOf("--reviewer") ?? "agent";
const vNote = valOf("--note");
const VERDICT_RESULTS = new Set(["pass", "revise", "accept"]);
// `--thorough` deepens the staleness gate: instead of hashing only the
// chapter manifest, each section/subsection gets a Merkle subtree hash
// that also folds in the *content* of every block it references
// (.md/.ts/.lean) and, recursively, all its descendant subsections — so a
// title-coherence verdict goes stale when any (grand*)-child drifts, not
// only when the manifest is edited. Applies to both `--write-sidecar` and
// `--verdict`; use it consistently for the two (a slot records its
// `stale_mode`, and carry-forward gates each slot against the matching
// hash, so mixing modes never silently mis-validates).
const thorough = args.includes("--thorough");

// Trailing ` : <one lowercase word>` is the auto-split artifact. The
// observed tag vocabulary; any single lowercase trailing word matches.
const SPLIT_TAGS = new Set([
  "vs", "generation", "characterisation", "characterization",
  "comparison", "construction", "unique", "foundations", "continued",
]);

type FlagKind =
  | "split-artifact" | "trailing-colon" | "empty"            // hard
  | "too-long" | "compound" | "duplicate" | "sibling-echo";  // soft
const HARD: ReadonlySet<FlagKind> = new Set(["split-artifact", "trailing-colon", "empty"]);

interface TitleNode {
  paper: string;
  chapterDir: string;
  /** depth 0 = chapter title, 1 = section, 2+ = subsection. */
  depth: number;
  title: string;
  label?: string;
  /** Title of the responsible parent (paper title for a chapter,
   *  chapter title for a section, section title for a subsection). */
  parent: string;
}
interface Flag { node: TitleNode; kind: FlagKind; detail: string }

function stripMath(t: string): string {
  return t.replace(/\$\$[\s\S]*?\$\$/g, "§").replace(/\$[^$]*\$/g, "§");
}

function findChapterManifests(paperFilter?: string): string[] {
  const out: string[] = [];
  const contentDir = resolve("content");
  for (const paper of readdirSync(contentDir)) {
    if (paperFilter && paper !== paperFilter) continue;
    // Skip tooling / dependency dirs — only paper dirs hold chapters.
    if (paper === "node_modules" || paper === "schema" || paper === "pipeline" || paper.startsWith(".")) continue;
    const paperPath = join(contentDir, paper);
    try { if (!statSync(paperPath).isDirectory()) continue; } catch { continue; }
    let dirs: string[];
    try { dirs = readdirSync(paperPath); } catch { continue; }
    for (const ch of dirs) {
      const chPath = join(paperPath, ch);
      let isDir = false;
      try { isDir = statSync(chPath).isDirectory(); } catch { /* */ }
      if (!isDir) continue;
      const manifest = join(chPath, `${ch}.ts`);
      if (existsSync(manifest)) out.push(manifest);
    }
  }
  return out;
}

function walkSections(
  sections: unknown,
  ctx: { paper: string; chapterDir: string },
  depth: number,
  parent: string,
  acc: TitleNode[],
): void {
  if (!Array.isArray(sections)) return;
  for (const s of sections as Array<Record<string, unknown>>) {
    if (s && typeof s.title === "string") {
      acc.push({ ...ctx, depth, title: s.title, label: typeof s.label === "string" ? s.label : undefined, parent });
      if (Array.isArray(s.subsections)) walkSections(s.subsections, ctx, depth + 1, s.title, acc);
    }
    // SectionRef (no inline title) — its title lives in a referenced
    // file and is audited when present as an inline section.
  }
}

function flagNode(n: TitleNode): Flag[] {
  const flags: Flag[] = [];
  const bare = stripMath(n.title).trim();
  if (bare === "") { flags.push({ node: n, kind: "empty", detail: "blank title" }); return flags; }
  const split = bare.match(/\s:\s+([a-z][a-z-]*)$/);
  if (split) {
    const known = SPLIT_TAGS.has(split[1]) ? " (known auto-split tag)" : "";
    flags.push({ node: n, kind: "split-artifact", detail: `trailing " : ${split[1]}"${known} — meaningless out of context` });
  } else if (/:$/.test(bare)) {
    flags.push({ node: n, kind: "trailing-colon", detail: 'title ends in ":"' });
  }
  if (bare.length > MAX_LEN) flags.push({ node: n, kind: "too-long", detail: `${bare.length} chars > ${MAX_LEN}` });
  const commas = (bare.match(/,/g) ?? []).length;
  if (commas >= 2) flags.push({ node: n, kind: "compound", detail: `${commas + 1} comma-joined concepts — not concise` });
  return flags;
}

interface StructFlag {
  paper: string;
  chapterDir: string;
  kind: "over-weight" | "band" | "only-child" | "depth";
  detail: string;
  label?: string;
  title?: string;
}

/** Total descendant block count of a section / subsection node. */
function sectionWeight(s: Record<string, unknown>): number {
  const direct = Array.isArray(s.blocks) ? (s.blocks as unknown[]).length : 0;
  const subs = Array.isArray(s.subsections)
    ? (s.subsections as Record<string, unknown>[])
    : [];
  return direct + subs.reduce((a, ss) => a + sectionWeight(ss), 0);
}

/** Structure pass — framework P1–P6 (docs/structural-framework.md). */
function auditStructure(
  paper: string,
  chapterDir: string,
  sectionsRaw: unknown,
  out: StructFlag[],
): void {
  const secs = (Array.isArray(sectionsRaw) ? sectionsRaw : []).filter(
    (s): s is Record<string, unknown> =>
      !!s && typeof (s as Record<string, unknown>).title === "string",
  );
  if (secs.length === 0) return;
  if (secs.length === 1)
    out.push({ paper, chapterDir, kind: "only-child", title: secs[0].title as string, detail: "chapter has only 1 section — flatten or split (P2)" });
  const weights = secs.map(sectionWeight);
  const mean = weights.reduce((a, b) => a + b, 0) / weights.length;
  secs.forEach((s, i) => {
    const w = weights[i];
    const subs = (Array.isArray(s.subsections) ? s.subsections : []).filter(
      (x): x is Record<string, unknown> => !!x && typeof (x as Record<string, unknown>).title === "string",
    );
    const hasSubs = subs.length > 0;
    const base = { paper, chapterDir, label: s.label as string | undefined, title: s.title as string };
    if (secs.length >= 3 && w > 2.5 * mean && !hasSubs)
      out.push({ ...base, kind: "over-weight", detail: `${w} blocks > 2.5× peer mean (${mean.toFixed(1)}) — split into subsections (P4)` });
    if (!hasSubs && (w < 3 || w > 18))
      out.push({ ...base, kind: "band", detail: `${w} blocks outside the 3–18 section band (P3)` });
    if (hasSubs && subs.length === 1)
      out.push({ ...base, kind: "only-child", detail: "section has only 1 subsection — flatten (P2)" });
    for (const ss of subs) {
      if (Array.isArray(ss.subsections) && (ss.subsections as unknown[]).length > 0)
        out.push({ paper, chapterDir, label: ss.label as string | undefined, title: ss.title as string, kind: "depth", detail: "subsection has sub-subsections — exceeds depth 3 (P1)" });
      const sw = sectionWeight(ss);
      if (sw < 2 || sw > 12)
        out.push({ paper, chapterDir, label: ss.label as string | undefined, title: ss.title as string, kind: "band", detail: `subsection ${sw} blocks outside the 2–12 band (P3)` });
    }
  });
}

function hashContent(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 12);
}

/** Existing sibling source files for a block root-name. The chapter
 *  manifest lists block *root-names* (siblings share the root), so a
 *  block "foo" resolves to foo.md / foo.ts / foo.lean in the chapter dir. */
function blockSourceFiles(paper: string, chapterDir: string, root: string): string[] {
  const out: string[] = [];
  for (const ext of ["md", "ts", "lean"]) {
    const p = resolve("content", paper, chapterDir, `${root}.${ext}`);
    if (existsSync(p)) out.push(p);
  }
  return out;
}

/** Merkle-style staleness hash of a section/subsection node. The node's
 *  own (title | label | block-root list) is always folded in; every
 *  referenced block's source-file content is folded in too, and the
 *  recursion folds each child subsection's hash — so the digest changes
 *  when any (grand*)-child drifts (a block .md/.ts/.lean edit, a moved
 *  block, a renamed/retitled subsection). Populates `acc` (nodeKey → hash)
 *  for every node in the subtree; returns this node's hash. */
function subtreeStalenessHash(
  node: Record<string, unknown>,
  paper: string, chapterDir: string,
  acc: Map<string, string>,
): string {
  const title = typeof node.title === "string" ? node.title : "";
  const label = typeof node.label === "string" ? node.label : "";
  const blocks = Array.isArray(node.blocks) ? (node.blocks as unknown[]).map(String) : [];
  let h = `${title} ${label} ${blocks.join(",")}`;
  for (const b of blocks)
    for (const f of blockSourceFiles(paper, chapterDir, b)) {
      try { h += ` ${b}=${hashContent(readFileSync(f, "utf8"))}`; } catch { /* unreadable block file */ }
    }
  const subs = Array.isArray(node.subsections)
    ? (node.subsections as Record<string, unknown>[]).filter((s) => s && typeof s.title === "string")
    : [];
  for (const s of subs) h += ` sub(${subtreeStalenessHash(s, paper, chapterDir, acc)})`;
  const digest = hashContent(h);
  acc.set(label || title, digest);
  return digest;
}

/** Per-node staleness keys for a chapter. Normal mode: every node shares
 *  the chapter-manifest hash (legacy gate, no block I/O). `thorough`:
 *  each node gets its own subtree hash (descendants + block source files),
 *  falling back to the manifest hash for nodes not found in the tree. */
function chapterStaleKeys(
  paper: string, chapterDir: string, sections: unknown, thoroughMode: boolean,
): { manifestHash: string; keyOf: (nodeKey: string) => string } {
  const manifestPath = resolve("content", paper, chapterDir, `${chapterDir}.ts`);
  let manifestHash = "";
  try { manifestHash = hashContent(readFileSync(manifestPath, "utf8")); } catch { /* */ }
  if (!thoroughMode) return { manifestHash, keyOf: () => manifestHash };
  const perNode = new Map<string, string>();
  if (Array.isArray(sections))
    for (const s of sections as Record<string, unknown>[])
      if (s && typeof s.title === "string") subtreeStalenessHash(s, paper, chapterDir, perNode);
  return { manifestHash, keyOf: (k) => perNode.get(k) ?? manifestHash };
}

/** Emit committed per-paper title/structure audit sidecars. The
 *  `machine` block is regenerated each run; `agent` review verdicts are
 *  carried forward only while their staleness key is unchanged. The gate
 *  is the chapter-manifest hash by default, or — under `--thorough` — a
 *  per-node subtree hash that also folds in contained block content +
 *  descendant subsections (see `subtreeStalenessHash`). Each slot records
 *  its `stale_mode`, and carry-forward gates each slot against the hash
 *  matching its own mode, so a thorough verdict is never silently
 *  re-validated by a shallow run (or vice-versa). */
function writeSidecars(
  allNodes: TitleNode[], flags: Flag[], structureFlags: StructFlag[],
  rawSectionsByChapter: Map<string, unknown>, thoroughMode: boolean,
): void {
  const byPaper = new Map<string, Map<string, TitleNode[]>>();
  for (const n of allNodes) {
    const p = byPaper.get(n.paper) ?? (byPaper.set(n.paper, new Map()), byPaper.get(n.paper)!);
    const arr = p.get(n.chapterDir) ?? (p.set(n.chapterDir, []), p.get(n.chapterDir)!);
    arr.push(n);
  }
  for (const [paper, chapters] of byPaper) {
    const sidecarPath = resolve("content", paper, "section-title-audit.qa.json");
    let prev: { chapters?: Record<string, { agent?: Record<string, { reviewed_hash?: string; stale_mode?: string }> }> } = {};
    try { prev = JSON.parse(readFileSync(sidecarPath, "utf8")); } catch { /* first run */ }
    const out: Record<string, unknown> = { criterion: "voice-section-title-coherence", paper, chapters: {} };
    const chOut = out.chapters as Record<string, unknown>;
    for (const [chapterDir, nodes] of [...chapters].sort((a, b) => a[0].localeCompare(b[0]))) {
      const prevAgent = prev?.chapters?.[chapterDir]?.agent ?? {};
      // Compute subtree hashes if this run is thorough OR any carried
      // verdict was reviewed in thorough mode (so we can re-validate it).
      const anyThorough = thoroughMode || Object.values(prevAgent).some((s) => s?.stale_mode === "thorough");
      const sections = rawSectionsByChapter.get(`${paper}/${chapterDir}`);
      const { manifestHash, keyOf } = chapterStaleKeys(paper, chapterDir, sections, anyThorough);
      const titleFindings = flags
        .filter((f) => f.node.paper === paper && f.node.chapterDir === chapterDir && f.kind !== "duplicate" && f.kind !== "sibling-echo")
        .map((f) => ({ kind: f.kind, label: f.node.label, title: f.node.title, detail: f.detail }));
      const struct = structureFlags
        .filter((f) => f.paper === paper && f.chapterDir === chapterDir)
        .map((f) => ({ kind: f.kind, label: f.label, title: f.title, detail: f.detail }));
      const agent: Record<string, unknown> = {};
      for (const n of nodes.filter((x) => x.depth >= 1)) {
        const key = n.label ?? n.title;
        const carried = prevAgent[key];
        // Gate each carried slot against the hash matching ITS recorded
        // mode; legacy slots without `stale_mode` are manifest-mode (the
        // pre-thorough default) — NOT this run's mode, else a --thorough
        // run would spuriously stale every manifest-mode verdict. A
        // brand-new slot adopts this run's mode.
        const mode = carried ? (carried.stale_mode ?? "manifest") : (thoroughMode ? "thorough" : "manifest");
        const sk = mode === "thorough" ? keyOf(key) : manifestHash;
        agent[key] = carried && carried.reviewed_hash === sk
          ? carried
          : { title: n.title, depth: n.depth, result: "pending", reviewer: null, reviewed_hash: null, stale_mode: thoroughMode ? "thorough" : "manifest" };
      }
      chOut[chapterDir] = {
        manifest_hash: manifestHash,
        stale_mode: thoroughMode ? "thorough" : "manifest",
        machine: { title_defects: titleFindings, structure_findings: struct },
        agent,
      };
    }
    writeFileSync(sidecarPath, JSON.stringify(out, null, 2) + "\n");
  }
}

/** Agent-verdict writer: stamp a title-coherence result into the chapter
 *  sidecar's `agent[key]` slot (or list the chapter's slots with
 *  `--list`). Slots are created by `writeSidecars`; this updates only the
 *  agent half, leaving the machine findings untouched. The verdict carries
 *  forward through later `--write-sidecar` runs only while the live
 *  manifest hash matches `reviewed_hash`. */
async function recordVerdict(): Promise<void> {
  if (!vChapter || !vChapter.includes("/")) {
    console.error("--verdict requires --chapter <paper>/<chapterDir>");
    process.exit(2);
  }
  const [paper, chapterDir] = vChapter.split("/");
  const sidecarPath = resolve("content", paper, "section-title-audit.qa.json");
  let sidecar: {
    chapters?: Record<string, {
      manifest_hash?: string;
      machine?: { title_defects?: unknown[]; structure_findings?: unknown[] };
      agent?: Record<string, Record<string, unknown>>;
    }>;
  };
  try { sidecar = JSON.parse(readFileSync(sidecarPath, "utf8")); }
  catch {
    console.error(`no sidecar at ${sidecarPath}\n  → run \`--write-sidecar\` first to create the agent slots.`);
    process.exit(2);
  }
  const chEntry = sidecar.chapters?.[chapterDir];
  if (!chEntry?.agent) {
    console.error(`no agent slots for "${chapterDir}" in ${sidecarPath}\n  → run \`--write-sidecar\` first.`);
    process.exit(2);
  }
  const agent = chEntry.agent;

  if (vList) {
    const keys = Object.keys(agent);
    console.log(`agent title-coherence slots — ${paper}/${chapterDir} (${keys.length}):`);
    for (const k of keys) {
      const s = agent[k];
      console.log(`  [${(s.result as string) ?? "pending"}] ${k}  "${s.title as string}"`
        + (s.reviewer ? `  · by ${s.reviewer as string}` : "")
        + (s.note ? `  — ${s.note as string}` : ""));
    }
    const md = chEntry.machine ?? {};
    const findings = [...(md.title_defects ?? []), ...(md.structure_findings ?? [])] as Array<Record<string, unknown>>;
    if (findings.length) {
      console.log(`  machine findings to weigh (${findings.length}):`);
      for (const f of findings) console.log(`    [${f.kind as string}] ${(f.label ?? f.title) as string}: ${f.detail as string}`);
    }
    return;
  }

  if (!vSection || !vResult) {
    console.error("--verdict needs --section <label|title> --result <pass|revise|accept>  (or --list)");
    process.exit(2);
  }
  if (!VERDICT_RESULTS.has(vResult))
    console.error(`  note: result "${vResult}" is not one of pass|revise|accept (recorded anyway)`);

  // Resolve the slot key: exact label first, else exact title.
  let key: string | undefined = vSection in agent ? vSection : undefined;
  if (!key) key = Object.keys(agent).find((k) => agent[k].title === vSection);
  if (!key) {
    console.error(`section "${vSection}" not found in ${chapterDir}. Available slots:`);
    for (const k of Object.keys(agent)) console.error(`  ${k}  "${agent[k].title as string}"`);
    process.exit(2);
  }

  // Compute the staleness key the verdict is gated on — manifest hash, or
  // (under --thorough) this section's subtree hash incl. block content +
  // descendant subsections. Import the manifest for its section tree.
  const manifestPath = resolve("content", paper, chapterDir, `${chapterDir}.ts`);
  let sections: unknown = [];
  try {
    const mod = (await import(pathToFileURL(manifestPath).href)) as { default?: { sections?: unknown } };
    sections = mod.default?.sections ?? [];
  } catch { /* fall back to manifest-only hash */ }
  const { manifestHash, keyOf } = chapterStaleKeys(paper, chapterDir, sections, thorough);
  const staleKey = keyOf(key);
  if (chEntry.manifest_hash && chEntry.manifest_hash !== manifestHash)
    console.error(`  warning: sidecar machine block is stale (hash ${chEntry.manifest_hash} ≠ live ${manifestHash}); re-run \`--write-sidecar\`${thorough ? " --thorough" : ""} to refresh findings.`);

  agent[key] = {
    ...agent[key],
    result: vResult,
    reviewer: vReviewer,
    note: vNote ?? agent[key].note ?? null,
    reviewed_hash: staleKey,
    stale_mode: thorough ? "thorough" : "manifest",
    reviewed_at: new Date().toISOString(),
  };
  writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2) + "\n");
  console.log(`✓ verdict: ${paper}/${chapterDir} · ${key} → ${vResult} (by ${vReviewer})${vNote ? ` — ${vNote}` : ""}`);
  console.log(`  reviewed_hash ${staleKey} · mode ${thorough ? "thorough" : "manifest"} → ${sidecarPath}`);
}

/** Print the chapter→section→subsection TOC with block weights +
 *  framework (P1–P6) flags, for dynamic reorg review. */
async function printToc(chapterFilter: string | undefined): Promise<void> {
  for (const m of findChapterManifests(undefined)) {
    const chapterDir = dirname(m).split("/").pop() ?? "?";
    if (chapterFilter && chapterDir !== chapterFilter) continue;
    const paper = dirname(dirname(m)).split("/").pop() ?? "?";
    let mod: { default?: Record<string, unknown> };
    try { mod = (await import(pathToFileURL(resolve(m)).href)) as { default?: Record<string, unknown> }; }
    catch { continue; }
    const ch = mod.default;
    if (!ch || typeof ch.title !== "string") continue;
    const sf: StructFlag[] = [];
    auditStructure(paper, chapterDir, ch.sections, sf);
    const flag = (s: Record<string, unknown>) => {
      const fl = sf.filter((f) => (f.label && f.label === s.label) || (!f.label && f.title === s.title)).map((f) => f.kind);
      return fl.length ? `  ⚑ ${[...new Set(fl)].join(", ")}` : "";
    };
    const secs = (Array.isArray(ch.sections) ? ch.sections : []).filter((s): s is Record<string, unknown> => !!s && typeof (s as Record<string, unknown>).title === "string");
    const total = secs.reduce((a, s) => a + sectionWeight(s), 0);
    console.log(`\n═══ ${ch.title}  (${paper}/${chapterDir})  ·  ${secs.length} sections, ${total} blocks ═══`);
    secs.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.title}   [${sectionWeight(s)}]${flag(s)}`);
      const subs = (Array.isArray(s.subsections) ? s.subsections : []).filter((x): x is Record<string, unknown> => !!x && typeof (x as Record<string, unknown>).title === "string");
      subs.forEach((sub, j) => console.log(`       ${i + 1}.${j + 1} ${sub.title}   [${sectionWeight(sub)}]${flag(sub)}`));
    });
  }
}

async function main(): Promise<void> {
  if (tocMode) { await printToc(tocChapter); return; }
  if (verdictMode) { await recordVerdict(); return; }
  const manifests = findChapterManifests(paperArg);
  const allNodes: TitleNode[] = [];
  const importErrors: string[] = [];
  const structureFlags: StructFlag[] = [];
  // Raw section trees per chapter (`paper/chapterDir` → sections), used by
  // writeSidecars for thorough per-node subtree-hash staleness.
  const rawSectionsByChapter = new Map<string, unknown>();
  // Cache paper titles for the chapter-title parent context.
  const paperTitle = new Map<string, string>();

  for (const m of manifests) {
    const chapterDir = dirname(m).split("/").pop() ?? "?";
    const paper = dirname(dirname(m)).split("/").pop() ?? "?";
    if (!paperTitle.has(paper)) {
      const pm = resolve("content", paper, `${paper}.ts`);
      try {
        const pmod = (await import(pathToFileURL(pm).href)) as { default?: { title?: string } };
        paperTitle.set(paper, pmod.default?.title ?? paper);
      } catch { paperTitle.set(paper, paper); }
    }
    let mod: { default?: Record<string, unknown> };
    try { mod = (await import(pathToFileURL(resolve(m)).href)) as { default?: Record<string, unknown> }; }
    catch (e) { importErrors.push(`${chapterDir}: ${(e as Error).message.split("\n")[0]}`); continue; }
    const ch = mod.default;
    if (!ch || typeof ch.title !== "string") continue;
    // depth 0: the chapter title (paper is responsible).
    allNodes.push({ paper, chapterDir, depth: 0, title: ch.title, label: typeof ch.label === "string" ? ch.label : undefined, parent: paperTitle.get(paper)! });
    walkSections(ch.sections, { paper, chapterDir }, 1, ch.title, allNodes);
    auditStructure(paper, chapterDir, ch.sections, structureFlags);
    rawSectionsByChapter.set(`${paper}/${chapterDir}`, ch.sections);
  }

  const flags: Flag[] = [];
  for (const n of allNodes) flags.push(...flagNode(n));

  // Duplicate + sibling-echo, scoped within a chapter's own sections.
  const byChapter = new Map<string, TitleNode[]>();
  for (const n of allNodes) {
    const key = `${n.paper}/${n.chapterDir}`;
    const arr = byChapter.get(key) ?? (byChapter.set(key, []), byChapter.get(key)!);
    arr.push(n);
  }
  for (const [, nodes] of byChapter) {
    const counts = new Map<string, number>();
    for (const n of nodes) { if (n.depth === 0) continue; const b = stripMath(n.title).trim(); counts.set(b, (counts.get(b) ?? 0) + 1); }
    for (const n of nodes) {
      if (n.depth === 0) continue;
      const b = stripMath(n.title).trim();
      if ((counts.get(b) ?? 0) > 1) flags.push({ node: n, kind: "duplicate", detail: `appears ${counts.get(b)}× in chapter` });
      const sp = b.match(/^(.*\S)\s:\s+[a-z][a-z-]*$/);
      if (sp && counts.has(sp[1])) flags.push({ node: n, kind: "sibling-echo", detail: `"${sp[1]}" is itself a sibling section — confirmed auto-split pair` });
    }
  }

  // ── Report ────────────────────────────────────────────────────
  const hard = flags.filter((f) => HARD.has(f.kind));
  const soft = flags.filter((f) => !HARD.has(f.kind));
  console.log(`section-title audit: ${allNodes.length} titles across ${byChapter.size} chapters (max-len ${MAX_LEN})`);
  if (importErrors.length) console.log(`  (${importErrors.length} manifest(s) un-importable — skipped)`);

  const show = (label: string, fs: Flag[]) => {
    if (!fs.length) { console.log(`  ✓ no ${label}`); return; }
    console.log(`\n  ${fs.length} ${label}:`);
    for (const f of fs) {
      const d = f.node.depth === 0 ? "chapter" : f.node.depth === 1 ? "section" : "subsection";
      console.log(`   [${f.kind}] ${f.node.paper}/${f.node.chapterDir} (${d}${f.node.label ? " " + f.node.label : ""})\n      "${f.node.title}"  — ${f.detail}\n        ↳ parent: "${f.node.parent}"`);
    }
  };
  show("HARD defect(s)", hard);
  show("conciseness/duplicate warning(s)", soft);

  // ── Structure pass (framework P1–P6) ──────────────────────────
  if (structureFlags.length === 0) {
    console.log("  ✓ no structure findings (depth / band / balance)");
  } else {
    console.log(`\n  ${structureFlags.length} structure finding(s) [framework P1–P6]:`);
    for (const f of structureFlags)
      console.log(`   [${f.kind}] ${f.paper}/${f.chapterDir}${f.label ? " (" + f.label + ")" : ""}\n      "${f.title ?? ""}"  — ${f.detail}`);
  }

  // ── Agent worklist (ordered titles + parent chain per chapter) ─
  mkdirSync("todos", { recursive: true });
  const worklist = [...byChapter.entries()].map(([key, nodes]) => ({
    chapter: key,
    chapterTitle: nodes.find((n) => n.depth === 0)?.title ?? "",
    titles: nodes.map((n) => ({
      depth: n.depth,
      kind: n.depth === 0 ? "chapter" : n.depth === 1 ? "section" : "subsection",
      title: n.title,
      label: n.label,
      parent: n.parent,
      flags: flags.filter((f) => f.node === n).map((f) => f.kind),
    })),
  }));
  writeFileSync("todos/section-title-audit.json", JSON.stringify(
    { generated: new Date().toISOString(), max_len: MAX_LEN, total_titles: allNodes.length, hard_defects: hard.length, soft_warnings: soft.length, structure_findings: structureFlags, chapters: worklist }, null, 2));
  console.log(`\n  worklist → todos/section-title-audit.json (review each title for conciseness + coherence against its parent)`);

  if (writeSidecar) {
    writeSidecars(allNodes, flags, structureFlags, rawSectionsByChapter, thorough);
    console.log(`  sidecars → content/<paper>/section-title-audit.qa.json (machine findings + agent slots${thorough ? "; thorough subtree-hash gate" : ""}; CI git-diff-gated)`);
  }

  const depthViolations = structureFlags.filter((f) => f.kind === "depth").length;
  if ((hard.length > 0 || depthViolations > 0) && !reportOnly) process.exit(1);
}

main();
