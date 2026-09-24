/**
 * Rail the standalone pages, as a LAST step over the finished site — bean `oi1y`.
 *
 * ## Why this is its own entry point rather than a line in `mount-instance-docs`
 *
 * Because ordering is the whole of it, and the first version got it wrong in a
 * way no unit test could see.
 *
 * `mount-instance-docs.ts` runs at line 284 of `docs-site.yml`.
 * `publish-instance-files.ts --instance ./bootstrap` writes bootstrap's pages
 * at line 426. So a pass hosted inside the mount script walks the site **142
 * lines before ten of its subjects exist**, rails the 23 wireframes (committed,
 * therefore present) and silently misses the 10 bootstrap pages (generated,
 * therefore not yet there).
 *
 * The fixture could not catch that: it hands the pass a finished directory,
 * which is precisely the state the real build is not in at that moment. It was
 * caught by opening the STAGED BUILD and counting — 1 of 11 bootstrap pages
 * navigated, unchanged from `main`, while the wireframes had moved.
 *
 * **A pass over "every page the site publishes" has a precondition, and the
 * precondition is that the site is finished.** Naming that in a separate step
 * placed last is what makes it checkable; burying it inside a script that runs
 * for other reasons is what made it invisible.
 *
 * ## It is idempotent, which is what makes running it last safe
 *
 * `injectRail` refuses a page that already carries a navigation, so pages the
 * mount pass railed earlier are left byte-identical here.
 *
 * Usage:
 *   bun run cat-harness/scripts/rail-standalone-pages.ts --site ./_site --built cat-harness
 *
 * @module scripts/rail-standalone-pages
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { mountRoutes, railStandalonePages } from "./mount-instance-docs.js";


function main(): number {
  const argv = process.argv.slice(2);
  const at = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const site = at("--site");
  const built = at("--built");
  if (!site || !built) {
    console.error("usage: rail-standalone-pages.ts --site <dir> --built <instance-dir-name>");
    return 2;
  }
  const siteAbs = resolve(site);
  if (!existsSync(siteAbs)) {
    // Could-not-determine, said out loud rather than reported as a clean run
    // over nothing. A pass that silently rails zero pages because the site is
    // not there is the shape this whole bean is about.
    console.error(`  ? ${siteAbs} does not exist — nothing to rail, and that is not a pass`);
    return 2;
  }

  // ASKED, not guessed — see `mountRoutes`. Guessing from directory names
  // called `bootstrap` a mount and skipped the ten pages this step exists for.
  const routes = mountRoutes(built);
  const r = railStandalonePages(siteAbs, built, built, routes);
  console.log(
    `rail-standalone-pages: rail on ${r.injected} page(s), ` +
      `${r.alreadyNavigated} already navigated, ${routes.length} mount route(s) left to the mount pass`,
  );
  if (r.skipped.length) {
    console.log(`  ${r.skipped.length} file(s) took no rail (no <body>):`);
    for (const f of r.skipped.slice(0, 5)) console.log(`      ${f}`);
    if (r.skipped.length > 5) console.log(`      … and ${r.skipped.length - 5} more`);
  }
  return 0;
}

if (import.meta.main) process.exit(main());
