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
 * module still climb directly; they are what the ceiling now counts.
 *
 * @module who-iris/platform
 */
export { readDeclaration, repoRootFor, siteDirFor } from "../cat-harness/schemas/cat-harness.js";
export { fragment as folioMountFragment } from "../cat-harness/scripts/folio-mount.ts";
export { embed as pdfViewer } from "../cat-harness/scripts/pdf-viewer.ts";
export { subjectPage } from "../cat-harness/scripts/harness-tiles.js";
export { withRoutes } from "../cat-harness/scripts/mount-instance-docs.ts";
export { libraryResolver } from "../cat-harness/scripts/lib/library-links.ts";
export { withViewerNav } from "../cat-harness/scripts/viewer-page.ts";
export { withInlineCode } from "../cat-harness/schemas/inline-code.ts";
export { formatPot, type PotEntry } from "../cat-harness/content/pipeline/pot-extract.js";
export { parsePo, parsePoEntries } from "../cat-harness/content/pipeline/po-inject.js";
export { bytesFor, repoRelative } from "../folio-assistant-core/scripts/lib/bytes.js";
export { resolvableIri, type CatalogueNode } from "../folio-assistant-core/schemas/catalogue.js";
export { dcRenderingsFor } from "../folio-assistant-core/scripts/dc-render.ts";
export { publicationBlockers } from "../folio-assistant-core/schemas/materialization.js";
