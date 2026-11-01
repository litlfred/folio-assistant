# IRIS CDN Exporter: deployment

Where the [IRIS CDN Exporter processes](iris-cdn-export.md) run, where they
write, and where the secrets live.

The short version: **GitHub Actions runs the exporter. Cloudflare holds and
serves everything it exports. GitHub Pages only previews.**

## The pieces

| Piece | Service | Holds | Decided |
|---|---|---|---|
| Runner | GitHub Actions in `litlfred/who-iris` (`.github/workflows/iris-cdn.yml`) | nothing between runs | owner, Q8 |
| Release history | git repository on **Cloudflare Artifacts** (owner, Q11: history only) | BagIt tag files, `tagmanifest-sha256.txt.jws`, `state/cursor.json`, `state/initial-load.json`, run reports | owner: git on Cloudflare, not GitHub |
| Bytes | **Cloudflare R2** bucket | PDFs, item records, graph partitions (`.nq.gz`), each under `sha256/<aa>/<digest>` | owner, Q7 → R2 |
| CDN | Cloudflare, in front of R2 on a custom domain | cached copies only, with an immutable cache policy | owner: Cloudflare CDN |
| DID document | served from the CDN domain | `did.json` with the public key(s) | owner: `did:web` |
| Signing key | GitHub **environment secret** | the P-256 private JWK | owner, Q9 |
| Previews | GitHub Pages of `litlfred/who-iris` and `WHO/who-iris` | the site, reading exported data from the CDN; three materialized items for testing | owner |

## Cloudflare: what to set up

1. **Workers Paid plan**, $5 a month. Artifacts needs it, and it is in open
   beta. ([changelog](https://developers.cloudflare.com/artifacts/platform/changelog/))
2. **Artifacts namespace and repository.** Create the namespace in the
   dashboard. Then create the repository:
   `npx wrangler artifacts repos create who-iris-releases --namespace <ns>`.
   The remote is
   `https://<ACCOUNT_ID>.artifacts.cloudflare.net/git/<ns>/who-iris-releases.git`.
   A repository created now is capped at **1 GB**
   ([limits](https://developers.cloudflare.com/artifacts/platform/limits/)). That
   is why git holds only the release history, and the bytes go to R2.
3. **R2 bucket**, for example `who-iris-cdn`. Storage is about $0.015 per
   GB-month and egress is free, so ~361 GiB costs about $5.40 a month.
4. **Custom domain** on the bucket, which puts the Cloudflare CDN in front of
   it. Then add a **Cache Rule** with `Cache-Control: public,
   max-age=31536000, immutable` for `sha256/*`. Content-addressed objects
   never change, so they can be cached forever.
5. **API token** with permissions for Artifacts (edit) and the R2 bucket
   (object read and write). Scope it to this one account.

## GitHub: where each secret goes

In `litlfred/who-iris`, go to **Settings → Environments → New environment**
and name it `iris-cdn-release`.

- **Deployment branches:** `main` only. A job on any other branch cannot read
  these secrets.
- **Required reviewers:** none for the nightly run, so it stays unattended.
  The initial-load workflow uses a second environment,
  `iris-cdn-initial-load`, which does require the owner's approval.

| Name | Kind | Where | What |
|---|---|---|---|
| `IRIS_CDN_SIGNING_JWK` | secret | environment `iris-cdn-release` | the P-256 private JWK: `{"kty":"EC","crv":"P-256","x":…,"y":…,"d":…}` |
| `IRIS_CDN_TRUST_ANCHOR_JWK` | variable | repository | WHO's signing-DID public key (JWK), so verification checks the `x5c` chain. It is not secret |
| `CLOUDFLARE_API_TOKEN` | secret | environment `iris-cdn-release` | the API token from step 5 |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | secret | environment `iris-cdn-release` | R2's S3-compatible credentials, for uploads |
| `CLOUDFLARE_ACCOUNT_ID` | variable | repository | not secret |
| `IRIS_CDN_DID` | variable | repository | e.g. `did:web:<cdn-domain>` |
| `IRIS_CDN_ENABLED` | variable | repository | `true` turns the schedule on; anything else leaves it off |

The workflow never stores the Artifacts git token. Each run mints a write
token that lasts an hour
(`wrangler artifacts repos issue-token … --ttl 3600`) and passes it to git
as a `Bearer` header. It never goes in the remote URL.

**Given, not modelled here.** The subordinate signing key is already
published in a DID document, with `publicKeyJwk.x5c` chaining to WHO's signing
DID, and its private JWK is already in the GitHub environment secret
`IRIS_CDN_SIGNING_JWK`. How that key was created and certified happens
offline and outside these processes (owner, 2026-10-30). The exporter only
uses the key.

`IRIS_CDN_DID` is the DID that publishes that key, and `IRIS_CDN_KEY_ID` is the
key's fragment.

## What runs when

| Workflow trigger | Process | Environment |
|---|---|---|
| `schedule: 0 2 * * *` | nightly change ingest | `iris-cdn-release` |
| `schedule: 0 4 * * 0` | weekly reconciliation | `iris-cdn-release` |
| `workflow_dispatch` with `mode: initial-load` | initial load, one batch chain | `iris-cdn-initial-load` (reviewed) |

A job can run for at most 6 hours. The initial load therefore runs as a chain
of batch jobs. Each one commits its checkpoint to Cloudflare git, and the next
one resumes from that checkpoint.

## Previews on GitHub Pages

The who-iris site on GitHub Pages renders pages from data it reads **from the
CDN**. It never copies the export into the Pages artifact. The three items
materialized today stay in this repository as test fixtures. That keeps Pages
small, and a preview always shows what the CDN actually serves.

## Still open

- **Q10, the domain.** The DID is tied to the domain, so this has to be
  settled before the first signed release. The recommendation is a domain the
  owner adds to Cloudflare.
- **The live DSpace REST shapes** were confirmed against
  `https://iris.who.int/server/api` on 2026-10-31 (#104); see
  `skills/iris-rest-feed.md`.
