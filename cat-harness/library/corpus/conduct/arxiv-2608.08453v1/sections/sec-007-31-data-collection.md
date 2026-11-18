---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-007-31-data-collection
section_title: "Data Collection"
section_number: 3.1
pages: 3-3
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
To study reuse rather than isolated benchmark performance,
we build the dataset from places where skills are actually
published and copied. We collected SKILL.md files through
GitHub code search, repository cloning, and the agentskills.in
registry API. GitHub search used 40+ sharded queries to by-
pass the 1,000-result-per-query limit; repository cloning ex-
tracted all case-insensitive SKILL.md files from known and
discovered skill repositories; registry collection fetched raw
GitHub content for indexed skills.
The final SHA-256-deduplicated dataset contains 138,133
unique skills from 20,556 repositories; 98.8% have YAML
frontmatter, 98.5% include a name, 98.1% include a description,
and the median body length is 169 lines / 687 words.
Inclusion criteria and representativeness. We applied
minimal filtering to preserve an ecosystem-wide view rather
than a curated subset. The only filters were (i) the file must
be named SKILL.md (case-insensitive), (ii) the host repos-
itory must be public at crawl time, and (iii) we keep one
copy per SHA-256 content hash to remove verbatim du-
plicates. We did not filter by repository popularity (stars),
freshness (last commit date), or author identity, because two
questions in this paper—ecosystem-wide prevalence and
platform/provenance variation—require including unpop-
ular and stale repositories rather than excluding them. For
context, repository-level skew is non-trivial: the most pro-
lific repository contributes 17,284 skills (12.9%) and 47.0% of
repositories contribute exactly one skill, so we report both ag-
gregate and per-repository statistics throughout, and we use
