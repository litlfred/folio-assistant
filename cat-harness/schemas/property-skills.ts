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
  images: { skills: ["theme-declaration", "harness-tiles"] },
  assets: { skills: ["directory-conventions"] },
  icon: { skills: ["theme-declaration", "harness-tiles"] },
  navbarIcons: { skills: ["harness-tiles"] },
  stub: { skills: ["directory-conventions"] },
  canonicalUrl: { skills: ["directory-conventions"] },
  previewUrl: { skills: ["directory-conventions"] },
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
  stickies: { skills: ["create-sticky-note"] },
  renderExemption: { skills: ["harness-tiles"] },
  needs: { skills: ["instance-kinds", "confirm-harness"] },
  // `publishable` was here until 2026-09-24 and the field is gone — replaced
  // by `publication.state`, which is a STATE rather than a boolean. The three
  // below point at `instance-publication` rather than `directory-conventions`:
  // the conventions skill says where a directory goes, this one says what
  // publication means and why `published` does not parse.
  id: { skills: ["instance-publication", "directory-conventions"] },
  version: { skills: ["instance-publication", "directory-conventions"] },
} as const satisfies Record<string, PropertySkills>;

export type DeclarationProperty = keyof typeof PROPERTY_SKILLS;
