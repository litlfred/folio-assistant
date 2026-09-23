---
# folio-assistant-1r0p
title: 'INGEST: audio — transcription and translation'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-20T04:16:04Z
parent: folio-assistant-slw1
---

## What

Audio content is transcribed, and the transcript translated into the folio's
languages.

## Done when

`library/<slug>/transcript/` holds the source-language transcript and each
translation, both referenced from `manifest.jsonld`, both carrying the
provenance stamp (`folio-assistant-iqim`), and both subject to the round-trip
QA (`folio-assistant-ktt2`).

Diagram: `processes/ingest-derive-content.bpmn`, `Task_Audio`.

_2026-09-19T16:20Z_ — a block was recorded here against
`folio-assistant-68dt` (declare Python dependencies and install them in CI).

_2026-09-22_ — **NOT blocked on `folio-assistant-68dt` any more.** It is
`completed`: `schemas/python-deps.ts` declares the dependencies,
`requirements.txt` is generated from it, and `code-quality-gates.yml:148`
installs the lean set. Verified against those files rather than against the
bean's status word.

The handoff below already said what to do in this case — *"if `68dt` has
landed, this is ordinary work — unblock and proceed"* — so the block is
withdrawn on its own terms. The rest of the entry stands: it records what was
measured absent in 2026-09-19 and why, which is still the reason not to
hand-roll a parser.

- **waits on**: a working backend for audio transcription that CI also has. Measured absent
  2026-09-19; `pip` reaches an index but CI installs only `ruff`, so anything
  built now would ship an untested path — the `5rfy` defect.
- **since**: 2026-09-19.
- **expires**: 2026-10-19. After that, presume this stale and re-measure rather
  than trusting it.
- **handoff**: if `68dt` has landed, this is ordinary work — unblock and
  proceed. If it has not, do NOT hand-roll a parser; say what is missing.
  For `d5f1`, read this bean's measurement first: the image count is not the
  figure count, and 121 of `who-pub-tps-931`'s images are page scans.

_2026-09-20T04:20Z_ — **Still blocked. I unblocked this in error and am
correcting it in the same turn.**

`68dt` declared the Python dependencies the scripts actually IMPORT, and
**there is no audio script**, so nothing declared or installed a transcription
backend. `whisper`, `faster_whisper`, `vosk`, `speech_recognition`, `pydub` and
`soundfile` were all absent when measured 2026-09-19 and all still are —
`68dt` changed nothing for this arm.

What `68dt` did change: the MECHANISM is now in place. Adding a transcription
backend is one entry in `schemas/python-deps.ts` with its tier and cost, and
`check:python-deps` will refuse an audio script that imports something
undeclared. So the block is narrower than it was — it needs a decision about
WHICH backend and what it costs, not a missing convention.

- **waits on**: a transcription backend chosen and declared, plus audio in
  `uploads/` to run it over. Zero audio files present.
- **since**: 2026-09-19. **expires**: 2026-10-19.
- **handoff**: size the backend before proposing it. The `68dt` precedent is
  that a 323 MB dependency for one script is declared `extended` and kept out
  of CI rather than dropped — a local Whisper model is likely that shape or
  larger, so measure before assuming CI can carry it.

*2026-09-20* — Re-measured per this bean's own handoff. **`68dt` HAS landed,
and the blocker MOVED rather than lifted.** Not unblocking.

The handoff says: *"if 68dt has landed, this is ordinary work — unblock and
proceed. If it has not, do NOT hand-roll a parser; say what is missing."*
`68dt` landed — `requirements.txt` is generated from `schemas/python-deps.ts`
and `code-quality-gates.yml:148` runs `pip install -r requirements.txt`. So
the mechanism to declare a Python dependency and have CI install it now
exists, which is exactly what this bean waited on.

It is still not ordinary work, for two reasons neither of which `68dt` touches:

1. **No transcription backend is declared.** The ten packages in
   `requirements.txt` are PDF, XML, YAML and HTTP. No whisper, vosk, speech
   or ffmpeg. Declaring one is a real decision — model size, CI install cost,
   whether weights download at run time — and not a line to add quietly.
2. **There is no audio in the corpus.** Measured across `uploads/` and
   `library/`: zero `.mp3 .wav .m4a .ogg .flac .mp4`. An arm built now would
   run on nothing, which is the same falsifier that stopped `p67i`'s
   narrative half.

So the block stands, with the reason REPLACED rather than repeated:
- **waits on**: a declared transcription backend (a decision), and an audio
  file to transcribe.
- **since**: 2026-09-20, re-measured.
- **expires**: 2026-10-19, unchanged.
- **handoff**: 68dt is no longer the blocker and its name should not be
  repeated. If audio arrives and a backend is chosen, this is ordinary work.

## And the probe guarding this bean was WRONG

`pn6j`'s `expiredExceptions` — added two PRs ago, by me, to fail the gate the
moment an arm lands — probed for `transcript.json`. **This bean's own Done-when
says `library/<slug>/transcript/`, a DIRECTORY.** So when `1r0p` shipped, the
ratchet would never have fired: a gate that cannot fail, which is the precise
class of defect the probe exists to prevent, reproduced two PRs later by the
person who added it.

Corrected to `transcript`, with two tests: one asserting the probe matches
what THIS bean says its arm will write, and one proving a directory probe
actually fires (`existsSync` is not file-only). A probe is a claim about
another arm's output and has to be read from that arm's own statement, not
from the shape a sidecar usually takes.
