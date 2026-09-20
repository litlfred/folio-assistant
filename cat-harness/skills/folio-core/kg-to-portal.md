---
name: kg-to-portal
description: >
  Getting a knowledge graph out to a public portal — the six stages between
  "the graph is in the repository" and "a reader's browser has the bytes", why
  a CDN is a layer rather than a publication host, and which decisions are the
  deployment's to make rather than the pipeline's.
---

# KG → package → distribution → portal

A knowledge graph is in a repository. A portal — a Moodle site, a ministry's
intranet, a department page — needs to show what is in it, to readers the
repository never hears about. **This is the shape of that path**, and it is
written as a pattern because who-iris built it by accident first and nothing
named it, so the next instance would have rebuilt it.

Owner, 2026-09-20:

> *"this is doing webportal mockup as part of CRDM of kg. based on custom
> assets with need to defin a data ingestion pirpeline (subject ot
> operational/deployment constrsaints, $, network traffic, graph seize etc),
> from KG into a public portal. this is ecample creating a CDN to sit behind
> moodle."*

## The one distinction that makes the rest fall out

**A CDN is not a publication host. It is a layer in front of one.**

`PUBLICATION_HOSTS` in `schemas/cat-harness.ts` is `github-pages`,
`local-server`, `jurisdiction-endpoint`, `none` — axis 3 of
[`deployment-topologies`](../../../fsh-guts/proposals/deployment-topologies.md).
Every value answers *what serves the rendering*. A CDN answers a different
question: *what stands between the server and the reader*. jsDelivr in front of
raw GitHub, Cloudflare in front of an origin, an institutional cache in front
of a ministry endpoint — the origin is unchanged in all three.

Getting that wrong has a specific cost, and it is the cost `xies` calls *"EXTREME
care in URL handling"*: if the CDN is modelled as the host, the published URL
becomes the CDN's URL, and the day the CDN changes every citation breaks. Model
it as a layer and the canonical URL stays the origin's, with the CDN as an
accelerated route to the same bytes.

**Do not add a CDN value to `PUBLICATION_HOSTS`.** A fifth value there without
a row in the proposal is a vocabulary nobody agreed, and this one would also be
wrong.

## The six stages

| # | stage | produces | who decides |
|---|---|---|---|
| 1 | **Select** | the subgraph that leaves | the deployment — see §"What the deployment decides" |
| 2 | **Serialize** | one JSON-LD document | the platform — `kg-export` already does this |
| 3 | **Package** | an addressable set of files with a manifest | the platform |
| 4 | **Sign** | a verifiable attestation over the package | the deployment picks the scheme |
| 5 | **Distribute** | bytes at an origin, optionally behind a cache | the deployment picks the transport |
| 6 | **Verify** | a portal-side check that what arrived is what was sent | the portal |

**Stage 1 is not "export everything".** `kg-export` produces the whole graph
because inspection wants the whole graph; a portal wants what its readers may
see. The two are different asks and running the second as the first is how a
`qa-review` verdict, a bean's blocking note or an unpublished draft reaches a
public cache. There is already a sentence about this in `cat-harness.ts` —
content *"stripped out of KG before sending to publication"* — and stage 1 is
where that happens, once, rather than at each consumer.

**Stage 6 is the one that gets dropped**, because stages 1–5 all produce
something visible and this one produces nothing when it passes. A package that
is signed and never verified is a package whose signature is decoration. If the
portal cannot verify, say so — `unknown` is a third state and a portal that has
not been asked is not a portal that checked.

## What the deployment decides, and the pipeline must not

Three decisions belong to the deployment. The owner named all three as
constraints rather than as preferences, and a diagram or a script that picks
one is asserting a decision nobody made.

**1. The ingestion method is UNDETERMINED.** Owner, verbatim: *"ingestion
method not determined."* Not "to be confirmed" and not "defaults to X" — the
pipeline is drawn with a decision point there, and the decision point stays
open until a deployment answers it. Candidates differ in every dimension that
matters (a pull from the portal, a push to an object store, a git fetch, a
signed tarball on a schedule) and the choice is governed by the constraints
below, not by which is nicest.

**2. The store must be versioned, and which one is a deployment choice.**
Owner: *"need hosted git or suitable versioned storage for graph network like
KG. (can switch tooling based on deployment considerations)."* **Versioned is
the requirement; hosted git is one satisfaction of it.** A portal that shows a
graph needs to be able to say *which* graph — an unversioned store cannot
answer "what did this look like last term", which is the question a course
reading list asks every year.

**3. The distribution transport.** GitHub Pages is a tool choice — `xies`
carries that verbatim — and so is jsDelivr, Cloudflare, or an object store.
Reach host behaviour through `publication.host`, never by assuming Pages'
behaviour. The axes already record why this matters: Pages **cannot** serve
`application/ld+json`, and a local server can.

## The constraints the choice is made under

Owner: *"subject ot operational/deployment constrsaints, $, network traffic,
graph seize etc."* Four, and each needs a **denominator** before it can be
argued with:

| constraint | the number it needs | where one comes from |
|---|---|---|
| **money** | cost per GB served, and per GB stored | the host's price list; a free tier is a number too |
| **network traffic** | bytes × requests, per publication period | the package's own size and the portal's reader count |
| **graph size** | nodes and edges, and bytes of the serialization | `kg-export` reports it; who-iris's catalogue reports items, files and bytes separately |
| **latency** | where the readers are against where the origin is | the deployment's own geography |

**A constraint with no denominator is a preference.** "The graph is too big" is
not a finding; "6.2 MB per publication × 400 readers per week against a 100 GB
free tier" is. This is the same rule `materialization`'s `size` gate already
keeps — *"3 items of 361.55 GB is a fraction, and '3 items' alone is not"*.

**Measure, and say when you could not.** `cdn.jsdelivr.net` is egress-blocked
from this repository's own CI container, so no figure about it can be measured
here. A figure taken from a vendor's documentation is a *quoted* figure and
says so; one taken from a chat message is neither, and the who-iris catalogue
carries the worked example — every note in a branch said "0.7 TB", sourced from
a chat message, and the measured figure was about half.

## Signing: the trust anchor is GDHCN, and that moves the boundary

Owner, 2026-09-20, answering the open question: **`propsal signing = GDHCN`**
— the WHO **Global Digital Health Certification Network**.

**What this settles is not the algorithm; it is where trust comes from.** A
self-contained signature ships the key, or its certificate, inside the package,
and a verifier decides whether to believe it. A trust-network signature does
not: the verifier resolves the signer's key **from the network**, and the
package carries only enough to say which key it wants. The consequence is
architectural rather than cryptographic:

- **The publisher signs as a participant**, not as itself. Signing capability
  becomes something a deployment is granted and can lose, so key rotation and
  revocation are operations the pipeline has to survive — a package signed with
  a key later withdrawn must be re-signed, not merely re-served.
- **The verifier needs the network, not just the bytes.** A portal that can
  fetch the package but not reach the trust list cannot verify, and that is
  `unknown` rather than a failure. An offline portal is a real deployment —
  `network: air-gapped` is a declared value — so this is a case the design has
  to answer rather than assume away.
- **The trust anchor is outside all three zones** in the architecture drawing,
  and that is deliberate: it belongs to neither the publisher nor the consumer,
  which is the whole reason it is worth having.

### What is NOT established here, and must be before anything is built

GDHCN is named in this repository for the first time on 2026-09-20, and the
network that would fetch its specification is blocked from this container — a
request to `worldhealthorganization.github.io` returns `000`. So the following
are **open questions to put to the specification**, not facts:

| question | why it decides the design |
|---|---|
| what envelope does GDHCN sign, and does it admit a **file manifest** at all? | it was built for health certificates; a package of documents may or may not fit the same envelope |
| how is a participant onboarded, and by whom? | this is an institutional process with a lead time, not a configuration flag |
| what is the key rotation and revocation model? | it sets whether a published package can ever be left alone after publishing |
| can a verifier cache the trust list, and for how long? | it decides whether an intermittently-connected portal can verify at all |

**Nothing about GDHCN's mechanism is asserted above from general knowledge.**
That is the `r1lz` rule — *a voice with no provenance is the same class of
defect as a measurement with no date* — and this is exactly the situation it
exists for: the name is the owner's, the consequences follow from what a trust
network *is*, and the specifics wait for the document.

## Package or per-asset: still a choice, and GDHCN does not make it

| | signs | a verifier needs | breaks when |
|---|---|---|---|
| **package signature** | one manifest listing every file and its digest | the manifest, the signature, one public key | any file changes — the whole package is re-signed |
| **per-asset signature** | each file independently | the file, its signature, one public key | only that file — the rest stay valid |

A package signature is cheaper to produce and verifies the *set*: a reader
learns that no file was added, removed or altered. A per-asset signature
verifies each file on its own, which is what an edge cache serving one asset to
one reader can actually check — and it cannot detect a file that was *removed*,
because there is nothing left to verify.

**They compose**: per-asset signatures with a signed manifest over them gives
both properties. That is the safer default and the more expensive one, and it
is a deployment decision rather than a pipeline one.

Choosing GDHCN as the trust anchor leaves this open, and may constrain it: if
the envelope admits only one payload shape, the manifest-versus-asset question
is answered by what can be put in it. Another reason the specification has to
be read before this is designed rather than after.

## Related

- [`kg-export`](kg-export.md) — stage 2, already built. Host-agnostic by
  design, and nothing in it should name a host.
- Bean `xies` — the **publication** gates: (chief) editor signoff → merge →
  human eyes on the rendered artefact → publish. This skill is what is being
  published; that bean is who says it may be.
- [`deployment-topologies`](../../../fsh-guts/proposals/deployment-topologies.md)
  — the ten axes, four of them declared, and why absent is a third state.
- [`asset-extraction`](asset-extraction.md) §"Derived renderings" — what a
  package may contain that the source never supplied, and how it must say so.
- `who-iris/` — the worked example, with its own page under `who-iris/docs/`.
