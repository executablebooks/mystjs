# myst-spec-ext

## 1.7.7

## 1.7.6

## 1.7.5

## 1.7.4

### Patch Changes

- eb411d0b: Allow for iframe to have a placeholder

## 1.7.3

## 1.7.2

### Patch Changes

- 4a3ee6db: Keep track of implicit vs. explicit pages in project TOC

## 1.7.1

## 1.7.0

### Minor Changes

- 5f8f0b0d: Add support for seach index generation

## 1.6.1

## 1.6.0

### Patch Changes

- 85db77c7: Add urlOptimized to image type

## 1.5.4

### Patch Changes

- 4e880f3e: Add open to the admonition

## 1.5.3

### Patch Changes

- 857c5acf: Add raw directives/roles for inserting tex/typst-specific content

## 1.5.2

## 1.5.1

### Patch Changes

- b3e9df9d: Update to Project Jupyter and change all URLs

## 1.5.0

## 1.4.7

## 1.4.6

## 1.4.5

## 1.4.4

## 1.4.3

## 1.4.2

## 1.4.1

### Patch Changes

- 61c7291: Add Link to myst-spec-ext, update crossReference
- da9ca5b2: Add remote base URL for the external links to help with recursion!

## 1.4.0

### Patch Changes

- ab863c8a: Add CrossReference

## 1.3.0

### Minor Changes

- f656e572: Add topic directive

### Patch Changes

- 3b008cbb: Move from using `data.type = notebook-code` to `block.kind = notebook-code`

## 1.2.0

## 1.1.35

## 1.1.34

## 1.1.33

## 1.1.32

### Patch Changes

- 20108545: Add tightness to math node extension

## 1.1.31

## 1.1.30

### Patch Changes

- 42af3800: Require `kind` for `Container`

## 1.1.29

### Patch Changes

- cbad68cc: Add raw directive

## 1.1.28

### Patch Changes

- cff47b14: Add enumerator to citations and cite nodes

## 1.1.27

## 1.1.26

## 1.1.25

## 1.1.24

### Patch Changes

- d5416ff8: Allow the figure container to have an extensible kind

## 1.1.23

### Patch Changes

- 50416784: Add code cell metadata placeholder image to output children

## 1.1.22

### Patch Changes

- f78db0bf: Update myst-spec

## 1.1.21

## 1.1.20

## 1.1.19

## 1.1.18

## 1.1.17

### Patch Changes

- 2403f376: Add no-figures option to figure directive

## 1.1.16

## 1.1.15

### Patch Changes

- 81a47ef5: Clean up basic transforms and types for subfigures

## 1.1.14

## 1.1.13

## 1.1.12

## 1.1.11

### Patch Changes

- 417efdc9: Add `Line` to myst-spec-ext
- a7f830af: Support for sub-equations, including adding the MathGroup node.

## 1.1.10

### Patch Changes

- 5737951e: Add `Block`, and shared visibility attribute

## 1.1.9

## 1.1.8

## 1.1.7

### Patch Changes

- 4183c05c: Improve the citation node
- 392ba779: Add `include` node, that implements the `literalinclude` directive
- 757f1fe4: Add partial to Cite node to allow for year or author only.
- 60cf9a53: Add filename to codeblock and include directives

## 1.1.6

## 1.1.5

## 1.1.4

### Patch Changes

- a5b188ac: Added location field to page data, dependencies and source fields which contains the path to the file relative to the project root. This is primarily used to appropraitely configure a thebe session with the correct notebook path.

## 1.1.3

## 1.1.2

## 1.1.1

## 1.1.0

### Minor Changes

- 44ff6917: Rearrange package imports and fix versions

### Patch Changes

- Updates to internal dependencies

## 1.0.3

### Patch Changes

- 7b72b097: Add placeholder to figure directive options and image node spec
- 7b72b097: New Embed and Container node type in myst-spec-ext
- f44ee18d: Add iframe directive to spec

## 1.0.2

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd

## 1.0.1

### Patch Changes

- 072e338e: support jupyter cell meta tags

## 1.0.0

### Major Changes

- 00c05fe9: Migrate to ESM modules

## 0.0.12

### Patch Changes

- b2ac9d13: Add urlSource

## 0.0.11

### Patch Changes

- 79743342: Add inline evaluation role that pulls from user_expressions
- 685bbe58: Add SI Units (see https://texdoc.org/serve/siunitx/0)
- 3da85094: Add `enumerator` to footnote spec and transform (same as deprecated `number`)

## 0.0.10

### Patch Changes

- 0ab667e5: Add suffix and prefix to citation extension

## 0.0.9

### Patch Changes

- 45ecdf86: Improve parsing of tasklists for mdast

## 0.0.8

### Patch Changes

- 833be5a9: Add `executable` to code

## 0.0.7

### Patch Changes

- 9fcf25a9: Add citation nodes to myst-spec-ext

## 0.0.6

### Patch Changes

- e443ad2a: Add icon to Admonition spec

## 0.0.5

### Patch Changes

- 987c1053: Add height to images

## 0.0.4

### Patch Changes

- f0d2da60: Add tabs to myst-spec-ext
- 160e954f: Add a Heading node that includes the implicit and html_id properties.

## 0.0.3

### Patch Changes

- 27388448: Update packages to unstarred versions

## 0.0.2

### Patch Changes

- fa50bba2: Introduce an extension centralization point for myst-spec
