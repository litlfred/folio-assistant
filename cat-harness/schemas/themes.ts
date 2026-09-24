/**
 * The themes this instance ships, and the default.
 *
 * @module schemas/themes
 * @graphNode schema
 *
 * The owner's list, 2026-09-19: *"grumpy-cat, white black (and whatever needed
 * accessability), a couple pale sages and dusty carolina blues, in a couple of
 * fading gradations"*, with the default *"one of the sages (to match the
 * staging bar)"*.
 *
 * ## The high-contrast pair is the accessibility answer, not a decoration
 *
 * `high-contrast-light` and `high-contrast-dark` are the "whatever needed
 * accessibility" clause, and they are listed as a **pair** rather than one
 * theme, because a single high-contrast theme forces a choice that the reader's
 * own scheme preference has already made. Both clear WCAG AA on body text
 * against their own surface by construction — pure black on pure white, and the
 * reverse.
 *
 * **They deliberately carry no gradient.** A gradated surface has a *range* of
 * contrast ratios against its ink, so the worst point governs, and the whole
 * point of a high-contrast theme is that there is no worst point to find.
 *
 * ## The default was checked on staging, which is the only place it could be
 *
 * `DEFAULT_THEME_ID` is a sage because the owner asked for one that matches the
 * staging bar. **That match cannot be verified from a checkout** — the sticky
 * and the staging banner appear together on exactly one surface, the deployed
 * staging site, and picking a value from a palette in isolation is how a
 * default ends up almost-matching.
 *
 * So it was shipped provisionally and **looked at on the staging preview for
 * PR #405; the owner confirmed it 2026-09-19**. If the banner's colour ever
 * changes, this is a judgement to re-make there rather than a number to
 * recompute here — no test asserts the match, because none can.
 */
import {
  THEME_SCHEMA_TAG,
  ThemeSchema,
  explainThemeFailure,
  resolveTheme,
  type ResolvedTheme,
} from "./theme.js";

/** Geometry shared by every shipped theme: the sticky is the same sticky. */
const LAYOUTS = {
  laptop: { minWidth: "17rem", padding: "0.7em 0.8em", fontScale: 1 },
  mobile: { minWidth: "100%", padding: "0.8em 0.9em", fontScale: 1.05 },
  card: { minWidth: "13rem", padding: "0.6em 0.7em", fontScale: 0.95 },
} as const;

const RAW = [
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "pale-sage",
    name: "Pale sage",
    description: "The default. Matches the staging banner.",
    palette: {
      surface: "#e9efe6", ink: "#1c211b", edge: "#c3cebe", accent: "#6f8c64",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "pale-sage-fade",
    name: "Pale sage, fading",
    description: "The sage with a soft vertical gradation.",
    palette: {
      surface: "#e9efe6", ink: "#1c211b", edge: "#c3cebe", accent: "#6f8c64",
      gradientFrom: "#eef3ec", gradientTo: "#dde7d9",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "dusty-carolina",
    name: "Dusty Carolina blue",
    palette: {
      surface: "#e3ebf2", ink: "#181e25", edge: "#b9c8d6", accent: "#5b82a6",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "dusty-carolina-fade",
    name: "Dusty Carolina blue, fading",
    description: "The blue with a soft vertical gradation.",
    palette: {
      surface: "#e3ebf2", ink: "#181e25", edge: "#b9c8d6", accent: "#5b82a6",
      gradientFrom: "#eaf1f6", gradientTo: "#d5e2ed",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "grumpy-cat",
    name: "Grumpy cat",
    description: "Warm greys and a sage accent, after the mark.",
    palette: {
      surface: "#edeae4", ink: "#221f1b", edge: "#cbc5bb", accent: "#7d8a6e",
    },
    // The one shipped theme with art, and it names a ROLE rather than three
    // paths — so an instance declaring its own `landing` images gets its own
    // backdrop, and one declaring none renders palette-only instead of pointing
    // at three `.webp`s that live only in this repository. See
    // `theme.ts`'s ThemeBackdropSchema docs for why that inversion is the whole
    // point of the field.
    backdrop: {
      imageRole: "landing",
      // 0.86 is measured, not chosen by eye: `themes.test.ts` computes the
      // WORST-CASE contrast of `ink` over this scrim laid on pure black — the
      // darkest art any instance could declare — and requires it to clear WCAG
      // AAA. At 0.90 it is 10.94:1, against 13.93:1 on pure white — the dark end
      // is the binding one. A thinner scrim is where that guarantee
      // goes, which is why the number has a test and not a comment saying it
      // looked fine.
      // 0.82, and the whole history is here because this number has been moved
      // three times by LOOKING at it: 0.86 too present, 0.93 too far, 0.90
      // settled — and then, on a board where the art finally filled its card,
      // "still slightly too faded". The earlier readings were taken when the
      // art was letterboxed into a text-sized box, so the cat was small and the
      // scrim was doing less work than it appeared to.
      //
      // Re-measured rather than nudged. Ink over this scrim on PURE BLACK — the
      // darkest art any instance could declare, which is the binding case:
      //   grumpy-cat 9.02:1 | engineer 10.33:1 | library 8.81:1 | analyst 9.70:1
      // Every one still clears AAA (7:1), which is the floor this must not cross.
      scrim: "rgba(237, 234, 228, 0.82)",
      description:
        "The instance's declared landing art, behind the sticky's ink rather than composited with it.",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "grumpy-cyborg-agents",
    name: "Grumpy cyborg agents",
    description: "Cloud cream and a harness teal, behind the cat on the sled and the four robot cats pulling it.",
    palette: {
      // Sampled from the art: binned into a 16-step cube over the square crop,
      // the thought-cloud cream (#f0f0e0 bin) is 21% of the frame, far ahead of
      // the rain-grey blues. `ink` is the hoodie's dark green, 14.15:1 on
      // `surface`.
      surface: "#fbf9ef", ink: "#1c2a24", edge: "#c5cdc3",
      // The teal of the harness lines and the robots' chest marks — the colour
      // that says "harness" in the picture. 4.72:1 on `surface`, past the 3:1
      // SC 1.4.11 floor for the priority stripe, and clear of the literal amber
      // and red the high and critical stripes carry.
      accent: "#2f7a80",
    },
    // CAT-HARNESS'S OWN, owner 2026-09-24: "use this for the cat-harness theme,
    // the current plain grump cat them it is using should be for
    // folio-assisnt-core". The same grumpy cat in the same sage hoodie, now in
    // a sled with the reins in paw, pulled by four robot cats in harness — the
    // name drawn literally. Named by the owner: "grumpy-cyborg-agents" — the
    // robot cats are the agents doing the pulling. `grumpy-cat` is unchanged and moves to
    // folio-assistant-core, which keeps "each harness its own theme" true.
    //
    // All three crops declare their own `textRegion`, measured by rendering
    // boxes over them: the @ mark sits at the cloud's top centre, so the words
    // go below it.
    backdrop: {
      imageRole: "landing-grumpy-cyborg-agents",
      // Measured like its siblings: `ink` over this scrim laid on PURE BLACK is
      // 9.29:1, clear of the AAA 7:1 floor; 14.29:1 on pure white.
      scrim: "rgba(251, 249, 239, 0.82)",
      description:
        "The instance's declared grumpy-cyborg-agents art, behind the sticky's ink rather than composited with it.",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "bootstrap",
    name: "CatBootstrap",
    description: "Desert sand and sienna \u2014 the frontier at the start of the trail.",
    palette: {
      surface: "#f4f0e6", ink: "#26211a", edge: "#d8cdb6", accent: "#b1683c",
    },
    // BOOTSTRAP'S OWN, which is the convention the owner set: "each harness
    // hould have its own unique theme". It was the one harness with a sticky
    // and no art, so its card rendered palette-only while every other card
    // carried a cat \u2014 visible as a gap rather than as a choice.
    //
    // The art is a grumpy cat in a cowboy hat and boots, in the rain, in a
    // Sonoran desert with a roadrunner. That reads as the frontier at the start
    // of the trail, which is what bootstrap IS: "the graph an agent reads
    // before it knows what this repository is".
    //
    // Its three crops each declare their own `textRegion`, measured by opening
    // them: the cloud sits high and the @ mark occupies its top centre, so the
    // words go BELOW the mark rather than over it. Without those, this role
    // would fall back to the default grumpy cloud, whose geometry is a
    // different composition's and would put the text across the @.
    backdrop: {
      imageRole: "landing-bootstrap",
      // Measured the same way as its siblings: `ink` over this scrim laid on
      // PURE BLACK, the darkest art any instance could declare, is 9.25:1 \u2014
      // clear of the AAA 7:1 floor. 14.37:1 on pure white.
      scrim: "rgba(244, 240, 230, 0.82)",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "operations",
    name: "Grumpy cat, operations",
    description: "Steel and blueprint blue — building the thing, and running it.",
    palette: {
      surface: "#edf0f3", ink: "#1a2129", edge: "#ccd4db",
      // Blueprint blue rather than the hi-vis yellow, for the reason `engineer`
      // gives below about its own signature colour: `accent` is the priority
      // stripe's hue, so a theme whose accent is a safety yellow makes `medium`
      // read as a warning on that board alone. The scene supplies a second
      // honest colour — the blueprint screen and the sky — and that is this one.
      accent: "#3f6d9e",
    },
    // THE OWNER'S CLUSTER, 2026-09-20: "avatar/theme for engineering/test
    // harness/deploment/operations". A grumpy cat in a hard hat and hi-vis with
    // a clipboard, on a site where a space elevator is going up: cranes,
    // robotic assembly lines, a blueprint on a screen, a planet overhead.
    // Building infrastructure and then operating it, which is what that cluster
    // is about.
    //
    // ADDED BESIDE `engineer` RATHER THAN REPLACING IT. The two overlap — the
    // owner's cluster names "engineering" and `engineer` exists — but `engineer`
    // is referenced only from tests, and replacing its art would discard work
    // nobody asked to remove. Collapsing them is a judgement for the owner, and
    // it is cheap to do later and not cheap to undo.
    //
    // Which cards wear this is a JUDGEMENT, not a lookup: the owner's standing
    // ruling is "no formal role/theme mapping per se. that is authoring
    // (human/agentic) decision/judgement", and they framed this one the same way
    // — "as jsugementcall in narratives and on test plans, and related
    // (sub)graphs".
    //
    // All three crops are one scene, and each declares its OWN `textRegion`,
    // measured by opening it. The @ mark sits in the cloud's upper centre in
    // every crop, so the words go BELOW it — and the cloud is WIDE AND SHORT in
    // the square and tall crops, which leaves genuinely little room. That is a
    // property of the composition rather than a mistake, and it makes this
    // theme suit SHORT cards; a long one should either declare its own
    // `text.box` or wear a roomier theme.
    backdrop: {
      imageRole: "landing-operations",
      // Measured the way every sibling's is: `ink` over this scrim laid on PURE
      // BLACK — the darkest art any instance could declare, and therefore the
      // binding case — is 9.36:1, clear of the AAA 7:1 floor. 14.57:1 on pure
      // white.
      scrim: "rgba(237, 240, 243, 0.82)",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "engineer",
    name: "Grumpy cat, engineering",
    description: "The cloud cream and a working green, behind the cat in a hi-vis vest.",
    palette: {
      surface: "#fdfbef", ink: "#1f2a24", edge: "#c9cfc4",
      // NOT the hi-vis orange, however much it is the picture's signature colour.
      // `accent` is the priority stripe's hue for `medium`, and `.fa-sticky-p-high`
      // is a literal amber precisely so urgency reads the same on every board. An
      // orange accent would make a medium sticky look like a high one — a theme may
      // set a hue, never make two signals look alike.
      accent: "#5a6b5c",
    },
    backdrop: {
      imageRole: "landing-engineer",
      // Measured like grumpy-cat's, over PURE BLACK: 11.41:1 for this ink, and
      // 14.35:1 over white. The art carries bright hi-vis orange and near-black
      // shadow in the same frame, so both ends are real here rather than
      // hypothetical.
      //
      // 0.90 after two looks at the rendered board: 0.86 left the logo too
      // present ("should be fadded a lot ... logo faded especially"), 0.93 went
      // past it ("a bit less faded"). Arrived at by rendering and looking, which
      // is the only way this value was ever going to be settled. The scrim is the
      // ONE fade knob: adding an `opacity` to the art would be a second control
      // for one effect, and the two would have to be kept in step by whoever
      // next changed either.
      scrim: "rgba(253, 251, 239, 0.82)",
      description:
        "The instance's declared engineering landing art, behind the sticky's ink rather than composited with it.",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "library",
    name: "Grumpy cat, librarian",
    description: "Storm slate and a cool cream, behind the cat with the books.",
    palette: {
      // Sampled from the art rather than chosen: a 7px grid over the square crop
      // gives #e4e4e4 / #e4e4d8 for the cloud at 20% of the frame, and a slate
      // family — #6c8490, #78849c, #78909c, #90a8b4 — for the rain and the
      // library behind it. The values below sit inside those clusters.
      surface: "#e8e8e0", ink: "#1c2630", edge: "#c2ccd4",
      // A slate blue, clear of the literal red and amber the critical/high
      // priority stripes carry, so urgency still reads the same on this board.
      // 3.98:1 against `surface` — past the 3:1 SC 1.4.11 floor for a non-text
      // channel, which is what the stripe is.
      accent: "#5c7484",
    },
    backdrop: {
      imageRole: "landing-library",
      // Measured over PURE BLACK like the others: 9.97:1 for this ink, 12.72:1
      // over white. This art has the widest tonal range of the three — a
      // near-black 4% of the frame beside lamplight — so the dark end is real.
      scrim: "rgba(232, 232, 224, 0.82)",
      description:
        "The instance's declared librarian art, behind the sticky's ink rather than composited with it.",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "analyst",
    name: "Grumpy cat, analyst",
    description: "Daylight cream and a working blue, behind the cat with the charts.",
    palette: {
      // Sampled from the art, and the numbers say why this is not a variation
      // on the others: a 7px grid over the square crop gives #f0f0e4 across 28%
      // of the frame, against #e4e4e4 for the librarian, with sky blues
      // (#a8ccfc, #b4d8fc, #c0d8fc, #9cccfc) where the others have rain-grey.
      // This is the ONLY sunny backdrop in the set.
      surface: "#f2f2e8", ink: "#1e2a3a", edge: "#cbd6e2",
      // The tie blue. 4.76:1 against `surface`, past the 3:1 SC 1.4.11 floor
      // for a non-text channel, and clear of the literal red and amber the
      // critical/high stripes carry so urgency reads the same on every board.
      accent: "#2f6ea8",
    },
    backdrop: {
      imageRole: "landing-analyst",
      // Measured over PURE BLACK like the rest: 10.29:1 for this ink, 13.04:1
      // over white. The art is bright, so the dark end is the one that could
      // have been assumed and was not.
      scrim: "rgba(242, 242, 232, 0.82)",
      description:
        "The instance's declared analyst art, behind the sticky's ink rather than composited with it.",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "architecture",
    name: "Grumpy cat, architecture",
    description: "Cloud cream and a drafting slate, behind the cat with the rolled drawings.",
    palette: {
      // SAMPLED FROM THE ART, not chosen to match its neighbours: the card was
      // drawn to a canvas and every pixel binned into a 32-step cube, so these
      // are the colours the image is actually made of with the share each
      // occupies.
      //
      //   #fdfbf0  35.38%   the thought-cloud cream
      //   #6a7c73  33.07%   the drafting slate — the second signature colour
      //   #a6aea8   3.45%   its light edge
      //   #1a372d   2.32%   the darkest green in the frame
      //
      // `ink` on `surface` measures **12.43:1**, past the AAA 7:1 floor the
      // whole set is held to. `edge` is 5.68:1 against that ink — a divider
      // rather than a second text colour, which is why the chip rule paints on
      // `surface` and never on `edge`.
      surface: "#fdfbf0", ink: "#1a372d", edge: "#a6aea8",
      // The drafting slate, a third of the frame. NOT the white of the coat or
      // the hard hat, however much those read as "architect": `accent` is the
      // priority stripe's hue for `medium`, and a near-white stripe would be
      // invisible on a cream surface — the same reasoning that keeps
      // `engineer` off its hi-vis orange, one step along. Clear of the literal
      // amber and red the high and critical stripes carry, so urgency reads
      // the same on every board.
      accent: "#6a7c73",
    },
    // NO `backdrop`, AND THAT IS THE WHOLE STORY OF THIS THEME.
    //
    // Owner, 2026-09-23: *"create architecture theme"*. The palette above is
    // real and measured; the art is NOT complete, so the backdrop is withheld
    // rather than declared against a set that cannot serve it.
    //
    // `landing-architecture` declares **laptop and card, and no mobile**.
    // `resolveThemeBackdrop` refuses a partial set wholesale, and
    // `themes.test.ts` fails any shipped backdrop that does not resolve all
    // three — which is exactly what happened when this entry was first written
    // WITH a backdrop. The gate caught it; that is the gate working.
    //
    // The reason the set is short is recorded on the card image itself and in
    // that test: the third upload was a byte-identical copy of the second, so
    // the portrait crop was never actually supplied. It is not a file somebody
    // mislaid — it does not exist.
    //
    // A palette-only theme is a real object: it carries an id, a palette and
    // layouts, and a sticky using it renders palette-only. What it cannot yet
    // do is supply a backdrop or a navbar avatar, both of which come from the
    // art.
    //
    // WHEN THE PORTRAIT CROP ARRIVES, this is the whole edit — declare
    // `landing-architecture-mobile` beside its two siblings, then add here:
    //
    //     backdrop: {
    //       imageRole: "landing-architecture",
    //       scrim: "rgba(253, 251, 240, 0.86)",
    //       description: "...",
    //     },
    //
    // The scrim is already measured, so it is not a value the next person has
    // to re-derive: ink over it is **9.02:1** on PURE BLACK and 12.52:1 over
    // white, swept rather than copied — 0.78 already clears the 7:1 floor at
    // 7.36:1, and 0.86 buys margin without going past where the other cards
    // settled.
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "high-contrast-light",
    name: "High contrast, light",
    description: "Black on white. No gradation, by design.",
    palette: { surface: "#ffffff", ink: "#000000", edge: "#000000", accent: "#000000" },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    kind: "sticky",
    id: "high-contrast-dark",
    name: "High contrast, dark",
    description: "White on black. No gradation, by design.",
    palette: { surface: "#000000", ink: "#ffffff", edge: "#ffffff", accent: "#ffffff" },
    layouts: LAYOUTS,
  },
] as const;

/**
 * Every shipped theme, RESOLVED — so a malformed one fails at import, not at
 * render, and so consumers get the form that has all its fields.
 *
 * `ResolvedThemeSchema`, not `ThemeSchema`. The declared form went lax when
 * themes gained inheritance (bean `j66n`): every field but identity is
 * optional there, because a theme states only what it changes. That is the
 * AUTHOR's form. A renderer needs the resolved one, where requiredness
 * actually lives — `data-modelling` step 7.
 *
 * None of these eleven inherits from anything, so resolving them is a parse
 * with `kind` defaulted to `sticky`. They go through the same function a
 * who-iris theme will, rather than a shortcut that would stop exercising the
 * path the moment it mattered.
 */
export const THEMES: readonly ResolvedTheme[] = RAW.map((t) => {
  const declared = ThemeSchema.parse(t);
  const r = resolveTheme({ instance: "cat-harness", theme: declared }, () => undefined);
  if (!r.ok) throw new Error(`theme ${declared.id}: ${explainThemeFailure(r.failure)}`);
  return r.theme;
});

/**
 * The default.
 *
 * Provisional against the staging bar — see the module docs. It is a sage
 * because that is what was asked for; *which* sage is a question only the
 * deployed staging site can settle.
 */
export const DEFAULT_THEME_ID = "pale-sage";

/** The themes carrying a gradation, for the "couple of fading gradations" ask. */
export const GRADATED_THEME_IDS = THEMES.filter((t) => t.palette.gradientFrom).map((t) => t.id);

/** The high-contrast pair, which the accessibility clause requires to exist. */
export const HIGH_CONTRAST_THEME_IDS = ["high-contrast-light", "high-contrast-dark"] as const;

export function themeById(id: string): ResolvedTheme | undefined {
  return THEMES.find((t) => t.id === id);
}
