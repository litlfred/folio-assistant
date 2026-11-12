import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dirFor, hasTranslation, localesFor, pageLocales, relinkForLocale, signedOff, translatePage, translateWithIncludes } from "./ig-page-translations.ts";

const po = (pairs: [string, string][]) => pairs.map(([i, s]) => `msgid "${i}"\nmsgstr "${s}"`).join("\n\n") + "\n";

function fixture(): string {
  const d = mkdtempSync(join(tmpdir(), "ig-tr-"));
  for (const [loc, body] of [["fr", po([["Hello world.", "Bonjour le monde."]])], ["ar", po([["Hello world.", ""]])]] as const) {
    mkdirSync(join(d, loc, "pagecontent"), { recursive: true });
    writeFileSync(join(d, loc, "pagecontent", "index.po"), body);
  }
  mkdirSync(join(d, "en", "pagecontent"), { recursive: true });
  writeFileSync(join(d, "en", "pagecontent", "index.po"), po([["Hello world.", "Hello world."]]));
  return d;
}

describe("ig-page-translations (fhir-harness#382)", () => {
  test("a locale with an empty catalogue, and the source locale, are not offered", () => {
    const locs = pageLocales(fixture());
    expect(locs.map((l) => l.locale)).toEqual(["fr"]);
    expect(locs[0]!.status).toBe("unverified");
    expect(localesFor("index", locs)).toEqual(["en", "fr"]);
    expect(localesFor("other", locs)).toEqual(["en"]);
  });

  test("no translations directory: no locales", () => {
    expect(pageLocales(undefined)).toEqual([]);
    expect(pageLocales(join(tmpdir(), "does-not-exist-382"))).toEqual([]);
  });

  test("injects the catalogue into the page", () => {
    const [fr] = pageLocales(fixture());
    const t = translatePage("# Title\n\nHello world.\n", fr!.catalogues.get("index")!);
    expect(t.md).toContain("Bonjour le monde.");
    expect(t.translated).toBe(1);
  });

  test("a locale is verified only with a named sign-off", () => {
    const d = mkdtempSync(join(tmpdir(), "ig-tr-s-"));
    writeFileSync(join(d, "status.json"), JSON.stringify({ official: true }));
    expect(signedOff(d)).toBe(false);
    writeFileSync(join(d, "status.json"), JSON.stringify({ official: true, signedOffBy: "Reviewer", signedOffAt: "2026-11-11" }));
    expect(signedOff(d)).toBe(true);
  });

  test("relative links climb out of the locale folder unless the target is translated", () => {
    const here = new Set(["concepts.html"]);
    const md = '[a](concepts.html) [b](faq.html#x) ![i](diagram.svg) [c](https://x.org) [d](#top) [e]({{site.baseurl}}/y) <a href="artifacts.html">f</a> <img src="/abs.png">';
    expect(relinkForLocale(md, here)).toBe(
      '[a](concepts.html) [b](../faq.html#x) ![i](../diagram.svg) [c](https://x.org) [d](#top) [e]({{site.baseurl}}/y) <a href="../artifacts.html">f</a> <img src="/abs.png">',
    );
  });

  test("Arabic is right to left", () => {
    expect(dirFor("ar")).toBe("rtl");
    expect(dirFor("fr")).toBe("ltr");
  });

  test("a page made only of includes is translated through them (home page)", () => {
    const [fr] = pageLocales(fixture());
    const src: Record<string, string> = { home: "{% include index.md %}\n\n{% include other.md %}\n", index: "Hello world.\n", other: "Not translated.\n" };
    const pages = new Set(Object.keys(src));
    const sourceOf = (s: string) => src[s];
    expect(hasTranslation("home", fr!, sourceOf, pages)).toBe(true);
    expect(hasTranslation("other", fr!, sourceOf, pages)).toBe(false);
    const t = translateWithIncludes("home", fr!, sourceOf, pages);
    expect(t.md).toContain("Bonjour le monde.");
    expect(t.md).toContain("{% include other.md %}");
  });
});
