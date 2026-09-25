---
layout: default
title: "تأهيل الوكيل (AR)"
parent: Authoring guides
lang: ar
# `lang` above is what makes this a translation -- nothing reads `fr` out of
# the path. `nav_exclude` keeps it out of the statically built nav, and
# `mountNavLocale` (docs/assets/js/docs-ui.js) puts it back in place of its
# source when this locale is selected. There is no `nav_order`: it stands
# where its source stands. skills/folio-core/translation-manager.md
nav_exclude: true
dir: rtl
translation_status: unverified
translation_source: guides/agent-onboarding.md
available_locales: ["ar", "zh", "en", "fr", "ru", "es"]
---

# تأهيل الوكيل
{: .no_toc }

أنت وكيل نموذج لغوي كبير (LLM) تم إدخالك للتو إلى مستودع يستخدم
folio-assistant. هذه الصفحة هي دليلك التوجيهي: ما الذي تنظر إليه،
وما يجب فعله أولاً، وأين تبحث عن المعلومات.

من أجل *بنية* المهارات والأدوار والقدرات، راجع
[المهارات والأدوار](../skills.html). هذه الصفحة هي النسخة العملية.

1. TOC
{:toc}

---

## 1. حدد المستودع الذي تعمل فيه

هناك نوعان، والخلط بينهما هو الخطأ الأكثر شيوعًا في البداية.

| | **folio-assistant** (المنصة) | **ملف المحتوى (A folio)** (مستودع المحتوى) |
|---|---|---|
| يحتوي على | المهارات، المخططات، خط المعالجة (pipeline)، خادم MCP | الورقة البحثية / الدليل الإرشادي / دليل التطبيق (IG) الفعلي |
| يحتوي على `content/<paper>/` | لا — فقط `content/pipeline/` | نعم |
| تعدل هنا من أجل | تغيير كيفية عمل التأليف | تغيير ما يتم تأليفه |

```sh
ls content/          # pipeline/ only  ⇒ platform;  paper dirs ⇒ folio
```

**لا يحتوي folio-assistant على أي محتوى.** إذا وجدت نفسك على وشك
كتابة موضوع في صلب المادة داخله — فصلاً، أو ثابتاً، أو قائمة كلمات رئيسية
لفصل — فأنت في المستودع الخطأ، أو أن ما تكتبه يجب أن يكون بيانات يقدمها
الـ folio. راجع §7.

## 2. الدقائق الخمس الأولى لك

```sh
beans prime && beans list      # the work-plan — see §6
scripts/session-start-coord-sweep.sh   # CLI-independent equivalent
bun run src/index.ts --check-deps      # what this environment can do
```

الخيار `--check-deps` أكثر أهمية مما يبدو عليه. إذ تتحول العديد من الفحوصات
إلى `n/a` بدلاً من الفشل عند غياب أداة معينة (عدم وجود سلسلة أدوات Lean، أو
عدم وجود Atlas، أو غياب LaTeX). **إن نتيجة `n/a` لا تعني النجاح.** إذا أبلغت بأن
"كل شيء نظيف" دون معرفة ما تم تخطيه، فأنت تبلغ عن غياب البيانات كنتيجة.

## 3. ابحث عن المهارة المناسبة — لا ترتجل

المهارات هي وحدة العمل هنا. قبل أن تبني إجراءً يدويًا، تحقق مما إذا
كان هناك إجراء موجود بالفعل.

| الموقع | ما يقدمه لك |
|---|---|
| `skills/folio-core/` | مهارات غير مرتبطة بمحتوى معين: التنسيق، المراقبون (watchers)، ضمان الجودة (QA)، التصيير، المراجع |
| `skills/folio-paper-adapter/` | الأوراق البحثية: Lean، وLaTeX، والبراهين، والمحاكيات |
| `skills/authoring-who-smart-guidelines/` | حزم DAK / أدلة IG لإرشادات منظمة الصحة العالمية SMART |
| [مرجع مخطط المهارات](../reference/skills/) | عقد الإدخال/الإخراج المصنف للأنواع والمولّد آليًا لكل مهارة |
| [تعليمات المهارات](../reference/skill-instructions/) | نصوص التعليمات الكاملة المولّدة آليًا |
| [المهارات والأدوار](../skills.html) | كيفية تكوين المهارات والأدوار والقدرات معًا |

كلا الدليلين في `reference/` **مولّدان آليًا** — إياك وتعديلهما يدويًا.
أعد التوليد باستخدام `bun run scripts/gen-schema-docs.ts` و
`bun run scripts/gen-skill-docs.ts`.

## 4. نموذج كائن المحتوى باختصار

كتلة المحتوى (content block) هي **ثلاثية** تشترك في اسم جذر واحد:

```
<block>.ts     manifest — label, kind, uses[], lean.ref, cites[]
<block>.md     the narrative a reader actually reads
<block>.lean   the formalisation (when the kind requires one)
<block>.qa.json  QA sidecar — audit results, per criterion
```

بيان `.ts` هو مصدر الحقيقة للبنية. أما *حالة* الصياغة الرسمية فتُشتق
أثناء وقت البناء، ولا تُخزَّن أبدًا في البيان.

## 5. علاقتان من علاقات التبعية — لا تخلط بينهما

هذا الأمر يُربك الوكلاء باستمرار.

- **`uses[]` هي علاقة تحريرية.** "ما الذي يجب أن يكون القارئ قد قرأه
  ليتابع هذه الكتلة؟" مؤلفة — يتولى صيانتها الوكيل/الإنسان.
- **المخطط الشكلي (formal graph) مُشتق آليًا** من `lean.ref`، ولا
  يُكتب يدويًا أبدًا.

وهما يتباينان بصورة مبررة في كلا الاتجاهين: فقد يستدعي برهان ما توطئات
`simp` لا يحتاج أي شخص للقراءة عنها؛ وقد يكون الدافع وراء مبرهنة ما
مثالاً لا تستشهد به المبرهنة شكليًا على الإطلاق.

**لا تملأ `uses[]` أبدًا من Lean.** فهذا يدمر الإشارة التي يُحسب
منها كل مقياس للترتيب. وللإجابة عن أسئلة الأثر ("ما الذي سينكسر إذا
تغير هذا؟")، خذ الاتحاد (union):

```sh
bun run content/pipeline/content-graph.ts content/<paper>
```

تدقيق ما إذا كانت `uses[]` مستخدمة بشكل جيد هو مهارة قائمة بذاتها:
`uses-editorial-review`، بالإضافة إلى محور QA الميكانيكي `uses`.

## 6. تتبع العمل في beans، وليس في رأسك

إن `beans` هي آلية المهام (todo) **الوحيدة** — محلية للجلسة *وعبر*
الوكلاء. دليل `beans/` يتم تثبيته في المستودع (committed)، لذا فإن
الخطة تبقى وتستمر عند الاستئناف في حاوية جديدة.

```sh
beans list
beans create "<title>"
beans update <id> --status in-progress    # CLAIM before you work
```

احجز المهمة (claim) قبل البدء بالعمل حتى لا تلتقط جلستان العنصر نفسه،
ولا تقم أبدًا بحل أو حذف مهمة تخص وكيلاً زميلاً. لا تنشئ مخزن مهام
موازيًا. ولا تستخدم `beans create` لإنشاء طوابير ضخمة مولدة آليًا
(`*.qa.json`، ملفات الشواهد) — فهذه تبقى بصيغة JSON مجمعة.

القواعد الكاملة: `skills/folio-core/todo-manager.md`، و
`skills/folio-core/bean-coordination.md`.

## 7. ملفات QA الجانبية والمحاور

يمكن لكل كتلة أن تحمل `<block>.qa.json` يسجل، لكل معيار، ما توصل إليه
كل مراجع — `script`، أو `agent`، أو `human`. وتحمل السجلات تجزئات ملف
المصدر في وقت التدقيق، لذا يصبح السجل **قديماً (stale)** عند تعديل
الكتلة ويجب إعادة البت فيه.

تُجمّع المعايير في **محاور (axes)** مثل (`proof`، و`voice`، و`detangler`،
و`uses`، و`canonical`، و`compute`، و`bibliography`، …). قم بتشغيل أحدها:

```sh
bun run content/pipeline/qa-sweep.ts --axis uses content/<paper>
bun run content/pipeline/qa-staleness.ts content/<paper>
```

بعض المعايير تكون `automated: true` (يحسمها نص برمجي) وبعضها الآخر
`automated: false` (يجب على وكيل أو إنسان البت فيها). والنوع الثاني يكلف
أدوار عمل حقيقية — انظر `semantic-cone.ts` لحصر نطاقها وفق ما يمكنها
التأثير عليه فعليًا.

**محاور folio الاختيارية.** لا يتم تسجيل محور يرمز لموضوع folio معين
إلا عندما يختار الـ folio الاشتراك فيه صراحة:

```json
// <name>.config.json
{ "qaAxes": ["q-usage"] }
```

وبالمثل، فإن *البيانات* الخاصة بـ folio تنتمي إلى الـ folio، وليس إلى
المنصة — على سبيل المثال: `content/<paper>/topic-keywords.json` يوجّه
`detangler-topic-coherence`، وفي حال غيابه يُبلغ الفاحص عن `n/a`.

## 8. شحن العمل

```sh
/prepare-merge [base]
```

يقوم هذا الأمر بتشغيل الوصفة العامة بالإضافة إلى بوابات الفحص الخاصة
بنوع المحتوى (للأوراق البحثية → content_validate / qa_sweep / proof_status / latex_preflight /
lean_build)، ثم يدفع التغييرات. **إنه لا يقوم بالدمج.**

لمراقبة طلب سحب (PR) زميل: `/watch <pr|branch>`.

## 9. أين تبحث عن المعلومات

| السؤال | الإجابة |
|---|---|
| أوامر المشروع واتفاقياته | `AGENTS.md` (مصدر الحقيقة العام للوكيل) |
| ما تفعله مهارة معينة | `skills/**/`، أو [نصوص التعليمات](../reference/skill-instructions/) المولّدة آليًا |
| العقد المصنف للأنواع للمهارة | [مرجع مخطط المهارات](../reference/skills/) |
| ما يعنيه معيار ضمان الجودة (QA) | `content/pipeline/qa-criteria-registry.ts` — الأوصاف هي المواصفة القياسية |
| مخطط الكتلة (block schema) | `schemas/types.ts` |
| مخطط ملف QA الجانبي | `schemas/block-qa.ts` |
| ما يمكن لهذه البيئة فعله | `.claude/skills/capabilities/*.json`، و`--check-deps` |
| خطة طريق أدوات Lean | [مقترح أدوات Lean](../proposals/llm-authoring-tool-integration.html) |

## 10. عادات تبعدك عن المشاكل

- **`n/a` لا تعني النجاح.** اذكر ما تم تخطيه ولماذا.
- **احجز الـ bean قبل البدء بعمل دائم.** قد تكون هناك مهام أخرى قيد التشغيل.
- **لا تضع اسم الورقة البحثية بشكل ثابت (hardcode).** قد يحتوي الـ folio على عدة أوراق؛ قم بحل الاسم
  باستخدام `findPapers()` / `soleFolioPaper()` من
  `content/pipeline/repo-root.ts`.
- **لا تكتب محتوى داخل المنصة.** إذا كان يحدد فصلاً، أو
  ثابتًا، أو مفردات، فهو من بيانات الـ folio.
- **أعد التوليد ولا تعدل يدويًا أبدًا** أي شيء تحت `docs/reference/`.
- **اقرأ وصف المعيار قبل التصرف بناءً على نتيجة الفحص.** فالأوصاف
  توضح مستوى الخطورة، والقصد، وما هو مستبعد صراحةً.
