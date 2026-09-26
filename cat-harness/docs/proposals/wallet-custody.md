---
title: "Wallet custody in a self-sovereign harness"
kind: proposal
issue: 370
bean: folio-assistant-61tg
summary: >-
  Owner, 2026-09-24: in self-sovereign mode the harness MAY hold credentials. This reverses the strawperson, which said the harness only produces artefacts. Holding a person's credentials is a security design in its own right. This proposal states what has to be decided before any code, and decides none of it.
---

# Wallet custody in a self-sovereign harness

**Status: proposal, CRDM Phase 1 (needs).** No code is written against it.

## What changed

Issue #363 described self-sovereign mode as *"hosted on own infrastructure …
not designed for external facing services. more for managing wallets. have
incoming DAK content."* The strawperson in bean `61tg` read "managing wallets"
narrowly: **the harness produces artefacts that wallets consume, and holds
nobody's credentials.** [Deployment topologies](deployment-topologies.md)
records it the same way, with `wallet` as a *data store* beside the harness
(axis 9) and never inside it.

Asked to choose on 2026-09-24, the owner picked **"It may hold credentials"**
over that position. From here on, the harness is a candidate *custodian*, and
this page is where that is argued before anyone builds it.

## Why this is a separate design

A harness that publishes a guideline can be wrong in public and corrected. A
harness that holds a person's credentials can leak or lose them, and that
cannot be undone. Everything below follows from that difference.

| | producer (the strawperson) | custodian (now in scope) |
|---|---|---|
| what it holds | content, schemas, a work plan | secrets that act for a person |
| worst failure | a wrong artefact, fixed by a new version | a disclosed or unusable credential |
| who is harmed | readers of the content | the person the credential belongs to |
| what the repository may contain | everything, committed | **no secret, ever**: see Q3 |

## Questions to settle, in order

1. **Whose credentials?** A person's own health credentials, an
   institution's signing keys, or both? They differ in who may use them and
   in who can revoke them.
2. **Hold, or broker?** Does the harness *store* a credential, or only
   *present* one held elsewhere (a hardware module, the person's own
   device)? Brokering keeps most of the risk outside the harness.
3. **Where do the bytes live?** The repository is committed and shared by
   design, so it cannot hold a secret. Candidates are an OS keystore, a
   hardware module, or an encrypted store outside the checkout. The existing
   `materialization` model covers bytes that are *here*; a secret needs a
   state that is here but never published.
4. **Who may act with it?** The actor model (`role-model`) has human,
   agentic and mechanical actors. May an **agent** ever use a person's
   credential, or only present it for a person to approve? The
   permissions registry would have to say so, per actor.
5. **Audit.** Every use leaves a record, and that record contains no secret.
   Is `activity-log` the right home, or does custody need its own
   append-only log?
6. **Air-gapped operation.** Self-sovereign may be `air-gapped`. Revocation
   and expiry checks normally need the network. What happens offline?
7. **Which standards?** Verifiable credentials and wallet formats are
   external standards. Which one(s), and at which layer? None of them
   belongs in bootstrap (issue #1164's rule).

## What is not being proposed

- No change to the published site, the folio format or any existing tool.
- No credential handling in any other topology. Sovereign cloud stays
  outward-facing and custody-free unless decided separately.
- No decision on the questions above. Each is the owner's, one at a time.

## Next step

The CRDM process continues from Phase 1 on issue #370: confirm the needs,
then write requirements statements. When the feature ships, this page moves
to `docs/requirements/` with its front matter filed as a `Requirement`.
