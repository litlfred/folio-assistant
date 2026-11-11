/**
 * Offline JSON-LD contexts for L1 graph documents.
 *
 * A graph names its context by URL (`http://smart.who.int/kg/<layer>.context.jsonld`),
 * which is its layer's identity and what `validate.ts` reads the layer from.
 * The URL is not something to fetch at run time: this maps each URL to the
 * context generated from the Zod source (`src/context.ts`, committed under
 * `generated/l1/`), so a processor expands a graph with no network.
 *
 *   import jsonld from "jsonld";
 *   await jsonld.toRDF(doc, { format: "application/n-quads", documentLoader });
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { contextUrl } from "./context.ts";

const GENERATED = join(dirname(fileURLToPath(import.meta.url)), "..", "generated", "l1");

/** Every context this package holds, by the URL a document names. */
export const CONTEXTS: Readonly<Record<string, string>> = {
  [contextUrl("l1")]: join(GENERATED, "l1.context.jsonld"),
  [contextUrl("l1-library")]: join(GENERATED, "l1-library.context.jsonld"),
};

/**
 * A jsonld.js document loader that serves only the contexts above and refuses
 * anything else — a context fetched at run time is a dependency nobody pinned.
 */
export async function documentLoader(url: string): Promise<{ contextUrl: null; documentUrl: string; document: unknown }> {
  const path = CONTEXTS[url];
  if (!path) throw new Error(`no offline context for ${url} — this loader serves ${Object.keys(CONTEXTS).join(", ")}`);
  return { contextUrl: null, documentUrl: url, document: JSON.parse(readFileSync(path, "utf-8")) };
}
