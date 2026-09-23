---
# folio-assistant-cflw
title: 'Generated artefacts collide: 218 sidecars rewritten by one auditor edit'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T06:19:28Z
updated_at: 2026-09-19T06:19:44Z
parent: folio-assistant-1swy
---


_2026-09-19T06:19:44Z_ — MEASURED 2026-09-19, on main at d4b9f7479, by appending one comment line to scripts/kg-audit.ts and running `bun run kg:audit`:

  218 sidecars rewritten. Zero verdicts changed.

Cause: `auditor.script_hash` was stored in every one of the 214 kg-qa sidecars. That is not 214 facts. `kg-audit.ts` computes `auditorHash` ONCE per run (one line, before any subject is audited) and threads the same value into every report, and it has NO subset mode -- the write loop always writes all of them. So the per-file copies could not differ from each other in any run that has ever happened. What they could do is change together.

WHY IT MATTERS BEYOND TIDINESS. Two concurrent branches that both touch the graph regenerate the same 218 files and conflict by construction. Observed today on one branch: 218 conflicts, then 238, then 20, across three base merges in under an hour, none of them carrying information -- the resolution was always "re-run the generator". Each regeneration then invalidates every other open PR, so the cost is quadratic in the number of open branches.

This is NOT bean nytj. nytj is about an artefact going STALE (recorded but not in force). This is about artefacts COLLIDING. They share a cause -- committed derived state -- and have different remedies.

FIX SHIPPED: the auditor's identity is recorded once, in `skills/kg-qa.manifest.json` (`kg-qa-manifest/v1`), and removed from the sidecar schema. Re-measured with the same probe: sidecars changed 0, manifest 1, docs witnesses 20 -- 218 down to 21.

Freshness is unchanged and still has two independent halves, which is the reason nothing is lost: the manifest hash says whether the AUDITOR is the one in the tree; each sidecar's own `source_hash` says whether its SUBJECT has moved since it was judged. The per-file auditor hash never added precision the generator could deliver.

RESIDUE, deliberately not fixed here:
- The 20 `docs/assets/qa/**/*.kg.json` witnesses still embed the auditor hash once PER CRITERION. They use `qa-witness/v1`, a shape SHARED with the block QA family, where per-criterion script hashes are real information (qa-checkers-voice.ts vs qa-checkers-extended.ts are genuinely different scripts on different criteria of one block). Changing that shape touches the docs QA panel and its e2e coverage, and is a larger commitment than this bean earned. Wants its own bean.
- Whether `docs/assets/qa/` needs to be committed at all is a separate question: it is derived from the sidecars plus the manifest, and the docs site regenerates it at publish time. If it does not need committing, the residual 20 goes to 0 without touching the shared schema. Worth asking before touching the schema.

DONE WHEN: an auditor-only edit changes one file. Currently 21; 1 after the residue above is resolved.

---

## 2026-09-23, stream 4 (`kpcl`) — re-derived, and the residue has its own bean now

Re-measured with this bean's own probe rather than quoting its number: append
one comment line to `scripts/kg-audit.ts`, then run.

| run | files changed |
|---|---|
| `bun run kg:audit` | **2** — the probe itself and `skills/kg-qa.manifest.json` |
| `bun run regen` (43 pairs) | **2** |
| …then `gen-docs-pages.ts` | **24** |

**21 files besides the edit — this bean's stated figure, confirmed.** The fix
holds: 218 → 21, and the 218 are gone for good.

The mechanism is now traced to two lines rather than described:
`content/pipeline/qa-witness.ts:565` reads the auditor from the manifest, and
:582 writes `scriptHash: auditor?.script_hash` into **every criterion of every
kg witness**. So the manifest is already the single source and the 20 witnesses
are 20 projections of it — this bean's own sentence, *"the per-file auditor hash
never added precision the generator could deliver"*, proven a second time.

**A trap worth carrying forward.** The same fact is spelled `script_hash` in the
manifest and `scriptHash` in the witnesses. `grep -rl script_hash --include='*.kg.json'`
returns **0**, and I read that as *the residue is already gone* and came close
to closing this bean on it. `grep -rl scriptHash` returns **20**. A grep-and-stop
reading here returns the opposite of the truth.

**The residue now has the bean this one asked for: `mcdj`.** It carries the
measurement, the two-line mechanism, the spelling trap, and the three options —
stop committing the witnesses / omit `scriptHash` on the kg branch only / leave
it — as the owner's choice, in the order this bean insisted on: *ask whether
they need committing before touching the shared schema.*

**Not closing this bean.** Its Done-when is *"an auditor-only edit changes one
file. Currently 21; 1 after the residue above is resolved."* It is 21. `mcdj` is
what takes it to 1, and this stays open until it does.
