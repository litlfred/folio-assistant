/**
 * The landing sticky, and the contribution seam that composes the board.
 *
 * The content assertions here read **the declaration** rather than a constant in
 * `schemas/`. That is the point of the change these tests were rewritten for: the
 * words moved into `harness.json`, so a test asserting a TypeScript constant would
 * be checking something no longer shipped — green while the board said something
 * else entirely.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_ONBOARDING_LINKS,
  LANDING_STICKY_PAGE,
  LANDING_STICKY_SCHEMA_TAG,
  LandingLinkSchema,
  LandingStickySchema,
  isExternalLink,
  isLandingSticky,
  stickyFromContribution,
  type LandingSticky,
} from "./landing-sticky.js";
import {
  STICKY_ORDER_LEADING,
  STICKY_ORDER_TRAILING,
  StickyContributionSchema,
  StickyIdConflictError,
  composeContributions,
  type DeclaredContribution,
} from "./sticky-contribution.js";
import { CatHarnessDeclarationSchema, siteDirFor } from "./cat-harness.js";
import { THEMES } from "./themes.js";
import { resolveThemeBackdrop } from "./theme.js";

const REPO = join(import.meta.dir, "..", "..");
/** This instance's root — where its own declaration and site live. */
const INSTANCE = join(import.meta.dir, "..");
const NOW = "2026-09-20T00:00:00.000Z";

/** A declaration, read the way a consumer reads it. */
function decl(rel: string) {
  return CatHarnessDeclarationSchema.parse(
    JSON.parse(readFileSync(join(REPO, rel, "harness.json"), "utf8")),
  );
}

/** Every contribution a layer declares, paired with that layer's own fields. */
function contributionsOf(rel: string): DeclaredContribution[] {
  const d = decl(rel);
  return (d.stickies ?? []).map((c) => ({
    contribution: c,
    declaredBy: d.name,
    ...(d.description === undefined ? {} : { description: d.description }),
  }));
}

const CAT = contributionsOf("cat-harness");
const BOOT = contributionsOf("bootstrap");

function built(declared: DeclaredContribution[]): LandingSticky[] {
  return composeContributions(declared).map((d) => stickyFromContribution(d, { createdAt: NOW }));
}

function sticky(declared: DeclaredContribution[], id: string): LandingSticky {
  const found = built(declared).find((s) => s.id === id);
  if (!found) throw new Error(`no sticky "${id}" among ${built(declared).map((s) => s.id).join(", ")}`);
  return found;
}

describe("a sticky is a CONTRIBUTION from a layer, not an entry in one list", () => {
  test("cat-harness contributes its own, and bootstrap contributes its own", () => {
    // The property the whole change exists for. Neither list is empty, and
    // neither layer appears in the other's declaration.
    expect(CAT.length).toBeGreaterThan(0);
    expect(BOOT.length).toBeGreaterThan(0);
    expect(CAT.every((c) => c.declaredBy === "folio-assistant")).toBe(true);
    expect(BOOT.every((c) => c.declaredBy === "bootstrap")).toBe(true);
  });

  test("the built sticky records which layer contributed it", () => {
    expect(sticky(BOOT, "bootstrap").contributedBy).toBe("bootstrap");
    expect(sticky(CAT, "landing").contributedBy).toBe("folio-assistant");
  });

  test("no layer's declaration names another layer's sticky", () => {
    const catIds = new Set(CAT.map((c) => c.contribution.id));
    for (const b of BOOT) expect(catIds.has(b.contribution.id)).toBe(false);
  });
});

describe("a bare bootstrap instance gets NO CAT — structurally, not by convention", () => {
  test("every theme bootstrap declares resolves to no backdrop at all", () => {
    // The owner's ruling: "i want the grumpy cat moved out of bootstrap and into
    // cat harness". This is what makes it true rather than remembered — the
    // themes bootstrap chooses carry no `imageRole`, so there is no art to
    // resolve, whatever images the composing instance happens to declare.
    expect(BOOT.length).toBeGreaterThan(0);
    for (const b of BOOT) {
      const theme = THEMES.find((t) => t.id === b.contribution.theme);
      expect(theme).toBeDefined();
      expect(theme!.backdrop).toBeUndefined();
    }
  });

  test("resolving one of bootstrap's themes against THIS instance reports `none`", () => {
    // Composed inside folio-assistant, which DOES declare cat art. The sticky
    // still gets none, because the theme asks for no image role. `none: true` is
    // the third outcome `resolveThemeBackdrop` exists to distinguish — "declares
    // no backdrop", as against "declares one whose art is missing".
    const images = decl("cat-harness").images ?? [];
    for (const b of BOOT) {
      const theme = THEMES.find((t) => t.id === b.contribution.theme)!;
      const resolved = resolveThemeBackdrop(theme, images);
      expect(resolved.none).toBe(true);
      expect(resolved.art.size).toBe(0);
    }
  });

  test("that check CAN fire — this instance's own engineer theme resolves to art", () => {
    // Without this, `none: true` would also be what a typo in the theme id
    // produced, and the test above would pass for the wrong reason.
    const images = decl("cat-harness").images ?? [];
    const engineer = THEMES.find((t) => t.id === "engineer")!;
    const resolved = resolveThemeBackdrop(engineer, images);
    expect(resolved.none).toBe(false);
    expect(resolved.art.size).toBeGreaterThan(0);
  });

  test("the schema gives `theme` no default, so a layer cannot inherit a cat by silence", () => {
    expect(() =>
      StickyContributionSchema.parse({ id: "x", order: 1, body: "words" }),
    ).toThrow();
  });
});

describe("order is DECLARED, not inherited from dependency resolution", () => {
  test("the description comes first and bootstrap's card comes last", () => {
    // The cost the work-plan item named before any of this was written: a
    // composed set with no declared order renders deepest-dependency-first,
    // which would put bootstrap above the instance's own description.
    const ids = built([...BOOT, ...CAT]).map((s) => s.id);
    expect(ids[0]).toBe("landing");
    expect(ids.at(-1)).toBe("bootstrap");
  });

  test("the order survives the layers being read in the other sequence", () => {
    expect(built([...CAT, ...BOOT]).map((s) => s.id)).toEqual(
      built([...BOOT, ...CAT]).map((s) => s.id),
    );
  });

  test("a tie breaks on layer then id, so the board is never read-order dependent", () => {
    const tie = (declaredBy: string, id: string): DeclaredContribution => ({
      contribution: StickyContributionSchema.parse({ id, order: 50, theme: "pale-sage", body: "w" }),
      declaredBy,
    });
    const a = [tie("b-layer", "zebra"), tie("a-layer", "yak"), tie("a-layer", "ant")];
    expect(composeContributions(a).map((d) => `${d.declaredBy}/${d.contribution.id}`)).toEqual([
      "a-layer/ant",
      "a-layer/yak",
      "b-layer/zebra",
    ]);
  });

  test("bootstrap declares the trailing order, and it is the shared constant", () => {
    expect(BOOT.map((b) => b.contribution.order)).toEqual([STICKY_ORDER_TRAILING]);
    expect(CAT[0]!.contribution.order).toBe(STICKY_ORDER_LEADING);
  });
});

describe("two layers cannot claim one sticky id", () => {
  test("a duplicate is REFUSED rather than letting the last writer win", () => {
    // The failure mode with no symptom: the id is the file name, so a collision
    // produces one file written twice and one layer's card simply absent.
    const dup = (declaredBy: string): DeclaredContribution => ({
      contribution: StickyContributionSchema.parse({
        id: "landing",
        order: 1,
        theme: "pale-sage",
        body: "w",
      }),
      declaredBy,
    });
    expect(() => composeContributions([dup("one"), dup("two")])).toThrow(StickyIdConflictError);
  });

  test("the error names both layers, so the reader knows where to look", () => {
    const dup = (declaredBy: string): DeclaredContribution => ({
      contribution: StickyContributionSchema.parse({
        id: "landing",
        order: 1,
        theme: "pale-sage",
        body: "w",
      }),
      declaredBy,
    });
    try {
      composeContributions([dup("alpha"), dup("beta")]);
      throw new Error("expected a conflict");
    } catch (e) {
      expect((e as StickyIdConflictError).message).toContain("alpha");
      expect((e as StickyIdConflictError).message).toContain("beta");
    }
  });

  test("the live board has no duplicate", () => {
    expect(() => composeContributions([...CAT, ...BOOT])).not.toThrow();
  });
});

describe("`body` and `bodyFrom` are exclusive — both is a contradiction, neither has no words", () => {
  test("both is refused", () => {
    expect(() =>
      StickyContributionSchema.parse({
        id: "x",
        order: 1,
        theme: "pale-sage",
        body: "w",
        bodyFrom: "description",
      }),
    ).toThrow();
  });

  test("neither is refused", () => {
    expect(() =>
      StickyContributionSchema.parse({ id: "x", order: 1, theme: "pale-sage" }),
    ).toThrow();
  });

  test("a misspelled key is refused rather than silently dropped", () => {
    expect(() =>
      StickyContributionSchema.parse({
        id: "x",
        order: 1,
        theme: "pale-sage",
        body: "w",
        onboardingLink: true,
      }),
    ).toThrow();
  });
});

describe("`bodyFrom: description` reads the DECLARING layer's description", () => {
  test("bootstrap's card carries bootstrap's sentence, not this instance's", () => {
    // The defect that would make the seam pointless: a board of one sentence
    // repeated.
    const boot = sticky(BOOT, "bootstrap");
    expect(boot.comment).toBe(decl("bootstrap").description!);
    expect(boot.comment).not.toBe(decl("cat-harness").description!);
  });

  test("this instance's card carries its own description, markdown and verbatim", () => {
    const landing = sticky(CAT, "landing");
    expect(landing.comment).toBe(decl("cat-harness").description!);
    // Markdown, not an image: the c@t-harness derivation chain is several lines,
    // and rendering it as real text is what keeps it selectable and readable by a
    // screen reader.
    expect(landing.comment).toContain("\n");
  });

  test("an instance with no description falls back to its NAME rather than failing", () => {
    // Deliberately a non-failure, carried over rather than re-decided:
    // initiation failing over a declaration nobody has filled in yet is worse
    // than a thin card.
    const s = stickyFromContribution(
      {
        contribution: StickyContributionSchema.parse({
          id: "x",
          order: 1,
          theme: "pale-sage",
          bodyFrom: "description",
        }),
        declaredBy: "some-instance",
      },
      { createdAt: NOW },
    );
    expect(s.comment).toBe("some-instance");
  });

  test("a whitespace-only description falls back too", () => {
    const s = stickyFromContribution(
      {
        contribution: StickyContributionSchema.parse({
          id: "x",
          order: 1,
          theme: "pale-sage",
          bodyFrom: "description",
        }),
        declaredBy: "some-instance",
        description: "   \n  ",
      },
      { createdAt: NOW },
    );
    expect(s.comment).toBe("some-instance");
  });
});

describe("it is page-global BY TYPE, not by convention", () => {
  const one = () => sticky(CAT, "landing");

  test("the built sticky carries a page anchor", () => {
    expect(one().anchor).toEqual({ kind: "page", page: LANDING_STICKY_PAGE });
  });

  test("a BLOCK anchor is refused", () => {
    expect(() =>
      LandingStickySchema.parse({ ...one(), anchor: { kind: "block", block: "b1" } }),
    ).toThrow();
  });

  test("the `none` anchor is refused too", () => {
    expect(() => LandingStickySchema.parse({ ...one(), anchor: { kind: "none" } })).toThrow();
  });

  test("an ABSENT anchor is refused, unlike on the base note", () => {
    const { anchor: _anchor, ...withoutAnchor } = one();
    expect(() => LandingStickySchema.parse(withoutAnchor)).toThrow();
  });
});

describe("building it twice produces the same node — the idempotency key", () => {
  test("two calls with the same input are identical", () => {
    expect(built([...CAT, ...BOOT])).toEqual(built([...CAT, ...BOOT]));
  });

  test("the id is declared, not derived from the description", () => {
    const d = CAT.find((c) => c.contribution.id === "landing")!;
    const other = stickyFromContribution(
      { ...d, description: "something else entirely" },
      { createdAt: NOW },
    );
    expect(other.id).toBe("landing");
  });

  test("`createdAt` is an argument, so the node does not move on its own", () => {
    const d = CAT[0]!;
    expect(stickyFromContribution(d, { createdAt: "2020-01-01T00:00:00.000Z" }).createdAt).toBe(
      "2020-01-01T00:00:00.000Z",
    );
  });
});

describe("an href may not resolve by luck — bean blv9", () => {
  const ACCEPTED = ["/guides/index.html", "https://example.org/x", "HTTPS://EXAMPLE.ORG/x"];
  const REFUSED = ["guides/index.html", "installation.html", "./x.html", "../x.html", ""];

  test.each(ACCEPTED)("accepts %s", (href) => {
    expect(() => LandingLinkSchema.parse({ label: "x", href })).not.toThrow();
  });

  test.each(REFUSED)("refuses %s", (href) => {
    expect(() => LandingLinkSchema.parse({ label: "x", href })).toThrow();
  });

  test("every default link is accepted by that rule", () => {
    for (const link of DEFAULT_ONBOARDING_LINKS) {
      expect(() => LandingLinkSchema.parse(link)).not.toThrow();
    }
  });

  test("every link in every live declaration is accepted by that rule", () => {
    // The declarations are now where links are authored, so this is the check
    // that matters. A bare-relative href in `harness.json` would otherwise reach
    // the page and resolve against whatever rendered it.
    const links = [...CAT, ...BOOT].flatMap((c) => c.contribution.links);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(() => LandingLinkSchema.parse(link)).not.toThrow();
  });

  test("external links are DERIVED from the scheme, not declared", () => {
    expect(isExternalLink({ label: "x", href: "https://example.org" })).toBe(true);
    expect(isExternalLink({ label: "x", href: "/guides/index.html" })).toBe(false);
  });

  test("no default link is external, so all four take `relative_url`", () => {
    expect(DEFAULT_ONBOARDING_LINKS.filter(isExternalLink)).toEqual([]);
  });
});

describe("the four default links point at pages that EXIST", () => {
  // `siteDirFor` rather than the literal: the site root is one answer, derived
  // from the declaration, and `site-dir-single-answer.test.ts` fails any source
  // file that spells it out. A hardcoded one here would be right until an
  // instance chose differently, and then silently check nothing.
  const DOCS = join(INSTANCE, siteDirFor(INSTANCE));

  test.each(DEFAULT_ONBOARDING_LINKS.map((l) => l.href))("%s resolves to a source page", (href) => {
    const stem = href.replace(/^\//, "").replace(/\.html$/, "");
    const candidates = [`${stem}.md`, join(stem, "index.md"), `${stem}.html`];
    expect(candidates.some((c) => existsSyncSafe(join(DOCS, c)))).toBe(true);
  });

  test("the check CAN fire", () => {
    expect(existsSyncSafe(join(DOCS, "definitely-not-a-page.md"))).toBe(false);
  });

  test("there are four of them, in the order a reader meets them", () => {
    expect(DEFAULT_ONBOARDING_LINKS).toHaveLength(4);
    expect(DEFAULT_ONBOARDING_LINKS.map((l) => l.href)).toEqual([
      "/beans-and-todos.html",
      "/getting-started.html",
      "/content-types.html",
      "/guides/index.html",
    ]);
  });
});

describe("`onboardingLinks` asks for the SET rather than copying it", () => {
  test("the flag appends all four, after the layer's own links", () => {
    const landing = sticky(CAT, "landing");
    expect(landing.links).toEqual([...DEFAULT_ONBOARDING_LINKS]);
  });

  test("no declaration copies an onboarding href, which would be the BLOCK_KINDS shape", () => {
    const onboarding = new Set(DEFAULT_ONBOARDING_LINKS.map((l) => l.href));
    for (const c of [...CAT, ...BOOT]) {
      for (const link of c.contribution.links) expect(onboarding.has(link.href)).toBe(false);
    }
  });

  test("without the flag a sticky carries only what it declared", () => {
    expect(sticky(CAT, "subgraphs").links).toEqual([]);
  });
});

describe("it is recognised by its declared tag, not by its shape", () => {
  test("the built sticky is recognised", () => {
    expect(isLandingSticky(sticky(CAT, "landing"))).toBe(true);
  });

  test("a note that merely has the id is NOT", () => {
    expect(isLandingSticky({ id: "landing", summary: "x" })).toBe(false);
  });

  test("null and undefined do not throw", () => {
    expect(isLandingSticky(null)).toBe(false);
    expect(isLandingSticky(undefined)).toBe(false);
  });

  test("the tag is what the schema requires", () => {
    expect(sticky(CAT, "landing").$schema).toBe(LANDING_STICKY_SCHEMA_TAG);
  });
});

describe("the summary is derived, not a second field to keep in step", () => {
  test("it is the body's first non-blank line when none is declared", () => {
    const landing = sticky(CAT, "landing");
    const first = landing.comment.split("\n").find((l) => l.trim().length > 0)!.trim();
    expect(landing.summary).toBe(first);
  });

  test("a declared summary wins", () => {
    expect(sticky(CAT, "subgraphs").summary).toBe("The knowledge sub-graphs");
  });
});

describe("the sub-graphs card says what the owner asked for", () => {
  const body = () => sticky(CAT, "subgraphs").comment;

  test("it is two sentences, because that is what was asked for", () => {
    const sentences = body()
      .split(/(?<=\.)\s+/)
      .filter((s) => s.trim().length > 0);
    expect(sentences).toHaveLength(2);
  });

  test("it names all four sub-graphs the owner listed", () => {
    for (const word of ["Content", "acquisition", "tools", "skills"]) {
      expect(body()).toContain(word);
    }
  });

  test("it does NOT claim `acquisition` is a graph kind", () => {
    // `readDeclaration` throws on an unknown kind, so prose naming a fifth one
    // would send the next agent looking for something the registry rejects.
    expect(body()).not.toMatch(/acquisition[^.]*\bgraph kind\b/i);
    expect(body()).not.toMatch(/\bkinds?\b/i);
  });
});

describe("the cat's introduction keeps the owner's own words", () => {
  test("verbatim, down to the shape of the sentence", () => {
    expect(sticky(CAT, "cat-harness").comment).toBe(
      "Please be introduced to a cat who acquires things, for whatever purpose — maybe somebody knows.",
    );
  });

  test("it takes plain grumpy cat while the description card takes the engineer", () => {
    // The two differing is the point, and the owner said so directly.
    expect(sticky(CAT, "cat-harness").theme).toBe("grumpy-cat");
    expect(sticky(CAT, "landing").theme).toBe("engineer");
  });

  test("its one link is absolute and points at the source, not at this site", () => {
    const links = sticky(CAT, "cat-harness").links;
    expect(links).toHaveLength(1);
    expect(isExternalLink(links[0]!)).toBe(true);
    // A sticky on the landing page linking to the landing page is a link to
    // itself: cat-harness has no site of its own yet (issue #223).
    expect(links[0]!.href).not.toBe(decl("cat-harness").canonicalUrl);
  });
});

describe("bootstrap's card links to its source and does NOT invent a site", () => {
  test("it offers a source link", () => {
    const links = sticky(BOOT, "bootstrap").links;
    expect(links.length).toBeGreaterThan(0);
    expect(links.some((l) => isExternalLink(l) && l.href.includes("/bootstrap"))).toBe(true);
  });

  test("it offers no link to a bootstrap site, because there is none", () => {
    // The owner asked for "link back to the source code + ghpaghes for boot
    // strrap". Bootstrap has no site — this instance's canonicalUrl is
    // cat-harness's — and a declared link to a page that does not exist is a
    // 404 on the landing page.
    const site = decl("cat-harness").canonicalUrl!;
    for (const l of sticky(BOOT, "bootstrap").links) expect(l.href.startsWith(site)).toBe(false);
  });
});

function existsSyncSafe(p: string): boolean {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}
