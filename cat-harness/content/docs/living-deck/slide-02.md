WHO's public-health information is split between literature repositories, **IRIS**
(DSpace), and structured indicators in the **World Health Data Hub**. Unifying
them into one knowledge graph needs a platform with room to grow to about
**10 TB**, with high throughput and without high network costs.

| problem | proposed answer |
|---|---|
| Egress fees make serving 10 TB globally unpredictable | a zero-egress public CDN holding signed static assets |
| Automated traffic, above all in emergencies, can overload internal systems | decouple: an internal secure origin, published snapshots outside it |
| Authenticity and chain of custody in an era of AI-generated content | sign every published asset (WHO Trust Network gateway) |

The architecture drawn on the slide runs in three stages. An internal secure
origin (IRIS and the Data Hub) feeds an automated compile engine: folio-assistant
builds, signs, snapshots and publishes. That engine feeds a public CDN, named on
the slide as Cloudflare R2 storage and the Cloudflare edge network.

**Sources:** [`kg-to-portal`](reference/skill-instructions/kg-to-portal.html)
(package and per-asset signatures; "a CDN is a LAYER");
`large-datasets` (the WHO IRIS source descriptor); `who-iris` (the DSpace skill).

> **Misaligned — proposal, not decision:** the repository treats the CDN as a
> swappable layer. `kg-to-portal` and `large-datasets`' artifact store name
> Cloudflare and R2 only as examples beside GitHub Pages, jsDelivr and S3. The
> slide names Cloudflare as *the* choice. The 10 TB figure, the World Health
> Data Hub and "Swiss Observatory schemas" appear nowhere else in the
> repository. Until a decision record exists, read this slide as a proposal.
