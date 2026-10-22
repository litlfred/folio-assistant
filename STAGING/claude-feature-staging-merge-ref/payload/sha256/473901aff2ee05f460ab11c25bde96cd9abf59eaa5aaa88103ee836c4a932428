---
name: audio-transcription
description: >
  Turn recorded speech (a meeting recording, a video with audio, an interview)
  into a transcript the library can cite, and choose WHICH open-source
  recogniser to run for the job: whisper.cpp by default, faster-whisper,
  WhisperX with pyannote, Vosk, NVIDIA Parakeet/Canary, or Distil-Whisper.
  Covers audio extraction, why two exports of one recogniser are one opinion,
  how to compare transcripts (WER, CER, DER), translation, and what blocks a
  run. Use when an upload contains audio or video, when someone asks which
  transcription tool to use, or before declaring a new transcription Tool.
allowed-tools: Read Grep Glob Bash
---

# Audio transcription: which recogniser, when, and how to check it

Bean `1r0p`. The first real recording is the smart-ra meeting:
`smart-ra/uploads/output.mp4`, 17:09, H.264 1080p with AAC mono 16 kHz audio,
English, two speakers. It arrived with two transcripts. Both are Microsoft
Teams exports: a `.vtt` with 275 cues and the "Download as .docx" export, about
2,600 words.

**Owner ruling, 2026-10-10:** the default independent recogniser is
**whisper.cpp**.

## 1. Always: extract the audio first

```sh
ffmpeg -i <video> -vn -ac 1 -ar 16000 -c:a pcm_s16le <name>.wav
```

Every recogniser below expects 16 kHz mono PCM, or resamples to it. Extracting
once means each tool sees the same audio, and the comparison measures the
recogniser, not the decoder. Record the source file's SHA-256 beside the WAV.

## 2. Two exports of one recogniser are ONE opinion

The smart-ra `.vtt` and `.docx` agree on 98.0% of words. That agreement is not
confirmation: they share the same errors ("Carl Lightner" for Leitner,
"philtres" for filters), because both are the same Teams recognition, saved
twice. Score agreement only **between independent recognisers**, and treat
none as ground truth. A human-corrected reference is the only ground truth.
The cat-harness skill `crdm-recorded-walkthrough` makes the same rule for
requirements walkthroughs.

An independent Vosk transcript of the same recording agreed with Teams on
80.2% of words, and corrected both errors above. That is what a second opinion
is for.

## 3. Choose by constraint

The licences, language coverage and sizes below were researched on
2026-10-10. Verify them against the project's release page before pinning a
version.

| situation | use | why |
|---|---|---|
| **Default.** CPU only, offline once the model is present, any of the six UN languages | **whisper.cpp** (`transcribe-whisper-cpp`), `base` or `small`; `large-v3-turbo` quantized if time allows | MIT; C++, no Python; covers ar, zh, en, fr, ru, es; segment timestamps; `-tr` translates into English |
| The pipeline is already Python, and word timestamps are wanted | **faster-whisper** (`transcribe-faster-whisper`), int8 with VAD | MIT; CTranslate2, about 4x faster than reference Whisper on CPU; word-level timestamps |
| A quick, tiny second opinion in English or a European language | **Vosk** (`transcribe-vosk`), small model | Apache-2.0; 40–50 MB models, very light; but lower accuracy and **no small Arabic model** |
| Speaker labels, or word-precise alignment | **WhisperX** + **pyannote** | BSD-2 / MIT; forced alignment and diarization; wants a GPU, and pyannote's models need a Hugging Face token |
| English only, best accuracy or throughput, GPU available | **NVIDIA Parakeet-TDT v2** or **Distil-Whisper** | CC-BY-4.0 / MIT weights; **English only**; Parakeet v3 and Canary add fr, es, ru, but **never ar or zh** |

Not for this corpus: any recogniser without Arabic or Chinese, when the
recording is in one of those languages. A tool that silently produces English
from Arabic audio is worse than no transcript.

## 4. Translation is a separate step

Whisper's `translate` task goes **into English only**. To make an English
transcript into ar, zh, fr, ru or es, run a machine-translation tool, then the
round-trip QA (`ktt2`, the `untainted-verification` skill): a back-translator
that sees only the target text, and an adjudicator that never sees it. The
open-source MT options found were MADLAD-400 (Apache-2.0), Opus-MT
(CC-BY-4.0) and Argos Translate (MIT). NLLB's weights are non-commercial;
check the licence against the folio's use before choosing it.

## 5. Check it, with a number

| measure | tool | when |
|---|---|---|
| WER (word error rate) | `jiwer`, after normalising case, punctuation and numbers | against a human-corrected reference |
| CER (character error rate) | `jiwer` | Chinese, and Arabic, where word boundaries are not spaces |
| DER (diarization error rate) | `pyannote.metrics` | only when speaker labels are claimed |
| name and term disagreements | `cat-harness-tools/scripts/meeting-recording.py compare --keys` | between independent recognisers, as a list for a reviewer |

`meeting-recording.py compare` today is a difflib word similarity, not WER.
Report it as "agreement", never as an error rate.

## 6. What blocks a run, stated rather than worked around

Every recogniser needs model weights, and the hosts are:
- **huggingface.co** for the Whisper family (ggml and CTranslate2), pyannote,
  NeMo and Distil-Whisper;
- **alphacephei.com** for Vosk.

In a cloud session whose network policy denies those hosts, the code installs
but has nothing to run. The fix is to add the host to the environment's
allowed domains, or to supply the weights some other way. **Do not
substitute** a different tool's output, or a made-up transcript, for the one
that was asked for.

The `transcribe-faster-whisper` Tool node's remedy for a huggingface.co
refusal currently points at `transcribe-whisper-cpp`, whose ggml models are
hosted on huggingface.co too, so that remedy fails in the same environment.

## Where the pieces are

| piece | where |
|---|---|
| Tool nodes (declared, not installed; bean `r279`) | cat-harness `tools/index.ts`: `transcribe-whisper-cpp`, `transcribe-faster-whisper`, `transcribe-vosk` |
| extract, parse VTT/DOCX, compare, frames, Vosk transcribe | `cat-harness-tools/scripts/meeting-recording.py` |
| walkthrough method (requirements from a recording) | cat-harness `skills/sdlc/crdm/crdm-recorded-walkthrough.md` |
| translation QA | the `untainted-verification` skill; `translation-roundtrip-record` Tool |
