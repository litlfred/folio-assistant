---
# note on folio-assistant-wnhh from agy/wnhh-sushi-publisher-local
$schema: folio-bean-note/v1
bean: folio-assistant-wnhh
branch: "agy/wnhh-sushi-publisher-local"
created: "2026-10-02"
---
## handover: IG AST + smart-* separation + agent-handoff 2026-10-02

## Handover report: IG AST pipeline + smart-* separation + agent-handoff (session_01PricYFhYhFA5DuMJaWo3CE)

- **Session:** https://claude.ai/code/session_01PricYFhYhFA5DuMJaWo3CE
- **Written:** 2026-10-02 ~20:45 UTC. Reason: the owner asked for `prepare-for-handover` (#1912), to be sent to the merge steward.
- **Role and mandate:** I own bean `wnhh` (the IG Publisher AST cache and pipeline) and the smart-* separation shims (bean `n3ni`), and I authored skill `agent-handoff`. The owner's rulings, verbatim:
  - "Never merge to `main`."
  - "Never create a new repository for a package cache."
  - "Push only to branches you create, plus the `fhir-ast/*` cache branch."
  - "Do not take FHIR packages from the npm registry. That namespace is squatted."
  - (2026-10-02) "published to feature branch is fine": push to feature branches without waiting for the full local gate set.

### Where I'm going (current arc)
The goal is an IG site built from the IG Publisher AST cache, with dynamic resource pages, for smart-trust and smart-base (epic `uhkv`). The caches must verify on any clean clone. In parallel I am preparing the smart-* instances to leave this repository (one platform import seam per instance) and turning the `mac1` handoff's failures into the `agent-handoff` skill. "Done" means #1816, #1860 and #1884 are green, mergeable and approved by the owner.

### Done so far
- **Dynamic AST resource pages** (#1816, `b5dbc1d1`):
  - verified in Chromium on all 678 smart-trust pages: 0 errors, 1,176 links resolve locally, 0 `file:` links;
  - the preview deploys `smart-trust/ast/` beside `smart-trust/ast-data/`.
- **Both FHIR AST caches verify `valid` on fresh clones** (bean `mac1`, closed `0457ed35`):
  - `litlfred/smart-trust@fhir-ast/smart.who.int.trust` `f254e5bb`, digest `c1023d82`;
  - `litlfred/smart-base@fhir-ast/smart.who.int.base` `eb7bed83`, digest `bd074bf9`.
- **The exporter takes its digest before the build**: `litlfred/fhir-ig-publisher` `84ee3c8`, merged into PR #8 (head `33e6a49`, green, owned by session_01DnFZtVpff4o7puqWazGvKN).
- **`ig-cache` reads and writes both branch names**, `cat-fhir-ast/<pkg>` and `fhir-ast/<pkg>` (#1816, `40d2286d`), as the steward asked for #1913.
- **Skill `agent-handoff`** (#1884, issue #1882, bean `pgct`). It covers:
  - roles;
  - the one-sentence paste and a `## Brief` in the bean;
  - the checkout test;
  - verifying on an untouched copy;
  - five failure kinds.
- **Platform import seam** (#1860, bean `n3ni`):
  - `smart-base/platform.ts`, with every climb out of the instance rerouted through it, including the 17 that arrived with main's DAK move;
  - an `instance-separation-imports` guard.

### Next in queue
1. **#1816:** merge main again (it conflicts as of 20:40). Take main's side for the generated files, then regenerate to a fixed point. The recipe is under "How to resume".
2. **#1860:** CI `readme:subgraphs:check` reports `cat-harness/scripts/README.md` stale on `10ad4fff`, but locally the generator reports it current. Find the difference between the two environments before regenerating again. The ignored `__pycache__` is ruled out: I moved it aside and the README did not change.
3. **`lean-cache-restore`:** the steward asked (19:16) that the table row naming `lake-cache/<package>-<toolchain>` give both forms, `cat-lake-cache/…` and `lake-cache/…`. File: `folio-assistant-sci/skills/content/folio-paper-adapter/lean-cache-restore.md`, about line 85. Ride it on #1816.
4. **Owner's new feature request, not started:** `cat-kg-jsonld` staging. Each `<stub>` writes its JSON-LD KG updates to a `cat-kg-jsonld` branch; CI gates them; the gated branch updates the CDN (gh-pages); rendering is multi-stage and runs bootstrap first, then the dependency walk. Only a bootstrap failure is catastrophic; a failed subgraph skips its dependency cone. The owner asked to "bean up and roast with dispatch agent". No bean exists yet. Check for duplicates first, then create one under CRDM.
5. **When #1766 is green and mergeable:** merge it into #1816, then record the `mac1` result on `wnhh`. `wnhh` must stay byte-identical on both PRs.

### In flight
| item | kind | state | next action | owner |
|---|---|---|---|---|
| #1816 `agy/wnhh-sushi-publisher-local` @ `40d2286d` | PR | conflicts with main; no CI on head (prior head `b27fcfe8` green) | merge main, regenerate, push | this session |
| #1860 `claude/smart-separation-platform-shims` @ `10ad4fff` | PR (draft) | CI red: Repository gates, `readme:subgraphs:check` | root-cause the README difference | this session |
| #1884 `claude/agent-handoff-skill` @ `8bb669fc` | PR (draft) | **green**, merges clean | owner review | this session |
| fork PR #8 `claude/ast-export` @ `33e6a49` | PR | green | owner review | session_01DnFZtVpff4o7puqWazGvKN |
| #1766 `claude/wonderful-curie-gbfeuy` @ `00e30f8c` | PR (watch only) | conflicts, no CI | wait | session_01DnFZtVpff4o7puqWazGvKN |
| `wnhh` | bean | in-progress; byte-identical with #1766 | record the `mac1` result after #1766 | this session |
| `mac1` | bean | completed `0457ed35` | none | done |
| `pgct` | bean | in-progress (#1884) | close on merge | this session |
| `n3ni` | bean | in-progress (#1860) | close on merge | this session |
| `8ao5` | bean | scrapped (duplicate of `mac1`, re-identified) | none | done |

### Blockers and dependencies
| blocker | waits on | since | expires / re-check |
|---|---|---|---|
| #1860 README stale only in CI | root cause unknown | 19:16 UTC | next push to #1860 |
| `wnhh` note of the `mac1` result | #1766 green and mergeable | 18:00 UTC | each #1766 event |
| `fhir-ast/*` → `cat-fhir-ast/*` rename | steward (#1913); #1816 already handles both names | 19:16 UTC | the steward reports the rename |

### Decisions pending (owner)
- **`cat-kg-jsonld` (item 4):** run the CRDM requirements workflow and a dispatched roast. Per `swarm-management`, the agent count, model level and rough cost are asked per swarm; the recommendation is 3 agents (critic, CI-gating, dependency-cone) at the session's model.
- **Duplicate bean id `t3n8` on main:** two different beans share it. A task was suggested to the owner; it is not mine to fix in these PRs.

### Unpushed or at-risk state
- **Git:** none. `git log @{u}..HEAD` is empty in `/home/user/folio-assistant` (#1860), in `wt1816` (#1816, pushed via `HEAD:agy/wnhh-sushi-publisher-local`) and in `wtho` (#1884).
- **Moved file:** `cat-harness/scripts/__pycache__` (gitignored) is moved aside to the scratchpad. Harmless; it is rebuilt automatically.
- **Scratchpad** (lost with the container, all reproducible):
  - the local Jekyll build `jk2/`;
  - the e2e output `e2e-out/`;
  - the gate logs;
  - the screenshots `dyn-*.png`.
  - **Rebuild with:** `bun run smart-trust:ast-site --ig-root <clone> --out <dir>`.
- **Running jobs:** none. All background watches have finished.

### How to resume
1. On #1816:
   ```
   git fetch origin && git switch agy/wnhh-sushi-publisher-local && git merge origin/main
   ```
   Resolve conflicts in generated files to main's side (`git checkout --theirs`). Then regenerate twice:
   `skill:register glossary:page term:mapping lsi:skills docs:auto kg:audit kg:audit:all readme:subgraphs readme:sync:all audit:coverage root-scan-census check:wireframes kg:detangle`.
   Then run the matching `:check` scripts, `check:bean-parents` and both `*:pages:check`, and push.
2. On #1860: reproduce `readme:subgraphs:check` from a **fresh clone** with `bun install --frozen-lockfile` and submodules, to find what CI sees that the long-lived checkout does not. Lesson from `mac1`: check on an untouched copy.
3. Read #1913 and the steward's messages before touching any `fhir-ast` or `lake-cache` reference.

## handover: IG AST + smart-* separation + agent-handoff 2026-10-02

## Handover report: IG AST pipeline + smart-* separation + agent-handoff (session_01PricYFhYhFA5DuMJaWo3CE)

- **Session:** https://claude.ai/code/session_01PricYFhYhFA5DuMJaWo3CE
- **Written:** 2026-10-02 ~20:45 UTC, updated ~22:10 UTC. Reason: the owner asked for `prepare-for-handover` (#1912), to be sent to the merge steward.
- **Role and mandate:** I own bean `wnhh` (the IG Publisher AST cache and pipeline) and the smart-* separation shims (bean `n3ni`), and I authored skill `agent-handoff`. The owner's rulings, verbatim:
  - "Never merge to `main`."
  - "Never create a new repository for a package cache."
  - "Push only to branches you create, plus the `fhir-ast/*` cache branch."
  - "Do not take FHIR packages from the npm registry. That namespace is squatted."
  - (2026-10-02) "published to feature branch is fine": push to feature branches without waiting for the full local gate set.

### Where I'm going (current arc)
The goal is an IG site built from the IG Publisher AST cache, with dynamic resource pages, for smart-trust and smart-base (epic `uhkv`). The caches must verify on any clean clone. In parallel I am preparing the smart-* instances to leave this repository (one platform import seam per instance) and turning the `mac1` handoff's failures into the `agent-handoff` skill. "Done" means #1816, #1860 and #1884 are green, mergeable and approved by the owner.

### Done so far
- **Dynamic AST resource pages** (#1816, `b5dbc1d1`):
  - verified in Chromium on all 678 smart-trust pages: 0 errors, 1,176 links resolve locally, 0 `file:` links;
  - the preview deploys `smart-trust/ast/` beside `smart-trust/ast-data/`.
- **Both FHIR AST caches verify `valid` on fresh clones** (bean `mac1`, closed `0457ed35`):
  - `litlfred/smart-trust@fhir-ast/smart.who.int.trust` `f254e5bb`, digest `c1023d82`;
  - `litlfred/smart-base@fhir-ast/smart.who.int.base` `eb7bed83`, digest `bd074bf9`.
- **The exporter takes its digest before the build**: `litlfred/fhir-ig-publisher` `84ee3c8`, merged into PR #8 (head `33e6a49`, green, owned by session_01DnFZtVpff4o7puqWazGvKN).
- **`ig-cache` reads and writes both branch names**, `cat-fhir-ast/<pkg>` and `fhir-ast/<pkg>` (#1816, `40d2286d`), as the steward asked for #1913.
- **Skill `agent-handoff`** (#1884, issue #1882, bean `pgct`). It covers:
  - roles;
  - the one-sentence paste and a `## Brief` in the bean;
  - the checkout test;
  - verifying on an untouched copy;
  - five failure kinds.
- **Platform import seam** (#1860, bean `n3ni`):
  - `smart-base/platform.ts`, with every climb out of the instance rerouted through it, including the 17 that arrived with main's DAK move;
  - an `instance-separation-imports` guard.

### Update ~22:10 UTC
- **Cache branches at their final names** (agy, owner-approved): `cat/fhir-harness/fhir-ast/smart.who.int.trust` (`f254e5bb`) and `cat/fhir-harness/fhir-ast/smart.who.int.base` (`eb7bed83`).
- **#1816 resolves all three names, final first** (`b0aa9f0b`): `cat/fhir-harness/fhir-ast/<ig>` → `cat-fhir-ast/<ig>` → `fhir-ast/<ig>`.
- **#1816 is merged with main and regenerated** (`d58e45a3`). The merge also removed a dead `cat-harness/test/results/kg-qa/tools/ig-cache.kg-qa.json`: it was added on this branch and never on main, and the Tool lives in `fhir-harness`. All local checks pass.
- **`cat-kg-jsonld` is beaned only** (steward's choice, budget ~3%). Bean `073f` sits under `whlc` beside `4ak5`, on branch `claude/kg-jsonld-staging-bean` (`ee473081`), cut from #1912 and handed to the steward to merge. The roast is deferred.

### Next in queue
1. **#1816:** confirm CI is green on the latest head, then send the steward `ready: <sha>`.
2. **#1860:** CI `readme:subgraphs:check` reports `cat-harness/scripts/README.md` stale on `10ad4fff`, but locally the generator reports it current. Find the difference between the two environments before regenerating again. The ignored `__pycache__` is ruled out: I moved it aside and the README did not change.
3. **`lean-cache-restore`:** the steward asked (19:16) that the table row naming `lake-cache/<package>-<toolchain>` give both forms, `cat-lake-cache/…` and `lake-cache/…`. File: `folio-assistant-sci/skills/content/folio-paper-adapter/lean-cache-restore.md`, about line 85. Ride it on #1816.
4. **Done as a bean only (`073f`); the rest is not started:** `cat-kg-jsonld` staging. Each `<stub>` writes its JSON-LD KG updates to a `cat-kg-jsonld` branch; CI gates them; the gated branch updates the CDN (gh-pages); rendering is multi-stage and runs bootstrap first, then the dependency walk. Only a bootstrap failure is catastrophic; a failed subgraph skips its dependency cone. The owner asked to "bean up and roast with dispatch agent". No bean exists yet. Check for duplicates first, then create one under CRDM.
5. **When #1766 is green and mergeable:** merge it into #1816, then record the `mac1` result on `wnhh`. `wnhh` must stay byte-identical on both PRs.

### In flight
| item | kind | state | next action | owner |
|---|---|---|---|---|
| #1816 `agy/wnhh-sushi-publisher-local` @ `d58e45a3`+note | PR | merged with main, local checks green; CI pending | `ready:` to steward when CI is green | this session |
| #1860 `claude/smart-separation-platform-shims` @ `10ad4fff` | PR (draft) | CI red: Repository gates, `readme:subgraphs:check` | root-cause the README difference | this session |
| #1884 `claude/agent-handoff-skill` @ `8bb669fc` | PR (draft) | **green**, merges clean | owner review | this session |
| fork PR #8 `claude/ast-export` @ `33e6a49` | PR | green | owner review | session_01DnFZtVpff4o7puqWazGvKN |
| #1766 `claude/wonderful-curie-gbfeuy` @ `00e30f8c` | PR (watch only) | conflicts, no CI | wait | session_01DnFZtVpff4o7puqWazGvKN |
| `wnhh` | bean | in-progress; byte-identical with #1766 | record the `mac1` result after #1766 | this session |
| `mac1` | bean | completed `0457ed35` | none | done |
| `pgct` | bean | in-progress (#1884) | close on merge | this session |
| `n3ni` | bean | in-progress (#1860) | close on merge | this session |
| `8ao5` | bean | scrapped (duplicate of `mac1`, re-identified) | none | done |

### Blockers and dependencies
| blocker | waits on | since | expires / re-check |
|---|---|---|---|
| #1860 README stale only in CI | root cause unknown | 19:16 UTC | next push to #1860 |
| `wnhh` note of the `mac1` result | #1766 green and mergeable | 18:00 UTC | each #1766 event |
| `fhir-ast/*` → `cat-fhir-ast/*` rename | steward (#1913); #1816 already handles both names | 19:16 UTC | the steward reports the rename |

### Decisions pending (owner)
- **`cat-kg-jsonld` (item 4):** run the CRDM requirements workflow and a dispatched roast. Per `swarm-management`, the agent count, model level and rough cost are asked per swarm; the recommendation is 3 agents (critic, CI-gating, dependency-cone) at the session's model.
- **Duplicate bean id `t3n8` on main:** two different beans share it. A task was suggested to the owner; it is not mine to fix in these PRs.

### Unpushed or at-risk state
- **Git:** none. `git log @{u}..HEAD` is empty in `/home/user/folio-assistant` (#1860), in `wt1816` (#1816, pushed via `HEAD:agy/wnhh-sushi-publisher-local`) and in `wtho` (#1884).
- **Moved file:** `cat-harness/scripts/__pycache__` (gitignored) is moved aside to the scratchpad. Harmless; it is rebuilt automatically.
- **Scratchpad** (lost with the container, all reproducible):
  - the local Jekyll build `jk2/`;
  - the e2e output `e2e-out/`;
  - the gate logs;
  - the screenshots `dyn-*.png`.
  - **Rebuild with:** `bun run smart-trust:ast-site --ig-root <clone> --out <dir>`.
- **Running jobs:** none. All background watches have finished.

### How to resume
1. On #1816:
   ```
   git fetch origin && git switch agy/wnhh-sushi-publisher-local && git merge origin/main
   ```
   Resolve conflicts in generated files to main's side (`git checkout --theirs`). Then regenerate twice:
   `skill:register glossary:page term:mapping lsi:skills docs:auto kg:audit kg:audit:all readme:subgraphs readme:sync:all audit:coverage root-scan-census check:wireframes kg:detangle`.
   Then run the matching `:check` scripts, `check:bean-parents` and both `*:pages:check`, and push.
2. On #1860: reproduce `readme:subgraphs:check` from a **fresh clone** with `bun install --frozen-lockfile` and submodules, to find what CI sees that the long-lived checkout does not. Lesson from `mac1`: check on an untouched copy.
3. Read #1913 and the steward's messages before touching any `fhir-ast` or `lake-cache` reference.
