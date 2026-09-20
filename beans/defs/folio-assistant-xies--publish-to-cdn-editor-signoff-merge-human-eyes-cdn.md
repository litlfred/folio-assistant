---
# folio-assistant-xies
title: 'PUBLISH TO CDN: editor signoff -> merge -> human eyes -> CDN, and GH Pages is a TOOL CHOICE not the design'
status: in-progress
type: task
priority: high
created_at: 2026-09-20T09:01:32Z
updated_at: 2026-09-20T21:23:04Z
parent: folio-assistant-kupb
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
`skills/workflows/kg-to-portal.bpmn`, the architecture drawing at
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
