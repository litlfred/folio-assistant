/**
 * A reference to an L1 source — in this instance, or in another one.
 *
 * @module folio-assistant-core/schemas/library-ref
 * @graphNode schema
 *
 * ## The problem this exists for was predicted before it happened
 *
 * Bean `r1lz`, 2026-09-19, while deciding that the WHO documents would leave
 * for a repository of their own:
 *
 * > *"a skill derived from a source text in another repo would cite evidence
 * > its own instance cannot resolve."*
 *
 * That is exactly what `scripts/check-voices.ts` does. It resolves a
 * `libraryId` as `library/<id>/sections/<sec>.md` **against the voice's own
 * instance root**, so moving `voices/who-*.json` into `who-style-guide/` breaks
 * every citation in all three — 25 rules whose provenance was the whole point
 * of writing them.
 *
 * ## Why not a relative path
 *
 * `../who-iris/library/...` would work today and hardcodes a checkout layout
 * into content. It is the practice `AGENTS.md` opens by warning against, and
 * this repository has already paid for it twice **this week**: a `../`-prefixed
 * declaration that silently resolved outside the checkout, and a test carrying
 * five hardcoded skill directories that had been wrong for months. The whole
 * reason `folio_init` writes a builder shim is so the path to another instance
 * is written down **once**.
 *
 * So a cross-instance reference names the instance by its **declared name**,
 * and where that instance sits is discovered from declarations.
 *
 * ## The three failures this must keep apart
 *
 * A resolver that returned `undefined` for all of these would make them one
 * problem, and they need three different fixes:
 *
 *   - the **instance** is not in this checkout → add it, or fix the name;
 *   - the instance is here but declares **no `library` graph** → it is not a
 *     corpus and the citation is pointing at the wrong kind of thing;
 *   - the library and graph resolve but the **section file** is absent → the
 *     document was never ingested, or the section id is wrong.
 *
 * **An unresolvable instance is never silently treated as local.** Falling back
 * would turn "you cited another repository's corpus and it is not here" into
 * "that section does not exist", which sends the next reader looking in the
 * wrong place entirely.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

/** A citation into L1 content. `instance` absent means *this* instance. */
export interface LibraryRef {
  /** The DECLARED NAME of the instance holding the corpus — not a path. */
  instance?: string;
  libraryId: string;
  sectionId?: string;
}

/** Why a reference did not resolve. Distinct cases, deliberately — see the module doc. */
export type LibraryRefFailure =
  | { kind: "unknown-instance"; instance: string; known: string[] }
  | { kind: "no-library-graph"; instance: string; instanceRoot: string }
  | { kind: "not-ingested"; instanceRoot: string; libraryId: string }
  | { kind: "no-such-section"; path: string };

export type LibraryRefResult =
  | { ok: true; instanceRoot: string; libraryDir: string; path: string }
  | { ok: false; failure: LibraryRefFailure };

/**
 * Every instance in a checkout, by its declared `name`.
 *
 * Discovery, not a list: each top-level directory holding a `harness.json` is
 * an instance, and its `name` is what a reference cites. A hardcoded table
 * would go stale at the next directory move, which is the failure this whole
 * module is avoiding.
 */
export function instanceRoots(repoRoot: string): Map<string, string> {
  const out = new Map<string, string>();
  const consider = (dir: string) => {
    const decl = join(dir, "harness.json");
    if (!existsSync(decl)) return;
    try {
      const name = JSON.parse(readFileSync(decl, "utf8"))?.name;
      if (typeof name === "string" && name.length > 0 && !out.has(name)) out.set(name, dir);
    } catch {
      // A declaration that does not parse is not this module's error to raise:
      // `readDeclaration` already throws on one, with a better message. Skipping
      // here keeps one bad file from making every OTHER instance unresolvable.
    }
  };
  consider(repoRoot);
  for (const e of readdirSync(repoRoot, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".")) continue;
    consider(join(repoRoot, e.name));
  }
  return out;
}

/**
 * Where an instance keeps its L1 corpus.
 *
 * Reads the instance's own declaration rather than assuming `library/`: an
 * instance may put it anywhere, and that is the entire premise of declared
 * directories. Returns `undefined` when the instance declares no `library`
 * graph at all, which is a different answer from "the directory is empty".
 */
export function libraryDirOf(instanceRoot: string): string | undefined {
  const decl = join(instanceRoot, "harness.json");
  if (!existsSync(decl)) return undefined;
  let dirs: Array<{ path?: string; graphs?: string[] }> = [];
  try {
    dirs = JSON.parse(readFileSync(decl, "utf8"))?.directories ?? [];
  } catch {
    return undefined;
  }
  const hit = dirs.find((d) => Array.isArray(d.graphs) && d.graphs.includes("library"));
  if (!hit?.path) return undefined;
  const abs = resolve(instanceRoot, hit.path);
  return existsSync(abs) ? abs : undefined;
}

/**
 * Resolve a reference to a file on disk.
 *
 * `sectionId` is optional: without it the reference names the DOCUMENT, and
 * `structure.json` is what proves it was ingested. With it, the section file
 * itself.
 */
export function resolveLibraryRef(
  ref: LibraryRef,
  fromInstanceRoot: string,
  repoRoot: string,
): LibraryRefResult {
  let instanceRoot = fromInstanceRoot;
  if (ref.instance !== undefined) {
    const roots = instanceRoots(repoRoot);
    const hit = roots.get(ref.instance);
    if (!hit) {
      return { ok: false, failure: { kind: "unknown-instance", instance: ref.instance, known: [...roots.keys()].sort() } };
    }
    instanceRoot = hit;
  }
  const libraryDir = libraryDirOf(instanceRoot);
  if (!libraryDir) {
    return {
      ok: false,
      failure: { kind: "no-library-graph", instance: ref.instance ?? "(this instance)", instanceRoot },
    };
  }
  if (!existsSync(join(libraryDir, ref.libraryId, "structure.json"))) {
    return { ok: false, failure: { kind: "not-ingested", instanceRoot, libraryId: ref.libraryId } };
  }
  const path = ref.sectionId
    ? join(libraryDir, ref.libraryId, "sections", `${ref.sectionId}.md`)
    : join(libraryDir, ref.libraryId, "structure.json");
  if (!existsSync(path) || !statSync(path).isFile()) {
    return { ok: false, failure: { kind: "no-such-section", path } };
  }
  return { ok: true, instanceRoot, libraryDir, path };
}

/** A failure as one line somebody can act on. Each case names its own fix. */
export function explainFailure(f: LibraryRefFailure): string {
  switch (f.kind) {
    case "unknown-instance":
      return (
        `no instance in this checkout declares the name "${f.instance}". ` +
        `Declared names: ${f.known.join(", ") || "(none)"}. ` +
        `A cross-instance citation names an instance's DECLARED NAME, never a path.`
      );
    case "no-library-graph":
      return (
        `instance "${f.instance}" (${f.instanceRoot}) declares no \`library\` graph, so it holds no L1 ` +
        `corpus to cite. This is not "the section is missing" — the citation points at the wrong kind of thing.`
      );
    case "not-ingested":
      return `${f.libraryId} is not ingested under ${f.instanceRoot} (no structure.json). The document was never brought through uploads/ → library/.`;
    case "no-such-section":
      return `cites ${f.path}, which does not exist. Every KG reference to a source resolves THROUGH library/.`;
  }
}
