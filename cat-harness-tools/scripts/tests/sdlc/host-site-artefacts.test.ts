/**
 * Routes a visualiser builds on the HOST site (`builtOnHostSite`; bean
 * folio-assistant-uldr, owner option "1", 2026-11-06) are derived into the
 * publish plan, so the host lists none of them. Two halves are pure and
 * checked here: where a derived route sits in the host's writer order, and
 * which locales a translated viewer writes.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { translatedLocales, withHostSiteArtefacts, writersOf, type DeclaredArtefact } from "../../derive-at-publish.ts";

const entry = (instance: string, path: string, writer: string, extra: Partial<DeclaredArtefact> = {}): DeclaredArtefact => ({
  instance,
  abs: `/r/${instance}/${path}`,
  path,
  writer: [writer],
  because: "checkout",
  ...extra,
});

describe("a derived route keeps the host's writer order", () => {
  const declared = [
    entry("host", "docs/a/", "a:pages"),
    entry("host", "docs/assets/glossary/", "glossary:page", { index: true }),
    entry("host", "docs/z/", "z:pages", { reads: ["docs"] }),
  ];
  const derived = [
    entry("host", "docs/en/core/glossary/", "glossary:page", { index: true, hostSiteOf: "core" }),
    entry("host", "docs/fr/core/glossary/", "glossary:page", { index: true, optional: true, hostSiteOf: "core" }),
    entry("host", "docs/en/core/bibliography/", "bibliography:page", { hostSiteOf: "core" }),
  ];

  test("a route goes after its writer's own entry, and a new writer after its harness's last route", () => {
    expect(withHostSiteArtefacts(declared, derived).map((a) => a.path)).toEqual([
      "docs/a/",
      "docs/assets/glossary/",
      "docs/en/core/glossary/",
      "docs/fr/core/glossary/",
      "docs/en/core/bibliography/",
      "docs/z/",
    ]);
  });

  test("so the bibliography writer runs before a writer that reads the site, exactly as when the host listed it", () => {
    const listed = [declared[0]!, declared[1]!, entry("host", "docs/en/core/bibliography/", "bibliography:page"), declared[2]!];
    expect(writersOf(withHostSiteArtefacts(declared, derived))).toEqual(writersOf(listed));
  });

  test("with no place to go, a route goes at the end", () => {
    expect(withHostSiteArtefacts([], derived.slice(2)).map((a) => a.path)).toEqual(["docs/en/core/bibliography/"]);
  });
});

describe("the locales a translated viewer writes", () => {
  let tmp: string;
  beforeAll(() => {
    tmp = mkdtempSync(join(tmpdir(), "host-site-locales-"));
    const decl = (name: string, directories: unknown[]) => {
      const p = join(tmp, name, `${name}.json`);
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, JSON.stringify({ name, needs: [], directories }));
    };
    decl("host", [{ id: "host-translations", path: "translations/", graphTypologies: ["translation-sources"] }]);
    decl("upper", [{ id: "upper-translations", path: "po/", graphTypologies: ["translation-sources"] }]);
    for (const d of ["host/translations/fr/glossary", "host/translations/en", "host/translations/_tmp", "upper/po/ar", "upper/po/fr"]) mkdirSync(join(tmp, d), { recursive: true });
  });
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  test("every layer's translation-sources locales, once each, the page locale and non-locale folders aside", () => {
    expect(translatedLocales(tmp)).toEqual(["ar", "fr"]);
  });
});
