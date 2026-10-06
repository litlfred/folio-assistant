---
# folio-assistant-lffo
title: 'who-iris: translate the IRIS portal replica''s interface into ar, es, fr, ru, zh (#2228)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-05T18:46:23Z
updated_at: 2026-10-06T05:20:37Z
parent: folio-assistant-bzyu
---

Issue #2228. Owner, 2026-10-05: 'help make sure who-iris has all translations'; after measurement the owner chose the who-iris/site/ portal replica (7 pages) in the five non-English UN languages. Interface text only; publication metadata stays as WHO published it. Method and QA standard follow bean t0jg (#2209): translation, tool-isolated back-translation round trip, evidence recorded here.


## Round-trip translation QA — the replica's interface (2026-10-05)

**Method.** Each locale's 116 `msgstr` values were listed on their own, by index, and back-translated into English from that list alone; the English source was not consulted during the pass. `TOOLS_USED: none` for the back-translation itself (no dictionary, no MT, no web). The back-translations were then compared with the `msgid` by index and each judged PASS (same meaning, nothing added or dropped) or DRIFT.

**Limitation, stated plainly.** Unlike bean `t0jg`, the checker here was **not tool-isolated from the author**: this agent wrote the translations and then back-translated them, in one context, with no way to spawn an independent checker session from inside this task. Not looking at the source while back-translating removes the easiest contamination (copying the English) but not the author's memory of it. So this is a self-check, weaker than an untainted one; an independent checker (or a person) should repeat it before the catalogues are signed off. Every translated page says it is unreviewed.

**Mechanical checks** (`bun run iris:pages:check`): 116/116 translated per locale, 0 fuzzy, 0 empty, every `{placeholder}` and every HTML tag of the `msgid` present in the `msgstr`.

**Result.** 580 strings, **22 DRIFT in round 1** (fr 5, es 2, ru 9, zh 2, ar 4), all fixed and re-back-translated: **580/580 PASS in round 2**.

### Round 1 drift, and the fix

| locale | # | round-1 msgstr | drift | round-2 back-translation | verdict |
|---|---|---|---|---|---|
| ar | 1 | … وليست مباشرة. | 'not direct' — ambiguous for 'not live' | … and it is not a live site. | PASS |
| ar | 2 | … وليست مباشرة.</strong> … | as 1 | … and it is not a live site. … | PASS |
| ar | 59 | <strong>تأكّد أن شكلي الرابط كليهما يعملان.</strong> … | read as an imperative, 'Make sure both link forms work' | It was established that both link forms work. … | PASS |
| ar | 100 | … المثيل الذي يُنشئ دليلًا … | 'the instance that creates a directory' — the source says INSTANTIATES | … the instance that creates an instance of a directory … | PASS |
| es | 89 | Buscar entre los ítems del repositorio y en la búsqueda de identificadores referenciados | 'search of referenced identifiers' — the lookup is of referenced NODES by identifier | Search among the repository's items and in the search by identifier of the referenced nodes | PASS |
| es | 115 | Buscar «{q}» en la búsqueda de identificadores referenciados ({n} nodos) → | as 89 | Search «{q}» in the search by identifier of the referenced nodes ({n} nodes) → | PASS |
| fr | 34 | aucune saisie | 'no entry' — lost that it is a RECORD that was not captured | no record captured | PASS |
| fr | 72 | Lot | 'Batch' — not the DSpace sense of bundle | Bundle (package) | PASS |
| fr | 89 | Rechercher parmi les documents du dépôt et dans la recherche d’identifiants référencés | 'search of referenced identifiers' — the lookup is of referenced NODES by identifier | Search among the repository's documents and in the identifier search of the referenced nodes | PASS |
| fr | 91 | … conservés en valeur … | 'kept in value' — not 'held by value' | Search among {held} documents held by value and the referenced communities/collections. … | PASS |
| fr | 115 | Rechercher « {q} » dans la recherche d’identifiants référencés ({n} nœuds) → | as 89 | Search for “{q}” in the identifier search of the referenced nodes ({n} nodes) → | PASS |
| ru | 0 | {title} — загруженная реплика IRIS | 'uploaded' — not 'ingested' | {title} — imported IRIS replica | PASS |
| ru | 1 | … загруженного каталога … | 'uploaded catalogue' | … created from this repository's imported catalogue … | PASS |
| ru | 2 | ЗАГРУЖЕННАЯ КОПИЯ … Эта страница создана {folioAssistant} … | 'uploaded copy'; and the case of the name was ambiguous ('created [by] folio-assistant') | IMPORTED COPY … This page was created by the tool {folioAssistant} … | PASS |
| ru | 17 | Загруженная реплика. | 'uploaded replica' | Imported replica. | PASS |
| ru | 34 | не получено | 'not obtained' — lost that it is a record | record not obtained | PASS |
| ru | 68 | не указан — загружено из локальной копии … | 'uploaded' | not specified — imported from a local copy, not resolved through IRIS | PASS |
| ru | 82 | Загруженный текст (L1) | 'uploaded text' | Imported text (L1) | PASS |
| ru | 91 | Поиск по хранимым здесь записям … | 'records stored HERE' — the source says held BY VALUE | Search the records stored by value ({held}), and the referenced communities and collections. … | PASS |
| ru | 100 | … экземпляр, создающий каталог, получает визуализатор, смонтированный под типом этого каталога … | 'an instance that creates a catalogue' — the source is an instance that INSTANTIATES a DIRECTORY | … an instance that instantiates a directory gets a visualizer mounted under the type of this directory … | PASS |
| zh | 55 | …<strong>有效的</strong>… | 'valid' — the source says the rows are LIVE (working) | Every row below is usable. … | PASS |
| zh | 75 | 两个链接，应要求提供 | 'provided on request' — the source says 'as asked for' (the owner asked for both) | Two links, provided as requested | PASS |

### Judged PASS, with a note

- **"ingested"**: fr *ingéré*, es *ingerido* (the data-engineering calques), zh *收录* (the library term for "included in a collection"), ar *مُستوعَب* ("absorbed/ingested"), ru *импортированный* ("imported", chosen over *загруженный*, "uploaded", in round 2). No language has an exact everyday equivalent; each back-translates to the same idea.
- **"emblem" vs "logo"**: Arabic uses *شعار* for both, as WHO's Arabic texts do; the back-translation reads "logo" in places. Same referent.
- **"withheld" covers**: rendered as "not displayed / not shown" in every language, which is what the English sentence itself says ("withheld from display").
- **Navbar "About"**: ru *О репозитории* ("About the repository"), the usual Russian rendering of a bare "About" in site navigation.
- **WHO's own names** were used where they exist: *Organisation mondiale de la Santé*, *Organización Mundial de la Salud*, *Всемирная организация здравоохранения*, *世界卫生组织*, *منظمة الصحة العالمية*; "Governing Bodies" as *organes directeurs*, *órganos deliberantes*, *руководящие органы*, *理事机构*, *الأجهزة الرئاسية*. The expansion of "IRIS" is a descriptive translation in each language, not a verified WHO-published name — flagged for the reviewer.
- **DSpace labels** (Communities & Collections, Recent Submissions, Permanent URI, Publication Date, Bundle) follow common DSpace usage in each language from memory, not checked against WHO's live localised IRIS pages, which could not be fetched from here.

### Source strings (msgid), by index

| # | msgid |
|---|---|
| 0 | {title} — ingested IRIS replica |
| 1 | A replica of a WHO IRIS page, rendered from this repository's ingested catalogue. Not WHO, and not live. |
| 2 | <strong>INGESTED COPY — not WHO, and not live.</strong> This page is rendered by {folioAssistant} from its own catalogue of {iris}, modelled <em>by reference</em>: {figures}. The WHO logo is deliberately omitted, and the rendered covers are withheld from display for the same reason — they carry the emblem printed on the publications. |
| 3 | {nodes} nodes of a {items}-item {size} repository, of which <strong>{held} items</strong> are held here |
| 4 | {nodes} nodes of a {items}-item {size} repository, of which <strong>1 item</strong> is held here |
| 5 | {nodes} nodes of a repository of unmeasured size, of which <strong>{held} item(s)</strong> are held here |
| 6 | World Health<br>Organization |
| 7 | Institutional Repository<br>for Information Sharing |
| 8 | Logo omitted, covers withheld — replica, not published under WHO |
| 9 | Communities &amp; Collections |
| 10 | Browse IRIS |
| 11 | Statistics |
| 12 | About |
| 13 | Contact |
| 14 | Help |
| 15 | Home |
| 16 | Community List |
| 17 | <strong>Ingested replica.</strong> Rendered from {catalogue} by {generator}. Layout after {iris}; every figure on this page is read out of the catalogue, not copied from a screenshot. |
| 18 | Source of record: {iris} — © WHO. This copy asserts no endorsement and carries no WHO mark. |
| 19 | Interface language |
| 20 | The interface is shown in {language}. Publication titles, authors, abstracts and other catalogue records are shown as WHO published them. |
| 21 | This interface translation was produced by an agent and has not been reviewed by a person. |
| 22 | materialized |
| 23 | referenced |
| 24 | unknown |
| 25 | Item |
| 26 | Collection |
| 27 | Community |
| 28 | State |
| 29 | Upstream |
| 30 | Held copy |
| 31 | Metadata record |
| 32 | no collection recorded |
| 33 | in {communities} |
| 34 | none captured |
| 35 | declared, but missing on disk |
| 36 | Download {file} |
| 37 | via CDN |
| 38 | qualified Dublin Core · {size} KB |
| 39 | no record, so nothing to render |
| 40 | this instance declares no published root |
| 41 | {label}: not rendered (run {command}) |
| 42 | Dublin Core XML |
| 43 | JSON-LD (DCMI Terms) |
| 44 | Local replica → |
| 45 | IRIS source → |
| 46 | no upstream URI recorded |
| 47 | held here, not published — {gates} |
| 48 | not held here |
| 49 | not recorded |
| 50 | {size} MB |
| 51 | List of Communities |
| 52 | {files} files · {size} upstream |
| 53 | size upstream <strong>unknown</strong> — the storage report's second page was never read, and a number interpolated from the first would look measured |
| 54 | {modelled} item(s) modelled, {held} held here |
| 55 | Every row below is <strong>live</strong>. A row is not greyed out when this repository does not hold it — it says {referenced} instead, which is the actual state and the whole point of a catalogue modelled by reference. {materialized} means the bytes are here. |
| 56 | Held here — {n} materialized item(s) |
| 57 | Each row carries <strong>three routes to the same item</strong>: the <strong>IRIS source</strong> upstream at WHO, this repository's own <strong>local replica</strong> page, and the <strong>asset itself</strong> — downloadable from the repository and, separately, from a CDN edge. |
| 58 | <strong>Three routes to one item, which is the point.</strong> The catalogue knows this item once; the bytes are reachable <em>upstream at WHO</em>, <em>here as a replica page</em>, and <em>from a CDN edge</em> — jsDelivr serves any public repository, so the last one costs this project no hosting at all. The KG says what exists and where; the CDN says nothing and just serves it. |
| 59 | <strong>Both link forms are confirmed working.</strong> The <code>raw.githubusercontent.com</code> links were fetched and returned 200 with byte counts matching the catalogue exactly. The <em>via CDN</em> links could not be checked from the environment that generated this page — <code>cdn.jsdelivr.net</code> is egress-blocked there — so they were composed from jsDelivr's documented URL form and the owner exercised one by hand on 2026-09-20. Both are kept: one costs this project nothing to serve, and a reader who finds either unavailable still has the other. |
| 60 | <strong>Where the held copies actually live — bean <code>yl5w</code>.</strong> The catalogue records each of these at <code>uploads/&lt;name&gt;.pdf</code> relative to <code>who-iris/</code>, and <em>all three of those paths are missing</em>: #477 moved <code>library/</code> into this instance and left <code>uploads/</code> in <code>cat-harness/</code>. |
| 61 | The download links above point at where the bytes <em>are</em>, so they work. The claim in the catalogue is what is wrong, and <code>check:catalogue</code> does not check <code>localPath</code> at all — it verifies <code>metadataRef</code> and <code>libraryId</code>, and reports a clean run over three <code>materialized</code> claims that resolve to nothing. |
| 62 | Permanent URI for this collection |
| 63 | none recorded |
| 64 | <strong>How this node was established.</strong> {note} |
| 65 | Items in this Collection |
| 66 | Now showing 1 – {n} of {n} <em>modelled</em>. The upstream collection is larger; this catalogue holds what was materialised, and says so per row. |
| 67 | Permanent URI for this item |
| 68 | none recorded — ingested from a local copy, not resolved from IRIS |
| 69 | In: {path} |
| 70 | Files |
| 71 | Name |
| 72 | Bundle |
| 73 | Size |
| 74 | Read it here |
| 75 | Both links, as asked for |
| 76 | Where |
| 77 | Link |
| 78 | Upstream, at WHO |
| 79 | Held here, in folio-assistant |
| 80 | not held |
| 81 | In collection |
| 82 | Ingested text (L1) |
| 83 | Dublin Core record |
| 84 | Dublin Core renderings |
| 85 | <strong>No Dublin Core record.</strong> The catalogue says so rather than synthesising metadata from the PDF — the <code>iris-dspace</code> skill's R8, <em>never infer metadata from the PDF when a record exists</em>, whose converse is that an absent record stays absent. |
| 86 | The primary objective of the Institutional Repository for Information Sharing (IRIS) is to provide free digital access to the scientific and technical publications of the World Health Organization (WHO), including contributions from its Country Offices, Regional Offices, and Headquarters. Additionally, IRIS encompasses the mandates established by the Organization’s Governing Bodies in collaboration with its Member States. |
| 87 | Replica. No WHO emblem, no photograph — colour only, from the {theme} theme measured off the site’s own stylesheet. |
| 88 | Search through the repository’s {n} items |
| 89 | Search through the repository items and referenced identifier lookup |
| 90 | Search |
| 91 | Search across <strong>{held}</strong> items held by value and referenced communities/collections. To look up any of the <strong>{referenced}</strong> referenced nodes by identifier, search here or open the {lookup}. |
| 92 | identifier lookup |
| 93 | Upstream IRIS reports <strong>{items}</strong> items across <strong>{files}</strong> files. |
| 94 | Recent Submissions |
| 95 | Ordered by {key}, latest first — the key IRIS’s own list sorts on. Where a record carries several accessions the latest is used; the WPRO item has two, five days apart, the second being the regional-IRIS merge. |
| 96 | Browse |
| 97 | {link} — the replica of {url}, with every node’s materialisation state ({communities} communities, {collections} collections) |
| 98 | {link} — collection |
| 99 | <strong>This is the front door, not the library visualiser.</strong> The full <code>library/</code> visualiser is bean <code>jbx2</code> and is being built separately. This page mocks the IRIS home page and links onward rather than becoming a second answer to the same question. |
| 100 | Addressing follows the owner’s rule — <code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code> — so an instance that instantiates a directory gets a visualiser mounted under that directory’s kind: <code>/library/who-iris/</code>, <code>/docs/who-iris/</code>, and so on. |
| 101 | no author recorded |
| 102 | Publication Date: {date} |
| 103 | A cover is rendered and held here. It is not published: {gates}. |
| 104 | cover<br>withheld |
| 105 | no cover rendered |
| 106 | no cover |
| 107 | Cover of {title}, rendered here from page 1 of the held PDF |
| 108 | Cover of {title}, rendered here from page 1 of the held PDF, with the WHO emblem masked out |
| 109 | A cover is rendered and recorded for this item. It is not displayed: the publication's cover carries the WHO emblem, and this replica is not published under WHO. |
| 110 | No <code>dc.description.abstract</code> in the captured record. |
| 111 | Matching catalogue nodes ({n}): |
| 112 | Also search identifier lookup: |
| 113 | Look up “{q}” in referenced nodes → |
| 114 | No materialized items or collections matched “<strong>{q}</strong>”. |
| 115 | Search for “{q}” in the referenced identifier lookup ({n} nodes) → |

### Arabic (`ar`) — final msgstr, back-translation, verdict

| # | msgstr | back-translation | verdict |
|---|---|---|---|
| 0 | {title} — نسخة مستنسخة مُستوعَبة من IRIS | {title} — an ingested (absorbed) replica copy of IRIS | PASS |
| 1 | نسخة مستنسخة من صفحة من مستودع IRIS التابع لمنظمة الصحة العالمية، أُنشئت من الفهرس المُستوعَب في هذا المستودع. ليست منظمة الصحة العالمية، وليست موقعًا حيًا. | … and it is not a live site. *(round 2)* | PASS (fixed in round 2) |
| 2 | <strong>نسخة مُستوعَبة — ليست منظمة الصحة العالمية، وليست موقعًا حيًا.</strong> تُنشئ هذه الصفحةَ {folioAssistant} من فهرسها الخاص لمستودع {iris}، المنمذج <em>بالإحالة</em>: {figures}. حُذف شعار منظمة الصحة العالمية عمدًا، ولا تُعرض الأغلفة المُنشأة للسبب نفسه، إذ تحمل الشعار المطبوع على المنشورات. | … and it is not a live site. … *(round 2)* | PASS (fixed in round 2) |
| 3 | عدد العُقد: {nodes} في مستودع يضم {items} مادة وحجمه {size}، ومن بينها <strong>مواد محفوظة هنا: {held}</strong> | Number of nodes: {nodes} in a repository containing {items} items with size {size}, among them <strong>items kept here: {held}</strong> | PASS |
| 4 | عدد العُقد: {nodes} في مستودع يضم {items} مادة وحجمه {size}، ومن بينها <strong>مادة واحدة محفوظة هنا</strong> | Number of nodes: {nodes} in a repository containing {items} items with size {size}, among them <strong>one item kept here</strong> | PASS |
| 5 | عدد العُقد: {nodes} في مستودع لم يُقَس حجمه، ومن بينها <strong>مواد محفوظة هنا: {held}</strong> | Number of nodes: {nodes} in a repository whose size was not measured, among them <strong>items kept here: {held}</strong> | PASS |
| 6 | منظمة الصحة<br>العالمية | World Health<br>Organization | PASS |
| 7 | المستودع المؤسسي<br>لتبادل المعلومات | The Institutional Repository<br>for Information Sharing | PASS |
| 8 | حُذف الشعار ولا تُعرض الأغلفة — نسخة مستنسخة، غير منشورة باسم منظمة الصحة العالمية | Logo removed and covers not displayed — a replica copy, not published in the name of the World Health Organization | PASS |
| 9 | المجتمعات والمجموعات | Communities and collections | PASS |
| 10 | تصفح IRIS | Browse IRIS | PASS |
| 11 | الإحصاءات | Statistics | PASS |
| 12 | نبذة | About (brief) | PASS |
| 13 | اتصل بنا | Contact us | PASS |
| 14 | المساعدة | Help | PASS |
| 15 | الصفحة الرئيسية | Home page | PASS |
| 16 | قائمة المجتمعات | List of communities | PASS |
| 17 | <strong>نسخة مستنسخة مُستوعَبة.</strong> أُنشئت من {catalogue} بواسطة {generator}. التصميم على غرار {iris}؛ وكل رقم في هذه الصفحة مقروء من الفهرس، وليس منسوخًا من لقطة شاشة. | <strong>Ingested replica copy.</strong> Created from {catalogue} by means of {generator}. The design is in the manner of {iris}; and every number on this page is read from the catalogue, not copied from a screenshot. | PASS |
| 18 | المصدر المرجعي: {iris} — © منظمة الصحة العالمية. لا تدّعي هذه النسخة أي تأييد ولا تحمل أي علامة لمنظمة الصحة العالمية. | Reference source: {iris} — © World Health Organization. This copy claims no endorsement and carries no mark of the World Health Organization. | PASS |
| 19 | لغة الواجهة | Interface language | PASS |
| 20 | تُعرض الواجهة باللغة: {language}. أما عناوين المنشورات ومؤلفوها وملخصاتها وسائر سجلات الفهرس فتُعرض كما نشرتها منظمة الصحة العالمية. | The interface is displayed in the language: {language}. As for the titles of publications, their authors, their abstracts and the rest of the catalogue records, they are displayed as the World Health Organization published them. | PASS |
| 21 | أعدّ هذه الترجمة للواجهة وكيلٌ آلي، ولم يراجعها أي شخص. | This translation of the interface was prepared by an automated agent, and no person has reviewed it. | PASS |
| 22 | مُجسَّد | Embodied (materialized) | PASS |
| 23 | بالإحالة | By reference | PASS |
| 24 | غير معروف | Unknown | PASS |
| 25 | مادة | Item | PASS |
| 26 | مجموعة | Collection | PASS |
| 27 | مجتمع | Community | PASS |
| 28 | الحالة | Status | PASS |
| 29 | المصدر الأصلي | Original source | PASS |
| 30 | النسخة المحفوظة | Kept copy | PASS |
| 31 | سجل البيانات الوصفية | Metadata record | PASS |
| 32 | لم تُسجَّل أي مجموعة | No collection was recorded | PASS |
| 33 | ضمن {communities} | Within {communities} | PASS |
| 34 | لم يُلتقط أي سجل | No record was captured | PASS |
| 35 | مُعلَن، لكنه مفقود من القرص | Declared, but missing from the disk | PASS |
| 36 | تنزيل {file} | Download {file} | PASS |
| 37 | عبر شبكة CDN | Via the CDN network | PASS |
| 38 | دبلن كور المؤهَّل · {size} كيلوبايت | Qualified Dublin Core · {size} kilobytes | PASS |
| 39 | لا يوجد سجل، فلا شيء لعرضه | There is no record, so nothing to display | PASS |
| 40 | لا يُعلن هذا المثيل عن أي جذر منشور | This instance does not declare any published root | PASS |
| 41 | {label}: لم يُنشأ (شغّل {command}) | {label}: not created (run {command}) | PASS |
| 42 | دبلن كور بصيغة XML | Dublin Core in XML format | PASS |
| 43 | JSON-LD (مصطلحات DCMI) | JSON-LD (DCMI terms) | PASS |
| 44 | النسخة المستنسخة المحلية ← | The local replica copy ← | PASS |
| 45 | المصدر في IRIS ← | The source in IRIS ← | PASS |
| 46 | لم يُسجَّل أي URI للمصدر الأصلي | No URI was recorded for the original source | PASS |
| 47 | محفوظ هنا، غير منشور — {gates} | Kept here, not published — {gates} | PASS |
| 48 | غير محفوظ هنا | Not kept here | PASS |
| 49 | غير مسجَّل | Not recorded | PASS |
| 50 | {size} ميغابايت | {size} megabytes | PASS |
| 51 | قائمة المجتمعات | List of communities | PASS |
| 52 | عدد الملفات: {files} · الحجم في المصدر الأصلي: {size} | Number of files: {files} · Size at the original source: {size} | PASS |
| 53 | الحجم في المصدر الأصلي <strong>غير معروف</strong> — لم تُقرأ الصفحة الثانية من تقرير التخزين قط، وأي رقم يُستكمل من الصفحة الأولى سيبدو وكأنه مَقيس | Size at the original source <strong>unknown</strong> — the second page of the storage report was never read, and any number completed from the first page would look as if it were measured | PASS |
| 54 | المواد المنمذجة: {modelled}، والمحفوظة هنا: {held} | Modelled items: {modelled}, and kept here: {held} | PASS |
| 55 | كل صف أدناه <strong>فعّال</strong>. لا يظهر الصف باللون الرمادي حين لا يحفظه هذا المستودع، بل يُكتب فيه {referenced}، وهي الحالة الفعلية والغاية كلها من فهرس منمذج بالإحالة. أما {materialized} فتعني أن البايتات موجودة هنا. | Every row below is <strong>active</strong>. A row does not appear in grey when this repository does not keep it; rather, {referenced} is written in it, which is the actual state and the whole purpose of a catalogue modelled by reference. As for {materialized}, it means the bytes are present here. | PASS |
| 56 | محفوظ هنا — المواد المُجسَّدة: {n} | Kept here — embodied items: {n} | PASS |
| 57 | يتيح كل صف <strong>ثلاثة طرق إلى المادة نفسها</strong>: <strong>المصدر في IRIS</strong> في المصدر الأصلي لدى منظمة الصحة العالمية، وصفحة <strong>النسخة المستنسخة المحلية</strong> الخاصة بهذا المستودع، و<strong>المورد نفسه</strong> — قابلًا للتنزيل من المستودع، وعلى نحو منفصل من عقدة طرفية في شبكة CDN. | Every row provides <strong>three routes to the same item</strong>: <strong>the source in IRIS</strong> at the original source at the World Health Organization, the <strong>local replica copy</strong> page belonging to this repository, and <strong>the resource itself</strong> — downloadable from the repository, and separately from an edge node in the CDN network. | PASS |
| 58 | <strong>ثلاثة طرق إلى مادة واحدة، وهذا هو المقصود.</strong> لا يعرف الفهرس هذه المادة إلا مرة واحدة؛ والبايتات متاحة <em>في المصدر الأصلي لدى منظمة الصحة العالمية</em>، و<em>هنا بوصفها صفحة نسخة مستنسخة</em>، و<em>من عقدة طرفية في شبكة CDN</em> — إذ تخدم jsDelivr أي مستودع عام، فلا يكلّف الطريق الأخير هذا المشروع أي استضافة. يقول الرسم البياني المعرفي ما الموجود وأين؛ أما شبكة CDN فلا تقول شيئًا وتكتفي بتقديمه. | <strong>Three routes to one item, and this is what is intended.</strong> The catalogue knows this item only once; and the bytes are available <em>at the original source at the World Health Organization</em>, <em>here as a replica copy page</em>, and <em>from an edge node in the CDN network</em> — since jsDelivr serves any public repository, the last route costs this project no hosting. The knowledge graph says what exists and where; as for the CDN network, it says nothing and only serves it. | PASS |
| 59 | <strong>ثبت أن شكلي الرابط كليهما يعملان.</strong> جُلبت روابط <code>raw.githubusercontent.com</code> وأعادت الرمز 200، بأحجام بالبايت تطابق الفهرس تمامًا. أما الروابط <em>عبر شبكة CDN</em> فتعذّر التحقق منها من البيئة التي أنشأت هذه الصفحة — إذ إن الاتصال الصادر إلى <code>cdn.jsdelivr.net</code> محظور هناك — ولذا رُكّبت وفق صيغة URL الموثّقة لدى jsDelivr، وجرّب المالك أحدها يدويًا في 2026-09-20. أُبقي على الاثنين: أحدهما لا يكلّف هذا المشروع شيئًا لتقديمه، والقارئ الذي يجد أحدهما غير متاح يبقى لديه الآخر. | It was established that both link forms work. … *(round 2)* | PASS (fixed in round 2) |
| 60 | <strong>أين توجد النسخ المحفوظة فعلًا — المهمة <code>yl5w</code>.</strong> يسجّل الفهرس كل واحدة منها في <code>uploads/&lt;name&gt;.pdf</code> نسبةً إلى <code>who-iris/</code>، و<em>المسارات الثلاثة كلها مفقودة</em>: نقل #477 الدليل <code>library/</code> إلى هذا المثيل وترك <code>uploads/</code> في <code>cat-harness/</code>. | <strong>Where the kept copies actually are — task <code>yl5w</code>.</strong> The catalogue records each one of them at <code>uploads/&lt;name&gt;.pdf</code> relative to <code>who-iris/</code>, and <em>all three paths are missing</em>: #477 moved the directory <code>library/</code> into this instance and left <code>uploads/</code> in <code>cat-harness/</code>. | PASS |
| 61 | تشير روابط التنزيل أعلاه إلى حيث <em>توجد</em> البايتات فعلًا، ولذلك تعمل. أما الخطأ ففي ادعاء الفهرس، و<code>check:catalogue</code> لا يتحقق من <code>localPath</code> إطلاقًا — فهو يتحقق من <code>metadataRef</code> و<code>libraryId</code>، ويُبلغ عن تشغيل سليم على ثلاثة ادعاءات <code>materialized</code> لا تشير إلى شيء. | The download links above point to where the bytes actually <em>are</em>, and therefore they work. The error is in the catalogue's claim, and <code>check:catalogue</code> does not verify <code>localPath</code> at all — it verifies <code>metadataRef</code> and <code>libraryId</code>, and reports a sound run over three <code>materialized</code> claims that point to nothing. | PASS |
| 62 | URI الدائم لهذه المجموعة | The permanent URI of this collection | PASS |
| 63 | غير مسجَّل | Not recorded | PASS |
| 64 | <strong>كيف أُثبتت هذه العقدة.</strong> {note} | <strong>How this node was established.</strong> {note} | PASS |
| 65 | المواد في هذه المجموعة | The items in this collection | PASS |
| 66 | يُعرض الآن 1 – {n} من {n} <em>منمذجة</em>. المجموعة في المصدر الأصلي أكبر؛ ويضم هذا الفهرس ما جُسِّد، ويذكر ذلك في كل صف. | Now displaying 1 – {n} of {n} <em>modelled</em>. The collection at the original source is larger; this catalogue contains what was embodied, and states that in every row. | PASS |
| 67 | URI الدائم لهذه المادة | The permanent URI of this item | PASS |
| 68 | غير مسجَّل — استُوعب من نسخة محلية، ولم يُستَدَلّ عليه من IRIS | Not recorded — ingested from a local copy, and not resolved from IRIS | PASS |
| 69 | ضمن: {path} | Within: {path} | PASS |
| 70 | الملفات | Files | PASS |
| 71 | الاسم | Name | PASS |
| 72 | الحزمة | Bundle (package) | PASS |
| 73 | الحجم | Size | PASS |
| 74 | اقرأها هنا | Read it here | PASS |
| 75 | الرابطان كلاهما، كما طُلب | Both links, as was requested | PASS |
| 76 | الموقع | Location | PASS |
| 77 | الرابط | Link | PASS |
| 78 | في المصدر الأصلي، لدى منظمة الصحة العالمية | At the original source, at the World Health Organization | PASS |
| 79 | محفوظة هنا، في folio-assistant | Kept here, in folio-assistant | PASS |
| 80 | غير محفوظة | Not kept | PASS |
| 81 | ضمن المجموعة | Within the collection | PASS |
| 82 | النص المُستوعَب (L1) | Ingested text (L1) | PASS |
| 83 | سجل دبلن كور | Dublin Core record | PASS |
| 84 | عروض دبلن كور | Dublin Core displays | PASS |
| 85 | <strong>لا يوجد سجل دبلن كور.</strong> يذكر الفهرس ذلك بدلًا من توليد بيانات وصفية من ملف PDF — وهي القاعدة R8 من مهارة <code>iris-dspace</code>: <em>لا تستنتج البيانات الوصفية من ملف PDF أبدًا حين يوجد سجل</em>، وعكسها أن السجل الغائب يبقى غائبًا. | <strong>There is no Dublin Core record.</strong> The catalogue states that instead of generating metadata from the PDF file — this is rule R8 of the <code>iris-dspace</code> skill: <em>never infer metadata from a PDF file when a record exists</em>, and its converse is that an absent record remains absent. | PASS |
| 86 | يتمثل الهدف الرئيسي للمستودع المؤسسي لتبادل المعلومات (IRIS) في إتاحة الوصول الرقمي المجاني إلى المنشورات العلمية والتقنية لمنظمة الصحة العالمية، بما في ذلك إسهامات مكاتبها القطرية ومكاتبها الإقليمية ومقرها الرئيسي. وإضافة إلى ذلك، يشمل IRIS الولايات التي حددتها الأجهزة الرئاسية للمنظمة بالتعاون مع الدول الأعضاء فيها. | The main objective of the Institutional Repository for Information Sharing (IRIS) is to make available free digital access to the scientific and technical publications of the World Health Organization, including the contributions of its country offices, its regional offices and its headquarters. In addition, IRIS includes the mandates that the governing bodies of the Organization set in collaboration with its Member States. | PASS |
| 87 | نسخة مستنسخة. لا شعار لمنظمة الصحة العالمية ولا صورة فوتوغرافية — ألوان فقط، مأخوذة من السمة {theme} المقيسة من صفحة الأنماط الخاصة بالموقع نفسه. | A replica copy. No logo of the World Health Organization and no photograph — colours only, taken from the {theme} theme measured from the site's own style sheet. | PASS |
| 88 | ابحث في مواد المستودع البالغ عددها {n} | Search the repository's items, numbering {n} | PASS |
| 89 | ابحث في مواد المستودع وفي البحث عن معرّفات العُقد المُحال إليها | Search the repository's items and in the identifier search of the referenced nodes | PASS |
| 90 | بحث | Search | PASS |
| 91 | ابحث في المواد المحفوظة بالقيمة وعددها <strong>{held}</strong> وفي المجتمعات والمجموعات المُحال إليها. وللعثور بالمعرّف على أي من العُقد المُحال إليها وعددها <strong>{referenced}</strong>، ابحث هنا أو افتح {lookup}. | Search the items kept by value, numbering <strong>{held}</strong>, and the referenced communities and collections. To find by identifier any of the referenced nodes, numbering <strong>{referenced}</strong>, search here or open {lookup}. | PASS |
| 92 | البحث بالمعرّف | search by identifier | PASS |
| 93 | يُبلغ IRIS في المصدر الأصلي عن <strong>{items}</strong> مادة موزعة على <strong>{files}</strong> ملفًا. | IRIS at the original source reports <strong>{items}</strong> items distributed over <strong>{files}</strong> files. | PASS |
| 94 | أحدث الإيداعات | Latest deposits | PASS |
| 95 | مرتبة حسب {key}، الأحدث أولًا — وهو المفتاح الذي يرتّب به IRIS قائمته. وحين يحمل السجل عدة تواريخ إيداع يُستخدم أحدثها؛ ولمادة المكتب الإقليمي لغرب المحيط الهادئ (WPRO) تاريخان، بينهما خمسة أيام، والثاني هو تاريخ الدمج مع IRIS الإقليمي. | Ordered by {key}, newest first — the key by which IRIS orders its list. When a record carries several deposit dates, the newest is used; the item of the Regional Office for the Western Pacific (WPRO) has two dates, five days apart, and the second is the date of merging with the regional IRIS. | PASS |
| 96 | تصفح | Browse | PASS |
| 97 | {link} — النسخة المستنسخة من {url}، مع حالة التجسيد لكل عقدة (المجتمعات: {communities}، والمجموعات: {collections}) | {link} — the replica copy of {url}, with the embodiment state for every node (communities: {communities}, collections: {collections}) | PASS |
| 98 | {link} — مجموعة | {link} — collection | PASS |
| 99 | <strong>هذه هي البوابة الأمامية، لا أداة عرض المكتبة.</strong> أداة العرض الكاملة لـ <code>library/</code> هي المهمة <code>jbx2</code>، ويجري بناؤها على نحو منفصل. تحاكي هذه الصفحة الصفحة الرئيسية لـ IRIS وتحيل إلى ما بعدها، بدلًا من أن تصبح إجابة ثانية عن السؤال نفسه. | <strong>This is the front gate, not the library display tool.</strong> The full display tool for <code>library/</code> is task <code>jbx2</code>, and it is being built separately. This page imitates the IRIS home page and refers to what lies beyond it, instead of becoming a second answer to the same question. | PASS |
| 100 | يتبع العنونة قاعدة المالك — <code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code> — بحيث يحصل المثيل الذي يُنشئ مثيلًا لدليلٍ على أداة عرض مركّبة تحت نوع ذلك الدليل: <code>/library/who-iris/</code>، و<code>/docs/who-iris/</code>، وهكذا. | … the instance that creates an instance of a directory … *(round 2)* | PASS (fixed in round 2) |
| 101 | لم يُسجَّل أي مؤلف | No author was recorded | PASS |
| 102 | تاريخ النشر: {date} | Publication date: {date} | PASS |
| 103 | أُنشئ غلاف وهو محفوظ هنا، لكنه غير منشور: {gates}. | A cover was created and it is kept here, but it is not published: {gates}. | PASS |
| 104 | الغلاف<br>غير معروض | The cover<br>not displayed | PASS |
| 105 | لم يُنشأ غلاف | No cover was created | PASS |
| 106 | لا غلاف | No cover | PASS |
| 107 | غلاف {title}، أُنشئ هنا من الصفحة 1 من ملف PDF المحفوظ | Cover of {title}, created here from page 1 of the kept PDF file | PASS |
| 108 | غلاف {title}، أُنشئ هنا من الصفحة 1 من ملف PDF المحفوظ، مع حجب شعار منظمة الصحة العالمية | Cover of {title}, created here from page 1 of the kept PDF file, with the World Health Organization logo blocked out | PASS |
| 109 | أُنشئ غلاف لهذه المادة وسُجّل، لكنه لا يُعرض: إذ يحمل غلاف المنشور شعار منظمة الصحة العالمية، وهذه النسخة المستنسخة غير منشورة باسم المنظمة. | A cover was created for this item and recorded, but it is not displayed: since the publication's cover carries the World Health Organization logo, and this replica copy is not published in the name of the Organization. | PASS |
| 110 | لا يوجد <code>dc.description.abstract</code> في السجل الملتقط. | There is no <code>dc.description.abstract</code> in the captured record. | PASS |
| 111 | عُقد الفهرس المطابقة ({n}): | Matching catalogue nodes ({n}): | PASS |
| 112 | ابحث أيضًا بالمعرّف: | Also search by identifier: | PASS |
| 113 | ابحث عن «{q}» في العُقد المُحال إليها ← | Search for «{q}» in the referenced nodes ← | PASS |
| 114 | لا توجد مواد أو مجموعات مُجسَّدة تطابق «<strong>{q}</strong>». | There are no embodied items or collections matching «<strong>{q}</strong>». | PASS |
| 115 | ابحث عن «{q}» في البحث عن معرّفات العُقد المُحال إليها (عدد العُقد: {n}) ← | Search for «{q}» in the identifier search of the referenced nodes (number of nodes: {n}) ← | PASS |

### Spanish (`es`) — final msgstr, back-translation, verdict

| # | msgstr | back-translation | verdict |
|---|---|---|---|
| 0 | {title} — réplica ingerida de IRIS | {title} — ingested replica of IRIS | PASS |
| 1 | Réplica de una página de IRIS de la OMS, generada a partir del catálogo ingerido de este repositorio. No es la OMS y no está en vivo. | Replica of a WHO IRIS page, generated from the ingested catalogue of this repository. It is not WHO and it is not live. | PASS |
| 2 | <strong>COPIA INGERIDA — no es la OMS y no está en vivo.</strong> Esta página la genera {folioAssistant} a partir de su propio catálogo de {iris}, modelado <em>por referencia</em>: {figures}. El logotipo de la OMS se omite deliberadamente, y las portadas generadas no se muestran por la misma razón: llevan el emblema impreso en las publicaciones. | <strong>INGESTED COPY — it is not WHO and it is not live.</strong> This page is generated by {folioAssistant} from its own catalogue of {iris}, modelled <em>by reference</em>: {figures}. The WHO logo is deliberately omitted, and the generated covers are not shown for the same reason: they carry the emblem printed on the publications. | PASS |
| 3 | {nodes} nodos de un repositorio de {items} ítems y {size}, de los cuales <strong>{held} ítems</strong> se conservan aquí | {nodes} nodes of a repository of {items} items and {size}, of which <strong>{held} items</strong> are kept here | PASS |
| 4 | {nodes} nodos de un repositorio de {items} ítems y {size}, de los cuales <strong>1 ítem</strong> se conserva aquí | {nodes} nodes of a repository of {items} items and {size}, of which <strong>1 item</strong> is kept here | PASS |
| 5 | {nodes} nodos de un repositorio de tamaño no medido, de los cuales <strong>{held} ítem(s)</strong> se conservan aquí | {nodes} nodes of a repository of unmeasured size, of which <strong>{held} item(s)</strong> are kept here | PASS |
| 6 | Organización Mundial<br>de la Salud | World Health<br>Organization | PASS |
| 7 | Repositorio Institucional<br>para Compartir Información | Institutional Repository<br>for Sharing Information | PASS |
| 8 | Logotipo omitido, portadas no mostradas — réplica, no publicada bajo la OMS | Logo omitted, covers not shown — replica, not published under WHO | PASS |
| 9 | Comunidades y colecciones | Communities and collections | PASS |
| 10 | Explorar IRIS | Explore IRIS | PASS |
| 11 | Estadísticas | Statistics | PASS |
| 12 | Acerca de | About | PASS |
| 13 | Contacto | Contact | PASS |
| 14 | Ayuda | Help | PASS |
| 15 | Inicio | Home | PASS |
| 16 | Lista de comunidades | List of communities | PASS |
| 17 | <strong>Réplica ingerida.</strong> Generada a partir de {catalogue} por {generator}. Diseño basado en {iris}; cada cifra de esta página se lee del catálogo, no se copia de una captura de pantalla. | <strong>Ingested replica.</strong> Generated from {catalogue} by {generator}. Design based on {iris}; every figure on this page is read from the catalogue, not copied from a screenshot. | PASS |
| 18 | Fuente oficial: {iris} — © OMS. Esta copia no afirma ningún respaldo y no lleva ninguna marca de la OMS. | Official source: {iris} — © WHO. This copy claims no endorsement and carries no WHO mark. | PASS |
| 19 | Idioma de la interfaz | Interface language | PASS |
| 20 | La interfaz se muestra en {language}. Los títulos, autores, resúmenes y demás registros del catálogo se muestran tal como los publicó la OMS. | The interface is shown in {language}. The titles, authors, abstracts and other catalogue records are shown just as WHO published them. | PASS |
| 21 | Esta traducción de la interfaz la produjo un agente y no la ha revisado ninguna persona. | This interface translation was produced by an agent and no person has reviewed it. | PASS |
| 22 | materializado | materialized | PASS |
| 23 | referenciado | referenced | PASS |
| 24 | desconocido | unknown | PASS |
| 25 | Ítem | Item | PASS |
| 26 | Colección | Collection | PASS |
| 27 | Comunidad | Community | PASS |
| 28 | Estado | State | PASS |
| 29 | Origen | Origin | PASS |
| 30 | Copia conservada | Kept copy | PASS |
| 31 | Registro de metadatos | Metadata record | PASS |
| 32 | ninguna colección registrada | no collection recorded | PASS |
| 33 | en {communities} | in {communities} | PASS |
| 34 | no se capturó ninguno | none was captured | PASS |
| 35 | declarado, pero ausente del disco | declared, but absent from the disk | PASS |
| 36 | Descargar {file} | Download {file} | PASS |
| 37 | vía CDN | via CDN | PASS |
| 38 | Dublin Core cualificado · {size} KB | Qualified Dublin Core · {size} KB | PASS |
| 39 | sin registro, así que nada que generar | no record, so nothing to generate | PASS |
| 40 | esta instancia no declara ninguna raíz publicada | this instance declares no published root | PASS |
| 41 | {label}: no generado (ejecute {command}) | {label}: not generated (run {command}) | PASS |
| 42 | Dublin Core XML | Dublin Core XML | PASS |
| 43 | JSON-LD (términos DCMI) | JSON-LD (DCMI terms) | PASS |
| 44 | Réplica local → | Local replica → | PASS |
| 45 | Fuente en IRIS → | Source in IRIS → | PASS |
| 46 | no hay URI de origen registrado | there is no recorded origin URI | PASS |
| 47 | conservado aquí, no publicado — {gates} | kept here, not published — {gates} | PASS |
| 48 | no se conserva aquí | not kept here | PASS |
| 49 | no registrado | not recorded | PASS |
| 50 | {size} MB | {size} MB | PASS |
| 51 | Lista de comunidades | List of communities | PASS |
| 52 | {files} archivos · {size} en origen | {files} files · {size} at origin | PASS |
| 53 | tamaño en origen <strong>desconocido</strong>: la segunda página del informe de almacenamiento nunca se leyó, y una cifra interpolada a partir de la primera parecería medida | size at origin <strong>unknown</strong>: the second page of the storage report was never read, and a figure interpolated from the first would seem measured | PASS |
| 54 | ítems modelados: {modelled}; conservados aquí: {held} | items modelled: {modelled}; kept here: {held} | PASS |
| 55 | Cada fila de abajo está <strong>activa</strong>. Una fila no aparece en gris cuando este repositorio no la conserva: indica {referenced}, que es el estado real y la razón de ser de un catálogo modelado por referencia. {materialized} significa que los bytes están aquí. | Each row below is <strong>active</strong>. A row does not appear grey when this repository does not keep it: it shows {referenced}, which is the real state and the raison d'être of a catalogue modelled by reference. {materialized} means the bytes are here. | PASS |
| 56 | Conservados aquí — {n} ítem(s) materializado(s) | Kept here — {n} materialized item(s) | PASS |
| 57 | Cada fila ofrece <strong>tres vías hacia el mismo ítem</strong>: la <strong>fuente en IRIS</strong>, en origen en la OMS; la página de <strong>réplica local</strong> de este repositorio, y <strong>el recurso en sí</strong>, descargable desde el repositorio y, por separado, desde un nodo de CDN. | Each row offers <strong>three routes to the same item</strong>: the <strong>source in IRIS</strong>, at origin at WHO; this repository's <strong>local replica</strong> page; and <strong>the resource itself</strong>, downloadable from the repository and, separately, from a CDN node. | PASS |
| 58 | <strong>Tres vías hacia un mismo ítem, y esa es la idea.</strong> El catálogo conoce este ítem una sola vez; los bytes son accesibles <em>en origen en la OMS</em>, <em>aquí como página de réplica</em> y <em>desde un nodo de CDN</em>; jsDelivr sirve cualquier repositorio público, así que la última no le cuesta a este proyecto ningún alojamiento. El grafo de conocimiento dice qué existe y dónde; la CDN no dice nada y simplemente lo sirve. | <strong>Three routes to one same item, and that is the idea.</strong> The catalogue knows this item only once; the bytes are accessible <em>at origin at WHO</em>, <em>here as a replica page</em> and <em>from a CDN node</em>; jsDelivr serves any public repository, so the last one costs this project no hosting. The knowledge graph says what exists and where; the CDN says nothing and simply serves it. | PASS |
| 59 | <strong>Se ha confirmado que ambas formas de enlace funcionan.</strong> Los enlaces de <code>raw.githubusercontent.com</code> se descargaron y devolvieron 200, con tamaños en bytes que coinciden exactamente con el catálogo. Los enlaces <em>vía CDN</em> no pudieron comprobarse desde el entorno que generó esta página —allí <code>cdn.jsdelivr.net</code> tiene bloqueada la salida—, así que se compusieron según la forma de URL documentada por jsDelivr, y el propietario probó uno a mano el 2026-09-20. Se conservan ambos: uno no le cuesta nada servir a este proyecto, y un lector que encuentre uno de ellos no disponible aún tiene el otro. | <strong>Both link forms have been confirmed to work.</strong> The <code>raw.githubusercontent.com</code> links were downloaded and returned 200, with byte sizes matching the catalogue exactly. The <em>via CDN</em> links could not be checked from the environment that generated this page — there, <code>cdn.jsdelivr.net</code> has outbound blocked — so they were composed according to the URL form documented by jsDelivr, and the owner tried one by hand on 2026-09-20. Both are kept: one costs this project nothing to serve, and a reader who finds one of them unavailable still has the other. | PASS |
| 60 | <strong>Dónde están realmente las copias conservadas — tarea <code>yl5w</code>.</strong> El catálogo registra cada una de ellas en <code>uploads/&lt;name&gt;.pdf</code> relativo a <code>who-iris/</code>, y <em>faltan las tres rutas</em>: la #477 movió <code>library/</code> a esta instancia y dejó <code>uploads/</code> en <code>cat-harness/</code>. | <strong>Where the kept copies really are — task <code>yl5w</code>.</strong> The catalogue records each of them at <code>uploads/&lt;name&gt;.pdf</code> relative to <code>who-iris/</code>, and <em>all three paths are missing</em>: #477 moved <code>library/</code> into this instance and left <code>uploads/</code> in <code>cat-harness/</code>. | PASS |
| 61 | Los enlaces de descarga de arriba apuntan a donde <em>están</em> los bytes, así que funcionan. Lo que está mal es la afirmación del catálogo, y <code>check:catalogue</code> no comprueba <code>localPath</code> en absoluto: verifica <code>metadataRef</code> y <code>libraryId</code>, y da por buena una ejecución sobre tres afirmaciones <code>materialized</code> que no remiten a nada. | The download links above point to where the bytes <em>are</em>, so they work. What is wrong is the catalogue's claim, and <code>check:catalogue</code> does not check <code>localPath</code> at all: it verifies <code>metadataRef</code> and <code>libraryId</code>, and passes a run over three <code>materialized</code> claims that refer to nothing. | PASS |
| 62 | URI permanente de esta colección | Permanent URI of this collection | PASS |
| 63 | no registrado | not recorded | PASS |
| 64 | <strong>Cómo se estableció este nodo.</strong> {note} | <strong>How this node was established.</strong> {note} | PASS |
| 65 | Ítems de esta colección | Items of this collection | PASS |
| 66 | Mostrando 1 – {n} de {n} <em>modelados</em>. La colección en origen es mayor; este catálogo contiene lo que se materializó, y lo indica fila por fila. | Showing 1 – {n} of {n} <em>modelled</em>. The collection at origin is larger; this catalogue contains what was materialized, and says so row by row. | PASS |
| 67 | URI permanente de este ítem | Permanent URI of this item | PASS |
| 68 | no registrado: ingerido de una copia local, no resuelto desde IRIS | not recorded: ingested from a local copy, not resolved from IRIS | PASS |
| 69 | En: {path} | In: {path} | PASS |
| 70 | Archivos | Files | PASS |
| 71 | Nombre | Name | PASS |
| 72 | Paquete | Package | PASS |
| 73 | Tamaño | Size | PASS |
| 74 | Leer aquí | Read here | PASS |
| 75 | Ambos enlaces, como se pidió | Both links, as requested | PASS |
| 76 | Dónde | Where | PASS |
| 77 | Enlace | Link | PASS |
| 78 | En origen, en la OMS | At origin, at WHO | PASS |
| 79 | Conservado aquí, en folio-assistant | Kept here, in folio-assistant | PASS |
| 80 | no conservado | not kept | PASS |
| 81 | En la colección | In the collection | PASS |
| 82 | Texto ingerido (L1) | Ingested text (L1) | PASS |
| 83 | Registro Dublin Core | Dublin Core record | PASS |
| 84 | Representaciones Dublin Core | Dublin Core representations | PASS |
| 85 | <strong>Sin registro Dublin Core.</strong> El catálogo lo indica en lugar de sintetizar metadatos a partir del PDF: la regla R8 de la habilidad <code>iris-dspace</code>, <em>nunca inferir metadatos del PDF cuando existe un registro</em>, cuya recíproca es que un registro ausente sigue ausente. | <strong>No Dublin Core record.</strong> The catalogue says so instead of synthesizing metadata from the PDF: rule R8 of the <code>iris-dspace</code> skill, <em>never infer metadata from the PDF when a record exists</em>, whose converse is that an absent record stays absent. | PASS |
| 86 | El objetivo principal del Repositorio Institucional para Compartir Información (IRIS) es proporcionar acceso digital gratuito a las publicaciones científicas y técnicas de la Organización Mundial de la Salud (OMS), incluidas las contribuciones de sus oficinas en los países, sus oficinas regionales y la Sede. Además, IRIS abarca los mandatos establecidos por los órganos deliberantes de la Organización en colaboración con sus Estados Miembros. | The main objective of the Institutional Repository for Sharing Information (IRIS) is to provide free digital access to the scientific and technical publications of the World Health Organization (WHO), including the contributions of its country offices, its regional offices and Headquarters. In addition, IRIS covers the mandates established by the Organization's governing bodies in collaboration with its Member States. | PASS |
| 87 | Réplica. Sin emblema de la OMS ni fotografía: solo color, tomado del tema {theme}, medido a partir de la propia hoja de estilos del sitio. | Replica. No WHO emblem or photograph: colour only, taken from the {theme} theme, measured from the site's own stylesheet. | PASS |
| 88 | Buscar entre los {n} ítems del repositorio | Search among the repository's {n} items | PASS |
| 89 | Buscar entre los ítems del repositorio y en la búsqueda por identificador de los nodos referenciados | Search among the repository's items and in the search by identifier of the referenced nodes *(round 2)* | PASS (fixed in round 2) |
| 90 | Buscar | Search | PASS |
| 91 | Busca entre <strong>{held}</strong> ítems conservados por valor y las comunidades/colecciones referenciadas. Para localizar por identificador cualquiera de los <strong>{referenced}</strong> nodos referenciados, busque aquí o abra la {lookup}. | Searches <strong>{held}</strong> items kept by value and the referenced communities/collections. To locate by identifier any of the <strong>{referenced}</strong> referenced nodes, search here or open the {lookup}. | PASS |
| 92 | búsqueda por identificador | search by identifier | PASS |
| 93 | IRIS en origen registra <strong>{items}</strong> ítems repartidos en <strong>{files}</strong> archivos. | IRIS at origin records <strong>{items}</strong> items spread across <strong>{files}</strong> files. | PASS |
| 94 | Envíos recientes | Recent submissions | PASS |
| 95 | Ordenado por {key}, del más reciente al más antiguo: la clave por la que IRIS ordena su propia lista. Cuando un registro tiene varias fechas de ingreso se usa la más reciente; el ítem de la WPRO tiene dos, con cinco días de diferencia, y la segunda corresponde a la fusión con el IRIS regional. | Sorted by {key}, newest to oldest: the key by which IRIS sorts its own list. When a record has several entry dates the most recent is used; the WPRO item has two, five days apart, and the second corresponds to the merge with the regional IRIS. | PASS |
| 96 | Explorar | Explore | PASS |
| 97 | {link}: la réplica de {url}, con el estado de materialización de cada nodo ({communities} comunidades, {collections} colecciones) | {link}: the replica of {url}, with the materialization state of each node ({communities} communities, {collections} collections) | PASS |
| 98 | {link}: colección | {link}: collection | PASS |
| 99 | <strong>Esta es la puerta de entrada, no el visualizador de la biblioteca.</strong> El visualizador completo de <code>library/</code> es la tarea <code>jbx2</code> y se está construyendo por separado. Esta página imita la página de inicio de IRIS y enlaza hacia otras páginas, en lugar de convertirse en una segunda respuesta a la misma pregunta. | <strong>This is the front door, not the library visualizer.</strong> The full visualizer of <code>library/</code> is task <code>jbx2</code> and is being built separately. This page imitates the IRIS home page and links to other pages, instead of becoming a second answer to the same question. | PASS |
| 100 | El direccionamiento sigue la regla del propietario —<code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code>—, de modo que una instancia que instancia un directorio obtiene un visualizador montado bajo el tipo de ese directorio: <code>/library/who-iris/</code>, <code>/docs/who-iris/</code>, etc. | Addressing follows the owner's rule — <code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code> — so that an instance that instantiates a directory gets a visualizer mounted under that directory's type: <code>/library/who-iris/</code>, <code>/docs/who-iris/</code>, etc. | PASS |
| 101 | no hay autor registrado | there is no recorded author | PASS |
| 102 | Fecha de publicación: {date} | Publication date: {date} | PASS |
| 103 | Se ha generado una portada y se conserva aquí. No se publica: {gates}. | A cover has been generated and is kept here. It is not published: {gates}. | PASS |
| 104 | portada<br>no mostrada | cover<br>not shown | PASS |
| 105 | no se generó portada | no cover was generated | PASS |
| 106 | sin portada | no cover | PASS |
| 107 | Portada de {title}, generada aquí a partir de la página 1 del PDF conservado | Cover of {title}, generated here from page 1 of the kept PDF | PASS |
| 108 | Portada de {title}, generada aquí a partir de la página 1 del PDF conservado, con el emblema de la OMS enmascarado | Cover of {title}, generated here from page 1 of the kept PDF, with the WHO emblem masked | PASS |
| 109 | Se ha generado y registrado una portada para este ítem. No se muestra: la portada de la publicación lleva el emblema de la OMS, y esta réplica no está publicada bajo la OMS. | A cover has been generated and recorded for this item. It is not shown: the publication's cover carries the WHO emblem, and this replica is not published under WHO. | PASS |
| 110 | No hay <code>dc.description.abstract</code> en el registro capturado. | There is no <code>dc.description.abstract</code> in the captured record. | PASS |
| 111 | Nodos del catálogo que coinciden ({n}): | Catalogue nodes that match ({n}): | PASS |
| 112 | Buscar también por identificador: | Also search by identifier: | PASS |
| 113 | Buscar «{q}» en los nodos referenciados → | Search «{q}» in the referenced nodes → | PASS |
| 114 | Ningún ítem ni colección materializado coincide con «<strong>{q}</strong>». | No materialized item or collection matches «<strong>{q}</strong>». | PASS |
| 115 | Buscar «{q}» en la búsqueda por identificador de los nodos referenciados ({n} nodos) → | Search «{q}» in the search by identifier of the referenced nodes ({n} nodes) → *(round 2)* | PASS (fixed in round 2) |

### French (`fr`) — final msgstr, back-translation, verdict

| # | msgstr | back-translation | verdict |
|---|---|---|---|
| 0 | {title} — réplique ingérée d’IRIS | {title} — ingested replica of IRIS | PASS |
| 1 | Réplique d’une page de l’IRIS de l’OMS, générée à partir du catalogue ingéré de ce dépôt. Ce n’est pas l’OMS, et ce n’est pas en direct. | Replica of a page of WHO's IRIS, generated from this repository's ingested catalogue. It is not WHO, and it is not live. | PASS |
| 2 | <strong>COPIE INGÉRÉE — ce n’est pas l’OMS, et ce n’est pas en direct.</strong> Cette page est générée par {folioAssistant} à partir de son propre catalogue de {iris}, modélisé <em>par référence</em> : {figures}. Le logo de l’OMS est délibérément omis, et les couvertures générées ne sont pas affichées pour la même raison : elles portent l’emblème imprimé sur les publications. | <strong>INGESTED COPY — it is not WHO, and it is not live.</strong> This page is generated by {folioAssistant} from its own catalogue of {iris}, modelled <em>by reference</em>: {figures}. The WHO logo is deliberately omitted, and the generated covers are not displayed for the same reason: they bear the emblem printed on the publications. | PASS |
| 3 | {nodes} nœuds d’un dépôt de {items} documents et de {size}, dont <strong>{held} documents</strong> sont conservés ici | {nodes} nodes of a repository of {items} documents and {size}, of which <strong>{held} documents</strong> are kept here | PASS |
| 4 | {nodes} nœuds d’un dépôt de {items} documents et de {size}, dont <strong>1 document</strong> est conservé ici | {nodes} nodes of a repository of {items} documents and {size}, of which <strong>1 document</strong> is kept here | PASS |
| 5 | {nodes} nœuds d’un dépôt de taille non mesurée, dont <strong>{held} document(s)</strong> sont conservés ici | {nodes} nodes of a repository of unmeasured size, of which <strong>{held} document(s)</strong> are kept here | PASS |
| 6 | Organisation mondiale<br>de la Santé | World Health<br>Organization | PASS |
| 7 | Répertoire institutionnel<br>pour le partage d’informations | Institutional repository<br>for information sharing | PASS |
| 8 | Logo omis, couvertures non affichées — réplique, non publiée sous l’égide de l’OMS | Logo omitted, covers not displayed — replica, not published under the aegis of WHO | PASS |
| 9 | Communautés et collections | Communities and collections | PASS |
| 10 | Parcourir IRIS | Browse IRIS | PASS |
| 11 | Statistiques | Statistics | PASS |
| 12 | À propos | About | PASS |
| 13 | Contact | Contact | PASS |
| 14 | Aide | Help | PASS |
| 15 | Accueil | Home | PASS |
| 16 | Liste des communautés | List of communities | PASS |
| 17 | <strong>Réplique ingérée.</strong> Générée à partir de {catalogue} par {generator}. Mise en page d’après {iris} ; chaque chiffre de cette page est lu dans le catalogue, et non copié d’une capture d’écran. | <strong>Ingested replica.</strong> Generated from {catalogue} by {generator}. Layout after {iris}; every figure on this page is read from the catalogue, not copied from a screenshot. | PASS |
| 18 | Source faisant foi : {iris} — © OMS. Cette copie ne revendique aucune approbation et ne porte aucune marque de l’OMS. | Authoritative source: {iris} — © WHO. This copy claims no endorsement and bears no WHO mark. | PASS |
| 19 | Langue de l’interface | Interface language | PASS |
| 20 | L’interface est affichée en {language}. Les titres, auteurs, résumés et autres notices du catalogue sont présentés tels que l’OMS les a publiés. | The interface is displayed in {language}. The titles, authors, abstracts and other catalogue records are presented as WHO published them. | PASS |
| 21 | Cette traduction de l’interface a été produite par un agent et n’a pas été relue par une personne. | This translation of the interface was produced by an agent and has not been proofread by a person. | PASS |
| 22 | matérialisé | materialized | PASS |
| 23 | référencé | referenced | PASS |
| 24 | inconnu | unknown | PASS |
| 25 | Document | Document | PASS |
| 26 | Collection | Collection | PASS |
| 27 | Communauté | Community | PASS |
| 28 | État | State | PASS |
| 29 | En amont | Upstream | PASS |
| 30 | Copie conservée | Kept copy | PASS |
| 31 | Notice de métadonnées | Metadata record | PASS |
| 32 | aucune collection enregistrée | no collection recorded | PASS |
| 33 | dans {communities} | in {communities} | PASS |
| 34 | aucune notice saisie | no record captured *(round 2)* | PASS (fixed in round 2) |
| 35 | déclarée, mais absente du disque | declared, but absent from disk | PASS |
| 36 | Télécharger {file} | Download {file} | PASS |
| 37 | via le CDN | via the CDN | PASS |
| 38 | Dublin Core qualifié · {size} Ko | Qualified Dublin Core · {size} KB | PASS |
| 39 | aucune notice, donc rien à générer | no record, so nothing to generate | PASS |
| 40 | cette instance ne déclare aucune racine publiée | this instance declares no published root | PASS |
| 41 | {label} : non généré (exécutez {command}) | {label}: not generated (run {command}) | PASS |
| 42 | Dublin Core XML | Dublin Core XML | PASS |
| 43 | JSON-LD (termes DCMI) | JSON-LD (DCMI terms) | PASS |
| 44 | Réplique locale → | Local replica → | PASS |
| 45 | Source IRIS → | IRIS source → | PASS |
| 46 | aucune URI en amont enregistrée | no upstream URI recorded | PASS |
| 47 | conservé ici, non publié — {gates} | kept here, not published — {gates} | PASS |
| 48 | non conservé ici | not kept here | PASS |
| 49 | non enregistrée | not recorded | PASS |
| 50 | {size} Mo | {size} MB | PASS |
| 51 | Liste des communautés | List of communities | PASS |
| 52 | {files} fichiers · {size} en amont | {files} files · {size} upstream | PASS |
| 53 | taille en amont <strong>inconnue</strong> — la deuxième page du rapport de stockage n’a jamais été lue, et un chiffre extrapolé à partir de la première aurait l’air mesuré | upstream size <strong>unknown</strong> — the second page of the storage report was never read, and a figure extrapolated from the first would look measured | PASS |
| 54 | documents modélisés : {modelled}, conservés ici : {held} | documents modelled: {modelled}, kept here: {held} | PASS |
| 55 | Chaque ligne ci-dessous est <strong>active</strong>. Une ligne n’est pas grisée lorsque ce dépôt ne la conserve pas : elle indique {referenced}, ce qui est l’état réel et tout l’intérêt d’un catalogue modélisé par référence. {materialized} signifie que les octets sont ici. | Each row below is <strong>active</strong>. A row is not greyed out when this repository does not keep it: it shows {referenced}, which is the real state and the whole point of a catalogue modelled by reference. {materialized} means the bytes are here. | PASS |
| 56 | Conservés ici — {n} document(s) matérialisé(s) | Kept here — {n} materialized document(s) | PASS |
| 57 | Chaque ligne offre <strong>trois accès au même document</strong> : la <strong>source IRIS</strong> en amont à l’OMS, la page de <strong>réplique locale</strong> propre à ce dépôt, et <strong>la ressource elle-même</strong> — téléchargeable depuis le dépôt et, séparément, depuis un nœud de CDN. | Each row offers <strong>three accesses to the same document</strong>: the <strong>IRIS source</strong> upstream at WHO, this repository's own <strong>local replica</strong> page, and <strong>the resource itself</strong> — downloadable from the repository and, separately, from a CDN node. | PASS |
| 58 | <strong>Trois accès à un même document, et c’est voulu.</strong> Le catalogue ne connaît ce document qu’une fois ; les octets sont accessibles <em>en amont à l’OMS</em>, <em>ici sous forme de page de réplique</em> et <em>depuis un nœud de CDN</em> — jsDelivr sert tout dépôt public, si bien que le dernier ne coûte à ce projet aucun hébergement. Le graphe de connaissances dit ce qui existe et où ; le CDN ne dit rien et se contente de servir. | <strong>Three accesses to one document, and that is intended.</strong> The catalogue knows this document only once; the bytes are accessible <em>upstream at WHO</em>, <em>here as a replica page</em> and <em>from a CDN node</em> — jsDelivr serves any public repository, so the last costs this project no hosting. The knowledge graph says what exists and where; the CDN says nothing and just serves. | PASS |
| 59 | <strong>Les deux formes de lien fonctionnent, c’est vérifié.</strong> Les liens <code>raw.githubusercontent.com</code> ont été récupérés et ont renvoyé 200, avec des tailles en octets correspondant exactement au catalogue. Les liens <em>via le CDN</em> n’ont pas pu être vérifiés depuis l’environnement qui a généré cette page — <code>cdn.jsdelivr.net</code> y est bloqué en sortie — ils ont donc été composés selon la forme d’URL documentée par jsDelivr, et le propriétaire en a testé un à la main le 2026-09-20. Les deux sont conservés : l’un ne coûte rien à servir à ce projet, et un lecteur qui trouve l’un indisponible dispose encore de l’autre. | <strong>Both link forms work; this is verified.</strong> The <code>raw.githubusercontent.com</code> links were fetched and returned 200, with byte sizes matching the catalogue exactly. The <em>via the CDN</em> links could not be verified from the environment that generated this page — <code>cdn.jsdelivr.net</code> is blocked for outbound there — so they were composed following jsDelivr's documented URL form, and the owner tested one by hand on 2026-09-20. Both are kept: one costs this project nothing to serve, and a reader who finds one unavailable still has the other. | PASS |
| 60 | <strong>Où se trouvent réellement les copies conservées — tâche <code>yl5w</code>.</strong> Le catalogue enregistre chacune d’elles à <code>uploads/&lt;name&gt;.pdf</code> relativement à <code>who-iris/</code>, et <em>ces trois chemins sont tous absents</em> : la #477 a déplacé <code>library/</code> dans cette instance et laissé <code>uploads/</code> dans <code>cat-harness/</code>. | <strong>Where the kept copies really are — task <code>yl5w</code>.</strong> The catalogue records each of them at <code>uploads/&lt;name&gt;.pdf</code> relative to <code>who-iris/</code>, and <em>these three paths are all absent</em>: #477 moved <code>library/</code> into this instance and left <code>uploads/</code> in <code>cat-harness/</code>. | PASS |
| 61 | Les liens de téléchargement ci-dessus pointent vers l’endroit où les octets <em>se trouvent</em>, ils fonctionnent donc. C’est l’affirmation du catalogue qui est fausse, et <code>check:catalogue</code> ne vérifie pas du tout <code>localPath</code> : il vérifie <code>metadataRef</code> et <code>libraryId</code>, et signale une exécution sans erreur sur trois affirmations <code>materialized</code> qui ne renvoient à rien. | The download links above point to where the bytes <em>are</em>, so they work. It is the catalogue's claim that is false, and <code>check:catalogue</code> does not check <code>localPath</code> at all: it checks <code>metadataRef</code> and <code>libraryId</code>, and reports an error-free run over three <code>materialized</code> claims that point to nothing. | PASS |
| 62 | URI permanent de cette collection | Permanent URI of this collection | PASS |
| 63 | aucun enregistré | none recorded | PASS |
| 64 | <strong>Comment ce nœud a été établi.</strong> {note} | <strong>How this node was established.</strong> {note} | PASS |
| 65 | Documents de cette collection | Documents in this collection | PASS |
| 66 | Affichage de 1 à {n} sur {n} <em>modélisés</em>. La collection en amont est plus grande ; ce catalogue contient ce qui a été matérialisé, et l’indique ligne par ligne. | Showing 1 to {n} of {n} <em>modelled</em>. The upstream collection is bigger; this catalogue contains what was materialized, and says so row by row. | PASS |
| 67 | URI permanent de ce document | Permanent URI of this document | PASS |
| 68 | aucun enregistré — ingéré à partir d’une copie locale, non résolu depuis IRIS | none recorded — ingested from a local copy, not resolved from IRIS | PASS |
| 69 | Dans : {path} | In: {path} | PASS |
| 70 | Fichiers | Files | PASS |
| 71 | Nom | Name | PASS |
| 72 | Paquet | Bundle (package) *(round 2)* | PASS (fixed in round 2) |
| 73 | Taille | Size | PASS |
| 74 | Lire ici | Read here | PASS |
| 75 | Les deux liens, comme demandé | Both links, as requested | PASS |
| 76 | Où | Where | PASS |
| 77 | Lien | Link | PASS |
| 78 | En amont, à l’OMS | Upstream, at WHO | PASS |
| 79 | Conservé ici, dans folio-assistant | Kept here, in folio-assistant | PASS |
| 80 | non conservé | not kept | PASS |
| 81 | Dans la collection | In the collection | PASS |
| 82 | Texte ingéré (L1) | Ingested text (L1) | PASS |
| 83 | Notice Dublin Core | Dublin Core record | PASS |
| 84 | Rendus Dublin Core | Dublin Core renderings | PASS |
| 85 | <strong>Aucune notice Dublin Core.</strong> Le catalogue l’indique plutôt que de synthétiser des métadonnées à partir du PDF — la règle R8 de la compétence <code>iris-dspace</code>, <em>ne jamais déduire les métadonnées du PDF lorsqu’une notice existe</em>, dont la réciproque est qu’une notice absente reste absente. | <strong>No Dublin Core record.</strong> The catalogue says so rather than synthesizing metadata from the PDF — rule R8 of the <code>iris-dspace</code> skill, <em>never deduce metadata from the PDF when a record exists</em>, the converse of which is that an absent record stays absent. | PASS |
| 86 | L’objectif principal du Répertoire institutionnel pour le partage d’informations (IRIS) est de fournir un accès numérique gratuit aux publications scientifiques et techniques de l’Organisation mondiale de la Santé (OMS), y compris les contributions de ses bureaux de pays, de ses bureaux régionaux et du Siège. En outre, IRIS couvre les mandats établis par les organes directeurs de l’Organisation en collaboration avec ses États Membres. | The main objective of the Institutional Repository for Information Sharing (IRIS) is to provide free digital access to the scientific and technical publications of the World Health Organization (WHO), including contributions from its country offices, its regional offices and Headquarters. In addition, IRIS covers the mandates established by the Organization's governing bodies in collaboration with its Member States. | PASS |
| 87 | Réplique. Ni emblème de l’OMS, ni photographie — uniquement des couleurs, issues du thème {theme} mesuré sur la propre feuille de style du site. | Replica. No WHO emblem, no photograph — only colours, from the {theme} theme measured on the site's own stylesheet. | PASS |
| 88 | Rechercher parmi les {n} documents du dépôt | Search among the repository's {n} documents | PASS |
| 89 | Rechercher parmi les documents du dépôt et dans la recherche par identifiant des nœuds référencés | Search among the repository's documents and in the identifier search of the referenced nodes *(round 2)* | PASS (fixed in round 2) |
| 90 | Rechercher | Search | PASS |
| 91 | Recherche parmi <strong>{held}</strong> documents conservés par valeur et les communautés/collections référencées. Pour retrouver par identifiant l’un des <strong>{referenced}</strong> nœuds référencés, recherchez ici ou ouvrez la {lookup}. | Search among {held} documents held by value and the referenced communities/collections. … *(round 2)* | PASS (fixed in round 2) |
| 92 | recherche par identifiant | search by identifier | PASS |
| 93 | IRIS en amont recense <strong>{items}</strong> documents répartis dans <strong>{files}</strong> fichiers. | Upstream IRIS counts <strong>{items}</strong> documents spread across <strong>{files}</strong> files. | PASS |
| 94 | Dépôts récents | Recent deposits | PASS |
| 95 | Trié par {key}, du plus récent au plus ancien — la clé selon laquelle IRIS trie sa propre liste. Lorsqu’une notice comporte plusieurs dates d’entrée, la plus récente est retenue ; le document du WPRO en a deux, à cinq jours d’intervalle, la seconde correspondant à la fusion avec l’IRIS régional. | Sorted by {key}, most recent first — the key by which IRIS sorts its own list. When a record has several entry dates, the most recent is used; the WPRO document has two, five days apart, the second corresponding to the merge with the regional IRIS. | PASS |
| 96 | Parcourir | Browse | PASS |
| 97 | {link} — la réplique de {url}, avec l’état de matérialisation de chaque nœud ({communities} communautés, {collections} collections) | {link} — the replica of {url}, with the materialization state of each node ({communities} communities, {collections} collections) | PASS |
| 98 | {link} — collection | {link} — collection | PASS |
| 99 | <strong>Ceci est la porte d’entrée, pas le visualiseur de la bibliothèque.</strong> Le visualiseur complet de <code>library/</code> correspond à la tâche <code>jbx2</code> et est développé séparément. Cette page imite la page d’accueil d’IRIS et renvoie plus loin, plutôt que de devenir une seconde réponse à la même question. | <strong>This is the front door, not the library visualizer.</strong> The full visualizer of <code>library/</code> corresponds to task <code>jbx2</code> and is developed separately. This page imitates the IRIS home page and refers further, rather than becoming a second answer to the same question. | PASS |
| 100 | L’adressage suit la règle du propriétaire — <code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code> — de sorte qu’une instance qui instancie un répertoire obtient un visualiseur monté sous le type de ce répertoire : <code>/library/who-iris/</code>, <code>/docs/who-iris/</code>, etc. | Addressing follows the owner's rule — <code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code> — so that an instance that instantiates a directory gets a visualizer mounted under that directory's type: <code>/library/who-iris/</code>, <code>/docs/who-iris/</code>, etc. | PASS |
| 101 | aucun auteur enregistré | no author recorded | PASS |
| 102 | Date de publication : {date} | Publication date: {date} | PASS |
| 103 | Une couverture est générée et conservée ici. Elle n’est pas publiée : {gates}. | A cover is generated and kept here. It is not published: {gates}. | PASS |
| 104 | couverture<br>non affichée | cover<br>not displayed | PASS |
| 105 | aucune couverture générée | no cover generated | PASS |
| 106 | pas de couverture | no cover | PASS |
| 107 | Couverture de {title}, générée ici à partir de la page 1 du PDF conservé | Cover of {title}, generated here from page 1 of the kept PDF | PASS |
| 108 | Couverture de {title}, générée ici à partir de la page 1 du PDF conservé, avec l’emblème de l’OMS masqué | Cover of {title}, generated here from page 1 of the kept PDF, with the WHO emblem masked | PASS |
| 109 | Une couverture est générée et enregistrée pour ce document. Elle n’est pas affichée : la couverture de la publication porte l’emblème de l’OMS, et cette réplique n’est pas publiée sous l’égide de l’OMS. | A cover is generated and recorded for this document. It is not displayed: the publication's cover bears the WHO emblem, and this replica is not published under the aegis of WHO. | PASS |
| 110 | Pas de <code>dc.description.abstract</code> dans la notice saisie. | No <code>dc.description.abstract</code> in the captured record. | PASS |
| 111 | Nœuds du catalogue correspondants ({n}) : | Matching catalogue nodes ({n}): | PASS |
| 112 | Rechercher aussi par identifiant : | Also search by identifier: | PASS |
| 113 | Rechercher « {q} » parmi les nœuds référencés → | Search for “{q}” among the referenced nodes → | PASS |
| 114 | Aucun document ni collection matérialisé ne correspond à « <strong>{q}</strong> ». | No materialized document or collection matches “<strong>{q}</strong>”. | PASS |
| 115 | Rechercher « {q} » dans la recherche par identifiant des nœuds référencés ({n} nœuds) → | Search for “{q}” in the identifier search of the referenced nodes ({n} nodes) → *(round 2)* | PASS (fixed in round 2) |

### Russian (`ru`) — final msgstr, back-translation, verdict

| # | msgstr | back-translation | verdict |
|---|---|---|---|
| 0 | {title} — импортированная реплика IRIS | {title} — imported IRIS replica *(round 2)* | PASS (fixed in round 2) |
| 1 | Реплика страницы IRIS ВОЗ, созданная на основе импортированного каталога этого репозитория. Это не ВОЗ и не действующий сайт. | … created from this repository's imported catalogue … *(round 2)* | PASS (fixed in round 2) |
| 2 | <strong>ИМПОРТИРОВАННАЯ КОПИЯ — это не ВОЗ и не действующий сайт.</strong> Эта страница создана инструментом {folioAssistant} на основе собственного каталога {iris}, смоделированного <em>по ссылке</em>: {figures}. Логотип ВОЗ намеренно опущен, а созданные обложки не показываются по той же причине: на них напечатана эмблема с изданий. | IMPORTED COPY … This page was created by the tool {folioAssistant} … *(round 2)* | PASS (fixed in round 2) |
| 3 | узлов: {nodes}, в репозитории записей: {items}, объём: {size}; из них <strong>хранятся здесь: {held}</strong> | nodes: {nodes}, records in the repository: {items}, volume: {size}; of them <strong>stored here: {held}</strong> | PASS |
| 4 | узлов: {nodes}, в репозитории записей: {items}, объём: {size}; из них <strong>здесь хранится одна запись</strong> | nodes: {nodes}, records in the repository: {items}, volume: {size}; of them <strong>one record is stored here</strong> | PASS |
| 5 | узлов: {nodes}, объём репозитория не измерен; из них <strong>хранятся здесь: {held}</strong> | nodes: {nodes}, repository volume not measured; of them <strong>stored here: {held}</strong> | PASS |
| 6 | Всемирная организация<br>здравоохранения | World Health<br>Organization | PASS |
| 7 | Институциональный репозиторий<br>для обмена информацией | Institutional repository<br>for information exchange | PASS |
| 8 | Логотип опущен, обложки не показываются — реплика, не опубликованная от имени ВОЗ | Logo omitted, covers not shown — a replica not published on behalf of WHO | PASS |
| 9 | Сообщества и коллекции | Communities and collections | PASS |
| 10 | Обзор IRIS | IRIS overview / browse | PASS |
| 11 | Статистика | Statistics | PASS |
| 12 | О репозитории | About the repository | PASS |
| 13 | Контакты | Contacts | PASS |
| 14 | Справка | Help | PASS |
| 15 | Главная | Main page | PASS |
| 16 | Список сообществ | List of communities | PASS |
| 17 | <strong>Импортированная реплика.</strong> Создана на основе {catalogue} с помощью {generator}. Макет по образцу {iris}; каждое число на этой странице прочитано из каталога, а не скопировано со снимка экрана. | Imported replica. *(round 2)* | PASS (fixed in round 2) |
| 18 | Первоисточник: {iris} — © ВОЗ. Эта копия не заявляет о каком-либо одобрении и не несёт никаких знаков ВОЗ. | Original source: {iris} — © WHO. This copy does not claim any endorsement and carries no WHO marks. | PASS |
| 19 | Язык интерфейса | Interface language | PASS |
| 20 | Интерфейс показан на языке: {language}. Названия изданий, авторы, аннотации и другие записи каталога показаны в том виде, в каком их опубликовала ВОЗ. | The interface is shown in the language: {language}. Titles of publications, authors, abstracts and other catalogue records are shown in the form in which WHO published them. | PASS |
| 21 | Этот перевод интерфейса выполнен агентом и не проверен человеком. | This translation of the interface was made by an agent and has not been checked by a human. | PASS |
| 22 | материализовано | materialized | PASS |
| 23 | по ссылке | by reference | PASS |
| 24 | неизвестно | unknown | PASS |
| 25 | Запись | Record | PASS |
| 26 | Коллекция | Collection | PASS |
| 27 | Сообщество | Community | PASS |
| 28 | Состояние | State | PASS |
| 29 | Первоисточник | Original source | PASS |
| 30 | Хранимая копия | Stored copy | PASS |
| 31 | Запись метаданных | Metadata record | PASS |
| 32 | коллекция не указана | collection not specified | PASS |
| 33 | в {communities} | in {communities} | PASS |
| 34 | запись не получена | record not obtained *(round 2)* | PASS (fixed in round 2) |
| 35 | объявлено, но отсутствует на диске | declared, but absent on disk | PASS |
| 36 | Скачать {file} | Download {file} | PASS |
| 37 | через CDN | via CDN | PASS |
| 38 | квалифицированный Dublin Core · {size} КБ | qualified Dublin Core · {size} KB | PASS |
| 39 | записи нет, поэтому отображать нечего | there is no record, so there is nothing to display | PASS |
| 40 | этот экземпляр не объявляет опубликованного корня | this instance does not declare a published root | PASS |
| 41 | {label}: не создано (выполните {command}) | {label}: not created (run {command}) | PASS |
| 42 | Dublin Core XML | Dublin Core XML | PASS |
| 43 | JSON-LD (термины DCMI) | JSON-LD (DCMI terms) | PASS |
| 44 | Локальная реплика → | Local replica → | PASS |
| 45 | Источник в IRIS → | Source in IRIS → | PASS |
| 46 | URI первоисточника не указан | URI of the original source not specified | PASS |
| 47 | хранится здесь, не опубликовано — {gates} | stored here, not published — {gates} | PASS |
| 48 | здесь не хранится | not stored here | PASS |
| 49 | не указан | not specified | PASS |
| 50 | {size} МБ | {size} MB | PASS |
| 51 | Список сообществ | List of communities | PASS |
| 52 | файлов: {files} · объём в первоисточнике: {size} | files: {files} · volume at the original source: {size} | PASS |
| 53 | объём в первоисточнике <strong>неизвестен</strong> — вторая страница отчёта о хранении так и не была прочитана, а число, интерполированное по первой, выглядело бы измеренным | volume at the original source <strong>unknown</strong> — the second page of the storage report was never read, and a number interpolated from the first would look measured | PASS |
| 54 | смоделировано записей: {modelled}, хранится здесь: {held} | records modelled: {modelled}, stored here: {held} | PASS |
| 55 | Каждая строка ниже <strong>активна</strong>. Строка не выделяется серым, если этот репозиторий её не хранит: в ней указано {referenced}, что и есть фактическое состояние и весь смысл каталога, смоделированного по ссылке. {materialized} означает, что байты находятся здесь. | Each row below is <strong>active</strong>. A row is not greyed out if this repository does not store it: it shows {referenced}, which is the actual state and the whole meaning of a catalogue modelled by reference. {materialized} means that the bytes are here. | PASS |
| 56 | Хранятся здесь — материализованных записей: {n} | Stored here — materialized records: {n} | PASS |
| 57 | Каждая строка даёт <strong>три пути к одной и той же записи</strong>: <strong>источник в IRIS</strong> у первоисточника в ВОЗ, страницу <strong>локальной реплики</strong> этого репозитория и <strong>сам ресурс</strong> — его можно скачать из репозитория и, отдельно, с узла CDN. | Each row gives <strong>three paths to one and the same record</strong>: the <strong>source in IRIS</strong> at the original source at WHO, this repository's <strong>local replica</strong> page and <strong>the resource itself</strong> — it can be downloaded from the repository and, separately, from a CDN node. | PASS |
| 58 | <strong>Три пути к одной записи — в этом и смысл.</strong> Каталог знает эту запись один раз; байты доступны <em>у первоисточника в ВОЗ</em>, <em>здесь в виде страницы реплики</em> и <em>с узла CDN</em> — jsDelivr обслуживает любой открытый репозиторий, поэтому последний путь не стоит этому проекту ничего за хостинг. Граф знаний говорит, что существует и где; CDN ничего не говорит и просто отдаёт файлы. | <strong>Three paths to one record — that is the point.</strong> The catalogue knows this record once; the bytes are available <em>at the original source at WHO</em>, <em>here as a replica page</em> and <em>from a CDN node</em> — jsDelivr serves any open repository, so the last path costs this project nothing for hosting. The knowledge graph says what exists and where; the CDN says nothing and simply serves the files. | PASS |
| 59 | <strong>Обе формы ссылок проверены и работают.</strong> Ссылки <code>raw.githubusercontent.com</code> были загружены и вернули 200, а размеры в байтах в точности совпали с каталогом. Ссылки <em>через CDN</em> не удалось проверить из среды, в которой создавалась эта страница, — там исходящий доступ к <code>cdn.jsdelivr.net</code> заблокирован, — поэтому они составлены по документированной форме URL jsDelivr, и владелец вручную проверил одну из них 2026-09-20. Сохранены обе: одна ничего не стоит этому проекту, а читатель, для которого одна из них недоступна, всё равно имеет другую. | <strong>Both forms of links have been checked and work.</strong> The <code>raw.githubusercontent.com</code> links were downloaded and returned 200, and the sizes in bytes matched the catalogue exactly. The <em>via CDN</em> links could not be checked from the environment in which this page was created — outbound access to <code>cdn.jsdelivr.net</code> is blocked there — so they were composed according to jsDelivr's documented URL form, and the owner manually checked one of them on 2026-09-20. Both are kept: one costs this project nothing, and a reader for whom one of them is unavailable still has the other. | PASS |
| 60 | <strong>Где на самом деле лежат хранимые копии — задача <code>yl5w</code>.</strong> Каталог указывает для каждой из них путь <code>uploads/&lt;name&gt;.pdf</code> относительно <code>who-iris/</code>, и <em>все три этих пути отсутствуют</em>: #477 перенёс <code>library/</code> в этот экземпляр и оставил <code>uploads/</code> в <code>cat-harness/</code>. | <strong>Where the stored copies actually lie — task <code>yl5w</code>.</strong> The catalogue gives for each of them the path <code>uploads/&lt;name&gt;.pdf</code> relative to <code>who-iris/</code>, and <em>all three of these paths are missing</em>: #477 moved <code>library/</code> into this instance and left <code>uploads/</code> in <code>cat-harness/</code>. | PASS |
| 61 | Ссылки для скачивания выше указывают туда, где байты <em>действительно находятся</em>, поэтому они работают. Неверно утверждение в каталоге, а <code>check:catalogue</code> вообще не проверяет <code>localPath</code> — он проверяет <code>metadataRef</code> и <code>libraryId</code> и сообщает об успешной проверке трёх утверждений <code>materialized</code>, которые ни на что не указывают. | The download links above point to where the bytes <em>actually are</em>, so they work. What is wrong is the statement in the catalogue, and <code>check:catalogue</code> does not check <code>localPath</code> at all — it checks <code>metadataRef</code> and <code>libraryId</code> and reports a successful check of three <code>materialized</code> statements that point to nothing. | PASS |
| 62 | Постоянный URI этой коллекции | Permanent URI of this collection | PASS |
| 63 | не указан | not specified | PASS |
| 64 | <strong>Как был установлен этот узел.</strong> {note} | <strong>How this node was established.</strong> {note} | PASS |
| 65 | Записи в этой коллекции | Records in this collection | PASS |
| 66 | Показаны 1 – {n} из {n} <em>смоделированных</em>. Коллекция в первоисточнике больше; этот каталог содержит то, что было материализовано, и указывает это в каждой строке. | Shown 1 – {n} of {n} <em>modelled</em>. The collection at the original source is larger; this catalogue contains what was materialized and indicates this in each row. | PASS |
| 67 | Постоянный URI этой записи | Permanent URI of this record | PASS |
| 68 | не указан — импортировано из локальной копии, не разрешено через IRIS | not specified — imported from a local copy, not resolved through IRIS *(round 2)* | PASS (fixed in round 2) |
| 69 | В: {path} | In: {path} | PASS |
| 70 | Файлы | Files | PASS |
| 71 | Имя | Name | PASS |
| 72 | Пакет | Bundle/package | PASS |
| 73 | Размер | Size | PASS |
| 74 | Читать здесь | Read here | PASS |
| 75 | Обе ссылки, как и просили | Both links, as requested | PASS |
| 76 | Где | Where | PASS |
| 77 | Ссылка | Link | PASS |
| 78 | У первоисточника, в ВОЗ | At the original source, at WHO | PASS |
| 79 | Хранится здесь, в folio-assistant | Stored here, in folio-assistant | PASS |
| 80 | не хранится | not stored | PASS |
| 81 | В коллекции | In the collection | PASS |
| 82 | Импортированный текст (L1) | Imported text (L1) *(round 2)* | PASS (fixed in round 2) |
| 83 | Запись Dublin Core | Dublin Core record | PASS |
| 84 | Представления Dublin Core | Dublin Core representations | PASS |
| 85 | <strong>Записи Dublin Core нет.</strong> Каталог сообщает об этом, а не синтезирует метаданные из PDF: таково правило R8 навыка <code>iris-dspace</code>, <em>никогда не выводить метаданные из PDF, если запись существует</em>, обратная сторона которого — отсутствующая запись остаётся отсутствующей. | <strong>There is no Dublin Core record.</strong> The catalogue reports this rather than synthesizing metadata from the PDF: such is rule R8 of the <code>iris-dspace</code> skill, <em>never derive metadata from the PDF if a record exists</em>, the flip side of which is that an absent record stays absent. | PASS |
| 86 | Основная цель Институционального репозитория для обмена информацией (IRIS) — обеспечить бесплатный цифровой доступ к научным и техническим публикациям Всемирной организации здравоохранения (ВОЗ), включая материалы её страновых бюро, региональных бюро и штаб-квартиры. Кроме того, IRIS охватывает мандаты, установленные руководящими органами Организации совместно с её государствами-членами. | The main goal of the Institutional Repository for Information Exchange (IRIS) is to provide free digital access to the scientific and technical publications of the World Health Organization (WHO), including materials of its country offices, regional offices and headquarters. In addition, IRIS covers the mandates established by the Organization's governing bodies together with its Member States. | PASS |
| 87 | Реплика. Без эмблемы ВОЗ и без фотографии — только цвет, из темы {theme}, измеренной по собственной таблице стилей сайта. | Replica. Without the WHO emblem and without a photograph — only colour, from the {theme} theme, measured from the site's own stylesheet. | PASS |
| 88 | Поиск по записям репозитория (всего: {n}) | Search the repository records (total: {n}) | PASS |
| 89 | Поиск по записям репозитория и по идентификаторам узлов, на которые есть ссылки | Search the repository records and by the identifiers of nodes that are referenced | PASS |
| 90 | Найти | Find | PASS |
| 91 | Поиск по записям, хранимым по значению (<strong>{held}</strong>), а также по сообществам и коллекциям, на которые есть ссылки. Чтобы найти по идентификатору любой из узлов, на которые есть ссылки (<strong>{referenced}</strong>), ищите здесь или откройте {lookup}. | Search the records stored by value ({held}), and the referenced communities and collections. … *(round 2)* | PASS (fixed in round 2) |
| 92 | поиск по идентификатору | search by identifier | PASS |
| 93 | IRIS у первоисточника сообщает: записей — <strong>{items}</strong>, файлов — <strong>{files}</strong>. | IRIS at the original source reports: records — <strong>{items}</strong>, files — <strong>{files}</strong>. | PASS |
| 94 | Недавние поступления | Recent arrivals | PASS |
| 95 | Упорядочено по {key}, сначала самые новые — по этому ключу IRIS сортирует собственный список. Если у записи несколько дат поступления, используется последняя; у записи WPRO их две, с разницей в пять дней, и вторая — это слияние с региональным IRIS. | Ordered by {key}, newest first — IRIS sorts its own list by this key. If a record has several arrival dates, the last one is used; the WPRO record has two, five days apart, and the second is the merge with the regional IRIS. | PASS |
| 96 | Обзор | Overview / browse | PASS |
| 97 | {link} — реплика {url} с состоянием материализации каждого узла (сообществ: {communities}, коллекций: {collections}) | {link} — replica of {url} with the materialization state of each node (communities: {communities}, collections: {collections}) | PASS |
| 98 | {link} — коллекция | {link} — collection | PASS |
| 99 | <strong>Это главный вход, а не визуализатор библиотеки.</strong> Полный визуализатор <code>library/</code> — это задача <code>jbx2</code>, и он создаётся отдельно. Эта страница воспроизводит главную страницу IRIS и ведёт дальше, а не становится вторым ответом на тот же вопрос. | <strong>This is the main entrance, not the library visualizer.</strong> The full visualizer of <code>library/</code> is task <code>jbx2</code>, and it is being created separately. This page reproduces the IRIS home page and leads further, rather than becoming a second answer to the same question. | PASS |
| 100 | Адресация следует правилу владельца — <code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code>, — так что экземпляр, который инстанцирует директорию, получает визуализатор, смонтированный под типом этой директории: <code>/library/who-iris/</code>, <code>/docs/who-iris/</code> и так далее. | … an instance that instantiates a directory gets a visualizer mounted under the type of this directory … *(round 2)* | PASS (fixed in round 2) |
| 101 | автор не указан | author not specified | PASS |
| 102 | Дата публикации: {date} | Publication date: {date} | PASS |
| 103 | Обложка создана и хранится здесь. Она не опубликована: {gates}. | The cover has been created and is stored here. It is not published: {gates}. | PASS |
| 104 | обложка<br>не показана | cover<br>not shown | PASS |
| 105 | обложка не создана | cover not created | PASS |
| 106 | нет обложки | no cover | PASS |
| 107 | Обложка издания «{title}», созданная здесь по странице 1 хранимого PDF | Cover of the publication “{title}”, created here from page 1 of the stored PDF | PASS |
| 108 | Обложка издания «{title}», созданная здесь по странице 1 хранимого PDF, с замаскированной эмблемой ВОЗ | Cover of the publication “{title}”, created here from page 1 of the stored PDF, with the WHO emblem masked | PASS |
| 109 | Обложка для этой записи создана и учтена. Она не показывается: на обложке издания есть эмблема ВОЗ, а эта реплика не опубликована от имени ВОЗ. | A cover for this record has been created and recorded. It is not shown: the publication's cover has the WHO emblem, and this replica is not published on behalf of WHO. | PASS |
| 110 | В полученной записи нет <code>dc.description.abstract</code>. | The obtained record has no <code>dc.description.abstract</code>. | PASS |
| 111 | Найденные узлы каталога ({n}): | Catalogue nodes found ({n}): | PASS |
| 112 | Также искать по идентификатору: | Also search by identifier: | PASS |
| 113 | Найти «{q}» среди узлов, на которые есть ссылки → | Find “{q}” among the nodes that are referenced → | PASS |
| 114 | Ни одна материализованная запись или коллекция не соответствует запросу «<strong>{q}</strong>». | Not one materialized record or collection matches the query “<strong>{q}</strong>”. | PASS |
| 115 | Найти «{q}» в поиске по идентификаторам узлов, на которые есть ссылки (узлов: {n}) → | Find “{q}” in the search by identifiers of referenced nodes (nodes: {n}) → | PASS |

### Chinese (`zh`) — final msgstr, back-translation, verdict

| # | msgstr | back-translation | verdict |
|---|---|---|---|
| 0 | {title} — 已收录的 IRIS 副本 | {title} — collected (included) IRIS copy | PASS |
| 1 | 世卫组织 IRIS 页面的副本，根据本存储库收录的目录生成。并非世卫组织网站，也非实时内容。 | A copy of a WHO IRIS page, generated from the catalogue included in this repository. Not the WHO website, and not real-time content. | PASS |
| 2 | <strong>收录副本——并非世卫组织网站，也非实时内容。</strong>本页面由 {folioAssistant} 根据其自有的 {iris} 目录生成，该目录<em>以引用方式</em>建模：{figures}。世卫组织标志被刻意省略，生成的封面出于同样原因不予显示——封面上印有出版物上的会徽。 | <strong>Included copy — not the WHO website, and not real-time content.</strong> This page is generated by {folioAssistant} from its own {iris} catalogue, which is modelled <em>by way of reference</em>: {figures}. The WHO logo is deliberately omitted, and the generated covers are not displayed for the same reason — the covers bear the emblem on the publications. | PASS |
| 3 | 共 {nodes} 个节点，所属存储库有 {items} 个条目、容量 {size}，其中 <strong>{held} 个条目</strong>保存在此处 | In total {nodes} nodes; the repository they belong to has {items} items and a capacity of {size}, of which <strong>{held} items</strong> are kept here | PASS |
| 4 | 共 {nodes} 个节点，所属存储库有 {items} 个条目、容量 {size}，其中 <strong>1 个条目</strong>保存在此处 | In total {nodes} nodes; the repository they belong to has {items} items and a capacity of {size}, of which <strong>1 item</strong> is kept here | PASS |
| 5 | 共 {nodes} 个节点，所属存储库容量未经测量，其中 <strong>{held} 个条目</strong>保存在此处 | In total {nodes} nodes; the capacity of the repository they belong to has not been measured, of which <strong>{held} items</strong> are kept here | PASS |
| 6 | 世界卫生<br>组织 | World Health<br>Organization | PASS |
| 7 | 机构信息<br>共享知识库 | Institutional information<br>sharing repository | PASS |
| 8 | 已省略标志，不显示封面——副本，并非以世卫组织名义发布 | Logo omitted, covers not displayed — a copy, not published in the name of WHO | PASS |
| 9 | 社区与馆藏 | Communities and collections | PASS |
| 10 | 浏览 IRIS | Browse IRIS | PASS |
| 11 | 统计 | Statistics | PASS |
| 12 | 关于 | About | PASS |
| 13 | 联系我们 | Contact us | PASS |
| 14 | 帮助 | Help | PASS |
| 15 | 首页 | Home page | PASS |
| 16 | 社区列表 | Community list | PASS |
| 17 | <strong>收录副本。</strong>由 {generator} 根据 {catalogue} 生成。版式参照 {iris}；本页面上的每个数字都读取自目录，而非从屏幕截图复制。 | <strong>Included copy.</strong> Generated by {generator} from {catalogue}. Layout modelled on {iris}; every number on this page is read from the catalogue, not copied from a screenshot. | PASS |
| 18 | 权威来源：{iris} — © 世卫组织。本副本不声称获得任何认可，也不带有任何世卫组织标志。 | Authoritative source: {iris} — © WHO. This copy does not claim any endorsement, and does not carry any WHO mark. | PASS |
| 19 | 界面语言 | Interface language | PASS |
| 20 | 界面以{language}显示。出版物的标题、作者、摘要及其他目录记录均按世卫组织发布的原样显示。 | The interface is displayed in {language}. Publications' titles, authors, abstracts and other catalogue records are all displayed as originally published by WHO. | PASS |
| 21 | 本界面译文由智能体生成，未经人工审阅。 | This interface translation was generated by an intelligent agent and has not been reviewed by a human. | PASS |
| 22 | 已实体化 | Materialized (made physical) | PASS |
| 23 | 仅引用 | Reference only | PASS |
| 24 | 未知 | Unknown | PASS |
| 25 | 条目 | Item | PASS |
| 26 | 馆藏 | Collection | PASS |
| 27 | 社区 | Community | PASS |
| 28 | 状态 | Status | PASS |
| 29 | 上游 | Upstream | PASS |
| 30 | 保存的副本 | Kept copy | PASS |
| 31 | 元数据记录 | Metadata record | PASS |
| 32 | 未记录馆藏 | Collection not recorded | PASS |
| 33 | 位于 {communities} | Located in {communities} | PASS |
| 34 | 未采集 | Not collected | PASS |
| 35 | 已声明，但磁盘上缺失 | Declared, but missing on disk | PASS |
| 36 | 下载 {file} | Download {file} | PASS |
| 37 | 经由 CDN | Via CDN | PASS |
| 38 | 限定都柏林核心 · {size} KB | Qualified Dublin Core · {size} KB | PASS |
| 39 | 无记录，因此无可生成 | No record, so nothing can be generated | PASS |
| 40 | 此实例未声明发布根目录 | This instance does not declare a publishing root directory | PASS |
| 41 | {label}：未生成（请运行 {command}） | {label}: not generated (please run {command}) | PASS |
| 42 | 都柏林核心 XML | Dublin Core XML | PASS |
| 43 | JSON-LD（DCMI 术语） | JSON-LD (DCMI terms) | PASS |
| 44 | 本地副本 → | Local copy → | PASS |
| 45 | IRIS 来源 → | IRIS source → | PASS |
| 46 | 未记录上游 URI | Upstream URI not recorded | PASS |
| 47 | 保存在此处，未发布——{gates} | Kept here, not published — {gates} | PASS |
| 48 | 未保存在此处 | Not kept here | PASS |
| 49 | 未记录 | Not recorded | PASS |
| 50 | {size} MB | {size} MB | PASS |
| 51 | 社区列表 | Community list | PASS |
| 52 | {files} 个文件 · 上游 {size} | {files} files · upstream {size} | PASS |
| 53 | 上游容量<strong>未知</strong>——存储报告的第二页从未读取，而根据第一页推算的数字会显得像是实测值 | Upstream capacity <strong>unknown</strong> — the second page of the storage report was never read, and a number extrapolated from the first page would appear to be a measured value | PASS |
| 54 | 已建模条目 {modelled} 个，保存在此处 {held} 个 | {modelled} items modelled, {held} kept here | PASS |
| 55 | 下面每一行都是<strong>可用的</strong>。当本存储库未保存某行时，该行不会显示为灰色，而是标为{referenced}，这才是实际状态，也正是以引用方式建模的目录的意义所在。{materialized}表示字节就在此处。 | Every row below is usable. … *(round 2)* | PASS (fixed in round 2) |
| 56 | 保存在此处——{n} 个已实体化条目 | Kept here — {n} materialized items | PASS |
| 57 | 每一行都提供<strong>通往同一条目的三条途径</strong>：位于世卫组织上游的 <strong>IRIS 来源</strong>、本存储库自有的<strong>本地副本</strong>页面，以及<strong>资源本身</strong>——可从存储库下载，也可另行从 CDN 边缘节点下载。 | Every row provides <strong>three routes to the same item</strong>: the <strong>IRIS source</strong> upstream at WHO, this repository's own <strong>local copy</strong> page, and <strong>the resource itself</strong> — downloadable from the repository, and separately from a CDN edge node. | PASS |
| 58 | <strong>一个条目三条途径，这正是要点。</strong>目录只记录此条目一次；字节可以<em>在世卫组织上游</em>、<em>在此处的副本页面</em>以及<em>从 CDN 边缘节点</em>获取——jsDelivr 为任何公开存储库提供服务，因此最后一条途径不会给本项目带来任何托管成本。知识图谱说明存在什么以及在哪里；CDN 不作任何说明，只负责提供文件。 | <strong>One item, three routes — this is exactly the point.</strong> The catalogue records this item only once; the bytes can be obtained <em>upstream at WHO</em>, <em>at the copy page here</em> and <em>from a CDN edge node</em> — jsDelivr serves any public repository, so the last route does not bring this project any hosting cost. The knowledge graph states what exists and where; the CDN states nothing, and is only responsible for serving files. | PASS |
| 59 | <strong>两种链接形式均已确认可用。</strong><code>raw.githubusercontent.com</code> 链接已实际获取，返回 200，字节数与目录完全一致。<em>经由 CDN</em> 的链接无法在生成本页面的环境中检查——那里禁止访问 <code>cdn.jsdelivr.net</code>——因此按 jsDelivr 文档规定的 URL 形式构造，并由所有者于 2026-09-20 手动试用了其中一个。两种都予以保留：一种对本项目而言零成本提供，而发现其中一种不可用的读者仍可使用另一种。 | <strong>Both link forms have been confirmed usable.</strong> The <code>raw.githubusercontent.com</code> links were actually fetched, returned 200, and their byte counts are fully consistent with the catalogue. The <em>via CDN</em> links could not be checked in the environment that generated this page — there, access to <code>cdn.jsdelivr.net</code> is prohibited — so they were constructed according to the URL form specified by jsDelivr's documentation, and the owner manually tried one of them on 2026-09-20. Both are kept: one costs this project nothing to serve, and a reader who finds one unavailable can still use the other. | PASS |
| 60 | <strong>保存的副本实际位于何处——任务 <code>yl5w</code>。</strong>目录将其中每一份都记录在相对于 <code>who-iris/</code> 的 <code>uploads/&lt;name&gt;.pdf</code>，而<em>这三个路径全部缺失</em>：#477 将 <code>library/</code> 移入了本实例，却把 <code>uploads/</code> 留在了 <code>cat-harness/</code>。 | <strong>Where the kept copies actually are — task <code>yl5w</code>.</strong> The catalogue records each of them at <code>uploads/&lt;name&gt;.pdf</code> relative to <code>who-iris/</code>, and <em>these three paths are all missing</em>: #477 moved <code>library/</code> into this instance, but left <code>uploads/</code> in <code>cat-harness/</code>. | PASS |
| 61 | 上面的下载链接指向字节<em>实际所在</em>的位置，因此可以使用。错的是目录中的声明，而 <code>check:catalogue</code> 根本不检查 <code>localPath</code>——它只核对 <code>metadataRef</code> 和 <code>libraryId</code>，并对三条指向空处的 <code>materialized</code> 声明报告检查通过。 | The download links above point to where the bytes <em>actually are</em>, so they can be used. What is wrong is the claim in the catalogue, and <code>check:catalogue</code> does not check <code>localPath</code> at all — it only checks <code>metadataRef</code> and <code>libraryId</code>, and reports a passed check for three <code>materialized</code> claims that point to nothing. | PASS |
| 62 | 本馆藏的永久 URI | Permanent URI of this collection | PASS |
| 63 | 未记录 | Not recorded | PASS |
| 64 | <strong>此节点的确立方式。</strong>{note} | <strong>How this node was established.</strong>{note} | PASS |
| 65 | 本馆藏中的条目 | Items in this collection | PASS |
| 66 | 正在显示第 1 – {n} 个，共 {n} 个<em>已建模</em>条目。上游馆藏规模更大；本目录保存的是已实体化的部分，并逐行注明。 | Showing items 1 – {n}, of {n} <em>modelled</em> items in total. The upstream collection is larger; this catalogue keeps the materialized part, and notes so row by row. | PASS |
| 67 | 本条目的永久 URI | Permanent URI of this item | PASS |
| 68 | 未记录——从本地副本收录，并非经 IRIS 解析 | Not recorded — included from a local copy, not resolved via IRIS | PASS |
| 69 | 位于：{path} | Located in: {path} | PASS |
| 70 | 文件 | Files | PASS |
| 71 | 名称 | Name | PASS |
| 72 | 文件包 | File package | PASS |
| 73 | 大小 | Size | PASS |
| 74 | 在此阅读 | Read here | PASS |
| 75 | 两个链接，按要求提供 | Two links, provided as requested *(round 2)* | PASS (fixed in round 2) |
| 76 | 位置 | Location | PASS |
| 77 | 链接 | Link | PASS |
| 78 | 上游，位于世卫组织 | Upstream, at WHO | PASS |
| 79 | 保存在此处，位于 folio-assistant | Kept here, in folio-assistant | PASS |
| 80 | 未保存 | Not kept | PASS |
| 81 | 所属馆藏 | Collection it belongs to | PASS |
| 82 | 收录的文本（L1） | Included text (L1) | PASS |
| 83 | 都柏林核心记录 | Dublin Core record | PASS |
| 84 | 都柏林核心呈现 | Dublin Core presentations | PASS |
| 85 | <strong>无都柏林核心记录。</strong>目录如实说明这一点，而不是从 PDF 合成元数据——这是 <code>iris-dspace</code> 技能的 R8 规则：<em>存在记录时，绝不从 PDF 推断元数据</em>；其反面是，缺失的记录仍保持缺失。 | <strong>No Dublin Core record.</strong> The catalogue states this truthfully, rather than synthesizing metadata from the PDF — this is rule R8 of the <code>iris-dspace</code> skill: <em>when a record exists, never infer metadata from the PDF</em>; its converse is that a missing record stays missing. | PASS |
| 86 | 机构信息共享知识库（IRIS）的首要目标是提供对世界卫生组织（世卫组织）科学和技术出版物的免费数字访问，包括其国家办事处、区域办事处和总部的成果。此外，IRIS 还涵盖本组织理事机构与其会员国合作确立的各项任务授权。 | The primary goal of the Institutional Information Sharing Repository (IRIS) is to provide free digital access to the scientific and technical publications of the World Health Organization (WHO), including the outputs of its country offices, regional offices and headquarters. In addition, IRIS also covers the mandates established by the Organization's governing bodies in cooperation with its Member States. | PASS |
| 87 | 副本。无世卫组织会徽，无照片——仅有颜色，取自根据该网站自身样式表测得的 {theme} 主题。 | Copy. No WHO emblem, no photo — only colour, taken from the {theme} theme measured from that website's own stylesheet. | PASS |
| 88 | 在存储库的 {n} 个条目中搜索 | Search among the repository's {n} items | PASS |
| 89 | 在存储库条目及引用节点的标识符查询中搜索 | Search in the repository items and the identifier lookup of referenced nodes | PASS |
| 90 | 搜索 | Search | PASS |
| 91 | 可搜索按值保存的 <strong>{held}</strong> 个条目以及被引用的社区和馆藏。如需按标识符查找 <strong>{referenced}</strong> 个被引用节点中的任何一个，请在此搜索或打开{lookup}。 | You can search the <strong>{held}</strong> items kept by value, and the referenced communities and collections. To find any one of the <strong>{referenced}</strong> referenced nodes by identifier, search here or open the {lookup}. | PASS |
| 92 | 标识符查询 | identifier lookup | PASS |
| 93 | 上游 IRIS 报告共有 <strong>{items}</strong> 个条目，分布于 <strong>{files}</strong> 个文件中。 | Upstream IRIS reports a total of <strong>{items}</strong> items, distributed across <strong>{files}</strong> files. | PASS |
| 94 | 最新提交 | Latest submissions | PASS |
| 95 | 按 {key} 排序，最新的在前——这是 IRIS 自身列表排序所用的键。如果一条记录有多个收录日期，则使用最新的一个；西太平洋区域办事处（WPRO）的条目有两个，相隔五天，第二个是并入区域 IRIS 的日期。 | Sorted by {key}, newest first — this is the key IRIS's own list uses to sort. If a record has several inclusion dates, the latest one is used; the Western Pacific Regional Office (WPRO) item has two, five days apart, the second being the date of merging into the regional IRIS. | PASS |
| 96 | 浏览 | Browse | PASS |
| 97 | {link}——{url} 的副本，标明每个节点的实体化状态（{communities} 个社区，{collections} 个馆藏） | {link} — a copy of {url}, marking the materialization state of each node ({communities} communities, {collections} collections) | PASS |
| 98 | {link}——馆藏 | {link} — collection | PASS |
| 99 | <strong>这里是入口页，不是图书馆可视化工具。</strong>完整的 <code>library/</code> 可视化工具是任务 <code>jbx2</code>，正在另行构建。本页面模仿 IRIS 首页并链接到其他页面，而不是成为同一问题的第二个答案。 | <strong>This is the entrance page, not the library visualization tool.</strong> The full <code>library/</code> visualization tool is task <code>jbx2</code>, being built separately. This page imitates the IRIS home page and links to other pages, rather than becoming a second answer to the same question. | PASS |
| 100 | 寻址遵循所有者的规则——<code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code>——因此，实例化某个目录的实例会获得一个挂载在该目录类型之下的可视化工具：<code>/library/who-iris/</code>、<code>/docs/who-iris/</code> 等。 | Addressing follows the owner's rule — <code>&lt;base-url&gt;/&lt;path-to-kind-or-node&gt;</code> — so an instance that instantiates a directory gets a visualization tool mounted under that directory's type: <code>/library/who-iris/</code>, <code>/docs/who-iris/</code>, etc. | PASS |
| 101 | 未记录作者 | Author not recorded | PASS |
| 102 | 出版日期：{date} | Publication date: {date} | PASS |
| 103 | 封面已生成并保存在此处，但未发布：{gates}。 | The cover has been generated and is kept here, but not published: {gates}. | PASS |
| 104 | 封面<br>未显示 | Cover<br>not displayed | PASS |
| 105 | 未生成封面 | Cover not generated | PASS |
| 106 | 无封面 | No cover | PASS |
| 107 | 《{title}》的封面，根据所保存 PDF 的第 1 页在此生成 | Cover of “{title}”, generated here from page 1 of the kept PDF | PASS |
| 108 | 《{title}》的封面，根据所保存 PDF 的第 1 页在此生成，世卫组织会徽已遮盖 | Cover of “{title}”, generated here from page 1 of the kept PDF, WHO emblem covered | PASS |
| 109 | 已为本条目生成并记录封面，但不予显示：该出版物的封面带有世卫组织会徽，而本副本并非以世卫组织名义发布。 | A cover has been generated and recorded for this item, but it is not displayed: the cover of this publication carries the WHO emblem, and this copy is not published in the name of WHO. | PASS |
| 110 | 采集的记录中没有 <code>dc.description.abstract</code>。 | The collected record has no <code>dc.description.abstract</code>. | PASS |
| 111 | 匹配的目录节点（{n}）： | Matching catalogue nodes ({n}): | PASS |
| 112 | 同时在标识符查询中搜索： | Also search in the identifier lookup: | PASS |
| 113 | 在被引用节点中查找“{q}” → | Look up “{q}” among referenced nodes → | PASS |
| 114 | 没有已实体化的条目或馆藏与“<strong>{q}</strong>”匹配。 | No materialized item or collection matches “<strong>{q}</strong>”. | PASS |
| 115 | 在被引用节点的标识符查询中搜索“{q}”（{n} 个节点）→ | Search for “{q}” in the identifier lookup of referenced nodes ({n} nodes) → | PASS |


## Status (2026-10-05)

- [x] UI strings in SITE_STRINGS (who-iris/scripts/gen-iris-pages.ts), extracted to translations/<lc>/site/iris-site.pot
- [x] .po for ar, es, fr, ru, zh — 116/116 each, 0 fuzzy, 0 empty
- [x] site/<lc>/ pages: lang, dir=rtl, hreflang, language row, fa-translation-meta
- [x] round-trip QA recorded above (self-check, not tool-isolated)
- [x] iris:pages:check covers the catalogues; translation-status counts every instance
- [ ] a person reviews the five catalogues (or an independent checker repeats the round trip) — then they can be signed off
- [ ] rendered check of one page per locale, Arabic in particular — no browser was available here

PR #2229 (draft), issue #2228.

## Independent round-trip check — 2026-10-06

Five fresh checkers, one per locale. Each read ONLY its 116 msgstr values, with the msgids stripped out, and back-translated them blind. Every report ends TOOLS_USED: read <lc>.only.txt, write <lc>.bt.txt; ar also records two edits to its own output lines. I compared all 580 back-translations against the English source.

**Result:** meaning is preserved in all but 4 strings, and every placeholder and HTML tag survived.

**Fixed (meaning drift):**
- zh [92] Recent Submissions — 最新提交 read back as *Latest commit*; now 最近提交的条目.
- zh [56] and [107], the IRIS expansion — 机构信息共享知识库 read back as *Institutional Information Shared Knowledge Base*; now 信息共享机构知识库, using 机构知识库, the standard term for institutional repository.
- fr [56] — Répertoire (directory) was inconsistent with dépôt everywhere else; now Dépôt institutionnel.

**Fixed (grammar):** fr [87] and [88] — URI permanent → URI permanente; URI is feminine in French.

**Kept, with reasons:**
- Bundle stays fr Paquet / ru Пакет, the DSpace interface terms in those languages.
- live → active/usable, and ingested → imported/archived in ru/zh: the meaning holds.
- [23] instance-that-instantiates is awkward in every locale because the English is.
- The [80]/[84] duplicates track near-identical English msgids.

**Still not verified:** WHO's own localised IRIS terminology, and visual rendering in a browser.
