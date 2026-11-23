---
doc_id: c2pa-2026-specification-2-5
doc_title: "Content Credentials : C2PA Technical Specification, version 2.5"
section_id: s517-16-9-1-10-2-localization-dictionary
section_title: "16.9.1.10.2. Localization Dictionary"
file: "build/site/specifications/2.5/specs/C2PA_Specification.html.md"
lines: 10225-10276
source_sha256: ff401df19d1fde8c
granularity: heading
---
###### 16.9.1.10.2. Localization Dictionary

A localization dictionary shall consist of a single object, where each of its keys represents the translations using the language indexing technique from [JSON-LD](https://www.w3.org/TR/json-ld/#language-indexing). If the value that requires translation is not associated with a top-level key, then "dot notation" (`.`) shall be used to reference keys nested in objects. Array indexing notation (`[n]`, `n>=0`) shall be used where a specific element in an array needs to be traversed. When the value requiring translation is itself an array, a specific element may be referenced. Some examples are shown in [Example 17, “Examples of Localization Dictionaries”](#localization-dictionary-examples):

Example 17. Examples of Localization Dictionaries

```json
{
  "dc:title": {
    "en-US": "Kevin's Five Cats",
    "en-GB": "Lord Kevin's Five Cats",
    "es-MX": "Los Cinco Gatos de Kevin",
    "es-ES": "Los Thinco Gatos de Kevin",
    "fr": "Les Cinq Chats de Kevin",
    "ja": "ケヴィンの５匹の猫"
  }
}
```

```json
{
  "actions[0].softwareAgent": {
    "en-US": "Joe's Photo Editor",
    "en-GB": "Joe's Photo Editor",
    "es": "Editor de fotos de Joe",
    "fr": "L'éditeur de photos de Joe",
    "ja": "ジョーの写真編集者"
  }
}
```

Any such 3rd party keys or values are required to be namespaced in the same way as [Section 8.2.1, “Namespacing”](#_namespacing), e.g. `com.litware`. In order for a Manifest Consumer to display human-readable information about these keys and values, the claim generator should provide the strings via this localization approach.

[Localized Actions](#localized-actions) shows its use in localizing custom [actions](#_actions), by using it in the assertion metadata of a `c2pa.actions` assertion.

Localized Actions

```json
{
  "com.litware.blur": {
    "en-US": "Blur",
    "fr-FR": "Brouiller",
  },
  "com.litware.filter": {
    "en-US": "Filter",
    "es-ES": "Filtrar",
    "ja-JP": "フィルター"
  }
}
```

<a id="_regions_of_interest"></a>
