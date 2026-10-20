---
layout: default
title: Home
nav_order: 1
lang: en
description: "WHO IRIS, catalogued by reference — an ingested copy, not WHO and not live."
permalink: /
---

{% include landing.html %}

# WHO IRIS
{: .fs-9 }

The WHO Institutional Repository for Information Sharing, **catalogued by
reference**: the shape of the corpus is modelled here, and only a handful of
its items are held.
{: .fs-6 .fw-300 }

[Browse the replica]({{ '/who-iris/' | relative_url }}){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[The catalogue, as a graph]({{ '/docs/who-iris/' | relative_url }}){: .btn .fs-5 .mb-4 .mb-md-0 }

{% include harness_details.html %}

## What this site is

- **[The replica]({{ '/who-iris/' | relative_url }})** — IRIS's home page,
  community list, collections and items, rendered from this repository's
  catalogue and themed as IRIS. It is an **ingested copy**: not WHO, and not
  live.
- **[The catalogue]({{ '/docs/who-iris/' | relative_url }})** — what the
  catalogue knows, and what it records that it does not know. Every node
  declares whether its bytes are here (`materialized`), elsewhere
  (`referenced`) or unestablished (`unknown`), and there is no default.
- **The gap is the point.** IRIS reports its own figures for items and files;
  the catalogue holds a few and models the rest by reference. The census is
  `bun run check:catalogue`, never a number written into a page.

This repository is the development home of the instance; an official copy is
expected to live under WHO's own account.
