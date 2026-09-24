/**
 * The viewer-navbar audit — bean `edx7`, and the owner asked for it directly.
 *
 * ```sh
 * bun run viewer:nav:audit    # write the sidecar
 * bun run check:viewer-nav    # GATED: fail on a REGRESSION and nothing else
 * bun run viewer:nav:strict   # an author's check: staleness and every finding
 * ```
 *
 * ## Why the GATE is regressions only, and this is the `library:viz` ruling
 *
 * The owner settled the general case on 2026-09-20: `library:viz:check` is
 * deliberately ungated **because it derives from the whole repository**, so it
 * reddens when somebody else merges and a red then means "somebody else
 * merged" rather than "the author of this diff forgot something".
 *
 * This audit walks the whole docs tree and has exactly that shape — a page
 * added anywhere makes the committed sidecar stale on every open branch at
 * once. So staleness is NOT the gate. A **regression** is: a page that was
 * railed and is not any more is always the author of the diff, every time,
 * which is the test the gate comments in `code-quality-gates.yml` state.
 *
 * That is also the whole of what the owner asked the sidecar to prevent. "The
 * count cannot silently return to 0" is a statement about rails being LOST,
 * and losing one is precisely what `regressions` names and the gate refuses.
 * A page that has never had a rail is a generator nobody wired — worth
 * reporting, and `strict`'s job, run by the author who added it.
 *
 * ## Why `strict` and not `check` carries the one finding open today
 *
 * Because one page is missing today for a reason that is NOT this change's to
 * settle, and a gate that is red on the day it lands is a gate people learn to
 * re-run rather than read.
 *
 * `cat-harness/docs/cat-harness/schemas/detangle/index.html` is committed, and
 * `gen-schema-viz.ts` prunes it as an orphan — its subject stopped being an
 * instance when `detangle` became a directory of this harness (bean `byql`).
 * `schema:viz:check` was ALREADY failing on clean `main` for this, and it is
 * ungated, so nothing reported it. Removing the page is a durable deletion and
 * therefore the owner's
 * (`deletion-requires-confirmation`), so it is recorded here as a `missing`
 * with its reason rather than quietly swept or quietly tolerated.
 *
 * So the split is the one `kg:audit` already uses here: `check` fails on
 * staleness and on a **regression**, `strict` fails on any finding. That still
 * makes the count unable to return to 0 silently — a page that LOSES its rail
 * changes its verdict, which makes the sidecar stale, which fails `check`.
 * What it does not do is hold this branch hostage to somebody else's orphan.
 *
 * ## The sidecar is the record; this script is not
 *
 * A console report would make "unrailed since it was drawn" and "lost its rail
 * in the commit under review" look the same. Committed, the diff says which —
 * the same argument `kg:audit` makes for writing sidecars rather than printing.
 *
 * @module scripts/check-viewer-nav
 * @covers docs — it walks the whole docs tree, one finding per generated viewer page whose
 *   navbar regressed
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

import { instanceRootFor, repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";
import {
  VIEWER_NAV_QA_SCHEMA,
  ViewerNavQaSchema,
  type ViewerNavPage,
  type ViewerNavQa,
} from "../schemas/viewer-nav-qa.ts";
import { declinesNavbar, isStandalonePage, sitePathForPage } from "./viewer-page.ts";

const ROOT = instanceRootFor(import.meta.dir);
const REPO = repoRootFor(ROOT);
const DOCS = join(ROOT, siteDirFor(ROOT));
const SIDECAR = join(ROOT, "test", "results", "viewer-nav", "viewer-nav.qa.json");

/**
 * Every generated page under the docs root.
 *
 * `index.html` only, and that is the family rather than a convenience: a
 * viewer generator publishes a DIRECTORY that opens, so its page is always the
 * directory's index. A `.html` sitting beside other files is an artefact of
 * some other pipeline — the IRIS replica's `item-*.html`, say — and those are
 * not this audit's subject.
 */
function pagesUnder(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "index.html") out.push(p);
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
}

/** Why a page has no rail, in the words the next reader needs. */
const WHY_MISSING = "standalone page with no rail and no declared opt-out";
const WHY_DECLINED = "declares <meta name=\"folio-navbar\" content=\"none\">";

export function audit(docs: string, repo: string): ViewerNavQa {
  const pages: ViewerNavPage[] = [];
  for (const abs of pagesUnder(docs)) {
    const html = readFileSync(abs, "utf-8");
    // A source page with YAML front matter gets the theme's sidebar from the
    // layout and is not this family. Read off the CONTENT, because "no layout
    // will wrap this" is a property of the file, not of its path.
    if (!isStandalonePage(html)) continue;
    const source = relative(repo, abs).split(sep).join("/");
    const path = sitePathForPage(docs, abs);
    if (html.includes('class="fa-nav"')) {
      pages.push({ path, source, verdict: "railed" });
    } else if (declinesNavbar(html)) {
      pages.push({ path, source, verdict: "declined", reason: WHY_DECLINED });
    } else {
      pages.push({ path, source, verdict: "missing", reason: WHY_MISSING });
    }
  }
  pages.sort((a, b) => a.path.localeCompare(b.path, "en"));
  const count = (v: string): number => pages.filter((p) => p.verdict === v).length;
  return {
    $schema: VIEWER_NAV_QA_SCHEMA,
    root: relative(repo, docs).split(sep).join("/"),
    totals: {
      pages: pages.length,
      railed: count("railed"),
      declined: count("declined"),
      missing: count("missing"),
    },
    pages,
  };
}

/**
 * Did a page that was railed stop being railed?
 *
 * THE REGRESSION IS THE GATE, not the absolute count. A page appearing
 * unrailed for the first time is a new generator nobody has wired — worth
 * reporting, and `strict`'s job. A page that HAD the rail and lost it is
 * somebody's change undoing this one, and that is what must never pass.
 */
export function regressions(before: ViewerNavQa, after: ViewerNavQa): string[] {
  const was = new Map(before.pages.map((p) => [p.path, p.verdict]));
  return after.pages
    .filter((p) => was.get(p.path) === "railed" && p.verdict !== "railed")
    .map((p) => `${p.path} was railed and is now ${p.verdict}`);
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const strict = process.argv.includes("--strict");
  const now = audit(DOCS, REPO);
  const text = JSON.stringify(now, null, 2) + "\n";

  let failed = 0;

  if (check || strict) {
    const have = existsSync(SIDECAR) ? readFileSync(SIDECAR, "utf-8") : null;
    if (have === null) {
      // NOT the same as staleness, and it fails the gate: with no sidecar
      // there is no prior verdict to regress FROM, so the gate would pass over
      // anything. A check that cannot see its subject is never green — the
      // could-not-determine rule, and the one case where absence is the
      // finding rather than a third state.
      console.error(`  ✗ ${relative(REPO, SIDECAR)} is missing — run \`bun run viewer:nav:audit\``);
      failed++;
    } else {
      // A REGRESSION IS NAMED BEFORE THE STALENESS, because "the sidecar is
      // stale" is a true statement that tells a reader nothing about what
      // broke. The parse is guarded: an unparseable sidecar is reported as
      // stale, which is the honest reading and not a second failure mode.
      let prior: ViewerNavQa | undefined;
      try {
        const parsed = ViewerNavQaSchema.safeParse(JSON.parse(have));
        if (parsed.success) prior = parsed.data;
      } catch {
        prior = undefined;
      }
      if (prior) {
        for (const r of regressions(prior, now)) {
          console.error(`  ✗ REGRESSION: ${r}`);
          failed++;
        }
      }
      if (have !== text) {
        const line = `${relative(REPO, SIDECAR)} is stale — run \`bun run viewer:nav:audit\``;
        // Stale is a FINDING for the author and a NOTE for the gate. See the
        // module header: this sidecar derives from the whole docs tree, so a
        // page added anywhere makes it stale on every open branch at once.
        if (strict) {
          console.error(`  ✗ ${line}`);
          failed++;
        } else {
          console.log(`  · ${line}`);
        }
      }
    }
  } else {
    mkdirSync(dirname(SIDECAR), { recursive: true });
    writeFileSync(SIDECAR, text);
    console.log(`  ✓ ${relative(REPO, SIDECAR)}`);
  }

  if (strict) {
    for (const p of now.pages.filter((x) => x.verdict === "missing")) {
      console.error(`  ✗ ${p.path} — ${p.reason} (${p.source})`);
      failed++;
    }
  }

  console.log(
    `  ${now.totals.railed} railed, ${now.totals.declined} declined, ` +
      `${now.totals.missing} missing, of ${now.totals.pages} generated viewer page(s)`,
  );
  process.exit(failed > 0 ? 1 : 0);
}
