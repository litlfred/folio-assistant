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
 * Jekyll reads data only from `_data/`, and `harness.json` belongs at the
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
import { imageForRole, imagesForRole } from "../schemas/kg-node.js";

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

// The SMALL mark, resolved by ROLE rather than by the declared `icon` id,
// because the two answer different questions and the site needs both.
//
// `icon` is what the instance calls its mark — one id, the instance's choice.
// But a mark is rendered at two sizes that want different DRAWINGS: the
// sidebar at 24 px and a browser tab at 16 px cannot carry the detail a mark
// shown large can. `role: "browser-icon"` is the declaration already saying
// which image is drawn for that, and until 2026-09-19 nothing read it.
//
// Absent is FINE and is not guessed around: an instance declaring no
// `browser-icon` gets `null` here, and the templates fall back to `icon`.
// Substituting the large mark silently is how a 24 px blob ships.
const smallIcon = imageForRole(decl.images, "browser-icon");

// The landing backdrop's variants, keyed by layout, so the template can pick
// by viewport rather than parse a filename. An instance with none gets `{}`,
// and the template renders its description plainly — see `landing.html`, which
// treats a missing backdrop as a reason to draw no overlay rather than as a
// reason to guess where the quiet part of an image it does not have might be.
const landing: Record<string, unknown> = {};
for (const [layout, img] of imagesForRole(decl.images, "landing")) {
  landing[layout] = {
    src: siteRelative(img.src),
    width: img.width ?? null,
    height: img.height ?? null,
    // Percentages, because that is what CSS wants and computing them in
    // Liquid is worse than computing them here.
    region: img.textRegion
      ? {
          x: +(img.textRegion.x * 100).toFixed(3),
          y: +(img.textRegion.y * 100).toFixed(3),
          w: +(img.textRegion.w * 100).toFixed(3),
          h: +(img.textRegion.h * 100).toFixed(3),
        }
      : null,
    title: img.title ?? "",
    description: img.description ?? "",
  };
}

const payload = {
  _generated: "scripts/sync-docs-harness.ts — do not hand-edit; edit harness.json",
  name: decl.name,
  title: decl.title ?? decl.name,
  description: decl.description ?? "",
  icon: icon ? { src: siteRelative(icon.src), title: icon.title ?? "", description: icon.description ?? "" } : null,
  smallIcon: smallIcon
    ? { src: siteRelative(smallIcon.src), title: smallIcon.title ?? "", description: smallIcon.description ?? "" }
    : null,
  landing,
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
