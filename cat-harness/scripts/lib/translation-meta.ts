/**
 * The docs pages' locale block, for a page Jekyll never laid out — issue #2219.
 *
 * Its own module, rather than a function in `mount-instance-docs.ts`, so the
 * e2e test can build a mounted page with the REAL emitter under node:
 * `mount-instance-docs.ts` reads `import.meta.dir`, which only bun sets.
 *
 * @module scripts/lib/translation-meta
 */
import { sourceLocale, supportedLocales } from "../../content/pipeline/translation-index.ts";

/** The id `_includes/head_custom.html` writes and `docs-ui.js` reads. */
export const TRANSLATION_META_ID = "fa-translation-meta";

/**
 * The `fa-translation-meta` block a docs page carries, for a MOUNTED page.
 *
 * A mount is finished HTML that Jekyll never lays out, so `head_custom.html`
 * never writes this block on it, and without it `docs-ui.js` draws no band
 * globe. Issue #2219: the owner asked why `/who-iris/` had no translations,
 * and chose *"USE THE SAME CHROME AS FOLIO-ASSISTANT. THIS IS ALREADY
 * DEFINED"*. So this is the include's block with the include's defaults, not
 * a new format: `lang` and `supportedLocales` come from the instance's own
 * declaration, and `availableLocales` is `[]`. That empty list is exactly what
 * the include writes for a docs page with no translations, and `docs-ui.js`
 * then shows every declared locale and greys out each one but the source.
 * A mount has no per-locale build, so `[]` is the honest value. Listing a
 * locale would link to a page that does not exist.
 */
export function translationMetaBlock(instanceDir: string): string {
  const meta = {
    lang: sourceLocale(instanceDir),
    translationStatus: "",
    translationSource: "",
    supportedLocales: supportedLocales(instanceDir),
    availableLocales: [] as string[],
  };
  return `<script type="application/json" id="${TRANSLATION_META_ID}">${JSON.stringify(meta)}</script>`;
}

/** Insert `block` before `</head>`, once. A page already carrying one keeps its own. */
export function withTranslationMeta(html: string, block: string): string {
  if (html.includes(`id="${TRANSLATION_META_ID}"`)) return html;
  const head = html.search(/<\/head>/i);
  if (head < 0) return html;
  return html.slice(0, head) + block + html.slice(head);
}
