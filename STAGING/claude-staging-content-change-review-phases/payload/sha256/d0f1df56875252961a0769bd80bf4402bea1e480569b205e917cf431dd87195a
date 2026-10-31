---
name: iris-cdn-signing
description: >
  How an IRIS CDN release is packaged, signed and verified using published
  standards only: a BagIt bag (RFC 8493), a detached JWS (RFC 7515 App. F)
  with ES256 (RFC 7518), and the key published in a did:web DID document whose
  publicKeyJwk carries an x5c chain up to WHO's signing key. No GDHCN trust
  list is assumed.
graph-typologies:
  - catalogue
---

# Signing and verifying an IRIS CDN release

The code is `scripts/iris-cdn/bag.ts` and `scripts/iris-cdn/signing.ts`. The
process is `processes/iris-cdn-sign-publish.bpmn`.

## Standards used, and nothing else

| Piece | Standard |
|---|---|
| Package and digests | BagIt 1.0, **RFC 8493**: `bagit.txt`, `bag-info.txt`, `manifest-sha256.txt`, `tagmanifest-sha256.txt` |
| Signature | JWS compact serialization with a **detached payload**, **RFC 7515** Appendix F |
| Algorithm | `ES256`, ECDSA on P-256 with SHA-256, **RFC 7518** §3.4. It is the same curve as WHO's signing DID key. `EdDSA` (RFC 8037) is accepted when verifying |
| Public key | JWK, **RFC 7517**, as `publicKeyJwk` |
| Trust chain | `x5c` in the JWK (**RFC 7517** §4.7): X.509 certificates, leaf first, ending at one issued by WHO's signing key |
| Key publication | W3C **DID Core 1.0** document, `verificationMethod` of type `JsonWebKey` (W3C **Controlled Identifiers 1.0**) or `JsonWebKey2020`, which is the form WHO's own DID uses. Both are accepted |
| DID method | **`did:web`**, approved by the owner |

No draft standards are used. A new one needs the owner's explicit approval.

## What is signed

There is **one release signature**, over the bytes of
`tagmanifest-sha256.txt`, plus one signature per changed library item (below). That file pins the SHA-256 of every other tag file,
and `manifest-sha256.txt` pins the SHA-256 of every payload file. Signing the
tag manifest therefore covers the whole bag.

The signature is stored beside the tag manifest as
`tagmanifest-sha256.txt.jws`, in the form `<header>..<signature>`. The empty
middle segment is the detached payload. The protected header is
`{"alg":"ES256","kid":"did:web:…#<key>"}`.

ECDSA signatures are randomized. Signing the same bytes twice gives two
different signatures, so unchanged content is **never re-signed**. Only what
the manifest diff reports as changed gets a new signature.

## A signature on each library item

The owner chose this on 2026-10-30 (Q4, option A). Every library item has its
own manifest at `items/<handle>/manifest-sha256.txt`, in the same line format
as the BagIt payload manifest. It lists the item's record,
`records/<handle>.json`, and every file under `bitstreams/<handle>/`. The
item's detached JWS is stored beside it as `manifest-sha256.txt.jws`.

- **An item verifies on its own.** Fetch its manifest and JWS, verify the JWS
  against the DID document and its `x5c` chain, then check each digest.
- **The release signature proves completeness.** The item manifests and their
  JWSs are payload files, so the release tag manifest pins them all. Nothing
  can be added or removed without breaking the release signature.
- **Only changed items are signed.** If an item's manifest bytes did not
  change, its existing JWS is kept (`signItems` in `scripts/iris-cdn/run.ts`).
  A metadata-only edit changes the record digest, so that item is re-signed
  while its PDF digest stays the same.

An unchanged night produces the same tag manifest, so it gets no new
signature.

## Where the key comes from

The verifier resolves the `kid`'s DID **from the web**, never from the
package:

- `did:web:<cdn-domain>` resolves to `https://<cdn-domain>/.well-known/did.json`,
  and `did:web:<cdn-domain>:iris` resolves to `https://<cdn-domain>/iris/did.json`.
  The DID is the one that already publishes the subordinate key. It must be stable, because the DID *is* the
  signer's identity.
- The key must be listed under `assertionMethod`. A retired key stays in
  `verificationMethod` so that old releases still verify, but it is removed
  from `assertionMethod`. A signature by that retired key on a *new* release
  then fails.

If the DID document cannot be fetched, the verdict is **`unknown`**, not
`failed` and not `verified`. A portal that cannot check says so.

**The trust chain.** Our key's `publicKeyJwk.x5c` holds the certificates
that end at one issued by the key in WHO's signing DID,
`did:web:raw.githubusercontent.com:WorldHealthOrganization:tng-participants-prod:main:WHO:signing:DID`.
The verifier is given WHO's public key as its anchor, as the variable
`IRIS_CDN_TRUST_ANCHOR_JWK` in CI. Without an anchor, the chain is reported
as `not-checked`, never as verified.

Trust anchors other than this are not assumed. If the owner later wants a
trust list, such as GDHCN via WHO SMART Trust, it would be an *additional*
route to the same DID document, never a replacement for it.

## Key custody and rotation

- The private key is a JWK (`kty: EC`, `crv: P-256`, `x`, `y`, `d`). It never
  goes into git, a log or a bean. It is the GitHub **environment** secret
  `IRIS_CDN_SIGNING_JWK` in environment `iris-cdn-release`, which only jobs on
  `main` can read (owner, Q9).
- **The key already exists.** The subordinate key is already published in a
  DID document, with `x5c` up to WHO's signing DID, before the exporter runs.
  That publication is offline and outside these processes. No CI job issues
  certificates or edits the DID document.
- To rotate:
  1. Add the new key to the DID document and to `assertionMethod`.
  2. Publish the DID document.
  3. Sign the next release with the new key.
  4. Take the old key out of `assertionMethod`, and keep it in
     `verificationMethod`.
- The DID document is built in a fixed order, so republishing it with the
  same keys writes the same bytes.

## Verifying by hand

```sh
# 1. digests
cd bag && sha256sum -c manifest-sha256.txt && sha256sum -c tagmanifest-sha256.txt
# 2. signature
bun -e 'import {verifyDetached} from "./scripts/iris-cdn/signing.ts"; …'
```
