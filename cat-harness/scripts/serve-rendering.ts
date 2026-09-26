/**
 * Serve an instance's renderings over local HTTP, with their DECLARED media
 * types.
 *
 * `skills/folio-core/serving-renderings.md` settles the contract — four
 * endpoints under the instance's stub, the media type each declares, and the
 * three enforcement states per host — and closes by saying, verbatim:
 *
 * > **How to run a server.** No tool is specified here — the media types and
 * > the per-host enforcement story are the durable part, and a server that
 * > reads them is an implementation of this, not a prerequisite for it.
 *
 * This is that implementation. It is the publication host for every topology
 * in `docs/proposals/deployment-topologies.md` whose `publication host` axis
 * is not `github-pages` — local git only, private repo, developer and
 * self-sovereign — where Pages is absent rather than merely limited.
 * Bean `folio-assistant-0hi8`, issue #363.
 *
 * ## What this adds over `python3 -m http.server`
 *
 * Less than you would guess, and the measurement matters more than the
 * intuition. Measured 2026-09-19: Python's `mimetypes` and `Bun.file().type`
 * BOTH resolve `.jsonld` to `application/ld+json` already. A plain static
 * server is not broken here and this file must not be sold as fixing it.
 *
 * The gap is one row. **`.schema.json` infers as `application/json`** from
 * every OS table, because `.json` is the suffix that matches and nothing
 * knows the compound extension means a schema. `RENDERING_MEDIA_TYPES` is
 * ordered longest-first so the compound wins, and this server reads that
 * table rather than the filesystem's.
 *
 * ## Two behaviours that are contract, not convenience
 *
 * - **`<stub>/` resolves to its directory index.** The bare stub has to be
 *   openable, which on GitHub Pages is what forces the viewer to be a
 *   directory in the first place. A local server that 404s there would make
 *   the two hosts disagree about a URL the documentation prints.
 * - **An unknown path falls back to Bun's own inference**, never to
 *   `application/octet-stream`. The table's `undefined` means "the
 *   declaration says nothing about this file", not "this file has no type" —
 *   the third state, kept as one.
 *
 * ```sh
 * bun run cat-harness/scripts/serve-rendering.ts --dir <site> --port 4000
 * ```
 *
 * @module scripts/serve-rendering
 */
import { existsSync, realpathSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";

import { renderingMediaType, siteDirFor } from "../schemas/cat-harness.js";

export interface ServeOptions {
  /** Directory to serve. */
  dir: string;
  /** Port; 0 asks the OS for a free one, which is what the tests use. */
  port?: number;
  /** Host interface. Loopback by default — see `serveRendering`. */
  hostname?: string;
}

// `resolveWithin` now lives in `src/core/safe-path.ts` and is re-exported here
// so this module's existing importers and tests keep working. It moved because
// three HTTP handlers in the MCP server hand-rolled `join(base, external)`
// while the correct helper sat in this one script — bean `6bhf`.
import { resolveWithin } from "../src/core/safe-path";
export { resolveWithin };

/**
 * The file a request resolves to, applying the directory-index rule and the
 * containment check that needs the filesystem.
 *
 * **The real path is what is compared, so a symlink cannot escape.** Found by
 * this module's own test, which pointed a link inside the root at a file
 * outside it and got **200** from the first version: `resolve()` is string
 * arithmetic, so the lexical check above sees a clean path and the escape
 * happens entirely in the filesystem. Serving a directory means serving
 * whatever links are in it, and on a `self-sovereign` deployment — the
 * topology that most wants this server — that directory sits next to data
 * nobody intends to publish.
 *
 * Returns `undefined` when nothing is there, so the caller owns the 404 — a
 * resolver that invented an error response would be two things.
 */
export function resolveFile(root: string, urlPath: string): string | undefined {
  const target = resolveWithin(root, urlPath);
  if (!target || !existsSync(target)) return undefined;

  const base = realpathSync(resolve(root));
  let real: string;
  try {
    real = realpathSync(target);
  } catch {
    // A broken symlink: `existsSync` followed it and found nothing to point
    // at. Not servable, and not an error worth distinguishing from absent.
    return undefined;
  }
  if (real !== base && !real.startsWith(base + sep)) return undefined;

  if (statSync(real).isDirectory()) {
    const index = join(real, "index.html");
    return existsSync(index) ? index : undefined;
  }
  return real;
}

/**
 * Start the server. Returns the Bun server, whose `.port` is the bound port —
 * read it rather than assuming, since `port: 0` is the tested path.
 *
 * **Binds loopback by default.** This serves whatever directory it is pointed
 * at, and the topologies that need it most are the ones with the strongest
 * reason not to be reachable from the network: `self-sovereign` is
 * `outward facing: no` by definition. Exposing it is opt-in via `hostname`.
 */
export function serveRendering(opts: ServeOptions): ReturnType<typeof Bun.serve> {
  const root = resolve(opts.dir);
  if (!existsSync(root)) throw new Error(`serve-rendering: no such directory: ${root}`);

  return Bun.serve({
    port: opts.port ?? 4000,
    hostname: opts.hostname ?? "127.0.0.1",
    fetch(req) {
      const { pathname } = new URL(req.url);
      const file = resolveFile(root, pathname);
      if (!file) return new Response("Not found\n", { status: 404 });

      const declared = renderingMediaType(file);
      const body = Bun.file(file);
      // `declared` absent is the third state: defer to Bun's inference for an
      // ordinary asset rather than asserting a type the declaration never
      // made. Only a DECLARED type overrides.
      return new Response(body, declared ? { headers: { "Content-Type": declared } } : undefined);
    },
  });
}

/**
 * The directory to serve when `--dir` is not given.
 *
 * **The site root is `siteDirFor`'s answer, never a literal.** The first draft
 * of this file wrote `docs/_site`, which was wrong twice over: hardcoded, and
 * naming a directory that had already stopped being the site root when the
 * build moved to `docs/<stub>` for the repo split. `site-dir-single-answer`
 * (bean `x4a6`) landed on `main` while this was in review and caught it.
 *
 * `siteDirFor` **throws** when the declaration cannot be read, because a site
 * root guessed wrong writes pages into a directory nothing serves. Here the
 * stakes are lower — nothing is written, and the caller sees the resolved
 * path printed — so an unreadable declaration falls back to the working
 * directory rather than refusing to start. That is not a guess dressed as an
 * answer: the path is echoed on the first line of output.
 */
function defaultDir(): string {
  try {
    const site = siteDirFor(process.cwd());
    if (existsSync(site)) return site;
  } catch {
    // No declaration, or a nameless one. Fall through.
  }
  return ".";
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(
      `Serve an instance's renderings with their declared media types.\n\n` +
        `  bun run cat-harness/scripts/serve-rendering.ts [--dir <path>] [--port <n>] [--host <iface>]\n\n` +
        `  --dir   directory to serve (default: the declared site root, else .)\n` +
        `  --port  port to bind (default 4000)\n` +
        `  --host  interface (default 127.0.0.1 — loopback, deliberately)\n`,
    );
    process.exit(0);
  }

  const dir = flag("--dir") ?? defaultDir();
  const server = serveRendering({
    dir,
    port: Number(flag("--port") ?? 4000),
    hostname: flag("--host"),
  });
  // Always print the RESOLVED directory, so the default is never a silent
  // guess even when it was inferred.
  console.log(`serving ${resolve(dir)} at http://${server.hostname}:${server.port}`);
}
