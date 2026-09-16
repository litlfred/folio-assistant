# Proposal — an incremental IG build: dependency cones, a warm validator, and a separate meta-index

**Status:** analysis in progress — bottleneck analysis and as-is pipeline landed; the
design sections are being written against the measurements in §3.
**Bean:** `267x` · **Issue:** [#181](https://github.com/litlfred/folio-assistant/issues/181)

A WHO SMART Guidelines DAK publishes its FHIR Implementation Guide through
`smart-base`'s `ghbuild.yml`: one monolithic `publisher.jar` run per push, and every
run re-derives everything from source. A one-line edit to one profile costs the full
build. This proposal is the bottleneck analysis, and a design for an intermediary
derived-artefact layer with dependency cones in the shape the Lean cache already has
— restore-first, content-hash keyed, verified seed, resumable phases, exit codes as
the contract — split into three separable steps: a warm validator whose loaded
object model is tied to its source cone and cached, re-rendering of only the
changed artefact's cone, and a meta-index rebuild that runs on its own.

---

## 1. What runs today, and what it throws away

_(landed — see the sections below)_

## 2. The publisher's phase model

_(pending — being grounded in the publisher source, not memory)_

## 3. Measurements

_(pending — SUSHI, source-level dependency cones on `smart-immunizations` and `smart-base`)_

## 4. Where the time goes, and what would have to be true for a cone to help

_(pending)_

## 5. Design — three steps, three services

_(pending)_

## 6. Ownership — publisher, smart-base CI, folio-assistant

_(pending)_

## 7. Phased plan, gates, and what would falsify each phase

_(pending)_
