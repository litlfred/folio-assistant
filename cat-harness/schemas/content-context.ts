/**
 * The `@context` a content document carries, built from the types it uses.
 *
 * `CONTENT_CONTEXT` (`jsonld.ts`) is the context cat-harness PUBLISHES, so it
 * binds only cat-harness's own prefix and the external vocabularies. A block's
 * kind class is minted in the namespace of the instance that declares the
 * kind (owner ruling 2026-10-06, bean `0r7u`), and cat-harness may not name
 * the instances above it. So each document binds the prefixes its own `@type`s use, in the
 * local half of its context, read from the declaring instance's declaration
 * (`instanceNamespace`) rather than from a list here.
 *
 * Node-only: it reads declarations from disk, which is why it is not in
 * `jsonld.ts`.
 *
 * @module cat-harness/schemas/content-context
 * @graphNode none — a function library: it builds a document's context and defines no schema
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { instanceRootsIn, readDeclaration } from "./cat-harness.js";
import { checkoutRootFor, declarationChain } from "./harness-config.js";
import { instanceNamespace } from "./instance-repositories.js";
import { CONTENT_CONTEXT, CONTENT_CONTEXT_URL, FOLIO_BASE } from "./jsonld.js";

/**
 * Every instance's prefix — its stub, else its name — mapped to its namespace,
 * over a checkout and, when given, a folio's dependency overlay. Throws when
 * two instances claim one prefix, since a binding would then depend on which
 * was read first.
 */
export function instancePrefixes(checkoutRoot: string, folioRoot?: string): Map<string, string> {
  const roots = new Set(instanceRootsIn(checkoutRoot).map((r) => resolve(r)));
  if (folioRoot !== undefined) for (const link of declarationChain(folioRoot)) roots.add(resolve(link.root));
  const out = new Map<string, string>();
  const from = new Map<string, string>();
  for (const root of [...roots].sort()) {
    const decl = readDeclaration(root);
    if (decl === undefined) continue;
    const prefix = decl.stub ?? decl.name;
    const ns = instanceNamespace(decl);
    const seen = out.get(prefix);
    if (seen !== undefined && seen !== ns) {
      throw new Error(`content-context: prefix ${prefix} is declared by both ${from.get(prefix)} and ${root}`);
    }
    out.set(prefix, ns);
    from.set(prefix, root);
  }
  return out;
}

let checkoutPrefixes: Map<string, string> | undefined;

/**
 * {@link instancePrefixes} over the checkout this module sits in, read once —
 * plus the test fixture checkout when `FOLIO_FIXTURE_CHECKOUT` names one, the
 * same convention `declared-nodes.ts` follows: cat-harness standing alone reads
 * core's and sci's block kinds from the fixture, so it must bind their
 * prefixes from the fixture too. The real checkout wins on a shared prefix.
 */
export function defaultInstancePrefixes(): Map<string, string> {
  if (checkoutPrefixes === undefined) {
    const fixture = process.env.FOLIO_FIXTURE_CHECKOUT;
    checkoutPrefixes = new Map([
      ...(fixture ? instancePrefixes(fixture) : new Map<string, string>()),
      ...instancePrefixes(checkoutRootFor(dirname(dirname(fileURLToPath(import.meta.url))))),
    ]);
  }
  return checkoutPrefixes;
}

/**
 * The context for a document whose `@type`s are `types`: the published
 * context, then a local object carrying `@base` (the content base unless
 * `opts.base` names another, as the docs site's does) and a binding for every
 * instance prefix those types use that the published context does not bind.
 *
 * Throws on a prefix that is neither bound by the published context nor an
 * instance's: a document must never carry a compact IRI no processor can
 * expand.
 */
export function documentContext(
  types: readonly string[],
  opts: { base?: string; prefixes?: ReadonlyMap<string, string> } = {},
): [string, Record<string, string>] {
  const local: Record<string, string> = { "@base": opts.base ?? FOLIO_BASE };
  for (const t of types) {
    const i = t.indexOf(":");
    if (i <= 0 || t.startsWith("http")) continue;
    const prefix = t.slice(0, i);
    if (prefix in CONTENT_CONTEXT || prefix in local) continue;
    const ns = (opts.prefixes ?? defaultInstancePrefixes()).get(prefix);
    if (ns === undefined) throw new Error(`content-context: ${t} uses prefix ${prefix}, which no context binds`);
    local[prefix] = ns;
  }
  return [CONTENT_CONTEXT_URL, local];
}
