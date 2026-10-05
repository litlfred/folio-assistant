/**
 * qa-result-link — THE address of a QA result file, for anything that links to
 * one. Bean `bejf`, issue #2217 (arc #1763).
 *
 * ## Why one helper
 *
 * The site's QA panel linked every result file as
 * `https://github.com/<repo>/blob/main/` + the file's path. That was wrong
 * twice, and the two errors were independent:
 *
 * 1. **The path.** A witness projection names its sidecars relative to the
 *    INSTANCE (`test/results/…`), and the URL was rooted at the REPOSITORY, so
 *    `cat-harness/` was missing. The link was a 404 even while the file was
 *    still committed on `main`.
 * 2. **The branch.** A derived result's record is the orphan `qa-reports`
 *    branch, keyed `main/<sha>/<repo path>` ([`qa-reports`] skill). `blob/main`
 *    is the copy on its way out (bean `5hox`), and after it goes the link is
 *    dead outright.
 *
 * A URL composed at each call site gets one of those right and the other wrong.
 * This module composes it once, from the repo-relative path, the store's own
 * declaration and the entry the build read.
 *
 * ## Where a result lives is the DECLARATION's answer
 *
 * A `qa` directory that declares `storage` is stored. Its files are addressed
 * on that branch, whether or not a copy is still tracked on `main` today,
 * because the declaration is what the store and the gates go by
 * (`qaStorageOf`). A directory with no `storage` is still committed, and its
 * files keep their `blob/main` address. There is no hand-written list of
 * families: a directory moves when its declaration does.
 *
 * ## Which entry: the one this build's evidence came from
 *
 * A published page shows the evidence of ONE entry, and its links name that
 * entry by its key (`main/<sha>`, `pr/<n>/<sha>`), so the address is stable.
 * The newest entry, by contrast, moves on every push and soon describes a
 * different tree from the page. The key comes from the `qa-site-assets` fetch
 * state ({@link linkKeyFromFetchState}). With no key known (a local build, an
 * unavailable fetch), the link falls back to the branch tip's `index.json`,
 * which names the newest entry per ref. It is labelled `tip` so a renderer can
 * say so, never passed off as this page's own entry.
 *
 * @module scripts/qa-result-link
 * @covers qa
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";

import { qaStorageOf } from "./qa-results.ts";
import { INDEX_FILE, parseQaKey } from "./qa-store.ts";
import type { QaFetchState } from "./qa-site-assets.ts";

/** How a link addresses its file — so a renderer can say which it is. */
export type QaLinkAddressing =
  /** Still committed: `blob/main/<repo path>`. */
  | "main"
  /** Stored, with this build's entry known: `blob/<branch>/<key>/<repo path>`. */
  | "entry"
  /** Stored, no entry known: the branch tip's `index.json`, NOT the file itself. */
  | "tip";

export interface QaResultLink {
  /** Repo-relative, `/`-separated — what a reader is shown. */
  path: string;
  /** Absent when there is no forge to link to: no link rather than a guess. */
  href?: string;
  addressedBy: QaLinkAddressing;
  /** The store key the href names, when `addressedBy` is `entry`. */
  key?: string;
}

const enc = (p: string) => p.split("/").map(encodeURIComponent).join("/");

/**
 * The pure rule. `storedOn` is the branch the file's `qa` directory declares,
 * or `undefined` when the directory is not stored; `key` is the entry to name.
 * A `key` that is not a full store key (`main/<sha>`, `pr/<n>/<sha>`) is
 * refused by throwing: a prefix or `main` is a search, not an address.
 */
export function qaResultHref(i: {
  repoWeb: string | undefined;
  repoPath: string;
  storedOn: string | undefined;
  key?: string;
}): QaResultLink {
  const path = i.repoPath.split("\\").join("/").replace(/^\/+/, "");
  if (path.split("/").some((s) => s === ".." || s === ".")) {
    throw new Error(`qa-result-link: "${i.repoPath}" is not a repo-relative path`);
  }
  const web = i.repoWeb?.replace(/\.git$/, "").replace(/\/+$/, "");
  if (i.storedOn === undefined) {
    return { path, addressedBy: "main", ...(web ? { href: `${web}/blob/main/${enc(path)}` } : {}) };
  }
  // A branch name's `/` are path separators on the forge too, and GitHub
  // resolves `blob/cat/cat-harness/qa-reports/…` (measured: 200).
  const branch = enc(i.storedOn);
  if (i.key !== undefined) {
    parseQaKey(i.key); // throws on a non-key
    return { path, addressedBy: "entry", key: i.key, ...(web ? { href: `${web}/blob/${branch}/${i.key}/${enc(path)}` } : {}) };
  }
  return { path, addressedBy: "tip", ...(web ? { href: `${web}/blob/${branch}/${INDEX_FILE}` } : {}) };
}

/**
 * The declaration-aware form: an absolute path in the checkout, addressed by
 * whether its `qa` directory declares `storage`.
 */
export function qaResultLinkFor(
  absPath: string,
  ctx: { repoRoot: string; repoWeb: string | undefined; key?: string },
): QaResultLink {
  const repoPath = relative(ctx.repoRoot, resolve(absPath)).split(sep).join("/");
  return qaResultHref({ repoWeb: ctx.repoWeb, repoPath, storedOn: qaStorageOf(absPath, ctx.repoRoot), key: ctx.key });
}

/**
 * The key a page built from this fetch should name, or `undefined` for "not
 * known" (the link then falls back to the tip).
 *
 * - `fetched` / `fetched-fallback`: the entry that was read. It is exactly the
 *   evidence on the page, even when it is another commit's (the page labels
 *   that already).
 * - `checkout`: the corpus is the checkout's own committed copy, so the page
 *   shows the BUILD'S commit, and `qa-publish` stores that commit under the
 *   build's own ref. So the first requested ref, when it is a full key. A
 *   fallback hit is another commit and is NOT this evidence.
 * - `unavailable`: nothing to name.
 */
export function linkKeyFromFetchState(state: Pick<QaFetchState, "source" | "requested" | "key">): string | undefined {
  const isKey = (s: string | undefined): s is string => {
    if (!s) return false;
    try {
      parseQaKey(s);
      return true;
    } catch {
      return false;
    }
  };
  if (state.source === "fetched" || state.source === "fetched-fallback") return isKey(state.key) ? state.key : undefined;
  if (state.source === "checkout") return isKey(state.requested[0]) ? state.requested[0] : undefined;
  return undefined;
}

/**
 * Where `qa-site-assets fetch` writes its state when `--state` is not given,
 * and where the site build passes it explicitly: `$RUNNER_TEMP/…` in CI.
 * One answer for the writer and for the generator that reads it.
 */
export function siteFetchStatePath(env: Record<string, string | undefined> = process.env): string {
  return env.QA_SITE_STATE ?? join(env.RUNNER_TEMP ?? tmpdir(), "qa-site-assets.state.json");
}

/**
 * The key for the site build running now. It is read only when the build says
 * where its state is (`QA_SITE_STATE`, or CI's `RUNNER_TEMP`): a local run's
 * temp directory may hold a state file left by another checkout, and a link
 * naming that commit would be a confident wrong answer. With nothing to read,
 * the result is `undefined`, which addresses the tip.
 */
export function siteLinkKey(env: Record<string, string | undefined> = process.env): string | undefined {
  if (!env.QA_SITE_STATE && !env.RUNNER_TEMP) return undefined;
  const p = siteFetchStatePath(env);
  if (!existsSync(p)) return undefined;
  try {
    return linkKeyFromFetchState(JSON.parse(readFileSync(p, "utf-8")) as QaFetchState);
  } catch {
    return undefined;
  }
}
