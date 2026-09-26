/**
 * `folio-withheld/v1` — what a mounted directory must NOT publish.
 *
 * @module schemas/withheld
 * @graphNode schema
 *
 * Bean `cw35`. The site mount (`scripts/mount-instance-docs.ts`) copies an
 * instance's directory wholesale, so a publication whose licence refuses
 * redistribution stayed reachable BY URL after every link to it was removed.
 * The platform cannot know an instance's licence rules; the instance's own
 * generator writes this list from its own data (who-iris: the catalogue's
 * publication gates), and the mount honours it for every instance alike.
 *
 * Each entry names a path relative to the directory the file sits in — a
 * trailing `/` for a directory, which is withheld with its whole subtree — and
 * the reason, so a reader of the built site can tell "withheld" from "missing".
 */
import { z } from "zod";

export const WithheldEntrySchema = z
  .object({
    /** Relative to the directory holding the file; a directory takes its whole subtree. */
    path: z.string().min(1),
    /** Why — which gate, which verdict. A withholding with no reason cannot be re-checked. */
    reason: z.string().min(1),
  })
  .strict();

export const WithheldSchema = z
  .object({
    $schema: z.literal("folio-withheld/v1"),
    _comment: z.string().optional(),
    paths: z.array(WithheldEntrySchema),
  })
  .strict();
export type Withheld = z.infer<typeof WithheldSchema>;
