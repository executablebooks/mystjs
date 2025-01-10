---
title: Scientific PDFs
description: Export to over 400 journal templates from a MyST Markdown file, which uses LaTeX and can create print-ready, multi-column, professional PDF documents.
---

You can render your MyST documents as print-ready scientific papers, by converting to $\LaTeX$ and render to over 400 journal templates already available. Alternatively, you can also render your documents as Beamer presentations or as [Microsoft Word](./creating-word-documents.md) to share with other collaborators.

```{figure} ./images/pdf-exports.png
:label: fig-export-to-pdf
:width: 100%

Export to over 400 journal templates from a MyST Markdown file, which uses $\LaTeX$ and can create print-ready, multi-column, professional PDF documents.
```

(myst-documents-tutorial-card)=
:::{card} MyST Documents Quickstart Tutorial 📑
:link: ./quickstart-myst-documents.md
See the quickstart tutorial for getting started with exporting to Word documents, $\LaTeX$ and PDFs with various templates.
:::

## Exporting to PDF

To create a new `pdf` export type for your MyST document, in your document frontmatter, add an `exports` list:

(export-frontmatter-pdf)=

```{code-block} yaml
:filename: article.md
---
title: My PDF
exports:
  - format: pdf
    template: arxiv_two_column
    output: exports/my-document.pdf
---
```

To build the exports, use the `myst build` command, which will work with your project structure if it exists and create a document in the output path that you specify.

```bash
myst build my-document.md --pdf
```

Based on the `output` field in the export list in the [frontmatter](#export-frontmatter-pdf), the PDF and a log file will be written to `exports/my-document.pdf` and any associated log files. If the output file is a folder, the document name will be used with a `.pdf` or `.tex` extension, as appropriate. Any necessary auxiliary files (e.g. for example `*.png` or `*.bib`) will be added to the base folder (`exports/` above).

## Rendering PDFs with $\LaTeX$

```{danger}
:class: dropdown
# PDF exports require $\LaTeX$ or Typst to be installed

The default PDF renderer uses $\LaTeX$ to create PDFs, which means that to work locally you will need to [](#install-latex). A warning will occur if MyST cannot find a $\LaTeX$ environment, as well as forcing the build process and reporting any errors.

As an alternative, for faster PDF builds, you may use [Typst](#rendering-pdfs-with-typst) instead.
```

The rendering process for scientific PDFs uses $\LaTeX$ and makes use of the [`jtex`](xref:jtex) templating library, to convert to $\LaTeX$ the `myst-to-tex` packages is used. The libraries work together for sharing information about [frontmatter](./frontmatter.md) (e.g. title, keywords, authors, and affiliations).

```{mermaid}
flowchart LR
  A[Jupyter Notebook] --> C
  B[MyST Markdown] --> C
  C(mystmd) --> D{AST}
  D --> E[jtex] --> G[LaTeX]
  D --> F[myst-to-tex] --> G
  G --> H[PDF]
```

To include the $\LaTeX$ source code as well as the included images, change the `format` to:

`tex`
: create a folder containing the $\LaTeX$ source code, referenced images, citation files, and any class files required by the template.

`tex+pdf`
: create a folder containing all the same outputs as `tex` as well as run the build process for the `pdf`.

`pdf`
: Run the above processes in a temporary folder, and only copy in the PDF export and any log files if there are problems.

(install-latex)=

### Install $\LaTeX$

See the official documentation for installation instructions for $\LaTeX$ at:

- <https://www.latex-project.org/get/>

Ensure that you download a full distribution with appropriate libraries installed.

(install-tectonic)=

#### Tectonic as a lightweight alternative
As an alternative, you can also install [Tectonic](https://tectonic-typesetting.github.io/), "a modernized, complete, self-contained TeX/LaTeX engine, powered by XeTeX and TeXLive".<br>
> Tectonic automatically downloads support files so you don’t have to install a full LaTeX system in order to start using it. If you start using a new LaTeX package, Tectonic just pulls down the files it needs and continues processing.
>
> – [Tectonic Website](https://tectonic-typesetting.github.io/)

% Probably a note in the future about running this remotely?

(rendering-pdfs-with-typst)=

## Rendering PDFs with Typst

MyST also provides an option to build PDFs with [Typst](https://typst.app). Typst is a markup-based typesetting language. Compared to $\LaTeX$, syntax is streamlined and consistent, and compile time is significantly faster. To render Typst PDFs locally, you must install the [Typst CLI](https://github.com/typst/typst).

To add Typst to your export targets, add `format: typst` and select a Typst template. These templates use the same [MyST templating library](xref:jtex) as $\LaTeX$ templates to support document [frontmatter](./frontmatter.md).

```{code-block} yaml
:filename: article.md
---
title: My PDF
exports:
  - format: typst
    template: lapreprint-typst
    output: exports/my-document.pdf
---
```

## Choosing a Template

There are currently 422 journals supported[^journals] and it is straight forward to add new personal templates, or contribute them back to the community.

[^journals]: As of September 15, 2022.

    This is the total number of _journals_ that can be created from MyST, which is a higher number than the number of _templates_, as some templates support many different journal exports. As we add more templates we will probably switch this number to templates, which is closer to 15, but that doesn't sound as impressive out of the gate. 🚀

Templates exist for both $\LaTeX$ and Typst builds. To list all of the public templates, use the `myst templates` command:

```bash
myst templates list --pdf --tag two-column

> arXiv (Two Column)       arxiv_two_column
> Description: A two column arXiv compatible template
> Tags: paper, two-column, preprint, arxiv, bioarxiv, eartharxiv
>
> ...
```

Once you have found a template, you can list detailed information about the parts and options that the template exposes using:

```bash
myst templates list arxiv_two_column --tex

> ID: public/arxiv_two_column
> Version: 1.0.0
> Author: Brenhin Keller
> Description: A two column arXiv compatible template
> Tags: paper, two-column, preprint, arxiv, bioarxiv, eartharxiv
>
> Parts
> abstract (required) - Keep it short — abstracts longer than 1920 characters will not be accepted ...
>
> Options
> line_numbers (boolean) - Turn line numbers on in the PDF
```

There are two ways to provide information to a template, through `parts` and `options`.

## Template `parts`

The `parts` of a template are things like `abstract`, `acknowledgments` or `data_availability`, see [](./document-parts.md) for more information. These parts are usually written pieces of a document, but are placed specifically in a template. For example, an abstract usually has a place in templates, with a box or other typographic choices applied. These parts can be marked as `required`, and will raise error in the PDF export process, however, myst will always try to complete the build.

A `part` of a template can be defined using the [page frontmatter](#parts:frontmatter) or [metadata on a block](#parts:blocks). An example of using the frontmatter is:

```{code-block} yaml
:filename: article.md
---
abstract: |
  MyST (Markedly Structured Text) is designed to create publication-quality documents
  written entirely in Markdown. The markup and publishing build system is fantastic,
  MyST seamlessly exports to any PDF template, while collecting metadata to make your
  writing process as easy as possible.
---
```

### Template `options`

Template authors should choose to use [standard frontmatter](./frontmatter.md) properties where possible, however, all templates can also expose custom options through their [](xref:jtex#template-yml). Include options for the build in the exports list. For example, to turn on `line_numbers` in the template, add the option to the dictionary.

```{code-block} yaml
:linenos:
:emphasize-lines: 7
:filename: article.md
---
title: My PDF
exports:
  - format: pdf
    template: arxiv_two_column
    output: exports/my-document.pdf
    line_numbers: true
---
```

Any unrecognized, or malformed entries will be logged as errors as well as required options that are not provided.

## Creating a Template

The export list can also point to local templates, for $\LaTeX$ these are built using [`jtex`](/jtex), and you can learn more about how to create a template for: [any $\LaTeX$ document](/jtex/create-a-latex-template) and [Beamer presentations](/jtex/create-a-beamer-template).

To make use of the template locally, validate it using `jtex check` and then point to the template folder in your export:

```{code-block} yaml
:filename: article.md
:linenos:
:emphasize-lines: 5
:caption: The template can be a path to a `jtex` template, which contains a `template.yml` and `template.tex` as well as any other `cls` or `def` files.
---
title: My PDF
exports:
  - format: pdf
    template: ../templates/my-template
    output: exports/my-document.pdf
---
```

Please consider [contributing your template](/jtex/contribute-a-template) to the growing list of templates so that other people can benefit and improve your work!

## Excluding Content from Specific Exports

If you have a block or notebook cell that you do not want to render to your $\LaTeX$ output, add the `no-tex` tag to the cell. Similarly, to exclude a cell from Typst, use `no-typst`. To exclude a cell from both formats, use `no-pdf`.

## Including Content with Specific Exports

If you need to inject some $\LaTeX$- or Typst-specific content into their respective exports, you may use the `{raw:latex}` or `{raw:typst}` role and directive. For example, to insert a new page in Typst with two columns:

````markdown
```{raw:typst}
#set page(columns: 2, margin: (x: 1.5cm, y: 2cm),);
```
````

The content in these directives and roles will be included exactly as written in their respective exports, and will be ignored in all other contexts.

(multi-article-exports)=

## Multi-Article Exports

Sometimes you may want to combine multiple MyST documents into a single export, for example a thesis or a book. MyST makes this possible with multi-article exports for PDFs built with either $\LaTeX$ or Typst.

For perform a multi-article export, add multiple `articles` to the export frontmatter:

```{code-block} yaml
:filename: article.md
---
title: My PDF
exports:
  - format: pdf
    template: plain_latex_book
    output: exports/my-thesis.pdf
    articles:
      - introduction.md
      - project-one.md
      - project-two.md
      - conclusions.md
---
```

As an alternative to listing articles in MyST frontmatter, you may specify a table of contents using the [Jupyter Book V1 format](#toc-format):

```{code-block} yaml
:filename: article.md
---
title: My PDF
exports:
  - format: pdf
    template: plain_latex_book
    output: exports/my-thesis.pdf
    toc: thesis_toc.yml
---
```

By default if no `articles` are given, exports defined in page frontmatter will produce a single-article export from of that page, and exports defined in the `myst.yml` project configuration will produce a multi-article export based on the project structure.

## Custom Frontmatter for Exports

Export frontmatter may differ from page or project frontmatter. For example, you may with to give your export its own title, which does not match the project title. To do so, add the alternative frontmatter to your export:

```{code-block} yaml
:filename: article.md
---
title: My Interactive Research!
exports:
  - format: pdf
    title: My Static Research as a PDF
    output: exports/my-document.pdf
---
```

You may redefine [any frontmatter fields](./frontmatter.md). These redefined fields will replace the values found in page frontmatter and `myst.yml` project configuration.

Further, for [](#multi-article-exports), you may redefine frontmatter for every specific page. To do so, you must use a list of article objects (as opposed to a `_toc.yml` file or a list of article names):

```{code-block} yaml
:filename: article.md
---
title: My PDF
exports:
  - format: pdf
    title: My Thesis
    date: 10 May 2023
    template: plain_latex_book
    output: exports/my-thesis.pdf
    articles:
      - file: introduction.md
        title: Introduction to This Thesis
      - file: project-one.md
      - file: project-two.md
      - file: conclusions.md
        title: Summary of this Thesis
---
```
