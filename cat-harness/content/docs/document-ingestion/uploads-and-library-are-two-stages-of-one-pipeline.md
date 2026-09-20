They are not the same directory under two names, and the distinction is
load-bearing:

| | `uploads/` | `library/<bib-slug>/` |
|---|---|---|
| what it holds | raw files as dropped | ingested, structured, described |
| stage | incoming queue | **L1 source content** |
| greppable by the corpus checklist | **no** | yes |

That last row is the one that costs sessions. The corpus-grep checklist
searches `library/` only — so a paper still sitting in `uploads/` does not
merely go unread, it makes a **clean grep** read as *"nobody has done this"*
while the source is sitting on disk. An un-ingested source is worse than an
absent one, because it produces false confidence rather than a gap.
