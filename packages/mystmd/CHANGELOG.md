# mystmd

## 1.3.21

## 1.3.20

## 1.3.19

## 1.3.18

## 1.3.17

## 1.3.16

## 1.3.15

### Patch Changes

- 2bce565: Add site option to include folder structure in url paths

## 1.3.14

## 1.3.13

### Patch Changes

- b14e0fb3: Force exit when the task is complete.

## 1.3.12

## 1.3.11

## 1.3.10

## 1.3.9

### Patch Changes

- 594a0f87: Top level AMS environments are not wrapped
- e3c3efa7: Add latex support for hyperlink and hypertarget

## 1.3.8

### Patch Changes

- 822fd2d5: Ensure that AMS Math environments are only used if there is a single environment that encloses the entire math environment.
- c758f1b5: Directive option flag is always a boolean

## 1.3.7

### Patch Changes

- d642197: Update the python build packaging

## 1.3.6

## 1.3.5

### Patch Changes

- 64e11918: Suppress punycode deprecation warning
- 85520edd: Allow for explicit ignoring of longer abbreviations
- da224b78: Reduce scope of date parsing, and validate to ISO8601
- 88396dd: Add enumerator and enumerated to directives
- 0625105e: Citation improvements for latex (citealp)

## 1.3.4

## 1.3.3

### Patch Changes

- 706d01e8: Updates for typst math subscripts
- 05b5e40e: 🐛 Citations broken with trim when a list

## 1.3.2

## 1.3.1

### Patch Changes

- b3e9df9d: Update to Project Jupyter and change all URLs

## 1.3.0

### Patch Changes

- 0576d5ad: Add support for whitelabelling

## 1.2.9

### Patch Changes

- fc79fb1e: Prevent generation of random temp*id*\* citation labels

## 1.2.8

## 1.2.7

## 1.2.6

### Patch Changes

- 2c3290be: Add build command to write remote doi citations to bibtex
- 286ceaaf: Fetch config files from url
- 3d93fdb9: Footnotes that are reused should have the same number

## 1.2.5

### Patch Changes

- 65ade89: Consume new math structure

## 1.2.4

### Patch Changes

- 8e7ac4ae: Add site build test cases to end2end tests
- 72a127c3: Fix embed mdast structure for executable content

## 1.2.3

## 1.2.2

## 1.2.1

### Patch Changes

- 7a04910f: Rename Toc to TOC

## 1.2.0

## 1.1.56

### Patch Changes

- 327ee1a: Move shared cli interfaces to myst-cli
- 327ee1a: Refactor CLI for reusability

## 1.1.55

## 1.1.54

## 1.1.53

### Patch Changes

- d17f6806: Handle circular includes with nice errors and no infinite loops
- d17f6806: Revive basic recursive include
- 5c9338a: Add end-to-end tests for various DOIs

## 1.1.52

## 1.1.51

## 1.1.50

## 1.1.49

### Patch Changes

- 20108545: Handle math tightness for latex

## 1.1.48

## 1.1.47

## 1.1.46

### Patch Changes

- 77549eea: Expose max size webp conversion to cli

## 1.1.45

## 1.1.44

## 1.1.43

### Patch Changes

- 9bd29068: Add cache folder for intersphinx and doi fetches

## 1.1.42

### Patch Changes

- b272e7a4: Add logs to mystmd build

## 1.1.41

### Patch Changes

- 7bf2ee8: Bump version for new Python release

## 1.1.40

### Patch Changes

- d2a2a41: Integrate myst-execute into the CLI

## 1.1.39

### Patch Changes

- 4d4116c5: Only parse frontmatter out of first notebook cell
- 2ffd6cc9: Fix section level for single article exports
- 4b5ca6a2: Add build ci option to not write versions

## 1.1.38

## 1.1.37

### Patch Changes

- 134c26ab: Add watch to build command

## 1.1.36

### Patch Changes

- 6354420: Update myst templates api for typst

## 1.1.35

### Patch Changes

- a0044da: Add typst export to CLI

## 1.1.34

## 1.1.33

### Patch Changes

- 7e8d85e: Consume table changes

## 1.1.32

## 1.1.31

## 1.1.30

## 1.1.29

## 1.1.28

## 1.1.27

### Patch Changes

- 4534f995: Add table directive

## 1.1.26

## 1.1.25

## 1.1.24

## 1.1.23

### Patch Changes

- 2c934d03: Specify port numbers for app and server ports

## 1.1.22

## 1.1.21

## 1.1.20

## 1.1.19

## 1.1.18

## 1.1.17

## 1.1.16

## 1.1.15

## 1.1.14

## 1.1.13

## 1.1.12

## 1.1.11

## 1.1.10

### Patch Changes

- 24c0aae7: Move from Root in mdast to `GenericParent` to relax types
- fee1eea5: Translate mermaid and math code blocks by default.
- f7356fd0: Allow for an extra space between # and | in starting the labeled code cell.
- 553eca1: Allow for `#| label` to come after an ipython magic.
- 2960da05: Transform code blocks with `math` language to be math blocks. This is GitHub markdown.

## 1.1.9

### Patch Changes

- eb32ae98: Add mathml to the exported JATS.

## 1.1.8

## 1.1.7

## 1.1.6

### Patch Changes

- Updates to internal dependencies

## 1.1.5

## 1.1.4

### Patch Changes

- 6a4f57b5: Notify about upgrades in the CLI
- 56872ae1: We are supporting LTS branches of node. This adds an additional check for >=16.

## 1.1.3

## 1.1.2

## 1.1.1

## 1.1.0

### Minor Changes

- Move CLI from `myst-cli` to `mystmd`

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd
- d33fd7a9: Add `myst init --gh-pages` to add the GitHub Action
