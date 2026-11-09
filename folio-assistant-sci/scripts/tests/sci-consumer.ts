/**
 * A folio that depends on folio-assistant-sci, for tests that hold this
 * instance's contributions against the dependency walk that delivers them.
 *
 * ## Why a fixture, and not the checkout root
 *
 * A contribution reaches a folio through the folio's dependency tree, and
 * `loadContributions` walks a root's dependencies, never the root itself. So
 * these tests need a root whose tree INCLUDES sci. Until now they used the
 * aggregate checkout root, three levels up — a path climbing out of this
 * layer, which resolves to nothing once sci is its own repository with its
 * dependencies cloned beside it (`seed:ready --rehearse`, 2026-10-07: every
 * one of them failed standing alone).
 *
 * The fixture is the smallest root with that property: a declaration in the
 * system temp directory whose config names sci BY PATH. Sci's own `needs`
 * still resolve as siblings of sci, wherever sci is, so the same fixture
 * works in the checkout and standing alone.
 *
 * @module folio-assistant-sci/scripts/tests/sci-consumer
 */
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { writeInstanceConfig } from "../../../cat-harness-tools/test/support/instance-fixture";
import { loadContributions, loadContributionsSync } from "@litlfred/cat-harness-tools/schemas/kg/harness-config.js";
import { ContributionRegistry, type FolioContribution } from "@litlfred/cat-harness-tools/schemas/content/contributions.js";
import { usePipelinePluginRegistry } from "../../../cat-harness-tools/pipeline/pipeline-plugins";
import { configureChapterProfiles } from "../../../cat-harness-tools/pipeline/chapter-profile-registry-di";

/** This instance's root: `folio-assistant-sci/`. */
export const SCI_ROOT = resolve(import.meta.dir, "../..");

let cached: string | undefined;

/** A folio root whose only declared dependency is this instance. Written once per process. */
export function sciConsumerRoot(): string {
  if (cached) return cached;
  const dir = join(mkdtempSync(join(tmpdir(), "sci-consumer-")), "sci-consumer");
  mkdirSync(dir, { recursive: true });
  writeInstanceConfig(
    dir,
    JSON.stringify({ contentType: "paper", dependencies: { folioAssistant: [{ name: "folio-assistant-sci", path: SCI_ROOT }] } }),
    "sci-consumer",
  );
  cached = dir;
  return dir;
}

/** The registry a folio depending on sci gets, loaded as `qa-sweep` loads it. */
export function sciRegistry(): Promise<ContributionRegistry> {
  return loadContributions<FolioContribution, ContributionRegistry>(sciConsumerRoot(), new ContributionRegistry());
}

/** {@link sciRegistry}, synchronously. */
export function sciRegistrySync(): ContributionRegistry {
  return loadContributionsSync<FolioContribution, ContributionRegistry>(sciConsumerRoot(), new ContributionRegistry());
}

/**
 * Point the generic pipeline's slots at sci's contribution, for tests of
 * cat-harness code whose behaviour sci fills (the Lean lexer, above all).
 * Left unset, the slots load lazily from the RUNNING folio, which standing
 * alone is no folio that depends on sci.
 * */
export function useSciPipelinePlugins(): void {
  usePipelinePluginRegistry(sciRegistrySync());
}

/**
 * Chapter profiles are a folio's own data and no layer ships a default, so a
 * test whose fixtures sit in categorical chapters configures them itself.
 * Pair with `resetChapterProfiles()` in `afterAll`.
 */
export function useCategoricalChapters(...chapters: string[]): void {
  configureChapterProfiles({
    chapterExpectedRegimes: {},
    categoricalChapters: new Set(chapters),
    archimedeanChapters: new Set(),
  });
}
