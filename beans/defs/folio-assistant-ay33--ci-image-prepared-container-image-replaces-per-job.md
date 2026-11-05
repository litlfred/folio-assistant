---
# folio-assistant-ay33
$schema: bean/1.0.0
title: 'CI image: prepared container image replaces per-job setup'
status: in-progress
type: task
priority: high
created_at: 2026-11-05T11:55:31Z
updated_at: 2026-11-05T11:55:31Z
parent: folio-assistant-k3vv
---

Sibling 'CI speed: prepared image' (launched by session_01VQDpPffYARDQ8juksAZScf). Build ghcr.io/litlfred/folio-assistant-ci once per hash of index.lock.json + bun.lock + tool versions, holding mounted layers, node_modules, Chromium + deps, Java/PlantUML, Ruby/Jekyll. Jobs restore via .github/actions/ci-setup and only verify mounts (mount:lock:check); fall back to today's steps when no image exists. Owns: ci-image workflow, .github/actions/ci-setup, setup steps of code-quality-gates.yml and feature-staging.yml jobs.

## Done when
[ ] ci-image workflow builds and pushes on main/dispatch only, minimal perms, pinned actions
[ ] ci-setup composite restores from the image, falls back cleanly
[ ] setup seconds measured before/after with run IDs
[ ] job-collapse proposal written
