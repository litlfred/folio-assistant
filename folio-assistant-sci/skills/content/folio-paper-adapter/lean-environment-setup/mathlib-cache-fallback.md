---
part-of: lean-environment-setup
description: >
  Detail for `lean-environment-setup`, split out of it so the parent stays a short entry
  point. NOT a skill of its own — reached through the parent.
---

# lean-environment-setup — the Mathlib cache 403 workaround

The workaround for `lake exe cache get` returning 403.

**Do not start here.** Read the parent's FAST ROUTE first — it exists to stop
you declaring Lean unavailable when it is merely slow to reach.

## Mathlib cache 403 fallback (proven workaround)

**Symptom.** In sandboxed cloud environments, `lake exe cache get` returns
403 forbidden on every mathlib oleans shard, and `lean_diagnostic_messages`
MCP times out at 60 s because no prebuilt oleans are available.

> **⚡ FIRST RESORT — restore prebuilt oleans (~2 min). Do NOT build from
> source until you have tried this.**
>
> ```sh
> folio-assistant-sci/scripts/lake-cache.sh restore
> ```
>
> That is the whole procedure — it derives the package and branch from
> `lean-toolchain` plus the branch family, fetches into a private ref
> (no `FETCH_HEAD` race), handles both on-disk cache formats, and
> **verifies oleans actually landed** instead of trusting that an
> extract implies a usable cache. Exit `1` = miss, `3` = corrupt.
>
> Full command set and failure guide: the `lean-cache-restore` skill.
>
> The from-source sections below are a fallback. If you do build, run
> `folio-assistant-sci/scripts/lake-cache.sh contribute` afterwards so the
> next agent restores instead of rebuilding.
>
> Do not hand-roll the restore with git; the script handles the
> `FETCH_HEAD` race and subdirectory `git ls-tree` pitfalls.
>
> **Out-of-cone modules.** A cache branch carries only the oleans in the
> paper's dependency closure at seed time. A module outside it (e.g. a
> representation-theory import a new file pulls in) still compiles from
> source — that is not a broken restore. Fold it into the next reseed.

**Fallback workaround — source clone + from-source build (only when the
cache-branch restore above misses):**

```bash
# Step 1: Clone mathlib source locally (~144 MB).
cd .. && git clone https://github.com/leanprover-community/mathlib4.git
cd -

# Step 2: Set a global git insteadOf so Lake's mathlib fetches go to
# the local clone instead of the network.
git config --global url."file:///home/user/mathlib4".insteadOf \
  "https://github.com/leanprover-community/mathlib4"

# Step 3: Verify by running an LSP query on a mathlib-importing file.
# The first query will still be slow (cold workspace) but should
# return real diagnostics rather than timing out.
```

> **🟦 When even the mathlib `git clone` 403s (repo-scoped git proxy) —
> use the codeload tarball via the egress proxy.** On stricter web sandboxes
> the git `insteadOf` rewrites *every* `https://github.com/` to a
> **repo-scoped** git proxy that only allows this repo, so Step 1's
> `git clone …/mathlib4` returns **403** (and so does `lake exe cache get`).
> But the **HTTPS egress proxy still reaches `codeload.github.com`** — only
> the *git* path is scoped — so fetch the source tarball at the **pinned
> manifest rev** (must match the restored cache oleans) directly:
>
> ```bash
> REV=$(python3 -c "import json,sys; print(next(p['rev'] for p in json.load(open('lake-manifest.json'))['packages'] if p['name']=='mathlib'))")
> curl -fsS --cacert /root/.ccr/ca-bundle.crt \
>   "https://codeload.github.com/leanprover-community/mathlib4/tar.gz/$REV" \
>   -o /tmp/mathlib-src.tar.gz
> tar xzf /tmp/mathlib-src.tar.gz -C /tmp
> cp -r "/tmp/mathlib4-$REV/Mathlib" .lake/packages/mathlib/   # stage source ALONGSIDE restored oleans
> ```
>
> **Then build the missing delta with `lean`-direct — NOT `lake build`.**
> With source staged next to restored oleans, `lake build <anything>`
> sees the package dir differs from the manifest, prints
> `mathlib: URL has changed; deleting … and cloning again`, **deletes the
> restored oleans**, and re-clones (→ 403). Instead compute the
> missing-olean closure of your target and compile each missing module
> with `lean --root=<pkgRoot> -o <lib>/<Mod>.olean <src>` (set `LEAN_PATH`
> to every `*/.lake/build/lib/lean`). For a package file pass the package's
> own `leanOptions` (e.g. `-D autoImplicit=false`) — otherwise you get
> spurious `Field ?m`/instance-diamond errors that look like real bugs but
> are just the missing option.

After the clone/redirect succeeds, `lean_diagnostic_messages` returns real
error / warning items (not the timeout sentinel), unblocking iterative Lean
proof development.

### Build-from-source path (when you don't need iterative LSP)

If your task is **bulk diagnostics regen** or **one-shot
build-everything**, the local clone + `git insteadOf` above is
sufficient — you don't need the cache at all. `lake build` happily
compiles Mathlib from source; it's just slower.

```bash
# After the clone + insteadOf above:
nohup lake build MyPaper > /tmp/lake-build.log 2>&1 &
tail -f /tmp/lake-build.log              # monitor
grep -c '^✔' /tmp/lake-build.log         # sample progress
```

Throughput slows as Mathlib modules get heavier (Algebra, Data, then
Topology / Analysis). Plausible full-Mathlib build: **1–3 hours**, plus
~10 min for the paper. Once the build finishes, `lake exe cache get`
becomes irrelevant — the oleans are local.

### Web-sandbox addendum — three failure modes the recipe above omits

A stricter network policy can surface three gaps:

1. **The elan toolchain host is firewalled too — not just the cache.**
   `release.lean-lang.org` may return `Host not in allowlist`, so
   `lean_setup` / `elan toolchain install` aborts with
   `failed to parse release data … Unexpected character: H` (an HTML
   error page, not JSON). Workaround: the **GitHub release asset is usually
   allowlisted** (`github.com/leanprover/lean4/releases/...` → 200). Install
   the toolchain by hand (substitute your pinned version):

   ```bash
   apt-get install -y zstd            # tarballs are .tar.zst
   VER=$(cut -d: -f2 lean-toolchain | tr -d '\r')   # e.g. v4.24.0 (strip leading v for the asset path)
   TC=$HOME/.elan/toolchains/leanprover--lean4---$VER
   mkdir -p "$TC" /tmp/lx
   curl -sSL -o /tmp/lean.tar.zst \
     "https://github.com/leanprover/lean4/releases/download/$VER/lean-${VER#v}-linux.tar.zst"
   tar --use-compress-program=unzstd -xf /tmp/lean.tar.zst -C /tmp/lx
   cp -a /tmp/lx/lean-${VER#v}-linux/. "$TC/"
   elan toolchain list   # should now list leanprover/lean4:<VER>
   ```

2. **A `--depth 1` shallow mathlib clone BREAKS lake's checkout.** Lake
   pins a mathlib revision; a shallow clone lacks it, so the checkout dies
   with `external command 'git' exited with code 128`. Use a **full** clone,
   or `cd ../mathlib4 && git fetch --unshallow` before building. (A shallow
   clone is fine only for the LSP-warm path, not for `lake build`.)

3. **The global `insteadOf` can trigger a destructive re-clone loop.**
   With the redirect set, lake may decide the mathlib remote "URL has
   changed", then **delete `.lake/packages/mathlib` and re-clone on every
   build** — wiping progress each run. If you see repeated `info: mathlib:
   URL has changed; deleting … cloning again`, unset the redirect
   (`git config --global --unset
   url."file:///home/user/mathlib4".insteadOf`) and let lake fetch
   normally, or pre-populate `.lake/packages/mathlib` from the local clone
   once and leave the redirect off.

**Bottom line for the strictest sandboxes:** if even a full clone +
un-shallow can't get `lake build MyPaper` past the transitive-dep fetch,
Lean is **not mechanically compilable** in that session — fall back to a
rigorous hand-audit and say so explicitly rather than claiming a green
build you could not run.

### Two more gotchas after a `cat/folio-assistant-sci/lake-cache/*` restore

Both can cost a session **even though the restore itself succeeded**, and
both occur with **no** `insteadOf` redirect set:

1. **The cache may omit the root `Mathlib.olean`.** A cache branch ships
   thousands of Mathlib *submodule* oleans but possibly **not** the root
   aggregator (if the paper lib never imports bare `Mathlib`, it was never
   built/cached). A NEW file doing `import Mathlib` then fails with
   `object file '…/Mathlib.olean' … does not exist` despite thousands of
   oleans present. **Fix:** import specific modules — e.g.
   `import Mathlib.Analysis.SpecialFunctions.Sqrt` `+ import Mathlib.Tactic`
   — never bare `Mathlib` (also the minimal-imports rule).

2. **`lake env lean` / `lake build` re-resolves deps and WIPES the restored
   oleans.** On the restored tree, lake may decide several packages' remote
   URLs "have changed" → `deleting … cloning again` → the Mathlib olean
   count crashes. **This happens without any `insteadOf` redirect.** **Fix
   for verifying a single self-contained file: bypass lake** — run `lean`
   directly with a manual `LEAN_PATH`:
   ```bash
   LP=$(find "$ROOT/.lake/packages" -maxdepth 5 -type d -path '*/.lake/build/lib/lean' | tr '\n' ':')
   # for a file importing other paper modules, also add the workspace + paper oleans:
   LP="$LP$ROOT/.lake/build/lib/lean:$ROOT/content/<paper>/lean/.lake/build/lib/lean"
   env LEAN_PATH="$LP" ELAN_NO_OVERRIDE_NOTICE=1 lean path/to/File.lean   # EXIT 0 = checks
   ```
   lake never runs ⇒ nothing re-resolves. (Whole-lib builds still need lake;
   then expect the re-clone and budget for it.)

> **🟥 VERIFY a single file with `lean`-direct — NEVER `lake build`.** To
> *verify* a PR's one or two changed `.lean` files, run `lean`-direct (the
> gotcha-#2 recipe above). Do **not** reach for `lake build <Module>`: even
> for a single module it re-resolves the dependency graph and **rebuilds
> Mathlib from source** — the `import Mathlib.Tactic` closure alone is
> thousands of modules / 40+ min — *and* it wipes the restored oleans. The
> Mathlib oleans **are reachable** via the cache branch — `git fetch
> --depth=1` + extract is ~2 min. Do not conclude "Mathlib is unreachable /
> Lean uncompilable" until the cache restore + `lean`-direct path has been
> tried.
>
> **Recovery if you already ran `lake build` and it started rebuilding:**
> check `find .lake/packages/mathlib -name '*.olean' | wc -l`; if it dropped
> well below the restored count, **kill lake and RE-RESTORE the cache
> branch** before `lean`-direct. (To kill lake without the `pkill -f` pattern
> matching its own argv, use a bracket escape: `pkill -f 'lake buil[d]'`.)

**When to use which:**

- LSP iteration on one or two files → cache 403 fallback above (warm
  workspace, ~minutes to first useful diagnostic).
- Mass regen of compile diagnostics across all `.lean` files → from-source
  build first, then per-file `lean_diagnostic_messages` pass; budget 2-3
  hours end-to-end.
- Single-PR proof discharge → cache fallback; from-source build is overkill.

**Container-restart caveat.** In Claude Code on the web, the container may
restart between sessions and lose `/tmp/` and `.lake/`. A mathlib clone at
`../mathlib4` typically persists (it lives in the working tree's parent). On
resume: re-confirm the `git insteadOf` redirect, then re-launch the build if
needed. The build is fully incremental — only changed modules rebuild.

### ✅ Fast sandbox build recipe (try FIRST when less-firewalled)

A less-firewalled web session can build from source cleanly — often with no
clone at all:

```bash
# 0. The toolchain is frequently ALREADY installed by a prior lean_setup —
#    it's just not on PATH. Check before reinstalling:
export PATH="$HOME/.elan/bin:$PATH"
lake --version           # if this prints "Lake version … (Lean 4.x.y)", you're set
ls .lake/packages/mathlib/Mathlib/Data/Real/Basic.lean   # mathlib SOURCE usually already fetched

# 1. Build a SINGLE module (its dep cone only), NOT the whole paper — far less to compile.
#    Use -R: a stale "compiled configuration is invalid" error means reconfigure.
ELAN_NO_OVERRIDE_NOTICE=1 nohup lake build -R MyPaper.SomeModule \
  > /tmp/lake.log 2>&1 &
# 2. Watch for completion with a backgrounded until-loop (NOT foreground tail):
( while pgrep -f "lake build -R" >/dev/null; do sleep 30; done; tail -25 /tmp/lake.log ) &
```

**What works / what's blocked in this class of sandbox:**
- ✅ `github.com` dep clones (aesop, Qq, batteries, **mathlib**) — succeed.
- ✅ Building Mathlib **from source** — works (toolchain already installed).
- ❌ `lake exe cache get` — **hangs** (olean cache server unreachable); go
  straight to from-source.
- A single-module dep cone is often a few hundred Mathlib modules, ~tens of
  minutes; a full paper is 1–3 h.

> **⚠️ CACHE FALSE-POSITIVE GREEN — verify a real recompile before trusting
> exit 0.** After RESTORING a cache branch, the restored oleans for a module
> you then *edit* can be treated as up-to-date by Lake's trace check, so
> `lake build -R <Module>` returns **exit 0 with an empty log without
> recompiling your new code** — a false-positive green. A red proof
> (`unsolved goals`) only surfaces on a genuine rebuild. **Rule: after
> restoring the cache, force a real recompile of any module you changed
> before trusting green** — `touch <file>.lean` first, and confirm the log
> ends with `Build completed successfully (N jobs)` (a recompile shows
> tactic-timing lines; a skipped build shows nothing). Do NOT infer success
> from exit code alone, and beware compound commands: a trailing `grep -c …`
> prints `0` but **exits 1** when there are zero matches, masquerading as a
> build failure. Prefer `grep -c … ; true` or read the explicit "Build
> completed" line.

### 🗄️ PRESERVE THE BUILD — seed/restore the `cat/folio-assistant-sci/lake-cache/*` orphan branch

Durable cross-container preservation lives on **orphan branches**
`cat/folio-assistant-sci/lake-cache/<package>-<toolchain-slug>` (slug for
`v4.24.0` = `v4-24-0`).
These survive container reclaim (git-versioned), unlike `.lake/`
(ephemeral) or `../mathlib4` (parent-tree, often persists but not
guaranteed).

The cache branch stores the oleans as a **compressed tarball split into
<100 MB chunks** (`lake-oleans.tgz.part00…`), because GitHub hard-rejects
any single file > 100 MB on push. NOT the raw `.lake/` tree (a raw multi-GB
tree push is hostile). Never `git switch --orphan` in the main tree (it
leaves every file untracked and traps you on switch-back).

**RESTORE first (before any from-source build):**
```bash
folio-assistant-sci/scripts/lake-cache.sh restore     # exit 1 = not seeded yet; 3 = corrupt
```
Do not hand-roll this.

> **⚠ Post-restore hazard — verify mathlib's origin URL BEFORE running
> lake.** The tar carries `.lake/packages/mathlib/.git` from the *seeding*
> container; if its `origin` URL differs from the manifest URL (e.g. it
> recorded the seeder's git proxy), the first `lake` invocation prints
> `mathlib: URL has changed` and **deletes the restored package — including
> its oleans — before re-cloning**. Check first:
>
> ```bash
> git -C .lake/packages/mathlib remote get-url origin   # must match lake-manifest.json
> git -C .lake/packages/mathlib remote set-url origin \
>   https://github.com/leanprover-community/mathlib4    # fix a mismatch
> ```
>
> **Variant: packages restored with NO `.git` at all.** If the seed tar
> carries package sources + oleans but no `.git` dirs, do **not** let lake
> touch the tree. **Graft** valid git state in place first — per
> `lake-manifest.json` entry: `git init` + `git remote add origin <url>` +
> `git fetch --depth=1 origin <rev>` + `git checkout -qf <rev>` inside each
> package dir. Lake then accepts every package untouched. A package dir
> missing entirely is fine — lake clones just that one.

**SEED after a successful build** so the next agent restores in ~2 min:
`folio-assistant-sci/scripts/lake-cache.sh contribute` (guarded; see
`lean-cache-restore`), or `lake-cache.sh seed --push` to force a seed. The
script splits the tarball into <100 MB parts, pushes in batches, and
verifies a restore before publishing. Pack from the nested
`content/*/lean/.lake/build` when root `.lake/build` is absent, or the
cache carries no paper oleans.

Keep the number of cache branches bounded. A CI workflow can
prune/refresh on `lean-toolchain`/`lakefile.toml` changes — if CI billing is
up, prefer triggering it over an ad-hoc multi-GB agent push.

**Rule:** RESTORE → (build only if miss) → SEED.
Never silently rebuild Mathlib and throw the oleans away.

## Delegate the install to a sub-agent (recommended for the main task)

The full bootstrap (elan + GitHub-toolchain workaround + full mathlib clone
+ from-source olean build) is **long, fiddly, and frequently blocked** — it
should **not** run in the foreground of a content/proof task. Kick off a
**background sub-agent** so the main session keeps moving, then verify the
target file(s) when it reports back.

```text
Agent(
  subagent_type = "general-purpose",
  run_in_background = true,
  description = "CatBootstrap Lean + verify <file>",
  prompt = <the runbook below + the specific file/lemma to compile>
)
```

**Sub-agent runbook (give it these env facts so it doesn't re-derive them):**

1. **Probe the network first:** `curl -sI https://github.com` (usually 200)
   vs `curl -sI https://release.lean-lang.org` (often 403 in web sandboxes).
   This decides the toolchain path: if `release.lean-lang.org` is blocked,
   use the **GitHub-release manual install** in §"Web-sandbox addendum" item 1.
   Set `ELAN_UPDATE_CHECK=0` to suppress `release.lean-lang.org` pings.
2. **Mathlib:** a **full** clone (NOT `--depth 1` — shallow breaks `lake`'s
   rev checkout) at the repo-pinned commit (`grep inputRev lake-manifest.json`).
   For a *single-file* check, a scratch lake project with `require mathlib from
   "<local path>"` (path dep) sidesteps the `insteadOf` re-clone loop.
3. **Build is slow** (no cache → oleans from source). Let it run; report
   progress. Compile the **statement** first (`sorry` ⇒ only a sorry warning),
   then the proof.
4. **Report findings even if blocked** — the exact failing step + whether it
   is a *hard* network block vs. just slow. If even a full clone can't get past
   the transitive-dep fetch, Lean is **not mechanically compilable** in that
   session — say so explicitly and fall back to a rigorous hand-audit; do
   **not** claim a green build you could not run.

## PATH Configuration

Session scripts should source a Lean-env helper (e.g.
`scripts/lib/lean-env.sh`) that sets:

```bash
export PATH="$HOME/.elan/bin:$HOME/.local/bin:$HOME/.bun/bin:$PATH"
```

The paper-assistant inherits the shell's PATH when launched via `.mcp.json`.
Ensure elan's bin directory is on the PATH in the shell profile
(`~/.bashrc`, `~/.zshrc`, or `~/.profile`).

