---
# folio-assistant-ffv7
title: 'ASK DOWNSTREAM: would a kg-to-portal consumer read SPDX (SBOM or licence ids)? D1 of the SPDX proposal waits on it'
status: todo
type: task
created_at: 2026-10-03T10:44:28Z
updated_at: 2026-10-03T10:44:28Z
parent: folio-assistant-zzmr
---

Owner, 2026-10-03, after the SPDX 3 analysis (bean `sd5v`) found that **nothing
consumes an SPDX document** today: *"Ask a consumer first"*, then *"leave a bean
to ask downstream user feedback"*.

## Why this exists

The applicability proposal
(`cat-harness/docs/proposals/spdx-3-applicability-2026-10-03.md`) rated a
release SBOM and an SPDX `kg-to-portal` manifest as worth building **if** a
consumer reads them. No consumer has been named. GitHub's dependency graph
already exports an SPDX 2.3 SBOM of `bun.lock` for anyone who wants one, so
building our own is justified only by a downstream party asking. Decision D1 of
that proposal is **waiting on this answer**.

Licence-id validation against the SPDX License List went ahead regardless
(owner: *"go ahead with licence-id validation, that's it for now"*); it does not
depend on this.

## Who to ask

The parties who receive `kg-to-portal` packages, or would: the GDHCN / WHO
SMART Trust side, and any portal operator (the Moodle/ministry case in
`skills/kg/kg-core/kg-to-portal.md`). The owner sends it; an agent never
contacts them.

## The question, ready to send

> **Subject: Would you use an SBOM (SPDX) with the content packages we send you?**
>
> We publish knowledge-graph content (WHO SMART Guidelines material and its
> documentation) as packages: a set of JSON-LD files, a manifest of their
> SHA-256 digests, and a signature over the whole. Before we build anything
> more, we would like to know what you would actually read. With each package
> we could provide: (1) the digest manifest only; (2) an SPDX 3.0 document
> (JSON-LD) listing every file with its hash and its licence as an SPDX
> licence id, plus the package's dependencies; (3) licence information only,
> as SPDX ids; (4) nothing beyond the signed package.
>
> - Would anything on your side read option 2 or 3 — a verifier, a registry, a
>   procurement or compliance check?
> - If you verify what arrives, which signature or attestation format do you
>   expect (GDHCN trust-network keys, JWS, in-toto/Sigstore, …)?
> - Does any policy — national, WHO or procurement — require an SBOM from
>   content or software suppliers to you?
>
> "No, the digest manifest is enough" is a useful answer: it saves us building
> something nobody reads.

## What each answer decides

| answer | then |
|---|---|
| nobody reads SPDX | scrap D1's build items (M2 release process, M3 `sbom_export`, M7 graph kind); keep the vocabulary-only adoption; record the answer on `sd5v` |
| a consumer wants option 3 | emit `dcterms:license` with SPDX License List IRIs in the published manifests — no SPDX documents |
| a consumer wants option 2 | build M3 + the `kg-to-portal` SPDX manifest (proposal §7–§8), in the format and signature they name |
| a policy requires an SBOM | as option 2, plus the release SBOM (M2), with the policy cited as the requirement |

## Done when
- [ ] the owner has sent the question to at least one downstream party
- [ ] an answer (or a recorded non-answer after a stated wait) is appended here
- [ ] proposal D1 updated with the answer, and `sd5v` notified
