---
name: journey-maps
description: >
  Journeys and workshops as knowledge-graph content: a DAK user scenario told
  as a journey map (`user-scenario` kind: ordered steps, per person what they
  do and feel, pain points, enablers, the record's trust state, and edges to
  stories, BPMN tasks, requirements, FHIR examples and building blocks), the
  `building-blocks` catalogue its steps use, a workshop that teaches from it
  (`workshop` kind: modules, objectives, questions for the room on each step,
  reference tables, sheets, job aids), the `journeys-viewer` visualiser that
  draws them for an instance and the layers it mounts, and the
  `check:journey-refs` gate that every reference they name resolves. Read
  before writing a journey or a workshop, before declaring the viewer, and
  before building a journey walkthrough app of your own.
---

# Journey maps — journeys and workshops as nodes

> Skill id: `journey-maps` · Package: `ui-core` · Kinds: `user-scenario`,
> `building-blocks`, `workshop`, `device-screen` · Tools: `journeys-viewer` (`bun run cat
> journeys:viz`), `journey-refs` (`bun run cat check:journey-refs`)

## The rule

**A journey is content, a workshop is content, and the walkthrough is a
viewer of both.** Write the journey once, as a `user-scenario` node; teach
from it with a `workshop` node that points at its step ids; declare the
`journeys-viewer` visualiser. Do not hand-write the journey again in an app,
in TypeScript, or in a page: each copy drifts from the BPMN and the stories
the node already links.

## The `user-scenario` kind

One file per journey (`user-scenario/0.2.0`; the draft `0.1.0` is read
unchanged), in a directory the instance declares with that kind
(conventionally `scenarios/user-scenarios/`). It keeps the DAK
`UserScenario` fields — `id`, `title`, `description`, `personas` (actor
ids) — and adds the ordered `steps`:

| a step holds | what |
|---|---|
| `lead`, `experiences[]` | per person present: `doing`, `feeling` in their words, `emotion` −2..2 |
| `painPoint`, `enabler`, `policy` | what goes wrong without it, what makes it work, the policy point in one sentence |
| `record` | a code of the scenario's `trustLadder` code list, what it means here, where it is held |
| `handoff` | what passes on: `carrier`, `payload`, `offline` |
| `whatIf[]`, `gaps[]` | alternative paths; what the specification does not cover yet |
| `stories` | user story ids (`scenarios/stories.json`): role-level stories, persona-level steps |
| `realisedBy` | a BPMN file and the flow-node ids that carry the step out |
| `requirements`, `examples` | `req:` node ids; FHIR examples as `Type/id` |
| `uses[]` | a block of a `building-blocks/0.1.0` catalogue, and the ROLE it plays in this step |
| `illustration` | the step's picture (`src`, instance-relative), its `alt`, and the `prompt` to draw it when there is none yet (0.2.0) |

`user-scenario/0.2.0` accepts every `0.1.0` file as it is; only 0.2.0 adds
`partOf`, `views`, `references`, `illustrationStyle` and, on a step, `gaps`,
`references` and `illustration`.

**A picture carries no text.** The step's title and its caption are
translatable page text: the viewer renders the step's `title` above the image
and the illustration's `alt` below it, and neither is ever baked into the
image. A prompt asks for no readable text, signs or logos. The scenario's
`illustrationStyle` holds what every step's picture shares — the style
`prompt`, the `cast` (per actor, how they are drawn, so they stay the same
across steps) and `notes` (cultural notes, what never to draw) — so a step's
`prompt` says only its scene. Without a picture, the journey page shows a
collapsible *Illustration brief* (title, caption, scene, style, cast, notes)
for whoever draws it.
Two relations arrange journeys, and they are not the same: **`follows`
chains** one story told as several journeys (J2 follows J1); **`partOf`
groups** sub-journeys under a parent, which may have no steps of its own. One
journey is one BPMN process, usually.

Every person is fictional. A persona's name, role, goal, needs and
frustrations live on the actor (`meta.persona`), never on the journey. Two
presentation fields are **optional** there too: `initials` (up to three
letters for the avatar) and `color` (`#rrggbb` for the persona's lane and
feeling curve), and `avatar`, a square picture of the person (an image path
from the instance root, `scenarios/avatars/<actor>.webp`). Kept on the actor
when a demonstrator wants a fixed avatar; absent, the viewer derives the
initials from `name` and assigns colours in order. The picture, when there is
one, is drawn wherever the persona appears (cast, map, persona lens,
walkthrough, hand-offs, beside a device screen), the initials on the colour
otherwise. Nothing else reads them.

## The `building-blocks` kind

One `building-blocks/0.1.0` file per catalogue: its `layers` (each with the
question it answers) and `blocks` (a `tool`, `system`, `standard` or
`network`, its layer, jurisdiction, owner, what it is, why it matters, the
ArchiMate element keys that deploy it, links). A step's `uses[].block` names
a block by id, looked up in the journey's own instance first, then in every
instance the checkout mounts.

It is a kind of its own, not a family of `user-scenario`, because the
catalogue describes the architecture: it lives beside the instance's
ArchiMate model, where the overlay that draws those blocks reads it. Readers
find it **by declared kind, never by folder**, so declare the directory that
holds it:

```json
{ "id": "archimate", "path": "archimate/", "graphTypologies": ["archimate"] },
{ "id": "building-blocks", "path": "archimate/building-blocks/", "graphTypologies": ["building-blocks"] }
```

Declare it nested, not as a second kind of `archimate/` itself: every kind of
a directory claims every typed node in it, so `check:kind-validators` would
report the catalogue unmapped under `archimate` and the ArchiMate config
unmapped under `building-blocks`. A catalogue in an undeclared folder, or in
a journeys directory, is not read.

## The `workshop` kind

One `workshop/0.1.0` file per workshop, in a directory declared `workshop`.
It names the `scenarios` it teaches from and, per step it uses
(`{ scenario, step }`): the question for the whole room, a facilitator cue,
the module questions (each tagged with its module), the capabilities the
step needs, and which rows of which `tables` it touches. Tables are generic
(decision rights, legal bases, substitution patterns, cost drivers are rows a
workshop names, not fields of the kind). `assessment` gives the scales a table
rates a capability on; `sheets` the printable canvases; `resources` the job
aids, handouts and readings, each tied to modules or steps. **A question is a
question:** a module asks a room to name, not to decide.

The journey never names the workshop. One journey can be taught by several
workshops to several audiences without changing.

## The `device-screen` kind

What one person sees on their own device at one or more steps: one
`device-screen/0.1.0` file per screen, in a directory declared
`device-screen` (conventionally `scenarios/device-screens/` or
`device-screens/`). It names its `device` (`phone`, `tablet`, `scanner`,
`desktop`, `kiosk`), its `owner` (the actor whose device it is), the `steps`
it shows (`{ scenario, step }`), what to `try` on it in the room, and its
`blocks`, top to bottom:

| block | shows |
|---|---|
| `header` | the app's name, a line under it, a brand colour, a status chip |
| `personCard` | an actor (name and avatar from its persona), with fields and chips; `banner` for a patient bar |
| `qr` | a QR code of `payload`, shown or being scanned; may name the FHIR example it carries |
| `passcode` | digits shown, hidden, or being entered |
| `statusBadge` | verified, unverified, failed, emergency or info, with fields and a verdict |
| `recordList` | rows of icon, label, code, detail and status (`struck` for an allergy); may take its rows from a FHIR example |
| `fields` | labelled values, as a form shows them |
| `consent` | who may see what until when, and whether it is granted |
| `alert` | a message at a severity |
| `actions` | buttons, labels only |
| `note` | small print |

**Data, never markup.** There is no free HTML, and an icon is a name from
a closed glyph list: the screen says what is shown, the viewer how. A block
with `column: "side"` goes in a second column on a wide device. **Do not
build a device-demo app of your own:** a screen is content, like the journey
it shows. A workshop's `presentation.deviceDemo` (an app framed in an
iframe) is only a fallback for when no screen is declared.

## The viewer

Declare it in the instance that publishes the site:

```json
{ "id": "journeys", "renderedBy": "journeys-viewer", "coversKinds": ["user-scenario", "workshop", "device-screen"], "subgraphs": "instance" }
```

A site build runs it with the other declared writers. It writes, under
`<locale>/<instance>/journeys/`, an index of every journey in the checkout
(the mounted layers' included, each instance a sub-graph page), a page per
journey (journey map, then step by step with the step's BPMN flow nodes
highlighted and the workshop layer under each step), and a page per workshop,
per module and for the printable sheets. Everything is static; one small
script adds the stepper, a filter and remembering a table's ticks in the
browser. A workshop's walkthrough has a Device Demo (`demo/`): each device
screen that shows a step it presents, drawn as a static device mock with its
owner beside it; each step links to the screens that show it ("See what
<owner> sees") and each screen back to its steps. An edge that resolves to
nothing is drawn as unresolved, never dropped.

## Checks

`check:kind-validators` parses every node of the four kinds against their
Zod (`cat-harness-tools/schemas/process/user-scenario.ts`, `workshop.ts`,
`device-screen.ts`):
step ids unique, every actor a step names among the personas, every module,
table, row and sheet a workshop names declared in it.

`check:journey-refs` (Tool `journey-refs`) checks what crosses files, with
the viewer's own resolver, so a reference the page draws as resolved is
exactly one that passes:

| a journey names | it must resolve to |
|---|---|
| `personas`, `lead`, `experiences[].actor`, `handoff.from`/`to`, `illustrationStyle.cast[].actor` | an actor in a `scenarios` directory |
| `stories` | a story in a `scenarios` directory's `stories.json` |
| `realisedBy[].process`, `.tasks` | a BPMN file relative to the instance root, and element ids in it |
| `uses[].block` | a block of a catalogue in a `building-blocks` directory |
| `requirements`, `preconditions[].requirements` | a `req:` node |
| `examples` | an entry of a `fhir-artifact-index` |
| `illustration.src` | a file relative to the instance root |
| `follows`, `partOf`, `trustLadder`, `record.state`, `views` | a journey; a code list and a code of it; an ArchiMate view the instance's config names |

and every workshop's `scenarios`, `steps[]` `{scenario, step}`,
`discussion[].steps` and `resources[].steps` (`<scenario>#<step>`) name a
journey and a step of it; every device screen's `owner` and `personCard`
actors are actors, its `steps` are steps of journeys, and the examples its
`qr` and `recordList` blocks name are in a `fhir-artifact-index`; and every
persona's `avatar` is a file of its instance. A file that does not parse is a
finding too. It
runs over the whole checkout, so a workshop teaching from another instance's
journeys is checked whole; the layer pull-request checks run it with every
other `check:` script.
