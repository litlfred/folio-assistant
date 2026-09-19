/**
 * Voices — named editorial profiles that overlay the base house voice.
 *
 * A **voice** is a named set of editorial rules an agent applies when authoring
 * or reviewing prose. Voices are OVERLAID, not chosen: a folio may activate
 * several, and the union of their rules applies on top of the base house voice
 * in `skills/folio-core/one-voice-style-guide.md`.
 *
 * ## A voice is a third axis, and conflating it with the other two is costly
 *
 * `AGENTS.md` already warns about the first conflation: **adapters partition
 * block KINDS** (`adapterForKind` must stay total and unambiguous) while
 * **profiles nest** (every document kind is also a paper kind). A voice does
 * neither. It partitions HOW PROSE READS — spelling, punctuation, terminology,
 * register, citation form, and for a design voice the visual conventions around
 * the prose.
 *
 * Two folios can share an adapter and a profile and still speak differently: a
 * WHO guideline and a ministry-of-health policy document are both the
 * `document` profile, and only one of them wants `-ize` endings and "Member
 * State" capitalised.
 *
 * ## Voices are OPT-IN, and this instance activates none
 *
 * Issue #208, in the owner's words: *"we shouldnt autmoatically apply voices.
 * not all authors will want to use the who voice (e.g. a mministry of health)"*
 * and *"the folio-asst's own docuemtnation conent doesnt have any voice"*.
 *
 * So the default is the empty set, and `harness.config.json` opts in:
 *
 *     { "voices": { "active": ["who-editorial", "who-guideline-development"] } }
 *
 * That default is the opposite of the one `profiles` takes, deliberately.
 * `criterionProfiles` defaults to EVERY profile because narrowing silently
 * stops criteria running, and "a wrong pass is believed where a wrong fail is
 * argued with". A voice inverts the argument: applying an editorial register
 * nobody asked for produces confident findings against prose that was never
 * written to that standard, and the author has to argue every one of them back.
 * An unasked-for voice is a wrong FAIL at scale.
 *
 * ## Every rule cites its source, and that is enforced
 *
 * {@link VoiceRuleSource} is REQUIRED on every rule. This is the whole reason
 * issue #208 asks for the documents to be ingested before the voices are
 * written, and the reason PR #210 could not be merged as it stood: its three
 * WHO profiles carried ten plausible rules each and `source: null`. Plausible
 * is not the same as right — its first rule asserts `-ise/-isation` as WHO's
 * spelling baseline, and the WHO Editorial Style Manual says the opposite in as
 * many words ("`-ize`, derived from the Greek “-izo”, is preferred", p14).
 *
 * A rule that cannot name the passage it comes from is an assertion wearing a
 * citation's clothes. Same discipline as a BASELINE measurement carrying its
 * command and date.
 *
 * @module schemas/voices
 * @graphNode schema
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";

import { kgNodeLabelShape, type KgNodeLabels } from "./kg-node";

/** Which aspect of the prose (or of its presentation) a rule governs. */
export const VOICE_RULE_CATEGORIES = [
  "spelling",
  "punctuation",
  "terminology",
  "capitalization",
  "citation",
  "person",
  "register",
  "structure",
  "numbers",
  "formatting",
  "accessibility",
  "methodology",
  "visual-identity",
] as const;
export type VoiceRuleCategory = (typeof VOICE_RULE_CATEGORIES)[number];

/**
 * Where a rule comes from, in the ingested corpus.
 *
 * `libraryId` + `sectionId` resolve to a real file under `library/`, which is
 * what `library-is-l1.md` requires of every knowledge-graph reference to a
 * source: "resolves to it THROUGH `library/`, never to a loose path or a bare
 * URL". `quote` is the sentence the rule was read from, so a reviewer can check
 * the derivation without opening the PDF.
 *
 * `pages` is the page range in the SOURCE DOCUMENT, not in the ingested file —
 * it is what a reader cites when they are holding the paper copy.
 */
export const VoiceRuleSourceSchema = z
  .object({
    /** `doc_id` under `library/`, e.g. `who-pub-tps-931`. */
    libraryId: z.string().min(1).optional(),
    /** `section_id` within that document, e.g. `page-014` or `sec-180-106-…`. */
    sectionId: z.string().min(1).optional(),
    /** Page range in the source document, e.g. "14" or "131-132". */
    pages: z.string().min(1).optional(),
    /**
     * A node of THIS instance's knowledge graph, as a repo-relative path, for a
     * voice that is a house standard rather than a reading of an outside
     * document.
     *
     * The `milnor` voice is the case, and pretending otherwise would have been
     * the more damaging option: its eight hallmarks are named after Milnor's
     * exposition but were not extracted from his writing, and giving it a
     * `libraryId` for a document nobody ingested is exactly the false provenance
     * this schema exists to prevent. A house standard citing the file that
     * states it is honest; a house standard citing a PDF that is not in
     * `library/` is not.
     */
    kgRef: z.string().min(1).optional(),
    /**
     * The passage the rule was read from. Required: a citation with no quote
     * cannot be checked without re-reading the source, which is the cost this
     * field exists to remove.
     */
    quote: z.string().min(1),
  })
  .refine(
    (src) =>
      (src.libraryId !== undefined && src.sectionId !== undefined) !==
      (src.kgRef !== undefined),
    {
      message:
        "a rule cites EITHER an ingested source (libraryId + sectionId) OR a node of this instance's KG (kgRef) — exactly one, never both and never neither",
    },
  );
export type VoiceRuleSource = z.infer<typeof VoiceRuleSourceSchema>;

/** A regex the mechanical half of a voice check may look for. */
export const VoicePatternSchema = z.object({
  regex: z.string().min(1),
  caseSensitive: z.boolean().optional(),
  /** What a match MEANS. Shown as the finding's evidence. */
  message: z.string().min(1),
});

/** A preferred/deprecated wording pair. */
export const VoiceTerminologySchema = z.object({
  correct: z.string().min(1),
  incorrect: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  /** When the pair applies only in a particular context. */
  context: z.string().min(1).optional(),
});

/**
 * One editorial rule.
 *
 * `severity` grades the RULE's authors' concern, not the confidence of any
 * particular match — the same caveat `voice-editorial-review.md` states for the
 * house voice, and the reason three of that axis's four `critical` findings in
 * this repo turned out to be quotations.
 */
export const VoiceRuleSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "a rule id is lower-case kebab"),
  ...kgNodeLabelShape,
  /** Required here even though `kgNodeLabelShape` makes it optional: an unnamed rule cannot be reported. */
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(VOICE_RULE_CATEGORIES),
  severity: z.enum(["critical", "major", "minor"]),
  source: VoiceRuleSourceSchema,
  patterns: z.array(VoicePatternSchema).optional(),
  terminology: z.array(VoiceTerminologySchema).optional(),
  /**
   * True when no lexical check can decide this rule and a reviewer must.
   * Recorded rather than inferred from the absence of `patterns`, because
   * "nobody has written the pattern yet" and "no pattern could work" are
   * different states and only the second is a finished rule.
   */
  judgementOnly: z.boolean().optional(),
});
export type VoiceRule = z.infer<typeof VoiceRuleSchema>;

/** A named voice profile. */
export const VoiceProfileSchema = z.object({
  $schema: z.literal("folio-voice/v1"),
  id: z.string().regex(/^[a-z0-9-]+$/, "a voice id is lower-case kebab"),
  ...kgNodeLabelShape,
  title: z.string().min(1),
  description: z.string().min(1),
  /** The ingested documents this voice is derived from. */
  sources: z
    .array(
      z.object({
        title: z.string().min(1),
        /** Absent for a house standard — see `VoiceRuleSourceSchema.kgRef`. */
        libraryId: z.string().min(1).optional(),
        /** The KG node stating the standard, for a voice with no ingested source. */
        kgRef: z.string().min(1).optional(),
        /** Where the document came from, for a reader who wants the original. */
        url: z.string().url().optional(),
        year: z.number().int().optional(),
      }),
    )
    .min(1, "a voice must name at least one source — ingested or a KG node"),
  rules: z.array(VoiceRuleSchema).min(1),
  /** Block kinds this voice audits. Absent means every kind the folio has. */
  appliesTo: z.array(z.string().min(1)).optional(),
});
export type VoiceProfile = z.infer<typeof VoiceProfileSchema>;
export type VoiceProfileLabels = KgNodeLabels;

/** The `voices` section of `harness.config.json`. */
export const VoiceConfigSchema = z.object({
  /**
   * Voice ids this folio activates. ABSENT OR EMPTY MEANS NONE — see the
   * module comment on why the default is the empty set rather than everything.
   */
  active: z.array(z.string().min(1)).default([]),
});
export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;

/** Thrown when a voice file will not load. */
export class VoiceLoadError extends Error {
  constructor(file: string, detail: string) {
    super(`voice ${file}: ${detail}`);
    this.name = "VoiceLoadError";
  }
}

/** The directory a voice graph lives in, relative to an instance root. */
export const VOICES_DIR = "voices";

/**
 * Load every voice profile an instance ships.
 *
 * Reads and VALIDATES — a malformed voice throws rather than being skipped.
 * PR #210 declared `export const VOICE_REGISTRY: VoiceProfile[] = []` with the
 * comment "Populated by loadVoices() at startup", and no `loadVoices` existed,
 * so every consumer saw an empty registry and reported no rules. That is the
 * `resolveSkillDirs` pattern again: a declaration with no reader.
 *
 * "Could not read" is NOT an empty registry. A directory that is absent returns
 * `[]` and says so through {@link voicesPresent}; a file that will not parse
 * throws. An unreadable voice must not present as a folio with no voices,
 * because the second is a legitimate state and the first is a defect.
 */
export function loadVoices(instanceRoot: string): VoiceProfile[] {
  const dir = resolve(instanceRoot, VOICES_DIR);
  if (!existsSync(dir)) return [];
  const out: VoiceProfile[] = [];
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith(".json")) continue;
    const path = join(dir, f);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(path, "utf-8"));
    } catch (e) {
      throw new VoiceLoadError(f, `not valid JSON — ${(e as Error).message}`);
    }
    const parsed = VoiceProfileSchema.safeParse(raw);
    if (!parsed.success) {
      throw new VoiceLoadError(f, parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    }
    if (parsed.data.id !== f.replace(/\.json$/, "")) {
      throw new VoiceLoadError(f, `declares id "${parsed.data.id}" — the filename must match the id`);
    }
    out.push(parsed.data);
  }
  return out;
}

/** Whether this instance ships a voice graph at all — the third state. */
export function voicesPresent(instanceRoot: string): boolean {
  return existsSync(resolve(instanceRoot, VOICES_DIR));
}

/**
 * The voices a folio has ACTIVATED, in the order their rules should be read.
 *
 * An id in `active` that names no shipped voice is an error, not a silent skip:
 * a folio that thinks it is applying the WHO editorial voice and is applying
 * nothing is the worst of the three outcomes, because the output looks clean.
 */
export function activeVoices(
  shipped: VoiceProfile[],
  config: VoiceConfig | undefined,
): VoiceProfile[] {
  const wanted = config?.active ?? [];
  const byId = new Map(shipped.map((v) => [v.id, v]));
  const missing = wanted.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new VoiceLoadError(
      missing.join(", "),
      `activated in harness.config.json but no such voice is shipped. ` +
        `Available: ${[...byId.keys()].join(", ") || "(none)"}`,
    );
  }
  return wanted.map((id) => byId.get(id)!);
}

/**
 * Every rule from a set of voices, with the voice each came from.
 *
 * Rules are UNIONED rather than merged: two voices may both speak about
 * capitalisation and both rules stand, because a reviewer reading a finding
 * needs to know which voice raised it. Deduplication by rule id across voices
 * would silently drop the second voice's reasoning.
 */
export function unionRules(
  voices: VoiceProfile[],
): Array<{ voice: string; rule: VoiceRule }> {
  return voices.flatMap((v) => v.rules.map((rule) => ({ voice: v.id, rule })));
}

/**
 * The voice ids a folio has activated, read from its `harness.config.json`.
 *
 * THREE-VALUED, and the distinction is what the QA voice gate turns on:
 *
 * - `[]` — the config was read and activates no voice. The common case, and this
 *   instance's. A voice-scoped criterion is `n/a`.
 * - `["who-editorial", …]` — the config was read and activates these.
 * - `undefined` — the config could NOT be read: absent, or present and
 *   unparseable. A criterion must then RUN, because "could not determine" must
 *   not be spent granting a skip. Same rule `readDeclaredFolioProfile` follows,
 *   and the reason that function exists as a named thing rather than an inline
 *   read.
 *
 * Collapsing the first and third into "no voices" is the defect this shape
 * exists to prevent: a folio whose config a tool cannot parse would silently
 * lose every voice check while reporting a clean run.
 */
export function readActiveVoices(repoRoot: string): string[] | undefined {
  for (const name of ["harness.config.json", "folio.config.json"]) {
    const p = resolve(repoRoot, name);
    if (!existsSync(p)) continue;
    try {
      const raw = JSON.parse(readFileSync(p, "utf-8")) as {
        voices?: unknown;
      };
      const parsed = VoiceConfigSchema.safeParse(raw.voices ?? {});
      // A `voices` key that will not parse is not "no voices": the author meant
      // something, and guessing which voices they meant is worse than running
      // every check.
      return parsed.success ? parsed.data.active : undefined;
    } catch {
      return undefined; // unparseable config — third state
    }
  }
  return undefined; // no config at all — third state
}
