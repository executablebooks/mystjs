---
title: Cross-references
subtitle: Link to equations, figures, tables, and so much more!
description: Create numbered cross-references to labeled content (e.g. a figure, document, or table) and automatically generates links with hover previews.
thumbnail: ./thumbnails/cross-references.png
numbering:
  headings: true
---

% Based loosely on https://jupyterbook.org/content/references.html

References refer to labeled content (e.g. a figure, document or table) and automatically generates links and extra information, like numbering. This page covers the basics of setting up references to content and shows examples for sections, figures, tables and equations.

```{seealso}
See [](./external-references.md) to connect your <wiki:documents> to external [linked](wiki:Hyperlink) content like <wiki:Wikipedia>, or other MyST projects. These cross-references allow for [hover](wiki:Hovercraft)-references to external content.

See [](./citations.md) to cite scholarly work and create bibliographies.
```

## Reference syntax

There are several ways that you can define cross-references with MyST.
Below are the major ones.

(link-references)=

### Reference using Links

Cross-referencing content is accomplished with markdown link syntax (`[text](#target)`) where `#target` is the target label[^1], like the figure, equation or section header that you are referencing. If you leave the text empty, MyST will fill in the link with the title, caption, document name, or equation number as appropriate (e.g. "Figure 1" or "Section 1.3.7"). If you do supply text, you can control what is displayed in the reference, as well as have access to placing the name and enumerator of the target, using `{name}` and `{number}`, respectively[^2].

[^1]: Note that targets without the `#` will resolve, however, they throw a deprecation warning. By including the `#` there is a better chance of your content working in other markdown renderers like GitHub or VSCode.
[^2]: Note that not everything has a number or name (e.g. a paragraph usually isn't numbered, and an equation doesn't have text to resolve into `{name}`). An unnumbered node will resolve to `??`, and raise a warning if they are not defined. If no `{name}` is defined the node `label` will be used instead.

```{list-table}
:header-rows: 1
* - MyST Syntax
  - Rendered
* - `[](#targeting-headers)`
    : Default for numbered references is to fill in the listing and number (e.g. Figure 1.).
    : Note that headings are numbered on this page, so it will show the number rather than the header title.
  - [](#targeting-headers)
* - `[Sec. %s](#targeting-headers)`
    : Modify the title, but keep the enumerator, you can use `{number}` or `%s` to place the number.
    : Note that unnumbered targets (e.g. a paragraph) will resolve the number to `??`, similar to $\LaTeX$, and a warning shown.
  - [Sec. %s](#targeting-headers)
* - `[Sec. **_%s_**](#targeting-headers)`
    : Markup is parsed first and then the content in placed.
    : Content inside of inlineCode is _not_ replaced.
  - [Sec. **_%s_**](#targeting-headers)
* - `[Section "{name}"](#targeting-headers)`
    : Use `{name}` to place the name of the header in the content.
    : Headers resolve the text of the header, if there is a caption in the target it will be used.
    : For targets that do not have a caption or header, the name will resolve to the label.
  - [Section "{name}"](#targeting-headers)
* - `[**bold _reference_**](#targeting-headers)`
    : If you override the text in the link, that will be used.
  - [**bold _reference_**](#targeting-headers)
* - `[](./citations.md)`
    : Link to documents using relative links from the markdown.
  - [](./citations.md)
* - `[](./myst.yml)`
    : Link to static files that will be included in your built website. Similar to the [{download}](#download-role) role.
  - [](./myst.yml)
* - `[Admonition](xref:spec#admonition)`
    : External hover-references to MyST or Sphinx projects. See [](./external-references.md).
  - [Admonition](xref:spec#admonition)
```

% TODO: absolute links

### Reference using a shorthand `@` syntax

You can reference targets with a short-hand using the `@` symbol, like so:

```markdown
@target
```

This cuts down on the amount of markdown that is needed to create the reference.
For example, the following text:

```md
Other ways to reference are @link-references and the @ref-role role.
```

Results in:

> Other ways to reference are @link-references and the @ref-role role.

:::{note} This is a short-hand for several types of references
The `@` short-hand syntax for referencing maps on to many different types of [referencing roles](#reference:roles), depending on the target that you are referencing.

For example, if `@target` is a bibliography entry, it will map onto the {myst:role}`cite` role.
If it is an image or a section header, it will map on to the {myst:role}`ref` role.
:::

(reference:roles)=

### Reference using MyST roles

Roles are a more explicit way of defining references that provide more configuration at the cost of requiring more complexity to write.
There several roles that define various kinds of references in MyST.
In many cases, the short-hand syntax described above are aliases for these roles.
Below we describe the most commonly-used ones.

(ref-role)=

ref
: The {myst:role}`ref` role can be used to bring the title or caption directly in line, the role can take a single argument which is the label, for example, `` {ref}`reference-target` ``
: You can also choose the reference text directly (not taking from the title or caption) by using, `` {ref}`your text here <reference-target>` ``.

(numref-role)=

numref
: The {myst:role}`numref` role is exactly the same as the above {myst:role}`ref` role, but also allows you to use a `%s` in place of the number, which will get filled in when the content is rendered. For example, ``{numref}`Custom Table %s text <my-table-ref>`.`` will become `Custom Table 3 text`.

(eq-role)=

eq
: The `` {eq}`my-equation` `` syntax creates a numbered link to the equation, which is equivalent to `[](#my-equation)` as there is no text content to fill in a title or caption.

(doc-role)=

doc
: The `` {doc}`./my-file.md` `` syntax creates a link to the document, which is equivalent to `[](./my-file.md)`.

(download-role)=

download
: The `` {download}`./my-file.zip` `` syntax creates a download to a document, which is equivalent to `[](./my-file.zip)`.

:::{tip} When to use roles vs. short-hand

Short-hand syntax is provided for a quick and clean way to reference content with MyST if you are happy with default behavior.
However, some roles provide additional configurability that allow you to change their behavior.

Thus, a good rule of thumb is the following:

1. If you're happy with the default behavior of references, use `@target` syntax.
2. If you only wish to modify the displayed text, use `[My text](#target)` syntax.
3. If you wish to use more complex configurability, use the role syntax (`{ref}`, `{cite}`, etc).

:::

## Targets and labels for referencing

The content you wish to reference is called a **target**, and to be targeted that content must have a **label**.
For example, in this reference syntax:

```md
[](#my-targets-label)
```

The text `my-targets-label` is the label for the target.
There are many ways that you can label a target, and the sections below describe the most common approaches.

:::{note}
To be referenced, targets must have a `label`/`identifier` pair [in the AST](xref:spec#association).
:::

### Directive Targets

Labels can be given to most directives by setting the `label` option. For example, to label and reference a figure, use the following syntax:

````{myst}
```{figure} https://github.com/rowanc1/pics/blob/main/mountains.png?raw=true
:label: my-fig
:align: center

My **bold** mountain 🏔🚠.
```

Check out [](#my-fig)!!
````

```{tip} Using Markdown Links 🔗
You can use this syntax to also reference [Section/Header targets](#targeting-headers) as well as [label equations](#referencing-equations) when using [dollar math](#dollar-math) or [AMS math](#ams-environments).
```

Or, to label an equation:

(example-equation-targets)=

````{myst}
```{math}
:label: my-math-label
e=mc^2
```

See [](#my-math-label) for an equation!
````

(targeting-headers)=

### Header Targets

To add labels to a header use `(my-section)=` before the header, these can then be used in markdown links and {myst:role}`ref` roles. This is helpful if you want to quickly insert links to other parts of your book. Referencing a heading will show the heading and the subsequent two pieces of content[^3], unless a header is encountered.

[^3]: The content could be a single paragraph, a figure, table or list. It can also be fully interactive content, with cross-references to other content, allowing you to nest and follow references easily!

```{myst}
(my-section)=
#### Header _Targets_

Use `(label)=` before the element that you want to target, then reference content with:

* [](#my-section)
```

:::{tip} How to turn on heading `numbering`
:class: dropdown

By default headings are not numbered, see [](#header-numbering) for more information. To turn on numbered headers you need to turn numbering on in the document or project using `numbering` in the frontmatter. You can control this for each heading level:

```yaml
numbering:
  heading_1: true
  heading_2: true
```

These will show up, for example, as `Section 1` and `Section 2.1`. To turn on all heading numbering, use `headings: true`.
:::

% TODO: We should support pandoc style unnumbered {-} and {.class, #id} syntax

(header-numbering)=

#### Header Numbering

By default section numbering for headers is turned off with numbering for figure and table numbering enabled.
To turn on `numbering` for headers, you can can change the frontmatter in the document or project. See [](#numbering) for more details on the numbering object.

```{myst}

---
numbering:
  heading_2: true
  heading_3: true
---

(my-chapter)=
## My Chapter

(my-section)=
### My Section

(my-section2)=
### My Second Section

* [](#my-chapter)
* [](#my-section)
* [](#my-section2)
```

(targeting-cells)=

### Notebook Cell Targets

You can label notebook cells using a comment at the top of the cell, using a `#| label:` syntax, or have this added directly in the notebook metadata for the cell.

```python
#| label: my-cell
print('hello world')
```

The cell output or the entire cell can be embedded or referred to using the image or link syntax.

```markdown
[](#my-cell) - This is a cross-reference to a notebook cell
![](#my-cell) - This will embed the output of a notebook cell
```

or as a `figure` directive, where you can then add a caption. If you are referring to that figure in a further cross reference that figure (i.e. not the original cell), give it a new `name`.

```markdown
:::{figure} #my-cell
:label: fig-my-cell
:::
```

:::{card} ♻️ See Also: Reusing Jupyter Outputs
:link: ./reuse-jupyter-outputs.md
See more about reusing Jupyter outputs in figures, adding placeholders, and other options.
:::

:::{note} Interactive Example

The following example embeds a figure from [](./interactive-notebooks.ipynb), and can be used in cross references [](#fig-altair-horsepower).

```{figure} #img:altair-horsepower
:label: fig-altair-horsepower
This figure has been included from [](./interactive-notebooks.ipynb) and can be referred to in cross-references through a different label.
```

:::

(label-anything)=

### Label Anything

It is possible to label any document node by adding `(my-label)=` before any other block of content. These can be referenced using the {myst:role}`ref` role, but by default will not be enumerated, so you cannot use `%s` or `{number}` in the content.

```{myst}
(my-paragraph)=
This is just a paragraph!

(my-points)=
* Bullet
* points

Please see [this paragraph](#my-paragraph) and [these points](#my-points).
```

(numbering)=

## Numbering

Frontmatter may specify `numbering` to customize how various components of the page are numbered. By default, numbering is enabled for figures, equations, tables, math, and code blocks; it is disabled for headings and other content types contained on the page. Additionally, by default, numbering resets on every page.

### Enabling and Disabling Numbering

To enable numbering of all content, you may simply use:

```yaml
numbering: true
```

Similarly, to disable all numbering:

```yaml
numbering: false
```

The `numbering` object allows you to be much more granular with enabling and disabling specific components:

```yaml
numbering:
  code: false
  math: false
  headings: true
```

Numbering may be used for `figure` as above, as well as `subfigure`, `equation`, `subequation`, `table`, `code`, `headings` (for all heading depths), and `heading_1` through `heading_6` (for modifying each depth separately).

### Numbering Custom Content

You may also add numbering for custom content kinds:

```markdown
---
numbering:
  box:
    enabled: true
---

:::{figure} image.png
:label: my-box
:kind: box

This figure will be numbered as "Box 1"
:::
```

### Customizing Numbering Appearance

By default, all components are numbered sequentially as 1, 2, 3... However, under the `numbering` object, you may specify `enumerator`. For now, this applies to all numberings on the page. Instead of enumerating as simply 1, 2, 3... they will follow the template set in `enumerator`. For example, in Appendix 1, you may want to use the following `numbering` so content is enumerated as A1.1, A1.2, A1.3...

```yaml
numbering:
  enumerator: A1.%s
```

If you want to control the numbering for a specific figure, you can use the {myst:directive}`figure.enumerator` option. This will give the figure a specific enumerator, and will not increment the counting for other figures. This is helpful if you want to explicitly count figure `2a` and then carry on counting figures as normal; alternatively you can take control of numbering entirely by setting {myst:directive}`figure.enumerator` on every figure.

You may also redefine how the component will render when referenced in the text by specifying `template`. For this example, the figures on the page will start with `Figure 1` and when referenced in the text they will appear as "fig (1)"

```yaml
numbering:
  figure:
    template: fig (%s)
```

### Continuous Numbering

By default, numbering will reset on every page. However, you may enable continuous numbering across all pages by specifying `continue: true` in your `numbering` object. If this is specified on a single page, it will continue counting from the previous page; if specified in your `myst.yml`, counting will be continuous across the entire project.

```yaml
numbering:
  figure:
    continue: true
```

You may also override the `start` value to begin counting on the page at a specific number. This is useful, for example, if you want continuous figure numbering across your project until you reach your appendix, then you want to reset to A1:

```yaml
numbering:
  enumerator: A%s
  figure:
    start: 1
```

### Title Numbering

By default, page titles are not numbered, even if you turn on all numbering with `numbering: true`. However, you may add `title` to your numbering object:

```yaml
numbering:
  title: true
```

Doing so will enumerate all the titles in your MyST project. These numberings will follow the structure of your table of contents. So, given the structure:

```yaml
toc:
  - file: index.md
  - file: section_a.md
    children:
      - file: chapter_1.md
      - file: chapter_2.md
  - file: section_b.md
```

The numbering will be: `1 - index.md`, `2 - section_a.md`, `2.1 - chapter_1.md`, `2.2 - chapter_2.md`, and `3 - section_b.md`.

If both `title` and `heading` numbering are enabled, these will be incremented together. So, for the example above, if there is a single heading of level 1 in `section_a.md`, it will increment the same count as the title of `chapter_1.md` and `chapter_2.md` (i.e. the heading will be `2.1` and the chapters will be `2.2` and `2.3`):

```yaml
numbering:
  title: true
  headings: true
```

You can further customize this behavior by setting an explicit `offset` value on a page. By default the offset matches the nesting level in the table of contents, but, for example, if you want page numbering to be flat, despite nesting in the table of contents, you can set `offset: 0`:

```yaml
numbering:
  title:
    enabled: true
    offset: 0
```

For the example above, the numbering will change to: `1 - index.md`, `2 - section_a.md`, `3 - chapter_1.md`, `4 - chapter_2.md`, and `5 - section_b.md`.