---
# folio-assistant-l9v6
title: 'DECISION (proposed): which CDN layer, if any, in front of the WHO L1 corpus (slide 2, #1614)'
status: todo
type: task
created_at: 2026-09-30T17:47:45Z
updated_at: 2026-09-30T17:47:45Z
parent: folio-assistant-5a3l
---

MADR decision record for slide 2 of the owner's deck `cat-harness/library/kg-folio-asst-2026-09-30` ("Accessing WHO L1 corpus"). Issue #1614. Parent: `xies` (publish to CDN).

## Status

**Proposed — no outcome.** Owner, 2026-09-30: record the options, decide later. Nothing has been measured at the scale slide 2 names, so an outcome here would be a guess.

## Context and problem statement

Slide 2 proposes unifying WHO's literature repository IRIS (DSpace) and the World Health Data Hub's indicators into one knowledge graph, with room to grow to about **10 TB**, served globally with high throughput and without high network costs. It names three forces: unpredictable egress fees when a cloud vendor bills by download volume; automated traffic, above all in emergencies, overloading internal systems; and the need to prove the authenticity and chain of custody of every published asset. Its drawing puts folio-assistant between an internal secure origin and a public CDN, and names **Cloudflare R2 + Cloudflare CDN**.

The repository already settles the shape, and this record does not reopen it: **a CDN is a layer in front of a publication host, not a host** (`kg-to-portal` skill), and `PUBLICATION_HOSTS` gains no CDN value. What is open is WHICH layer, if any, for a corpus of this size.

## Decision drivers

- MUST: no per-download egress billing that scales with public demand (slide 2's first force).
- MUST: signed assets whose signature survives the CDN (slide 2's third force; `kg-to-portal` covers package vs per-asset signatures and the GDHCN / SMART Trust position).
- MUST: stable published URLs; a CDN caches an old path for its TTL, so a moved path breaks citations (`xies`: "EXTREME care in URL handling").
- MUST: swappable; the process is written against `publication.host`, never against one vendor's behaviour (`xies`).
- WANT: capacity for about 10 TB without re-architecture.
- WANT: no second copy of provenance logic per vendor.

## Considered options

- **Cloudflare R2 storage + Cloudflare CDN** in front of the published origin, as slide 2 draws it.
- **GitHub Pages alone**, as every instance publishes today (`publication.host: github-pages`).
- **Another object store + CDN**: Amazon S3 + CloudFront, jsDelivr in front of the GitHub repository, or an institutional (WHO-operated) cache.

## Decision outcome

**None yet.** To decide, measure first: the actual size of the IRIS + Data Hub subset a folio would publish (`large-datasets` holds the IRIS descriptor, measured at 361.55 GB for IRIS as a whole), the request volume, and whether each option preserves the signature envelope end to end.

## Consequences

Whatever is chosen, and stated now so the choice cannot hide them:

- A CDN adds a second place a URL lives, and its TTL delays every correction.
- Any vendor's cache and redirect semantics differ from GitHub Pages'; the URL-layout check `xies` asks for must run before publish, against the declaration.

## Pros and cons of the options

### Cloudflare R2 + Cloudflare CDN
- Pro: R2's published pricing has no egress fee, which is slide 2's first force exactly.
- Pro: object storage sized in terabytes; a global edge network.
- Con: a commercial dependency outside WHO; its terms, not measured here, are the risk to record.
- Con: cache and redirect semantics differ from Pages', so URL handling needs its own tests.

### GitHub Pages alone
- Pro: already in production on every instance; no new vendor, no new credentials.
- Pro: no egress billing to the publisher.
- Con: GitHub documents a 1 GB limit on a published site and a soft bandwidth limit of 100 GB a month (as published by GitHub; not re-checked here). That is three to four orders of magnitude short of 10 TB.
- Con: not a place to put automated high-volume traffic.

### Another object store + CDN
- Pro: S3 + CloudFront is the most widely operated combination; an institutional cache keeps the data inside WHO.
- Con: S3 bills egress per gigabyte, the force slide 2 is written against.
- Con: jsDelivr serves from a GitHub repository or npm, so it inherits the repository's size limits rather than removing them.
- Con: an institutional cache has to be built and run by someone; nobody is named.

## Done when

- [ ] the corpus size a folio would actually publish is measured, not quoted from the slide
- [ ] the signature envelope is shown to survive the candidate layer(s)
- [ ] the owner records an outcome here, and the status moves to Accepted, or this is superseded
