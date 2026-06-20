# Todo Manager — beans work-plan & cross-agent coordination

The session work-plan and cross-agent coordination tracker for this repo is
[`beans`](https://github.com/hmans/beans): a small Go flat-file issue tracker
that stores issues as markdown under `.beans/`. It is installed on demand by
[`scripts/install-beans.sh`](../../../scripts/install-beans.sh) (fresh cloud
sandboxes do not ship it).

`beans` supersedes ad-hoc `TodoWrite` lists and `todos/*.json` sidecars as the
**durable** work-plan: because it is committed to the repo, a plan survives
container reclamation and is visible to sibling agent sessions.

## What beans are (and are not)

- **Beans are the work-plan.** Goals, probes, and the tasks an agent claims and
  drives to completion live as beans. They are durable and cross-session.
- **Beans are not sidecars.** Bulk machine-generated queues — QA audits, witness
  queues, watcher drain queues — stay as bulk JSON under `todos/` / `.beans/*.json`
  and are read by their own `.ts` tooling. **Never** `beans create` a QA/witness
  queue entry. The discipline is: `beans ≠ sidecars`.

## Core commands

```sh
scripts/install-beans.sh      # install the CLI if missing (--force to reinstall)
beans list                    # show the current work-plan
beans check                   # health-check the .beans/ store
beans create "<title>"        # open a new work-plan item
beans show <id>               # read an item
beans <id> --status in-progress   # claim an item (durable, visible to siblings)
```

## Using beans for todos (session + cross-session)

Beans **is** the todo mechanism for agent work. Do not stand up a separate todo
store — no API route, dashboard, or `todos/*.json` work-plan. One mechanism,
agent-generic, durable.

**Session todos (your work-plan for this session).** Track anything you want to
persist as beans, not in your agent's ephemeral in-memory todo tool (e.g.
Claude's `TodoWrite`, or equivalents). The in-memory list is fine for
throwaway intra-turn scratch, but it evaporates when the container is reclaimed.
Open a bean per task, mark it `in-progress` as you start, close it when done —
because `.beans/` is committed, the plan survives a resume in a fresh container.

**Cross-session / cross-agent coordinated todos.** The same committed `.beans/`
store is the shared work-plan across sibling sessions and across different agent
CLIs. Claim before you work (set `in-progress` + note your branch) so two
sessions don't pick the same item; never resolve or delete a sibling's bean. See
`bean-coordination.md` for the full claim/handoff lifecycle.

**What beans is *not* for:**
- Bulk machine-generated queues (QA `*.qa.json`, witness `*.witness.json`,
  watcher drain queues) — `beans ≠ sidecars`; keep those as bulk JSON.
- Content-review feedback on *published documents* — that is a separate domain
  workflow (the `todo-review` skill over `feedback/<paper>/*.ts`), not the agent
  work-plan. Don't conflate the two.

## Coordination discipline

1. **Claim before you work.** Mark the bean `in-progress` so sibling sessions
   working the same goal do not duplicate the effort.
2. **One source of truth per concern.** Do not fork a bean into a parallel
   `todos/*.json` queue; link to the queue from the bean instead.
3. **Move wiring and script together.** When relocating a hook-backed script,
   move its hook reference in the same change — a script without its wiring (or a
   hook reference without its script) is the migration failure mode that left
   dangling references behind (see `docs/folio-assistant-migration.md` §2).
4. **Close on landing.** When the work lands, close the tracking bean and update
   any cross-repo ownership note.

## Relationship to other surfaces

- `scripts/session-start-coord-sweep.sh` — CLI-independent session-start surface:
  fetches `origin/main`, summarizes sibling branch activity. Works even when the
  `beans` CLI is absent.
- `scripts/install-beans.sh` — provisions the `beans` CLI.
- See `docs/folio-assistant-migration.md` for the full migration plan and the
  open requirements for the qou-side / settings.json agent.
