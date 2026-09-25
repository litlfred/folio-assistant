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

### The contract is the SKILL. This bean is the work-plan entry.

> [`cat-harness/skills/folio-core/kg-to-portal.md`](../../cat-harness/skills/folio-core/kg-to-portal.md)

It carries the owner's words verbatim, the one distinction the design turns on
(**a CDN is not a publication host; it is a layer in front of one**, and why
`PUBLICATION_HOSTS` gains no CDN value), the six stages with who decides each,
the constraints and their denominators, and the whole GDHCN / WHO SMART Trust
position — what the trustlist settles, what it does not, and the three
questions still unread.

**This bean restated all of that, at length, and the restatement was still in
step on 2026-09-24 — which is the reason to remove it now rather than later.**
A copy that agrees is a copy that has not drifted *yet*; the GDHCN section in
particular is explicitly provisional, resting on three specification files
nobody here has read (`concepts_certificate_governance.md`, `hcert_spec.md`,
`trust_network_gateway_architecture.md`), so the day somebody reads one, this
bean becomes a second and wrong answer about what is settled. The skill's own
§Related already divides the labour and this bean agreed with it — *"This skill
is what is being published; that bean is who says it may be"* — so the copy was
surplus to a split both texts state.

Removed per `AGENTS.md`'s rule: *where a skill and a copy disagree, the skill
wins and the copy is wrong*, applied one step earlier, before they disagree.

**Nothing was lost.** Checked line by line before deleting: the CDN-as-layer
distinction, the `PUBLICATION_HOSTS` prohibition, the DID trustlist's two
variants and three environments, the hierarchical path filter, the
ValueSet-not-free-text point, the envelope-versus-key-distribution correction
and the three unread questions are all in the skill, most of them in more
detail than here. What follows is only what a WORK PLAN needs.

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


## Re-parented off `kupb` 2026-09-23 — owner's ruling

Owner, 2026-09-22, on *"`kupb` has 12 open children and can't close, blocking
GOAL 3. Several aren't IRIS-catalogue work"*: **re-parent the non-catalogue
ones.** `kupb`'s Done-when is *"every child is closed"*, so a child that is not
about the IRIS catalogue holds GOAL 3 open for a reason unrelated to GOAL 3.

**Moved to `5a3l`.** "editor signoff -> merge -> human eyes -> CDN, and GH Pages is a TOOL CHOICE" — a publication topology, and the bean says so.

**Nothing about this bean's own work changed** — not its status, not its
Done-when, not a line of its body above this note. Only the question *"whose
goal does finishing this serve?"* is answered differently.
