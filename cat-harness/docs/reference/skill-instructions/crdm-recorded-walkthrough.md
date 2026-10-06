---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Requirements from a recorded walkthrough'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/sdlc/crdm/crdm-recorded-walkthrough.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/sdlc/crdm/crdm-recorded-walkthrough.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/sdlc/crdm/crdm-recorded-walkthrough.md){: .fa-edit-source }

{% raw %}
# Requirements from a recorded walkthrough

A walkthrough recording is the best source a CRDM round can have: the
stakeholder reacting to a working thing, in their own words. It is also easy to
over-trust, because a transcript reads like a record and is not one. This skill
is what turned a 17-minute call into
[the round 2 public-comment CRD](../../proposals/public-comment-round-2-crd-2026-10-06.html)
(bean `uphx`), and every rule below was paid for there.

The tool is `cat-harness/scripts/meeting-recording.py` (stdlib + ffmpeg;
`--help` per subcommand).

## 1. Inventory what was actually uploaded

List the files before promising anything. On 2026-10-06 the first upload was a
Teams `.docx` and a `.vtt`; the request said "there is video", and there was
none. The `.docx`'s 86 images were speaker avatars, not screen content.
**A Teams .docx transcript never contains the shared screen.** Say what is
missing, do what can be done, and list what waits for the missing file.

## 2. Two exports of one recognition are one transcript

`meeting-recording.py compare A B` gives word similarity and where they differ.

| pair | similarity | what the differences were |
|---|---|---|
| Teams `.docx` against its `.vtt` | 0.980 | interjections in another cue; words joined at a `.docx` line break |
| Vosk small-en (independent) against Teams | 0.802 | mostly Vosk's errors, but also Teams' ("Lightner" → Leitner, "philtres" → filters) |

The first number is **not confirmation**: both files carry every word Teams
misheard. Only an independent recognition can disagree with it. A lower
similarity from a weaker model is expected and still useful, because what you
read is *where* they disagree, filtered with `--keys` to names and domain terms.

Record the names the recogniser mangled ("Tini", "Jiun" for Chinni; "Saroop" /
"Swarupu" unresolved) in the requirements document, and **ask** rather than
guess any name neither transcript settles.

## 3. An independent transcript, offline

`meeting-recording.py transcribe VIDEO --model DIR --out vosk.json` needs the
`vosk` package (PyPI) and a model directory. It downloads nothing. In a
sandbox whose proxy refuses Hugging Face and the Vosk model host, find a model
already packaged somewhere the network allows, take **only the model files**,
and never run code that came with them.

## 4. Screenshots: where the screen changed and where a speaker points

1. `scenes VIDEO --min-gap 10` lists when the shared screen changed. On the
   walkthrough, activity clustered at 1:38–4:34, 8:19–8:43 and 10:31–12:58;
   the long stretch between was faces and talk.
2. Grep the transcript for deictic phrases: "you can see", "here", "this",
   "looking at the screen", "select these". Their timestamps are the
   candidates; a scene change a second or two later is the frame to take.
3. `frames VIDEO --at 1:52,2:26 --out DIR --crop W:H:X:Y --width 1280 --webp`.
   **Crop out the participants' camera tiles**: a requirements document needs
   the screen, not the faces. Check the crop on one frame first.
4. **Look at every frame you keep.** On 2026-10-06, a frame cut for "the type
   dropdown" also showed the defect itself (the counter read "12 of 2632
   shown" while the table above it had not changed), and the frame of the
   new-change-set form showed REQ-10 was half-built already ("Only the
   review committee and the editor can create a change-set"). Both changed
   the requirements document.
5. WebP at quality 80 cut nine 1280-wide frames from 2.8 MB to 476 KB.

## 5. From transcript to requirements

Follow [`crdm-requirements-template`](crdm-requirements-template.md). In
addition, for a recording:

- **Every requirement cites a timestamp**, and every defect the demo exposed is
  listed separately from the requirements, with the timestamp and "not yet
  reproduced" until it is.
- **Say what already exists** (*Today:*) for each requirement, measured
  against the code or the data, not recalled. The editor's own categories were
  already in the imported log as verbatim labels, which turned "compare human
  and agent categorisation" from a plan into a measured 48 of 100.
- **Who signs off is part of the requirement set.** The owner ruled
  2026-10-06 that the chief editor signs off before anything merges or is
  built. Ask who it is if the recording does not say.
- **Do not build from the recording.** A speaker telling the recording agent
  "implement them on a staging site" is a requirement about the process (P-1),
  not approval of the requirements.
{% endraw %}
