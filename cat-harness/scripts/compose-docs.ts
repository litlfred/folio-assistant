#!/usr/bin/env bun
/**
 * Compose the site's documentation tree from its declared layers.
 *
 * @module scripts/compose-docs
 *
 * ## The rule this implements, in the owner's words
 *
 * 2026-09-21, ruling on bean `n0nf` (issue #638): *"harness can have docs/
 * which then get listed under `cat-harness/docs/<harness>`, there is also
 * docs/ dir in repo root managed by cat-harness. other harness augment or
 * overlay ontop of that (content and behviors)."*
 *
 * Three statements. The first is `mount-instance-docs.ts`, which already
 * mounts each instance's docs at its own path and is untouched here. The
 * second and third are this file: a `docs/` at the repository root, managed by
 * `cat-harness`, which **overlays** the base layer rather than replacing it.
 *
 * ## The layers come from the declarations, never from a list
 *
 * `cat-harness/harness.json` declares two directories whose graphs include
 * `docs`, and the difference between them is `scope`:
 *
 * | entry | scope | resolves to | role |
 * |---|---|---|---|
 * | `docs` | instance (absent) | `cat-harness/docs/` | the BASE |
 * | `root-docs` | `repository` | `<repo>/docs/` | the OVERLAY |
 *
 * So "which layer is the base" is read off `scope` rather than written down
 * here. A hardcoded pair is the `check:declared-assets` defect, whose own doc
 * comment describes itself being "fixed" last time by writing down a list of
 * two while the repository had grown to eight.
 *
 * ## Overlay order, and why later wins
 *
 * Base first, overlay last, so a file in the overlay SHADOWS the base file at
 * the same relative path. That is the same direction `resolveSkillDirs`
 * already composes skills in — deepest dependency first, the instance's own
 * last — and using one direction for both is the point. An agent that learns
 * the rule once should not meet it backwards somewhere else.
 *
 * ## Every override is REPORTED, and that is the requirement rather than a nicety
 *
 * The ruling asks that the build be able to say which layer supplied a page.
 * An overlay that silently shadows one is the `dh4f` shape: a consumer reads
 * the composed tree, sees a single file, and cannot tell an override from the
 * only copy. So each shadowed path is printed with both layers named.
 *
 * It is NOT an error. That distinction matters and is the opposite of
 * `mount-instance-docs`, which refuses a collision: there two PEERS want one
 * path and neither has a claim, so writing either is arbitrary. Here a higher
 * layer deliberately overrides a lower one, which is the whole feature.
 *
 * ## The safety property that makes wiring this into the live publish path sound
 *
 * **An empty overlay must produce a byte-identical tree.** `docs-site.yml`
 * publishes the real site, so a change to its `source:` is a change to what
 * readers get. If composing with nothing in the overlay is provably the same
 * bytes as the base alone, then wiring it in is a no-op until somebody
 * deliberately authors an override — and the risk is bounded to that moment
 * rather than to this commit. `compose-docs.test.ts` pins it.
 *
 * ## What it deliberately does not do
 *
 * **Behaviours.** The ruling says instances overlay "content and behaviors".
 * Content is a file at a path, which is this. A *behaviour* — a Jekyll layout,
 * an include, `_data`, client-side JS, the just-the-docs config — composes
 * differently and the owner has not said how. Layouts and includes happen to
 * compose correctly as files, so they work today by construction; `_config.yml`
 * does NOT, since two configs need merging rather than shadowing, and the
 * overlay carrying one would silently replace the base's whole configuration.
 * That is reported as a refusal rather than guessed at.
 *
 * Usage:
 *   bun run cat-harness/scripts/compose-docs.ts --out <dir>
 *   bun run cat-harness/scripts/compose-docs.ts --out <dir> --check
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "..", "..");

/** A declared documentation layer, in the order it is laid down. */
export interface DocsLayer {
  /** The declaration's id — what a report names. */
  readonly id: string;
  /** Absolute path to the directory. */
  readonly dir: string;
  /** Whether it resolved against the repository root rather than the instance. */
  readonly repositoryScoped: boolean;
}

interface DeclEntry {
  id?: string;
  path?: string;
  scope?: string;
  graphs?: string[];
}

/**
 * The `docs` layers `cat-harness` declares, base first.
 *
 * Instance-scoped entries are the base; repository-scoped ones are the
 * overlay. Both are read from the declaration, so relocating either is a
 * one-line edit there rather than a change here.
 *
 * A declared layer whose directory is ABSENT is dropped and reported by the
 * caller rather than silently treated as empty — `dh4f` is a declaration whose
 * consumer scans nothing and calls it clean, and "the directory is not there"
 * and "the directory is empty" are different facts.
 */
export function docsLayers(repo = REPO): { layers: DocsLayer[]; missing: DocsLayer[] } {
  const decl = JSON.parse(readFileSync(join(repo, "cat-harness", "harness.json"), "utf-8")) as {
    directories?: DeclEntry[];
  };
  const found: DocsLayer[] = [];
  for (const e of decl.directories ?? []) {
    if (!e.path || !e.id || !(e.graphs ?? []).includes("docs")) continue;
    const repositoryScoped = e.scope === "repository";
    const root = repositoryScoped ? repo : join(repo, "cat-harness");
    found.push({ id: e.id, dir: join(root, e.path), repositoryScoped });
  }
  // Base (instance-scoped) before overlay (repository-scoped): later wins.
  found.sort((a, b) => Number(a.repositoryScoped) - Number(b.repositoryScoped));
  return {
    layers: found.filter((l) => existsSync(l.dir)),
    missing: found.filter((l) => !existsSync(l.dir)),
  };
}

/** Every file beneath `dir`, as paths relative to it. Dotfiles are skipped. */
function filesUnder(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const e of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    // Jekyll ignores dotfiles, and so does this: `docs/.gitkeep` carries the
    // overlay's own documentation and must not become a published page.
    if (e.name.startsWith(".")) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...filesUnder(dir, rel));
    else out.push(rel);
  }
  return out;
}

export interface ComposeReport {
  /** Layers laid down, base first. */
  readonly layers: DocsLayer[];
  /** Declared layers whose directory does not exist. */
  readonly missing: DocsLayer[];
  /** `<relative path>` → the layer id that supplied the file finally present. */
  readonly suppliedBy: Record<string, string>;
  /** Paths a later layer shadowed, with both layer ids. */
  readonly overrides: { path: string; baseLayer: string; by: string }[];
  /** Paths an overlay added that no earlier layer had. */
  readonly added: string[];
  /** Overlay files this refuses to compose, with the reason. */
  readonly refused: { path: string; reason: string }[];
}

/**
 * Files an overlay must not simply shadow, because shadowing them is not what
 * "overlay" means for that file.
 *
 * `_config.yml` is the whole of Jekyll's configuration. An overlay carrying
 * one would replace the base's entirely — every plugin, every collection,
 * every `just-the-docs` setting — while looking like it added one page. Two
 * configurations want MERGING, and the owner has not said with what
 * precedence, so this refuses and names it rather than picking one.
 */
const REFUSE_TO_SHADOW: Readonly<Record<string, string>> = {
  "_config.yml":
    "a Jekyll config is merged, never shadowed — an overlay copy would replace the base's entire configuration while reading as one added page",
};

/** Lay the layers down in order, recording who supplied what. */
export function compose(out: string, repo = REPO): ComposeReport {
  const { layers, missing } = docsLayers(repo);

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const suppliedBy: Record<string, string> = {};
  const overrides: ComposeReport["overrides"] = [];
  const added: string[] = [];
  const refused: ComposeReport["refused"] = [];

  for (const [i, layer] of layers.entries()) {
    for (const rel of filesUnder(layer.dir)) {
      const isOverlay = i > 0;
      const reason = REFUSE_TO_SHADOW[rel];
      if (isOverlay && reason && suppliedBy[rel]) {
        refused.push({ path: rel, reason });
        continue;
      }
      if (suppliedBy[rel]) overrides.push({ path: rel, baseLayer: suppliedBy[rel]!, by: layer.id });
      else if (isOverlay) added.push(rel);

      const dest = join(out, rel);
      mkdirSync(join(dest, ".."), { recursive: true });
      cpSync(join(layer.dir, rel), dest);
      suppliedBy[rel] = layer.id;
    }
  }
  return { layers, missing, suppliedBy, overrides, added, refused };
}

/** Every file beneath a directory with its bytes — for the identity check. */
export function treeDigest(dir: string): Map<string, string> {
  const m = new Map<string, string>();
  if (!existsSync(dir)) return m;
  for (const rel of filesUnder(dir)) {
    m.set(rel, Bun.hash(readFileSync(join(dir, rel))).toString(16));
  }
  return m;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--out");
  const out = i >= 0 ? argv[i + 1] : undefined;
  if (!out) {
    console.error("usage: compose-docs.ts --out <dir> [--check]");
    process.exit(2);
  }

  const r = compose(resolve(out));

  for (const m of r.missing) {
    // A declared layer with no directory is a FINDING, not a skip. It is the
    // `dh4f` shape exactly: the declaration says to look, and there is nothing
    // there, and a composer that shrugged would report a clean run over it.
    console.error(`::error::compose-docs: declared docs layer '${m.id}' has no directory at ${relative(REPO, m.dir)}`);
  }
  console.log(`composed ${Object.keys(r.suppliedBy).length} file(s) from ${r.layers.length} layer(s):`);
  for (const l of r.layers) {
    console.log(`  · ${l.id}${l.repositoryScoped ? " (repository)" : ""} — ${relative(REPO, l.dir)}`);
  }
  // Named, never counted. A bare number would not let a reader check that the
  // right pages were overridden, which is the whole question an override raises.
  if (r.overrides.length === 0) console.log("  no overrides — the composed tree is the base layer");
  for (const o of r.overrides) console.log(`  OVERRIDE ${o.path} — ${o.baseLayer} -> ${o.by}`);
  for (const a of r.added) console.log(`  ADDED    ${a}`);
  for (const f of r.refused) console.error(`::warning::compose-docs: refused ${f.path} — ${f.reason}`);

  if (r.missing.length > 0) process.exit(1);
  if (argv.includes("--check")) {
    if (!existsSync(out) || !statSync(out).isDirectory()) process.exit(2);
  }
}
