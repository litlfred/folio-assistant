#!/usr/bin/env bun
/**
 * Which build produced this file, for the artefacts that can say so in-band.
 *
 * A staging preview publishes a whole site under `STAGING/<slug>/`, and the
 * only question a reviewer actually has about any file in it is *which commit
 * am I looking at*. HTML answers with the injected banner. Everything else is
 * data, and data needs the answer written into the document.
 *
 * ## One function, because two stamps can disagree
 *
 * This was an inline `bun -e` block in `feature-staging.yml` that stamped the
 * JSON-LD export and nothing else, so `harness-schema-export.ts` published
 * `<stub>.schema.json`, `tool.schema.json`, `tool-types.schema.json` and 44
 * skill I/O contracts beside it with no build identity at all — measured on
 * `main` at 2026-09-19 (bean `lx2s`). Adding a second stamp in the second
 * script would have given the two documents independent notions of the same
 * build, which is the failure the workflow's own comment guards against when
 * it copies the `.json` alias *after* the stamp "so the two documents cannot
 * disagree about which build they came from". One function, one answer.
 *
 * ## Absent rather than fabricated
 *
 * Outside CI there is no build, so there is no stamp: this returns `undefined`
 * and callers write no key. The tempting alternative — `sha` from
 * `git rev-parse HEAD`, `branch` from the current checkout — produces a
 * document that *claims* to be a build artefact of a commit that was never
 * built, and a reader has no way to tell it from one that was. Same rule
 * `harness-schema-export` follows for `$id`: absolute or absent, never a
 * plausible-looking stand-in.
 *
 * @module scripts/staging-stamp
 */

/**
 * Build identity as it appears in a stamped document.
 *
 * `branch` is the human-readable branch name and `pr` the ref the workflow ran
 * on; they differ on a `pull_request` event, where the ref is the merge ref and
 * is not something a reviewer can check out.
 */
export interface StagingStamp {
  branch: string;
  sha: string;
  pr: string;
  run: string;
}

/** The key every stamped document carries it under. One name for one concept. */
export const STAGING_KEY = "staging";

/**
 * The stamp for the current process, or `undefined` when there is no build.
 *
 * `sha` is what makes a stamp meaningful, so its absence means no stamp at all
 * rather than a partial one: a `{branch, run}` with no commit answers the
 * question nobody asked. The other three fall back to the empty string only
 * when `sha` is present, which is the case where we are demonstrably in a run
 * and one variable happens to be unset.
 */
export function stagingStamp(env: Record<string, string | undefined> = process.env): StagingStamp | undefined {
  const sha = env.GITHUB_SHA;
  if (!sha) return undefined;
  return {
    branch: env.KG_BRANCH ?? env.GITHUB_REF_NAME ?? "",
    sha,
    pr: env.GITHUB_REF_NAME ?? "",
    run: env.GITHUB_RUN_ID ?? "",
  };
}

/**
 * `{ staging: … }` when there is a build, `{}` when there is not.
 *
 * Spread into a document literal so the key is absent rather than `undefined`
 * — `JSON.stringify` drops an `undefined` value, but an explicitly-present key
 * would survive a structural comparison and make a local export look like a
 * build artefact with a missing field.
 */
export function stagingFields(
  env: Record<string, string | undefined> = process.env,
): Record<string, StagingStamp> {
  const s = stagingStamp(env);
  return s ? { [STAGING_KEY]: s } : {};
}
