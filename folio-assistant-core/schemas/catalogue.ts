/**
 * A remote catalogue, modelled in the graph without holding it.
 *
 * @module schemas/catalogue
 * @graphNode schema
 *
 * ## The ask, and why it is not "import IRIS"
 *
 * The owner, 2026-09-20: *"in just the docs rendering, mock up the full iris
 * catalog as having been in the KG (by referenced, not slurped up, its .7tb)"*
 * and *"stub out their hierachy (collections, etc,) and put this in there. as
 * if this is test import."*
 *
 * So the graph carries the SHAPE of a catalogue at full extent while holding
 * bytes for a handful of nodes. Every node declares its
 * {@link module:schemas/materialization} state, and the rendering shows the
 * difference, because a tree that looks the same whether or not the bytes are
 * there is a tree that lies about the corpus.
 *
 * ## Generic, though IRIS is the worked instance
 *
 * DSpace's containment is community → sub-community → collection → item →
 * bitstream, and every one of those words is DSpace's. This type uses
 * `container` and `item` instead, with a `flavour` naming the source system's
 * own word, for the reason `Theme` takes a `kind` rather than splitting into
 * three node types: one vocabulary with a discriminator beats three spellings
 * of "the thing that contains things". An OAI-PMH set, a Zenodo community and
 * a plain S3 prefix are the same shape; only the word differs.
 *
 * The IRIS-specific reading — that a DSpace UUID, a Handle and a WHO govdoc
 * number are three identifier systems with different authority behind them —
 * is in the `who-iris` instance's `iris-dspace` skill, where it can be argued
 * with. It is not in this schema, which would make it look like a property of
 * catalogues in general.
 *
 * ## Containment is a PATH, not a parent
 *
 * The measured breadcrumb on the one item this repository has captured is
 * *Home → 7. Regional Office for the … → Regional Office for the W… → Information
 * products*. Four levels, of which two are communities and one a collection,
 * and DSpace permits an item to be mapped into more than one collection. So
 * `parents` is a list of paths, not a single id, and a consumer walking "the"
 * parent of a node is already wrong on real data.
 */
import { z } from "zod";
import { MaterializationSchema } from "./materialization.js";

export const CATALOGUE_SCHEMA_TAG = "folio-catalogue/v1";
export const CATALOGUE_NODE_SCHEMA_TAG = "folio-catalogue-node/v1";

/**
 * What kind of node this is in the containment tree.
 *
 * Two, not five. DSpace's community / sub-community / collection distinction
 * is a rule about what may contain what, not three different kinds of thing —
 * and the rule differs per source system, so encoding it in the union would
 * make the union source-specific. `flavour` keeps the source's own word.
 */
export const CATALOGUE_NODE_KINDS = ["container", "item"] as const;
export type CatalogueNodeKind = (typeof CATALOGUE_NODE_KINDS)[number];

/**
 * One file belonging to an item.
 *
 * DSpace groups these into BUNDLES ("Original bundle" in the measured record),
 * so an item is not one file and `bitstreams` is not `file`. Size and format
 * are per-bitstream: the 2.68 MB in the record is the PDF's, not the item's.
 */
export const BitstreamSchema = z
  .object({
    name: z.string().min(1),
    bundle: z.string().min(1).default("ORIGINAL"),
    bytes: z.number().int().nonnegative().optional(),
    mediaType: z.string().min(1).optional(),
    /** Its own materialisation state. An item may be referenced while one of its bitstreams is materialised — which is exactly the worked example. */
    materialization: MaterializationSchema,
  })
  .strict();
export type Bitstream = z.infer<typeof BitstreamSchema>;

export const CatalogueNodeSchema = z
  .object({
    $schema: z.literal(CATALOGUE_NODE_SCHEMA_TAG),
    id: z.string().min(1),
    kind: z.enum(CATALOGUE_NODE_KINDS),
    /** The source system's own word for this node — `community`, `collection`, `set`, `prefix`. Display and provenance only; nothing branches on it. */
    flavour: z.string().min(1).optional(),
    title: z.string().min(1),
    /**
     * Containment, as paths from the catalogue root. A LIST, because an item
     * may be mapped into several collections and because the breadcrumb on the
     * one measured item is four levels deep.
     */
    parents: z.array(z.array(z.string().min(1))).default([]),
    /**
     * How many children the SOURCE says this container has — not how many are
     * modelled here. The gap between the two is the whole point of a catalogue
     * by reference, and a renderer that counted `children.length` would report
     * the model's size as the collection's.
     */
    childCountUpstream: z.number().int().nonnegative().optional(),
    /** The local library slug, where this item has been ingested. Present iff something under `library/` corresponds. */
    libraryId: z.string().min(1).optional(),
    /** The item's metadata record, by reference to a `folio-dublin-core/v1` file. */
    metadataRef: z.string().min(1).optional(),
    bitstreams: z.array(BitstreamSchema).default([]),
    materialization: MaterializationSchema,
  })
  .strict()
  .superRefine((n, ctx) => {
    if (n.kind === "container" && n.bitstreams.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "a container holds nodes, not bitstreams; an item holds bitstreams",
      });
    }
    if (n.libraryId && n.materialization.state !== "materialized") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          `node ${n.id} names libraryId "${n.libraryId}" but declares state ` +
          `"${n.materialization.state}". A slug under library/ IS the bytes being here; ` +
          "declaring otherwise makes corpus-grep and the catalogue disagree about what exists",
      });
    }
  });
export type CatalogueNode = z.infer<typeof CatalogueNodeSchema>;

/**
 * The catalogue itself.
 *
 * `totalBytesUpstream` and `totalItemsUpstream` are what make a `size` gate
 * answerable. Without them "three items are materialised" is a number with no
 * denominator, and the whole reason this import is by reference — 0.7 TB — is
 * a fact held only in a chat message.
 */
export const CatalogueSchema = z
  .object({
    $schema: z.literal(CATALOGUE_SCHEMA_TAG),
    id: z.string().min(1),
    title: z.string().min(1),
    /** The source system, e.g. `DSpace 7`. */
    system: z.string().min(1),
    baseUrl: z.string().url(),
    totalItemsUpstream: z.number().int().nonnegative().optional(),
    totalBytesUpstream: z.number().int().nonnegative().optional(),
    /** How the numbers above were arrived at. A denominator with no provenance is a denominator nobody can check. */
    sizeBasis: z.string().min(1).optional(),
    nodesDir: z.string().min(1).default("nodes"),
  })
  .strict();
export type Catalogue = z.infer<typeof CatalogueSchema>;

/** How much of a catalogue is actually here. The three counts are reported separately and never summed into a percentage, because a percentage of an unknown denominator is a number that looks checked. */
export function materializationCensus(nodes: CatalogueNode[]): Record<string, number> {
  const out: Record<string, number> = { unknown: 0, referenced: 0, materialized: 0 };
  for (const n of nodes) out[n.materialization.state] += 1;
  return out;
}
