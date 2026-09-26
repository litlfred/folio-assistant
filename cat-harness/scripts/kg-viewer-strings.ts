/**
 * The knowledge-graph viewer's own words — the table the page is built from.
 *
 * Bean `xcyh`: "the KG viewer must be translated". The obvious route is to run
 * the extractor over the page the generator emits, and it is the wrong one.
 * `scripts/kg-viewer.ts` WRITES that page, so every regeneration would rewrite
 * every `msgid` reference in the `.pot`, churning entries that did not change
 * and invalidating a sign-off that was still valid. **A generated artefact is
 * not a translation source. Its generator is.**
 *
 * So the strings live here, in the source, as a declared table — and the
 * extractor reads THIS. `scripts/translate-kg-viewer.ts --extract` turns it
 * into `translations/<locale>/kg-viewer.pot` through the same `formatPot` the
 * markdown and BPMN extractors use, and the generator reads each locale's
 * `.po` back through the same `parsePo`. One pipeline, one file format, one
 * place a string is written down.
 *
 * ## The msgid is the English text, not a key
 *
 * That is the gettext convention this repository already follows everywhere
 * else: `extractMarkdown` emits the prose itself as the `msgid`, and a `.po`
 * for a page is readable without the page beside it. A key (`viewer.empty.3`)
 * would make the catalogue opaque to the translator and would let the English
 * drift from the `msgid` silently — the English IS the `msgid`, so it cannot.
 *
 * ## What is here and what is deliberately not
 *
 * **Here: the chrome** — every word the viewer itself says. **Not here: the
 * graph.** Node titles, descriptions and property names come from the corpus
 * this instance publishes; they arrive in the JSON-LD document in whatever
 * language the corpus is written in, and no catalogue can reach them. The page
 * SAYS so, in the reader's language, rather than presenting a translated frame
 * around English content as though the whole thing had been translated.
 *
 * @module scripts/kg-viewer-strings
 */
// The `folio` graph kind is registered by CORE. This module is a LIBRARY, so it
// does NOT import that registration: a library's edge is inherited by every
// module that imports it, and the harness may not depend on core. The
// COMMAND that runs carries it — and since #840 every caller does, because
// the trigger sits at the foot of `cat-harness.ts` and a reader lives in that
// module, so loading it is a precondition of calling one.
//
// THIS COMMENT NAMED `check:composition-roots` AS THE GUARANTEE UNTIL
// 2026-09-22, in SEVEN files, AND THAT SCRIPT DOES NOT EXIST. `bun run
// check:composition-roots` exits "Script not found". The safety argument for
// a library omitting the registration rested on a gate nobody built, and no
// gate failed to say so — the same silence this repository keeps paying for.
// It is moot now rather than fixed: #840 made the registration automatic, so
// there is no longer a command that can forget it (bean `z9ax`).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { parsePo } from "../content/pipeline/po-inject.js";
import type { PotEntry } from "../content/pipeline/pot-extract.js";
/**
 * The declared `translation-sources` graph — where a translator's `.pot` and
 * `.po` live. Falls back to the convention because extraction CREATES the
 * tree for a locale that has none yet.
 *
 * declared-path-literal: the convention fallback, stated at the call site
 * rather than inside `directoriesForGraph` so the choice is visible.
 */
function translationsRoot(repoRoot: string): string {
  return directoryForGraph(repoRoot, "translation-sources") ?? join(repoRoot, "translations");
}

import { directoryForGraph } from "../schemas/cat-harness.js";

/** This file's own path, for the POT's `#:` source references. */
export const STRINGS_SOURCE = "scripts/kg-viewer-strings.ts";

/** One translatable string the viewer says. */
export interface UiString {
  /** The English text. This is also the gettext `msgid`. */
  readonly en: string;
  /**
   * What a translator needs to know: where it appears, and what each
   * `{placeholder}` will be replaced with. It becomes a `#.` comment in the
   * POT, which is the only context a translator working in Weblate gets.
   */
  readonly comment: string;
}

/**
 * Every word the viewer says, in source order through the page.
 *
 * **A `{placeholder}` is substituted at runtime and must survive translation.**
 * `--check` reports a translation that drops one, because a dropped
 * placeholder is a sentence that silently loses its number.
 */
export const UI_STRINGS: readonly UiString[] = [
  // ── Page chrome ───────────────────────────────────────────────
  {
    en: "{stub} — knowledge graph",
    comment: "Page title and heading. {stub} is the repository's own name and is never translated.",
  },
  {
    en: "Skip to results",
    comment: "Skip link, the first thing a keyboard user reaches. Jumps past the filter column to the node list.",
  },
  {
    en: "(preview)",
    comment: "Appended to the heading when the graph document is a staged preview rather than the published one.",
  },
  {
    en: "Kind",
    comment: "Heading of the filter column. The kinds are node types (Tool, ProcessNode, …) and come from the graph, so they are not translated.",
  },
  {
    en: "Subgraph",
    comment:
      "Heading of the SECOND filter column, added 2026-09-20. The values are declared-directory ids " +
      "from the instance's own declaration (cat-harness, bootstrap, schemas, …) and come from the " +
      "graph, so like the kinds they are NOT translated — a reader types them into a query, and a " +
      "translated id resolves to nothing.",
  },
  {
    en: "All",
    comment: "The filter that selects every node, shown above the individual kinds.",
  },
  {
    en: "Nodes",
    comment: "Heading of the result list.",
  },
  {
    en: "Search nodes by name, id or description",
    comment: "The search field's label. Visually hidden, read by a screen reader, and it must say the same thing as the placeholder.",
  },
  {
    en: "search name, id, title…",
    comment: "Placeholder text inside the search field.",
  },
  {
    en: "Selected node",
    comment: "Accessible name of the detail panel on the right.",
  },
  {
    en: "Select a node.",
    comment: "The detail panel before anything is selected.",
  },
  {
    en: "Interface language",
    comment: "Accessible name of the language switcher — the group of buttons, not one of them. The buttons themselves carry each language's own name and are not translated.",
  },
  {
    en: "Interface language: {language}",
    comment: "Announced to a screen reader after the language changes. {language} is the new language's name in its own language.",
  },

  // ── Provenance line under the heading ─────────────────────────
  {
    en: "loading {doc}…",
    comment: "Shown under the heading while the graph document is being fetched. {doc} is a filename.",
  },
  {
    en: "{n} nodes",
    comment: "Node count under the heading. {n} is a number, and is 1 or more.",
  },
  {
    en: "commit {sha}",
    comment: "The commit the graph was generated from. {sha} is an abbreviated hexadecimal commit id.",
  },
  {
    en: "tree dirty",
    comment: "Warns that the working tree had uncommitted changes when the graph was generated, so the commit id does not reproduce it.",
  },
  {
    en: "JSON-LD",
    comment: "Link text for the graph document itself. A format name — leave it as-is unless the language writes it differently.",
  },
  {
    en: "Download this graph as JSON-LD ({doc})",
    comment: "Accessible name of that link. The visible text is only the format, so the name has to say what it gets you and from where. {doc} is a filename.",
  },
  {
    en: "source commit",
    comment: "Link text to the commit the graph was generated from, on the forge.",
  },
  {
    en: "could not load {doc} — {error}",
    comment: "Replaces the provenance line when the graph document could not be fetched. {doc} is a filename, {error} the browser's own message.",
  },
  {
    en: "The graph could not be read, so nothing is shown. This is not an empty graph.",
    comment: "Shown in the detail panel when the fetch failed. The second sentence matters: an empty index and a failed fetch look identical on screen and mean opposite things.",
  },

  // ── The list ──────────────────────────────────────────────────
  {
    en: "1 node matches",
    comment: "Announced when the search or filter leaves exactly one node.",
  },
  {
    en: "{n} nodes match",
    comment: "Announced when the search or filter changes the list. {n} is 0 or 2 and above.",
  },
  {
    en: "No node matches.",
    comment: "Shown in place of the list when nothing matches.",
  },
  {
    en: "… and {n} more; narrow the search.",
    comment: "Last row of the list when there are more results than are drawn. {n} is a number.",
  },

  // ── The detail panel ──────────────────────────────────────────
  {
    en: "No such node.",
    comment: "Shown when a followed link names a node the document does not contain.",
  },
  {
    en: "{n} of this node's properties are not in the @context",
    comment: "First half of the warning above a node's properties, shown in bold. @context is a JSON-LD keyword and is never translated. {n} is a number.",
  },
  {
    en: "so a JSON-LD processor drops them. They are shown below, marked. Across the graph: {n} such property names.",
    comment: "Second half of that warning, following a comma. {n} is a number — the count across the whole graph, not this node.",
  },
  {
    en: "so a JSON-LD processor drops them. They are shown below, marked.",
    comment:
      "The same second half, for a document that does not report a graph-wide count. " +
      "Since bean `2634` the export publishes its QA findings to `test/results/` " +
      "rather than into the graph, so most documents no longer carry one — and an " +
      "absent count must not be rendered as zero, which would claim a clean bill of " +
      "health the document never gave. Keep the two variants consistent: this is the " +
      "other one minus its final sentence.",
  },
  {
    en: "type",
    comment: "Row label for the node's type. The other row labels are property names from the graph's own vocabulary and are not translated — see the note about the graph's language.",
  },
  {
    en: "← referenced by",
    comment: "Row label listing the nodes that point AT this one. Flip the arrow if the language reads right to left.",
  },
  {
    en: "none",
    comment: "Shown for a property that is present but holds an empty list — as opposed to one that is absent, which is not shown at all.",
  },
  {
    en: "No links to or from this node.",
    comment: "Shown in place of the neighbourhood diagram for an isolated node.",
  },
  {
    en: "One-hop neighbourhood, 1 linked node",
    comment: "Accessible name of the diagram under a node's properties when it has exactly one neighbour.",
  },
  {
    en: "One-hop neighbourhood, {n} linked nodes",
    comment: "Accessible name of that diagram. {n} is the number of neighbours drawn, 0 or 2 and above.",
  },
  {
    en: "Links to {name} via {via}",
    comment: "Accessible name of one neighbour in the diagram. {name} is a node's name from the graph and {via} the property that links to it — both stay in the graph's language.",
  },
  {
    en: "Referenced by {name} via {via}",
    comment:
      "As above, for a neighbour that points AT the selected node rather than away " +
      "from it. {name} is that node's name and {via} the property it points along; both " +
      "stay in the graph's language.",
  },

  // ── Where the translation stops ───────────────────────────────
  {
    en: "The interface is shown in {language}. The graph itself — node names, descriptions and property names — comes from this repository and is shown as written, in English.",
    comment: "Shown under the heading whenever a language other than English is chosen. It states the boundary: a reader must not have to infer from a half-translated screen where the translation stops.",
  },
  {
    en: "This interface translation was produced by an agent and has not been reviewed by a person.",
    comment: "Shown with the note above when the chosen language's catalogue is not signed off. Dropped once a reviewer signs it off.",
  },
] as const;

// ── Locale metadata (data ABOUT languages, not translatable) ─────

/**
 * Each language's name **in its own language**, which is what a switcher
 * should show: a reader looking for Chinese is looking for 中文, not for
 * whatever the current interface language calls it. Nothing here is a
 * `msgid` — translating these would be translating the exits.
 */
export const LOCALE_NAMES: Readonly<Record<string, string>> = {
  ar: "العربية",
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
  ru: "Русский",
  zh: "中文",
};

/** Languages written right to left, by base subtag. */
const RTL_LOCALES = new Set(["ar", "fa", "he", "ur"]);

/** The writing direction of a locale, for the document's `dir` attribute. */
export function localeDir(locale: string): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale.split("-")[0]) ? "rtl" : "ltr";
}

/** A language's own name, falling back to its tag when we do not know it. */
export function localeName(locale: string): string {
  return LOCALE_NAMES[locale] ?? LOCALE_NAMES[locale.split("-")[0]] ?? locale;
}

// ── POT entries ─────────────────────────────────────────────────

/**
 * The table as POT entries, with real line numbers.
 *
 * The line is looked up in this file rather than counted by hand, so a
 * reordering does not silently leave every `#:` reference pointing at the
 * wrong string. A string that cannot be found reports line 1 rather than
 * guessing — the reference is a convenience, and a wrong one is worse than a
 * blunt one.
 */
export function potEntries(fileText?: string): PotEntry[] {
  const text = fileText ?? readFileSync(new URL(import.meta.url), "utf-8");
  const lines = text.split("\n");
  return UI_STRINGS.map((s) => {
    const needle = JSON.stringify(s.en).slice(1, -1);
    const idx = lines.findIndex((l) => l.includes(needle));
    return {
      kind: "ui-string" as const,
      source: STRINGS_SOURCE,
      line: idx === -1 ? 1 : idx + 1,
      msgid: s.en,
      comment: s.comment,
    };
  });
}

// ── Catalogues, read back from the .po files ────────────────────

/** One locale's catalogue, as the generator embeds it in the page. */
export interface LocaleCatalogue {
  /** BCP 47 tag, as the directory under `translations/` names it. */
  locale: string;
  /** The language's own name — what the switcher shows. */
  name: string;
  /** Writing direction, for the document's `dir` attribute. */
  dir: "ltr" | "rtl";
  /**
   * Whether a person has signed this catalogue off.
   *
   * Declared by the `.po` itself, in an `X-Folio-Official: yes` header, so the
   * file answers for its own status rather than a second store answering for
   * it. Absent means unofficial, which is the ordinary state of a machine
   * translation and is shown to the reader as such.
   */
  official: boolean;
  /** How many of the table's strings this catalogue translates. */
  translated: number;
  /** msgid → msgstr, for the strings it does translate. */
  strings: Record<string, string>;
}

/** Read one header field out of a PO file's header block. */
export function poHeader(poText: string, field: string): string | undefined {
  const re = new RegExp('^\\s*"' + field + ':\\s*(.*?)\\\\n"\\s*$', "im");
  const m = poText.match(re);
  return m ? m[1].trim() : undefined;
}

/**
 * Load every locale that has a `translations/<locale>/kg-viewer.po`.
 *
 * A locale with no `.po` is simply absent — not an error, and not an empty
 * catalogue either. "Not translated yet" is the ordinary state of nearly every
 * language, and the switcher offers only what the page can actually show.
 */
export function loadCatalogues(root: string): LocaleCatalogue[] {
  const dir = translationsRoot(root);
  if (!existsSync(dir)) return [];
  const out: LocaleCatalogue[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const po = join(dir, entry.name, "kg-viewer.po");
    if (!existsSync(po)) continue;
    const text = readFileSync(po, "utf-8");
    const parsed = parsePo(text);
    const strings: Record<string, string> = {};
    let translated = 0;
    for (const s of UI_STRINGS) {
      const msgstr = parsed.get(s.en);
      if (msgstr !== undefined && msgstr !== "") {
        strings[s.en] = msgstr;
        translated++;
      }
    }
    if (translated === 0) continue;
    out.push({
      locale: entry.name,
      name: localeName(entry.name),
      dir: localeDir(entry.name),
      official: (poHeader(text, "X-Folio-Official") ?? "").toLowerCase() === "yes",
      translated,
      strings,
    });
  }
  return out.sort((a, b) => a.locale.localeCompare(b.locale));
}
