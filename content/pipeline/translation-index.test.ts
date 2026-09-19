/**
 * The translation index — the declaration is what makes a directory
 * translated, and the index is what the navbar reads.
 *
 * Two halves are tested here, and only one of them can be tested in a browser.
 *
 *   * The DECLARATION half: that a locale directory is known because
 *     `cat-harness.json` says so, and is unknown when it does not — including
 *     when its name is the most obvious language subtag there is.
 *   * The STATIC-NAV half: that every declared translated page carries
 *     `nav_exclude: true`. `tests/nav-locale.e2e.ts` cannot check this, because
 *     it hand-writes the nav markup and would "verify" the rule by simply not
 *     putting the French item in. Jekyll honours `nav_exclude`; this is what
 *     makes sure the pages still ask it to.
 *
 * Nothing here pins a count or a locale list. Both change the moment somebody
 * adds a translation, and a fixture that is a live verdict about the corpus is
 * not a fixture — every expectation below is derived from the declaration at
 * test time, or named explicitly as a synthetic case in a temp instance.
 */
import { describe, it, expect } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ContentDirectorySchema, readDeclaration } from "../../schemas/cat-harness.ts";
import {
  INDEX_PATH,
  INDEX_SCHEMA,
  buildTranslationIndex,
  checkTranslationIndex,
  frontMatter,
  pageKey,
  pageUrl,
  translatedDirectories,
} from "./translation-index.ts";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** A throwaway instance with a `cat-harness.json` and a `docs/` tree. */
function instance(
  decl: Record<string, unknown>,
  files: Record<string, string>,
): { root: string; dispose: () => void } {
  const root = mkdtempSync(join(tmpdir(), "translation-index-"));
  writeFileSync(join(root, "cat-harness.json"), JSON.stringify(decl, null, 2), "utf-8");
  for (const [rel, body] of Object.entries(files)) {
    const p = join(root, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body, "utf-8");
  }
  return { root, dispose: () => rmSync(root, { recursive: true, force: true }) };
}

const SOURCE_PAGE = `---
layout: default
title: Home
lang: en
permalink: /
---

# Home
`;

const FRENCH_PAGE = `---
layout: default
title: Accueil (FR)
lang: fr
nav_exclude: true
translation_source: index.md
---

# Accueil
`;

describe("a directory is translated because the declaration says so", () => {
  it("indexes a declared locale directory", () => {
    const { root, dispose } = instance(
      {
        name: "t",
        directories: [
          { id: "docs-fr", path: "docs/fr/", locale: "fr", graphs: ["translated-content"] },
        ],
      },
      { "docs/index.md": SOURCE_PAGE, "docs/fr/index.md": FRENCH_PAGE },
    );
    try {
      const { index, findings } = buildTranslationIndex(root);
      expect(findings.filter((f) => f.severity !== "note")).toEqual([]);
      expect(index.locales).toEqual(["fr"]);
      expect(index.pages[""].translations.fr.url).toBe("/fr/index.html");
      expect(index.pages[""].translations.fr.title).toBe("Accueil (FR)");
    } finally {
      dispose();
    }
  });

  it("does NOT index an UNDECLARED `fr/` — the whole point", () => {
    // Byte for byte the same tree as above with the declaration removed. If
    // anything anywhere read `fr` out of the path, this would still index it —
    // and the test would pass for the wrong reason in the previous case too.
    const { root, dispose } = instance(
      { name: "t", directories: [] },
      { "docs/index.md": SOURCE_PAGE, "docs/fr/index.md": FRENCH_PAGE },
    );
    try {
      const { index, findings } = buildTranslationIndex(root);
      expect(index.locales).toEqual([]);
      expect(Object.keys(index.pages)).toEqual([]);
      // And it is not silently dropped either: an undeclared page carrying a
      // non-source `lang` is exactly the page that stays in the navbar under
      // English, which is the reported bug. It is reported as an error.
      const e = findings.filter((f) => f.severity === "error");
      expect(e.map((f) => f.where)).toEqual(["docs/fr/index.md"]);
      expect(e[0].message).toContain("outside every declared");
    } finally {
      dispose();
    }
  });

  it("refuses `translated-content` with no `locale`", () => {
    const r = ContentDirectorySchema.safeParse({
      id: "x",
      path: "docs/fr/",
      graphs: ["translated-content"],
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain("NOT read from the path");
  });

  it("refuses a `locale` on a directory that is not translated content", () => {
    const r = ContentDirectorySchema.safeParse({
      id: "x",
      path: "docs/",
      locale: "fr",
      graphs: ["cat-harness"],
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain("nothing reads it");
  });
});

describe("the file and the directory must agree", () => {
  const cases: Array<{ name: string; page: string; expect: string }> = [
    {
      name: "a `lang` that contradicts the directory's `locale`",
      page: FRENCH_PAGE.replace("lang: fr", "lang: es"),
      expect: "when they disagree",
    },
    {
      name: "no `nav_exclude`, so just-the-docs renders it for everybody",
      page: FRENCH_PAGE.replace("nav_exclude: true\n", ""),
      expect: "it cannot un-render one",
    },
    {
      name: "a `nav_order` as well, which contradicts `nav_exclude`",
      page: FRENCH_PAGE.replace("nav_exclude: true", "nav_exclude: true\nnav_order: 1.1"),
      expect: "takes its source page's position",
    },
    {
      name: "no `translation_source`, so nothing says what it translates",
      page: FRENCH_PAGE.replace("translation_source: index.md\n", ""),
      expect: "which page it translates",
    },
    {
      name: "a `translation_source` naming a page that is not there",
      page: FRENCH_PAGE.replace("translation_source: index.md", "translation_source: gone.md"),
      expect: "which is not there",
    },
  ];

  for (const c of cases) {
    it(`reports ${c.name}`, () => {
      const { root, dispose } = instance(
        {
          name: "t",
          directories: [
            { id: "docs-fr", path: "docs/fr/", locale: "fr", graphs: ["translated-content"] },
          ],
        },
        { "docs/index.md": SOURCE_PAGE, "docs/fr/index.md": c.page },
      );
      try {
        const { index, findings } = buildTranslationIndex(root);
        const errors = findings.filter((f) => f.severity === "error");
        expect(errors.map((f) => f.where)).toEqual(["docs/fr/index.md"]);
        expect(errors[0].message).toContain(c.expect);
        // A page that fails a rule is never half-indexed: a nav item pointing
        // at a page whose declaration is wrong is worse than no nav item.
        expect(index.pages[""]?.translations.fr).toBeUndefined();
      } finally {
        dispose();
      }
    });
  }
});

describe("three states", () => {
  it("a declared directory that is not there is UNREADABLE, not empty", () => {
    // The `dh4f` shape: absent and empty are indistinguishable to a consumer,
    // so declaring a directory nobody created turns a real gap into a clean
    // run. It must gate at exit 2 rather than publishing "no translations".
    const { root, dispose } = instance(
      {
        name: "t",
        directories: [
          { id: "docs-fr", path: "docs/fr/", locale: "fr", graphs: ["translated-content"] },
        ],
      },
      { "docs/index.md": SOURCE_PAGE },
    );
    try {
      const r = checkTranslationIndex(root);
      expect(r.state).toBe("unreadable");
      expect(r.findings.some((f) => f.severity === "unreadable")).toBe(true);
    } finally {
      dispose();
    }
  });

  it("no declared directories at all is DETERMINED empty", () => {
    const { root, dispose } = instance({ name: "t", directories: [] }, { "docs/index.md": SOURCE_PAGE });
    try {
      const { index, findings } = buildTranslationIndex(root);
      expect(findings.filter((f) => f.severity !== "note")).toEqual([]);
      expect(index.$schema).toBe(INDEX_SCHEMA);
      expect(index.pages).toEqual({});
    } finally {
      dispose();
    }
  });

  it("an unparseable SOURCE page is a note until a translation names it", () => {
    const broken = "---\ntitle: Lean cache: the loop\n---\n\nx\n";
    const decl = {
      name: "t",
      directories: [
        { id: "docs-fr", path: "docs/fr/", locale: "fr", graphs: ["translated-content"] },
      ],
    };
    // Nothing translates it: a note, and the index is still complete.
    const a = instance(decl, {
      "docs/index.md": SOURCE_PAGE,
      "docs/broken.md": broken,
      "docs/fr/index.md": FRENCH_PAGE,
    });
    try {
      const { findings } = buildTranslationIndex(a.root);
      expect(findings.filter((f) => f.severity === "error")).toEqual([]);
      expect(findings.filter((f) => f.severity === "unreadable")).toEqual([]);
      expect(findings.filter((f) => f.severity === "note").map((f) => f.where)).toEqual([
        "docs/broken.md",
      ]);
    } finally {
      a.dispose();
    }

    // A translation names it: now its URL is load-bearing and cannot be
    // determined, so it escalates.
    const b = instance(decl, {
      "docs/index.md": SOURCE_PAGE,
      "docs/broken.md": broken,
      "docs/fr/broken.md": FRENCH_PAGE.replace("translation_source: index.md", "translation_source: broken.md"),
    });
    try {
      const { findings } = buildTranslationIndex(b.root);
      expect(findings.filter((f) => f.severity === "unreadable").map((f) => f.where)).toEqual([
        "docs/fr/broken.md",
      ]);
    } finally {
      b.dispose();
    }
  });
});

describe("URL normalisation matches navKey in docs-ui.js", () => {
  // These are one convention implemented twice — once in this generator and
  // once in the browser — so the cases are written out rather than left to be
  // inferred from whichever side somebody reads first.
  const cases: Array<[string, string]> = [
    ["/", ""],
    ["/index.html", ""],
    ["/getting-started.html", "getting-started"],
    ["/getting-started/", "getting-started"],
    ["/guides/agent-onboarding.html", "guides/agent-onboarding"],
    ["/fr/index.html", "fr"],
    ["/guides/fr/agent-onboarding.html", "guides/fr/agent-onboarding"],
    ["/x.html?lang=fr", "x"],
    ["/x.html#anchor", "x"],
  ];
  for (const [url, key] of cases) {
    it(`${url} -> "${key}"`, () => expect(pageKey(url)).toBe(key));
  }

  it("a declared `permalink` wins over the composed path", () => {
    // `docs/index.md` declares `permalink: /`. Composing `/index.html` for it
    // would key the home page under something the navbar never links to.
    expect(pageUrl("index.md", { permalink: "/" })).toBe("/");
    expect(pageUrl("index.md", {})).toBe("/index.html");
  });

  it("front matter that will not parse throws rather than reading as empty", () => {
    // Returning `{}` would make a French page look like it declares no `lang`,
    // which puts it straight back in the navbar under English.
    expect(() => frontMatter("---\ntitle: a: b\n---\n")).toThrow();
    expect(frontMatter("no front matter here")).toBeUndefined();
  });
});

describe("this repository's own corpus", () => {
  it("every declared translated directory carries a locale and exists", () => {
    const dirs = translatedDirectories(REPO_ROOT);
    expect(dirs.length).toBeGreaterThan(0);
    for (const d of dirs) {
      expect(d.locale, `${d.id} has no locale`).toBeTruthy();
      expect(existsSync(resolve(REPO_ROOT, d.path)), `${d.path} is not there`).toBe(true);
    }
  });

  it("every declared translated page is out of the STATIC nav", () => {
    // The half `tests/nav-locale.e2e.ts` cannot check. Derived from the
    // declaration, so a locale added tomorrow is covered without editing this.
    const dirs = translatedDirectories(REPO_ROOT);
    const offenders: string[] = [];
    for (const d of dirs) {
      const abs = resolve(REPO_ROOT, d.path);
      const walk = (p: string): void => {
        for (const e of readdirSync(p, { withFileTypes: true })) {
          const f = join(p, e.name);
          if (e.isDirectory()) walk(f);
          else if (/\.md$/i.test(e.name)) {
            const fm = frontMatter(readFileSync(f, "utf-8")) ?? {};
            if (fm.nav_exclude !== true || fm.nav_order !== undefined) {
              offenders.push(join(d.path, e.name));
            }
          }
        }
      };
      walk(abs);
    }
    expect(offenders).toEqual([]);
  });

  it("the committed index is up to date and valid", () => {
    const r = checkTranslationIndex(REPO_ROOT);
    const bad = r.findings.filter((f) => f.severity !== "note").map((f) => `${f.where}: ${f.message}`);
    expect(bad).toEqual([]);
    expect(r.state, `run: bun run translation:index`).toBe("ok");
  });

  it("the published index names a source page that really exists", () => {
    // Guards the one thing a self-consistent generator cannot catch: a key
    // scheme that agrees with itself and matches no nav link on the real site.
    const index = JSON.parse(readFileSync(join(REPO_ROOT, INDEX_PATH), "utf-8")) as {
      pages: Record<string, { sourceUrl: string }>;
    };
    const decl = readDeclaration(REPO_ROOT);
    expect(decl).toBeTruthy();
    for (const [key, page] of Object.entries(index.pages)) {
      expect(pageKey(page.sourceUrl), `${page.sourceUrl} does not key to ${key}`).toBe(key);
      const candidates = [
        join(REPO_ROOT, "docs", key === "" ? "index.md" : `${key}.md`),
        join(REPO_ROOT, "docs", key, "index.md"),
      ];
      expect(candidates.some((c) => existsSync(c)), `no source page for key "${key}"`).toBe(true);
    }
  });
});
