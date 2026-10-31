---
name: l4-application-run-local
description: >
  Run an L4 application that is already built, on the agent's own machine,
  against a clean IG build, so a person can try or demonstrate it before
  anything is hosted. Read before starting a local copy of an L4 app for a
  review, a demo or a country adaptation check.
---

# l4-application-run-local

> Skill id: `l4-application-run-local` · Package:
> `authoring-who-smart-guidelines` · Beside stage 8b,
> [`l4-application-build`](l4-application-build.md)

`l4-application-build` makes an application from a brief, an IG build and the
chosen wireframes. This skill does not build anything: it starts an
application that exists, on the machine of whoever will look at it, so its
behaviour can be checked against an IG (WHO's, or a country adaptation of it)
before it is staged or hosted.

The owner asked for it on 2026-10-30 (litlfred/smart-immunizations-uganda#2):
*"localhost as a Tool that can be invoked by agent to deploy"*.

## Steps

1. **Use a clean IG build, not a publication.** The same rule as stage 8b:
   the application reads the IG's canonicals and resources as built.
2. **Run it locally only.** Bind to 127.0.0.1. Nothing is published, and a
   person on another machine cannot open the URL; say so when handing it over.
3. **Hand over the URL and how to stop it.** Re-running on the same commits
   reuses what is loaded; stopping is part of the hand-over.
4. **Report what you could not check.** A run that could not start (no
   Docker, a refused host) is reported as not run, never as a pass.

## Tools

The Tools that satisfy this skill are listed by `bun run cat check:tools`.
For the WHO SMART Immunizations IG and its country adaptations that is
`immz-schedule-app-local`.
