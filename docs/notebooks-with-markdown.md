---
title: Executable Markdown Files
subtitle: Define Jupyter metadata to make Markdown files executable
description: MyST Markdown files can contain the necessary metadata required to execute their content.
kernelspec:
  name: python3
  display_name: Python 3
---

```{code-cell} python
:tag: remove-cell

import matplotlib.pyplot as plt
import numpy as np
```

Execution information can be added to MyST Markdown files, which allows you to perform computation using [MyST's notebook execution engine](./execute-notebooks.md). First, you will need to [define a kernel specification](#kernel-specification), after which you can introduce Markdown-based computation in several ways:

- [Code cells](#code-cell) for block-level content.
- [Inline expressions](#inline-expressions) for content inline with surrounding text.

(kernel-specification)=

## Kernel specification

Defining a kernel specification (`kernelspec`) informs the Jupyter server of the name of the kernel that should execute your code. When you call `myst build --execute` or `myst start --execute`, the MyST CLI starts a Jupyter kernel to execute your code and gather the execution results. Defining different `kernelspec`s in each notebook makes it possible to flexibly switch the package environment and programming language (e.g. to use R in one notebook, and Julia in another).

The `kernelspec` configuration should be defined in the _page-level_ frontmatter of each executable markdown file (see [](#field-behavior) for more information), and supports the same content that is validated by [`nbformat`'s schema](https://github.com/jupyter/nbformat/blob/main/nbformat/v4/nbformat.v4.5.schema.json):

```{list-table} A list of available kernelspec fields
:header-rows: 1
:label: table-kernelspec

* - field
  - description
* - `name`
  - name of the kernel, e.g. `python3`
* - `display_name`
  - human-readable name for the kernel, e.g. "Python 3.12"
```

The following content is a frontmatter that defines a document that uses the `python` kernel:

```yaml
kernelspec:
  name: python3
  display_name: 'Python 3'
```

After we declare the frontmatter, the contents of each {myst:directive}`code-cell` directive and {myst:role}`eval` role will be executed by the `python` kernel during the building process.

### Use a different kernel

Furthermore, you can build MyST Markdown content with other programming languages like JavaScript, R, and Julia by installing the corresponding kernel. For example, to build a page that uses JavaScript in the {myst:directive}`code-cell`, we could:

1. Install a JavaScript kernel, e.g. [ijavascript](https://github.com/n-riesco/ijavascript).
2. Retrieve the kernel name with `jupyter kernelspec list`.
   In the default installation, the kernel name is `javascript`.
3. Set the kernelspec in your document's frontmatter:
   ```yaml
   kernelspec:
     name: javascript
     display_name: JavaScript
   ```
4. Define a code cell that uses the new kernel:
   ````markdown
   ```{code-cell} javascript
   console.log("hello javascript kernel");
   ```
   ````

(code-cell)=

## Code cells with the {myst:directive}`code-cell` directive

You can use the {myst:directive}`code-cell` directive to create block-level computational outputs in MyST Markdown.

{myst:directive}`code-cell` directives have the following form:

````
```{code-cell} LANGUAGE
:key: value

CODE TO BE EXECUTED
```
````

- `LANGUAGE` defines the language to be used in executing the code.
- `:key: value` pairs will be treated as cell-level metadata.
- `CODE TO BE EXECUTED` will be executed by the `LANGUAGE` kernel at build time.

For example, the following directive inserts a code cell into the page, and will be executed if you specify `--execute` with your MyST build.

````markdown
```{code-cell} python
hello = "hello"
there = "there"
phrase = f"{hello}, {there}!"
print(phrase)
```
````

```{code-cell} python
hello = "hello"
there = "there"
phrase = f"{hello}, {there}!"
print(phrase)
```

### Add tags to {myst:directive}`code-cell` directives

You can add tags to the {myst:directive}`code-cell` directive.
They will be parsed and used in the same way that cell tag metadata is used in `.ipynb` files.

For example, the following code defines a `remove-input` tag (See all [notebook tag options](#tbl:notebook-cell-tags)):

````markdown
```{code-cell} python
:tag: remove-input
print("This will show output with no input!")
```
````

and results in the following:

> ```{code-cell} python
> :tag: remove-input
> print("This will show output with no input!")
> ```

This can be particularly helpful for showing the output of a calculation or plot, which is reproducible in the {download}`source code <./notebooks-with-markdown.md>`, but not shown to the user like this `matplotlib` plot:

```{code-cell} python
:tag: remove-input
# Data for plotting
t = np.arange(0.0, 2.0, 0.01)
s = 1 + np.sin(2 * np.pi * t)

fig, ax = plt.subplots()
ax.plot(t, s)

ax.set(xlabel='time (s)', ylabel='voltage (mV)',
       title='Waves in Time')
ax.grid()

fig.savefig("test.png")
plt.show()
```

For **multiple tags** you have two ways to provide them:

- If you specify argument options with `:`, tags will be parsed as a comma-separated list of strings.
  For example:

  ````markdown
  ```{code-cell} python
  :tags: [tag1, tag2,tag3]
  # Note that whitespace is removed from tags!
  print("howdy!")
  ```
  ````

- If you specify argument options with YAML, tags should be given as a YAML list.
  For example:

  ````markdown
  ```{code-cell} python
  ---
  tags:
  - tag1
  - tag2
  ---
  print("howdy!")
  ```
  ````

For more about how to specify directive options, see [](./syntax-overview.md).

:::{seealso} Controlling cell visibility with tags
See [](#notebooks:cell-visibility) for more information.
:::

(myst:inline-expressions)=

## Inline expressions with the {myst:role}`eval` role

You can use the {myst:role}`eval` role to evaluate code that is surrounded by text.
This allows you to quickly insert its output in a way that flows with the text around it.

For example, the following MyST Markdown would re-use the variable defined above.

```markdown
The phrase is: {eval}`phrase`.
```

This results in the following:

> The phrase is: {eval}`phrase`.

You can also modify the expression at the time of computation, for example:

```markdown
The phrase manually computed is: {eval}`f"{hello}, {there} everybody!"`
```

This results in the following:

> The phrase manually computed is: {eval}`f"{hello}, {there} everybody!"`

:::{seealso} Also works in JupyterLab
See [](./quickstart-jupyter-lab-myst.md) for how these eval statements also work in JupyterLab.
![](#fig:eval-array)
:::

## Markdown cells with block breaks

In [](#compatibility-jupytext), the `jupytext` tool for integrating text-based notebooks with existing Jupyter tools like JupyterLab is discussed. By default, when reading a MyST Markdown document, `jupytext` creates a single Markdown cell between adjacent code cells. The block-break (`+++`) syntax described in [](./blocks.md) can be used to separate blocks of Markdown into distinct Markdown cells.

(compatibility-jupytext)=

## Compatibility with `jupytext`

[jupytext](https://github.com/mwouts/jupytext) is a Python package that converts between Jupyter Notebooks (ipynb files) and plain text documents (like MyST Markdown files). It provides both a commandline tool to perform these conversions, and an extension for JupyterLab to facilitate opening text-based notebooks with the Notebook viewer. MyST Markdown is understood by jupytext, which defines a `md:myst` format for reading from / writing to MyST Markdown.

The following command will convert a MyST markdown file `example.md` to the `.ipynb` notebook:

```shell
$ jupytext --from md:myst --to notebook example.md
```
