/**
 * The shape of `skills.json`, the labelling node that says which
 * subdirectories of a skills directory are TOPICS (bean `9umr`).
 *
 * @module schemas/skill-topics
 *
 * Its own module, depending on zod alone, because `scripts/skill-topics.ts`
 * parses with it and that is imported by `scripts/known-skills.ts` — a
 * schema file that pulled in `cat-harness.ts` would make the skill walk
 * import the whole declaration reader. Registered as the `skill-topics/v1`
 * family of the `skills` graph kind, so `check:kind-validators` grades the
 * committed file against the same schema the reader parses with.
 */
import { z } from "zod";

export const SKILL_TOPICS_TAG = "skill-topics/v1";

export const SkillTopicSchema = z
  .object({
    id: z.string().min(1),
    /** One plain segment: a topic is a direct subdirectory, never deeper. */
    path: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "one plain segment"),
    title: z.string().min(1),
    description: z.string().min(1),
  })
  .strict();

export const SkillTopicsSchema = z
  .object({
    $schema: z.literal(SKILL_TOPICS_TAG),
    _comment: z.string().optional(),
    topics: z.array(SkillTopicSchema),
  })
  .strict();

export type SkillTopic = z.infer<typeof SkillTopicSchema>;
