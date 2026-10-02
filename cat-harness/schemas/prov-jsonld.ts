/**
 * PROV activities as PROV-JSONLD — links, not strings (beans `jcet`, `9y9j`).
 *
 * ## Why this exists
 *
 * Measured 2026-10-01: every activity in the committed PROV-O QA/QC reports
 * carried `prov:agent`, `prov:hadRole` and `prov:hadPlan` as bare strings, and
 * jsonld.js expanded all of them to `{"@value": …}` — literals. PROV-O defines
 * all three as object properties, so the graph said an activity was done by
 * the TEXT "owner" and nothing joined it to the actor. The `linked-data` voice
 * (folio-assistant-core/skills/voices/linked-data) states the rules this module
 * follows; each is cited there to the held W3C text.
 *
 * ## What it emits
 *
 * PROV-JSONLD's shape (W3C Member Submission 2024-08-25, held at
 * `cat-harness/library/w3c-2024-prov-jsonld/`), owner's decision: an `Activity`
 * node, and each qualified association as its own `Association` node whose
 * `activity`, `agent`, `role` and `plan` are the context's TERMS — so its
 * coercions and its `@reverse` mapping to `prov:qualifiedAssociation` apply
 * (rule `ld-coercion-belongs-to-the-term`).
 *
 * ## Where a link points
 *
 * At the node's release address, the rule `check:node-iris` enforces:
 * `<iriBase><version>/<path in its knowledge graph>[#fragment]`, read through
 * the OWNING instance's declaration (`releaseIris`). An actor is
 * `scenarios/actors/<id>`, a role `scenarios/roles#<id>`, a plan
 * `<dir>/<process file stem>#<task>`.
 *
 * **Three states, never two.** When the owner is found and declares an
 * `iriBase`, the value is a link. When it is found and declares none, or is not
 * found at all, the value stays a LITERAL — written as an explicit
 * `{"@value": …}` so the term's coercion cannot turn it into a relative IRI
 * resolved against an unrelated `@base` — and the reason is returned, for the
 * report to carry as a finding. An invented address is worse than an honest
 * string (rule `ld-link-is-the-node-release-address`).
 *
 * `prov:used` values are catalogue items (`item/<uuid>`, a DSpace id). Owner
 * 2026-10-01, option A: each is linked at its record's HANDLE through the
 * global resolver (`https://hdl.handle.net/<handle>`), the identifier built to
 * outlive the publishing host — not at our catalogue record, which has no
 * release address while its instance declares no `iriBase`. A record with no
 * Handle, or an id nobody catalogues, stays a literal with its reason.
 *
 * @module schemas/prov-jsonld
 * @graphNode schema
 * @conformsTo w3c-prov-jsonld
 * @conformsTo ietf-handle-system
 * @covers schemas
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";

import { releaseIris, releaseIri } from "../../bootstrap-tools/schemas/release-iri.ts";
import { instanceDirectoryForGraph, instanceRootsIn, readDeclaration } from "./cat-harness.ts";
import { CAT_HARNESS_NS, FOLIO_BASE } from "./namespaces.ts";
import { PROV_CONTEXT, type ProvActivity } from "./prov.ts";

/**
 * Where the PROV-JSONLD context is published — the address the owner
 * downloaded it from on 2026-10-01. Documents name it; nothing fetches it.
 * Defined in `prov.ts` (the lower layer) and re-exported here by name.
 */
export const PROV_JSONLD_CONTEXT_URL = PROV_CONTEXT;

/**
 * The held copy, pinned by sha256 (rule `ld-no-context-fetched-at-run-time`).
 * Repository-relative. The submission lists `context.jsonld` among its own
 * files, so the copy sits in its library entry.
 */
export const PROV_JSONLD_CONTEXT_HELD = {
  path: "cat-harness/library/w3c-2024-prov-jsonld/context.jsonld",
  sha256: "811d5e94d8cb568d7dc4461ef6a247644dd0e775cdc88b65c42238d8e832be1e",
} as const;

/** The `$schema` a catalogue record declares itself with. */
const CATALOGUE_NODE_SCHEMA = "folio-catalogue-node/v1";

/** The global Handle System resolver. */
const HANDLE_RESOLVER = "https://hdl.handle.net/";

export type AddressKind = "agent" | "role" | "plan" | "entity";

/** A value's address, or why it has none. */
export type Address = { iri: string } | { unaddressed: string };

export interface AddressBook {
  resolve(kind: AddressKind, value: string): Address;
}

interface Owned {
  /** Instance root, absolute. */
  root: string;
  /** Path inside the instance, without extension, `/`-separated. */
  path: string;
  fragment?: string;
}

function* filesUnder(dir: string, ext: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e.startsWith(".")) continue;
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) yield* filesUnder(p, ext);
    else if (e.endsWith(ext)) yield p;
  }
}

const rel = (root: string, file: string): string => relative(root, file).split("\\").join("/").replace(/\.[^/.]+$/, "");

/**
 * The address book for a checkout: who owns each actor, role and process, and
 * at what release address. Built once; nested instances are their own owners
 * (`instanceRootsIn`), so a process file is attributed to the DEEPEST instance
 * holding it.
 */
export function addressBook(repo: string): AddressBook {
  const roots = instanceRootsIn(repo).sort((a, b) => b.length - a.length);
  const owner = (file: string): string | undefined => roots.find((r) => file.startsWith(`${r}/`));
  const actors = new Map<string, Owned>();
  const roles = new Map<string, Owned>();
  const plans = new Map<string, Owned>();

  for (const root of roots) {
    // The instance's own declared `scenarios` graph, never a composed path:
    // an instance that declares none holds no actors or roles to address.
    const scenarios = instanceDirectoryForGraph(root, "scenarios");
    if (!scenarios) continue;
    const actorDir = join(scenarios, "actors");
    for (const f of existsSync(actorDir) ? readdirSync(actorDir).filter((x) => x.endsWith(".json")) : []) {
      const id = basename(f, ".json");
      if (!actors.has(id)) actors.set(id, { root, path: rel(root, join(actorDir, f)) });
    }
    const rolesFile = join(scenarios, "roles.json");
    if (existsSync(rolesFile)) {
      const doc = JSON.parse(readFileSync(rolesFile, "utf-8")) as { roles?: { id?: string }[] };
      for (const r of doc.roles ?? []) if (r.id && !roles.has(r.id)) roles.set(r.id, { root, path: rel(root, rolesFile), fragment: r.id });
    }
  }
  // `prov:used` names catalogue items (`item/<uuid>`, a DSpace id). Each
  // instance's declared `catalogue` graph holds `folio-catalogue-node/v1`
  // records; one with a Handle is addressed at the global Handle resolver,
  // the identifier that outlives the publishing host (owner 2026-10-01,
  // option A). The same rule as `handleIri` in folio-assistant-core's
  // catalogue schema, restated because importing it here would be an edge
  // from the platform up into core.
  const entities = new Map<string, Address>();
  for (const root of roots) {
    const dir = instanceDirectoryForGraph(root, "catalogue");
    if (!dir) continue;
    for (const f of filesUnder(dir, ".json")) {
      let n: { $schema?: unknown; id?: unknown; handle?: unknown };
      try {
        n = JSON.parse(readFileSync(f, "utf-8")) as typeof n;
      } catch {
        continue;
      }
      if (n.$schema !== CATALOGUE_NODE_SCHEMA || typeof n.id !== "string" || entities.has(n.id)) continue;
      entities.set(
        n.id,
        typeof n.handle === "string"
          ? { iri: `${HANDLE_RESOLVER}${n.handle}` }
          : { unaddressed: `catalogue record ${rel(repo, f)} carries no Handle` },
      );
    }
  }

  for (const f of filesUnder(repo, ".bpmn")) {
    const root = owner(f);
    if (!root) continue;
    const stem = basename(f, ".bpmn").toLowerCase();
    if (!plans.has(stem)) plans.set(stem, { root, path: rel(root, f) });
  }

  const addressOf = (o: Owned, fragment?: string): Address => {
    const decl = readDeclaration(o.root);
    const r = releaseIris(decl ?? undefined);
    if (!r) return { unaddressed: `${decl?.name ?? basename(o.root)} declares no iriBase, so ${o.path} has no release address` };
    const frag = fragment ?? o.fragment;
    return { iri: `${releaseIri(r, o.path, "agent")}${frag ? `#${frag}` : ""}` };
  };

  return {
    resolve(kind, value) {
      if (kind === "agent") {
        const o = actors.get(value);
        return o ? addressOf(o) : { unaddressed: `no instance in this checkout declares actor "${value}"` };
      }
      if (kind === "role") {
        const o = roles.get(value);
        return o ? addressOf(o) : { unaddressed: `no instance in this checkout declares role "${value}"` };
      }
      if (kind === "entity") {
        return entities.get(value) ?? { unaddressed: `no instance in this checkout catalogues "${value}"` };
      }
      const [stem, task] = value.split("#") as [string, string | undefined];
      const o = plans.get(stem.toLowerCase());
      return o ? addressOf(o, task) : { unaddressed: `no .bpmn named ${stem} in this checkout` };
    },
  };
}

/** One unaddressed value, for the report to carry as a finding. */
export interface Unaddressed {
  activity: string;
  kind: AddressKind;
  value: string;
  why: string;
}

/**
 * An address book's verdict as JSON-LD: a link (`{"@id"}` under a term that
 * coerces, so a plain string) or an explicit literal that the coercion cannot
 * touch.
 */
function valueFor(a: Address, raw: string): string | { "@value": string } {
  return "iri" in a ? a.iri : { "@value": raw };
}

/**
 * The PROV-JSONLD document for one report. `@base` sits in the document's OWN
 * context, not the remote one, where JSON-LD 1.1 §4.1.3 says it is ignored
 * (rule `ld-no-base-in-a-remote-context`). `cat-harness:underPolicy` is defined
 * as a term so its absolute policy IRIs are links rather than strings.
 */
export function provJsonldDocument(
  id: string,
  activities: readonly ProvActivity[],
  book: AddressBook,
): { document: Record<string, unknown>; unaddressed: Unaddressed[] } {
  const unaddressed: Unaddressed[] = [];
  const graph: Record<string, unknown>[] = [];
  for (const a of activities) {
    const q = a["prov:qualifiedAssociation"];
    const field = (kind: AddressKind, raw: string) => {
      const ad = book.resolve(kind, raw);
      if ("unaddressed" in ad) unaddressed.push({ activity: a["@id"], kind, value: raw, why: ad.unaddressed });
      return valueFor(ad, raw);
    };
    graph.push({
      "@id": a["@id"],
      "@type": "Activity",
      startTime: a["prov:startedAtTime"],
      ...(a["prov:endedAtTime"] ? { endTime: a["prov:endedAtTime"] } : {}),
      // `prov:used` is a compact-IRI KEY, not a context term, so no coercion
      // applies: a link has to be written as `{"@id"}` explicitly (rule
      // `ld-coercion-belongs-to-the-term`).
      ...(a["prov:used"]
        ? {
            "prov:used": a["prov:used"].map((u) => {
              const v = field("entity", u);
              return typeof v === "string" ? { "@id": v } : v;
            }),
          }
        : {}),
      "cat-harness:underPolicy": a["cat-harness:underPolicy"],
    });
    graph.push({
      "@type": "Association",
      activity: a["@id"],
      agent: field("agent", q["prov:agent"]),
      role: field("role", q["prov:hadRole"]),
      plan: field("plan", q["prov:hadPlan"]),
    });
  }
  return {
    document: {
      "@context": [
        PROV_JSONLD_CONTEXT_URL,
        {
          "@base": FOLIO_BASE,
          "cat-harness": CAT_HARNESS_NS,
          "cat-harness:underPolicy": { "@type": "@id" },
        },
      ],
      "@id": id,
      "@graph": graph,
    },
    unaddressed,
  };
}

/** The held context, read and checked against its pin; throws on drift. */
export function heldProvJsonldContext(repo: string): unknown {
  const file = join(repo, PROV_JSONLD_CONTEXT_HELD.path);
  const bytes = readFileSync(file);
  const sha = new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
  if (sha !== PROV_JSONLD_CONTEXT_HELD.sha256) {
    throw new Error(`${PROV_JSONLD_CONTEXT_HELD.path} has sha256 ${sha}, pinned ${PROV_JSONLD_CONTEXT_HELD.sha256}`);
  }
  return JSON.parse(bytes.toString("utf-8"));
}
