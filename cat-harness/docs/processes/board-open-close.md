---
title: 'Board: open and close content'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/board-open-close.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Board: open and close content

`Process_BoardOpenClose` · advisory · 7 step(s)

What a reader does to a board and what the renderer does back: every card rests as its avatar, a window opens onto the one the reader chose, and it closes back to where it came from. You are in this process when the question is a READER's — which card is open, what is raised, how to get back. Semantic zoom is in here too and is deliberately not the same mechanism: the threshold is resolved from the kind and applies itself by SIZE, while opening and closing are a person's acts. Conflating them is how a board starts changing under somebody who did not touch it. The rule the diagram exists to hold is the one about the way back: an action whose inverse is not reachable is not a toggle, and a window that cannot be closed is a navigation dead end wearing a control's clothes.

<img src="../assets/img/workflows/board-open-close.svg" alt="BPMN diagram: Board: open and close content" style="max-width:100%">

## How it connects

- **Called by:** no call activity names this process
- **Calls:** none

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Reader | `user` | — |
| Board renderer | `board-renderer` | Acts and decides nothing: the start, the gateway and the end all sit in the reader's lane, so every node here is downstream of a choice somebody else made. That split is the point — a renderer that chose what to open would put layout in charge of what the folio asserts. |

## Steps

**7** of 7 step(s) carry no documentation — `activity-documented` lists them.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Render every card as its avatar**<br>`A_RenderAvatars` | Board renderer | [`board-windows`](../reference/skill-instructions/board-windows.html) | — |
| **Project a window onto the board**<br>`A_Open` | Board renderer | [`board-windows`](../reference/skill-instructions/board-windows.html) | — |
| **Raise the window the reader selected**<br>`A_Raise` | Board renderer | [`board-windows`](../reference/skill-instructions/board-windows.html) | — |
| **Close the window back to its avatar**<br>`A_Close` | Board renderer | [`board-windows`](../reference/skill-instructions/board-windows.html) | — |
| **Leave a reachable way back**<br>`A_OfferWayBack` | Board renderer | [`board-windows`](../reference/skill-instructions/board-windows.html) | — |
| **Resolve the kind's zoom threshold**<br>`A_ResolveThreshold` | Board renderer | [`board-windows`](../reference/skill-instructions/board-windows.html) | — |
| **Swap cards below the threshold; leave open windows alone**<br>`A_SwapToAvatar` | Board renderer | [`board-windows`](../reference/skill-instructions/board-windows.html) | — |

{% endraw %}
