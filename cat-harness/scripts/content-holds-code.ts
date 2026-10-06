/**
 * Does a CONTENT instance hold code? — kg:audit's `content-instance-holds-code`.
 *
 * @module scripts/content-holds-code
 *
 * ## The rule, and where it comes from
 *
 * `kg-separation`: a knowledge graph separates into a CONTENT repository (files
 * to read, no code — bootstrap FR-7, "a reader needs nothing installed") and a
 * TOOLS repository (`<name>-tools`, the code that writes and checks it). The
 * rule is only as good as something that notices it being broken, and until
 * 2026-09-30 nothing did for an instance that has no tools repository yet.
 *
 * Owner, 2026-09-30, on who-iris: *"dspace scripts generic in folio-assistant.
 * iris specific tools for now ok in who-iris/ but make sure fails QA finding"*.
 * So the generic code moved to core (bean `eayu`) and what is left is
 * tolerated — which is exactly why it must FAIL rather than be silent: a
 * tolerated violation nothing reports is indistinguishable from none.
 *
 * ## Which instances are content — declared, never guessed
 *
 * Two signals, both read from declarations:
 *
 *   1. `separation: "content"` on the instance itself (who-iris);
 *   2. a declared TOOLS instance names it in `supports` (bootstrap, supported
 *      by bootstrap-tools) — the pair exists, so this is its content half.
 *
 * NOT "the declared `repository` differs from `livesAt.repository`". Every
 * staged instance here satisfies that, platform ones included (cat-harness,
 * core), and whether each becomes a content/tools pair is a decision not yet
 * made for most. Firing on all of them would turn a finding about one
 * tolerated case into a wall nobody reads.
 *
 * ## What counts as code
 *
 * A file git accounts for under the instance root whose extension is a
 * programming language's — see {@link CODE_EXTENSIONS}. EXCEPT files under a
 * directory the instance declares as graph typology `folio`: a folio's block
 * manifests are authored CONTENT that happens to be written as TypeScript
 * data (they import `../schema/builders`), and reporting them would make every
 * folio fail a rule about tooling.
 *
 * ## Three states
 *
 * `n/a` — not declared content. `pass`/`fail` — content, and git listed the
 * files. `unknown` — git could not list them, or a declaration could not be
 * read: never a pass, because "could not look" is not "looked and found none".
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { findDeclarationFile, instanceRootsIn, readDeclaration, siblingScopeFor } from "../schemas/cat-harness.js";
import { gitCorpus } from "../schemas/git-corpus.js";
import type { KgFinding } from "../schemas/kg-qa.js";

/** Extensions read as code. Lower-case, with the dot. */
export const CODE_EXTENSIONS: readonly string[] = [
  ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".sh", ".bash", ".bat", ".cmd", ".ps1", ".rb", ".go", ".rs", ".java", ".lean",
];

/** Graph typologies whose directories hold authored content written as code-shaped data. */
export const CONTENT_MANIFEST_KINDS: readonly string[] = ["folio"];

/** Why an instance is content, or `undefined` when nothing declares it so. */
export function contentBasis(instanceRoot: string, siblings: readonly string[]): string | undefined {
  const decl = readDeclaration(instanceRoot);
  if (decl === undefined) return undefined;
  if (decl.separation === "content") return `\`${decl.name}\` declares \`separation: "content"\``;
  for (const s of siblings) {
    if (resolve(s) === resolve(instanceRoot)) continue;
    const file = findDeclarationFile(s);
    if (file === undefined) continue;
    // `supports` is bootstrap-tools' field and not part of the harness
    // declaration schema, which strips it — so it is read from the raw file.
    const raw = JSON.parse(readFileSync(join(s, file), "utf-8")) as { name?: string; supports?: Record<string, unknown> };
    if (raw.supports && Object.hasOwn(raw.supports, decl.name)) {
      return `\`${raw.name ?? file}\` declares \`supports.${decl.name}\` — it is the tools half, so \`${decl.name}\` is the content half`;
    }
  }
  return undefined;
}

/** Instance-relative directories whose declared kinds make their `.ts` files content. */
function manifestDirs(instanceRoot: string): string[] {
  const decl = readDeclaration(instanceRoot);
  return (decl?.directories ?? [])
    .filter((d) => d.graphTypologies.some((k) => CONTENT_MANIFEST_KINDS.includes(k)))
    .map((d) => d.path.replace(/\/+$/, ""));
}

/**
 * The code files in `files` (absolute), instance-relative and sorted.
 * Pure over its inputs so a test can hand it a planted listing.
 */
export function codeFiles(instanceRoot: string, files: readonly string[], exemptDirs: readonly string[] = []): string[] {
  const root = resolve(instanceRoot);
  return files
    .map((f) => relative(root, f).split(sep).join("/"))
    .filter((r) => !r.startsWith("..") && r.length > 0)
    .filter((r) => {
      const dot = r.lastIndexOf(".");
      return dot > r.lastIndexOf("/") && CODE_EXTENSIONS.includes(r.slice(dot).toLowerCase());
    })
    .filter((r) => !exemptDirs.some((d) => r === d || r.startsWith(`${d}/`)))
    .sort();
}

export type ContentCodeVerdict =
  | { state: "n/a" }
  | { state: "unknown"; reason: string }
  | { state: "judged"; basis: string; files: string[] };

/**
 * The verdict for one instance. `lister` defaults to git; a test passes its own.
 */
export function contentInstanceCode(
  instanceRoot: string,
  lister: (dir: string) => string[] | undefined = (d) => gitCorpus(d),
): ContentCodeVerdict {
  let basis: string | undefined;
  try {
    basis = contentBasis(instanceRoot, instanceRootsIn(siblingScopeFor(instanceRoot)));
  } catch (e) {
    return { state: "unknown", reason: `a declaration could not be read — ${(e as Error).message.split("\n")[0]}` };
  }
  if (basis === undefined) return { state: "n/a" };
  if (!existsSync(instanceRoot)) return { state: "unknown", reason: `${instanceRoot} does not exist` };
  const listed = lister(instanceRoot);
  if (listed === undefined) {
    return { state: "unknown", reason: "git could not list this instance's files, so whether it holds code is undetermined" };
  }
  return { state: "judged", basis, files: codeFiles(instanceRoot, listed, manifestDirs(instanceRoot)) };
}

/** The verdict as kg-audit findings: one per file, each saying why it fails. */
export function contentCodeFindings(v: Extract<ContentCodeVerdict, { state: "judged" }>): KgFinding[] {
  return v.files.map((f) => ({
    where: f,
    detail:
      `${f} is code in a CONTENT instance (${v.basis}). A content repository holds no code ` +
      `(kg-separation, bootstrap FR-7): move it to the platform if it is generic, or to a ` +
      `\`<name>-tools\` repository once one is authorised. Tolerated for now is still a finding.`,
  }));
}
