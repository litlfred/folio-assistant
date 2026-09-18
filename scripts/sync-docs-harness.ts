/**
 * Put the instance's own title, description and mark where Jekyll can read them.
 *
 * just-the-docs draws `site.title` at the top of the left sidebar, and this
 * repo had `title: folio-assistant` written into `docs/_config.yml` by hand —
 * a second answer to "what is this instance called", free to disagree with the
 * declaration at the root and, on 2026-09-18, doing exactly that. The
 * declaration is the source; this copies the reader-facing part of it into
 * `docs/_data/harness.json`, which `docs/_includes/title.html` renders.
 *
 * Usage:  bun run scripts/sync-docs-harness.ts [--check]
 *
 * `--check` writes nothing and exits 1 if the copy is stale, for CI.
 *
 * ## Why a copy at all
 *
 * Jekyll reads data only from `_data/`, and `cat-harness.json` belongs at the
 * repository root where every other consumer looks for it. Symlinking it in
 * would work on a developer's machine and not in the Pages build. So: one
 * generated file, gated, rather than a second authored one.
 *
 * ## Site-relative, not repo-relative
 *
 * `images[].src` is repo-relative (`docs/assets/…`) because that is what a
 * reader of the declaration can open. The site serves `docs/` AS its root, so
 * the same file is at `/assets/…` once published. The conversion happens here,
 * once, rather than in the Liquid template where it would be invisible.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { readDeclaration } from "../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "..");
const OUT = join(ROOT, "docs/_data/harness.json");
const check = process.argv.includes("--check");

/** `docs/assets/x.svg` → `/assets/x.svg`; anything else is passed through. */
function siteRelative(src: string): string {
  return src.startsWith("docs/") ? `/${src.slice("docs/".length)}` : src;
}

const decl = readDeclaration(ROOT);
if (!decl) {
  console.error(`No declaration at ${ROOT}. Nothing to sync.`);
  process.exit(2);
}

const icon = decl.images?.find((i) => i.id === decl.icon);
const payload = {
  _generated: "scripts/sync-docs-harness.ts — do not hand-edit; edit cat-harness.json",
  name: decl.name,
  title: decl.title ?? decl.name,
  description: decl.description ?? "",
  icon: icon ? { src: siteRelative(icon.src), title: icon.title ?? "", description: icon.description ?? "" } : null,
};
const next = `${JSON.stringify(payload, null, 2)}\n`;
const current = existsSync(OUT) ? readFileSync(OUT, "utf-8") : "";

if (check) {
  if (current === next) {
    console.log("docs/_data/harness.json is up to date");
    process.exit(0);
  }
  console.error(
    `docs/_data/harness.json is stale.\n` +
      `Run \`bun run scripts/sync-docs-harness.ts\` and commit the result.`,
  );
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, next);
console.log(`Wrote docs/_data/harness.json — title "${payload.title}"`);
