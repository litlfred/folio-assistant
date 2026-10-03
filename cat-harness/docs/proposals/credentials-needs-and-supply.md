---
title: "Credentials: needs declared, supply chosen by deployment"
kind: proposal
issue: 363
bean: folio-assistant-vobp
summary: >-
  Owner, 2026-10-02: credentials need a design before any secret is created, because keys have as many deployment scenarios as the harness does (personal, organizational). A workflow or tool DECLARES a capability need (an action and a target); a DEPLOYMENT PROFILE resolves each need to a mechanism (GitHub App, fine-grained token, deploy key, forge token, keystore). Secrets are named for the capability, never the mechanism or the consumer. Authenticating and signing are separate needs, and today nothing the harness publishes is signed by the harness. An agent reads needs and secret NAMES and never handles a value. Four owner decisions; nothing is built.
---

# Credentials: needs declared, supply chosen by deployment

**Status: proposal, CRDM Phases 1–2 (needs, then the current process and its
gap).** It is a document only. No code is written against it, no secret has
been created for it, and no secret value appears in it or anywhere in this
change.

> ## Rulings, owner, 2026-10-02 (about 06:40)
>
> | decision | ruling | how it was reached |
> |---|---|---|
> | **D1** mechanism | **A: one GitHub App owned by the account** | **default applied.** The owner said "no preference", so this can be reopened |
> | **D2** naming | **A: capability names. (a) becomes `PUBLISH_SITE_BOOTSTRAP` and (b) becomes `PUSH_BRANCH_TRIGGERING_CI`** | **default applied.** The owner said "no preference", so this can be reopened |
> | **D3** placement | **A: a `credentials/` directory per instance** | **default applied.** The owner did not answer, so this can be reopened |
> | **D4** signing | **A: declare `sign-artefact` now, and build it after wallet-custody Q1 and Q7** | **ruled by the owner** |
>
> Four follow-up beans under epic `5a3l` carry the work. None of them is built
> yet:
>
> - `k3ml`: the `secrets` skill, with the App setup walkthrough for a
>   personal account
> - `jzba`: the `secrets:check` tool
> - `9hxd`: the `credentials/` declarations for bootstrap-tools and
>   folio-assistant
> - `8mlt`: the two secret renames

1. TOC
{:toc}

---

## 0. What was asked, and the short answer

Owner, 2026-10-02, in the lead session:

- Credentials need a design **before** any secret is created.
- *"keys have lots of deployment scenarios, and so will folio-assistant
  (personal, organizational)"*.
- A **skill and a tool**, so that humans and agents can add, rotate and revoke
  secrets.
- The name `BOOTSTRAP_PAGES_TOKEN` is bad. Then the question: ***"what exactly
  is being signed?"***

**Nothing is being signed.** `BOOTSTRAP_PAGES_TOKEN` is a bearer credential.
It lets `bootstrap-tools`' workflow *authenticate* a `git push` to the
`gh-pages` branch of `litlfred/bootstrap`. GitHub checks it at the moment of
the push and keeps no proof of it that anyone else could later check. Nothing
in the pushed site carries a signature. The name made it easy to think
otherwise. That is one of three faults in it, and §4 deals with all three.

The design in one paragraph: **a workflow or tool declares the capability it
needs** (an action and a target, such as *publish the site of
`litlfred/bootstrap`*), and says nothing about how that need is met. **A
deployment profile resolves each need to a mechanism**: a GitHub App
installation token, a fine-grained personal access token, a deploy key, a forge
access token, or a keystore entry. The same need has different supply on a
personal account, in an organization, on a sovereign forge and in a
self-sovereign deployment. **Secrets are named for the capability**, so the
name survives a change of mechanism. **Authenticating and signing are separate
needs** with separate credentials. **An agent reads needs and secret names, and
never a value.**

---

## 1. What exists today: measured 2026-10-02

### 1.1 Every `secrets.*` reference, by repository

Found by searching each repository's `.github/workflows/*.yml` for
`secrets\.[A-Za-z0-9_]+`. For folio-assistant the search ran on `origin/main` at
`b6a67e7dc20`. For the others it ran on the remote default branch through the
REST contents API.

| secret | where | purpose | if unset |
|---|---|---|---|
| `GITHUB_TOKEN` | folio-assistant: 17 workflows; bootstrap-tools `pages.yml`; the three `templates/paper` workflows | automatic. Lasts one job and is scoped to this repository by the job's `permissions:` block. Used for PR comments, `gh api`, Pages deploys and GHCR pushes | it is always present |
| **`BOOTSTRAP_PAGES_TOKEN`** | bootstrap-tools `publish-bootstrap.yml` | **need (a).** Push the staged site onto `litlfred/bootstrap`'s `gh-pages`. `GITHUB_TOKEN` cannot push to another repository. The workflow's header asks for a fine-grained token on `litlfred/bootstrap` with Contents read/write | **unset.** The first step fails with an `::error::`, so the site is not published |
| **`MERGE_MAIN_TOKEN`** | folio-assistant `merge-main.yml` | **need (b).** Push the merge of `main` into PR branches that carry the `merge-main` label, so that the PR's own CI runs on the push. A push made with `GITHUB_TOKEN` does not start workflows | **unset.** It falls back to `GITHUB_TOKEN` and then dispatches `code-quality-gates.yml` by hand |
| `RELEASE_PLEASE_TOKEN` | folio-assistant `release-please.yml` | opens the release PR so that CI runs on it. The same reason as (b) | falls back to `GITHUB_TOKEN`, which the workflow's comment calls "half-broken" |
| `NPM_TOKEN` | `snappea_wasm.yml`, `hecke-engine-wasm.yml` | `npm publish --provenance`. The provenance part is OIDC (`id-token: write`). The token only authenticates the publish | the publish fails |
| `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` | `agent-review.yml` | model API calls for the review agent | the review step fails |
| `HETZNER_API_TOKEN` | `deploy-folio.yml` | provisions and updates the folio host | deploy fails |
| `GOOGLE_CLIENT_ID` / `_SECRET`, `GH_OAUTH_CLIENT_ID` / `_SECRET` | `deploy-folio.yml` (passed into the host) | the OAuth clients behind the auth gateway's viewer login (Google) and collaborator login (GitHub). The two `_ID` values are public identifiers, not secrets | the login fails on the host |
| `secrets.token_hex` | `agent-review.yml:57` | **not a secret.** It is Python's `secrets` module, inside a `run:` script | — |

There are two more on the host, outside any workflow, in `cat-harness/deploy/`
(only the names were read): `COOKIE_SECRET`, the HMAC key the auth gateway
signs session cookies with, and `FOLIO_API_TOKEN`, the bearer token that
bypasses the gateway (see the `deployment-auth` skill).

`pyhecke-pypi-publish.yml` and `pyhecke-native-wheels.yml` use **no stored
secret at all**. They publish through PyPI Trusted Publishers over OIDC, and
that is the shape this proposal prefers wherever the relying party supports it
(§3.2).

### 1.2 What could not be measured, said rather than skipped

| question | result |
|---|---|
| which secret **names** are set on folio-assistant and bootstrap-tools | **could not determine.** `GET /repos/{o}/{r}/actions/secrets` returns 403 from this session's proxy ("not permitted through this proxy"). "Unset" above is the lead session's finding and the workflows' own fallback messages. It was not re-measured here |
| workflows in `litlfred/cat-harness`, `cat-harness-tools`, `smart-base`, `smart-trust`, `smart-immunizations` | **could not determine.** The API returns 403 because access to these repositories is not enabled for this session. The local `litlfred/cat-harness*` checkouts contain only `.git` |
| workflows in `litlfred/bootstrap` | **none on the default branch** (404). A local checkout still has a `pages.yml`, which `publish-bootstrap.yml`'s header says was retired (owner, 2026-10-01, #1770) |
| whether `litlfred` is an organization | **no.** `owner.type` is `User`. There are no organization secrets because there is no organization |

Both "could not determine" rows matter for §6. A checker that has to list
secret names needs permission to do so. That permission is a need in its own
right, and §10 lists it as a falsifier.

### 1.3 Where these proposals already left the question

- [Wallet custody](wallet-custody.html) (#370, bean `61tg`): the owner ruled
  that a self-sovereign harness **may** hold credentials, and set one rule:
  **no secret is ever in the repository.** It then asks seven questions. §8
  maps this proposal onto them.
- [Deployment topologies](deployment-topologies.html) (#363, epic `5a3l`): ten
  axes and six modes. Credentials vary with the **forge** (axis 1), the
  **network** (axis 5) and the **data stores** (axis 9). They are not a new
  axis. They are a fact *derived* from those three, which is why the profiles
  in §3 are named after topologies.
- [Actors, ODRL and PROV-O](odrl-prov-actor-model.html): permissions are W3C
  ODRL 2.2 rules, and every task run is a `prov:Activity`. A credential need
  is ODRL-shaped (an action on a target), and §2.3 makes use of that.
- Bean `r0rq` (completed): signing has **two routes**, an API signer and a
  human signer, and an actor's network reach chooses between them. §5 places
  it.
- Bean `zakj` (archived): `check-secret-leaks.ts` catches leaked tokens by
  their prefix. It answers "did a value reach a file?", which is the opposite
  question to this one.

---

## 2. Need versus supply

### 2.1 The split

Each of the two measured needs has its *mechanism* written into the consumer.
`publish-bootstrap.yml` says "a fine-grained personal access token". Two
things are wrong with that:

1. **The mechanism is a property of the deployment, not of the workflow.** In
   an organization the same push should come from a GitHub App. On a GitLab
   forge there is no App and no fine-grained token. In a self-sovereign
   deployment with `publication: local-server` the need does not exist at
   all. A workflow that names its mechanism is wrong in three of the four
   profiles.
2. **The need is what an operator can reason about.** "This workflow publishes
   bootstrap's site" can be granted, refused, reviewed and audited. "This
   workflow wants a PAT" cannot be, because a PAT can do almost anything.

So:

- A **need** is declared by whoever writes the consumer: an **action**, a
  **target**, and what happens without it.
- A **deployment profile** is declared by whoever operates the deployment. It
  maps each need to a **mechanism**, a **secret name** and a **grant** (what
  the credential can actually do, which is usually more than the need).
- A **registry** records when each supplied credential was issued and when it
  expires. It holds dates, never values.

### 2.2 The action vocabulary, closed

These are the actions found in §1.1, plus the one the owner asked about. The
list is closed on purpose, so that a new action is a decision someone makes
and not a string someone typed.

| action | meaning | today |
|---|---|---|
| `publish-site` | put a rendered site where its host serves it | need (a) |
| `push-branch` | update a branch, optionally `triggersWorkflows: true` | need (b) |
| `open-pull-request` | open or update a PR, optionally `triggersWorkflows: true` | release-please |
| `dispatch-workflow` | start a workflow run | merge-main's fallback |
| `publish-package` | publish to a package registry | npm, PyPI |
| `call-model-api` | inference against a hosted model | agent-review |
| `provision-host` | create or update compute | deploy-folio |
| `authenticate-users` | act as an OAuth client for a login | the auth gateway |
| `list-secret-names` | read secret **names** and dates, never values | what `secrets:check` itself needs (§6.2) |
| **`sign-artefact`** | bind a key to the digest of a published artefact | **nothing, today** (§5) |
| `sign-session` | MAC a session cookie | `COOKIE_SECRET` on the host |

`sign-artefact` and `sign-session` are in the list so that signing is named as
a separate action. It is never something a push token does on the side (§5).

### 2.3 The declaration, sketched

```jsonc
// <instance>/credentials/needs.json: authored beside the workflows it describes
{
  "$schema": "credential-needs/v1",
  "needs": [
    {
      "id": "publish-site-bootstrap",
      "action": "publish-site",
      "target": { "repository": "litlfred/bootstrap", "ref": "gh-pages" },
      "consumers": [".github/workflows/publish-bootstrap.yml#publish"],
      "whyNotDefault": "GITHUB_TOKEN cannot write to another repository",
      "without": "fail"            // fail | degrade | skip
    },
    {
      "id": "push-branch-triggering-ci",
      "action": "push-branch",
      "target": { "repository": "self", "ref": "pull-request heads labelled merge-main" },
      "triggersWorkflows": true,
      "consumers": [".github/workflows/merge-main.yml#merge"],
      "whyNotDefault": "a push made with GITHUB_TOKEN starts no workflow",
      "without": "degrade",
      "degradesTo": "dispatch-workflow code-quality-gates.yml"
    }
  ]
}
```

```jsonc
// <instance>/credentials/profile.json: authored by the operator of THIS deployment
{
  "$schema": "credential-profile/v1",
  "profile": "personal-github",                 // §3
  "supply": {
    "publish-site-bootstrap": {
      "mechanism": "github-app",                // or fine-grained-pat | deploy-key | forge-token | keystore
      "secret": "PUBLISH_SITE_BOOTSTRAP",       // the name the consuming step reads (§4)
      "grant": "contents:write on litlfred/bootstrap, every branch",
      "storedIn": "environment publish-site-bootstrap of litlfred/bootstrap-tools"
    }
  }
}
```

```jsonc
// <instance>/credentials/registry.json: written by the add / rotate / revoke steps
{
  "$schema": "credential-registry/v1",
  "entries": [
    { "secret": "PUBLISH_SITE_BOOTSTRAP", "mechanism": "fine-grained-pat",
      "issuedOn": "YYYY-MM-DD", "expiresOn": "YYYY-MM-DD",
      "rotateBy": "YYYY-MM-DD", "holder": "actor:owner" }
  ]
}
```

The three files hold **no value, no hash of a value and no fragment of a
value**. A deploy key's *public* fingerprint may be recorded, because it is
public. Anything derived from a secret is excluded, because "it is only a
hash" is exactly the argument that puts a guessable digest into a public
repository.

**What a need is in ODRL terms.** It is an `odrl:Request`. The assignee is
the consuming workflow (a mechanical actor, a `prov:SoftwareAgent`), with an
action and a target. The profile's `supply` entry is the grant that answers
the request. So the declaration can be *rendered* as ODRL without changing
the authored format, and an agent's permission to `dispatch-workflow` a
consumer can be checked against the same policy graph as every other
permission. That is the [Actors, ODRL and PROV-O](odrl-prov-actor-model.html)
model applied to mechanical actors.

### 2.4 Where it lives, and which graph kinds

**One `credentials/` directory per instance,** declared in that instance's
`<instance>.json` like any other graph directory, holding three graph kinds.
The single question in the content/context/state skill decides each of them:

| file | kind (proposed) | `holds` | why |
|---|---|---|---|
| `needs.json` | `credential-needs` | **`context`** | No process writes it. `secrets:check` and CI read it. It changes only when a person edits a workflow, which is an authoring act outside any process. **Detach it and it empties:** a need for a workflow that is gone says nothing, so it is not `content` (contrast `policies`, which stands on its own) |
| `profile.json` | `credential-profile` | **`context`** | Read by every check, and changed only when an operator changes the deployment. It is per-deployment in the same way `publication.host` is |
| `registry.json` | `credential-registry` | **`state`** | The add, rotate and revoke steps (§6.3) **write** it as they run. You would get it back by re-running them, not by authoring it again |

Two constraints shape this.

- **The name `needs` is taken.** `cat-harness.json` already has a `needs`
  field: the list of layers this instance sits on (`bootstrap`,
  `bootstrap-tools`). A credential need must never be written into it. Hence a
  directory named `credentials/` and kinds named `credential-*`.
- **bootstrap-tools has to carry its own `needs.json`,** because its workflow
  is the consumer. bootstrap-tools is a *sibling* of cat-harness and may not
  import it. The files therefore declare themselves with a `"$schema"` tag, as
  a workflow instance does, and are validated *as data* by a checker in
  cat-harness-tools. A tag is a name, not an import. If the layering rule
  turns out to forbid even a tag naming a cat-harness format, the format
  belongs in bootstrap. That is falsifier 4 in §10.

---

## 3. Profiles and mechanisms

### 3.1 The mechanisms, with their trade-offs

| mechanism | expiry | whose identity acts | blast radius | rotation | starts workflows? | available on |
|---|---|---|---|---|---|---|
| **`GITHUB_TOKEN`** | end of job | `github-actions[bot]` | this repository, limited by `permissions:` | none needed | **no** | GitHub |
| **OIDC to a relying party** (npm or PyPI trusted publishing, Vault JWT auth, cloud federation, Sigstore) | minutes | the *workflow* (repository + ref + workflow claim) | whatever the relying party's trust policy names | **nothing to rotate** | n/a | GitHub; GitLab (`id_tokens`); Forgejo varies |
| **GitHub App installation token** | **1 hour**, minted per run | the App's bot (`<app>[bot]`), **not a person** | the repositories the installation covers × the permissions requested. A single mint can be narrowed further | rotate the App's **private key**. An App may hold two keys at once, so rotation has no downtime | **yes** | GitHub, **including personal accounts** |
| **fine-grained PAT** | chosen at creation. This design requires one (≤ 1 year) | **the person who created it.** Pushes appear as them | selected repositories × selected permissions, limited by what that person can do | regenerate (new value), update the secret, record the new expiry | yes | GitHub |
| classic PAT | optional | the person | **every repository the person can reach** | — | yes | **excluded by this design** |
| **deploy key** (SSH) | **never** | no person: the key belongs to one repository | **one repository, every branch**, read or read/write | add a new key, switch the secret, delete the old key | yes | GitHub, GitLab, Gitea, Forgejo |
| **forge access token** (GitLab project or group access token; a Forgejo or Gitea bot user's scoped token) | GitLab: required, ≤ 1 year. Forgejo: optional | a bot user the forge creates or the operator creates | one project or group × scopes (`write_repository` …) | rotate in the forge UI and update the CI variable | yes | self-hosted forges |
| GitLab **deploy token** | optional | none | **read-only for code.** It cannot push | — | — | GitLab. Listed because the name suggests otherwise |
| **forge secret store** (repository, environment and organization secrets; GitLab masked + protected variables) | — | — | it is a *place*, not an identity. **Environments** release a secret only to the branches named and, optionally, after a required reviewer approves | — | — | GitHub (environments: every plan for public repositories; for private ones it depends on plan); GitLab |
| **external vault** (OpenBao or Vault, a cloud secret manager) | can issue short-lived dynamic credentials | whatever it issues | per policy | the vault's lease and rotation | — | any. CI reaches it over OIDC, so CI stores **no** secret |
| **OS keystore / hardware** (macOS Keychain, libsecret, Windows Credential Manager, TPM, YubiKey, HSM) | per key | the person or institution holding the device | that one device | re-key | — | workstation; own infrastructure; air-gapped |

Three rows decide most of the design.

- **`GITHUB_TOKEN` cannot start workflows and cannot leave its repository.**
  Both measured needs exist only because of that. Any mechanism that is not
  `GITHUB_TOKEN` will meet them.
- **A fine-grained PAT is the owner acting.** Every automated push made with
  one is recorded as the owner's own push. That mixes a person's acts with a
  machine's in the audit trail that PROV-O (§5) will later read. An App or a
  deploy key keeps them separate.
- **A deploy key never expires.** For an operator that is convenient. For a
  checker it is a problem: there is no date to warn about. The registry
  therefore gives it a `rotateBy` policy date instead.

### 3.2 Profiles

A profile is a default mechanism for each *class* of need, and any need can
override it. It is a deployment fact derived from the topology axes, not a new
axis.

| need class | **P1 personal GitHub** (today) | **P2 GitHub organization** | **P3 sovereign / self-hosted forge** (no Apps) | **P4 self-sovereign** (wallet) |
|---|---|---|---|---|
| push to another repository (a) | **owner-owned GitHub App**, installed on selected repositories; or a fine-grained PAT; or a deploy key | org-owned App; App ID and key as **organization** secrets visible to the selected repositories | forge access token for a bot user, or a deploy key with write access; protected CI variable | usually **none**: with `publication: local-server` the site is served from the checkout. Otherwise an SSH key held in the OS keystore or on hardware |
| push or PR that must start CI (b) | the same App (its token starts workflows) | the same App | the bot user's token. Whether a forge-CI push starts pipelines **varies by forge and version, so measure it** | none: the merge is local and the gates run locally |
| publish a package | **OIDC trusted publishing** (npm, PyPI). Delete the stored token | the same | OIDC if the registry supports it; otherwise a registry token in a protected variable | a local registry, or none |
| call a hosted model | a repository secret, in an environment | an organization secret plus an environment | a protected CI variable or the vault | keystore; or none (`open-weight-local`) |
| provision or deploy a host | a secret in an environment with a **required reviewer** | the same, with org-level reviewers | the vault over OIDC | not applicable: own hardware |
| **sign an artefact** | Sigstore keyless over OIDC (public repositories) | the same, or an org key in a KMS | an institution key in an HSM or KMS | **an institution key in the wallet / HSM**, through the human route of bean `r0rq` when air-gapped |

**Why the App is the P1 recommendation even though the account is
personal.** An App can be installed on a personal account. One App covers (a),
(b), release-please, the future smart-* repositories and the cat-harness
seeding, so the setup is paid for once. It is the only GitHub mechanism whose
working credential lasts an hour. It acts as itself, not as the owner. And it
transfers to an organization unchanged if the account ever becomes one, which
moves the deployment from P1 to P2 with nothing renamed. Its costs are a
one-time registration (about ten minutes in the UI, §6.3), and a long-lived
private key that must itself be stored and rotated.

**Narrowing the App's blast radius on `litlfred/bootstrap`.** A token with
`contents: write` can write *every* branch, not only `gh-pages`. A ruleset on
`main` that leaves the App off its bypass list reduces the effective grant to
what the need actually is. The profile records the real grant, and
`secrets:check` reports **grant broader than need** when no such ruleset
exists (§6.2).

---

## 4. Naming rule

### 4.1 The rule

> **A secret that grants a capability is named for the capability:
> `VERB_OBJECT[_TARGET]`. The target is left out when it is the repository the
> secret lives in. A secret never names the mechanism (`_TOKEN`, `_PAT`,
> `_KEY`, `_APP`) and never the consumer (a workflow's name).**

Secret names are an operator's interface. When a name says what the
credential lets someone do, the operator can see what is lost if it leaks and
what breaks if it is revoked. A name that says how the credential was made
goes stale the day the mechanism changes. A name that says which workflow
uses it goes stale the day a second workflow needs the same capability.

**One exception, stated as such:** key material that *is an identity* rather
than a capability is named for the identity. A GitHub App's private key
creates tokens for many capabilities, so naming it after one of them would be
false. It is `HARNESS_BOT_PRIVATE_KEY`, and the App's ID, which is public, is a
repository **variable**, `HARNESS_BOT_ID`, not a secret.

**The consuming step reads the capability name in every profile.** Under P1
with a PAT, `PUBLISH_SITE_BOOTSTRAP` is a stored secret. Under the App, a mint
step (`actions/create-github-app-token`, `repositories: bootstrap`,
`permission-contents: write`) produces a token, and the job exposes it as
`PUBLISH_SITE_BOOTSTRAP`. The step that pushes does not change. §10 records
where that invariance breaks down (SSH compared with HTTPS).

### 4.2 Why `BOOTSTRAP_PAGES_TOKEN` fails it, three ways

1. **`TOKEN` names the mechanism.** It is wrong the moment a deploy key or an
   App supplies the capability.
2. **`BOOTSTRAP` reads as a verb.** "Bootstrap the pages" sounds like setting
   something up or signing it, not like publishing to a repository named
   `bootstrap`. That is where "what is being signed?" came from.
3. **It does not say what it allows.** "Pages" leaves out the fact that the
   credential can *write* to `litlfred/bootstrap`, and today that means every
   branch.

### 4.3 Proposed names for (a) and (b)

| | **(a)** `publish-site @ litlfred/bootstrap` | **(b)** `push-branch @ self, triggersWorkflows` |
|---|---|---|
| **today** | `BOOTSTRAP_PAGES_TOKEN` (unset) | `MERGE_MAIN_TOKEN` (unset) |
| **P1 personal, App** *(recommended)* | job-level env `PUBLISH_SITE_BOOTSTRAP`, minted from `HARNESS_BOT_PRIVATE_KEY` + `HARNESS_BOT_ID` | job-level env `PUSH_BRANCH_TRIGGERING_CI`, minted from the same App |
| **P1 personal, PAT or deploy key** | repository secret `PUBLISH_SITE_BOOTSTRAP` in bootstrap-tools, inside environment `publish-site-bootstrap` (deployment branch: `main`) | repository secret `PUSH_BRANCH_TRIGGERING_CI` in folio-assistant |
| **P2 organization** | as the App row. `HARNESS_BOT_PRIVATE_KEY` becomes an **organization** secret visible to the selected repositories | as the App row |
| **P3 sovereign forge** | protected, masked CI variable `PUBLISH_SITE_BOOTSTRAP` (a bot user's token, or a deploy key). Note that on GitLab, `publish-site` is a Pages job artifact, not a branch push, so the *need* stays the same and the mechanism changes | protected CI variable `PUSH_BRANCH_TRIGGERING_CI`, once it is measured that a push by the bot starts pipelines on that forge |
| **P4 self-sovereign** | usually **no secret**: `local-server` serves the checkout. Otherwise a keystore entry labelled `folio/PUBLISH_SITE_BOOTSTRAP` | **no secret**: the merge and the gates run locally |

**Renaming these two costs nothing,** because neither is set. The other
secrets in §1.1 are set and working. This repository's own rule, *"don't
encode rules against a working setup"*, says the naming rule applies to new
secrets and to an existing secret **when its consumer is next changed**, and
never as a sweep. For the record, the rule would give `RELEASE_PLEASE_TOKEN`
→ `OPEN_PR_TRIGGERING_CI`, `HETZNER_API_TOKEN` → `PROVISION_HOST_HETZNER`, and
`NPM_TOKEN` → **deleted**, replaced by trusted publishing.

---

## 5. Authenticating is not signing

### 5.1 The distinction

| | **authenticating** | **signing** |
|---|---|---|
| answers | *who is making this request, now?* | *who vouches for these bytes, for good?* |
| checked by | the service, at request time | **anyone**, later, offline, with the public key |
| leaves | an **attribution**: a line in the forge's log, which the forge can edit or lose and which the forge alone asserts | an **attestation**: a signature over a digest that travels with the artefact |
| survives the forge? | no | yes |
| credential | bearer token, SSH key, OIDC token | private key: a held key, or a keyless short-lived certificate |

Keys have a third use, **encryption** (confidentiality). Nothing here needs
it, and wallet custody (wallet-custody Q3) will. It is named so that it is
not later mistaken for one of the other two.

**Rule: a credential that authenticates never signs, and the other way
round.** They are separate needs with separate names, separate holders and
separate rotation. A leaked push token must not be able to forge provenance.
A signing key must not be lying in a CI secret store where every workflow on
the branch can read it.

### 5.2 What is attributed, what is attested, today

| artefact | authenticated by | attributed to | **signed?** |
|---|---|---|---|
| bootstrap's site on `gh-pages` (need a) | the future `PUBLISH_SITE_BOOTSTRAP` | the commit says `github-actions[bot]`. **Commit author fields are free text**, so this is a claim, not evidence | **no** |
| merge-main's pushes (need b) | `GITHUB_TOKEN` today | the same | **no** |
| PRs merged in the GitHub UI | the owner's session | the owner | **yes, by GitHub's web-flow key** (measured: `b6a67e7dc20` carries a `gpgsig`). It attests that *GitHub* made the commit for that account, not that the content is good |
| agent commits | the session's push credential | the commit's author text | **no** (measured: `git log --format=%G?` gives `N`) |
| npm packages (`hecke-engine-wasm`, `snappea-wasm`) | `NPM_TOKEN` | the npm account | **yes: Sigstore provenance** over OIDC. It attests which repository, workflow and commit built the package |
| PyPI wheels (`pyhecke`) | OIDC trusted publishing | the workflow | attestations not measured here |
| the JSON-LD graph export (`export-graph.ts --provenance`) | — | `prov:wasDerivedFrom` and `prov:generatedAtTime` **inside** the file | **no.** These are PROV *claims*, and anyone who can write the file can write them |
| session cookies on the folio host | — | — | MAC'd with `COOKIE_SECRET`. That is a symmetric key, so only the gateway itself can check it. It authenticates sessions **to the gateway** and is not an attestation anybody else can verify |
| the published docs site, QA sidecars, beans, releases | — | — | **no** |

**So, plainly: the harness signs nothing it publishes.** The only signatures
on the published path are made by third parties: GitHub's web-flow key on UI
merges, and Sigstore on npm packages.

### 5.3 Where provenance signing would fit

`sign-artefact` is a need like any other. What would be signed is not the
site or the files themselves. It is a **statement**: an in-toto / SLSA
provenance document, or a W3C Verifiable Credential. Its *subject* is the
digest of the published artefact (the staged site tree, the JSON-LD graph, an
IG package). Its *predicate* is the `prov:Activity` that produced it, which
is the task run the [Actors, ODRL and PROV-O](odrl-prov-actor-model.html)
proposal already records. The signature then attests: *this key holder
asserts that this activity produced these bytes.* A GDHCN-style trust chain
can consume that, and an unsigned `prov:wasDerivedFrom` cannot.

The mechanism depends on the profile (§3.2):

- **P1 / P2:** Sigstore keyless, from the publishing workflow's OIDC
  identity. There is no key to hold. It attests *the workflow*, not an
  institution.
- **P3 / P4:** an **institution key**. This is wallet-custody Q1's
  "institution's signing keys". It sits in an HSM, a KMS or the wallet, and
  bean `r0rq` gives it two routes: the API signer when the signing actor has
  network reach, and a **human signer** when it does not.

The difference between the two bullets is **who vouches**. "This CI run
built it" and "this ministry endorses it" are different claims. A
deployment's profile says which one it makes.

---

## 6. Agent boundaries, the skill and the tool

### 6.1 What an agent may and may not do

| an agent **may** | an agent **never** |
|---|---|
| read `needs.json`, `profile.json` and `registry.json` | sees, asks for, accepts, echoes, stores or forwards a secret **value** |
| read secret **names** and their `updated_at`, when it is permitted to (§1.2: from this session it is not) | runs `gh secret set`, `gh secret delete` or their forge equivalents |
| compare needs, workflow usage, names present and the registry, and report the result | creates a PAT, an App key, a deploy key or a forge token |
| remind the holder before something expires: in the session-start sweep, on the health issue, in a bean | rotates or revokes on its own initiative (**deletion-requires-confirmation**: it reports what would go and waits) |
| draft the exact human steps (§6.3) for the person to carry out | writes anything derived from a value (a hash, a prefix, a length) |
| dispatch a workflow that *uses* a secret, **if** an ODRL rule grants it `dispatch-workflow` on that consumer | treats "the person pasted it into the chat" as permission to use it |

**If a value is pasted into a chat,** the agent says that the value is now
exposed: it sits in a transcript, and possibly in a provider's logs. It
recommends rotation using the steps in §6.3, and it does not use the value.
The leak scanner from bean `zakj` covers the case where the value reaches a
file. This rule covers the case where it reaches a conversation.

**Who holds each mechanism.** Add, rotate and revoke belong to the holder,
always a person:

| mechanism | holder |
|---|---|
| App, fine-grained PAT, deploy key, repository secret, environment (P1) | the account owner |
| App, organization secret, environment reviewers (P2) | an organization owner. Reviewers are named per environment |
| forge token, protected CI variable (P3) | a forge maintainer of the project or group |
| keystore, HSM, wallet key (P4) | the device holder or the institution's custodian. Wallet-custody Q4 governs it |

### 6.2 The tool: `secrets:check` (outline, not built)

**Inputs, all names-only:** every instance's `needs.json`; every workflow's
`secrets.NAME` references, excluding non-context matches such as
`secrets.token_hex` (§1.1 found one); the names present, from
`/repos/{o}/{r}/actions/secrets`, `/environments/{env}/secrets` and
`/orgs/{org}/actions/secrets` (none of these return values); and
`registry.json`.

**Findings:**

| finding | example today | severity |
|---|---|---|
| declared, used, **not present** | `BOOTSTRAP_PAGES_TOKEN` | major when `without: fail`, minor when `degrade` |
| used, **not declared** | every secret in §1.1, until `needs.json` exists | major |
| declared, not used | — | minor |
| **present, not declared** (orphan) | unknown, could not list | reported, **never deleted** |
| name breaks the naming rule | `*_TOKEN` names | advisory for existing secrets (§4.3) |
| expires within 30 days / 7 days / expired | — | minor / major / critical |
| deploy key past `rotateBy` | — | minor |
| **grant broader than need** | an App with `contents: write` on bootstrap and no ruleset on `main` | minor |
| one credential both authenticates and signs | — | critical (§5.1) |
| **could not determine** | the 403 in §1.2 | **outranks clean**, exit 2 |

It behaves like `check-secret-leaks.ts` and `check:ci-health`: exit 0, 1 or 2,
where 2 means "could not check" and is never shown as green. It feeds
`bun run health` as one check, and each threshold carries its basis: 30 days
gives the owner one ordinary monthly cycle, and 7 days gives one working
week. It is exposed as both an MCP tool and a `bun run` script, to keep axis
6's parity.

**It has a need of its own.** Listing secret names needs permission to read
secrets metadata, and `GITHUB_TOKEN` does not have it. Its need is
`list-secret-names @ <each repository>`, and in P1/P2 the App supplies it
(Secrets: read-only). The checker declares that need in the same file as
everything else.

### 6.3 The skill: `secrets` (outline, not built)

Placement: `cat-harness/skills/sdlc/sdlc-core/secrets.md`, beside `ci-health`
and `deployment-auth`, registered with `bun run skill:register`. The
processes would be `processes/credential-add.bpmn`, `credential-rotate.bpmn`
and `credential-revoke.bpmn`, each with a **human lane for every step that
touches a value** and an agent lane that checks and writes the registry. The
skill, the schemas and the declarations go in cat-harness. The checker's code
goes in cat-harness-tools.

Its sections, with the GitHub UI paths the skill would carry:

- **Fine-grained PAT.** *Add:* avatar → Settings → Developer settings →
  Personal access tokens → Fine-grained tokens → Generate new token. Set an
  expiration. Repository access → Only select repositories → the target.
  Repository permissions → Contents: Read and write. Then in the *consuming*
  repository: Settings → Secrets and variables → Actions → New repository
  secret, or Settings → Environments → the environment → Add environment
  secret. *Rotate:* open the token → Regenerate token, update the secret, and
  the agent records the new `expiresOn`. *Revoke:* delete the token, then
  delete the secret.
- **GitHub App.** *Add:* Settings → Developer settings → GitHub Apps → New
  GitHub App. Webhook off. Repository permissions limited to what the
  declared needs require. "Only on this account". Then Generate a private key
  (a `.pem` downloads), and Install App → Only select repositories. Store the
  App ID as a **variable** and the key as a **secret**. *Rotate:* generate a
  second key, update the secret, then delete the old key. *Revoke:* delete the
  key, or suspend or uninstall the installation.
- **Deploy key.** *Add:* the person generates a key pair locally
  (`ssh-keygen -t ed25519 -N "" -C publish-site-bootstrap -f <tmp>`). In the
  *target* repository: Settings → Deploy keys → Add deploy key → Allow write
  access, with the public half. The private half goes into the consuming
  repository's secret. Then shred the local file. *Rotate:* add the new key,
  switch the secret, delete the old key. *Revoke:* delete the key.
- **Environment.** Settings → Environments → New environment → Required
  reviewers; Deployment branches and tags → Selected → `main`.
- **Trusted publishing** (replaces `NPM_TOKEN`). npmjs.com → the package →
  Settings → Trusted Publisher → GitHub Actions (owner, repository, workflow
  file). Then delete the stored token.
- **Forge (GitLab).** Project → Settings → Access tokens → Add new token
  (role, `write_repository`, expiry). Then Settings → CI/CD → Variables →
  Masked + Protected.
- **Keystore.** `security add-generic-password …` or `secret-tool store …`,
  with the value **typed at the prompt** and never put on a command line,
  where it would land in the shell history.

---

## 7. What this does not propose

- No secret is created, renamed or deleted by this change, or by any agent.
- No workflow is edited. Renaming (a) and (b) in their workflows is follow-up
  work after decision D2.
- No credential for a *person's* health data. That stays wallet custody's
  subject.
- No live-store connection in sovereign cloud. That is still "artefacts only"
  (owner, 2026-09-24, bean `4y2i`).
- No historical secret sweep. Bean `zakj` ruled it out of scope with its
  reason.

---

## 8. The seven wallet-custody questions

| # | question | this proposal |
|---|---|---|
| Q1 | whose credentials? | **Adds a third class**: *deployment* credentials, the automation identities that push, publish and provision. These are distinct from a person's health credentials and from an institution's signing keys. Institution signing keys are what supplies `sign-artefact` in P3 / P4 (§5.3). **A person's own credentials: open** |
| Q2 | hold or broker? | **Answered for deployment credentials: broker, always.** The harness holds names and dates, and the forge store, vault or keystore holds the values. For signing in P4, the human route brokers too. **For a person's credentials: open** |
| Q3 | where do the bytes live? | **Answered for deployment credentials** (per profile, §3.2), and in a way that does **not** need the "present but never published" materialization state: the repository holds only needs, profile and registry, and none of them contains a secret. **For wallet contents: open** |
| Q4 | who may act with it? | **Partly answered.** An agent never handles a value (§6.1). It may *cause* a use only by dispatching a declared consumer under an ODRL grant. Whether an agent may ever present a *person's* credential: **open** |
| Q5 | audit | **Partly answered.** Every use is a workflow run in the forge's log. Every add, rotate and revoke is a commit to `registry.json`. Every signature is a `prov:Activity`. A custody log for person credentials: **open** |
| Q6 | air-gapped operation | **Partly answered.** Expiry warnings work offline from the registry's dates. Revocation *status* checks (status lists, OCSP) need the network and stay **open** |
| Q7 | which standards? | **Left open.** This proposal names candidates for the signing layer only: in-toto / SLSA provenance, Sigstore, W3C VC Data Integrity, and HCERT / GDHCN for health. None of them belongs in bootstrap |

---

## 9. Owner decisions

There are four, and each is complete in itself. What happens if the owner says
nothing is stated, and it is what an agent would then do.

### D1: which mechanism supplies GitHub automation on the personal account?

**What changes:** who appears to make the automated pushes, how often anything
expires, and how much setup the owner does once.

| option | does | pro | con | downstream | reversible |
|---|---|---|---|---|---|
| **A. One owner-owned GitHub App** *(recommended)* | one App, installed on selected repositories, tokens minted per run | hour-long tokens; acts as a bot, not as the owner; one setup covers (a), (b), release-please, smart-* and the cat-harness seeding; moves to an organization unchanged | about ten minutes of UI setup; a long-lived private key to store and rotate | every workflow gains a two-line mint step | yes: uninstall the App |
| B. A fine-grained PAT per need | one token per need | familiar; no App | **every push is recorded as the owner's**; one token per need to rotate; expiries break workflows quietly unless they are checked | `secrets:check` becomes essential rather than useful | yes |
| C. Deploy keys | one SSH key per target repository | nothing expires; no person identity | git only: no API, so it cannot open a PR (release-please) or list secret names (§6.2); one key per repository; no expiry for a checker to see | SSH plumbing in the steps, and a second mechanism for everything API-shaped | yes |

**Recommendation: A**, for the reasons in §3.2. **If you say nothing:** the
skill documents A first. No secret is created. `publish-bootstrap.yml` stays
red and `merge-main.yml` stays on its dispatch fallback, because both
outcomes need you and not an agent.

**Question:** should the harness's GitHub automation use one GitHub App owned
by your account (A), a fine-grained token per need (B), or deploy keys (C)?

### D2: adopt the capability naming rule, and rename (a) and (b) now?

**What changes:** the secret names you create in the UI, and the text of two
workflows.

| option | does | pro | con | reversible |
|---|---|---|---|---|
| **A. Adopt; rename (a) → `PUBLISH_SITE_BOOTSTRAP` and (b) → `PUSH_BRANCH_TRIGGERING_CI` now; others when next touched** *(recommended)* | §4 | the names you create first are already right; renaming costs nothing while both are unset | two workflow edits, in two repositories | yes |
| B. Adopt for new secrets only; keep the two existing names | — | no workflow edits | the first two secrets you create carry the names you called bad | yes |
| C. Do not adopt | — | — | names keep encoding mechanism and consumer | — |

**Recommendation: A.** **If you say nothing:** A, carried out as a follow-up
PR that edits the two workflows. No secret is touched.

**Question:** should new secrets be named for the capability they grant, with
(a) and (b) renamed now while neither is set?

### D3: where do needs, the profile and the registry live?

**What changes:** what an agent reads to find out what credentials a
repository needs, and what the checker validates.

| option | does | pro | con | reversible |
|---|---|---|---|---|
| **A. A `credentials/` directory per instance; three kinds: `context`, `context`, `state`** *(recommended)* | §2.4 | a need lives beside its consumer; the graph kinds are classified by the skill's own question; bootstrap-tools carries its own | three new graph kinds to register; the validator reads bootstrap-tools' file as data | yes |
| B. Comments inside each workflow's YAML | — | nothing new to declare | no schema, nothing to check against, no ODRL rendering | yes |
| C. One central registry in cat-harness for every repository | — | one file | cat-harness would describe repositories above and beside it, which reverses the dependency direction | costly to undo |

**Recommendation: A.** **If you say nothing:** A, as the follow-up bean's
design, with the kinds proposed and not registered until that bean is built.

**Question:** should each instance declare its credential needs, profile and
expiry registry in its own `credentials/` directory?

### D4: is provenance signing of published artefacts in scope now?

**What changes:** whether bootstrap's site and the JSON-LD graph carry a
signature anyone can check, and whose.

| option | does | pro | con | reversible |
|---|---|---|---|---|
| **A. Declare `sign-artefact` now; build it later, after wallet-custody Q1 and Q7** *(recommended)* | the need and the "authenticate ≠ sign" rule are recorded; nothing is signed yet | no premature commitment to a standard; the separation is fixed before any signing credential exists | the published artefacts stay unsigned for now | yes |
| B. Sign now with Sigstore keyless on GitHub | the workflow signs the site and graph digests | easy; there is no key to hold | attests *the CI run*, not an institution; may need redoing when Q1 settles | yes |
| C. Out of scope | — | — | the separation rule has nothing to attach to | — |

**Recommendation: A.** **If you say nothing:** A.

**Question:** should signing of published artefacts be declared as a need now
and built after wallet custody's Q1 and Q7 are decided (A), done now with
Sigstore keyless (B), or left out (C)?

---

## 10. What would falsify this design

1. **Need-invariance breaks.** The claim is that a consuming step reads one
   capability name whatever the mechanism. It already fails at the edges: a
   deploy key is presented over SSH and a token over HTTPS. A small
   presentation wrapper (`use-capability`) is meant to absorb that. **If the
   wrapper needs a branch for every forge × mechanism pair,** the mechanisms
   are not interchangeable, and names should carry a mechanism *class* after
   all.
2. **Presence can never be determined where it matters.** If listing secret
   names stays forbidden in agent sessions (it is today, §1.2) and also turns
   out to be unavailable to CI under every profile, then `secrets:check`'s
   third input becomes "could not determine" forever. The check would shrink
   to needs against usage against registry, and the design should say so
   rather than keep a permanent unknown.
3. **Profiles are not discrete.** If real deployments mix profiles routinely
   (a personal repository supplied by an organization's App, say), then
   "profile" is only a per-need mapping with a default, and its name
   overstates it. The schema already allows a per-need override, so this
   would cost a rename, not a redesign. It is falsified only if the overrides
   come to outnumber the defaults.
4. **The layering refuses the tag.** If bootstrap-tools may not carry even a
   `"$schema": "credential-needs/v1"` file, because naming a cat-harness
   format counts as pointing upward, then the format belongs in bootstrap and
   §2.4 is in the wrong place.
5. **The registry drifts.** Expiry dates are entered by hand, because a
   repository-scoped API cannot see a PAT's expiry. If measured drift shows
   the registry is wrong more often than right, its warnings are noise. Then
   the recommendation must move to mechanisms with nothing to expire (App
   tokens, OIDC), and away from tracking dates.
6. **A use of a key that is neither authentication nor signing turns up and
   is not encryption.** If so, §5's three-way split is incomplete.

---

## Next step

The CRDM process continues from Phase 1. The needs statement and the current
process with its gap (§1, §2.1) go on issue #363, because epic `5a3l` lives
there. A separate issue is opened only if the owner wants one, since an agent
does not create issues unasked. After D1–D4 are decided, Phase 3 writes the
requirements, and the follow-up beans (skill, checker, three graph kinds, two
workflow renames) are opened then and not before. When the feature ships,
this page moves to `docs/requirements/`.
