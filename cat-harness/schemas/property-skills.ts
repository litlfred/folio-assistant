/**
 * Which skill edits which declaration property: the "edit skills" column of the
 * harness config panel (issue #1146).
 *
 * Owner, 2026-09-23: *"add in to render appropraite edit skills as well"*, and,
 * on QA: *"make sure all node types/schemas have QA. it is a QA in and of
 * itself if there are missing"*. So this map is TOTAL over the declaration's
 * keys, and `property-skills.test.ts` fails when a key is added to
 * {@link CatHarnessDeclarationSchema} without a row here. A row either names
 * the skills that edit the property or records, in words, that none does yet.
 * A recorded gap is shown in the panel as a finding. It is never left blank.
 *
 * Skills are named by their file stem, which is how `reference/skill-instructions/`
 * publishes them. The test checks every name resolves to a skill file.
 *
 * @module schemas/property-skills
 * @graphNode schema
 */

/** One declaration property's edit route. */
export type PropertySkills =
  | { skills: readonly [string, ...string[]]; gap?: undefined }
  | { skills: readonly []; gap: string };

/** Every key of the declaration, in the order the schema declares them. */
export const PROPERTY_SKILLS = {
  name: { skills: ["instance-kinds", "directory-conventions"] },
  title: { skills: ["harness-tiles"] },
  description: { skills: ["harness-tiles"] },
  // The one-line gloss and the other spellings shown under a harness's
  // section on the landing page (bean `ob3m` findings 4–5).
  summary: { skills: ["harness-tiles"] },
  alsoWritten: { skills: ["harness-tiles"] },
  // The instance's own avatar, moved off the table in avatars.ts (sod4 #4).
  avatar: { skills: ["harness-tiles"] },
  images: { skills: ["theme-declaration", "harness-tiles"] },
  assets: { skills: ["directory-conventions"] },
  icon: { skills: ["theme-declaration", "harness-tiles"] },
  navbarIcons: { skills: ["harness-tiles"] },
  // Which tiles the glass's bottom strip pins, in order; the rest are
  // counted on its "+N more" tile (owner's ruling, bean `ob3m` finding 10).
  glassStrip: { skills: ["harness-tiles"] },
  // The planned owner/repo and, pre-split, the host + directory it sits in
  // today (bean 6rmv); `instance-repositories.ts` derives the map from both.
  repository: { skills: ["instance-kinds", "directory-conventions"] },
  livesAt: { skills: ["instance-kinds", "directory-conventions"] },
  // Content or tools half of the split (bean eayu); a content instance holding
  // code is a failing kg:audit finding.
  separation: { skills: ["kg-separation"] },
  // Instances seeded in the same step (owner, 2026-10-04); seed:ready does not
  // count a path into one as upward.
  seedsWith: { skills: ["kg-separation"] },
  stub: { skills: ["directory-conventions"] },
  canonicalUrl: { skills: ["directory-conventions"] },
  previewUrl: { skills: ["directory-conventions"] },
  // Where identifiers are minted, before the version — and the rule for which
  // audience gets the full version and which the major (instance-publication).
  iriBase: { skills: ["instance-publication"] },
  // The instance's Node Kinds: `$schema` tag → the published schema defining it.
  nodeSchemas: { skills: ["directory-conventions"] },
  // TWO facets, two skills: `publication.host` is what kind of thing serves
  // the rendering (document-publishing); `publication.state` is how far along
  // it is, and why "published" does not parse (instance-publication).
  publication: { skills: ["document-publishing", "instance-publication"] },
  topology: {
    skills: [],
    gap: "no skill edits `topology` yet: its axes are documented only in the schema (cat-harness.ts, TopologySchema)",
  },
  directories: { skills: ["directory-conventions", "schema-management"] },
  remoteGraphs: { skills: ["library-ingestion", "materialize-remote"] },
  associatedHarnesses: { skills: ["associate-harness"] },
  // Issue #1719. Both name a large-datasets skill, as `remoteGraphs` already
  // does with `materialize-remote`: the process that walks a subscription
  // calls that layer's subprocesses, so its skill lives beside them.
  subscriptions: { skills: ["kg-subscription", "materialize-remote"] },
  knownSubstrates: { skills: ["kg-subscription"] },
  // Bean `0mpw`: the harness's defaults and the downstream's mounts are two
  // halves of one relation, and one skill walks both.
  mountDefaults: { skills: ["remote-mount"] },
  remoteMounts: { skills: ["remote-mount"] },
  stickies: { skills: ["create-sticky-note"] },
  renderExemption: { skills: ["harness-tiles"] },
  needs: { skills: ["instance-kinds", "confirm-harness"] },
  // Bean `0r7u`: what an instance's own check scripts read and write, so
  // `gates` may pool them and `regen` may skip them. prepare-merge says what
  // a wrong declaration costs.
  taskIo: { skills: ["prepare-merge"] },
  // Same bean: the CI steps and scripts an instance's gate set deliberately
  // skips, with their reasons. prepare-merge runs `bun run gates`, which
  // reports an unclassified step.
  gateExemptions: { skills: ["prepare-merge"] },
  contentAdapters: { skills: ["content-profiles"] },
  // Bean `0r7u`: each instance's translation profile per content type it owns.
  contentTranslations: { skills: ["translation-manager"] },
  liquid: { skills: ["witnessed-values"] },
  // `publishable` was here until 2026-09-24 and the field is gone — replaced
  // by `publication.state`, which is a STATE rather than a boolean. The three
  // below point at `instance-publication` rather than `directory-conventions`:
  // the conventions skill says where a directory goes, this one says what
  // publication means and why `published` does not parse.
  id: { skills: ["instance-publication", "directory-conventions"] },
  version: { skills: ["instance-publication", "directory-conventions"] },
} as const satisfies Record<string, PropertySkills>;

export type DeclarationProperty = keyof typeof PROPERTY_SKILLS;
