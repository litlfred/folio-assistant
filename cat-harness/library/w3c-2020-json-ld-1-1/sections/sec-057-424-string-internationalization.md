---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-057-424-string-internationalization
section_title: "String Internationalization"
section_number: 4.2.4
pages: 37-40
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 68: Setting the default language of a JSON-LD document
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "name": "http://example.org/name",
    "occupation": "http://example.org/occupation",
    ...
    "@language": "ja"
  },
  "name": "花澄",
  "occupation": "科学者"
}
Example 69: Clearing default language
{
  "@context": {
    ...
    "@version": 1.1,
    "@vocab": "http://example.com/",
    "@language": "ja",
    "details": {
      "@context": {
        "@language": null
      }
    }
  },
  "name": "花澄",
  "details": {"occupation": "Ninja"}
}
Example 70: Expanded term definition with language
{
  "@context": {
    ...
    "ex": "http://example.com/vocab/",
    "@language": "ja",
    "name": { "@id": "ex:name", "@language": null },
    "occupation": { "@id": "ex:occupation" },
    "occupation_en": { "@id": "ex:occupation", "@language": "en" },
    "occupation_cs": { "@id": "ex:occupation", "@language": "cs" }
  },
  "name": "Yagyū Muneyoshi",
  "occupation": "忍者",
  "occupation_en": "Ninja",
  "occupation_cs": "Nindža",
The example above would associate 忍者 with the specified default language tag ja, Ninja with the language tag en, and Nindža with the language
tag cs. The value of name, Yagyū Muneyoshi wouldn't be associated with any language tag since @language was reset to null in the expanded term
definition.
Note
Language associations are only applied to plain strings. Typed values or values that are subject to type coercion are not language tagged.
Just as in the example above, systems often need to express the value of a property in multiple languages. Typically, such systems also try to ensure
that developers have a programmatically easy way to navigate the data structures for the language-specific data. In this case, language maps may be
utilized.
The example above expresses exactly the same information as the previous example but consolidates all values in a single property. To access the
value in a specific language in a programming language supporting dot-notation accessors for object properties, a developer may use the
property.language pattern (when languages are limited to the primary language sub-tag, and do not depend on other sub-tags, such as "en-us").
For example, to access the occupation in English, a developer would use the following code snippet: obj.occupation.en.
Third, it is possible to override the default language by using a value object:
This makes it possible to specify a plain string by omitting the @language tag or setting it to null when expressing it using a value object:
See § 9.8 Language Maps for a description of using language maps to set the language of mapped values.
  ...
}
Example 71: Language map expressing a property in three languages
{
  "@context": {
    ...
    "occupation": { "@id": "ex:occupation", "@container": "@language" }
  },
  "name": "Yagyū Muneyoshi",
  "occupation": {
    "ja": "忍者",
    "en": "Ninja",
    "cs": "Nindža"
  }
  ...
}
Example 72: Overriding default language using an expanded value
{
  "@context": {
    ...
    "@language": "ja"
  },
  "name": "花澄",
  "occupation": {
    "@value": "Scientist",
    "@language": "en"
  }
}
Example 73: Removing language information using an expanded value
{
  "@context": {
    ...
    "@language": "ja"
  },
  "name": {
    "@value": "Frank"
  },
  "occupation": {
    "@value": "Ninja",
    "@language": "en"
  },
  "speciality": "手裏剣"
}
This section is non-normative.
It is also possible to annotate a string, or language-tagged string, with its base direction. As with language, it is possible to define a default base
direction for a JSON-LD document by setting the @direction key in the context:
The example above would associate the ar-EG language tag and "rtl" base direction with the two strings الويب مواقع إنشاء و تصميم :CSS و HTML
and مكتبة. The default base direction applies to all string values that are not type coerced.
To clear the default base direction for a subtree, @direction can be set to null in an intervening context, such as a scoped context as follows:
Second, it is possible to associate a base direction with a specific term using an expanded term definition:
The example above would create three properties:
Subject
Property
Value
Language
Direction
_:b0
http://example.com/vocab/publisherمكتبةar-EG
_:b0
http://example.com/vocab/titleالويب مواقع إنشاء و تصميم :CSS و HTML ar-EG
rtl
_:b0
http://example.com/vocab/title
HTML and CSS: Design and Build Websites
en
ltr
4.2.4.1 Base Direction §
Input
Example 74: Setting the default base direction of a JSON-LD document
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle (drops direction) 
Turtle (with datatype) 
Turtle (with bnode structure) Open in playground
{
  "@context": {
    "title": "http://example.org/title",
    "publisher": "http://example.org/publisher",
    ...
    "@language": "ar-EG",
    "@direction": "rtl"
  },
  "title": "HTML و CSS: تصميم و إنشاء مواقع الويب",
  "publisher": "مكتبة"
}
Example 75: Clearing default base direction
{
  "@context": {
    ...
    "@version": 1.1,
    "@vocab": "http://example.com/",
    "@language": "ar-EG",
    "@direction": "rtl",
    "details": {
      "@context": {
        "@direction": null
      }
    }
  },
  "title": "HTML و CSS: تصميم و إنشاء مواقع الويب",
  "details": {"genre": "Technical Publication"}
}
Example 76: Expanded term definition with language and direction
{
  "@context": {
    ...
    "@version": 1.1,
    "@language": "ar-EG",
    "@direction": "rtl",
    "ex": "http://example.com/vocab/",
    "publisher": { "@id": "ex:publisher", "@direction": null },
    "title": { "@id": "ex:title" },
    "title_en": { "@id": "ex:title", "@language": "en", "@direction": "ltr" }
  },
  "publisher": "مكتبة",
  "title": "HTML و CSS: تصميم و إنشاء مواقع الويب",
  "title_en": "HTML and CSS: Design and Build Websites",
  ...
}
