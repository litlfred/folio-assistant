/**
 * Voice registry — named editorial profiles that layer on top of the
 * base one-voice scholarly standard.
 *
 * A **voice** is a named set of editorial rules that an agent applies
 * when authoring or reviewing content. Voices are overlayable: a folio
 * can activate multiple voices (e.g. `who-editorial` + `who-guideline-development`),
 * and the union of their rules applies. The base scholarly standard
 * (`one-voice-style-guide.md`) is always active; voices refine it,
 * they do not replace it.
 *
 * Voices are NOT adapters and NOT profiles. An adapter partitions block
 * kinds; a profile partitions what a folio can contain. A voice
 * partitions *how prose reads* — spelling, terminology, register,
 * citation style, person, structural conventions. Two folios with the
 * same adapter and profile can have different voices (a WHO guideline
 * and a ministry-of-health policy document are both `document` profile
 * but speak differently).
 *
 * ## Activation
 *
 * `folio.config.json` carries `"voices": ["who-editorial", ...]`.
 * When no voices are listed, the base scholarly standard is the only
 * voice. The platform's own documentation carries no voice.
 *
 * ## The three WHO voices (issue #208)
 *
 * | voice id | source document | scope |
 * |----------|----------------|-------|
 * | `who-editorial` | WHO Editorial Style Guide | Spelling, punctuation, terminology, citation style |
 * | `who-guideline-development` | WHO Handbook for Guideline Development (2nd ed.) | GRADE methodology, recommendation structure, evidence quality |
 * | `who-publication-design` | WPRO Publication and Information Products Style Guide | Visual design, layout, branding, accessibility |
 *
 * @module schemas/voices
 */

/**
 * A single editorial rule within a voice. Rules are the atomic unit
 * of voice enforcement — each rule has a category, a description of
 * what it requires, and optionally grep patterns for automated checking.
 */
export interface VoiceRule {
  /** Stable identifier, e.g. `who-ed-british-spelling`. */
  id: string;
  /** Human-readable short name. */
  name: string;
  /** Which aspect of prose this rule governs. */
  category: 'spelling' | 'punctuation' | 'terminology' | 'citation' | 'person'
    | 'register' | 'structure' | 'formatting' | 'accessibility' | 'methodology';
  /** What the rule requires — shown to authors and reviewers. */
  description: string;
  /**
   * Optional grep patterns for automated detection of violations.
   * Each pattern is a regex string; the checker runs case-insensitive
   * unless `caseSensitive` is set.
   */
  patterns?: Array<{
    regex: string;
    caseSensitive?: boolean;
    /** What a match means — shown as evidence. */
    message: string;
  }>;
  /** Severity when violated. */
  severity: 'critical' | 'major' | 'minor';
  /**
   * Optional list of correct/incorrect pairs for terminology rules.
   * The checker flags the `incorrect` form and suggests the `correct` one.
   */
  terminology?: Array<{
    correct: string;
    incorrect: string | string[];
    context?: string;
  }>;
}

/**
 * A named editorial voice profile.
 */
export interface VoiceProfile {
  /** Stable identifier, e.g. `who-editorial`. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** One-paragraph description of what this voice is and where it comes from. */
  description: string;
  /** Source document(s) this voice is derived from. */
  sources: Array<{
    title: string;
    url?: string;
    /** Identifier in library/ if ingested. */
    libraryId?: string;
  }>;
  /**
   * The rules this voice adds on top of the base scholarly standard.
   * Rules from multiple active voices are unioned; conflicts are
   * resolved by the most-specific rule (voice-level beats base).
   */
  rules: VoiceRule[];
  /**
   * Content block kinds this voice applies to. Empty means all kinds.
   * A voice scoped to `['prose', 'definition']` does not audit `theorem` blocks.
   */
  appliesTo?: string[];
  /**
   * QA criterion IDs this voice contributes. Registered in the
   * criteria registry under the `voice` domain with a `voice:` prefix.
   */
  criteria?: string[];
}

/**
 * Voice configuration in `folio.config.json`.
 */
export interface VoiceConfig {
  /**
   * Active voice IDs. The base scholarly standard is always active;
   * these layer on top. Order does not matter — rules are unioned.
   */
  voices?: string[];
}

/**
 * All registered voices. The platform ships with these; a folio can
 * also define custom voices under `voices/` in its own repo.
 */
export const VOICE_REGISTRY: VoiceProfile[] = [];
// Populated by loadVoices() at startup from voices/*.json
