---
# folio-assistant-bnuy
title: 'PUBLISHED-PACKAGES: an unanswerable git reads as ''no packages'' — [] where every neighbour refuses'
status: completed
type: task
priority: normal
created_at: 2026-09-30T14:54:32Z
updated_at: 2026-09-30T15:20:46Z
parent: folio-assistant-2upx
---

Found 2026-09-30 while fixing the `maxBuffer` class (this branch, `claude/magical-dijkstra-19yvml`).

`manifests()` in `cat-harness/scripts/check-published-packages.ts`:

```ts
const r = spawnSync("git", ["ls-files", "-z", "--", glob], { ... });
if (r.error !== undefined || r.status !== 0) return [];
```

**`[]` means "git looked and there are none".** It is returned here for
"git could not answer", so an unanswerable git is indistinguishable from a
repository that publishes nothing, and the gate passes over an empty corpus.
That is the `dh4f` shape, in a gate whose whole job is to check the packages
this repository ships.

Every neighbour already draws the line the other way, which is why this is a
defect rather than a style difference:

| helper | on "git could not answer" |
|---|---|
| `schemas/git-corpus.ts` → `gitCorpus` | `undefined` — and its docblock says why `[]` would be wrong |
| `bootstrap-tools/scripts/git-files.ts` → `gitFiles` | `undefined`, same reason restated |
| `scripts/check-portable-paths.ts` | refuses: *"`git ls-files` returned nothing — this is not a checkout"* |
| `scripts/kg-audit.ts` | `result: "unknown"` with a finding |
| **`check-published-packages.ts`** | **`[]`** |

## What was done, and what was NOT

Done: the call was given `maxBuffer: 64 * 1024 * 1024`, like its neighbours.
That removes the only realistic way to REACH the branch — node's 1 MiB stdout
cap, which this repository's whole-corpus listing crossed on 2026-09-30 at
1,058,420 bytes. This call is pathspec-scoped (`package.json`,
`pyproject.toml`), so it was never close.

Not done: the branch still returns `[]`. Changing it is a behaviour change to
a gate nobody asked about in this arc, and it needs its own decision —
refuse (exit non-zero, like `check-portable-paths`), or report
could-not-determine as its own state.

## Done when

- [ ] `manifests()` distinguishes "git could not answer" from "no manifests"
- [ ] a test covers the could-not-answer path, so the new behaviour is not itself vacuous


## Done 2026-09-30 — owner chose "Refuse, like check-portable-paths"

`manifests()` throws `GitUnanswerable` (exported), carrying the pathspec and
git's own reason. `import.meta.main` catches it and exits **2**, distinct from
the **1** a real finding exits with.

**A throw rather than a third return value**, and the reason is the call
shape: `publishablePackages` asks git once PER ECOSYSTEM and concatenates, so
an `undefined` would have to be threaded through each call site and a site
that forgot would be back to the silent empty. A throw cannot be forgotten.

**The entry point's existing vacuity guard did not cover this**, which is a
sharper statement of the defect than the one this bean opened with. It refuses
on `pkgs.length === 0`; a git that failed on `*pyproject.toml` ALONE deleted
the Python packages while the npm ones still answered, so the length was not
0, the guard was satisfied, and the gate reported green over a corpus with a
hole in it. That is `1s5s` again — the npm half passing to vouch for a Python
half nothing ran.

Three tests, calibrated: reverting the throw turns 2 of 15 red. The third is
the one that keeps the distinction alive — a repository that genuinely
publishes nothing must still answer `[]` and must NOT refuse.
