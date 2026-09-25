/**
 * Every declared image `role` is read by something that can actually reach it.
 *
 * Bean `5yrl`, split out of `blv9` on 2026-09-22 because it is a different
 * question over a different corpus: *declared but unread* — the `dh4f` shape —
 * rather than *a path that will not resolve*.
 *
 * ## Why half of this check is the half that matters
 *
 * `blv9` recorded the finding that makes the obvious version wrong, and it is
 * worth restating rather than pointing at, because a reader who sees only
 * "check every role has a consumer" will build the obvious version:
 *
 * > `cat-harness.json` declared `role: "browser-icon"` on `mark-small` and
 * > nothing consumed it — the site emitted no favicon at all. But the reason
 * > was **not an absent caller**. `imagesForRole()` filters on
 * > `i.role === role && i.layout !== undefined`, and a mark carries no
 * > `layout`, so the lookup returned an EMPTY MAP and said nothing about why.
 * > A caller existed; it could not reach what was declared.
 *
 * So the check has two halves, and the second is the one that catches the real
 * instance: every role is NAMED by a consumer, **and** every lookup used to
 * consume one can MATCH what is declared.
 *
 * ## Why the existing test cannot do this
 *
 * `schemas/themes.test.ts` already walks every theme with a backdrop and
 * asserts `resolveThemeBackdrop` resolves all three layouts. That is a good
 * check and it scans **consumer → declaration**, so a declaration NO consumer
 * names is outside its domain by construction. It reports clean over exactly
 * the case this file exists for — which is the `dh4f` shape one level up, and
 * is how `landing-architecture` sat declared and unnamed.
 *
 * This file scans the other direction: **declaration → consumer**.
 *
 * ## The states, and why there are five rather than two
 *
 * A role is not simply consumed or orphaned. Measured on this repository:
 *
 * - `landing` and the five `landing-*` theme roles are consumed **indirectly**,
 *   through `themes.ts` declaring `imageRole: "<role>"` and `resolveThemeBackdrop`
 *   reading `theme.backdrop.imageRole`. A check looking for the role inside a
 *   lookup CALL would report six false positives.
 * - `mark` is read by **id**, not by role: `sync-docs-harness.ts` does
 *   `decl.images?.find((i) => i.id === decl.icon)`. The role is genuinely
 *   unread and the image is genuinely reached, so failing it would be wrong
 *   and passing it silently would be a lie.
 *
 * Hence `by-id` and `declined` are reported and never counted clean, the same
 * third-state discipline `check:partition` and `check:docs-templates` use: an
 * unexaminable case and an examined-clean one must not look alike.
 *
 * ## Scope
 *
 * INSTANCE DECLARATIONS ONLY. `library/<slug>/images.json` files carry their
 * own roles — `page-scan` (140), `logo` (12), `decorative` (10), `figure` (2) —
 * and they are a different graph with different consumers. Folding them in
 * would make one gate answer two questions, which is the mistake this bean was
 * split out of `blv9` to avoid. They are REPORTED as out of scope rather than
 * silently skipped, because a corpus a gate declined to examine and one it
 * found clean must not read the same.
 *
 * @module scripts/check-image-roles
 * @covers cat-harness — the `role` keys it grades are on the instance DECLARATIONS, and the
 *   question is whether each is read by anything that can reach it
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { instanceRootsIn, readDeclaration } from "../schemas/cat-harness.js";
/* NO `folio-graph-kind` IMPORT IS NEEDED HERE, and that is recent: until #840
   `readDeclaration` THREW on this repository's own declaration unless the
   caller had imported core's registration for its side effect. #840 moved the
   registry to a leaf and put the trigger at `cat-harness.ts`'s foot, so
   loading the reader is now a precondition of calling it. The first draft of
   this file carried that import AND swallowed the throw in a `catch`, which
   silently reduced the corpus to zero — the `dh4f` shape, committed inside the
   gate built to catch it. Only the `examined === 0` guard found it. */

/** What became of one declared role. */
export type Verdict =
  /** A consumer names it and can match what is declared. */
  | "consumed"
  /** A consumer names it and CANNOT match it — the favicon shape. */
  | "unreachable"
  /** Nothing names it. */
  | "orphan"
  /** Not read by role; the image is reached through a declared id pointer. */
  | "by-id"
  /** Cannot be determined from a static read. */
  | "declined";

export interface RoleFinding {
  readonly instance: string;
  readonly role: string;
  readonly images: number;
  /** How many of this role's images carry a `layout`. */
  readonly withLayout: number;
  readonly verdict: Verdict;
  readonly why: string;
}

/**
 * Orphans this gate does not fail on YET, each naming what it waits on.
 *
 * The `ALLOWED` discipline `check-invocation-parity` already follows, and it
 * carries the same guard: **a permit for a finding that no longer exists is
 * itself a finding.** A suppression list that silently outlives its subject is
 * the thing it was meant to prevent.
 *
 * Nothing goes here because it is inconvenient. It goes here when the fix is a
 * DECISION rather than a correction — and then the entry names the decision, so
 * the list reads as a queue rather than as a dustbin.
 */
// Empty since 2026-09-24. Its one entry was `cat-harness/landing-architecture`,
// permitted from 2026-09-22 (bean `5yrl`, issue #859) because the mobile crop
// had never been supplied; the owner supplied it, the `architecture` theme now
// names the role, and a permit for a finding that no longer exists would itself
// be a finding.
export const PERMITTED_ORPHANS: ReadonlyMap<string, string> = new Map<string, string>([]);

/** A lookup that requires `layout`, and therefore cannot match a layout-less image. */
const LAYOUT_KEYED = new Set(["imagesForRole", "resolveThemeBackdrop"]);

/**
 * How a role is named in code, if it is.
 *
 * Both forms are real and neither subsumes the other: a direct lookup passes
 * the role as an argument, a theme DECLARES it as data and a resolver reads
 * the field. Looking only for the first is what would report the six
 * `landing-*` roles as orphans.
 */
export interface Mention {
  readonly file: string;
  readonly via: "lookup" | "imageRole";
  readonly fn?: string;
}

/** Every `<fn>(…, "<role>")` call and every `imageRole: "<role>"` in one source. */
export function mentionsIn(file: string, src: string): Map<string, Mention[]> {
  const out = new Map<string, Mention[]>();
  const add = (role: string, m: Mention): void => {
    const list = out.get(role) ?? [];
    list.push(m);
    out.set(role, list);
  };
  // `imageForRole(x, "browser-icon")` / `imagesForRole(x, "landing")`.
  const LOOKUP = /\b(imageForRole|imagesForRole)\s*\([^)]*?["']([A-Za-z0-9._-]+)["']/g;
  for (let m = LOOKUP.exec(src); m !== null; m = LOOKUP.exec(src)) {
    add(m[2]!, { file, via: "lookup", fn: m[1]! });
  }
  // `imageRole: "landing-analyst"` — the theme's declared indirection.
  const FIELD = /\bimageRole\s*:\s*["']([A-Za-z0-9._-]+)["']/g;
  for (let m = FIELD.exec(src); m !== null; m = FIELD.exec(src)) {
    add(m[1]!, { file, via: "imageRole", fn: "resolveThemeBackdrop" });
  }
  return out;
}

/**
 * Strip comments before scanning.
 *
 * Not fastidiousness: this file's own doc comment quotes `imagesForRole()` and
 * matched as a call, which alone was enough to mark the whole corpus dynamic.
 * A tool that reads its own prose as evidence is measuring itself.
 */
export function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

/**
 * The module that DEFINES the lookups, which is never a consumer of them.
 *
 * `imageForRole` delegates to `imagesForRole` with a variable `role` — that is
 * an implementation detail of the pair, not a call site that might resolve to
 * any declared role. Counting it marked the entire corpus indeterminate, which
 * turned the one live orphan (`landing-architecture`) into a `declined` and
 * hid the exact defect this gate was built to find.
 */
const DEFINES_LOOKUPS = "schemas/kg-node.ts";

/** A role named through a variable — this tool cannot say which role it is. */
export function hasDynamicLookup(rel: string, src: string): boolean {
  if (rel.endsWith(DEFINES_LOOKUPS)) return false;
  return /\b(imageForRole|imagesForRole)\s*\([^)]*?,\s*[A-Za-z_$][\w$.]*\s*\)/.test(code(src));
}

/**
 * Judge one role.
 *
 * `byId` is separate from `mentions` on purpose: being reachable by id does not
 * make a ROLE read, and conflating the two is how "the image is fine" would
 * come to mean "the role is consumed".
 */
export function judge(
  role: string,
  images: readonly { layout?: unknown }[],
  mentions: readonly Mention[],
  byId: boolean,
  dynamic: boolean,
): { verdict: Verdict; why: string } {
  const withLayout = images.filter((i) => i.layout !== undefined).length;
  if (mentions.length === 0) {
    if (byId) {
      return {
        verdict: "by-id",
        why: "no consumer reads this role; the image is reached through a declared id pointer",
      };
    }
    if (dynamic) {
      return {
        verdict: "declined",
        why: "no literal mention, and a lookup is called with a variable role this tool cannot resolve",
      };
    }
    return { verdict: "orphan", why: "no consumer names this role" };
  }
  // HALF TWO. A consumer exists; can it match? A layout-keyed lookup skips
  // every image with no `layout`, so a role whose images carry none is
  // unreachable BY CONSTRUCTION however many callers name it.
  if (withLayout === 0) {
    const keyed = mentions.filter((m) => LAYOUT_KEYED.has(m.fn ?? ""));
    if (keyed.length > 0 && keyed.length === mentions.length) {
      return {
        verdict: "unreachable",
        why: `every consumer is layout-keyed (${[...new Set(keyed.map((k) => k.fn))].join(", ")}) and no image of this role declares a layout`,
      };
    }
  }
  return {
    verdict: "consumed",
    why: mentions.map((m) => `${m.via}:${m.file}`).join(", "),
  };
}

/** Every `.ts` under a root, skipping dependencies and generated output. */
function sources(root: string): string[] {
  const out: string[] = [];
  const skip = new Set(["node_modules", "docs", ".git", "dist", "_kg"]);
  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.startsWith(".") || skip.has(e)) continue;
      const p = join(dir, e);
      let s;
      try {
        s = statSync(p);
      } catch {
        continue;
      }
      if (s.isDirectory()) walk(p);
      else if (e.endsWith(".ts") && !e.endsWith(".d.ts")) out.push(p);
    }
  };
  walk(root);
  return out;
}

export function run(repoRoot: string): {
  findings: RoleFinding[];
  examined: number;
  unreadable: string[];
} {
  const findings: RoleFinding[] = [];
  const unreadable: string[] = [];
  let examined = 0;

  const files = sources(repoRoot);
  const mentions = new Map<string, Mention[]>();
  let dynamic = false;
  for (const f of files) {
    let src: string;
    try {
      src = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    // A test naming a role proves nothing about the SITE consuming it, and
    // counting one would make a check that passes because it is tested.
    if (f.includes(".test.") || f.includes("/tests/")) continue;
    const rel = relative(repoRoot, f);
    if (hasDynamicLookup(rel, src)) dynamic = true;
    for (const [role, ms] of mentionsIn(rel, code(src))) {
      mentions.set(role, [...(mentions.get(role) ?? []), ...ms]);
    }
  }

  for (const root of instanceRootsIn(repoRoot)) {
    const abs = resolve(repoRoot, root);
    let decl;
    try {
      decl = readDeclaration(abs);
    } catch (e) {
      // NEVER a silent skip. A declaration this tool cannot READ is not a
      // declaration with no roles, and treating them alike is how a gate
      // reports a clean run over a corpus it never opened. Fail loudly.
      unreadable.push(`${relative(repoRoot, abs) || abs}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }
    const images = decl?.images ?? [];
    if (images.length === 0) continue;
    const iconId = (decl as { icon?: string } | undefined)?.icon;
    const byRole = new Map<string, { layout?: unknown; id?: string }[]>();
    for (const i of images) {
      const r = (i as { role?: string }).role;
      if (r === undefined) continue;
      byRole.set(r, [...(byRole.get(r) ?? []), i as { layout?: unknown; id?: string }]);
    }
    for (const [role, imgs] of [...byRole].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      examined += 1;
      const byId = iconId !== undefined && imgs.some((i) => i.id === iconId);
      const { verdict, why } = judge(role, imgs, mentions.get(role) ?? [], byId, dynamic);
      findings.push({
        instance: relative(repoRoot, root) || root,
        role,
        images: imgs.length,
        withLayout: imgs.filter((i) => i.layout !== undefined).length,
        verdict,
        why,
      });
    }
  }
  return { findings, examined, unreadable };
}

/** The key a permit is written against. */
export function permitKey(f: { instance: string; role: string }): string {
  return `${f.instance}/${f.role}`;
}

/** The verdicts that fail the gate. `by-id` and `declined` are reported, never failed. */
export function failing(
  f: readonly RoleFinding[],
  permits: ReadonlyMap<string, string> = PERMITTED_ORPHANS,
): RoleFinding[] {
  return f.filter(
    (x) =>
      (x.verdict === "orphan" || x.verdict === "unreachable") &&
      !permits.has(permitKey(x)),
  );
}

/**
 * Permits whose finding is gone — a finding in their own right.
 *
 * Without this the list only ever grows, and every entry reads as a live
 * problem long after it was fixed. A permit is a claim about the corpus, and an
 * unchecked claim about the corpus is what this whole gate is against.
 */
export function stalePermits(
  f: readonly RoleFinding[],
  permits: ReadonlyMap<string, string> = PERMITTED_ORPHANS,
): string[] {
  const live = new Set(
    f.filter((x) => x.verdict === "orphan" || x.verdict === "unreachable").map(permitKey),
  );
  return [...permits.keys()].filter((k) => !live.has(k));
}

if (import.meta.main) {
  const repoRoot = resolve(import.meta.dir, "..", "..");
  const { findings, examined, unreadable } = run(repoRoot);

  for (const u of unreadable) console.error(`✗ declaration could not be read — ${u}`);

  if (examined === 0) {
    // EXAMINED NOTHING IS NOT A PASS. Exit 2 rather than 0 so a gate that has
    // lost its corpus — a moved declaration, a renamed field — is a failure
    // and not a clean run over an empty set.
    console.error("✗ no declared image role was examined — the corpus is empty, which is not a pass");
    process.exit(2);
  }

  const bad = failing(findings);
  const stale = stalePermits(findings);
  for (const k of stale) {
    console.error(`✗ permitted orphan \`${k}\` is no longer a finding — remove it from PERMITTED_ORPHANS`);
  }
  // An unreadable declaration outranks a clean finding: a sweep blind on one
  // instance has not cleared the others.
  if (unreadable.length > 0) process.exit(1);
  const byId = findings.filter((f) => f.verdict === "by-id");
  const declined = findings.filter((f) => f.verdict === "declined");
  const ok = findings.filter((f) => f.verdict === "consumed");

  for (const f of bad) {
    console.error(
      `✗ ${f.instance}: role \`${f.role}\` (${f.images} image(s), ${f.withLayout} with layout) — ${f.why}`,
    );
  }
  for (const f of [...byId, ...declined]) {
    console.log(`· ${f.instance}: \`${f.role}\` — ${f.verdict}: ${f.why}`);
  }

  const shape = `${ok.length} consumed, ${byId.length} reached by id, ${declined.length} declined`;
  const permitted = findings.filter(
    (x) => (x.verdict === "orphan" || x.verdict === "unreachable") && PERMITTED_ORPHANS.has(permitKey(x)),
  );
  for (const f of permitted) {
    console.log(`! ${f.instance}: \`${f.role}\` — ${f.verdict}, PERMITTED: ${PERMITTED_ORPHANS.get(permitKey(f))}`);
  }
  if (bad.length > 0 || stale.length > 0) {
    console.error(`\n✗ ${bad.length} unreadable role(s), ${stale.length} stale permit(s), of ${examined} examined — ${shape}`);
    process.exit(1);
  }
  const pz = permitted.length > 0 ? `, ${permitted.length} permitted and named` : "";
  console.log(`✓ ${examined} declared image role(s): ${shape}${pz}; 0 unpermitted orphans, 0 unreachable`);
}
