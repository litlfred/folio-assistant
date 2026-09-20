/**
 * The landing page, as a sticky note.
 *
 * @module schemas/landing-sticky
 * @graphNode schema
 *
 * The owner's ask, 2026-09-20: *"i want the landing page to be a sticky note …
 * it creates an empty folio (if none exists) and attaches to the folio a sticky
 * note with grumpy cat background that adds content of the intiatized harness'
 * description"* — the description **and the four onboarding links**, confirmed
 * the same day.
 *
 * ## Why this is a note and not a todo
 *
 * `5oai` proposed the landing panel as a **`ThemedTodo`**, and that was the
 * right shape when the only themed thing was a sticky on a board. It is the
 * wrong one here: a landing description is not a task. It has no status to
 * advance, nothing to check off, and nobody completes it. Filing it in the
 * `todos` graph would put a page's furniture in the store that answers *what is
 * being worked on* — the same conflation the owner's *"beans no anchor"* rule
 * refuses one level over, and that `theme.ts` already refuses when it keeps
 * themes in the harness layer while their todos stay in `todos/`.
 *
 * So it extends {@link CarriedNoteSchema} directly — the general "note somebody
 * carries, attached to the graph" — which is what `TodoNodeSchema` also extends.
 * Everything that reads a carried note keeps working; nothing has to pretend
 * this is a unit of work.
 *
 * ## The anchor is NARROWED, not merely set
 *
 * `CarriedNote.anchor` is optional across three states. Here it is
 * `PageAnchorSchema` and required, because a landing sticky is **definitionally**
 * page-global: there is no block for it to sit on. `note-anchor.ts` was written
 * with this exact case as the argument that settled its design —
 *
 * > the landing page is to carry a page-global sticky, **and the landing page
 * > has no block to point at.** There is nothing for a sentinel to stand in for.
 *
 * Narrowing states that in the type rather than in a comment, so a landing
 * sticky carrying a block anchor does not parse. Leaving it optional would
 * admit the two states that cannot be true of this object and push the check
 * to whatever reads it.
 *
 * ## The geometry constraint DISSOLVES here, and that is worth knowing
 *
 * Bean `alox` measured the declared text region at **53% × 28% of the laptop
 * crop** — a few lines — with overflow *rendered rather than clipped*, which is
 * why the four onboarding links live below the panel today rather than in it.
 * That looks like a reason this object cannot carry them. It is not:
 *
 * > **A sticky note is not a thought cloud.**
 *
 * `textRegion` exists because the description is composited into the quiet
 * interior of the cat's thought-cloud, and that interior is a fixed shape in a
 * fixed crop. Once the landing page **is** the sticky, the sticky is the
 * container and the art is its background. A sticky sizes to its content.
 *
 * **So nothing here reads `textRegion`, deliberately.** Carrying it over would
 * reimpose the geometry the change removes, and the failure would be quiet —
 * words clipping or spilling against a box nobody meant to keep. The field stays
 * declared in `harness.json` for the old composited path and for any instance
 * that still wants it.
 */
import { z } from "zod";

import { CarriedNoteSchema } from "./carried-note.js";
import { PageAnchorSchema } from "./note-anchor.js";

/** The tag this node declares, per the `$schema` convention. */
export const LANDING_STICKY_SCHEMA_TAG = "folio-landing-sticky/v1";

/**
 * The sticky's id, fixed rather than generated.
 *
 * **This is the idempotency key, and that is its whole job.** Initiation runs
 * again — a re-initialisation, a second agent, a resumed container — and a
 * generated id would mint a second sticky every time, leaving a page with two
 * descriptions and no way to tell which is current. `beans create` dedupes on
 * nothing and one unguarded re-run produced **14,688** duplicates, 92 % of every
 * open bean in that repository; the same shape applied to a landing page is one
 * store's worth of the same defect.
 *
 * A fixed id makes the write an upsert by construction: {@link isLandingSticky}
 * finds the existing one, and there is nothing to deduplicate because there was
 * never a second.
 */
export const LANDING_STICKY_ID = "landing";

/**
 * The second sticky's id: the knowledge sub-graphs, in two sentences.
 *
 * The owner, 2026-09-20: *"add a second sticky note to the main page, regullar
 * grump cat theme that is 2 sentence overview of knoweldfe sub-graphs, content,
 * acquistion, tools, and skills."*
 *
 * A **second fixed id rather than a generated one**, for the same reason
 * {@link LANDING_STICKY_ID} is fixed: each sticky is its own upsert. Two stickies
 * on one page with generated ids would produce four after the second run, and a
 * board with two copies of one overview is indistinguishable from a board with
 * two different overviews until somebody reads both.
 */
export const SUBGRAPHS_STICKY_ID = "subgraphs";

/**
 * The third sticky's id: the introduction to the cat itself.
 *
 * The owner, 2026-09-20: *"plain old grumpy cat should just say 'please be
 * introduced to a cat who acires thing, for whatever purpose, maybe somebody
 * knows'. then provide link to cat-harness in the sticky."*
 */
export const CAT_HARNESS_STICKY_ID = "cat-harness";

/**
 * Every sticky this instance's landing page carries, in render order.
 *
 * Exported as a list so a consumer iterates rather than naming each — the
 * failure shape `BLOCK_KINDS` exists to prevent, where seven hand-maintained
 * lists of one enumeration were all short and 461 blocks went unswept.
 */
export const LANDING_STICKY_IDS = [
  LANDING_STICKY_ID,
  CAT_HARNESS_STICKY_ID,
  SUBGRAPHS_STICKY_ID,
] as const;

/**
 * The page a landing sticky is global to.
 *
 * `index` rather than `/` because this is an identifier compared against another
 * note's `anchor.page`, not a URL. `PageAnchorSchema` carries the page precisely
 * so *"global"* means global **to a page** — a sticky on the landing page must
 * not surface on every other one.
 */
export const LANDING_STICKY_PAGE = "index";

/**
 * The theme a landing sticky takes when the instance does not choose.
 *
 * `grumpy-cat` because the owner asked for a grumpy cat background and that is
 * the theme carrying one. It is a **default, not a constant**: an instance
 * declaring its own `landing` art and preferring another palette sets `theme`,
 * and an instance declaring no landing art at all gets this theme rendering
 * palette-only — `resolveThemeBackdrop` reports that as `missing` rather than
 * serving art that is not there.
 */
export const LANDING_STICKY_THEME = "engineer";

/**
 * The theme the cat's own introduction takes.
 *
 * The owner, 2026-09-20, distinguishing the two: the landing sticky is *"the
 * engineer"*, and *"plain old grumpy cat"* is the one that introduces the cat.
 * So this is the original `grumpy-cat` — sage hoodie, the `landing` image role
 * — and {@link LANDING_STICKY_THEME} is the hi-vis one beside it. Two themes
 * rather than one, because they back different stickies and the art is the
 * difference.
 */
export const CAT_HARNESS_STICKY_THEME = "grumpy-cat";

/**
 * Where the cat's introduction points.
 *
 * Read from nothing — a literal, and the one link here that is absolute. The
 * instance's `canonicalUrl` is `https://litlfred.github.io/folio-assistant`,
 * which is THIS site: a sticky on the landing page linking to the landing page
 * is a link to itself. What the owner asked for is a link to **cat-harness**,
 * the layer, which is still to be split out of this repository (issue #223) and
 * therefore has no site of its own yet. The source is the honest destination
 * until it does.
 */
export const CAT_HARNESS_URL = "https://github.com/litlfred/folio-assistant";

/**
 * One link the sticky offers.
 *
 * ## `href` must be site-root-relative or absolute — never bare-relative
 *
 * This is the one validation here that is about a defect rather than a shape.
 * Bean `blv9`'s entire subject is **link-shaped values that resolve by luck**,
 * and it carries seven instances. The site is a *project* Pages site with
 * `baseurl: /folio-assistant`, so:
 *
 * | form | what happens |
 * |---|---|
 * | `/guides/index.html` | correct — the template adds the baseurl with `relative_url` |
 * | `guides/index.html` | resolves against **whatever page is rendering**, and works only by position |
 * | `https://…` | correct — and must NOT be passed through `relative_url` |
 *
 * The middle form is the trap, and it is live in the file this sticky replaces:
 * `docs/index.md` carries `[Install](installation.html)` and a second
 * `[Get started](getting-started.html)` written bare, beside four siblings that
 * go through `relative_url` properly. They work today because `index.md`
 * declares `permalink: /`, which is *position-safe rather than baseurl-safe* —
 * `alox` says so in as many words. Refusing the form here means a link moved
 * into a sticky cannot inherit that luck.
 *
 * `external` is DERIVED rather than declared, and the derivation is exact rather
 * than a guess: a URL scheme is what makes a link absolute, so reading it off
 * the scheme cannot disagree with the value the way a hand-set flag can. Same
 * reasoning `anchorOf` uses to read a legacy note's position off `targetLabel`.
 */
export const LandingLinkSchema = z
  .object({
    /** The link text. Translatable — it is what a reader sees. */
    label: z.string().min(1),
    /**
     * Site-root-relative (`/guides/index.html`) or absolute (`https://…`).
     *
     * A bare-relative path is refused; see the schema docs for why.
     */
    href: z
      .string()
      .min(1)
      .refine((h) => h.startsWith("/") || /^[a-z][a-z0-9+.-]*:\/\//i.test(h), {
        message:
          "an href is site-root-relative (/path) or absolute (https://…); a bare-relative path resolves by position — see bean blv9",
      }),
    /** One line under the label, when the label alone is not enough. Translatable. */
    note: z.string().min(1).optional(),
  })
  .strict();
export type LandingLink = z.infer<typeof LandingLinkSchema>;

/** Is this link off-site, and therefore NOT to be passed through `relative_url`? */
export function isExternalLink(link: LandingLink): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(link.href);
}

/**
 * The landing sticky.
 *
 * Extends {@link CarriedNoteSchema}; see the module docs for why it is a note
 * rather than a todo, and why `anchor` is narrowed.
 */
export const LandingStickySchema = CarriedNoteSchema.extend({
  $schema: z.literal(LANDING_STICKY_SCHEMA_TAG),
  /**
   * Page-global, and required — not the three-state optional the base carries.
   *
   * See module docs: a landing sticky has no block to sit on, so `block` and
   * `none` are states that cannot be true of it.
   */
  anchor: PageAnchorSchema,
  /**
   * The theme id, by reference.
   *
   * Validated for **shape and not existence**, exactly as `ThemedTodoFields`
   * does: whether a theme is installed is a question about the instance's theme
   * set, which a note cannot see. Resolution happens at render time, where a
   * missing theme degrades rather than failing the page.
   */
  theme: z.string().regex(/^[a-z][a-z0-9-]*$/, "a theme id is lowercase kebab-case"),
  /**
   * The onboarding links, in the order a reader should meet them.
   *
   * An **array rather than a map**, because the order is the content: `alox`
   * records the block as *"Four things, in order"*, and the order is load-bearing
   * — claim a bean before you work, then scaffold, then know which kind of thing
   * you are writing. A map would lose it, and re-deriving an order from labels
   * would invent one.
   *
   * Empty is legitimate: an instance that wants only its description.
   */
  links: z.array(LandingLinkSchema).default([]),
});
export type LandingSticky = z.infer<typeof LandingStickySchema>;

/**
 * The four links this platform's own landing sticky offers.
 *
 * Taken from the block `alox` shipped on `docs/index.md` rather than rewritten,
 * so the sticky says what the page already says. The fourth label is the owner's
 * own phrasing and is **kept rather than sanded off** — `alox` explains why, and
 * it is honestly true of every thorough docs site.
 *
 * Exported so `landing-sticky.test.ts` can check these against the live page and
 * a regeneration does not quietly drift from it.
 */
export const DEFAULT_ONBOARDING_LINKS: readonly LandingLink[] = [
  {
    label: "The work plan is where you say what you are doing",
    href: "/beans-and-todos.html",
    note: "Claim a bean before you work, so a sibling session does not pick up the same item.",
  },
  {
    label: "Make your first folio",
    href: "/getting-started.html",
    note: "This repository is the platform; your content lives in its own.",
  },
  {
    label: "Know which kind of thing you are writing",
    href: "/content-types.html",
    note: "A document is structured prose; a paper adds the block kinds whose assertion is a formal claim.",
  },
  {
    label: "The documentation you will never read",
    href: "/guides/index.html",
    note: "All of it. The honest expectation is that you arrive from a search engine when something breaks.",
  },
] as const;

/**
 * The knowledge sub-graphs, in the two sentences the owner asked for.
 *
 * ## Why these four, and why `acquisition` is not a graph kind
 *
 * The owner named **content, acquisition, tools, skills**, and glossed the third
 * of those: *"acquistion = acquistion of new (un,semi-)structued
 * content/data-source/information into KG."*
 *
 * Three of the four map onto a declared graph kind — `folio` is content, `tools`
 * is tools, `cat-harness` is skills. **`acquisition` does not**, and the text
 * below is careful not to imply it does: what exists is `uploads/` (the
 * ingestion queue an adapter creates on first ingest) and `library/`. So this
 * describes a *grouping a reader needs* rather than asserting a kind the
 * registry would reject — the distinction matters because `readDeclaration`
 * throws on an unknown kind, and prose that names a fifth one would send the
 * next agent looking for it.
 *
 * Two sentences, not three, because that is what was asked for. The second
 * carries the fact that makes the first usable: these are **declared
 * directories, not conventions**, so a consumer reads the declaration rather
 * than walking the tree — which is the defect `findBpmnDirs` was repaired for
 * (it published bootstrap's process as folio-assistant's, 88 references).
 */
export const SUBGRAPHS_OVERVIEW = [
  "**Content** is what somebody authors and a reader reads; **acquisition** is how",
  "unstructured and semi-structured sources — documents, data, loose information —",
  "get into the graph in the first place; **tools** are what an agent can call; and",
  "**skills** are the instructions for doing the work.",
  "",
  "All four are **declared directories** rather than conventions, so an instance",
  "says which of them it holds and a consumer reads that declaration instead of",
  "walking the tree.",
].join("\n");

/** What {@link landingSticky} needs to build one. */
export interface LandingStickyInput {
  /**
   * The instance's `description`, verbatim.
   *
   * **Markdown, and it stays markdown.** The `c@t-harness` derivation chain is
   * several lines rather than a sentence, and rendering it as real text is what
   * keeps it selectable, translatable and readable by a screen reader. The
   * composited path already did this — `landing.html` renders
   * `h.description | markdownify` with the artwork `alt=""` — and this must not
   * regress it into an image.
   */
  description: string;
  /** Defaults to {@link DEFAULT_ONBOARDING_LINKS}; pass `[]` for none. */
  links?: readonly LandingLink[];
  /** ISO 8601. Supplied rather than read from the clock — see below. */
  createdAt: string;
  /** Defaults to {@link LANDING_STICKY_PAGE}. */
  page?: string;
  /** Defaults to {@link LANDING_STICKY_THEME}. */
  theme?: string;
}

/**
 * Build the landing sticky for an instance.
 *
 * **`createdAt` is an argument and not `new Date()`.** A function reading the
 * clock cannot be tested for the thing that matters here — that running it twice
 * produces the same node — and initiation is exactly the code that runs twice.
 * It also makes the write diff-free on a re-run, which is what lets a check say
 * *nothing changed* instead of *the timestamp moved*.
 *
 * `summary` is derived from the description's first line rather than being asked
 * for. A second field the caller must keep in step with the first is a field
 * that drifts, and the sticky renders `comment`; `summary` exists for the
 * places that list notes.
 */
export function landingSticky(input: LandingStickyInput): LandingSticky {
  const firstLine = input.description.split("\n").find((l) => l.trim().length > 0)?.trim();
  return LandingStickySchema.parse({
    $schema: LANDING_STICKY_SCHEMA_TAG,
    id: LANDING_STICKY_ID,
    // A description of only blank lines would leave this empty and `min(1)`
    // would refuse the node. Falling back says what the object IS rather than
    // failing initiation over a declaration nobody has filled in yet.
    summary: firstLine && firstLine.length > 0 ? firstLine : "This instance",
    comment: input.description,
    createdAt: input.createdAt,
    anchor: { kind: "page", page: input.page ?? LANDING_STICKY_PAGE },
    theme: input.theme ?? LANDING_STICKY_THEME,
    links: [...(input.links ?? DEFAULT_ONBOARDING_LINKS)],
  });
}

/**
 * The cat's own introduction.
 *
 * The owner's words are kept **verbatim**, down to the shape of the sentence.
 * *"please be introduced to a cat who acquires things, for whatever purpose,
 * maybe somebody knows"* is a joke that carries real information — it is a gloss
 * on what the instance's own description spells out as *"computable adjudication
 * and agentic test harness"*, arrived at by way of `caaat-harness`,
 * `ca&at-harness`, `.c&at-harness`, `c@t-harness`. Sanding it into a product
 * sentence would lose the only part that tells a reader the name is a pun.
 * `alox` records the same decision for *"the documentation you will never
 * read"*, and it was right there too.
 */
export function catHarnessSticky(input: {
  createdAt: string;
  page?: string;
  theme?: string;
}): LandingSticky {
  return LandingStickySchema.parse({
    $schema: LANDING_STICKY_SCHEMA_TAG,
    id: CAT_HARNESS_STICKY_ID,
    summary: "Please be introduced to a cat",
    comment:
      "Please be introduced to a cat who acquires things, for whatever purpose \u2014 maybe somebody knows.",
    createdAt: input.createdAt,
    anchor: { kind: "page", page: input.page ?? LANDING_STICKY_PAGE },
    // Plain grumpy cat, NOT the engineer: this is the one the owner called
    // "plain old grumpy cat", and it is a different default from the landing
    // sticky's on purpose.
    theme: input.theme ?? CAT_HARNESS_STICKY_THEME,
    links: [{ label: "cat-harness", href: CAT_HARNESS_URL }],
  });
}

/**
 * The knowledge-sub-graphs sticky.
 *
 * Carries **no links**, deliberately. It is an orientation paragraph, and the
 * four things it names are graph *kinds* rather than pages — there is no single
 * URL for "tools" to point at, and inventing four would be four more
 * link-shaped values for bean `blv9` to collect. The sticky beside it is where
 * the links live.
 */
export function subgraphsSticky(input: { createdAt: string; page?: string; theme?: string }): LandingSticky {
  return LandingStickySchema.parse({
    $schema: LANDING_STICKY_SCHEMA_TAG,
    id: SUBGRAPHS_STICKY_ID,
    summary: "The knowledge sub-graphs",
    comment: SUBGRAPHS_OVERVIEW,
    createdAt: input.createdAt,
    anchor: { kind: "page", page: input.page ?? LANDING_STICKY_PAGE },
    // The owner asked for "regullar grump cat theme" — the same theme as the
    // description sticky, so the two read as one board rather than as two
    // unrelated cards. Not a separate default: `LANDING_STICKY_THEME` is the
    // one value, so changing it moves both.
    theme: input.theme ?? LANDING_STICKY_THEME,
    links: [],
  });
}

/**
 * Every sticky an instance's landing page should carry, in render order.
 *
 * **The description comes first.** A reader needs to know what this instance IS
 * before an orientation paragraph about the graph's shape means anything — the
 * same ordering `carried-note.ts` records for tags before narrative, and the
 * same reason `alox` gives for "Four things, in order".
 */
export function landingStickies(input: LandingStickyInput): LandingSticky[] {
  const shared = {
    createdAt: input.createdAt,
    ...(input.page === undefined ? {} : { page: input.page }),
  };
  return [
    landingSticky(input),
    // The theme override, when given, is NOT forwarded to this one. The landing
    // sticky and the cat's introduction take deliberately different themes, so a
    // caller asking for "everything in pale-sage" gets it, while a caller asking
    // for nothing gets the two the owner chose rather than one twice.
    catHarnessSticky({ ...shared, ...(input.theme === undefined ? {} : { theme: input.theme }) }),
    subgraphsSticky({
      createdAt: input.createdAt,
      ...(input.page === undefined ? {} : { page: input.page }),
      ...(input.theme === undefined ? {} : { theme: input.theme }),
    }),
  ];
}

/**
 * Is this note the landing sticky?
 *
 * Reads the **`$schema` tag**, not the id and not the shape. `beans/beans.json`
 * records why in the general case: before workflow instances carried a tag they
 * were identifiable only by SHAPE, and *"extension is a coincidence; a
 * declaration inside the file is the contract."* An id check would also match a
 * note somebody happened to call `landing`.
 */
export function isLandingSticky(note: unknown): note is LandingSticky {
  return (note as { $schema?: unknown } | null)?.$schema === LANDING_STICKY_SCHEMA_TAG;
}
