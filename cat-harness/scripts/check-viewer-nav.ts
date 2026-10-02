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
 * ## The prior verdict is a BASELINE, and it may not be here (bean `0dav`)
 *
 * The regression is computed against a prior: the committed working copy until
 * QA results leave `main` for the `qa-reports` branch (owner rulings D1/D4),
 * and `--against <ref>` after. A prior that is not there used to FAIL the gate;
 * proposal §2.3 rules it `unknown` instead — printed as such, the regression
 * half explicitly not claimed, and not this change's defect. `--strict` still
 * fails on every `missing` page, which needs no prior.
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
  type ViewerNavFlag,
  type ViewerNavPage,
  type ViewerNavQa,
} from "../schemas/viewer-nav-qa.ts";
import { declinesNavbar, isStandalonePage, sitePathForPage } from "./viewer-page.ts";
import { againstOrUsage, qaResultsFile, readBaseline } from "./qa-results.ts";

const ROOT = instanceRootFor(import.meta.dir);
const REPO = repoRootFor(ROOT);
const DOCS = join(ROOT, siteDirFor(ROOT));
const SIDECAR = qaResultsFile(ROOT, join("viewer-nav", "viewer-nav.qa.json"));

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

/**
 * The layout flags a railed page FAILS (#1757). Read off the rail's own
 * markup, which `lib/navbar.ts` renders, so these are statements about what
 * the reader is served rather than about what a model asked for.
 *
 * Regex over one `<nav class="fa-nav">` rather than a DOM, for the reason
 * `documentIndexOf` gives: this walks the whole docs tree.
 */
export function layoutFlags(html: string): ViewerNavFlag[] {
  const at = html.indexOf('<nav class="fa-nav"');
  if (at < 0) return [];
  const end = html.indexOf("</nav>", at);
  const nav = html.slice(at, end < 0 ? undefined : end);
  const flags: ViewerNavFlag[] = [];

  const head = /<label class="fa-nav-head"([^>]*)>([\s\S]*?)<\/label>/.exec(nav);
  if (!head) flags.push("header");
  else {
    const control = /\bfor="fa-nav-open"/.test(head[1]!);
    // A mark is an avatar <img>, a drawn <svg>, or a LETTER — one
    // alphanumeric character. `☰` is not a letter: it names the action.
    const glyph = /<span class="fa-nav-glyph[^"]*"[^>]*>([\s\S]*?)<\/span>/.exec(head[2]!)?.[1] ?? "";
    const marked = /<img\b|<svg\b/.test(glyph) || /^[\p{L}\p{N}]$/u.test(glyph.trim());
    if (!control || !marked) flags.push("clickable-mark");
  }

  const summaries = [...nav.matchAll(/<details class="fa-nav-group"( open)?><summary>[\s\S]*?<span class="fa-nav-label">([^<]*)</g)];
  const open = summaries.filter((m) => m[1]);
  const own = (label: string): boolean => label !== "Graphs" && label !== "Harnesses";
  if (!summaries.some((m) => own(m[2]!))) flags.push("visualiser-nav");
  if (open.length !== 1 || !own(open[0]![2]!)) flags.push("single-open");

  // A hamburger-SHAPED glyph is the same defect as the `☰` itself: the owner
  // saw `≡` under the avatar and read it as the toggle that was removed.
  const glyphs = [...nav.matchAll(/<span class="fa-nav-glyph[^"]*"[^>]*>([^<]*)<\/span>/g)].map((m) => m[1]!.trim());
  const burger = glyphs.some((g) => /^(?:☰|≡|&#9776;|&#8801;|&equiv;)$/.test(g));
  if (nav.includes('class="fa-nav-close"') || nav.includes("&#9776;") || nav.includes("☰") || burger) {
    flags.push("no-redundant-toggle");
  }
  return flags;
}

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
      const flags = layoutFlags(html);
      pages.push({ path, source, verdict: "railed", ...(flags.length ? { flags } : {}) });
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
      flagged: pages.filter((p) => p.flags?.length).length,
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

/**
 * Layout flags a railed page has GAINED since the sidecar — a page that was
 * graded clean on a criterion and now fails it. Only pages the prior audit
 * graded (it recorded `flags` support) are compared: a sidecar written before
 * the flags existed graded nothing, and treating its silence as "clean" would
 * fail every branch on the day this lands.
 */
export function flagRegressions(before: ViewerNavQa, after: ViewerNavQa): string[] {
  if (before.totals.flagged === undefined) return [];
  const was = new Map(before.pages.map((p) => [p.path, new Set(p.flags ?? [])]));
  const out: string[] = [];
  for (const p of after.pages) {
    const prior = was.get(p.path);
    if (!prior) continue;
    for (const f of p.flags ?? []) if (!prior.has(f)) out.push(`${p.path} now fails ${f}`);
  }
  return out;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const strict = process.argv.includes("--strict");
  const { against, exit: badRef } = againstOrUsage("check:viewer-nav", process.argv.slice(2));
  if (badRef !== undefined) process.exit(badRef);
  const now = audit(DOCS, REPO);
  const text = JSON.stringify(now, null, 2) + "\n";

  let failed = 0;

  if (check || strict) {
    // The prior verdict to regress FROM — the committed working copy until QA
    // results leave `main`, `--against <ref>` on the `qa-reports` branch after
    // (bean `0dav`). Four states, and a miss is never a clean prior.
    const base = readBaseline(SIDECAR, { against });
    if (base.state !== "hit") {
      // It used to FAIL here: "with no sidecar there is no prior verdict to
      // regress FROM, so the gate would pass over anything". The premise holds
      // and the remedy changed with the arc: once the record is not committed,
      // absence is the normal state, and proposal §2.3 rules a missing
      // baseline `unknown` — reported, never a pass, and not this change's
      // defect. So it is said loudly, the regression half is NOT claimed, and
      // `--strict` still fails on every missing page below.
      console.log(
        `  ? UNKNOWN — no prior verdict to regress from (${base.from}: ${base.state}, ${base.reason}). ` +
          `The REGRESSION half of this gate was not run; that is not a pass of it. ` +
          `Pass --against <ref> to read one from the qa-reports branch.`,
      );
    } else {
      // A REGRESSION IS NAMED BEFORE THE STALENESS, because "the sidecar is
      // stale" is a true statement that tells a reader nothing about what
      // broke. The parse is guarded: an unparseable sidecar is reported as
      // stale, which is the honest reading and not a second failure mode.
      let prior: ViewerNavQa | undefined;
      try {
        const parsed = ViewerNavQaSchema.safeParse(JSON.parse(base.text));
        if (parsed.success) prior = parsed.data;
      } catch {
        prior = undefined;
      }
      if (prior) {
        for (const r of regressions(prior, now)) {
          console.error(`  ✗ REGRESSION: ${r}`);
          failed++;
        }
      } else {
        console.log(`  ? UNKNOWN — the prior verdict (${base.from}) is not a ${VIEWER_NAV_QA_SCHEMA} document; the regression half was not run.`);
      }
      if (base.text !== text && against === undefined) {
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

  // A LAYOUT FLAG THAT APPEARS is a regression of the same kind as a lost
  // rail: the page was graded clean and now is not, and the author of the
  // diff is the one who did it. Gated in `check` on that basis; the absolute
  // list is `strict`'s.
  if (check || strict) {
    const have = existsSync(SIDECAR) ? readFileSync(SIDECAR, "utf-8") : null;
    let prior: ViewerNavQa | undefined;
    try {
      const parsed = have ? ViewerNavQaSchema.safeParse(JSON.parse(have)) : undefined;
      if (parsed?.success) prior = parsed.data;
    } catch {
      prior = undefined;
    }
    if (prior) {
      for (const r of flagRegressions(prior, now)) {
        console.error(`  ✗ REGRESSION: ${r}`);
        failed++;
      }
    }
  }

  if (strict) {
    for (const p of now.pages.filter((x) => x.flags?.length)) {
      console.error(`  ✗ ${p.path} — fails ${p.flags!.join(", ")} (${p.source})`);
      failed++;
    }
    for (const p of now.pages.filter((x) => x.verdict === "missing")) {
      console.error(`  ✗ ${p.path} — ${p.reason} (${p.source})`);
      failed++;
    }
  }

  console.log(
    `  ${now.totals.railed} railed, ${now.totals.declined} declined, ` +
      `${now.totals.missing} missing, of ${now.totals.pages} generated viewer page(s); ` +
      `${now.totals.flagged} railed page(s) fail a layout flag`,
  );
  process.exit(failed > 0 ? 1 : 0);
}
