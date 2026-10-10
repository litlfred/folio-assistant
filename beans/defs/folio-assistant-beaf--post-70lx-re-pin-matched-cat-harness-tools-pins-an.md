---
# folio-assistant-beaf
title: 'Post-70lx re-pin: matched cat-harness + tools pins and root runner paths'
status: in-progress
type: task
priority: normal
created_at: 2026-10-10T05:48:27Z
updated_at: 2026-10-10T06:09:42Z
---

cat-harness e29c6429 (70lx stage 1a) moved scripts/ and the rest of its code to cat-harness-tools (d8d42ab). The index on #2518 (head 90148ed) still pins the pre-move pair, and its root `cat` names cat-harness/scripts/run-script.ts, so no checkout can run cat-harness main. Related: folio-assistant-txue (S5 code out of cat-harness).

Stacked on #2518 as branch claude/post-70lx-repin (#2518 is driven by another session; do not push to its branch).

Done when:
- the lock pins a matched post-70lx pair, written by mount:remote
- the root manifest, .github/mount-from-lock.sh, workflows and bunfig name cat-harness-tools for the moved code
- a fresh lay-down passes mount:lock --check, a frozen install, cat --list and state:mount
- gates have been run and reported

_2026-10-10T05:48:45Z_ — Claimed by claude/post-70lx-repin — pushed to cat/cat-harness/beans so sibling sessions see it before this branch has a PR (bean 35nj).

Blocked 2026-10-10 on the owner: re-pinning cat-harness to 9ca7c325 and cat-harness-tools to f28b36d needs a new trust.consent record in index.config.json (by/on/ref/evidence). The owner's instruction reached this session only relayed by a coordinating agent, so the session did not write a consent record in the owner's name. Once the owner records consent for those two refs, the remaining work is: mount:remote to write the lock; root cat runner and the two pdf-vector-svg.py entries to cat-harness-tools; .github/mount-from-lock.sh to fetch scripts/mount-from-lock.ts from the cat-harness-tools pin; cat-harness/scripts references in 10 workflows and .claude/settings.json.

2026-10-10: PR #2524 (draft, base claude/nifty-johnson-w3mspn). Pinned cat-harness 9ca7c325 + cat-harness-tools f28b36d (owner consent recorded); runner paths moved (9ef70a6). Blocked: state:mount and gates fail because fhir-harness, folio-assistant-sci, folio-assistant-core, smart-base (and likely who-iris, smart-trust, smart-immunizations) at their #2518 pins still import moved cat-harness code; their mains carry the 70lx follow-through; each re-pin needs owner consent. Also cat-harness-tools QA_WRITERS does not claim cat-harness/test/results/script-sidecars/ (86 unclaimed).

2026-10-10 (2): a8e61e5 pins the closure (owner consent); smart-trust/immunizations kept at seed-smart-base tips (consented mains lack declarations). e271313 drops 13 root scripts smart-base declares. Fresh lay-down + state:mount OK. Gates refuse: qa:refresh incomplete from two cat-harness-tools bugs (gen-object-model-uml.ts:87 glossary path; qa-refresh.ts:178 sidecar path) — see #2524.
