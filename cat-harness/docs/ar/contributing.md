---
layout: default
title: المساهمة
lang: ar
nav_exclude: true
translation_status: unverified
translation_source: contributing.md
available_locales: ["ar", "zh", "en", "fr", "ru", "es"]
---

# المساهمة
{: .no_toc }

1. TOC
{:toc}

---

## إعداد التطوير

```sh
git clone https://github.com/litlfred/folio-assistant.git
cd folio-assistant
bun install
bun test          # اختبارات الوحدة
bun run lint      # eslint
bunx playwright test   # e2e (test:e2e)
```

## خطة العمل باستخدام `beans`

يستخدم هذا المشروع [`beans`](https://github.com/hmans/beans) بوصفه الآلية الوحيدة
لقوائم المهام وخطة العمل (راجع `AGENTS.md`). **لا** تُنشئ مخزن مهام منفصلًا.

```sh
scripts/install-beans.sh
beans list
beans create "<العنوان>"
beans <id> --status in-progress   # احجزه قبل أن تبدأ العمل
```

`beans ≠ sidecars`: لا تستخدم `beans create` مطلقًا لطوابير المهام المجمعة المولدة آليًا (QA وwitness وwatcher) — فتلك تظل كملفات JSON مجمعة.

## إرشادات الوكلاء

يُعدّ `AGENTS.md` هو المصدر الموثوق العام للوكلاء (تتم قراءته تلقائيًا بواسطة Claude Code
وGemini CLI وAntigravity وCursor وCopilot). أما `CLAUDE.md` و`GEMINI.md` فهما مجرد ملفات
نائبة مقتضبة تشير إليه. احرص على تحديث `AGENTS.md` بدلاً من الملفات المخصصة لأداة بعينها
عند تغيير إرشادات الوكلاء.

## التوثيق

- توجد المستندات النثرية في `docs/` (موقع Jekyll هذا).
- **مرجع مخططات المهارات** مُولَّد آليًا — إياك وتعديل
  `docs/reference/skills/*.md` يدويًا. عدّل مخططات JSON Schemas الموجودة تحت
  `schemas/skills/<skill>/` ثم أعد التوليد:

  ```sh
  bun run scripts/gen-schema-docs.ts
  ```

- **تعليمات المهارات** (`docs/reference/skill-instructions/*.md`) مُولَّدة
  آليًا أيضًا — إياك وتعديلها يدويًا. عدّل نصوص المهارات تحت
  `skills/content-lifecycle/*.md` أو `src/skills/*.md` ثم أعد التوليد:

  ```sh
  bun run scripts/gen-skill-docs.ts
  ```

- يُولَّد **مرجع واجهة برمجة تطبيقات TypeScript** (`/api/`) بواسطة TypeDoc في CI.
- يتم بناء الموقع ونشره على صفحات GitHub (GitHub Pages) بواسطة
  `.github/workflows/docs-site.yml` عند كل دفع (push) إلى `main` يمس التوثيق أو
  المخططات أو الشفرة المصدرية.

المعاينة محليًا:

```sh
cd docs
bundle install
bundle exec jekyll serve
```

## شحن التغيير

تحقق ← تأكد من قابلية الدمج ← ادفع (push) ← (فقط إذا طُلب منك) افتح طلب سحب (PR). راجع
`skills/folio-core/prepare-merge.md`. حافظ على **فصل الصياغة الرسمية لإطار العمل
عن المحتوى** — فالمحتوى ينتمي إلى مستودعه الخاص، وأي محتوى
في هذه المستندات هو توضيحي فقط.
