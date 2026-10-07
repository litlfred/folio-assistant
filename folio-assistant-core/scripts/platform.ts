/**
 * folio-assistant-core's SURFACE for the instances that `needs` it: every
 * platform symbol such an instance uses, re-exported from the one module it
 * may reach.
 *
 * An instance of core declares `"needs": ["folio-assistant-core"]` and never
 * names cat-harness — owner, 2026-10-06 (bean `g8jp`): an instance of core
 * depends on core, never on the layers below it. So those are reached TRANSITIVELY,
 * through here: the instance's own `platform.ts` imports this file and
 * nothing else outside its directory, and core decides which of its
 * dependencies' symbols it carries. When such an instance leaves for its own
 * repository it remote-mounts core and core's dependency closure; a
 * re-export here resolves through core's mounted `scripts/` like any other
 * core module, and no import in the instance assumes a monorepo sibling.
 *
 * Grouped by the module each symbol comes from. Add a symbol here when an
 * instance of core needs it — never a direct climb from the instance, which
 * `cat-harness/scripts/tests/instance-separation-imports.test.ts` refuses.
 *
 * @module folio-assistant-core/scripts/platform
 */

// ── cat-harness: declarations and site layout ─────────────────────────────
export { readDeclaration, repoRootFor, siteDirFor } from "../../cat-harness/schemas/cat-harness.js";

// ── cat-harness: page chrome and mounting ─────────────────────────────────
export { fragment } from "../../cat-harness/scripts/folio-mount.ts";
export { embed } from "../../cat-harness/scripts/pdf-viewer.ts";
export { subjectPage } from "../../cat-harness/scripts/harness-tiles.js";
export { withRoutes } from "../../cat-harness/scripts/mount-instance-docs.ts";
export { libraryResolver } from "../../cat-harness/scripts/lib/library-links.ts";
export { withViewerNav } from "../../cat-harness/scripts/viewer-page.ts";
export { withInlineCode } from "../../cat-harness/schemas/inline-code.ts";

// ── cat-harness: gettext ──────────────────────────────────────────────────
export { formatPot, type PotEntry } from "../../cat-harness/content/pipeline/pot-extract.js";
export { parsePo, parsePoEntries } from "../../cat-harness/content/pipeline/po-inject.js";

// ── cat-harness: themes ───────────────────────────────────────────────────
export {
  THEME_SCHEMA_TAG,
  ThemeSchema,
  ResolvedThemeSchema,
  explainThemeFailure,
  resolveTheme,
  themeKey,
  type ResolvedTheme,
  type Theme,
} from "../../cat-harness/schemas/theme.js";
export { DEFAULT_THEME_ID, themeById } from "../../cat-harness/schemas/themes.js";
