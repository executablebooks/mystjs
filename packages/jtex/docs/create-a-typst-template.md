---
title: Create a Typst Template
description: jtex templates have a template.yml, template.typ, and any other images, class or definition files required for the template to render.
thumbnail: ./thumbnails/create-a-typst-template.png
---

A `jtex` template contains everything necessary to create a $\LaTeX$ document, including a `template.yml`, the main `template.typ`, and any associated files such as classes (`*.cls`), definitions (`*.def`), or images (`*.png`).
These $\LaTeX$ templates are data-driven, in that they record all of the options in a `template.yml` which you create as you are working through moving your $\LaTeX$ document to a `jtex` template.

````{note} See the video tutorial 📺
:class: dropdown
```{iframe} https://www.youtube.com/embed/-oD6jlM23wY
:width: 100%
```
````

To get started you will need to install `jtex` and, for convenience, [cookiecutter](https://github.com/cookiecutter/cookiecutter) which allows you to get up and started in a new repository fast!

```bash
pixi global install copier
```

Once installed, you can clone the [Typst template repository](https://github.com/roaldarbol/typst-template), and go through the interactive questions on the CLI prompt.

```bash
copier gh:roaldarbol/typst-template
```

This process will create a template folder laid out as:

```text
my_template
├── .github
├── README.md
├── template.yml
├── template.typ
├── [logo.png]
├── thumbnail.png
└── example
    ├── main.typ
    ├── ...
    └── sample.bib
```

## Copy your template

The first thing to do is to copy in your template into an `original` folder.
This is helpful to check in on as you transform it to a data-driven template.
If you need example data to create a default PDF, then store it in an `example` folder.

🛠 Create an `original` folder, copy in your source files.

To see the contents and structure of `template.yml`, see [](./template-yml.md), which defines a number of parameters and options that are available when rendering your template. The structure of the document model has standard properties, like `title`, as well as custom `template.yml` defined properties. These properties are defined in [](./document.md).

## template.typ

The main file in your template will be `template.typ`, which should be the full journal article or index of your book.
Take a look at the defaults in the included file, it includes `[-IMPORTS-]` and `[-CONTENT-]` as well as options that turn on/off elements of the source code, for example:

```latex
[# if options.draft #]
Some source code
[# endif #]
```

🛠 Copy in the contents of your $\LaTeX$ document

You will also need any other files necessary to render your template:

🛠 Copy in any other style, definitions or images necessary for the template (e.g. `*.cls`, `*.bst`, `*.def`, `*.png`)

After you have copied these, add to the `files:` entry in your `template.yml` (see [](#template-files) for details).

🛠 Add the files necessary into `files` list in the `template.yml`

## Template-ify your `template.typ`

The next thing that we will do is start to change our `template.typ` into an actual template! There are a few parts of data that are available when you render the template (see [](#template-variables)).

These objects include:

`[-IMPORTS-]` and `[-CONTENT-]`
: The main parts of your template for imports at the top, and the main content of your document

`doc` object
: Holds structured frontmatter information, for example `[-doc.title-]`
: See [](#document-properties)

`options` object
: Holds custom data defined by this template, for example `[-options.my_custom_opt-]`

`parts` object
: Holds custom "parts" of the document like an abstract, for example `[-parts.abstract-]`
: See [](#template-parts)

### Start with the title & abstract

Your $\LaTeX$ document probably has a title like `\title{Some title}`. Change this to:

```latex
\title{[-doc.title-]}
```

The structure of the template variables is a customized Jinja environment that allows you to put variables
starting with `[-` and ending with `-]`. See [](./template-rules.md) for more information.

Your template might also have an **abstract** in it, if so we will define this as a "part" or our document.

```latex
[# if parts.abstract #]
\begin{abstract}
[-parts.abstract-]
\end{abstract}
[# endif #]
```

Here we are introducing conditional syntax for the template, that starts with `[#` and ends with `#]`.

### Add to the `template.yml`

The above template properties that we added also need to be added to the `template.yml`. The command line tools will tell us where we need to add information:

```bash
jtex check
```

This will tell you that certain fields were found but not defined in your `template.yml`:

```text
template.typ
  [parts] The template.yml does not include part "abstract" but it is referenced in template.typ on line 18
  [doc] The template.yml does not include document property "title" but it is referenced in template.typ on line 14

jtex found warnings or errors in validating your template.
```

🛠 Update your `template.yml` with `parts` and `doc`

For example, your template might be something like:

```yaml
parts:
  - id: abstract
    required: true
    description: >
      A good abstract will begin with a short description of the problem being
      addressed, briefly describe the new data or analyses, then briefly states
      the main conclusion(s) and how they are supported and uncertainties.
doc:
  - id: title
    required: true
```

```{attention}
:class: dropdown
# Improve the Data
Often the templates that journals provide include a lot of specific information about number of characters (`max_char`) or number of words (`max_words`), you can create these fields so the will be checked when you render your template.

Other helpful information can also be included in this template `description`, for example about data availability or how to structure your acknowledgments `part`.
```

Try running `jtex check` again, and some of the errors will be fixed!

```{important}
# Make the template work without values!

Although you can mark any option or part as `required`, it is best practice to allow the template to compile without these values.

When authors are writing their work, they often may not have the complete information, and still want a preview of their document. Your template should work in an incomplete state!

ultimately this means wrapping your `parts` in conditional statements, such as `[# if parts.abstract #]` or providing fallbacks.
```

## Update the authors and affiliations

The authors and affiliations are usually the hardest part to template as many journals do these differently.
If you are looking for inspiration, take a look at some of the existing templates in the [myst-templates](https://github.com/myst-templates) organization on GitHub.

For example, to create the following author/affiliations list:

```latex
\authors{First Author\affil{1}, Author\affil{1,2}}

\affiliation{1}{First Affiliation}
\affiliation{2}{Second Affiliation}
```

The `jtex` template is as follows:

```latex
\authors{
[#- for author in doc.authors -#]
[-- author.name --]
[#- if author.affiliations -#]
\affil{
[-- author.affiliations|join(",", "index") --]
}
[#- endif -#]
[#- if not loop.last #], [# endif -#]
[#- endfor -#]
}

[# for affiliation in doc.affiliations #]
\affiliation{[-affiliation.index-]}{[-affiliation.value-]}
[# endfor #]
```

The extra `-` in some of the template variables (e.g. `[-- author.name --]`) allows you to [control whitespace](#controlling-whitespace) so that the final template collapses onto a single like like the example.

Most of the time you can get most of the way there with `if` statements and `for` loops (including the special `loop.last` variable). The `| join(",", "index")` is often helpful for affiliations. You can read more about specifics of templating in [](./template-rules.md).

```{tip}
# Getting Help
If you get stuck, open a [discussion on myst-templates](https://github.com/orgs/myst-templates/discussions) and someone will help you out!
```

## Options

Your template may also have specific options that are not covered by the document model, and are not a "part". Good examples of this are `keypoint`, `draft` or `journal_name`. To add these add a `[-options.journal_name-]` and follow the instructions in running `jtex check` when you save.

```yaml
options:
  - type: string
    id: keypoint
    description: Summarize the main point and conclusions of the article
    max_chars: 140
  - type: boolean
    id: draft
    description: Mark the document as draft with line numbers and a watermark
  - type: choice
    id: journal_name
    required: true
    description: The journal you are submitting this manuscript to!
    choices:
      - Nature
      - Science
      - Curvenote
```

The options can be of `type:` `string`, `boolean` or `choice`. For all of your variable names, prefer `lowercase_underscores` for the naming convention. You can also provide a `title` for any `part` or `option`.

## Content, Imports and Packages

The next sections to template are the main content section, which you can replace with `[-CONTENT-]` and a place before `\begin{document}` in your `template.typ`, put in the `[-IMPORTS-]`.

The imports will be dynamically created based on your content, including any math macros that you might use.
The imports are also not included if they are already present in your template. You can define these in the `packages` list of your `template.yml`.

To automatically find packages, ensure that your `files` list is up to date (including any style or other classes), and `jtex` will (naively) parse these and provide warnings. To put the automatically found packages into your `template.yml`, **save** and run:

```bash
jtex check --fix
```

This will overwrite your `template.yml` with all packages found and there should be very few issues found automatically by `jtex check`.

```{figure} ./images/jtex-check-fix.png
:width: 100%

Using `jtex check --fix` will fix as many errors as possible with your `template.yml`!
```

## Build with content

Your template should now be in a place where it can be used to render content. For this we will use the `myst` command line tool.

Create a markdown file with your content, with some frontmatter that looks like:

```yaml
---
title: My article title
exports:
  - format: tex
    template: ../my_template # The folder with your template.yml in it
    draft: true # Any options
    journal_name: Nature
    keypoint: I know how to make a MyST Markdown template.
authors:
  - name: Rowan Cockett
    orcid: 0000-0002-7859-8394
    affiliations:
      - Curvenote
keywords:
  - MyST Templates
---
```

Ensure that the exports list has a `format: tex` in it. To also have your `parts` defined, use blocks with JSON metadata:

```markdown
+++ {"part": "abstract"}

This is your abstract!

+++

# Introduction

Other content!
```

You can now render your document with:

```bash
myst build my-document.md --tex
```

By default these are put in a `_build` folder. If you want to control that, use the `output:` field in the appropriate export. If you have $\LaTeX$ installed, you can also try changing the format to `pdf` or `pdf+tex` to keep the source files. See [](/guide/creating-pdf-documents) for more information on using MyST templates for $\LaTeX$.

Check that you are happy with the output tex files, and that all of the files are listed and copied over properly. If you build a PDF, save a thumbnail of one of the pages as `thumbnail.png`.

## Create a Repository

The default template repository creates a GitHub Action, that checks your template for obvious errors using `jtex check`.
Push your template to a GitHub repository, and you will see the actions test any time you update your template.

```{seealso}
# Contribute to Community Templates
You can choose to also list your template so that it is available to any one else who uses `jtex` and `myst`.

See [](./contribute-a-template.md) for more information!
```

Nice work on creating a template, share the word on [twitter](https://twitter.com/intent/tweet?text=I%20just%20created%20a%20new%20MyST%20Markdown%20template!&url=https://mystmd.org/jtex/create-a-latex-template&via=executablebooks), and think about [contributing your template](./contribute-a-template.md) to make it discoverable to other users!
