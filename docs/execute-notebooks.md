---
title: Execute Notebooks at Build Time
subtitle: Generate figures and other rich content using Jupyter kernels
short_title: Execute During Build
description: MyST can execute Markdown files and Jupyter Notebooks, making it possible to build rich websites from computational documents.
thumbnail: thumbnails/execute-notebooks.png
---

:::{warning} MyST execution features are in Beta
By default, execution is disabled and computational outputs are only inserted if the notebook has already been executed (for text-based notebooks, there are no outputs!).
We are adding support for executing markdown notebooks and ipynb files, including inline execution.
As we are adding this functionality we appreciate any feedback from the community on how it is working in your environments. Please add [issues](https://github.com/jupyter-book/mystmd/issues/new) or join [Discord](https://discord.mystmd.org/) to give feedback.
:::

The MyST CLI can execute your notebooks and markdown files by passing the `--execute` flag to the `start` and `build` commands, i.e.:

```bash
myst start --execute
myst build --execute
```

The following computational content will be executed:

- **Notebook cells** will be executed in the order they appeared in a notebook (ie, a file ending in `.ipynb`).
- **{myst:directive}`code-block` directives** will be executed similar to a code block cell. See [](./notebooks-with-markdown.md) for more information.
- **Inline expressions with the {myst:role}`eval` role** can be used to insert the outputs of a computation in-line with other text.

:::{note} Jupyter is required for execution
In order to execute your MyST content, you must install a Jupyter Server and the kernel needed to execute your code (e.g., the [IPython kernel](https://ipython.readthedocs.io/en/stable/), the [Xeus Python kernel](https://github.com/jupyter-xeus/xeus-python), or the [IRKernel](https://irkernel.github.io/).)
:::

## Expect a code-cell to fail

By default, MyST will stop executing a notebook if a cell raises an error.
If instead you'd like MyST to continue executing subsequent cells (e.g., in order to demonstrate an expected error message), add the `raises-exception` tag to the cell (see [all cell tags](#tbl:notebook-cell-tags)).
If a cell with this tag raises an error, then the error is provided with the cell output, and MyST will continue executing the rest of the cells in a notebook.

## Adding Tags to Notebook Cells

The easiest way to add cell tags is via [the JupyterLab interface](https://jupyterlab.readthedocs.io).
Additionally, you can specify tags (and other cell metadata) with markdown using the {myst:directive}`code-cell` directive.
Here's an example of adding this tag with a {myst:directive}`code-cell` directive:

````markdown
```{code-cell}
:tag: raises-exception

print("Hello" + 10001)
```
````

## Skip particular code-cells

Sometimes, you might have a notebook containing code that you _don't_ want to execute. For example, you might have code-cells that prompt the user for input, which should be skipped during a website build. MyST understands the same `skip-execution` cell-tag that other Jupyter Notebook tools (such as Jupyter Book V1) use to prevent a cell from being executed.

For [Markdown notebooks using the {myst:directive}`code-cell` directive](notebooks-with-markdown.md#code-cell), the `skip-execution` tag can be added as follows:

````markdown
```{code-cell}
:tag: skip-execution

name = input("What is your name?")
```
````

Additional [cell tags](#tbl:notebook-cell-tags) to hide, remove, or raise exceptions are also possible.

## Cache execution outputs

When MyST executes your notebook, it will store the outputs in a cache in a folder called `execute/` in your MyST build folder.
On subsequent builds, MyST will re-use this cache rather than re-execute.

If you change the computational content of a notebook or a markdown page (ie, code in a code cell, or in an inline expression), then this cache will be reset and the code will be re-executed at the next build.

### Force execution by deleting the cache

If you'd like to force re-execution of all the code in your MyST documents, use the following command:

```bash
myst clean --execute
```

Alternatively, you can manually delete the `execute/` folder in your build folder, e.g.:

```bash
rm -rf _build/execute
```

## How MyST executes your code

MyST uses a [Jupyter Server](https://jupyter-server.readthedocs.io/) to execute your code.
Jupyter Server is distributed as a Python package, which can be installed from PyPI or conda-forge, e.g.

```bash
pip install jupyter-server
```

Jupyter Server is only responsible for orchestrating execution of your code. To actually perform execution, you must also install a kernel. For Python, this might be `ipykernel`, e.g.

```bash
pip install ipykernel
```

If Jupyter Server is installed and the `--execute` flag is passed to `myst start` or `myst build` MyST will attempt to launch a Jupyter Server using `python -m jupyter_server`.

## Manually launch a Jupyter server

You can manually launch a Jupyter server and instruct MyST to use it for computation (rather than having MyST start its own Jupyter server).
This gives you more control over the process that executes your content, including specifying Jupyter servers that exist on non-local hardware (e.g. running in the cloud).

To manually specify a server, you must set two variables:

- **`JUPYTER_BASE_URL`**: a URL where the server can be found. On a local machine, this is by default `http://localhost:8888`.
- **`JUPYTER_TOKEN`**: the token that allows access to the Jupyter server.

For example, the following code sets these variables, then starts a Jupyter server with them so that MyST will use them to execute code:

```bash
# Set the port for our local Jupyter process
port="8888"

# Define environment variables that will be used by MyST
# We'll use the values of these variables in our Jupyter server as well.
export JUPYTER_BASE_URL="http://localhost:${port}"
export JUPYTER_TOKEN="my-jupyter-token"

# Start the Jupyter server re-using the variables above
jupyter server --IdentityProvider.token="${JUPYTER_TOKEN}" --ServerApp.port="${port}" &

# Run the MyST build
# It will use the JUPYTER_* variables above to look for the server.
myst build --execute

# Stop the Jupyter server!
kill %1
```
