/**
 * Has a published translation drifted from the page it translates?
 *
 * Bean `07p7`. Two catalogue families here already have a writer and a reader:
 * `workflows/*.pot` (`translate-bpmn:check`) and `kg-viewer.*`
 * (`translate-kg-viewer:check`). The **docs pages** had a writer and nothing
 * that read it back — five published translations of `agent-onboarding.md`,
 * catalogues for three of the five locales, a template for one.
 *
 * ## What this gates, and the measurement that decided it
 *
 * A first pass at this bean reported all five pages as five headings diverged
 * from their source. That was **wrong, and wrong in an instructive way**: the
 * count came from `grep -c '^#'`, which counted five `#` COMMENT lines inside
 * each page's YAML front matter as headings. Strip the front matter and every
 * translation matches its source exactly — 11 headings, same levels, same
 * numbering, in all five locales.
 *
 * So {@link headingsOf} strips front matter before it counts anything, and the
 * property under test is the one that survived the correction: a reader is
 * harmed when a translated page's STRUCTURE stops matching its source, because
 * that is a section they cannot reach in their language. It is also the only
 * comparison that is language-independent — text cannot be diffed across a
 * translation, but section levels and ordinals can.
 *
 * ## Why catalogue coverage gates too, against a recorded list
 *
 * `es` and `zh` publish a translation with no `.po` at all, so there is
 * nothing tying either to its source even in principle. Making that a passing
 * note would be the vacuity this repository keeps paying for; making it a bare
 * failure would force somebody to fabricate a catalogue to get green. So the
 * two are RECORDED, dated and reasoned, and everything else gates: a new
 * translation published without a catalogue fails on the commit that adds it.
 * Same shape as `SCRIPT_EXEMPTIONS` in `scripts/gates.ts`, for the same
 * reason — an exemption nobody can review is one somebody added to get green.
 *
 * @module content/pipeline/translation-drift
 * @covers translation-sources
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { directoryForGraph } from "../../schemas/cat-harness.ts";
import { buildTranslationIndex, siteRoot } from "./translation-index.ts";
import { sourceForPermalink } from "../../scripts/lib/jekyll-permalink.ts";

/** One heading, reduced to what can be compared ACROSS a translation. */
export interface Heading {
  /** `#` count — 1 for the title, 2 for a section. */
  level: number;
  /** The leading `N.` if the heading is numbered, else `""`. Not the words. */
  ordinal: string;
}

/**
 * Every heading in a page, front matter removed FIRST.
 *
 * The strip is the whole correctness of this function. A `#` inside YAML front
 * matter is a comment, and counting those as headings reported five faithful
 * translations as five headings adrift — the measurement that nearly shipped
 * as this bean's headline.
 */
export function headingsOf(text: string): Heading[] {
  let body = text;
  if (body.startsWith("---")) {
    const end = body.indexOf("\n---", 3);
    if (end !== -1) body = body.slice(end + 4);
  }
  const out: Heading[] = [];
  for (const line of body.split("\n")) {
    const m = /^(#{1,6}) (.*)$/.exec(line);
    if (!m) continue;
    const num = /^(\d+)\./.exec(m[2].trim());
    out.push({ level: m[1].length, ordinal: num ? num[1] : "" });
  }
  return out;
}

/**
 * A heading list reduced to one comparable string, e.g. `1,2#1,2#2,3`.
 *
 * Level and ordinal, in order. Enough to pin a backlog entry to the exact
 * divergence it was reviewed against, and never the words — which cannot be
 * compared across a translation.
 */
export function shapeOf(headings: readonly Heading[]): string {
  return headings.map((h) => `${h.level}${h.ordinal ? `#${h.ordinal}` : ""}`).join(",");
}

/**
 * Can a source page be compared against a translation at all?
 *
 * A source with no headings gives a comparison nothing can fail: every
 * translation "matches" it. That is an `unreadable`, not agreement — the
 * three-state rule `translation-index.ts` already follows.
 */
export function comparableSource(headings: readonly Heading[]): boolean {
  return headings.length > 0;
}

/** True when two heading lists have the same shape. Never compares words. */
export function sameStructure(a: readonly Heading[], b: readonly Heading[]): boolean {
  return (
    a.length === b.length &&
    a.every((h, i) => h.level === b[i].level && h.ordinal === b[i].ordinal)
  );
}

/** A translation published without a catalogue, recorded rather than passed over. */
export interface UncatalogedTranslation {
  /** Locale and the source page's basename, e.g. `es/agent-onboarding`. */
  translation: string;
  /** When it was recorded, so an entry cannot quietly become permanent. */
  since: string;
  reason: string;
}

/**
 * Translations published with no catalogue, as of the date on each entry.
 *
 * These are a BACKLOG, not a policy. Anything not listed here must have a
 * `.po`, so the gate fails on the commit that publishes a new translation
 * without one.
 */
export const UNCATALOGED: UncatalogedTranslation[] = [
  {
    translation: "es/guides/agent-onboarding",
    since: "2026-09-20",
    reason:
      "published with no `.po`; the page's structure matches its source, so it is current but untracked. A catalogue cannot be derived from a finished translation without inventing the segmentation",
  },
  {
    translation: "zh/guides/agent-onboarding",
    since: "2026-09-20",
    reason: "same as `es/agent-onboarding` — published, structurally current, no catalogue",
  },
  // The six below are what `derive-po.ts` REFUSES, recorded on the owner's
  // decision of 2026-09-26 after the page-discovery fix took this gate from 36
  // findings to 6. Each is a real finding about the translation, not a tool
  // limit, and each names WHAT differs rather than saying "drifted" — a reason
  // that does not say what is wrong cannot tell the next reader whether it has
  // been fixed.
  //
  // None is an agent's to clear: issue #206 reserves translation adjudication
  // to a human, so re-translating any of these to make a catalogue derivable
  // would manufacture exactly the sign-off that issue protects.
  {
    translation: "ar/architecture",
    since: "2026-09-26",
    reason:
      "`count-differs` — the source has 60 translatable constructs and the translation has 61, so the translation carries something the source does not. `alignGrownSource` is sound only for constructs ADDED TO THE SOURCE; pairing a remainder the source lacks would invent an alignment rather than read one",
  },
  {
    translation: "ar/skills",
    since: "2026-09-26",
    reason:
      "`count-differs` — source 146 constructs, translation 147. Same shape as `ar/architecture`: longer than its source by one, so no positional alignment is sound",
  },
  {
    translation: "zh/getting-started",
    since: "2026-09-26",
    reason:
      "`count-differs` — source 149 constructs, translation 145. Diagnosed on bean `7x8o`: 20 table cells are dropped by `isTranslatable`, of which `是` and `否` are real words dropped for being one character. That is bean `6b8u`'s own incompleteness, and the obvious CJK-aware rule is measured and deliberately NOT shipped — it takes this pair from short-by-4 to long-by-1",
  },
  {
    translation: "ar/publication-workflow",
    since: "2026-09-26",
    reason:
      '`msgid-conflict` — the source string "Editor / author" occurs more than once and is translated two different ways ("المحرر / المؤلف", and left untranslated at construct 298). A msgid-keyed `.po` cannot represent both, so this needs `msgctxt` rather than a derivation',
  },
  {
    translation: "zh/publication-workflow",
    since: "2026-09-26",
    reason:
      '`msgid-conflict` — "Editor / author" is translated "编辑 / 作者" and "Editor / author（编辑 / 作者）" at construct 298. Needs `msgctxt`; a msgid-keyed `.po` cannot hold both',
  },
  {
    translation: "zh/skills",
    since: "2026-09-26",
    reason:
      '`msgid-conflict` — "Skills" occurs more than once and is translated "技能" and "技能数" at construct 89. This is the guard added after bean `f6r1` found the same case masked by `count-differs`, now firing on genuinely new data. Needs `msgctxt`',
  },
];

/** A translation known to have drifted, recorded rather than passed over. */
export interface KnownDrift {
  /** `locale/page`. */
  translation: string;
  since: string;
  /** WHAT is missing or extra — never just "drifted". */
  reason: string;
  /** {@link shapeOf} the SOURCE when this was recorded. */
  sourceShape: string;
  /** {@link shapeOf} the TRANSLATION when this was recorded. */
  translationShape: string;
}

/**
 * Drift this gate knows about, as of the date on each entry.
 *
 * A BACKLOG, not a policy, and each entry names the specific divergence so a
 * translator can act on it without re-deriving anything. Anything not listed
 * fails on the commit that introduces it.
 *
 * **An entry pins the divergence it was recorded against, not the page.** The
 * first version exempted the whole page, so a backlogged translation could
 * drift FURTHER and the gate would stay silent — found by mutation, by
 * re-levelling a heading in `docs/fr/index.md` and watching the suite pass.
 * A blanket exemption is a second way to go quiet, which is the failure this
 * bean is an instance of.
 *
 * Counts were not enough either, and the same mutation proved it twice: the
 * second attempt pinned each entry to `6 -> 5` headings, and RE-LEVELLING a
 * heading keeps both counts identical, so it passed again. An entry therefore
 * records the full {@link shapeOf} both sides, and anything but that exact
 * shape is new drift.
 *
 * **These are reader-visible.** Each of these five pages is missing a section
 * the English landing page shows — a section a reader in that language cannot
 * reach. They are recorded rather than fixed because a faithful translation is
 * a translator's job, and this file's own history is the argument for not
 * guessing: the first measurement in this bean was wrong, and a wrong
 * translation is far harder to notice than a wrong count.
 */
/*
 * EMPTY as of 2026-09-23, and that is the goal state, not a lapse. It held five
 * entries (`ar|es|fr|ru|zh/index`, since 2026-09-20): the English landing page
 * gained "Four things, in order" and no translation followed. The owner chose
 * "translate now" on bean `alox`, the section went into all five, and the
 * entries came out in the same commit — the "every KNOWN_DRIFT entry still
 * describes drift that EXISTS" test requires exactly that.
 */
export const KNOWN_DRIFT: KnownDrift[] = [];

export type Severity = "error" | "unreadable";

export interface DriftFinding {
  severity: Severity;
  /** `locale/page`, the key a reader can act on. */
  subject: string;
  message: string;
}

export interface DriftResult {
  findings: DriftFinding[];
  /** How many translations were actually compared. Zero is never a pass. */
  compared: number;
}

/**
 * The catalogue a translation would be tracked by, if it has one.
 *
 * Resolved from the `translation-sources` DECLARATION, not from the
 * convention. `harness.json` is the list, and hardcoding the path is how a
 * consumer comes to scan a directory that is not there — this repository has
 * already relocated its whole instance under `cat-harness/` once. Caught here
 * by `check:declared-paths`, which reported the literal on the commit that
 * introduced it.
 */
export function catalogueFor(instanceRoot: string, locale: string, page: string): string {
  // declared-path-literal: the convention fallback, at the call site so the
  // choice is visible — same shape as `po-resolve.ts` and `translate-bpmn.ts`.
  const dir = directoryForGraph(instanceRoot, "translation-sources") ?? join(instanceRoot, "translations");
  return join(dir, locale, `${page}.po`);
}

/**
 * Site-absolute URL -> the file that serves it.
 *
 * **Exported for `check-translation-catalogue.ts`, and it must stay one
 * answer.** That gate maps a CHANGED FILE back to the translation it publishes,
 * which is this function's inverse over the index — so if it composed the path
 * itself, a gate about missing catalogues could disagree with the gate about
 * drift on which file is which page, and the two would be right about different
 * corpora.
 */
export function fileForUrl(site: string, url: string): string {
  // The INVERSE of Jekyll's permalink rule, not of a path shape: since bean
  // `kc7k` the docs-folder pages publish under `/docs/cat-harness/`, so
  // `/docs/cat-harness/x.html` is served from `x.md`. Falls back to the
  // shape when no page maps there, so a missing file is still reported as
  // missing at the path a reader would look for.
  const found = sourceForPermalink(site, url);
  if (found !== undefined) return join(site, found);
  const rel = url.replace(/^\//, "").replace(/\.html$/, ".md");
  return join(site, rel === "" || rel.endsWith("/") ? `${rel}index.md` : rel);
}

/**
 * Compare every published translation against the page it translates.
 *
 * **Never empty-by-accident.** A page whose file cannot be read is reported
 * `unreadable` rather than skipped, and {@link DriftResult.compared} is
 * asserted non-zero by the gate: a comparison over nothing exits clean and
 * reads as coverage, which is the defect this whole bean is an instance of.
 */
export function driftFor(
  instanceRoot: string,
  opts: { ignoreKnownDrift?: boolean } = {},
): DriftResult {
  const site = siteRoot(instanceRoot);
  const findings: DriftFinding[] = [];
  if (!site) {
    return {
      findings: [{ severity: "unreadable", subject: "(site)", message: "no site root — nothing could be compared" }],
      compared: 0,
    };
  }
  const recorded = new Set(UNCATALOGED.map((u) => u.translation));
  // `ignoreKnownDrift` exists for ONE caller: the test that re-derives every
  // backlog entry. A page that has since been fixed must not keep its entry —
  // that is how a backlog turns into a set of claims about a corpus that has
  // moved on, which is the defect `ot9a` was.
  // Keyed by the SHAPE, not the page: `fr/index 6->5` suppresses exactly the
  // divergence that was reviewed, and nothing else on that page.
  const knownDrift = new Set(
    opts.ignoreKnownDrift
      ? []
      : KNOWN_DRIFT.map((k) => `${k.translation} ${k.sourceShape}->${k.translationShape}`),
  );
  const { index } = buildTranslationIndex(instanceRoot);
  let compared = 0;

  for (const page of Object.values(index.pages)) {
    const srcFile = fileForUrl(site, page.sourceUrl);
    if (!existsSync(srcFile)) {
      findings.push({
        severity: "unreadable",
        subject: page.sourceUrl,
        message: `the source page is indexed but its file is missing (${srcFile})`,
      });
      continue;
    }
    const src = headingsOf(readFileSync(srcFile, "utf-8"));
    // A source with no headings gives a comparison nothing can fail — every
    // translation would "match". Reported, never counted as agreement.
    if (!comparableSource(src)) {
      findings.push({
        severity: "unreadable",
        subject: page.sourceUrl,
        message: "the source page has no headings, so no translation of it can be compared",
      });
      continue;
    }

    for (const [locale, t] of Object.entries(page.translations)) {
      const file = fileForUrl(site, t.url);
      // The page NAME is its SOURCE path, which keys its catalogue — not its
      // published URL, which since bean `kc7k` carries `docs/cat-harness/`.
      const name = relative(site, srcFile).replace(/\.md$/i, "").split(sep).join("/").replace(/(^|\/)index$/, "") || "index";
      // The FULL page path, not its basename. Flattening here made
      // `guides/agent-onboarding` indistinguishable from a hypothetical
      // top-level `agent-onboarding`, and it made this gate look for a catalogue
      // at a path `catalogueFor` would never write — the two disagreed about
      // which file is which page for any page below the site root.
      //
      // The owner's decision of 2026-09-27 (bean `9rnf`): catalogue paths MIRROR
      // the page path. Measured as the reason rather than tidiness — 65 of 585
      // source pages here share a basename, and three of the colliders are
      // translated today (`getting-started` with `processes/getting-started` and
      // `reference/skill-instructions/getting-started`, `document-ingestion` with
      // `processes/document-ingestion`, and `index` twenty-two ways). Under
      // flattening, translating `processes/getting-started` would address the same
      // `.po` as the root page's, and `write` would either skip it silently or,
      // with `--overwrite`, replace a catalogue that may carry a human's sign-off.
      // That is the loss issue #206 exists to prevent.
      const subject = `${locale}/${name}`;
      if (!existsSync(file)) {
        findings.push({
          severity: "unreadable",
          subject,
          message: `indexed as a translation but its file is missing (${file})`,
        });
        continue;
      }
      const got = headingsOf(readFileSync(file, "utf-8"));
      compared++;
      const shape = `${subject} ${shapeOf(src)}->${shapeOf(got)}`;
      if (!sameStructure(src, got) && !knownDrift.has(shape)) {
        findings.push({
          severity: "error",
          subject,
          message:
            `structure has drifted from ${page.sourceUrl}: ` +
            `${src.length} heading(s) in the source, ${got.length} here` +
            (src.length === got.length ? " — same count, different levels or numbering" : ""),
        });
      }
      if (!existsSync(catalogueFor(instanceRoot, locale, name)) && !recorded.has(subject)) {
        findings.push({
          severity: "error",
          subject,
          message:
            "published with no `.po` catalogue and not in UNCATALOGED — " +
            "add the catalogue, or record it there with a reason and a date",
        });
      }
    }
  }
  return { findings, compared };
}

/** Thrown when nothing was compared — never reported as agreement. */
export class NothingCompared extends Error {
  constructor() {
    super(
      "no translation was compared against its source. That is not agreement, " +
        "it is a broken reader — the index found no translated page, or none " +
        "of their files could be read. A comparison over nothing passes.",
    );
    this.name = "NothingCompared";
  }
}

function run(): number {
  const root = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
  const { findings, compared } = driftFor(root);

  if (compared === 0 && !findings.some((f) => f.severity === "unreadable")) {
    console.error(`✗ ${new NothingCompared().message}`);
    return 2;
  }

  for (const f of findings) {
    console.log(`${f.severity === "error" ? "✗" : "?"} ${f.subject.padEnd(28)} ${f.message}`);
  }
  // Printed on every run, never folded into a count. A backlog nobody sees is
  // a backlog that becomes permanent.
  for (const k of KNOWN_DRIFT) {
    console.log(`  drifted   ${k.translation.padEnd(26)} since ${k.since} — ${k.reason}`);
  }
  for (const u of UNCATALOGED) {
    console.log(`  no .po    ${u.translation.padEnd(26)} since ${u.since} — ${u.reason}`);
  }

  const errors = findings.filter((f) => f.severity === "error").length;
  const unreadable = findings.filter((f) => f.severity === "unreadable").length;
  console.log();
  console.log(
    `  ${compared} translation(s) compared, ${errors} NEWLY drifted, ` +
      `${unreadable} could not be read, ` +
      `${KNOWN_DRIFT.length} drifted and recorded, ${UNCATALOGED.length} uncatalogued and recorded`,
  );
  // `unreadable` outranks a clean comparison: a sweep blind on one page has
  // not cleared the others, and exits 2 so it cannot be read as a pass.
  if (unreadable) return 2;
  if (errors) return 1;
  console.log(
    "  ✓ no NEW drift — every published translation matches its source's structure,\n" +
      "    or is recorded above with exactly what is missing",
  );
  return 0;
}

if (import.meta.main) process.exit(run());
