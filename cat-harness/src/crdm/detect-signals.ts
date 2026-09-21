/**
 * The `crdm-detect` phrase signals, and the check that they still say what the
 * skill says.
 *
 * Bean `xfoh`. These lived as literals inside `scripts/eval-crdm-detect.ts`
 * under the comment *"The skill's explicit exclusions"* — a **hand
 * transcription** of a prose list in
 * `methodologies/crdm/crdm-detect.md`. It had already drifted: the skill
 * listed seven exclusions, the runner implemented five, and the runner's own
 * output reported a false alarm on an issue the skill excludes by name.
 *
 * That is the `jijc` shape — one fact written down twice, free to disagree,
 * with nothing that notices. The fix here is not a second transcription.
 *
 * ## Derive where you can, CHECK where you cannot
 *
 * The skill's exclusion bullets are not one kind of thing, and that is the
 * whole difficulty:
 *
 * | bullet | kind | mechanically usable? |
 * |---|---|---|
 * | `"Fix the typo in the overview" — content editing` | a quoted example utterance | yes — a pattern must match it |
 * | `Bug reports about existing features (unless …)` | a category of issue, judged | **no** — no phrase names it |
 *
 * A pattern list cannot be *derived* from the first kind, because the quoted
 * examples carry specifics (`chapter 3`, `chapter 5`) that a usable pattern
 * must generalise away, and generalising is a judgement. But it can be
 * **checked**: every quoted example must be matched by some pattern, and every
 * pattern must have a bullet it comes from. {@link exclusionDrift} is that
 * check, run as a test, so the transcription cannot drift again without a
 * gate going red.
 *
 * The second kind is reported as a **third state** rather than dropped. A
 * phrase matcher structurally cannot implement "bug reports about existing
 * features"; what it can do is say so. {@link parseSkillExclusions} returns
 * them under `judgementOnly`, and the runner prints the count — so a false
 * alarm on a bug report is a DECLARED limit of the mechanical lower bound
 * rather than an unexplained defect in it.
 *
 * @module folio-assistant/src/crdm/detect-signals
 */

/** One detection category from the skill, as matchable patterns. */
export interface Category {
  name: string;
  patterns: RegExp[];
}

/** The five detection categories from `crdm-detect.md`, as matchable patterns. */
export const CATEGORIES: Category[] = [
  {
    name: "direct-capability",
    patterns: [
      /\bi need a way to\b/i, /\bcan you add\b/i, /\bwe need a tool\b/i, /\bneed some tooling\b/i,
      /\bthere should be a skill\b/i, /\badd a QA check\b/i, /\bshould support\b/i,
      /\bmake the pipeline\b/i, /\bnew block kind\b/i, /\bneed a content type\b/i,
      /\bit would be great if\b/i, /\bbuild me\b/i, /\bcreate a tool\b/i, /\bdevelop a feature\b/i,
      /\bwe need to have\b/i, /\bwe (?:also )?need to\b/i,
    ],
  },
  {
    name: "workflow-gap",
    patterns: [
      /\bright now i have to\b/i, /\bthere is no way to\b/i, /\bcurrent process\b/i,
      /\bdoes ?n[o']?t handle\b/i, /\bcan[' ]?t do\b/i, /\bit'?s missing\b/i,
      /\bdoes ?n[o']?t support\b/i, /\bevery time i\b/i, /\bneed to be able to\b/i,
    ],
  },
  {
    name: "platform-change",
    patterns: [
      /\bchange the schema\b/i, /\bmodify the pipeline\b/i, /\badd a new adapter\b/i,
      /\bthe constraint should\b/i, /\bupdate the CI\b/i, /\bworkflow should fire\b/i,
      /\bMCP tool\b/i, /\bregister a new tool\b/i, /\bmigrate\b/i, /\bdeprecat/i,
      /\b(?:schemas|content\/pipeline|adapters|scripts|\.github\/workflows)\//,
    ],
  },
  {
    name: "cross-cutting",
    patterns: [
      /\bfor all papers\b/i, /\bevery folio\b/i, /\bacross all content types\b/i,
      /\bthe platform should\b/i, /\bboth document and paper\b/i, /\bwrit large\b/i,
    ],
  },
  {
    name: "review-surfaced",
    patterns: [
      /\bwould be easier if\b/i, /\btriage these comments\b/i, /\bfeedback workflow\b/i,
      /\bstakeholders need\b/i, /\breview process more\b/i, /\bfor comment review\b/i,
    ],
  },
];

/**
 * The skill's exclusions, for the bullets a phrase can carry.
 *
 * Each entry names the bullet it implements, so {@link exclusionDrift} can say
 * *which* bullet lost its pattern rather than only that the counts differ.
 * A pattern generalises its bullet's quoted example — `"Review chapter 5"`
 * becomes `review chapter`, because the example is an example.
 */
export const EXCLUSIONS: RegExp[] = [
  /\bwrite the next section\b/i,
  /\bfix the typo\b/i,
  /\brun content_validate\b/i,
  /\breview chapter\b/i,
  /\bcreate a bean\b/i,
  // The bullet the transcription dropped. Generalised away from `block kind`,
  // because the bullet's subject is the QUESTION, not the thing asked about.
  /\bwhat does\b[^?]{0,60}\bmean\b/i,
  // Narrow on purpose. The category is "a record of work already done"; the
  // only phrasing MEASURED to carry it here is the title prefix two issues in
  // this repository use. Widening it to guess at other record-shaped titles
  // would be the orphan-pattern direction {@link exclusionDrift} exists to
  // refuse — an exclusion with no prose behind it and no measurement either.
  /\bmigration record\b/i,
];

/** What the skill's "What is NOT a feature request" list actually carries. */
export interface SkillExclusions {
  /** Bullets carrying a quoted example utterance — a pattern must match each. */
  quoted: string[];
  /** Bullets naming a category no phrase can decide. Reported, never dropped. */
  judgementOnly: string[];
}

const EXCLUSION_HEADING = "## What is NOT a feature request";

/**
 * Read the exclusion bullets out of the skill, split by what they can support.
 *
 * Throws when the heading is absent: a parser that returns an empty list from
 * a renamed section is the `dh4f` defect, where the consumer scans nothing and
 * reports a clean run over it.
 */
export function parseSkillExclusions(markdown: string): SkillExclusions {
  const lines = markdown.split("\n");
  const start = lines.findIndex((l) => l.trim() === EXCLUSION_HEADING);
  if (start === -1) {
    throw new Error(
      `crdm-detect.md carries no "${EXCLUSION_HEADING}" heading — the exclusion list ` +
        `moved or was renamed, and a pattern list checked against nothing is worse than none.`,
    );
  }
  const quoted: string[] = [];
  const judgementOnly: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    if (!line.startsWith("- ")) continue;
    const m = /"([^"]+)"/.exec(line);
    if (m) quoted.push(m[1]!);
    else judgementOnly.push(line.slice(2).trim());
  }
  return { quoted, judgementOnly };
}

/** A bullet and its pattern that disagree — in either direction. */
export interface Drift {
  direction: "unmatched-bullet" | "orphan-pattern";
  subject: string;
}

/**
 * Both directions of the transcription, measured against the skill.
 *
 * `unmatched-bullet` is the drift that shipped: a quoted exclusion no pattern
 * catches, so the runner silently excludes less than the skill says.
 * `orphan-pattern` is the reverse — a pattern excluding something the skill
 * never asked to exclude, which is the more dangerous direction, because it
 * suppresses real detections with no prose to justify it.
 */
export function exclusionDrift(skill: SkillExclusions, patterns: RegExp[] = EXCLUSIONS): Drift[] {
  const drift: Drift[] = [];
  for (const q of skill.quoted) {
    if (!patterns.some((p) => p.test(q))) drift.push({ direction: "unmatched-bullet", subject: q });
  }
  for (const p of patterns) {
    if (!skill.quoted.some((q) => p.test(q))) drift.push({ direction: "orphan-pattern", subject: String(p) });
  }
  return drift;
}

/** One text's verdict under the phrase signals. */
export interface Verdict {
  fires: boolean;
  categories: string[];
  excluded: boolean;
}

export function detect(text: string): Verdict {
  const categories = CATEGORIES.filter((c) => c.patterns.some((p) => p.test(text))).map((c) => c.name);
  const excluded = EXCLUSIONS.some((p) => p.test(text));
  return { fires: categories.length > 0 && !excluded, categories, excluded };
}
