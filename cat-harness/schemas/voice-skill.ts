/**
 * A VOICE SKILL — a voice as a first-class member of the knowledge graph.
 *
 * ## Why a voice is a skill and not a data file beside one
 *
 * A voice already carries everything a skill carries: it tells an actor what to
 * do, it is bound to processes by name, and it is versioned with the graph. It
 * was kept as a bare `voices/<id>.json` only because it started as data, and
 * that split has a cost the rest of this file is about — the INSTRUCTIONS for
 * writing in a voice ended up in `skills/folio-core/voice-authoring-guidance.md`
 * in the PLATFORM, restating another instance's rules without their citations
 * (bean `btuv`). A voice that is a skill has nowhere to leak to: its
 * instructions and its rules are the same node, owned by the same instance.
 *
 * So a voice skill lives at `<instance>/skills/voices/<id>/`, inside the `kg`
 * graph, and the instance that holds it is the instance that DERIVED it.
 *
 * ## Three consumers, and the schema says which field serves which
 *
 * | process | what it reads | why |
 * |---|---|---|
 * | **authoring** | `instructions`, and the rules flagged {@link VoiceSkillRule.counterintuitive} | what to know BEFORE drafting — the rules where the instinct is wrong and the retrofit is expensive |
 * | **review / QC** | every rule with its `source` | a reviewer upholds a finding by opening the cited page, never by trusting the rule's wording |
 * | **QA** | `patterns`, `terminology`, `judgementOnly`, {@link VoiceSkillSchema} `overlaySeverity` | the mechanical half, and the weight of the derived overlay criterion |
 *
 * **No field serves two of those by restatement.** The instruction body must
 * not enumerate rules: a rule stated in prose beside the same rule stated as
 * data is one fact in two places, and the prose copy is the one carrying no
 * citation and no pattern. `scripts/check-voice-skills.ts` enforces it, on
 * four signals — a rule's id, its title, its citation's quote, and both sides
 * of a terminology pair.
 *
 * That sentence named a gate that **did not exist** from the day this file was
 * written until 2026-09-21 (bean `n8br`), and four `SKILL.md` files repeated
 * the claim. It is named by PATH here rather than by npm script for that
 * reason: a path is something a reader can open and find absent.
 *
 * @module schemas/voice-skill
 * @graphNode schema
 */

import { z } from "zod";

import {
  VoiceRuleSchema,
  VoiceRefSchema,
  VoiceApplicabilitySchema,
  VoiceSupersessionSchema,
  VOICE_PROVENANCE,
} from "./voices.ts";

/**
 * Where a voice skill lives, relative to the instance that owns it.
 *
 * `skills/` rather than `voices/` because a voice IS a skill; the `voices/`
 * segment under it because the `kg` graph holds several kinds and a reader
 * scanning for voices should not have to open every skill to find them.
 *
 * **The owning instance is the one the voice BELONGS TO semantically, and it
 * is a judgement.** Owner, 2026-09-21: *"voices should be associated to
 * appropriate home semantically/by judgement."*
 *
 * This entry said "the one that DERIVED the voice" until then, which reads as
 * a mechanical rule — follow the sources — and the corpus falsifies it twice:
 *
 * - `who-editorial` is read out of a WHO publication held by `who-iris`, and
 *   lives in `who-style-guide`. Where the source sits did not decide it.
 * - `technical-writer` is read out of RFC 2119 and RFC 8174, both ingested in
 *   `agent-skills`, and lives in `folio-assistant-core` — because what it is
 *   ABOUT is how to write technical documentation of a standard, software or
 *   a knowledge asset, which is what that layer is for.
 *
 * The one part that is not a judgement: **the platform holds none of it.**
 * `cat-harness` runs the checks and declares no voices, which is the boundary
 * bean `btuv` exists to keep.
 */
// declared-path-literal: the convention for a layout that has no graph kind
// yet. `voices` is declared today as its own graph pointing at `voices/`; this
// proposal moves it under `skills/` and that declaration has to move with it,
// at which point this constant is replaced by `directoryForGraph`. Stated once,
// here, so the migration is one edit rather than a sweep — and COUNTED rather
// than hidden, because until the kind exists the literal is real debt.
export const VOICE_SKILL_DIR = "skills/voices";

/**
 * One rule, plus the two flags that make it usable by a process rather than
 * only readable by a person.
 *
 * Extends `VoiceRuleSchema` rather than restating it: the id, title,
 * description, category, severity, source, patterns, terminology and
 * `judgementOnly` are unchanged, because they were already right.
 */
export const VoiceSkillRuleSchema = VoiceRuleSchema.extend({
  /**
   * The instinct is wrong, so a drafter must know this rule BEFORE writing.
   *
   * This is the authoring half, and it exists because the platform used to
   * carry it as prose. `voice-authoring-guidance.md` had a section naming the
   * rules "most often broken by drafting on instinct" — with WHO's `-ize`
   * choice and its ban on "not recommended" written into a generic skill,
   * uncited, in a subsystem whose whole claim is that a voice is auditable
   * rather than asserted. The flag moves that judgement to the voice, where the
   * rule already carries the page it was read from.
   *
   * Absent means "not known to be counterintuitive", not "obvious" — nobody has
   * ruled, and an authoring pass says so rather than implying the rule is safe
   * to guess at.
   */
  counterintuitive: z.boolean().optional(),

  /**
   * Why the instinct is wrong, in one sentence, for a drafter who has not read
   * the source.
   *
   * Required when {@link counterintuitive} is true and forbidden otherwise —
   * the refinement below enforces both halves. A flag with no explanation is a
   * warning a reader cannot act on; an explanation on an unflagged rule is
   * prose nothing will ever show.
   */
  commonError: z.string().min(1).optional(),
}).superRefine((r, ctx) => {
  if (r.counterintuitive && !r.commonError) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["commonError"],
      message:
        `rule "${r.id}" is flagged counterintuitive and gives no \`commonError\`. ` +
        `The flag exists to warn a drafter before they write; a warning that ` +
        `does not say what the wrong instinct IS cannot be acted on.`,
    });
  }
  if (!r.counterintuitive && r.commonError) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["counterintuitive"],
      message:
        `rule "${r.id}" gives a \`commonError\` without being flagged ` +
        `counterintuitive, so nothing will ever show it. Flag it or drop the text.`,
    });
  }
});
export type VoiceSkillRule = z.infer<typeof VoiceSkillRuleSchema>;

/** Where the instruction body lives. */
export const VoiceInstructionsSchema = z
  .object({
    /**
     * The skill body, as a sibling file — `SKILL.md` by convention.
     *
     * A FILE rather than an inline string, for the reason every skill in this
     * graph is a file: prose belongs in Markdown where it can be read in a
     * diff, linked to and rendered, not escaped inside JSON.
     */
    file: z.string().min(1),
    /**
     * What an actor is expected to DO with this voice, one line, for a skill
     * index that lists it beside every other skill.
     */
    summary: z.string().min(1),
  })
  .strict();

/**
 * A voice skill.
 *
 * Everything `VoiceProfileSchema` carried, plus the skill half and the QA
 * binding. The migration is mechanical: a `voices/<id>.json` becomes
 * `skills/voices/<id>/voice.json` with `instructions` added and its rules
 * optionally flagged.
 */
export const VoiceSkillSchema = z
  .object({
    $schema: z.literal("folio-voice-skill/v1"),

    // ── identity ────────────────────────────────────────────────────────
    id: z.string().regex(/^[a-z0-9-]+$/, "a voice id is lower-case kebab"),
    title: z.string().min(1),
    description: z.string().min(1),

    /**
     * The instance that DERIVED this voice, by declared name.
     *
     * Absent means this one — the same convention `VoiceRefSchema` uses, and
     * for the same reason: a name, never a path, so a checkout layout cannot
     * be hardcoded into content. Present is for a voice re-exported by an
     * instance that did not derive it, which must say whose it is.
     */
    owner: z.string().min(1).optional(),

    // ── the SKILL half ──────────────────────────────────────────────────
    instructions: VoiceInstructionsSchema,

    // ── the EVIDENCE half ───────────────────────────────────────────────
    /** The ingested documents this voice is derived from. */
    sources: z
      .array(
        z.object({
          title: z.string().min(1),
          instance: z.string().min(1).optional(),
          libraryId: z.string().min(1).optional(),
          kgRef: z.string().min(1).optional(),
          url: z.string().url().optional(),
          year: z.number().int().optional(),
        }),
      )
      .default([]),
    provenance: z.enum(VOICE_PROVENANCE),
    rules: z.array(VoiceSkillRuleSchema).min(1),

    // ── the QA binding ──────────────────────────────────────────────────
    /**
     * How severe a finding against this voice AS A WHOLE is, for the overlay
     * criterion derived from it.
     *
     * **Declared because it is not derivable, and that was measured.** The
     * obvious rule — the worst rule's severity — agrees on two of the four
     * voices this repository shipped and disagrees on two:
     * `who-publication-design` carries `critical` rules and its criterion was
     * registered `major`; `milnor`'s worst rule is `major` and its criterion
     * was `minor`. Deriving it would have silently re-graded half the corpus.
     *
     * Absent is a documented default of `major`, not unknown.
     */
    overlaySeverity: z.enum(["critical", "major", "minor"]).optional(),

    // ── scoping, unchanged from VoiceProfileSchema ──────────────────────
    appliesTo: z.array(z.string().min(1)).optional(),
    activeIn: VoiceApplicabilitySchema.optional(),
    extends: VoiceRefSchema.optional(),
    superseded: VoiceSupersessionSchema.optional(),
  })
  .strict();
export type VoiceSkill = z.infer<typeof VoiceSkillSchema>;

/** The overlay criterion id a voice generates. One rule, one place. */
export function overlayCriterionId(voiceId: string): string {
  return `voice-overlay-${voiceId}`;
}

/** The overlay criterion's severity: declared, or the documented default. */
export function overlaySeverityOf(v: Pick<VoiceSkill, "overlaySeverity">): string {
  return v.overlaySeverity ?? "major";
}
