---
# folio-assistant-mcdj
title: The 20 kg witnesses each copy the auditor hash the manifest already holds, so one auditor edit still rewrites 21 files
status: todo
type: task
priority: normal
created_at: 2026-09-23T17:21:08Z
updated_at: 2026-09-23T17:21:36Z
parent: folio-assistant-1swy
---

The residue `cflw` named and said *"wants its own bean"*. This is it, with the
number re-derived rather than inherited.

## Measured 2026-09-23, with `cflw`'s own probe

Append one comment line to `scripts/kg-audit.ts`, then:

| run | files changed |
|---|---|
| `bun run kg:audit` alone | **2** — the probe itself, and `skills/kg-qa.manifest.json` |
| `bun run regen` (43 verify/write pairs) | **2** — same |
| …then `bun run gen-docs-pages.ts` | **24** |

So an auditor-only edit costs **21 files besides the edit**: the manifest plus
**20** `qa-witness/v1` kg witnesses under `test/results/witnesses/`. That is
`cflw`'s stated residue, confirmed at its stated size.

**Down from 218, and the remaining 21 are one value copied 21 times.**
`content/pipeline/qa-witness.ts:565` reads the auditor from the manifest —
`readJson<KgQaManifest>(KG_QA_MANIFEST_PATH)?.auditor` — and line 582 writes
`scriptHash: auditor?.script_hash` into **every criterion of every kg witness**.
The manifest is already the single source; the witnesses are 20 projections of
it, so they cannot carry information it does not, which is `cflw`'s own sentence:
*"the per-file auditor hash never added precision the generator could deliver."*

## A trap for the next reader, and it caught me

The same fact is spelled two ways in two artefacts:

| artefact | key |
|---|---|
| `skills/kg-qa.manifest.json` | `script_hash` |
| `test/results/witnesses/**/*.kg.json` | `scriptHash` |

`grep -rl script_hash --include='*.kg.json'` returns **0**, and I read that as
*the residue is already gone* and nearly closed `cflw` on it. It is not gone —
`grep -rl scriptHash` returns **20**. A grep-and-stop reading here returns the
opposite of the truth, which is why the probe above runs the generator instead
of searching for a string.

## Why this is NOT the neighbouring beans

- **Not `cflw`.** That one is done at the level it claimed: 218 → 21, by moving
  the auditor's identity into the manifest. This is its named leftover.
- **Not `v556`.** That is a **third** family, `qa-results/v1`, with two sidecars
  and a different remedy surface. `cflw` does not name it; this does not either.
- **Not `nytj`.** That family is an artefact *recorded but not in force*. This is
  artefacts **colliding** — same root cause, committed derived state, different
  remedy.

## The question `cflw` asked first, and it should still be asked first

> *"Whether `test/results/witnesses/` needs to be committed at all is a separate
> question: it is derived from the sidecars plus the manifest, and the docs site
> regenerates it at publish time. If it does not need committing, the residual 20
> goes to 0 without touching the shared schema. **Worth asking before touching
> the schema.**"*

Still right, and the reason is stronger now that the mechanism is traced: the
cheap fix and the shape-changing fix are different sizes.

| option | cost | what it loses |
|---|---|---|
| **A — stop committing the 20** | no schema change; one `.gitignore` line and whatever reads them at publish time | a reviewer can no longer see a kg verdict in a diff |
| **B — omit `scriptHash` on the kg branch only** | one line in `qa-witness.ts`; the field stays optional and the block family keeps it | the panel loses a per-criterion hash that was the same 20 times |
| **C — leave it** | nothing | 21 files churn per auditor edit, and every open branch is invalidated |

**B is the narrow one and does not touch the shared shape**: `qa-witness/v1` is
shared with the **block** family, where per-criterion script hashes are REAL
information (`qa-checkers-voice.ts` and `qa-checkers-extended.ts` are genuinely
different scripts on different criteria of one block — measured: **113** block
witnesses carry `scriptHash`). Making the field optional-and-unset on the kg
branch leaves that untouched. It does mean the docs QA panel must read the
auditor from the manifest for kg subjects, which is the e2e surface `cflw`
flagged.

**Not choosing here.** A is cheaper and answers a question nobody has put; B is
narrower and costs a panel change. Both are the owner's, and the wrong order —
changing the schema before asking whether the files need committing — is the one
`cflw` explicitly warned against.

## 2026-09-23 — the prior question is ANSWERED: the published site does not need them

The owner ruled the ORDER: establish whether the witnesses need committing
before touching the shared schema. Established, from the workflows and the
generator rather than from reasoning about them.

### The site regenerates them; it does not serve the committed copies

`docs-site.yml` runs `gen-docs-pages.ts` at **line 140** and copies
`test/results/witnesses/` into `_site/assets/qa/` at **line 532** — generator
first, same job. `feature-staging.yml` is the same shape (204, then 893). So
what a reader fetches is **regenerated at publish**, never the committed bytes.

`gen-docs-pages.ts` says so in its own header, and it is right:

> *"`docs-site.yml` and `feature-staging.yml` both run this generator in full
> before copying `test/results/witnesses/` into `_site/assets/qa/`, so the
> projections a reader actually fetches are regenerated at publish. **The
> committed copies are a cache for local work and for review.**"*

**A correction I am keeping.** My first reading of `docs-site.yml` stopped at the
`cp -rT` and concluded the committed copies ARE the published artefact, so
option A would 404 every badge. That was wrong — I had read the copy step and
not looked for what ran before it, which is the grep-and-stop failure this bean
already records once, in a second form. The workflow line numbers above are the
check I should have run first.

### So the committed copies buy exactly two things

1. **A reviewer can see a kg verdict move in a diff.** Real, and the reason this
   is a question rather than a deletion.
2. **`d2kp`'s existence gate.** `emit(..., "verdict")` gates these on EXISTENCE
   only and deliberately not on contents — *"a missing file IS an omission: the
   badge would point at a 404 forever"*. That guard catches a generator that
   stopped emitting, and it needs a committed file to exist.

**Their contents are gated by nothing.** `d2kp` is explicit that gating them
could only ever fire on a graph that changed. So the 20 files churn on every
auditor edit while no check reads what is in them, and the site never sees them.

### What that does to the three options

| option | now known |
|---|---|
| **A — stop committing** | the **published site is unaffected**, proven above. Costs the diff-review benefit AND `d2kp`'s existence guard, which would need somewhere else to live |
| **B — omit `scriptHash` on the kg branch** | **not free**: `docs-ui.js:7312-7314` renders it as a *"checker source hash"* field, so the panel must read the manifest for kg subjects instead. Exactly the e2e surface `cflw` flagged |
| **C — leave it** | 21 files churn per auditor edit, and every open branch touching the graph is invalidated |

**Still not choosing.** A is cheaper than it looked and costs a guard nobody has
re-homed; B is narrower and costs a panel change. Both are the owner's, and both
are now informed rather than guessed.

## Done when

- [x] The prior question is answered with evidence, not reasoning: the published
      site regenerates the witnesses and does not serve the committed copies
      (`docs-site.yml` 140 then 532; `feature-staging.yml` 204 then 893)
- [ ] The owner has ruled between A, B and C — asked as selectable options, with
      this measurement, not as a description of the code. **A is cheaper than it
      read and costs `d2kp`'s existence guard; B costs a panel change at
      `docs-ui.js:7312`**
- [ ] Whichever is chosen is measured with the same probe: an auditor-only edit
      changes **1** file, or the reason it still changes more is written down
- [ ] The `script_hash` / `scriptHash` spelling trap is closed or recorded where
      the next reader greps — it returns the opposite of the truth today
