/**
 * The ONE file in this instance that names where the platform lives.
 *
 * smart-base is staged here ahead of becoming its own repository
 * (`litlfred/smart-base`, plan `smart-separation-2026-10-01`, issue #1767,
 * bean `n3ni`). Every platform symbol the instance uses is re-exported from
 * here, so the day it leaves, re-pointing the platform is a one-file edit —
 * the same reason a folio's block manifests import `../schemas/builders`
 * and never folio-assistant directly. `instance-separation-imports.test.ts`
 * holds the rule: no other file here may reach outside the instance.
 *
 * Grouped by the platform module each symbol comes from; a module that
 * moves is one line to change. Includes one test-support export
 * (`writeInstanceConfig`), because a test in this instance uses it.
 *
 * @module smart-base/platform
 */
export {
  DAK_COMPONENTS,
  DAK_COMPONENT_FIELDS,
  type DakComponent,
  DAK_UNFORMALIZED_COMPONENTS,
} from "../cat-harness/schemas/block-kinds.js";
export {
  declarationPathIn,
  directoriesForGraph,
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
} from "../cat-harness/schemas/cat-harness.js";
export {
  ContentTypeConflictError,
  ContentTypeRegistry,
  describeRepository,
  defaultContentTypes,
} from "../cat-harness/schemas/content-type.js";
export {
  registerBaseContentTypes,
} from "../cat-harness/schemas/content-types-base.js";
export {
  DocumentKindSchema,
  DOCUMENT_KIND_COVERAGE_SCHEMA_TAG,
  DOCUMENT_KIND_SCHEMA_TAG,
  DocumentKindCoverageSchema,
  type DocumentKind,
  type DocumentKindCoverage,
} from "../cat-harness/schemas/document-kind.js";
export {
  ExternalSchemaSchema,
} from "../cat-harness/schemas/external-schema.js";
export {
  describeRepositoryClosure,
} from "../cat-harness/schemas/harness-config.js";
export {
  SMART_BASE_NS,
} from "../cat-harness/schemas/jsonld.js";
export {
  kgNodeLabelShape,
  type KgNodeLabels,
} from "../cat-harness/schemas/kg-node.js";
export {
  termIri,
} from "../cat-harness/schemas/namespaces.js";
export {
  PINNED_TERMINOLOGY_TAG,
  PinnedTerminologySchema,
  type PinnedConcept,
  type PinnedTerminologyFile,
} from "../cat-harness/schemas/pinned-terminology.js";
export {
  THEME_SCHEMA_TAG,
  explainThemeFailure,
  resolveTheme,
  type ResolvedTheme,
  type Theme,
} from "../cat-harness/schemas/theme.js";
export {
  instanceThemes,
  instanceWebpageThemes,
} from "../cat-harness/schemas/theme-by-ref.js";
export { defineTool, type ToolDefinition } from "../cat-harness/schemas/tool.js";
export { toolTypeIri } from "../cat-harness/schemas/tool-types.js";
export {
  DAK_CARDS,
} from "../cat-harness/scripts/gen-dak-components-figure.js";
export {
  writeInstanceConfig,
} from "../cat-harness/test/support/instance-fixture.js";
