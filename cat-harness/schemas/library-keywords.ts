/**
 * `library/<slug>/keywords.json` — an entry's keywords, read from the LSI
 * index's own log-entropy term weights (issue #2302). Written by
 * `scripts/library-keywords.ts`; read by the library viewer's Document panel.
 *
 * `evidence: ["heading"]` when every word of the keyword appears in a heading
 * the extraction found: the section's own title for a section keyword, a TOC
 * title or figure caption for a document keyword.
 */
import { z } from "zod";

export const KEYWORDS_SCHEMA_ID = "folio-keywords/v1" as const;
/** The file each library entry carries. */
export const KEYWORDS_FILE = "keywords.json";

const ScoredKeywordSchema = z
  .object({
    term: z.string().min(1),
    /** Comparable within one library's matrix only. */
    score: z.number(),
    evidence: z.array(z.enum(["heading"])),
  })
  .strict();

export const KeywordsFileSchema = z
  .object({
    $schema: z.literal(KEYWORDS_SCHEMA_ID),
    entry: z.string().min(1),
    corpus: z
      .object({ library: z.string(), sections: z.number().int(), terms: z.number().int(), weighting: z.string() })
      .strict(),
    document: z.array(ScoredKeywordSchema),
    sections: z.record(z.string(), z.array(ScoredKeywordSchema)),
  })
  .strict();

export type ScoredKeyword = z.infer<typeof ScoredKeywordSchema>;
export type KeywordsFile = z.infer<typeof KeywordsFileSchema>;
