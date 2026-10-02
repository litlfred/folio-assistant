---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-014-data-collection
section_title: "Data Collection"
section_number: null
pages: 13-13
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
We aggregate Skills from direct GitHub/source discovery, marketplace records, and partner invento-
ries. Each entry records name, description, author, url, source partition, and, when available,
the upstream repository pushed_at timestamp. Summed across these source partitions (after dedu-
plicating within each), the construction snapshot contains 2,014,000 source-partitioned Skills. This is
a renewal of an earlier 37k-Skill snapshot taken in January 2026; the corpus has grown by more than
an order of magnitude in the intervening months.
For per-Skill structural statistics (size, file count, extension mix), we further cloned 767,430 Skill
bundles whose source repositories were still reachable; the remaining entries either point to delet-
ed/private repositories, partner/marketplace records without cloneable source, or repositories that
failed to fetch within retry limits.
Sep 2025
Oct 2025
Nov 2025
Dec 2025
Jan 2026
Feb 2026 Mar 2026
Apr 2026
0
5,000
10,000
15,000
20,000
25,000
30,000
35,000
Daily new Skills
Peak: 33,692 on Apr 07
First ≥100-Skill day
(2025-10-16)
0K
200K
400K
600K
800K
Cumulative Skills
Figure 6: Temporal dynamics of Skill creation in the timestamped portion of the 2,014,000-Skill
construction snapshot. The window starts at 2025-09-03 to provide a pre-launch baseline. Daily
additions (bars, left axis) climb through late 2025 and surge through Q1 2026, peaking at 33,692 Skills
on 2026-04-07. The first day with ≥100 new Skills is 2025-10-16; the 153 Skills with timestamps
before that date are likely artifacts of pushed_at reflecting the upstream repo’s last push (which
can be backdated or simply inherited from a stale repo that later received a SKILL.md) rather than
the Skill’s actual creation time, so the pre-launch tail should not be read as evidence of real activity
before the launch.
A.2
