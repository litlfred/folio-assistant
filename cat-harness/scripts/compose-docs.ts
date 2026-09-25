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
  /**
   * The instance's own directory, repo-relative and without a trailing slash.
   *
   * NOT the same string as `under`, and the difference is the whole reason
   * this field exists: `under` is the declaration's `name`, which is what a
   * URL carries, while this is where the files sit in the checkout, which is
   * what a diff names. They coincide today and are free to diverge — a
   * declaration may name itself anything — so `carriedInstances` matching a
   * changed path against `under` would quietly stop matching the day one is
   * renamed, and the failure would look like "this branch touches nothing".
   */
  root: string;
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
      out.push({ instance: d.name ?? e.name, dir: abs, under: d.name ?? e.name, root: e.name });
    }
  }
  return out.sort((a, b) => a.under.localeCompare(b.under));
}

/** What `carriedInstances` decided about one composed instance. */
export interface CarryDecision {
  readonly instance: ComposedInstance;
  /** True to compose its files; false to leave a stub in their place. */
  readonly carry: boolean;
  /** Why, in the words the build log prints. */
  readonly why: string;
}

/**
 * Which composed instances a preview must carry, given the branch's own diff.
 *
 * Bean `ga8a`, following `tebu` one directory over. `smart-trust/docs/` is
 * **3.2 MB of markdown** in the checkout and **111.6 MB of HTML** in a
 * preview — 681 pages at ~164 KiB each, because just-the-docs inlines the
 * whole navigation into every page. Measured across `origin/gh-pages` on
 * 2026-09-23: **776.6 MB over 13 previews, 37 % of a 2.10 GB `STAGING/`
 * tree**, against a 1 GB Pages limit the main site shares. Every preview
 * carried it, whether or not its branch mentioned the instance.
 *
 * It does not deduplicate either. The `smart-trust` tree hash is DISTINCT in
 * all 13 previews, because the staging banner injects the slug into every
 * page — so unlike the dedup argument `tebu` rightly rejected for a
 * published-size threshold, this weighs on both budgets.
 *
 * ## The predicate is the INSTANCE, not its composed directory
 *
 * `smart-trust/docs/` is generated from `smart-trust/fhir-artifact-index/` by
 * `smart-trust/scripts/`, so a branch that changes the generator and
 * regenerates in the same commit must still get the rebuilt pages. Matching
 * the instance root is the superset that covers all three, and a superset is
 * the right direction here for the reason below.
 *
 * ## ANY DOUBT CARRIES EVERYTHING
 *
 * `files` is `undefined` when there is no pull request (a `workflow_dispatch`
 * preview), when the API call failed, or when the list came back unreadable —
 * and all three carry the lot. The two failures are not symmetric: a preview
 * that is too big is a threshold finding somebody reads, while a preview
 * missing the pages under review is a **reviewer misled**, and absence read as
 * evidence is this family's whole history of bugs (`dh4f`).
 *
 * An EMPTY list is not the same as no list and is not treated as one: a pull
 * request that genuinely changes nothing touches no instance, and saying so is
 * a determined answer rather than a doubt.
 *
 * @param composed every composed instance, from `composedInstances`
 * @param files the pull request's changed paths, repo-relative; `undefined` when unknown
 */
export function carriedInstances(
  composed: readonly ComposedInstance[],
  files?: readonly string[],
): CarryDecision[] {
  if (!files) {
    return composed.map((instance) => ({
      instance,
      carry: true,
      why: "no readable file list for this branch — carrying everything",
    }));
  }
  // Normalised because a path may reach here with a leading `./` from a diff
  // tool, and `smart-trust/x` must not miss `./smart-trust/x`.
  const changed = files.map((f) => f.replace(/^\.\//, ""));
  return composed.map((instance) => {
    const prefix = `${instance.root}/`;
    const hit = changed.find((f) => f === instance.root || f.startsWith(prefix));
    return hit
      ? { instance, carry: true, why: `the branch touches ${hit}` }
      : { instance, carry: false, why: `nothing under review touches ${instance.root}/` };
  });
}

/**
 * The page left where a composed instance's tree would have been.
 *
 * A stub rather than nothing, and that is `pb04`: the navbar's harness tiles
 * and every cross-reference address `/<instance>/`, so removing the directory
 * outright turns a working link into a 404 a reviewer has to diagnose. A page
 * that says where the full copy lives costs one file and answers the question
 * the 404 would have raised.
 */
export function instanceStub(c: ComposedInstance): string {
  return [
    "---",
    `title: ${c.under}`,
    "nav_exclude: true",
    "---",
    "",
    `# ${c.under}`,
    "",
    "This instance's pages are **not built into this preview**. Nothing on this",
    "branch changes them, and carrying a themed copy costs a large share of the",
    "GitHub Pages budget the main site shares — see bean `ga8a`.",
    "",
    "Read them on the published site:",
    `<https://litlfred.github.io/folio-assistant/${c.under}/>.`,
    "",
    `A branch that touches \`${c.root}/\` gets the full tree here instead.`,
    "",
  ].join("\n");
}

/**
 * Composed-tree paths a CANONICAL deploy must not carry.
 *
 * Read from `coverage.visualiser[].publish === "staging-only"` across every
 * declaration in the checkout, never from a list here — a list would be the
 * `check:declared-assets` defect again, and this one fails by PUBLISHING
 * something somebody chose not to publish.
 *
 * ## Withholding a page means withholding its directory
 *
 * A viewer is `<dir>/index.html` plus whatever it loads. Withholding the one
 * file leaves its scripts and data deployed, which for `fsh-guts` would
 * publish the very bytes the declaration keeps back — so an `index.*` ref
 * withholds everything under its parent.
 *
 * **Except when that parent is the layer root**, which would withhold the
 * whole site. That guard is not hypothetical bookkeeping: a visualiser ref
 * directly in `cat-harness/docs/` is a perfectly ordinary declaration, and
 * without the check, one such ref marked staging-only would empty the
 * canonical deploy. The ref is then withheld as a single file.
 */
/**
 * What a visualiser ref withholds, given its path inside a docs layer.
 *
 * An `index.*` stands for its whole directory, because a viewer is a page plus
 * whatever it loads and withholding the page alone would deploy the assets.
 *
 * **Unless its parent is the layer root**, where the directory IS the site.
 * Separated out and exported for one reason: as a branch inside
 * `withheldFromCanonical` it could only be exercised by a declaration that
 * actually put a ref at a layer root, so no test over this repository's real
 * tree could ever reach it — and the failure it prevents is the canonical
 * deploy composing to nothing. A guard that cannot be tested where it matters
 * is a guard that is one refactor from being dropped silently.
 */
export function withheldPathFor(rel: string): string {
  const slash = rel.lastIndexOf("/");
  const base = slash === -1 ? rel : rel.slice(slash + 1);
  const parent = slash === -1 ? "" : rel.slice(0, slash);
  // `parent === ""` IS the layer-root case: withhold the file alone.
  return /^index\.(html|md)$/.test(base) && parent !== "" ? `${parent}/` : rel;
}

export function withheldFromCanonical(repo = REPO): string[] {
  const roots = docsLayers(repo).layers.map((l) => l.dir);
  const out = new Set<string>();

  const consider = (ref: string): void => {
    const abs = resolve(repo, ref);
    for (const root of roots) {
      const rel = relative(root, abs);
      // Outside this layer, or escaping it via `..` — not ours to withhold.
      if (rel.startsWith("..") || rel === "") continue;
      out.add(withheldPathFor(rel));
      return;
    }
  };

  for (const declPath of declarationsIn(repo)) {
    let d: { directories?: { coverage?: { visualiser?: unknown } }[] };
    try {
      d = JSON.parse(readFileSync(declPath, "utf-8"));
    } catch {
      // `kg:schema:check` owns an unparseable declaration; a second voice on
      // it here would report the same defect twice under different names.
      continue;
    }
    for (const entry of d.directories ?? []) {
      const v = entry.coverage?.visualiser;
      if (v === undefined) continue;
      for (const one of Array.isArray(v) ? v : [v]) {
        if (typeof one !== "object" || one === null) continue;
        const o = one as { ref?: string; publish?: string };
        if (o.publish === "staging-only" && o.ref) consider(o.ref);
      }
    }
  }
  return [...out].sort();
}

/** Every `<name>.json` declaration in the checkout — root and one level down. */
function declarationsIn(repo: string): string[] {
  const out: string[] = [];
  const at = declarationPathIn(repo);
  if (at && existsSync(at)) out.push(at);
  for (const e of readdirSync(repo, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = declarationPathIn(join(repo, e.name));
    if (p && existsSync(p)) out.push(p);
  }
  return out;
}

/** Whether `rel` falls under one of the withheld paths (file, or `dir/`). */
export function isWithheld(rel: string, withheld: readonly string[]): boolean {
  return withheld.some((w) => (w.endsWith("/") ? rel.startsWith(w) : rel === w));
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
   * Files kept OUT of this tree because their visualisation is
   * `publish: "staging-only"` and this is a canonical compose.
   *
   * Reported rather than silent, for the reason every omission here is
   * reported: a tree that is quietly smaller than its layers is
   * indistinguishable from a layer that failed to read. Empty on a
   * `--staging` run, which is a different fact from "nothing is withheld
   * anywhere" and is why the flag is echoed in the CLI output beside it.
   */
  readonly withheld: string[];
  /**
   * Instances composed under their own name, rather than mounted after Jekyll.
   *
   * Reported separately from `layers`, and that is not tidiness: a layer
   * OVERLAYS the site's own tree and a composed instance sits beside it under
   * its own prefix. Folding them together would make "did the root change this
   * page" and "did an instance add one" the same answer.
   */
  readonly composed: ComposedInstance[];
  /**
   * The carry decision taken for each composed instance, and why.
   *
   * Reported rather than inferred from `composed`, for the same reason
   * `withheld` is reported: a tree quietly missing an instance's pages is
   * indistinguishable from an instance that failed to read. Every entry in
   * `composed` appears here exactly once, so a reader can tell a stubbed
   * instance from an absent one.
   */
  readonly carried: CarryDecision[];
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
/**
 * Options for a compose run.
 *
 * `staging` is the ONLY way a staging-only visualisation reaches the tree, and
 * the default is deliberately the restrictive one — see
 * `VisualisationSchema.publish` for why the two failure directions are not
 * symmetric. Briefly: forgetting the flag loses a page from a preview, where
 * whoever is looking at the preview sees it missing; the opposite default
 * publishes withheld content to the world, where nothing shows it at all.
 */
export interface ComposeOptions {
  /** True on a local build or a `STAGING/<slug>/` preview. Default false. */
  readonly staging?: boolean;
  /**
   * The branch's changed paths, repo-relative, when they are known.
   *
   * Passed only by a preview build. Absent — the canonical publisher, a local
   * build, an unreadable API response — carries every composed instance, per
   * `carriedInstances`.
   */
  readonly changedFiles?: readonly string[];
}

export function compose(out: string, repo = REPO, opts: ComposeOptions = {}): ComposeReport {
  const { layers, missing } = docsLayers(repo);
  const withheld = opts.staging === true ? [] : withheldFromCanonical(repo);
  const withheldFiles: string[] = [];

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const suppliedBy: Record<string, string> = {};
  const overrides: ComposeReport["overrides"] = [];
  const added: string[] = [];
  const merged: ComposeReport["merged"] = [];

  for (const [i, layer] of layers.entries()) {
    for (const rel of filesUnder(layer.dir)) {
      const isOverlay = i > 0;
      // Withheld BEFORE anything else touches `rel`, so a staging-only page
      // cannot be recorded as supplied, overridden or added. A report that
      // named a file the tree does not carry would be worse than no report.
      if (isWithheld(rel, withheld)) {
        withheldFiles.push(rel);
        continue;
      }
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
  const carry = carriedInstances(composedInst, opts.changedFiles);
  for (const d of carry) {
    const c = d.instance;
    if (!d.carry) {
      const under = `${c.under}/index.md`;
      // The stub is a file in the tree like any other, so it answers to
      // withholding like any other. A canonical build never reaches here (it
      // passes no file list), but a local one can, and a stub published where
      // the real index was deliberately withheld would be the same leak with
      // fewer bytes.
      if (isWithheld(under, withheld)) {
        withheldFiles.push(under);
        continue;
      }
      const dest = join(out, c.under, "index.md");
      mkdirSync(join(dest, ".."), { recursive: true });
      writeFileSync(dest, instanceStub(c));
      suppliedBy[under] = c.instance;
      continue;
    }
    for (const rel of filesUnder(c.dir)) {
      // A composed instance lands under its own name, so its withholding is
      // asked about the path the TREE will carry rather than the instance's
      // own. Skipping this loop would leave a staging-only graph publishable
      // simply by declaring it `composed`.
      const under = `${c.under}/${rel}`;
      if (isWithheld(under, withheld)) {
        withheldFiles.push(under);
        continue;
      }
      const dest = join(out, c.under, rel);
      mkdirSync(join(dest, ".."), { recursive: true });
      cpSync(join(c.dir, rel), dest);
      suppliedBy[join(c.under, rel)] = c.instance;
    }
  }

  // DEDUPED. A path present in two layers is withheld once per layer, and a
  // report listing it twice made `withheld.length` stop meaning "files this
  // tree does not carry" — which is the only thing a reader would use it for.
  // Caught by the test asserting the two trees differ by exactly that count.
  return {
    layers,
    missing,
    suppliedBy,
    overrides,
    added,
    merged,
    withheld: [...new Set(withheldFiles)].sort(),
    composed: composedInst,
    carried: carry,
  };
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
    console.error(
      "usage: compose-docs.ts --out <dir> [--check] [--staging] [--changed-files <file>]",
    );
    process.exit(2);
  }

  // `--changed-files` names a file holding the branch's changed paths, one per
  // line — what a preview build reads out of the pull request. ABSENT IS THE
  // SAFE DIRECTION and the default everywhere else: `carriedInstances` then
  // carries every composed instance. An unreadable or empty FILE is treated
  // the same as no flag, because "the list could not be read" and "the list
  // said nothing changed" would otherwise be one answer, and only one of them
  // is a determined zero (`dh4f`).
  const cf = argv.indexOf("--changed-files");
  let changedFiles: string[] | undefined;
  if (cf >= 0 && argv[cf + 1]) {
    try {
      const lines = readFileSync(argv[cf + 1]!, "utf-8")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length > 0) changedFiles = lines;
      else console.log("  --changed-files was empty — carrying every composed instance");
    } catch {
      console.log(`  --changed-files could not be read — carrying every composed instance`);
    }
  }

  // `--staging` is the POSITIVE assertion that this build is not the canonical
  // deploy: a local build, or a `STAGING/<slug>/` preview. Absent means
  // canonical, which withholds. The default is the restrictive one on purpose
  // — `VisualisationSchema.publish` carries why the two error directions are
  // not symmetric.
  const staging = argv.includes("--staging");
  const r = compose(resolve(out), REPO, { staging, changedFiles });

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
  // Stated either way, never only when non-empty. "Nothing was withheld" and
  // "withholding was off" are different facts and an empty list alone cannot
  // tell them apart.
  if (staging) console.log("  staging build — staging-only visualisations are INCLUDED");
  else if (r.withheld.length === 0) console.log("  canonical build — nothing declared staging-only");
  else {
    console.log(`  canonical build — ${r.withheld.length} file(s) withheld as staging-only:`);
    for (const w of r.withheld) console.log(`  WITHHELD ${w}`);
  }
  // The changed KEYS, never a count. "merged 1 file" tells a reader nothing
  // about what the overlay did to the site's configuration, which is the whole
  // question a merged config raises.
  for (const m of r.merged) {
    console.log(`  MERGED   ${m.path} — ${m.baseLayer} <- ${m.by} (${m.keys.join(", ")})`);
  }
  // Every composed instance, carried or stubbed, with its reason. Printing
  // only the stubbed ones would leave a reader unable to tell an instance that
  // was carried from one this build never saw (bean `ga8a`).
  for (const d of r.carried) {
    console.log(`  ${d.carry ? "CARRIED " : "STUBBED "} ${d.instance.under} — ${d.why}`);
  }

  if (r.missing.length > 0) process.exit(1);
  if (argv.includes("--check")) {
    if (!existsSync(out) || !statSync(out).isDirectory()) process.exit(2);
  }
}
