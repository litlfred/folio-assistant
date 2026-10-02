# Voices visualiser — as-is intent

**Covers** four declared refs that share one template:
- `cat-harness/docs/cat-harness/voices/index.html` (declared by `agent-skills/agent-skills.json`)
- `cat-harness/docs/cat-harness/voices/folio-assistant-core/index.html` (`folio-assistant-core/folio-assistant-core.json`)
- `cat-harness/docs/cat-harness/voices/folio-assistant-sci/index.html` (`folio-assistant-sci/folio-assistant-sci.json`)
- `cat-harness/docs/cat-harness/voices/who-style-guide/index.html` (`who-style-guide/who-style-guide.json`)

All four are written by `cat-harness/scripts/gen-voices-viz.ts`, "a zero-dependency viewer … that fetches the projection relative to its own location" (`assets/voices/`). A per-instance page is the same viewer with the instance filter preset. For example, `voices/who-style-guide/` opens with "who-style-guide" selected and 3 voices showing.

**Who it is for:** anyone upholding or reviewing a finding made against a voice, such as a reviewer or the owner. The generator says the page's one job is "show the citations": every rule "carries the page and the quote it was read from … and until this page, unreadable by a person without opening JSON". The owner's ask (bean `bu2q`) was *"shoulld show list of voices defined"*.

**What they need to do:**
- see every declared voice and which instance ships it, including a declared-but-absent voice directory, which "gets a ROW, not silence"
- search voices, rules and quotes, and filter by instance and by rule severity
- open a voice and read each rule with its quote and citation, and "uphold a finding by opening the citation, never by trusting a restatement" (the page's own intro)

**What it must show:** the heading and intro, the summary chips, the toolbar, the table of voice directories, and one collapsible card per voice. Each card has a summary (title, id, description, a metadata line) and, open, its rules. Each rule has a title, id, explanation, tag and severity pills, and a blockquote quote with its citation.

## Observed on main (edf3a89+)

Rendered at 1280×800 and 390×844, closed and with the first card open, plus the `who-style-guide` sub-page. The only mobile behaviour is wrapping. The drawing's mobile layout is how it renders at 390 px.

1. **Header:** "Voices", the intro paragraph, then five chips: **7** voice(s), **66** rule(s), **63** citing an ingested source, **3** citing a KG node, **12** with a mechanical half.
2. **Toolbar:** a search field "Search voices, rules, quotes…", "every instance" and "every severity" selects (with `aria-label`s), and an "expand all" button.
3. **Directory table:** instance · directory · voices: agent-skills 1, folio-assistant-core 1, folio-assistant-sci 1, smart-base 1, who-style-guide 3.
4. **Voice cards** (`<details>`, closed): Agent skill authoring, Milnor exposition standard, Technical Writer, WHO digital health terminology, WHO editorial style, WHO guideline development, and WHO publication design (Western Pacific Region). Each summary shows the ▸ marker on its own line, then the `h2` title with its id, the description, and "shipped by … · N rule(s) · overlay … at major · … · provenance … · derived from …".
5. **An open card** lists its rules. For example, "The description states BOTH what the skill does and when to use it" `as-description-states-function-and-trigger`, the explanation, pills `structure` `critical`, and a tinted blockquote ending in the citation `arxiv-2607.25032v1#sec-004-writing-the-description, p4-5`.

## Findings

1. **The citations cannot be opened.** The page tells the reader to "uphold a finding by opening the citation", but a citation such as `who-pub-tps-931#page-014, p14` is plain text in a `<span class="cite">`. The page has **no links at all** (checked on `voices/` and `voices/who-style-guide/`). `who-pub-tps-931` is the slug of an entry on the library page, and nothing here leads to it.
2. **The summary counts do not follow the filter.** On `voices/who-style-guide/` (preset to that instance, 3 voices showing), and after choosing an instance on `voices/`, the chips still read "7 voice(s) · 66 rule(s) · …". A per-instance page opens by reporting the whole repository's totals.
3. **No rule is visible until a card is opened, and on a phone the first card starts below the first screen.** All 7 cards start closed. At 390×844 the first card starts at y = 851. Opened, its first rule is at y ≈ 1437, about 1.7 screens down. Closed cards are 357 to 683 px tall at 390 px (169 to 232 px at 1280), because each summary carries the full description paragraph and the metadata line.
4. **Headings sit inside the disclosure control.** Each voice's `h2` is inside its `<summary>` (7 of 7), which assistive technology exposes as a button. Heading navigation and the button's name both then carry the whole summary text, including the description and the metadata line.
5. **The ▸/▾ marker is detached from the title.** It sits alone on a line above the heading, at the card's top-left, and is small, so on a phone it does not read as the thing to tap. The whole summary is in fact the target.
6. **Markdown shows through as raw text.** Descriptions show literal backticks ("an override under \`vendors/\`, declaring this voice in its \`extends\` field").
7. **The directory table breaks words at 390 px.** "agent- / skills", "folio- / assistant- / core", and the monospace directory paths wrap mid-segment ("folio-assistant- / core/skills/voices").
