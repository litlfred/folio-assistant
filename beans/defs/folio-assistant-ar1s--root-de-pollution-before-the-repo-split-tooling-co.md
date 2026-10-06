---
# folio-assistant-ar1s
title: 'Root de-pollution before the repo split: tooling configs into cat-harness-tools; root keeps only what git, agents, licences and instantiation require'
status: todo
type: feature
priority: normal
created_at: 2026-10-06T18:19:05Z
updated_at: 2026-10-06T18:32:52Z
parent: folio-assistant-7x5n
---

Owner ruling 2026-10-06 (session_012qoycyCSGidZqW245vXhze): 'this needs to be addressed before repo split'. Most root files are monorepo tooling, not the platform.

## Target root
package.json + bun.lock (minimal workspace stub — bun needs both at the workspace root), .gitignore/.gitattributes/.gitmodules, AGENTS.md/CLAUDE.md/GEMINI.md, .mcp.json, .beans.yml, LICENSE/NOTICE/LICENSE-CONTENT.md/THIRD-PARTY-NOTICES.md, README.md, the seven <name>.config.json instantiation markers (owner rule; bean b5f0), folio-assistant.json (until phase 5).

## Phases (one PR each)
- [ ] P1 (bean yywu): excise root tools/ and docs/; .beans/ bean into beans/defs.
- [ ] P2: Docker — .dockerignore with the Dockerfiles to .github/docker/; remove the root Dockerfile no workflow builds (gen-python-deps drift check adjusts).
- [ ] P3: requirements*.txt (gen-python-deps output; dependabot directory:), upstream-pins.json, test-server.mjs into cat-harness-tools/; harness.config.example.json becomes a KG asset under cat-harness docs.
- [ ] P4: bunfig.toml, .bun-version (setup-bun bun-version-file), tsconfig.json, eslint.config.mjs, playwright.config.ts into cat-harness-tools/; scripts out of root package.json; workflows and docs updated; bun run gates green.
- [ ] P5: the root instance's future — folio-assistant.json declares the aggregate checkout (beans/ todos/ memory/ test/ uploads/), not a harness; after p3ny and 7zz1 decide what remains and where it goes.
- [ ] bootstrap/ and bootstrap-tools submodules -> remote mount (bean 0mpw pilot).

## Done when
A fresh clone's root lists only the target set, and every gate is green.


**Owner 2026-10-06: GO**, with the requirement that every moved asset is DESCRIBED IN THE KG at its destination — declared by the receiving instance (a directories entry with graphTypologies, or a declared asset/role), with a description, so check:declared-paths / check:undeclared-files / readme:subgraphs see it. Interaction preferences: default taken — fold interaction/interaction.json into memory/ as a typed node (phase 1).


**P2 refined (owner 2026-10-06: 'should it be part of a tool?' — yes):** every Docker image is part of the Tool that uses it. Tool nodes already carry `install.container` / `invoke.container` (cat-harness/schemas/tool.ts:202,216). Each image (CI image .github/docker/Dockerfile, LaTeX .github/docker/Dockerfile.latex, Lean MCP .github/docker/Dockerfile.lean-mcp + cat-harness-tools/adapters/mcp-server/Dockerfile) moves beside its Tool node and is declared there; workflows build from that context; .dockerignore goes with the context that needs it. The unbuilt root Dockerfile is removed (gen-python-deps' Dockerfile drift check retargets to the CI image).


**Owner 2026-10-06: move memory/ to cat-harness NOW** (phase 1, with yywu): memory/ -> cat-harness/memory/, declared by cat-harness.json (removed from folio-assistant.json), the agent-memory assembler and every reader repointed; interaction preferences fold in as a typed node there.


**Refined (owner 2026-10-06): 'cat-harness or split memory into correct harness'** — each memory/waiver node moves to the harness its lesson belongs to (cat-harness for platform discipline; core/sci/fhir/smart-base/who-iris where the lesson is theirs); each receiving instance declares a `memory` directory; the agent-memory assembler discovers every declared memory directory rather than one path.


**Owner 2026-10-06: remove the 6 expired waivers** (memory/waiver-*.json, all expired on or before 2026-09-23) rather than moving them; git history keeps them. Unsure memory nodes default to cat-harness except locale-directories-are-declared-not-inferred -> core; core gets adding-a-block-kind-is-30-files-not-one, document-render-path-takes-no-tex, there-is-no-recommendation-block-kind.
