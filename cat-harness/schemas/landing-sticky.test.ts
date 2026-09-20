/**
 * The landing sticky is page-global, idempotent, and cannot carry a link that
 * resolves by luck.
 *
 * Three properties, and each is asserted by making its violation FAIL rather
 * than by confirming the good case — a schema that validated nothing would pass
 * every "a valid one parses" test in this file.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  DEFAULT_ONBOARDING_LINKS,
  LANDING_STICKY_ID,
  LANDING_STICKY_PAGE,
  LANDING_STICKY_SCHEMA_TAG,
  LANDING_STICKY_THEME,
  LandingLinkSchema,
  LandingStickySchema,
  LANDING_STICKY_IDS,
  SUBGRAPHS_OVERVIEW,
  SUBGRAPHS_STICKY_ID,
  isExternalLink,
  isLandingSticky,
  landingSticky,
  landingStickies,
  subgraphsSticky,
} from "./landing-sticky.js";

const CREATED = "2026-09-20T00:00:00Z";
const DESCRIPTION = "computable adjudication and agentic test harness\n\ncaaat-harness\n\n c@t-harness";
const DOCS = resolve(import.meta.dir, "../docs");

describe("it is page-global BY TYPE, not by convention", () => {
  test("the built sticky carries a page anchor", () => {
    const s = landingSticky({ description: DESCRIPTION, createdAt: CREATED });
    expect(s.anchor).toEqual({ kind: "page", page: LANDING_STICKY_PAGE });
  });

  test("a BLOCK anchor is refused", () => {
    // The narrowing is the point. A landing page has no block to point at —
    // `note-anchor.ts` cites this case as the argument that settled its design —
    // so admitting a block anchor would push the check to whatever reads it.
    expect(() =>
      LandingStickySchema.parse({
        $schema: LANDING_STICKY_SCHEMA_TAG,
        id: LANDING_STICKY_ID,
        summary: "x",
        createdAt: CREATED,
        theme: LANDING_STICKY_THEME,
        anchor: { kind: "block", label: "sec:one" },
      }),
    ).toThrow();
  });

  test("the `none` anchor is refused too", () => {
    // `none` means "attached to nothing, and nobody has said otherwise". A
    // landing sticky is deliberately attached, so this is not merely unused —
    // it is false.
    expect(() =>
      LandingStickySchema.parse({
        $schema: LANDING_STICKY_SCHEMA_TAG,
        id: LANDING_STICKY_ID,
        summary: "x",
        createdAt: CREATED,
        theme: LANDING_STICKY_THEME,
        anchor: { kind: "none" },
      }),
    ).toThrow();
  });

  test("an ABSENT anchor is refused, unlike on the base note", () => {
    // `CarriedNote.anchor` is optional across three states; here it is required.
    // Worth its own test because "optional in the base" is the easy thing to
    // inherit by accident.
    expect(() =>
      LandingStickySchema.parse({
        $schema: LANDING_STICKY_SCHEMA_TAG,
        id: LANDING_STICKY_ID,
        summary: "x",
        createdAt: CREATED,
        theme: LANDING_STICKY_THEME,
      }),
    ).toThrow();
  });
});

describe("building it twice produces the same node — the idempotency key", () => {
  test("two calls with the same input are identical", () => {
    // What makes initiation safe to re-run. A generated id or a clock read here
    // would mint a second sticky on every re-initialisation, leaving a page with
    // two descriptions and nothing saying which is current.
    const a = landingSticky({ description: DESCRIPTION, createdAt: CREATED });
    const b = landingSticky({ description: DESCRIPTION, createdAt: CREATED });
    expect(a).toEqual(b);
  });

  test("the id is FIXED, not derived from the description", () => {
    const a = landingSticky({ description: DESCRIPTION, createdAt: CREATED });
    const b = landingSticky({ description: "something else entirely", createdAt: CREATED });
    expect(a.id).toBe(LANDING_STICKY_ID);
    expect(b.id).toBe(LANDING_STICKY_ID);
  });

  test("`createdAt` is an argument, so the node does not move on its own", () => {
    // If this function read the clock, the assertion above could not exist and a
    // re-run would show a diff every time — which is what stops a check saying
    // "nothing changed".
    const a = landingSticky({ description: DESCRIPTION, createdAt: CREATED });
    expect(a.createdAt).toBe(CREATED);
  });
});

describe("an href may not resolve by luck — bean blv9", () => {
  test.each([
    ["/guides/index.html", "site-root-relative"],
    ["https://github.com/litlfred/folio-assistant", "absolute https"],
    ["mailto://x", "another scheme"],
  ])("`%s` is accepted (%s)", (href) => {
    expect(() => LandingLinkSchema.parse({ label: "x", href })).not.toThrow();
  });

  test.each([
    ["guides/index.html", "bare-relative"],
    ["installation.html", "the form live on docs/index.md today"],
    ["./getting-started.html", "dot-relative"],
    ["../content-types.html", "parent-relative"],
  ])("`%s` is REFUSED (%s)", (href) => {
    // The trap, and it is not hypothetical: `docs/index.md` carries
    // `[Install](installation.html)` beside four siblings that go through
    // `relative_url` properly. They work only because that page declares
    // `permalink: /` — position-safe rather than baseurl-safe.
    expect(() => LandingLinkSchema.parse({ label: "x", href })).toThrow();
  });

  test("every default link is accepted by that rule", () => {
    for (const link of DEFAULT_ONBOARDING_LINKS) {
      expect(() => LandingLinkSchema.parse(link)).not.toThrow();
    }
  });

  test("external links are DERIVED from the scheme, not declared", () => {
    expect(isExternalLink({ label: "x", href: "https://example.org" })).toBe(true);
    expect(isExternalLink({ label: "x", href: "/guides/index.html" })).toBe(false);
  });

  test("no default link is external, so all four take `relative_url`", () => {
    // Applying `relative_url` to an absolute URL breaks it, and omitting it on a
    // site-root path drops the baseurl. The template needs to know which; this
    // records that today the answer is uniform.
    expect(DEFAULT_ONBOARDING_LINKS.filter(isExternalLink)).toEqual([]);
  });
});

describe("the four default links point at pages that EXIST", () => {
  // A link check, not a shape check. `readme:audit` exists because a
  // link-shaped value nothing resolves is bean `blv9`'s whole subject, and four
  // hrefs hardcoded in a schema module are exactly that unless something walks
  // them.
  test.each(DEFAULT_ONBOARDING_LINKS.map((l) => [l.href] as const))("%s resolves", (href) => {
    const rel = href.replace(/^\//, "").replace(/\.html$/, ".md");
    expect(existsSync(join(DOCS, rel))).toBe(true);
  });

  test("the check CAN fire", () => {
    // Without this, the loop above would pass on an empty list or a path rule
    // that mapped everything onto a file that happens to exist.
    expect(existsSync(join(DOCS, "a-page-that-is-not-here.md"))).toBe(false);
  });

  test("there are four of them, in the order a reader meets them", () => {
    // `alox` records the block as "Four things, in order", and the order is
    // load-bearing: claim a bean, then scaffold, then know what you are writing.
    expect(DEFAULT_ONBOARDING_LINKS).toHaveLength(4);
    expect(DEFAULT_ONBOARDING_LINKS[0]?.href).toBe("/beans-and-todos.html");
    expect(DEFAULT_ONBOARDING_LINKS[3]?.href).toBe("/guides/index.html");
  });
});

describe("it is recognised by its declared tag, not by its shape", () => {
  test("the built sticky is recognised", () => {
    expect(isLandingSticky(landingSticky({ description: DESCRIPTION, createdAt: CREATED }))).toBe(
      true,
    );
  });

  test("a note that merely has the id is NOT", () => {
    // `beans/beans.json`: "extension is a coincidence; a declaration inside the
    // file is the contract." An id check would match any note called `landing`.
    expect(isLandingSticky({ id: LANDING_STICKY_ID, summary: "a note about landing" })).toBe(false);
  });

  test("null and undefined do not throw", () => {
    expect(isLandingSticky(null)).toBe(false);
    expect(isLandingSticky(undefined)).toBe(false);
  });
});

describe("the description stays markdown, and drives the summary", () => {
  test("the whole description is the note's body, verbatim", () => {
    // It must not be flattened, truncated or turned into an image: the
    // derivation chain is several lines, and rendering it as real text is what
    // keeps it selectable, translatable and screen-readable.
    const s = landingSticky({ description: DESCRIPTION, createdAt: CREATED });
    expect(s.comment).toBe(DESCRIPTION);
  });

  test("the summary is the first non-blank line, not a second field to keep in step", () => {
    const s = landingSticky({ description: DESCRIPTION, createdAt: CREATED });
    expect(s.summary).toBe("computable adjudication and agentic test harness");
  });

  test("a description of only blank lines still builds", () => {
    // `summary` is `min(1)`, so an empty first line would refuse the node and
    // fail initiation over a declaration nobody has filled in yet.
    expect(() => landingSticky({ description: "\n\n  \n", createdAt: CREATED })).not.toThrow();
  });

  test("links default to the four, and `[]` means none", () => {
    expect(landingSticky({ description: DESCRIPTION, createdAt: CREATED }).links).toHaveLength(4);
    expect(landingSticky({ description: DESCRIPTION, createdAt: CREATED, links: [] }).links).toEqual(
      [],
    );
  });

  test("the theme defaults to grumpy-cat and can be overridden", () => {
    expect(landingSticky({ description: DESCRIPTION, createdAt: CREATED }).theme).toBe("grumpy-cat");
    expect(
      landingSticky({ description: DESCRIPTION, createdAt: CREATED, theme: "pale-sage" }).theme,
    ).toBe("pale-sage");
  });
});

describe("the second sticky: the knowledge sub-graphs, in two sentences", () => {
  test("it is two sentences, because that is what was asked for", () => {
    // Counted on sentence-ending punctuation outside the markdown emphasis.
    const sentences = SUBGRAPHS_OVERVIEW.split(/(?<=\.)\s/).filter((s) => s.trim().length > 0);
    expect(sentences).toHaveLength(2);
  });

  test("it names all four sub-graphs the owner listed", () => {
    for (const name of ["Content", "acquisition", "tools", "skills"]) {
      expect(SUBGRAPHS_OVERVIEW.toLowerCase()).toContain(name.toLowerCase());
    }
  });

  test("it does NOT claim `acquisition` is a graph kind", () => {
    // Three of the four map onto a registered kind; acquisition does not — what
    // exists is `uploads/` and `library/`. Prose naming a fifth kind would send
    // the next agent looking for one, and `readDeclaration` throws on an
    // unknown kind, so the error would surface far from the sentence.
    expect(SUBGRAPHS_OVERVIEW).not.toContain("graph kind");
    expect(SUBGRAPHS_OVERVIEW).toContain("declared directories");
  });

  test("it takes the same theme as the description sticky", () => {
    // The owner: "regullar grump cat theme". One constant, so changing it moves
    // both and the two read as one board.
    expect(subgraphsSticky({ createdAt: CREATED }).theme).toBe(
      landingSticky({ description: DESCRIPTION, createdAt: CREATED }).theme,
    );
  });

  test("it is page-global on the same page", () => {
    expect(subgraphsSticky({ createdAt: CREATED }).anchor).toEqual({
      kind: "page",
      page: LANDING_STICKY_PAGE,
    });
  });

  test("it carries no links, deliberately", () => {
    // A graph KIND has no single URL to point at, and inventing four would be
    // four more link-shaped values for bean blv9 to collect.
    expect(subgraphsSticky({ createdAt: CREATED }).links).toEqual([]);
  });

  test("its id is fixed and distinct from the description sticky's", () => {
    expect(subgraphsSticky({ createdAt: CREATED }).id).toBe(SUBGRAPHS_STICKY_ID);
    expect(SUBGRAPHS_STICKY_ID).not.toBe(LANDING_STICKY_ID);
  });

  test("building it twice is identical", () => {
    expect(subgraphsSticky({ createdAt: CREATED })).toEqual(subgraphsSticky({ createdAt: CREATED }));
  });
});

describe("the page's stickies as a set", () => {
  test("the description comes FIRST, then the overview", () => {
    // A reader needs to know what this instance IS before an orientation
    // paragraph about the graph's shape means anything.
    const ids = landingStickies({ description: DESCRIPTION, createdAt: CREATED }).map((s) => s.id);
    expect(ids).toEqual([LANDING_STICKY_ID, SUBGRAPHS_STICKY_ID]);
  });

  test("the id list and the built set agree", () => {
    // The failure shape BLOCK_KINDS exists to prevent: an enumeration kept in
    // two places, one of which is short.
    expect(landingStickies({ description: DESCRIPTION, createdAt: CREATED }).map((s) => s.id)).toEqual([
      ...LANDING_STICKY_IDS,
    ]);
  });

  test("every sticky in the set is recognised by its tag", () => {
    for (const s of landingStickies({ description: DESCRIPTION, createdAt: CREATED })) {
      expect(isLandingSticky(s)).toBe(true);
    }
  });

  test("ids are unique, or one would overwrite the other's file", () => {
    const ids = landingStickies({ description: DESCRIPTION, createdAt: CREATED }).map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("a theme override applies to the whole board", () => {
    const all = landingStickies({ description: DESCRIPTION, createdAt: CREATED, theme: "pale-sage" });
    expect(all.map((s) => s.theme)).toEqual(["pale-sage", "pale-sage"]);
  });
});
