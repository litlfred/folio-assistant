---
# folio-assistant-qzsq
$schema: bean/1.0.0
title: 'Subscriptions vs remote mounts of the same instance: kg:subscribe on cat-harness trips reference-direction; on the root it is refused because root needs the instance'
status: completed
type: task
priority: normal
created_at: 2026-10-07T12:46:47Z
updated_at: 2026-10-10T15:46:50Z
parent: folio-assistant-fnx4
---

Found on folio-assistant#2320 (bean `hupw`), 2026-10-07. Owner ruling, about 12:10 UTC: **"Skip for now"**. #2320 lands with the remote mounts only. This bean is where the subscriptions get decided.

## What happens

The plan was for folio-assistant to subscribe to the three SMART forks at their pinned merge SHAs, with #2330's `kg:subscribe --upstream-path smart-base`:
- smart-base as a substrate;
- smart-trust and smart-immunizations as content.

Both places the subscription could be recorded refuse it:

1. **On cat-harness (the tool's default `--instance`).** All three are accepted, but `cat-harness/cat-harness.json` then names smart-base, smart-trust and smart-immunizations. Those instances sit above cat-harness, so `check:reference-direction:check --against main` reports a NEW wrong-direction finding (`cat-harness/cat-harness.json → smart-trust`, and the others).
2. **On the checkout root (`--instance .`).** First, the root declares no `substrate-snapshot` directory. With one declared, the declaration is still refused: "subscriptions.0.id: `smart-base` is in `needs`: a subscription is consumed part by part, not loaded whole (issue #1719)". The root `needs` all three, because it remote-mounts them (bean `0mpw`).

## The question for the owner

Can one instance both remote-mount an instance (load it whole, through `needs` and `remoteMounts`) and subscribe to it (consume it part by part)? If yes:
- either the `needs` rule should allow an id that is also a remote mount;
- or a subscription on cat-harness should be exempt from reference-direction.

If no, then the mount is the relation, and the subscription plan for these forks is dropped.

## Done when

- The owner has ruled.
- Then either the three subscriptions are recorded with `kg:subscribe:check` green and no new reference-direction finding, or this bean is closed as "mount only" with that ruling cited.

## Owner ruling, 2026-10-10 15:46 UTC

**Mount only.** The remote mount is the relation; the subscription plan for smart-base, smart-trust and smart-immunizations is dropped.

## Summary of Changes

Closed on the owner's ruling (mount only). No code change: #2320 already landed the remote mounts, and no subscription was recorded.
