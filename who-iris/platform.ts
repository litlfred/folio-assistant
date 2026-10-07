/**
 * The ONE file in this instance that names where the platform lives.
 *
 * who-iris is staged here ahead of becoming its own repository
 * (`litlfred/who-iris`). Every platform symbol the replica generator uses is
 * re-exported from here, so the day it leaves, re-pointing the platform is a
 * one-file edit — the reason `smart-base/platform.ts` and
 * `smart-trust/platform.ts` exist. The rule is held by
 * `cat-harness/scripts/tests/instance-separation-imports.test.ts`.
 *
 * Created 2026-10-05 for the replica's translations (issue #2228, bean
 * `lffo`). Translating the replica needs the gettext reader and writer, two
 * NEW climbs, against a who-iris ceiling that "may only fall". Rather than
 * raise it, `gen-iris-pages.ts` now routes every platform import through
 * here, which takes it from fourteen climbs to none. The tests and the theme
 * module still climbed directly; they were what the ceiling counted.
 *
 * Since 2026-10-06 (bean `g8jp`) EVERYTHING climbs here, and this file in
 * turn reaches only `folio-assistant-core` — the one instance who-iris
 * `needs`. cat-harness symbols come through core's surface,
 * `folio-assistant-core/scripts/platform.ts`, so who-iris names no layer
 * below the one it declares. Owner: *"who-iris depends on folio-asst-core"*.
 *
 * @module who-iris/platform
 */
export {
  readDeclaration,
  repoRootFor,
  siteDirFor,
  fragment as folioMountFragment,
  embed as pdfViewer,
  subjectPage,
  withRoutes,
  libraryResolver,
  withViewerNav,
  withInlineCode,
  formatPot,
  type PotEntry,
  parsePo,
  parsePoEntries,
  THEME_SCHEMA_TAG,
  ThemeSchema,
  ResolvedThemeSchema,
  explainThemeFailure,
  resolveTheme,
  themeKey,
  type ResolvedTheme,
  type Theme,
  DEFAULT_THEME_ID,
  themeById,
} from "../folio-assistant-core/scripts/platform.ts";
export { bytesFor, repoRelative } from "../folio-assistant-core/scripts/lib/bytes.js";
export { resolvableIri, type CatalogueNode } from "../folio-assistant-core/schemas/catalogue.js";
export { dcRenderingsFor } from "../folio-assistant-core/scripts/dc-render.ts";
export { publicationBlockers } from "../folio-assistant-core/schemas/materialization.js";
export { nodes as coverNodes, pngSize } from "../folio-assistant-core/scripts/gen-covers.js";
