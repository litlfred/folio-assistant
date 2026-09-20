/**
 * The translation index — the FILE declares its language, and the index is
 * what the navbar reads.
 *
 * Two halves are tested here, and only one of them can be tested in a browser.
 *
 *   * The DISCOVERY half: that a page is a translation because it says
 *     `lang: fr`, and that a directory called `fr/` whose pages say nothing
 *     is not one. That second case is the whole point — it is what would
 *     still pass if anything anywhere read a language subtag out of a path.
 *   * The STATIC-NAV half: that every translated page carries
 *     `nav_exclude: true`. `test/nav-locale.e2e.ts` cannot check this,
 *     because it hand-writes the nav markup and would "verify" the rule by
 *     simply not putting the French item in. Jekyll honours `nav_exclude`;
 *     this is what makes sure the pages still ask it to.
 *
 * Nothing here pins a count or a locale list. Both change the moment somebody
 * adds a translation, and a fixture that is a live verdict about the corpus is
 * not a fixture — every expectation below is either derived from the corpus at
 * test time or stated explicitly as a synthetic case in a temp instance.
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
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isTranslatable } from "../../schemas/translation-tools.ts";
import {
  INDEX_PATH,
  INDEX_SCHEMA,
  SITE_DIR,
  buildTranslationIndex,
  checkTranslationIndex,
  contentType,
  frontMatter,
  pageKey,
  pageUrl,
  siteRoot,
  sourceLocale,
} from "./translation-index.ts";
import { writeInstanceConfig } from "../../test/support/instance-fixture.js";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * A throwaway instance: a `harness.config.json`, and a `docs/` tree with the
 * `_config.yml` that makes it a Jekyll site.
 *
 * The `_config.yml` is not decoration. `siteRoot` CONFIRMS the site rather
 * than assuming it, so an instance without one is reported as unreadable —
 * and a fixture that omitted it would take every test below down the
 * could-not-determine path and pass for the wrong reason.
 */
function instance(
  files: Record<string, string>,
  config: Record<string, unknown> = { contentType: "document" },
): { root: string; dispose: () => void } {
  const root = mkdtempSync(join(tmpdir(), "translation-index-"));
  writeInstanceConfig(root, JSON.stringify(config, null, 2));
  mkdirSync(join(root, SITE_DIR), { recursive: true });
  writeFileSync(join(root, SITE_DIR, "_config.yml"), "title: t\n", "utf-8");
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

describe("a page is a translation because IT says so", () => {
  it("indexes a page that declares a non-source `lang`", () => {
    const { root, dispose } = instance({
      [`${SITE_DIR}/index.md`]: SOURCE_PAGE,
      [`${SITE_DIR}/fr/index.md`]: FRENCH_PAGE,
    });
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

  it("does NOT index an `fr/` directory whose pages declare nothing", () => {
    // The whole point, and the one case that would still pass if anything
    // anywhere read a language subtag out of a path. Same directory name,
    // same filename, no `lang` — so it is a source-language page that happens
    // to live in a folder called `fr`, and it is treated as exactly that.
    const { root, dispose } = instance({
      [`${SITE_DIR}/index.md`]: SOURCE_PAGE,
      [`${SITE_DIR}/fr/index.md`]: "---\nlayout: default\ntitle: Foreign relations\n---\n\n# x\n",
    });
    try {
      const { index, findings } = buildTranslationIndex(root);
      expect(index.locales).toEqual([]);
      expect(Object.keys(index.pages)).toEqual([]);
      expect(findings.filter((f) => f.severity !== "note")).toEqual([]);
    } finally {
      dispose();
    }
  });

  it("indexes a translation that is NOT in a locale-named directory", () => {
    // The other direction: `accueil-fr.md` sitting beside its source is a
    // French page because it says so, and a path-shaped rule would miss it.
    const { root, dispose } = instance({
      [`${SITE_DIR}/index.md`]: SOURCE_PAGE,
      [`${SITE_DIR}/accueil-fr.md`]: FRENCH_PAGE,
    });
    try {
      const { index, findings } = buildTranslationIndex(root);
      expect(findings.filter((f) => f.severity !== "note")).toEqual([]);
      expect(index.pages[""].translations.fr.url).toBe("/accueil-fr.html");
    } finally {
      dispose();
    }
  });

  it("a page with no `lang` is the source language, not unknown", () => {
    const { root, dispose } = instance({
      [`${SITE_DIR}/index.md`]: "---\ntitle: Home\npermalink: /\n---\n\n# Home\n",
      [`${SITE_DIR}/fr/index.md`]: FRENCH_PAGE,
    });
    try {
      const { index } = buildTranslationIndex(root);
      expect(index.pages[""].sourceTitle).toBe("Home");
    } finally {
      dispose();
    }
  });

  it("the source language comes from harness.config.json, not from `en`", () => {
    // A folio authored in French: the ENGLISH page is the translation.
    const { root, dispose } = instance(
      {
        [`${SITE_DIR}/index.md`]: FRENCH_PAGE.replace("nav_exclude: true\n", "").replace(
          "translation_source: index.md\n",
          "permalink: /\n",
        ),
        [`${SITE_DIR}/en/index.md`]:
          "---\ntitle: Home (EN)\nlang: en\nnav_exclude: true\ntranslation_source: index.md\n---\n\n# Home\n",
      },
      { contentType: "document", translation: { defaultLocale: "fr" } },
    );
    try {
      const { index, findings } = buildTranslationIndex(root);
      expect(findings.filter((f) => f.severity !== "note")).toEqual([]);
      expect(index.sourceLocale).toBe("fr");
      expect(index.locales).toEqual(["en"]);
    } finally {
      dispose();
    }
  });

  it("only formats the CONTENT TYPE declares translatable are walked", () => {
    // The owner's model: "its not so much the node schema itself but its
    // content (e.g. markdown, bpmn) should be translatable". `.json` is not a
    // translatable format for a document folio, so a JSON file carrying a
    // `lang` is not a page of any language — it is data.
    expect(isTranslatable("document", ".md")).toBe(true);
    expect(isTranslatable("document", ".json")).toBe(false);
    const { root, dispose } = instance({
      [`${SITE_DIR}/index.md`]: SOURCE_PAGE,
      [`${SITE_DIR}/data-fr.json`]: '{"lang":"fr"}',
    });
    try {
      const { index, findings } = buildTranslationIndex(root);
      expect(index.locales).toEqual([]);
      expect(findings.filter((f) => f.severity !== "note")).toEqual([]);
    } finally {
      dispose();
    }
  });

  it("Jekyll's own underscore directories are not content", () => {
    const { root, dispose } = instance({
      [`${SITE_DIR}/index.md`]: SOURCE_PAGE,
      [`${SITE_DIR}/_includes/fragment.md`]: FRENCH_PAGE,
    });
    try {
      const { index } = buildTranslationIndex(root);
      expect(index.locales).toEqual([]);
    } finally {
      dispose();
    }
  });
});

describe("what a translated page must also say", () => {
  const cases: Array<{ name: string; page: string; expect: string }> = [
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
      const { root, dispose } = instance({
        [`${SITE_DIR}/index.md`]: SOURCE_PAGE,
        [`${SITE_DIR}/fr/index.md`]: c.page,
      });
      try {
        const { index, findings } = buildTranslationIndex(root);
        const errors = findings.filter((f) => f.severity === "error");
        expect(errors.map((f) => f.where)).toEqual([`${SITE_DIR}/fr/index.md`]);
        expect(errors[0].message).toContain(c.expect);
        // A page that fails a rule is never half-indexed: a nav item pointing
        // at a page whose declaration is wrong is worse than no nav item.
        expect(index.pages[""]?.translations.fr).toBeUndefined();
      } finally {
        dispose();
      }
    });
  }

  it("reports a translation whose source is itself a translation", () => {
    const { root, dispose } = instance({
      [`${SITE_DIR}/index.md`]: SOURCE_PAGE,
      [`${SITE_DIR}/fr/index.md`]: FRENCH_PAGE,
      [`${SITE_DIR}/es/index.md`]: FRENCH_PAGE.replace("lang: fr", "lang: es").replace(
        "translation_source: index.md",
        "translation_source: fr/index.md",
      ),
    });
    try {
      const { findings } = buildTranslationIndex(root);
      const errors = findings.filter((f) => f.severity === "error");
      expect(errors.map((f) => f.where)).toEqual([`${SITE_DIR}/es/index.md`]);
      expect(errors[0].message).toContain("translation of a translation");
    } finally {
      dispose();
    }
  });

  it("reports two translations of one page in one locale", () => {
    const { root, dispose } = instance({
      [`${SITE_DIR}/index.md`]: SOURCE_PAGE,
      [`${SITE_DIR}/fr/index.md`]: FRENCH_PAGE,
      [`${SITE_DIR}/accueil-fr.md`]: FRENCH_PAGE,
    });
    try {
      const { findings } = buildTranslationIndex(root);
      expect(findings.filter((f) => f.severity === "error")[0].message).toContain(
        "second fr translation",
      );
    } finally {
      dispose();
    }
  });
});

describe("three states", () => {
  it("a tree with no Jekyll site is UNREADABLE, not empty", () => {
    // The `dh4f` shape: absent and empty are indistinguishable to a consumer,
    // so scanning a directory that is not a site would publish "no
    // translations" from a read that never happened.
    const root = mkdtempSync(join(tmpdir(), "translation-index-nosite-"));
    try {
      expect(siteRoot(root)).toBeUndefined();
      const r = checkTranslationIndex(root);
      expect(r.state).toBe("unreadable");
      expect(r.findings.some((f) => f.severity === "unreadable")).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("a site with no translations at all is DETERMINED empty", () => {
    const { root, dispose } = instance({ [`${SITE_DIR}/index.md`]: SOURCE_PAGE });
    try {
      const { index, findings } = buildTranslationIndex(root);
      expect(findings.filter((f) => f.severity !== "note")).toEqual([]);
      expect(index.$schema).toBe(INDEX_SCHEMA);
      expect(index.pages).toEqual({});
    } finally {
      dispose();
    }
  });

  it("an unparseable page is a note until a translation names it", () => {
    const broken = "---\ntitle: Lean cache: the loop\n---\n\nx\n";
    const a = instance({
      [`${SITE_DIR}/index.md`]: SOURCE_PAGE,
      [`${SITE_DIR}/broken.md`]: broken,
      [`${SITE_DIR}/fr/index.md`]: FRENCH_PAGE,
    });
    try {
      const { findings } = buildTranslationIndex(a.root);
      expect(findings.filter((f) => f.severity === "error")).toEqual([]);
      expect(findings.filter((f) => f.severity === "unreadable")).toEqual([]);
      expect(findings.filter((f) => f.severity === "note").map((f) => f.where)).toEqual([
        `${SITE_DIR}/broken.md`,
      ]);
    } finally {
      a.dispose();
    }

    // A translation names it: now its URL is load-bearing and cannot be
    // determined, so it escalates.
    const b = instance({
      [`${SITE_DIR}/index.md`]: SOURCE_PAGE,
      [`${SITE_DIR}/broken.md`]: broken,
      [`${SITE_DIR}/fr/broken.md`]: FRENCH_PAGE.replace(
        "translation_source: index.md",
        "translation_source: broken.md",
      ),
    });
    try {
      const { findings } = buildTranslationIndex(b.root);
      expect(findings.filter((f) => f.severity === "unreadable").map((f) => f.where)).toEqual([
        `${SITE_DIR}/fr/broken.md`,
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
  it("is a Jekyll site where this module looks for one", () => {
    expect(siteRoot(REPO_ROOT)).toBe(join(REPO_ROOT, SITE_DIR));
    expect(isTranslatable(contentType(REPO_ROOT), ".md")).toBe(true);
  });

  it("every translated page is out of the STATIC nav", () => {
    // The half `test/nav-locale.e2e.ts` cannot check, and the half that is
    // most easily lost: a new translation added without `nav_exclude` is the
    // reported bug, reintroduced, and it looks fine locally.
    //
    // Derived by WALKING for pages that declare a non-source `lang`, so a
    // translation added anywhere tomorrow is covered without editing this.
    const src = sourceLocale(REPO_ROOT);
    const site = siteRoot(REPO_ROOT)!;
    const offenders: string[] = [];
    let translated = 0;
    const walk = (p: string): void => {
      for (const e of readdirSync(p, { withFileTypes: true })) {
        const f = join(p, e.name);
        if (e.isDirectory()) {
          if (!e.name.startsWith("_")) walk(f);
          continue;
        }
        if (!/\.md$/i.test(e.name)) continue;
        let fm: Record<string, unknown> | undefined;
        try {
          fm = frontMatter(readFileSync(f, "utf-8"));
        } catch {
          continue; // reported as a note by the generator; not this test's job
        }
        if (!fm || typeof fm.lang !== "string" || fm.lang === src) continue;
        translated += 1;
        if (fm.nav_exclude !== true || fm.nav_order !== undefined) {
          offenders.push(relative(REPO_ROOT, f));
        }
      }
    };
    walk(site);
    expect(offenders).toEqual([]);
    // Not an assertion about HOW MANY — an assertion that the walk found
    // something, so a rule that stopped matching cannot pass vacuously.
    expect(translated).toBeGreaterThan(0);
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
    expect(Object.keys(index.pages).length).toBeGreaterThan(0);
    for (const [key, page] of Object.entries(index.pages)) {
      expect(pageKey(page.sourceUrl), `${page.sourceUrl} does not key to ${key}`).toBe(key);
      const candidates = [
        join(REPO_ROOT, SITE_DIR, key === "" ? "index.md" : `${key}.md`),
        join(REPO_ROOT, SITE_DIR, key, "index.md"),
      ];
      expect(candidates.some((c) => existsSync(c)), `no source page for key "${key}"`).toBe(true);
    }
  });
});
