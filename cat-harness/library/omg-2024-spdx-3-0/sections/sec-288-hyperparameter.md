---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-288-hyperparameter
section_title: "hyperparameter"
section_number: null
pages: 159-159
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Records a hyperparameter used to build the AI model contained in the AI package.
Description
Records a hyperparameter value.
Hyperparameters are settings defined before the training process that control the learning algorithm’s behavior. They differ from
model parameters, which are learned from the data during training. Developers typically set hyperparameters manually or through
a process of hyperparameter tuning (also known as trial and error).
Examples of hyperparameters include learning rate, batch size, and the number of layers in a neural network.
Metadata
https://spdx.org/rdf/3.0.1/terms/AI/hyperparameter
Name:
hyperparameter
Nature:
ObjectProperty
Range:
/Core/DictionaryEntry
Referenced
• /AI/AIPackage
15.2.8
