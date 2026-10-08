---
# folio-assistant-t4xb
title: 'MOUNT PATH + ROUTE COLLISIONS: <base>/<harness>/<visualizer> is canonical; <base>/<visualizer> is an opt-in alias'
status: todo
type: task
priority: high
created_at: 2026-10-07T21:48:54Z
updated_at: 2026-10-07T21:48:54Z
parent: folio-assistant-0mpw
---

## The owner's rule (2026-10-07, verbatim in substance)

> remote mounts already land at <name>/ without a path override → we need to caution b/c
> high potential for path collision. <base_url>/<visualizer> is an opt-in (for prettiness or
> so), but <base_url>/<harness>/<visualizer> always works.

## Two collision surfaces, measured on main 33bf3d2

1. **Disk.** Every `remoteMounts` entry in `folio-assistant.json` has no `path`, so each
   lands at `<name>/` in the downstream root. That root also holds the downstream's own
   declared directories (`uploads/`, `test/`, `beans/`, `todos/`, `fsh-guts/`, …).
   `mountRemote` refuses tracked bytes and unlocked directories, so a collision fails loudly.
   But nothing checks a harness NAME against the downstream's declared and reserved paths before
   the mount is declared.
2. **Site routes.** gh-pages serves instance routes (`who-iris/`, `smart-base/`,
   `cat-harness/`, …) at the same level as site-wide routes (`skills/`, `tools/`, `docs/`,
   `assets/`, `glossary/`, `api/`, `payload/`, `STAGING/`, …). An instance named like a site
   route would shadow it, or be shadowed by it.

## Done when

- **Canonical:** every visualiser is reachable at `<base>/<harness>/<visualizer>/`. Every
  generated link uses that form unless an alias is declared.
- **Alias:** `<base>/<visualizer>/` exists only when a declaration opts in. The site build
  refuses an alias that collides with another alias, a harness route, or a reserved site route,
  and names both claimants.
- **Mount path check:** a gate, or mountRemote's plan, rejects a mount whose effective path
  (`path` or `<name>/`) collides with:
  - a directory the downstream declares;
  - a reserved root name;
  - another mount's path.
  It says how to fix it: set `path`.
- **Reserved names:** the reserved root and route names are one declared list, not a literal
  in code. The skill for remote mounts and docs-generation states the rule.

## Related

`1yd7` (landing stickies live with their own instance). #2468 (remote-mount manifest asset,
adopt-if-identical, mount:update, mount health check): its health check can report an
effective-path collision as a finding.
