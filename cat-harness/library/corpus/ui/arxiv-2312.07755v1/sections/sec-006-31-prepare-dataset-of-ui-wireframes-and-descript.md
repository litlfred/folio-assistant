---
doc_id: arxiv-2312.07755v1
doc_title: "Designing with Language: Wireframing UI Design Intent with Generative Large"
section_id: sec-006-31-prepare-dataset-of-ui-wireframes-and-descript
section_title: "Prepare Dataset of UI Wireframes and Descriptions"
section_number: 3.1
pages: 5-8
source_pdf: feng-2023-designing-with-language.pdf
source_sha256: 663850eb153e604d
toc_source: outline
---
3.1.1
Mid-fidelity Wireframes and Descriptions. While there are many low-fidelity wireframe datasets available [15,
25, 51, 68, 69], none of the prior work studies on mid-fidelity wireframes. This is because mid-fidelity wireframes go
beyond the shape, placeholders, and “lorem ipsum” text of low-fidelity wireframes to include real content, semantic
icons, interactive elements, etc. However, manual labeling of wireframes can be prohibitively expensive. To that end,
5
Feng et al.
we propose a novel approach to automatically collect a set of representations of mid-fidelity wireframes. As shown in
Fig. 2, mid-fidelity wireframes are typically a simplified and monochromatic representation of the final UI. With this in
mind, we propose to gather representations of mid-fidelity wireframes from existing UI screen datasets.
We utilize one of the largest open-sourced UI datasets, Rico [25]. The Rico dataset contains 66k unique UI screens
from more than 9.7k Android apps across 27 diverse app categories. The dataset provides a screenshot image and a
view hierarchy of UI objects. Each object has a set of properties, including its resource id, type (e.g., Button, Image, Text,
etc.), bounding box location on the screen, textual content (if any), and various other properties such as clickability,
scrollability, etc. These screens can serve as our mid-fidelity wireframes.
To gather the descriptions of these screens, we utilize a comprehensive screen summarization dataset Screen2Words [75],
that captures the complex information of UIs into concise language descriptions. The summarization is done by 85
professional labelers through a rigorous labeling process and guidelines, resulting in high consistency in both linguistic
coherence and on-screen focus area among the labelers. As a result, we construct a dataset of pairs of UI screens and
their corresponding textual descriptions.
3.1.2
UI-specific Language. One challenge with using LLMs is that they can only process text input1, while UI screens
are multimodal, containing text, semantic icons, structural information, etc. To help LLMs inherently understand UI
screens, we aim to convert the UI screens into domain-specific language that LLMs can understand, which is known as
prompt engineering [66]. A well-designed prompt helps the LLMs elicit specific knowledge and abstractions needed
to complete the task. Since the training samples of LLMs are typically scraped from the raw web page data, e.g., GPT
was trained on 410 billion tokens from the Common Crawl web corpus, we use HTML syntax as the domain-specific
language to convert the UI screens into text. The closer the prompt is semantically similar to the LLMs’ training samples,
the better the inference will be.
To translate the UI screen with view hierarchy into HTML syntax, we need to preserve the properties and structural
relationship of UI elements. While the view hierarchy resembles a DOM tree in HTML, e.g., it starts with a root view and
contains UI elements descending in the tree, there are two fundamental limitations. First, the native classes in the view
hierarchy don’t always match HTML tags, for instance, a <RadioButton> in the hierarchy corresponds to a combination
of <input type="radio"> and <label>. Second, including all properties of UI elements will result in excessively long HTML
text that may exceed the maximum input token length of LLMs.
Therefore, we adopt a similar approach to previous work [28, 74] to convert the view hierarchy of the UI screen into
HTML syntax with similar functionality. An example is shown in Fig. 4. In detail, we first adopt a depth-first search
traversal algorithm to iterate through each node starting from the root of the view hierarchy. During the iteration, we
convert each node into HTML code and style sheet, based on a selected subset of properties from the view hierarchy.
• resource_id: describes the unique resource id of the element, depicting the referenced resource.
• class: describes the native UI element type such as TextView and Button.
• text: describes the text of the element (if any).
• content_desc: conveys the content descriptions of the visual element such as ImageView and VideoView.
• bounds: describes the positional information of the element such as top, left, width, and height.
We develop a heuristic approach based on Table 1 to match the classes in the view hierarchy to HTML tags with
equivalent functions. For instance, the <TextView> is mapped to the <p> tag; buttons are mapped to the <button> tag;
1Since OpenAI did not release its multimodal API (GPT-4) before submission, it was difficult for us to measure the capability of LLMs for UI screen
understanding of complex structures, semantic icons, etc.
6
Wireframing UI Design Intent with Generative Large Language Models
Fig. 4. Example of converting the UI screen to HTML code and style sheet.
Table 1. The class conversion between view hierarchy and HTML syntax.
CLASS
FUNCTIONALITY
HTML CODE
TextView
display text content
<p class=𝑖𝑑> 𝑡𝑒𝑥𝑡</p>
Button,
ToggleButton
click to new events
<button class=𝑖𝑑> 𝑡𝑒𝑥𝑡</button>
ImageView,
ImageButton
display image
<img class=𝑖𝑑alt=𝑐𝑜𝑛𝑡𝑒𝑛𝑡/>
EditText
input text
<input class=𝑖𝑑placeholder=𝑡𝑒𝑥𝑡type=“text”>
CheckBox, Switch
(de)select an option
<input class=𝑖𝑑type=“checkbox”>
<label for=𝑖𝑑> 𝑡𝑒𝑥𝑡</label>
RadioButton
choose only one option
<input class=𝑖𝑑type=“radio”>
<label for=𝑖𝑑> 𝑡𝑒𝑥𝑡</label>
DatePicker
select a date
<input class=𝑖𝑑type=“date” value=𝑡𝑒𝑥𝑡>
Spinner
select an option from drop-
down menu
<select class=𝑖𝑑type=“radio”> </select>
<label for=𝑖𝑑> 𝑡𝑒𝑥𝑡</label>
VideoView
display video
<video class=𝑖𝑑alt=𝑐𝑜𝑛𝑡𝑒𝑛𝑡> </video>
Other
less commonly-used classes
<div class=𝑖𝑑> </div>
and image elements to the <img> tag. Unlike the classes in the view hierarchy, HTML uses the combination of <input>
and <label> for input-related elements (e.g., <EditText>, <CheckBox>, <RadioButton>, etc.). The <input> represents the
specific class and <label> represents the text property. Note that we focus on the most commonly-used classes for
simplicity, and the rest of the classes, including containers such as <LinearLayout>, are mapped to the <div> tag.
Next, we insert properties into the HTML code following standard syntax. For instance, the unique identifier class
for the objects in the HTML code is set using the resource_id. Text properties are placed between the opening and
closing HTML tags. Since the <EditText> usually depicts text in the placeholder, we replace it accordingly in Table 1. For
image-related objects, the alt-text is conveyed using the content_desc property.
To describe the style and layout of the UI, we generate a style sheet in addition to the HTML code. To precisely
generate the layout, we use the bounds property in the view hierarchy to encode the absolute position of each atomic
element, including the top, left, width, and height. An example of style sheet is shown in Fig. 4. We avoid using relative
7
Feng et al.
positioning, such as inline or margin, as it could limit the scope of adjacent elements [1]. Note that we also add the
overall width and height of the UI screen in the style sheet.
3.2
