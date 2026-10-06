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
  writeInstanceConfig,
} from "../cat-harness/test/support/instance-fixture.js";
export {
  QA_CRITERIA_REGISTRY,
} from "../cat-harness/content/pipeline/qa-criteria-registry.js";
export {
  readBlockManifest,
} from "../cat-harness/content/pipeline/qa-utils.js";
export {
  BLOCK_KINDS,
  CONTENT_PROFILES,
  kindForBuilder,
  adapterForKind,
  profileAcceptsKind,
} from "../cat-harness/schemas/block-kinds.js";
export {
  criterionAdapters,
  incompatibleCompanions,
  COMPANION_ROLES,
  type CheckerPaths,
  type CheckerResult,
  type CompanionRole,
} from "../cat-harness/schemas/block-qa.js";
export {
  siteDirFor,
} from "../cat-harness/schemas/cat-harness.js";
export {
  KNOWN_LABEL_PREFIXES,
  BlockBaseSchema,
} from "../cat-harness/schemas/constraints.js";
export {
  ContributionRegistry,
  composedKindOwner,
} from "../cat-harness/schemas/contributions.js";
export {
  pagesOf,
  readStructure,
  STRUCTURE_FILENAME,
  type BaseSection,
  type BaseStructure,
} from "../cat-harness/schemas/document-structure.js";
export {
  assertPrefixesInSync,
  typesForKind,
} from "../cat-harness/schemas/jsonld.js";
export {
  type BlockBase,
} from "../cat-harness/schemas/types.js";
export {
  IgIdentitySchema,
  readIgIdentity,
} from "../fhir-harness/schemas/ig-identity.js";
export {
  igSiteData,
} from "../fhir-harness/scripts/ig-site-data.js";
export {
  loadContributionsSync,
} from "../cat-harness/schemas/harness-config.js";
export {
  BlockKindNodeSchema,
  builderOf,
  type BlockKindNode,
} from "../cat-harness/schemas/block-kind-node.js";
export {
  ownDeclaredDirectories,
} from "../cat-harness/schemas/declared-nodes.js";
export {
  siteFilter,
} from "../cat-harness/scripts/staging-cone.ts";
export {
  AST_SITE_WRITERS,
} from "../fhir-harness/scripts/stage-ast-sites.ts";
export {
  handleFromUrl,
} from "../folio-assistant-core/schemas/catalogue.ts";
export {
  DublinCoreRecordSchema,
  type DublinCoreRecord,
} from "../folio-assistant-core/schemas/dublin-core.ts";
