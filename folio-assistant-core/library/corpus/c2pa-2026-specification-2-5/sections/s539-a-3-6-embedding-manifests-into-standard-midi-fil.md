---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s539-a-3-6-embedding-manifests-into-standard-midi-fil
section_title: "A.3.6. Embedding manifests into Standard MIDI Files (MIDI 1.0)"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10897-10904
source_sha256: ff401df19d1fde8c
granularity: heading
---
#### A.3.6. Embedding manifests into Standard MIDI Files (MIDI 1.0)

Standard MIDI Files ([Standard MIDI Files 1.0](https://midi.org/standard-midi-files)) are composed of a header chunk (`MThd`) followed by one or more track chunks (`MTrk`). Each track chunk contains a sequence of MIDI events, including Meta Events (identified by the status byte `0xFF`). The Sequencer-Specific Meta Event (`FF 7F`) is defined by [Standard MIDI Files 1.0](https://midi.org/standard-midi-files) for application-specific binary data, using a manufacturer identifier in its data field.

> **NOTE:**
> This section applies only to Standard MIDI Files (SMF, `.mid`) as defined by the MIDI 1.0 specification. MIDI 2.0 Clip Files use the Universal MIDI Packet (UMP) format, which has no equivalent to the `FF 7F` Meta Event, and are not covered here.

<a id="_c2pa_manifest_store_embedding"></a>
