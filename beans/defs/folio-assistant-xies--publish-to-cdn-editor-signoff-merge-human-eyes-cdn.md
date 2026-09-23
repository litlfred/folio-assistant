---
# folio-assistant-xies
title: 'PUBLISH TO CDN: editor signoff -> merge -> human eyes -> CDN, and GH Pages is a TOOL CHOICE not the design'
status: in-progress
type: task
priority: high
created_at: 2026-09-20T09:01:32Z
updated_at: 2026-09-23T02:45:00Z
parent: folio-assistant-5a3l
---

Owner, 2026-09-20, naming the pipeline verbatim:

> 'using ghpages as CDN is a tool choice, other tools possible like cloudflare, doucment that in process/BPMNS/skills, part of publication piepleine, internal publication mamgement: (chief) editor signoff -> merge to main -> huamn eyes review last check -> publish to CDN (requires EXTREME care in URL handling) and make accessible from CDN'

FOUR GATES, and the third is the one that is easy to drop because the second looks like an approval:
1. (Chief) editor signoff — EDITORIAL, on the content.
2. Merge to main — the code gate. Already requires explicit human confirmation here.
3. HUMAN EYES, last check — on the RENDERED artefact, after the merge and before the world sees it. `continual-progress` already measured why this cannot be skipped: a human cannot assess a rendered artefact from a description of it (PR #178, 2026-09-16).
4. Publish to CDN, and make accessible — TWO steps, deliberately. Uploading and exposing are separable, and collapsing them removes the only moment at which a bad URL layout can still be caught.

'EXTREME care in URL handling' is the owner's phrase and it is a REQUIREMENT, not an adverb. What it is about, concretely: a published URL is a promise. Once `/<stub>/who-iris/items/<uuid>` is live and cited, moving it breaks every citation, and a CDN caches the old one for as long as its TTL says. `canonicalUrl` exists in `harness.json` for exactly this and nothing enforces a layout against it.

GH PAGES IS A TOOL CHOICE. `publication.host: github-pages` is already declared per instance and already documented as a THIRD STATE ('an instance that has not said is undefined, and must never be read as github-pages'). The process must be written against the declaration, never against Pages' behaviour — Cloudflare has different cache semantics, different redirect handling and different limits.

## Done when
- A BPMN with the four gates as real gateways in the right lanes.
- Host-specific behaviour reached through `publication.host`, never assumed.
- A URL-layout check that runs BEFORE publish and refuses a layout that would move an existing published path.

## 2026-09-20 — the pattern is named, and the trust anchor is decided

Owner reframed this as the general case, with who-iris as its worked example:

> update skils, this is doing webportal mockup as part of CRDM of kg. based on
> custom assets with need to defin a data ingestion pirpeline (subject ot
> operational/deployment constrsaints, $, network traffic, graph seize etc),
> from KG into a public portal. this is ecample creating a CDN to sit behind
> moodle … make a nice image to illustate architecture. bpmn for process. also
> generalize skils and tools.

Landed on this branch: the skill `kg-to-portal`, the process
`processes/kg-to-portal.bpmn`, the architecture drawing at
`cat-harness/docs/assets/img/kg-to-portal-architecture.svg`, and
`who-iris/docs/kg-to-portal.html` as the worked example with this instance's own
measured numbers.

### The distinction the whole thing turns on

**A CDN is not a publication host; it is a layer in front of one.**
`PUBLICATION_HOSTS` answers *what serves the rendering*. A cache answers *what
stands between the server and the reader*. This bean already said "GH Pages is
a TOOL CHOICE"; this is the other half of the same thought, and it is what
makes *"EXTREME care in URL handling"* actionable — model the cache as the host
and the published URL becomes the cache's, so the day the cache changes every
citation breaks and the old URL stays warm for as long as its TTL says.

**Do not add a CDN value to `PUBLICATION_HOSTS`.** A fifth value with no row in
`deployment-topologies.md` is a vocabulary nobody agreed, and this one would
also be wrong.

### Signing: GDHCN

Owner, answering the open question in one line: **`propsal signing = GDHCN`** —
the WHO Global Digital Health Certification Network.

What it settles is **where trust comes from**, not which algorithm is used, and
that moves a boundary:

- the publisher signs **as a participant**, so signing capability is granted
  and can be withdrawn — key rotation and revocation become operations the
  pipeline must survive, and a package signed with a withdrawn key must be
  re-signed rather than merely re-served;
- the verifier resolves the key **from the network**, so it needs reachability
  the publisher does not control. A portal that fetches the bytes but cannot
  reach the trust list reports `unknown` — not a failure. `network:
  air-gapped` is a declared value, so that is a case to answer rather than
  assume away;
- the trust anchor sits **outside** publisher and consumer alike, which is the
  whole reason it is worth having, and is how it is drawn.

**Four things are open against GDHCN's specification and are NOT asserted
anywhere on this branch.** GDHCN is named in this repository for the first time
today and the network that would fetch the document is blocked from the
container (`000` to `worldhealthorganization.github.io`):

1. what envelope it signs, and whether that admits a **file manifest** at all —
   it was built for health certificates;
2. how a participant is onboarded, and by whom (an institutional process with a
   lead time, not a configuration flag);
3. the key rotation and revocation model;
4. whether a verifier may cache the trust list, and for how long — which
   decides whether an intermittently-connected portal can verify at all.

(1) may also settle the package-versus-per-asset question by constraint rather
than by choice, which is why the specification has to be read before this is
designed rather than after.

### What who-iris has actually built, measured 2026-09-20

| stage | here |
|---|---|
| select | **partial** — everything in the catalogue is publishable, so the editorial cut has never had to refuse anything. An untested filter is not a working one |
| serialize | **built** — `kg-export`, and this catalogue's own JSON-LD |
| package | **not built** — no manifest, so nothing can detect a file that was *removed* |
| sign | **not built** — a per-bitstream `sha256` is a digest, not an attestation |
| distribute | **built** — Pages, with a jsDelivr route to the same bytes |
| verify | **not built** — and it is the stage that always gets dropped, because it is the only one that produces nothing when it passes |

### Still this bean's, unchanged

The four gates. Nothing above replaces them: this is *what* is published, and
the gates are *who says it may be*. The URL-layout check that refuses a layout
which would move an existing published path is still unbuilt.

### Same day: `smart-trust` names the specification, and it corrects the entry above

Owner followed `propsal signing = GDHCN` with one word: **`smart-trust`**. That
is the [WHO SMART Trust IG](https://smart.who.int/trust)
(`smart.who.int.trust`, FHIR R5, v1.8.0 as read, support `gdhcn-support@who.int`).
Read from `sushi-config.yaml` and `input/pagecontent/concepts_did_gdhcn.md` on
`main`, 2026-09-20. The endpoints below are **transcribed, not fetched** —
`tng-cdn.who.int` returns `000` from this container.

**THE CORRECTION.** The entry above says the publisher *"signs as a
participant"* and reads as though GDHCN supplies the signing envelope. **It
supplies the key distribution.** A trustlist carries trust anchors — which keys
belong to which participant, for which domain and which usage — and says
nothing about what you wrap your bytes in. The health-certificate envelope is a
separate specification in the same IG (`hcert_spec.md`), and *a document
package is not a health certificate*. What is settled is where a verifier
**gets the key**; what it verifies is still open.

That is the `r1lz` rule catching its own enforcer. The first draft was
plausible and confident, and the part it got wrong — envelope versus key
distribution — is the part that decides what stage 4 *is*.

**What the IG actually specifies:**

- key material published as **W3C DID documents** (`did.json`);
- **two variants** — *embedded* (keys inline in `verificationMethod`, immediate
  verification) and *by reference* (DID ids to resolve, keeping the root
  document concise and supporting dynamic discovery);
- **three environments** — DEV, UAT, PROD — each with both variants;
  PROD is `https://tng-cdn.who.int/v2/trustlist/did.json` and
  `…/v2/trustlist-ref/did.json`;
- **the path is a hierarchical filter**:
  `/v2/trustlist/$domain/$participant/$usage/did.json`, levels ANDed, `-` a
  wildcard at any level, so a verifier fetches the slice it needs;
- `$domain`, `$participant`, `$usage` are **FHIR ValueSets in the IG**, not
  free text.

**The strongest argument this design has, and it is not ours.** WHO's own trust
network distributes its trust anchors as **static JSON from a CDN** — the host
is named `tng-cdn`. So "KG → static signed package → CDN → consumer" is not an
analogy to how GDHCN works; it is how GDHCN works, one layer down. The
*by reference* variant also answers the caching question outright: resolving a
slice is the expected case.

**Three of the four questions above are now answered** — onboarding (a
documented process plus a published
[checklist](https://smart.who.int/trust/concepts_onboarding_checklist.html)),
caching (native to the design), and the envelope (a trustlist is keys; the
envelope is elsewhere and, for a document package, unsettled).

**Still open and unread:**

| question | where |
|---|---|
| key rotation and revocation, and what a published package must do when a key is withdrawn | `concepts_certificate_governance.md` |
| whether a document-package signature can be expressed for a GDHCN-aware verifier at all | nothing in that IG covers arbitrary files |
| how the gateway relates to the CDN, and who publishes to it | `trust_network_gateway_architecture.md` |

Read those before designing stage 4. **Not ingested** — owner: *"dont ingest
whole thing."* Two files were read over HTTP and nothing was cloned or added to
`library/`.

---

## Re-parented off `kupb` 2026-09-23 — owner's ruling

Owner, 2026-09-22, on *"`kupb` has 12 open children and can't close, blocking
GOAL 3. Several aren't IRIS-catalogue work"*: **re-parent the non-catalogue
ones.** `kupb`'s Done-when is *"every child is closed"*, so a child that is not
about the IRIS catalogue holds GOAL 3 open for a reason unrelated to GOAL 3.

**Moved to `5a3l`.** "editor signoff -> merge -> human eyes -> CDN, and GH Pages is a TOOL CHOICE" — a publication topology, and the bean says so.

**Nothing about this bean's own work changed** — not its status, not its
Done-when, not a line of its body above this note. Only the question *"whose
goal does finishing this serve?"* is answered differently.
