#!/usr/bin/env bun
/**
 * A command that reads a declaration carries the `folio` registration.
 *
 * ## The class this exists to close
 *
 * `folio` is registered by CORE as a load-time side effect
 * (`schemas/folio-graph-kind.ts`: *"a layer that cannot render must not own
 * the renderable kind"*). So whether `readDeclaration` accepts this
 * repository's own declaration depends on whether the process has imported
 * that module — an **import-order property of the process**, not a property
 * of the declaration, which is perfectly valid either way.
 *
 * PR #465 was the first thing in this repository's history to declare a folio
 * graph, and it hit this five times in a row, each fix correct and incomplete.
 * It enumerated **52 modules** calling a declaration reader without the
 * import, put four options to the owner, and **merged with the item
 * unchecked**. Bean `q2wn` re-opened it by measurement: the partition's import
 * regex could not see a bare side-effect import, so all 25 of those edges were
 * invisible to the one tool that computes this repo's module graph.
 *
 * ## Why a gate rather than the import everywhere
 *
 * Option 3 on #465 was "import in all 52 modules", and its stated cost was
 * right: *"an ugly diff, and module 53 brings it straight back"*. What makes
 * this different is not the diff, it is **who** carries it:
 *
 * - a **library** must not, because a library's edge is inherited by every
 *   module importing it — `repo-root.ts` alone has 92 importers — and the
 *   harness may not depend on core. Those seven imports are removed.
 * - a **command** may, because a command is a composition root: it assembles
 *   the layers it wires together, which is what makes it the command.
 *
 * That leaves exactly one way for module 53 to bring the class back — a new
 * command that forgets — and this check is that door. It derives both sides
 * rather than listing them, so a command declares itself by being runnable.
 *
 * ## What it cannot see, said rather than implied
 *
 * Reachability is over the IMPORT graph, so a command reaching
 * `readDeclaration` only through a dynamic `import()` built from a computed
 * string is invisible here. That is the same limit
 * `scripts/partition/engine.ts` states for its own edge set, and the honest
 * direction: this under-reports rather than inventing an edge.
 *
 * @module scripts/check-composition-roots
 */
import { readdirSync, readFileSync, type Dirent } from "node:fs";
import { join, relative } from "node:path";

import { extractSpecifiers, isCompositionRoot } from "./partition/engine.ts";
import { SPEC } from "./partition/instance-rules.ts";

/** The registration a command must carry to read a declaration safely. */
const REGISTRATION = "schemas/folio-graph-kind.ts";

/**
 * Declaration readers, by the name a caller writes.
 *
 * `readDeclaration` is where the throw lives (`schemas/cat-harness.ts:3811`);
 * the others reach it and are what callers actually name. Matched on the
 * CALL rather than on importing `cat-harness.ts`, because a module importing
 * it for types alone needs no registration and flagging it would be noise.
 */
const READERS = [
  "readDeclaration",
  "resolveDirectories",
  "directoriesForGraph",
  "directoryForGraph",
  "instanceDirectoryForGraph",
  "folioDir",
  "kgDirectories",
  "resolveSkillDirs",
];

const ROOT = SPEC.root;

function rel(abs: string): string {
  return relative(ROOT, abs).replace(/\\/g, "/");
}

/** Every `.ts` under the scanned roots, as repo-relative paths. */
function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".ts") && !e.name.endsWith(".d.ts")) out.push(p);
    }
  };
  for (const r of SPEC.scanRoots) walk(join(ROOT, r));
  return out;
}

export interface RootVerdict {
  /** Repo-relative path of the command. */
  file: string;
  /** The module in its closure that calls a reader — itself, or an import. */
  via: string;
  /** The reader named there. */
  reader: string;
}

export interface Report {
  /** Commands found at all — the denominator. */
  roots: number;
  /** Commands that reach a declaration read. */
  reading: number;
  /** ...of those, the ones missing the registration. */
  missing: RootVerdict[];
  /** Source files that could not be read, never folded into a pass. */
  unreadable: string[];
}

export function check(): Report {
  const files = sourceFiles();
  const src = new Map<string, string>();
  const unreadable: string[] = [];
  for (const f of files) {
    try {
      src.set(f, readFileSync(f, "utf8"));
    } catch {
      unreadable.push(rel(f));
    }
  }

  // Resolve every edge once, so the walk below is over a map rather than the
  // filesystem.
  const edges = new Map<string, string[]>();
  for (const [f, text] of src) {
    const outs: string[] = [];
    for (const spec of extractSpecifiers(text)) {
      if (!spec.startsWith(".")) continue;
      const base = join(f, "..", spec);
      for (const c of [base, `${base}.ts`, base.replace(/\.js$/, ".ts"), join(base, "index.ts")]) {
        if (src.has(c)) {
          outs.push(c);
          break;
        }
      }
    }
    edges.set(f, outs);
  }

  const readerIn = (text: string): string | undefined =>
    READERS.find((r) => new RegExp(`\\b${r}\\s*\\(`).test(text));

  const roots = [...src].filter(([, t]) => isCompositionRoot(t));
  const missing: RootVerdict[] = [];
  let reading = 0;

  for (const [f] of roots) {
    // Breadth-first over the closure, stopping at the first reader found.
    const seen = new Set<string>([f]);
    const queue = [f];
    let hit: { via: string; reader: string } | undefined;
    let registers = false;
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const text = src.get(cur)!;
      if (rel(cur).endsWith(REGISTRATION)) registers = true;
      if (!hit) {
        const r = readerIn(text);
        if (r) hit = { via: rel(cur), reader: r };
      }
      for (const n of edges.get(cur) ?? []) if (!seen.has(n)) { seen.add(n); queue.push(n); }
    }
    if (!hit) continue;
    reading++;
    if (!registers) missing.push({ file: rel(f), via: hit.via, reader: hit.reader });
  }

  return { roots: roots.length, reading, missing, unreadable };
}

export function format(r: Report): string {
  const lines = [`Composition roots (${r.roots} command(s) found)`, ""];
  // The denominator first. A check with no subjects is not a check that
  // passed, and this one goes quiet in exactly that way if `isCompositionRoot`
  // ever stops matching.
  lines.push(`  ${r.reading} of ${r.roots} reach a declaration read.`);
  if (r.unreadable.length > 0) {
    lines.push("", `  ⚠ ${r.unreadable.length} source file(s) COULD NOT BE READ — this run is not clean:`);
    for (const u of r.unreadable.slice(0, 10)) lines.push(`      ${u}`);
  }
  if (r.missing.length === 0) {
    lines.push("", "✓ every command that reads a declaration carries the `folio` registration");
    return lines.join("\n");
  }
  lines.push("", `✗ ${r.missing.length} command(s) read a declaration without registering \`folio\`:`);
  for (const m of r.missing) {
    lines.push(`    ${m.file}`);
    lines.push(`      reaches ${m.reader}() via ${m.via}`);
  }
  lines.push(
    "",
    "  Each will throw `unknown graph kind \"folio\"` on this repository's own",
    "  declaration, depending only on what else the process happened to import.",
    `  Add:  import "<relative>/${REGISTRATION.replace(/\.ts$/, ".js")}";`,
    "",
    "  A LIBRARY must not carry it — its edge is inherited by every importer and",
    "  the harness may not depend on core. Only a command may. See bean `q2wn`.",
  );
  return lines.join("\n");
}

if (import.meta.main) {
  const r = check();
  console.log(format(r));
  process.exit(r.missing.length > 0 || r.unreadable.length > 0 ? 1 : 0);
}
