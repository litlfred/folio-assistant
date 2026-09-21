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
 * ## Behaviours: `_config.yml` is MERGED, and the owner picked the rule
 *
 * The ruling says instances overlay "content and behaviors". Content is a file
 * at a path, which is the paragraphs above. A *behaviour* — a Jekyll layout, an
 * include, `_data`, client-side JS, the just-the-docs config — is not always a
 * file swap. Layouts and includes happen to compose correctly as files, so they
 * work by construction. `_config.yml` does not: it is the WHOLE of Jekyll's
 * configuration, and an overlay copy shadowing it would replace every plugin,
 * collection and theme setting at once while reading in the report as a single
 * added page.
 *
 * This refused it until 2026-09-21, which meant a downstream harness could
 * overlay pages but could not change one Jekyll setting — no theme, no nav, no
 * title. The owner settled the rule that day, choosing merge over refusal and
 * over a key allowlist:
 *
 * > **Overlay keys win. Objects merge recursively. Lists REPLACE rather than
 * > concatenate.**
 *
 * Lists replacing is the part worth stating, because concatenation is the more
 * common default and it is wrong here for the same reason the file overlay is
 * last-wins: an overlay that wanted three nav entries and got seven has no way
 * to remove the four it inherited. One direction, everywhere, so an agent that
 * learns the rule once does not meet it backwards.
 *
 * The allowlist that was NOT chosen is worth recording too. Merging only
 * declared keys (`title`, `nav`, colour tokens) is safer per-key and is exactly
 * the `6tkl` shape — a hardcoded list that goes stale silently, which this
 * repository has paid for three times.
 *
 * ## Why the merge is conditional, and what breaks if it is not
 *
 * **A YAML round trip is not byte-preserving.** Parsing and re-emitting strips
 * comments and may reorder keys, so merging unconditionally would change the
 * published `_config.yml` on a tree whose overlay carries none — breaking the
 * byte-identity property that licenses `docs-site.yml` pointing `source:` at
 * the composed tree at all.
 *
 * So the merge fires ONLY when an overlay actually supplies a config and a
 * lower layer already did. In every other case the file is copied, bytes
 * untouched, exactly as before. `compose-docs.test.ts` pins both halves.
 *
 * Usage:
 *   bun run cat-harness/scripts/compose-docs.ts --out <dir>
 *   bun run cat-harness/scripts/compose-docs.ts --out <dir> --check
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { declarationPathIn } from "../schemas/cat-harness.js";

import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

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
  graphKinds?: string[];
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
  const decl = JSON.parse(readFileSync(declarationPathIn(join(repo, "cat-harness"))!, "utf-8")) as {
    directories?: DeclEntry[];
  };
  const found: DocsLayer[] = [];
  for (const e of decl.directories ?? []) {
    if (!e.path || !e.id || !(e.graphKinds ?? []).includes("docs")) continue;
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

/** One instance directory composed into the Jekyll source under its own name. */
export interface ComposedInstance {
  instance: string;
  /** Absolute source directory. */
  dir: string;
  /** Where it lands, relative to the composed tree — the instance's name. */
  under: string;
}

/**
 * Every OTHER instance's directory that asks to be composed rather than mounted.
 *
 * This is the owner's *"harness can have docs/ which then get listed under
 * `cat-harness/docs/<harness>`"* — the clause neither consumer implemented.
 * `mount-instance-docs.ts` copies built HTML into `_site` AFTER Jekyll, which
 * is a different thing and is what leaves those pages with no layout at all.
 *
 * **Opt-in, read off `composed` on the directory.** A composed default would
 * silently restyle `who-iris/`, which is a replica of somebody else's site and
 * must not wear just-the-docs' chrome — the same reason `mount-instance-docs`
 * gives where it declines to run Jekyll over these.
 *
 * `cat-harness` is excluded because it IS the base layer; composing it under
 * its own name would publish the whole site twice, which is the double-publish
 * `mount-instance-docs` already guards with `--built`.
 */
export function composedInstances(repo = REPO): ComposedInstance[] {
  const out: ComposedInstance[] = [];
  for (const e of readdirSync(repo, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    if (e.name === "cat-harness") continue;
    const declPath = declarationPathIn(join(repo, e.name));
    if (!declPath || !existsSync(declPath)) continue;
    let d: { name?: string; directories?: (DeclEntry & { composed?: boolean })[] };
    try {
      d = JSON.parse(readFileSync(declPath, "utf-8"));
    } catch {
      // Not this script's finding — `kg:schema:check` owns an unparseable
      // declaration, and reporting it here would be a second voice on it.
      continue;
    }
    for (const entry of d.directories ?? []) {
      if (!entry.path || entry.composed !== true) continue;
      const abs = join(repo, e.name, entry.path);
      if (!existsSync(abs)) continue;
      out.push({ instance: d.name ?? e.name, dir: abs, under: d.name ?? e.name });
    }
  }
  return out.sort((a, b) => a.under.localeCompare(b.under));
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
  /**
   * Files an overlay MERGED into a lower layer rather than shadowing, with the
   * dotted keys the overlay changed. Neither an override nor an addition —
   * collapsing it into either would make "what did the root change" unanswerable.
   */
  readonly merged: { path: string; baseLayer: string; by: string; keys: string[] }[];
  /**
   * Instances composed under their own name, rather than mounted after Jekyll.
   *
   * Reported separately from `layers`, and that is not tidiness: a layer
   * OVERLAYS the site's own tree and a composed instance sits beside it under
   * its own prefix. Folding them together would make "did the root change this
   * page" and "did an instance add one" the same answer.
   */
  readonly composed: ComposedInstance[];
}

/**
 * Files an overlay MERGES into the lower layer instead of shadowing it.
 *
 * `_config.yml` is the whole of Jekyll's configuration, so a shadow would
 * replace every plugin, collection and theme setting while reading in the
 * report as one added page. The owner's rule (2026-09-21) is to merge it.
 *
 * A map rather than a set because the reason travels with the entry, the same
 * discipline as `FORWARD_DECLARED` and `STEP_EXEMPTIONS`: a later reader gets
 * the decision rather than a bare filename.
 */
const MERGE_RATHER_THAN_SHADOW: Readonly<Record<string, string>> = {
  "_config.yml":
    "the whole of Jekyll's configuration — shadowing it would replace every plugin, collection and theme setting while reading as one added page",
};

/** A plain object, as distinct from an array or a scalar. */
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Deep-merge `over` onto `base` — the owner's rule, and every clause matters.
 *
 * - objects merge RECURSIVELY, so an overlay setting one colour token does not
 *   drop the rest of the theme;
 * - lists REPLACE, so an overlay can shorten an inherited list. Concatenating
 *   would leave no way to remove an inherited entry;
 * - scalars replace, and `null` is a value like any other — an overlay may
 *   deliberately null a key out.
 *
 * Returns the merged value and the dotted paths the overlay actually changed,
 * because the report names what moved rather than counting it.
 */
export function mergeConfig(
  base: unknown,
  over: unknown,
  prefix = "",
): { merged: unknown; changed: string[] } {
  if (!isRecord(base) || !isRecord(over)) {
    return { merged: over, changed: [prefix || "(document)"] };
  }
  const merged: Record<string, unknown> = { ...base };
  const changed: string[] = [];
  for (const [k, v] of Object.entries(over)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (isRecord(base[k]) && isRecord(v)) {
      const r = mergeConfig(base[k], v, path);
      merged[k] = r.merged;
      changed.push(...r.changed);
    } else {
      merged[k] = v;
      changed.push(path);
    }
  }
  return { merged, changed };
}

/** Lay the layers down in order, recording who supplied what. */
export function compose(out: string, repo = REPO): ComposeReport {
  const { layers, missing } = docsLayers(repo);

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const suppliedBy: Record<string, string> = {};
  const overrides: ComposeReport["overrides"] = [];
  const added: string[] = [];
  const merged: ComposeReport["merged"] = [];

  for (const [i, layer] of layers.entries()) {
    for (const rel of filesUnder(layer.dir)) {
      const isOverlay = i > 0;
      const dest = join(out, rel);
      const src = join(layer.dir, rel);

      // MERGED, not shadowed — and only when a lower layer actually supplied
      // one. A YAML round trip drops comments and may reorder keys, so doing
      // this unconditionally would change the published bytes on a tree whose
      // overlay carries no config, breaking the byte-identity property that
      // licenses pointing the live `source:` at the composed tree.
      if (isOverlay && MERGE_RATHER_THAN_SHADOW[rel] && suppliedBy[rel]) {
        const r = mergeConfig(
          parseYaml(readFileSync(dest, "utf-8")),
          parseYaml(readFileSync(src, "utf-8")),
        );
        writeFileSync(dest, stringifyYaml(r.merged));
        merged.push({ path: rel, baseLayer: suppliedBy[rel]!, by: layer.id, keys: r.changed });
        suppliedBy[rel] = layer.id;
        continue;
      }

      if (suppliedBy[rel]) overrides.push({ path: rel, baseLayer: suppliedBy[rel]!, by: layer.id });
      else if (isOverlay) added.push(rel);

      mkdirSync(join(dest, ".."), { recursive: true });
      cpSync(src, dest);
      suppliedBy[rel] = layer.id;
    }
  }

  // Composed instances land UNDER THEIR OWN NAME, after the layers, so an
  // instance cannot shadow a base page by accident: `who-iris/index.md` in a
  // composed tree is `<out>/who-iris/index.md`, never `<out>/index.md`.
  const composedInst = composedInstances(repo);
  for (const c of composedInst) {
    for (const rel of filesUnder(c.dir)) {
      const dest = join(out, c.under, rel);
      mkdirSync(join(dest, ".."), { recursive: true });
      cpSync(join(c.dir, rel), dest);
      suppliedBy[join(c.under, rel)] = c.instance;
    }
  }

  return { layers, missing, suppliedBy, overrides, added, merged, composed: composedInst };
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
  // The changed KEYS, never a count. "merged 1 file" tells a reader nothing
  // about what the overlay did to the site's configuration, which is the whole
  // question a merged config raises.
  for (const m of r.merged) {
    console.log(`  MERGED   ${m.path} — ${m.baseLayer} <- ${m.by} (${m.keys.join(", ")})`);
  }

  if (r.missing.length > 0) process.exit(1);
  if (argv.includes("--check")) {
    if (!existsSync(out) || !statSync(out).isDirectory()) process.exit(2);
  }
}
