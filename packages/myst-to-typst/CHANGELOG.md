# myst-to-typst

## 0.0.30

### Patch Changes

- 7f29af8a: New lines in lists are not written to typst
- Updated dependencies [415ed13]
  - myst-frontmatter@1.7.7
  - myst-common@1.7.7
  - myst-spec-ext@1.7.7

## 0.0.29

### Patch Changes

- 6f77bda2: Enable labeling of paragraphs
- cd69d47: Add exercise and solution handlers
- a6575fa9: Do not label implicit heading nodes in typst
- ea19e66c: Support additional greek characters in typst
- 7afc6917: 𝐁 Bold text in typst in line fixed
- 67bc9b8d: Update static exports to hide hidden code cells and blocks.
- 9457a8de: Support restarting counter for each typst article in multi-article export
- 2c8fa97d: Fix typst crossreferences to other pages
- 4979d3c3: tex-to-typst updates
- Updated dependencies [67bc9b8d]
- Updated dependencies [0d82810f]
- Updated dependencies [6f6032b7]
  - myst-common@1.7.6
  - myst-frontmatter@1.7.6
  - myst-spec-ext@1.7.6

## 0.0.28

### Patch Changes

- 0dc62c76: Allow overriding default breakable value for typst figures
- 0dc62c76: Add hook for customizing table columns in typst
- 0dc62c76: Render table legends below tables in typst
- 0dc62c76: Support lists that do not start at 1 in typst
- 0dc62c76: Render cross-references with correct text in typst
- 0dc62c76: Support table cell background color in typst

## 0.0.27

### Patch Changes

- f888081: Support card nodes
- fe236580: Upgrade table functionality in typst

## 0.0.26

### Patch Changes

- eb411d0b: Allow for iframe to have a placeholder
- 6ded5d1: Update deps
- fd78758e: Tabs in typst
- f7e83852: add proof and change blockquote
- dd4569b9: Add captions for sub figures
- Updated dependencies [eb411d0b]
  - myst-spec-ext@1.7.4
  - myst-common@1.7.4
  - myst-frontmatter@1.7.4

## 0.0.25

### Patch Changes

- 7547b1dd: Typst program vs code.
- Updated dependencies [2bce565]
  - myst-common@1.7.3
  - myst-frontmatter@1.7.3
  - myst-spec-ext@1.7.3

## 0.0.24

### Patch Changes

- ce3c11c: Update inter-version deps

## 0.0.23

### Patch Changes

- 53fcd2ba: Replace remote cross references with links in typst
- Updated dependencies [3c65de0]
- Updated dependencies [64a33837]
- Updated dependencies [3c65de0]
  - myst-frontmatter@1.7.1
  - myst-common@1.7.1
  - myst-spec-ext@1.7.1

## 0.0.22

### Patch Changes

- a550afdc: Allow for styles in tables
- Updated dependencies [5f8f0b0d]
  - myst-spec-ext@1.7.0
  - myst-common@1.7.0
  - myst-frontmatter@1.7.0

## 0.0.21

### Patch Changes

- 857c5acf: Add raw directives/roles for inserting tex/typst-specific content
- Updated dependencies [857c5acf]
- Updated dependencies [313b218]
  - myst-spec-ext@1.5.3
  - myst-frontmatter@1.5.3
  - myst-common@1.5.3

## 0.0.20

### Patch Changes

- 706d01e8: Updates for typst math subscripts
- 8b75342d: Fix handling of remove- for exports

## 0.0.19

### Patch Changes

- 0b3bf03: Fix labels, add macros for typst math
- 0b3bf03: Support subfigures in typst export
- Updated dependencies [134598fd]
- Updated dependencies [38a45645]
- Updated dependencies [3fd53be8]
  - myst-common@1.5.2
  - myst-frontmatter@1.5.2
  - myst-spec-ext@1.5.2

## 0.0.18

### Patch Changes

- b3e9df9d: Update to Project Jupyter and change all URLs
- Updated dependencies [b3e9df9d]
  - myst-frontmatter@1.5.1
  - myst-spec-ext@1.5.1
  - myst-common@1.5.1

## 0.0.17

### Patch Changes

- 65ade89: Consume new math structure
- 65ade89: Resolve recursive macros early for typst
- Updated dependencies [65ade89]
- Updated dependencies [435c4329]
  - myst-frontmatter@1.4.4
  - myst-common@1.4.4
  - myst-spec-ext@1.4.4

## 0.0.16

### Patch Changes

- 8851eca7: Support `div` and `span` in typst and tex

## 0.0.15

### Patch Changes

- 69457615: Update dependencies
- e0cd47e3: Support new-page/page-break tags in tex/typst/docx
- e0cd47e3: Support no-pdf, no-typst alongside no-tex
- Updated dependencies [3b008cbb]
- Updated dependencies [e0cd47e3]
- Updated dependencies [f656e572]
  - myst-spec-ext@1.3.0
  - myst-common@1.3.0
  - myst-frontmatter@1.3.0

## 0.0.14

### Patch Changes

- d17f6806: Add newlines after typst include/embed

## 0.0.13

### Patch Changes

- d24ab936: Add initial inlineExpression for typst.
- Updated dependencies [5aa3ea2f]
- Updated dependencies [5aa3ea2f]
- Updated dependencies [c38cc28]
  - myst-common@1.1.34
  - myst-frontmatter@1.1.34
  - myst-spec-ext@1.1.34

## 0.0.12

### Patch Changes

- 03914dff: Wrap non-identifier citations in `label()`
- Updated dependencies [1880a465]
- Updated dependencies [22c5fff]
- Updated dependencies [1880a465]
  - myst-common@1.1.31
  - myst-frontmatter@1.1.31
  - myst-spec-ext@1.1.31

## 0.0.11

### Patch Changes

- a3f877d5: Add `@` to typst escaped characters
- Updated dependencies [03db3a35]
  - myst-frontmatter@1.1.25
  - myst-common@1.1.25
  - myst-spec-ext@1.1.25

## 0.0.10

### Patch Changes

- f7fd9053: Stop turning dois to links in typst
- Updated dependencies [50416784]
- Updated dependencies [50416784]
- Updated dependencies [01322e48]
  - myst-frontmatter@1.1.23
  - myst-spec-ext@1.1.23
  - myst-common@1.1.23

## 0.0.9

### Patch Changes

- 2be01f12: Handle nested definition lists in typst
- 409adad8: Upgrade tex-to-typst
- d0eab1c2: Clean up newline handling in typst
- 9ea12b12: Fix phi symbol
- 405caef7: Allow backticks in typst code, no other escapes
- dd23c26f: Cross references, emph and strong with trailing text
- d0eab1c2: Allow breakable figures across pages in typst
- 4a496339: Typst figures now use identifiers rather than labels and match the references!
- 405caef7: Improve typst figure/table formatting
- 2be01f12: Enable typst figures with image/content + other node types
- 363c93c5: Fix inlinecode when there are children
- 9ea12b12: Improve typst escapes
- 2be01f12: Typst citation support: narrative and suffix
- Updated dependencies [7596172]
- Updated dependencies [f78db0bf]
- Updated dependencies [7596172]
- Updated dependencies [7596172]
- Updated dependencies [7596172]
- Updated dependencies [7596172]
- Updated dependencies [7596172]
- Updated dependencies [9178a214]
- Updated dependencies [7596172]
- Updated dependencies [ffc1061f]
- Updated dependencies [aa335d74]
  - myst-frontmatter@1.1.22
  - myst-spec-ext@1.1.22
  - myst-common@1.1.22

## 0.0.8

### Patch Changes

- bfed37b: Support tables in typst export
- bfed37b: Support thematic break in typst
- Updated dependencies [134c26ab]
  - myst-frontmatter@1.1.21
  - myst-common@1.1.21
  - myst-spec-ext@1.1.21

## 0.0.7

### Patch Changes

- a0044da: Support new typst cite syntax
- a0044da: Use @ citation syntax for citation groups in typst
- Updated dependencies [a0044da]
  - myst-frontmatter@1.1.20
  - myst-common@1.1.20
  - myst-spec-ext@1.1.20

## 0.0.6

### Patch Changes

- 5737951e: Remove hidden blocks for rendered outputs.
- Updated dependencies [5737951e]
  - myst-spec-ext@1.1.10
  - myst-common@1.1.10
  - myst-frontmatter@1.1.10

## 0.0.5

### Patch Changes

- 7752cb70: Bump dependency versions
- Updated dependencies [7752cb70]
- Updated dependencies [ba0441a0]
  - myst-common@1.1.5
  - myst-frontmatter@1.1.5
  - myst-spec-ext@1.1.5

## 0.0.4

### Patch Changes

- ca4e462: Update math conversion package

## 0.0.3

### Patch Changes

- 143a66fe: Add smallcaps support
- 143a66fe: Escaped symbols for bold
- 143a66fe: Add comment escape pattern
- Updated dependencies [ac650f5d]
- Updated dependencies [8f687eba]
  - myst-common@1.1.1
  - myst-frontmatter@1.1.1
  - myst-spec-ext@1.1.1
