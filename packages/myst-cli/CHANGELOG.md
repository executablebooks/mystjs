# myst-cli

## 1.3.21

### Patch Changes

- 884bd8d4: Change from twitter to bluesky
- 415ed13: Update DOI utils to ensure a `.` is present after the 10
- a4b5d484: Update comment in gh action
- Updated dependencies [415ed13]
- Updated dependencies [7f29af8a]
  - myst-frontmatter@1.7.7
  - myst-to-jats@1.0.32
  - myst-to-typst@0.0.30
  - myst-common@1.7.7
  - myst-config@1.7.7
  - myst-spec-ext@1.7.7

## 1.3.20

### Patch Changes

- 93af5a1c: Prevent html outputs that translate to empty images
- 1127a5a7: Prioritize project-level parts for project-level typst export
- cefb2a15: join gates plugin moved before blocks
- 1f3ff1e4: Do not findExistingJupyterServer when using execute
- 7ed91dac: Remove hidden output nodes from PDF exports
- 479db78c: Remove broken and unused reactive roles.
- Updated dependencies [6f77bda2]
- Updated dependencies [67bc9b8d]
- Updated dependencies [cd69d47]
- Updated dependencies [a6575fa9]
- Updated dependencies [ea19e66c]
- Updated dependencies [7afc6917]
- Updated dependencies [67bc9b8d]
- Updated dependencies [0d82810f]
- Updated dependencies [9457a8de]
- Updated dependencies [2ab9bfdf]
- Updated dependencies [2c8fa97d]
- Updated dependencies [e3309c24]
- Updated dependencies [9717b067]
- Updated dependencies [cefb2a15]
- Updated dependencies [4979d3c3]
- Updated dependencies [71018741]
- Updated dependencies [c5e51589]
- Updated dependencies [6f6032b7]
- Updated dependencies [3b05051d]
- Updated dependencies [a11731a1]
- Updated dependencies [3950dcaa]
- Updated dependencies [7d6dff27]
  - myst-to-typst@0.0.29
  - myst-execute@0.1.2
  - myst-common@1.7.6
  - myst-to-docx@1.0.13
  - myst-to-jats@1.0.31
  - myst-to-tex@1.0.41
  - myst-to-md@1.0.15
  - myst-parser@1.5.10
  - myst-transforms@1.3.29
  - myst-frontmatter@1.7.6
  - myst-config@1.7.6
  - myst-spec-ext@1.7.6
  - tex-to-myst@1.0.41

## 1.3.19

### Patch Changes

- 416fc41: Add support for avi -> mp4
- 416fc41: Add mov -> mp4 conversion with ffmpeg
- Updated dependencies [0dc62c76]
- Updated dependencies [0dc62c76]
- Updated dependencies [0dc62c76]
- Updated dependencies [3aa40b03]
- Updated dependencies [0dc62c76]
- Updated dependencies [0dc62c76]
- Updated dependencies [d7a6fddd]
- Updated dependencies [0dc62c76]
  - myst-to-typst@0.0.28
  - myst-transforms@1.3.28
  - myst-ext-exercise@1.0.9
  - myst-ext-proof@1.0.12
  - myst-ext-grid@1.0.9
  - myst-ext-tabs@1.0.9
  - myst-parser@1.5.9

## 1.3.18

### Patch Changes

- 6f23a6ec: Do not report version updates for whitelabelled binaries
- Updated dependencies [8ea9365]
  - myst-frontmatter@1.7.5
  - myst-common@1.7.5
  - myst-config@1.7.5
  - myst-spec-ext@1.7.5

## 1.3.17

### Patch Changes

- f888081: Add page breaks to multipage typst export
- Updated dependencies [f888081]
- Updated dependencies [fe236580]
- Updated dependencies [f888081]
  - myst-to-typst@0.0.27
  - tex-to-myst@1.0.40
  - myst-to-tex@1.0.40

## 1.3.16

### Patch Changes

- Updated dependencies [eb411d0b]
- Updated dependencies [3ce5404c]
- Updated dependencies [6ded5d1]
- Updated dependencies [fd78758e]
- Updated dependencies [f7e83852]
- Updated dependencies [dd4569b9]
  - myst-spec-ext@1.7.4
  - myst-to-typst@0.0.26
  - tex-to-myst@1.0.39
  - myst-common@1.7.4
  - myst-config@1.7.4
  - myst-frontmatter@1.7.4
  - myst-to-tex@1.0.39
  - myst-parser@1.5.8
  - myst-transforms@1.3.27

## 1.3.15

### Patch Changes

- 02a8c3a9: Add webp-->png conversion
- 2bce565: Add site option to include folder structure in url paths
- Updated dependencies [2bce565]
- Updated dependencies [b9de3469]
- Updated dependencies [7547b1dd]
  - myst-common@1.7.3
  - jtex@1.0.20
  - myst-to-typst@0.0.25
  - myst-config@1.7.3
  - myst-frontmatter@1.7.3
  - myst-spec-ext@1.7.3

## 1.3.14

### Patch Changes

- Updated dependencies [ce3c11c]
  - myst-ext-exercise@1.0.8
  - myst-ext-reactive@1.0.9
  - myst-transforms@1.3.26
  - myst-ext-proof@1.0.11
  - myst-templates@1.0.23
  - myst-ext-card@1.0.9
  - myst-ext-grid@1.0.8
  - myst-ext-icon@0.0.2
  - myst-ext-tabs@1.0.8
  - myst-to-typst@0.0.24
  - myst-execute@0.1.1
  - myst-to-docx@1.0.12
  - myst-to-jats@1.0.30
  - myst-parser@1.5.7
  - myst-to-tex@1.0.38
  - tex-to-myst@1.0.38
  - myst-to-md@1.0.14
  - jtex@1.0.19

## 1.3.13

### Patch Changes

- 4a3ee6db: Consume frontmatter parts in static exports
- 91b85911: Bump action versions.
- 40ea2dd1: Fix favicon writing
- 4a3ee6db: Load frontmatter parts as separate files for processing
- b14e0fb3: Force exit when the task is complete.
- 4a3ee6db: Fix local image paths for embedded nodes
- 4a3ee6db: Keep track of implicit vs. explicit pages in project TOC
- 4a3ee6db: Support parts in site config
- 4a3ee6db: Parse project-level parts to mdast
- 4a3ee6db: Update processing to handle parts files
- Updated dependencies [4a3ee6db]
- Updated dependencies [897136f]
- Updated dependencies [4a3ee6db]
- Updated dependencies [918223b8]
- Updated dependencies [b14e0fb3]
- Updated dependencies [4a3ee6db]
- Updated dependencies [4a3ee6db]
- Updated dependencies [4a3ee6db]
  - myst-to-jats@1.0.29
  - myst-common@1.7.2
  - myst-frontmatter@1.7.2
  - myst-cli-utils@2.0.11
  - myst-spec-ext@1.7.2
  - myst-config@1.7.2

## 1.3.12

### Patch Changes

- 64a33837: Consume new license simplification function
- 3c65de0: Deprecate biblio in favor of complete volume/issue objects
- Updated dependencies [53fcd2ba]
- Updated dependencies [64a33837]
- Updated dependencies [3c65de0]
- Updated dependencies [64a33837]
- Updated dependencies [3c65de0]
  - myst-to-typst@0.0.23
  - myst-to-md@1.0.13
  - myst-frontmatter@1.7.1
  - myst-to-jats@1.0.28
  - myst-common@1.7.1
  - myst-config@1.7.1
  - myst-spec-ext@1.7.1

## 1.3.11

### Patch Changes

- fd4a7c3: Protect against circular references in logs
- c02b1dcd: Update unist-util-visit deps

## 1.3.10

### Patch Changes

- 5f8f0b0d: Add support for seach index generation
- 9f50eb8: 💦 building widget state
- Updated dependencies [5f8f0b0d]
- Updated dependencies [a550afdc]
- Updated dependencies [d0532699]
  - myst-spec-ext@1.7.0
  - myst-to-typst@0.0.22
  - citation-js-utils@1.2.6
  - myst-common@1.7.0
  - myst-config@1.7.0
  - myst-frontmatter@1.7.0

## 1.3.9

### Patch Changes

- 760e411: Enable site options on each page
- Updated dependencies [594a0f87]
- Updated dependencies [e3c3efa7]
- Updated dependencies [a2519bb3]
- Updated dependencies [5d5c2893]
- Updated dependencies [760e411]
- Updated dependencies [adb3c75a]
  - myst-to-tex@1.0.37
  - tex-to-myst@1.0.37
  - myst-execute@0.1.0
  - myst-frontmatter@1.6.1
  - myst-common@1.6.1
  - myst-config@1.6.1
  - myst-spec-ext@1.6.1

## 1.3.8

### Patch Changes

- Updated dependencies [822fd2d5]
- Updated dependencies [c758f1b5]
- Updated dependencies [0a516e5]
- Updated dependencies [41d8f35e]
  - myst-to-tex@1.0.36
  - myst-ext-reactive@1.0.8
  - myst-ext-card@1.0.8
  - myst-parser@1.5.6
  - myst-execute@0.0.9
  - tex-to-myst@1.0.36
  - myst-transforms@1.3.25

## 1.3.7

## 1.3.6

### Patch Changes

- 0812009a: Fix TOC upgrade
- 9864473: Quiet webp warnings to debug
- 8ba7b73a: Add `ValidatedMystPlugin` to make types more strict
- Updated dependencies [9c28805a]
- Updated dependencies [85db77c7]
- Updated dependencies [9c1b8c73]
- Updated dependencies [8ba7b73a]
  - myst-ext-icon@0.0.1
  - myst-spec-ext@1.6.0
  - myst-frontmatter@1.6.0
  - myst-common@1.6.0
  - myst-config@1.6.0
  - myst-parser@1.5.5
  - myst-transforms@1.3.24

## 1.3.5

### Patch Changes

- 75b07331: Favicon is written as text rather than binary
- 64e11918: Suppress punycode deprecation warning
- fab598e9: Fix slug generation for JSON paths
- c0918b5f: Only write gitignore if it is not already ignored
- Updated dependencies [60fc2574]
- Updated dependencies [d1d3cda9]
- Updated dependencies [85520edd]
- Updated dependencies [da224b78]
- Updated dependencies [88396dd]
- Updated dependencies [5ac2d0bc]
- Updated dependencies [4e880f3e]
- Updated dependencies [0625105e]
- Updated dependencies [e2b74f4d]
- Updated dependencies [1a5f3f33]
- Updated dependencies [85520edd]
  - myst-transforms@1.3.23
  - myst-frontmatter@1.5.4
  - simple-validators@1.1.0
  - myst-parser@1.5.4
  - myst-spec-ext@1.5.4
  - tex-to-myst@1.0.35
  - myst-common@1.5.4
  - myst-config@1.5.4
  - myst-to-tex@1.0.35

## 1.3.4

### Patch Changes

- 857c5acf: Add raw directives/roles for inserting tex/typst-specific content
- Updated dependencies [313b218]
- Updated dependencies [857c5acf]
- Updated dependencies [313b218]
  - myst-templates@1.0.22
  - myst-spec-ext@1.5.3
  - myst-to-typst@0.0.21
  - myst-to-tex@1.0.34
  - myst-frontmatter@1.5.3
  - myst-common@1.5.3
  - myst-config@1.5.3
  - tex-to-myst@1.0.34
  - myst-parser@1.5.3
  - myst-transforms@1.3.22

## 1.3.3

### Patch Changes

- 8b75342d: Fix handling of remove- for exports
- Updated dependencies [05b5e40e]
- Updated dependencies [706d01e8]
- Updated dependencies [8b75342d]
  - citation-js-utils@1.2.5
  - myst-to-typst@0.0.20
  - myst-to-tex@1.0.33
  - tex-to-myst@1.0.33

## 1.3.2

### Patch Changes

- 0f78ea1d: Prevent crash on non-list tags for code-cell
- ee0378e3: Change pattern expansion to a flat list of files
- 999d34a1: Fix execution for non-site builds
- 134598fd: Add index directives/roles to myst-cli
- 38a45645: Add CITATION.cff build target
- 3fd53be8: Add better validation and post-processing to JSON files
- Updated dependencies [0b3bf03]
- Updated dependencies [0b3bf03]
- Updated dependencies [134598fd]
- Updated dependencies [1ac4d7a6]
- Updated dependencies [0b3bf03]
- Updated dependencies [134598fd]
- Updated dependencies [38a45645]
- Updated dependencies [3fd53be8]
  - myst-to-typst@0.0.19
  - myst-to-tex@1.0.32
  - citation-js-utils@1.2.4
  - myst-templates@1.0.21
  - myst-transforms@1.3.21
  - myst-common@1.5.2
  - myst-frontmatter@1.5.2
  - myst-config@1.5.2
  - myst-spec-ext@1.5.2
  - tex-to-myst@1.0.32
  - myst-parser@1.5.2

## 1.3.1

### Patch Changes

- 752ebcf: Fall back to 'convert' command for imagemagick
- b3e9df9d: Update to Project Jupyter and change all URLs
- Updated dependencies [b3e9df9d]
  - citation-js-utils@1.2.3
  - myst-ext-exercise@1.0.7
  - myst-ext-reactive@1.0.7
  - simple-validators@1.0.6
  - myst-frontmatter@1.5.1
  - myst-transforms@1.3.20
  - myst-cli-utils@2.0.10
  - myst-ext-proof@1.0.10
  - myst-templates@1.0.20
  - myst-ext-card@1.0.7
  - myst-ext-grid@1.0.7
  - myst-ext-tabs@1.0.7
  - myst-spec-ext@1.5.1
  - myst-to-typst@0.0.18
  - myst-execute@0.0.8
  - myst-to-docx@1.0.11
  - myst-to-jats@1.0.27
  - myst-common@1.5.1
  - myst-config@1.5.1
  - myst-parser@1.5.1
  - myst-to-tex@1.0.31
  - tex-to-myst@1.0.31
  - myst-to-md@1.0.12
  - myst-toc@0.1.2
  - jtex@1.0.18

## 1.3.0

### Minor Changes

- 4f51370f: Add Jupyter Book upgrade feature
- 0576d5ad: Add support for executable (IPC) plugins

### Patch Changes

- 0576d5ad: Add support for whitelabelling
- 0576d5ad: Add support for .myst.json files
- 167238b6: Support multiple articles with meca like jats
- e4698ac3: Use 'magick' command instead of 'convert' for imagemagick
- 004f1e28: Do not warn on uppercase image extensions
- Updated dependencies [8e486e56]
- Updated dependencies [8c487991]
- Updated dependencies [28642fe]
- Updated dependencies [661039d4]
- Updated dependencies [19e96e27]
- Updated dependencies [f6aa726c]
- Updated dependencies [1239104c]
- Updated dependencies [372de44c]
- Updated dependencies [0576d5ad]
- Updated dependencies [478c4d4f]
- Updated dependencies [848b6d8b]
  - myst-parser@1.5.0
  - myst-frontmatter@1.5.0
  - myst-execute@0.0.7
  - myst-transforms@1.3.19
  - myst-common@1.5.0
  - myst-config@1.5.0
  - myst-spec-ext@1.5.0

## 1.2.9

### Patch Changes

- 410d8006: Remove doi requests to handle.net
- 6326cf59: Optimize project thumbnail/banner and fallback correctly
- 19d8ef14: Include ipynb metadata in frontmatter
- 603019b: Fix exclude glob/path resolution
- ef6b23bc: Share doi request limiter across session
- fc79fb1e: Prevent generation of random temp*id*\* citation labels
- a00b7f79: Add gitignore support to myst init
- a8a745b3: Update the myst init default template
- Updated dependencies [fc79fb1e]
- Updated dependencies [8fb32d3a]
- Updated dependencies [fc79fb1e]
- Updated dependencies [1e2092dc]
- Updated dependencies [2a8fe63f]
- Updated dependencies [cc68b984]
- Updated dependencies [de4c3912]
  - citation-js-utils@1.2.2
  - tex-to-myst@1.0.30
  - myst-common@1.4.7
  - myst-transforms@1.3.18
  - myst-config@1.4.7
  - myst-frontmatter@1.4.7
  - myst-spec-ext@1.4.7
  - myst-to-tex@1.0.30

## 1.2.8

### Patch Changes

- 464b955f: Fix cross references for static sites
- 4cea894: Combine site options when using config extend
- fec350ab: Allow remote files for template/site options
- Updated dependencies [1b6ee5e2]
- Updated dependencies [4cea894]
- Updated dependencies [fec350ab]
  - myst-transforms@1.3.17
  - myst-frontmatter@1.4.6
  - myst-templates@1.0.19
  - myst-common@1.4.6
  - myst-config@1.4.6
  - myst-spec-ext@1.4.6

## 1.2.7

### Patch Changes

- 61b7795: Update doi fetching to resolve 429 too many request errors

## 1.2.6

### Patch Changes

- 10e80d03: Modify index file selection - allow tex, prefer index.ipynb over non-index md
- 90446d99: Error if toc index file has children
- 2c3290be: Add build command to write remote doi citations to bibtex
- 2c3290be: Fall back to handle.net if doi.org fails
- 286ceaaf: Fetch config files from url
- a665cb14: Surface warnings during tocfile extension resolution
- 2c3290be: Normalize doi keys in in-memory doi cache
- b2736fa4: Add a log message for slow web requests
- 2c3290be: Prioritize dois from bibtex over remote fetching
- 10e80d03: Resolve toc patterns in intentional order
- Updated dependencies [ad969c37]
- Updated dependencies [20beec96]
- Updated dependencies [3d93fdb9]
  - myst-frontmatter@1.4.5
  - myst-toc@0.1.1
  - myst-transforms@1.3.16
  - myst-common@1.4.5
  - myst-config@1.4.5
  - myst-spec-ext@1.4.5
  - myst-parser@1.4.4

## 1.2.5

### Patch Changes

- 65ade89: Consume new math structure
- Updated dependencies [dd007024]
- Updated dependencies [65ade89]
- Updated dependencies [65ade89]
- Updated dependencies [65ade89]
- Updated dependencies [65ade89]
- Updated dependencies [435c4329]
  - myst-transforms@1.3.15
  - simple-validators@1.0.5
  - myst-to-typst@0.0.17
  - myst-to-tex@1.0.29
  - myst-frontmatter@1.4.4
  - myst-common@1.4.4
  - myst-config@1.4.4
  - myst-spec-ext@1.4.4
  - tex-to-myst@1.0.29

## 1.2.4

### Patch Changes

- 8e7ac4ae: Fix cross references for same-site, different-page embeds
- e82914e2: More specific error for invalid xref embed
- f4d5231: Support circular deps and live reloading for extending config
- f4d5231: Load and fill frontmatter from extend config key
- f4d5231: Add extend key to top-level config
- f4d5231: Refactor config loading to separate validation from saving
- e82914e2: Better error messages for empty link text
- 72a127c3: Fix embed mdast structure for executable content
- Updated dependencies [f4d5231]
- Updated dependencies [f4d5231]
- Updated dependencies [dfbcb62d]
- Updated dependencies [e82914e2]
  - myst-frontmatter@1.4.3
  - myst-config@1.4.3
  - myst-transforms@1.3.14
  - myst-common@1.4.3
  - myst-spec-ext@1.4.3

## 1.2.3

### Patch Changes

- 9e311c38: Switch to structuredClone
- b86d6216: Fix ROR linking and transform ordering bug
- 25f4d83: Fix bug where intersphinx xrefs do not resolve on first load
- Updated dependencies [9e311c38]
  - myst-common@1.4.2
  - myst-transforms@1.3.13
  - myst-config@1.4.2
  - myst-frontmatter@1.4.2
  - myst-spec-ext@1.4.2
  - myst-parser@1.4.3

## 1.2.2

### Patch Changes

- 61c7291: Consume improved node selection utils for embed content
- 61c7291: Add caching to external myst data loading
- 61c7291: Support cite-style syntax for myst xrefs
- 61c7291: Support file#id style labels on embed node
- 4661c479: Support for bioRxiv URLs
- 61c7291: Links with file and target resolve as cross-references
- 61c7291: Update embed transform to allow myst project cross-references
- 61c7291: Move target node selection utils to myst-common
- 1e24a9f7: Add ROR link resolvers
- 61c7291: Centralize caching logic and add max-age
- 99adfdcd: Change priority of mp4 to prefer video over images if both are available
- Updated dependencies [61c7291]
- Updated dependencies [da9ca5b2]
- Updated dependencies [9bd9ec83]
- Updated dependencies [61c7291]
- Updated dependencies [7c6f45c4]
- Updated dependencies [61c7291]
- Updated dependencies [61c7291]
- Updated dependencies [61c7291]
- Updated dependencies [1e24a9f7]
  - myst-spec-ext@1.4.1
  - myst-transforms@1.3.12
  - myst-common@1.4.1
  - myst-config@1.4.1
  - myst-frontmatter@1.4.1

## 1.2.1

### Patch Changes

- ab863c8a: Change loadIntersphinx -> loadReferences and include MyST xrefs
- ab863c8a: Alias name/label in prjoect/page frontmatter and respect as identifiers
- ab863c8a: Write myst.xref.json file to site
- ab863c8a: Fill enumerator strings for external project xrefs
- ab863c8a: Add transform to add link text from myst xrefs
- ab863c8a: Warn on duplicate identifiers across project pages
- ab863c8a: Add check for empty link text
- ab863c8a: Do not build pages that do not exist for static html export
- 7a04910f: Rename Toc to TOC
- Updated dependencies [ab863c8a]
- Updated dependencies [ab863c8a]
- Updated dependencies [ab863c8a]
- Updated dependencies [ab863c8a]
- Updated dependencies [ab863c8a]
- Updated dependencies [ab863c8a]
- Updated dependencies [ab863c8a]
- Updated dependencies [ab863c8a]
- Updated dependencies [7a04910f]
  - myst-transforms@1.3.11
  - myst-frontmatter@1.4.0
  - myst-spec-ext@1.4.0
  - myst-common@1.4.0
  - myst-config@1.4.0

## 1.2.0

### Minor Changes

- 243adf62: Update NodeJS minimum version

### Patch Changes

- 8c00333a: Support myst-theme.css in the dynamic export.
- 1734bffd: Included files remove frontmatter and update math/abbr
- 9a30092f: Support details/summary in HTML
- Updated dependencies [8851eca7]
- Updated dependencies [1734bffd]
- Updated dependencies [7efe77a0]
- Updated dependencies [9a30092f]
  - myst-to-typst@0.0.16
  - myst-to-tex@1.0.28
  - myst-transforms@1.3.10
  - tex-to-myst@1.0.28

## 1.1.56

### Patch Changes

- 327ee1a: Move localArticle export functions to legacy file
- 7ae68707: Bundle all static files
- 327ee1a: Move shared cli interfaces to myst-cli
- 327ee1a: Clarify options across build/process functions
- Updated dependencies [f90882dc]
  - citation-js-utils@1.2.1
  - myst-parser@1.4.2
  - myst-transforms@1.3.9

## 1.1.55

### Patch Changes

- 3b008cbb: Move from using `data.type = notebook-code` to `block.kind = notebook-code`
- 76903a73: Add gridItem
- 9b92af5f: Load plugins from all site projects
- 882eb90d: Use READTHEDOCS_CANONICAL_URL as baseurl if defined
- Updated dependencies [3b008cbb]
- Updated dependencies [69457615]
- Updated dependencies [e0cd47e3]
- Updated dependencies [76903a73]
- Updated dependencies [f656e572]
- Updated dependencies [a3e3aa0c]
- Updated dependencies [e0cd47e3]
  - myst-transforms@1.3.7
  - myst-spec-ext@1.3.0
  - myst-execute@0.0.6
  - myst-to-jats@1.0.26
  - myst-ext-exercise@1.0.6
  - myst-ext-reactive@1.0.6
  - myst-ext-proof@1.0.9
  - myst-templates@1.0.18
  - myst-ext-card@1.0.6
  - myst-ext-grid@1.0.6
  - myst-ext-tabs@1.0.6
  - myst-to-typst@0.0.15
  - myst-to-docx@1.0.10
  - myst-to-md@1.0.11
  - jtex@1.0.17
  - myst-common@1.3.0
  - myst-to-tex@1.0.27
  - myst-config@1.3.0
  - myst-frontmatter@1.3.0
  - tex-to-myst@1.0.27
  - myst-parser@1.4.0

## 1.1.54

### Patch Changes

- 2c4e3057: Allow getCitation node to be optional
- 80930b39: Add error_rules to turn off warnings and errors in the CLI.
- 94468fac: Add favicon.ico to the list of static html exports
- dbcef422: Define kernel path relative to server base-path
- Updated dependencies [37a03c23]
- Updated dependencies [2c4e3057]
- Updated dependencies [9271361]
- Updated dependencies [80930b39]
- Updated dependencies [dbcef422]
- Updated dependencies [54bb6522]
  - myst-transforms@1.3.6
  - myst-frontmatter@1.2.0
  - myst-common@1.2.0
  - myst-parser@1.3.0
  - myst-config@1.2.0
  - myst-execute@0.0.5
  - tex-to-myst@1.0.26
  - myst-spec-ext@1.2.0
  - myst-to-tex@1.0.26

## 1.1.53

### Patch Changes

- d17f6806: Support notebooks in include directive
- 8ca2c518: Do not error on invalid citation bibtex
- d17f6806: Support tex includes directly in myst processing
- d17f6806: Handle circular includes with nice errors and no infinite loops
- 5c9338a: Load citations from CSL and non-CSL
- 377034df: Fix typo in downloads error message
- 770c15f0: Support short DOIs and test them!
- 1be2c741: Lowercase the `R` language to `r` in a transform
- Updated dependencies [d17f6806]
- Updated dependencies [d17f6806]
- Updated dependencies [d17f6806]
- Updated dependencies [5c9338a]
- Updated dependencies [d17f6806]
- Updated dependencies [1be2c741]
  - myst-to-typst@0.0.14
  - myst-transforms@1.3.5
  - citation-js-utils@1.2.0
  - myst-to-jats@1.0.25

## 1.1.52

### Patch Changes

- be3befd: Fix circular deps
- Updated dependencies [be3befd]
- Updated dependencies [be3befd]
  - myst-frontmatter@1.1.35
  - myst-parser@1.2.3
  - myst-common@1.1.35
  - myst-config@1.1.35
  - myst-spec-ext@1.1.35
  - myst-transforms@1.3.4

## 1.1.51

### Patch Changes

- e0b9a122: Update inquirer
- 7d9ffa14: Typst compile in quotes
- c38cc28: Relax site action validation and move later in the build
- c38cc28: Add downloads to page/project frontmatter and site config
- 49fd6b98: Cell metadata from jupyter should not be serialized to `meta` on the block.
- Updated dependencies [5aa3ea2f]
- Updated dependencies [5aa3ea2f]
- Updated dependencies [6a57ab77]
- Updated dependencies [49fd6b98]
- Updated dependencies [7d9ffa14]
- Updated dependencies [d24ab936]
- Updated dependencies [c38cc28]
- Updated dependencies [c38cc28]
- Updated dependencies [5b6f367e]
- Updated dependencies [ab7fa83c]
  - myst-common@1.1.34
  - myst-parser@1.2.2
  - myst-execute@0.0.4
  - jtex@1.0.16
  - myst-to-typst@0.0.13
  - myst-config@1.1.34
  - myst-frontmatter@1.1.34
  - tex-to-myst@1.0.25
  - myst-transforms@1.3.3
  - myst-spec-ext@1.1.34
  - myst-to-tex@1.0.25

## 1.1.50

### Patch Changes

- 6a6f445: Avoid undefined bug when finding expressions
- 855414ff: Fix bug causing pdf exports to fail
- Updated dependencies [855414ff]
  - myst-common@1.1.33
  - myst-config@1.1.33
  - myst-frontmatter@1.1.33
  - myst-spec-ext@1.1.33

## 1.1.49

### Patch Changes

- bba5baf9: Refactor build for new collectExportOptions
- ebe65816: Fix term label fixing with typography quote enhancements
- bba5baf9: Error on no typst executable
- 117d6008: Case insensitivity in parts, and allow spaces when picking up JATS titles.
- bba5baf9: Refactor collectExportOptions for more flexibility
- bba5baf9: Update export validation for optional format
- Updated dependencies [bba5baf9]
- Updated dependencies [20108545]
- Updated dependencies [117d6008]
- Updated dependencies [ebe65816]
- Updated dependencies [d247a88]
- Updated dependencies [20108545]
- Updated dependencies [6f0183de]
- Updated dependencies [62620a8d]
- Updated dependencies [20108545]
- Updated dependencies [62620a8d]
- Updated dependencies [20108545]
- Updated dependencies [62620a8d]
- Updated dependencies [ffb239a9]
- Updated dependencies [20108545]
- Updated dependencies [ffb239a9]
- Updated dependencies [bba5baf9]
- Updated dependencies [20108545]
- Updated dependencies [117d6008]
- Updated dependencies [62620a8d]
- Updated dependencies [bba5baf9]
  - myst-common@1.1.32
  - myst-to-tex@1.0.24
  - tex-to-myst@1.0.24
  - myst-spec-ext@1.1.32
  - myst-frontmatter@1.1.32
  - myst-parser@1.2.1
  - myst-transforms@1.3.2
  - myst-config@1.1.32

## 1.1.48

### Patch Changes

- 8aca668f: Throw loud error if `typst` is not available
- Updated dependencies [1880a465]
- Updated dependencies [1880a465]
- Updated dependencies [1b3c9e24]
- Updated dependencies [22c5fff]
- Updated dependencies [1880a465]
- Updated dependencies [03914dff]
  - myst-common@1.1.31
  - tex-to-myst@1.0.23
  - myst-to-tex@1.0.23
  - myst-frontmatter@1.1.31
  - myst-to-typst@0.0.12
  - myst-config@1.1.31
  - myst-spec-ext@1.1.31
  - myst-parser@1.2.0
  - myst-transforms@1.3.1

## 1.1.47

### Patch Changes

- 42af3800: Add pullquotes, blockquotes and epigraph directives
- c0fdc221: Ignore hidden directories from watch
- Updated dependencies [974dde17]
- Updated dependencies [42af3800]
- Updated dependencies [42af3800]
- Updated dependencies [ca09d63]
  - myst-parser@1.1.0
  - myst-spec-ext@1.1.30
  - myst-transforms@1.3.0
  - myst-cli-utils@2.0.9
  - myst-common@1.1.30
  - myst-config@1.1.30
  - myst-frontmatter@1.1.30

## 1.1.46

### Patch Changes

- 77549eea: Expose max size for webp conversion
- cbad68cc: Add raw directive
- 77549eea: Expose max size webp conversion to cli
- Updated dependencies [a4c7a116]
- Updated dependencies [5565d60]
- Updated dependencies [cbad68cc]
- Updated dependencies [5565d60]
  - myst-transforms@1.2.5
  - myst-spec-ext@1.1.29
  - myst-frontmatter@1.1.29
  - myst-common@1.1.29
  - myst-config@1.1.29
  - myst-parser@1.0.24

## 1.1.45

### Patch Changes

- 3c9d9962: Log missing citations in the correct place
- cff47b14: Pull url from citation data and add to citation node
- cff47b14: Add better warning message for valid dois without bibtex
- cff47b14: Add enumerator to citations and cite nodes
- cff47b14: Add cli warnings for invalid citation labels
- Updated dependencies [b289f03e]
- Updated dependencies [cff47b14]
- Updated dependencies [3c9d9962]
- Updated dependencies [cff47b14]
- Updated dependencies [8c148f7]
- Updated dependencies [cff47b14]
- Updated dependencies [cff47b14]
- Updated dependencies [cff47b14]
  - myst-parser@1.0.23
  - citation-js-utils@1.1.2
  - myst-common@1.1.28
  - tex-to-myst@1.0.22
  - myst-spec-ext@1.1.28
  - myst-config@1.1.28
  - myst-frontmatter@1.1.28
  - myst-to-tex@1.0.22
  - myst-transforms@1.2.4

## 1.1.44

### Patch Changes

- 36decbb4: Move fetch function to session
- 36decbb4: Allow https proxy set as environment var
- f1ee6f7: Add id to project frontmatter and populate on init
- 4f5fe14e: Conform jats/meca export function interface to other export functions
- Updated dependencies [36decbb4]
- Updated dependencies [f1ee6f7]
  - myst-cli-utils@2.0.8
  - myst-templates@1.0.17
  - myst-execute@0.0.3
  - myst-to-jats@1.0.24
  - myst-frontmatter@1.1.27
  - myst-common@1.1.27
  - myst-config@1.1.27
  - myst-spec-ext@1.1.27

## 1.1.43

### Patch Changes

- 9bd29068: Cache successful linkcheck results to file
- 9bd29068: Add cache folder for intersphinx and doi fetches
- e81a169: Exclude files listed in project confg from myst build and watch
- Updated dependencies [84a89663]
- Updated dependencies [0234a0ff]
- Updated dependencies [9cdd2044]
- Updated dependencies [9cdd2044]
- Updated dependencies [9f359e2b]
- Updated dependencies [ab4c7201]
- Updated dependencies [822ee744]
- Updated dependencies [aa877413]
- Updated dependencies [5ed4fa65]
- Updated dependencies [aa877413]
- Updated dependencies [6a97176d]
- Updated dependencies [e81a169]
  - tex-to-myst@1.0.21
  - myst-common@1.1.26
  - myst-transforms@1.2.3
  - myst-to-jats@1.0.23
  - myst-to-tex@1.0.21
  - jtex@1.0.15
  - myst-config@1.1.26
  - myst-frontmatter@1.1.26
  - myst-spec-ext@1.1.26

## 1.1.42

### Patch Changes

- 4ac0833: Add tex-include to allow for input of sub-tex files
- b272e7a4: Add logs to mystmd build
- Updated dependencies [03db3a35]
- Updated dependencies [ada85e65]
- Updated dependencies [4ac0833]
- Updated dependencies [a3f877d5]
- Updated dependencies [4ac0833]
- Updated dependencies [4ac0833]
- Updated dependencies [4ac0833]
  - myst-frontmatter@1.1.25
  - citation-js-utils@1.1.1
  - myst-transforms@1.2.2
  - myst-to-typst@0.0.11
  - tex-to-myst@1.0.20
  - myst-common@1.1.25
  - myst-config@1.1.25
  - myst-spec-ext@1.1.25
  - myst-to-tex@1.0.20

## 1.1.41

## 1.1.40

### Patch Changes

- d2a2a41: Integrate myst-execute into the CLI
- Updated dependencies [1fcbbbc6]
- Updated dependencies [096baa0b]
- Updated dependencies [d5416ff8]
- Updated dependencies [d5416ff8]
- Updated dependencies [d2a2a41]
- Updated dependencies [d5416ff8]
  - myst-transforms@1.2.1
  - myst-to-jats@1.0.22
  - tex-to-myst@1.0.19
  - myst-execute@0.0.2
  - myst-spec-ext@1.1.24
  - myst-common@1.1.24
  - myst-config@1.1.24
  - myst-frontmatter@1.1.24
  - myst-to-tex@1.0.19

## 1.1.39

### Patch Changes

- 4d4116c5: Only parse frontmatter out of first notebook cell
- 2563fec: Upgrade redux
- 1b507308: Change github action to use v4 for setup-node and checkout
- 2ffd6cc9: Fix section level for single article exports
- 50416784: Add code cell metadata placeholder image to output children
- 4b5ca6a2: Add build ci option to not write versions
- 01322e48: Move IExpressionResult types to myst-common
- Updated dependencies [50416784]
- Updated dependencies [3fc3a353]
- Updated dependencies [d4013a6b]
- Updated dependencies [e2e6caa7]
- Updated dependencies [50416784]
- Updated dependencies [4b5ca6a2]
- Updated dependencies [01322e48]
- Updated dependencies [f7fd9053]
  - myst-frontmatter@1.1.23
  - citation-js-utils@1.1.0
  - tex-to-myst@1.0.18
  - myst-spec-ext@1.1.23
  - jtex@1.0.14
  - myst-common@1.1.23
  - myst-to-typst@0.0.10
  - myst-config@1.1.23
  - myst-to-tex@1.0.18

## 1.1.38

### Patch Changes

- 70ee1eae: Log errors on failed export builds
- 7596172: Support export toc
- 7596172: Allow projectFromToc to set part/chapter labels -1/0
- f78db0bf: Update myst-spec
- 860c2976: Bibtex with capital ARTICLE now no longer duplicates all entries
- 7596172: Fix typst zip exports to use correct extension
- 7596172: Allow page frontmatter in export articles
- 7596172: Change export articles into objects with file/title/level
- 7596172: Allow pdf extension for typst exports
- 7596172: Pass heading depth through multi-page transform
- 85ae9b4a: Support cross-references to file allowing labels on lifted headers
- 9178a214: Allow typst to have multiple pages for export (e.g. as a book)
- d0eab1c2: Support html outputs in static exports
- 7596172: Allow loading toc from an explicitly named, non-default toc file
- aa335d74: Basic title consumption in tex/typst exports
- 45823775: Supprt SVG not PDF in typst.
- aa335d74: Gather page frontmatter on load
- 7596172: Get export articles from project pages
- 7596172: Support jb-article toc with top-level sections
- 7596172: Simplify heading transform to use firstDepth and modify mdast processing correspondingly
- 7596172: Quick fix for export output name collisions across files
- 7596172: Fix build when myst.yml is specified as source file
- 7596172: Fix bug with invalid reprocessing of frontmatter during export
- aa335d74: Add heading depth transform to normalize headings
- d0eab1c2: Fix static output priority image > html > text
- Updated dependencies [7596172]
- Updated dependencies [f78db0bf]
- Updated dependencies [7596172]
- Updated dependencies [7596172]
- Updated dependencies [2be01f12]
- Updated dependencies [7596172]
- Updated dependencies [409adad8]
- Updated dependencies [7596172]
- Updated dependencies [7596172]
- Updated dependencies [85ae9b4a]
- Updated dependencies [d0eab1c2]
- Updated dependencies [a7e15710]
- Updated dependencies [9178a214]
- Updated dependencies [cb3bad07]
- Updated dependencies [9ea12b12]
- Updated dependencies [7596172]
- Updated dependencies [ffc1061f]
- Updated dependencies [405caef7]
- Updated dependencies [aa335d74]
- Updated dependencies [dd23c26f]
- Updated dependencies [7596172]
- Updated dependencies [d0eab1c2]
- Updated dependencies [4a496339]
- Updated dependencies [405caef7]
- Updated dependencies [aa335d74]
- Updated dependencies [2be01f12]
- Updated dependencies [d2e6e780]
- Updated dependencies [363c93c5]
- Updated dependencies [9ea12b12]
- Updated dependencies [2be01f12]
  - myst-frontmatter@1.1.22
  - myst-transforms@1.2.0
  - myst-ext-proof@1.0.8
  - myst-spec-ext@1.1.22
  - myst-to-docx@1.0.9
  - myst-to-jats@1.0.21
  - myst-common@1.1.22
  - myst-parser@1.0.22
  - myst-to-typst@0.0.9
  - myst-to-tex@1.0.17
  - myst-templates@1.0.16
  - jtex@1.0.13
  - tex-to-myst@1.0.17
  - myst-config@1.1.22

## 1.1.37

### Patch Changes

- b44980c2: Fix inline expression block metadata
- 134c26ab: Add watch to build command
- 9573382a: Changes processing of jupytext/myst style notebooks to ensure that `code-cell`s have a default output node associated with them and that any nested blocks containing a `code-cell` are lifted to the top level children of the root node.

  This should ensure proper representation of the document as a notebook, and ensure that it can be treated the same as a noteobok that originated in an `ipynb` by web front ends.

  Addresses:

  - https://github.com/jupyter-book/mystmd/pull/748
  - https://github.com/jupyter-book/mystmd/issues/816

- 134c26ab: Watch dependency files during myst start and build
- a9073876: Remove file extensions from latex include
- b44980c2: Support image inline expressions
- Updated dependencies [bfed37b]
- Updated dependencies [9573382a]
- Updated dependencies [134c26ab]
- Updated dependencies [bfed37b]
  - myst-to-typst@0.0.8
  - myst-transforms@1.1.19
  - myst-frontmatter@1.1.21
  - myst-common@1.1.21
  - myst-config@1.1.21
  - myst-spec-ext@1.1.21
  - myst-parser@1.0.21

## 1.1.36

### Patch Changes

- 6354420: Update versions of myst packages
- Updated dependencies [6354420]
- Updated dependencies [6354420]
  - myst-templates@1.0.15
  - myst-ext-exercise@1.0.5
  - myst-ext-reactive@1.0.5
  - myst-transforms@1.1.18
  - myst-ext-proof@1.0.7
  - myst-ext-card@1.0.5
  - myst-ext-grid@1.0.5
  - myst-ext-tabs@1.0.5
  - myst-to-docx@1.0.8
  - myst-to-jats@1.0.20
  - myst-parser@1.0.20
  - myst-to-tex@1.0.16
  - tex-to-myst@1.0.16
  - myst-to-md@1.0.10
  - jtex@1.0.12

## 1.1.35

### Patch Changes

- a0044da: Add typst invocation to typst export from cli
- a0044da: Update typst export to use jtex
- a0044da: Add typst export to CLI
- a0044da: Write terser bibtex when exporting
- Updated dependencies [a0044da]
- Updated dependencies [a0044da]
- Updated dependencies [a0044da]
- Updated dependencies [a0044da]
- Updated dependencies [a0044da]
- Updated dependencies [a0044da]
  - myst-to-typst@0.0.7
  - myst-templates@1.0.14
  - jtex@1.0.11
  - myst-frontmatter@1.1.20
  - myst-common@1.1.20
  - myst-config@1.1.20
  - myst-spec-ext@1.1.20

## 1.1.34

### Patch Changes

- 59e6521: Pass projectPath to loadFile whenever possible
- 6c9ce6fc: Fix error when article is not defined on meca export
- Updated dependencies [a58eddf2]
  - myst-frontmatter@1.1.19
  - myst-to-tex@1.0.15
  - myst-common@1.1.19
  - myst-config@1.1.19
  - myst-spec-ext@1.1.19
  - tex-to-myst@1.0.15

## 1.1.33

### Patch Changes

- 7e8d85e: Consume table changes
- Updated dependencies [1b4ec507]
- Updated dependencies [4846c7fa]
- Updated dependencies [d83e4b6f]
  - myst-transforms@1.1.16
  - myst-frontmatter@1.1.18
  - myst-common@1.1.18
  - myst-config@1.1.18
  - myst-spec-ext@1.1.18
  - myst-parser@1.0.18

## 1.1.32

### Patch Changes

- 97e6406b: Update HTML handlers for table content and citations
- 5e6d1d38: Return mutable copies from redux selectors
- Updated dependencies [ecc6b812]
- Updated dependencies [97e6406b]
- Updated dependencies [7bc50110]
- Updated dependencies [5e6d1d38]
- Updated dependencies [2403f376]
- Updated dependencies [2403f376]
- Updated dependencies [959c0a0]
- Updated dependencies [5e6d1d38]
  - myst-common@1.1.17
  - myst-transforms@1.1.15
  - myst-frontmatter@1.1.17
  - myst-to-jats@1.0.19
  - myst-spec-ext@1.1.17
  - myst-config@1.1.17
  - myst-parser@1.0.17

## 1.1.31

### Patch Changes

- 2904931: Move plural function to myst-common
- Updated dependencies [2904931]
  - myst-transforms@1.1.14
  - myst-cli-utils@2.0.7
  - myst-common@1.1.16
  - myst-config@1.1.16
  - myst-frontmatter@1.1.16
  - myst-spec-ext@1.1.16

## 1.1.30

### Patch Changes

- 2dfde615: Introduce mystToTex settings, including minted, listings, or verbatim
- c8a0ea09: Add math simplifications to build, for example, `$\_2# myst-cli will become a subscript.
- 6693972b: Consume multiple articles and preamble changes in exports
- 81a47ef5: Clean up basic transforms and types for subfigures
- Updated dependencies [6693972b]
- Updated dependencies [81a47ef5]
- Updated dependencies [81a47ef5]
- Updated dependencies [81a47ef5]
- Updated dependencies [81a47ef5]
- Updated dependencies [2dfde615]
- Updated dependencies [6693972b]
- Updated dependencies [81a47ef5]
- Updated dependencies [2dfde615]
- Updated dependencies [c6ac8619]
- Updated dependencies [edbab804]
- Updated dependencies [a63bc6a]
- Updated dependencies [c8a0ea09]
- Updated dependencies [edbab804]
- Updated dependencies [6693972b]
- Updated dependencies [81a47ef5]
- Updated dependencies [066fe279]
- Updated dependencies [9ff01e17]
- Updated dependencies [81a47ef5]
  - myst-to-tex@1.0.14
  - myst-transforms@1.1.13
  - myst-parser@1.0.16
  - myst-frontmatter@1.1.15
  - myst-to-jats@1.0.18
  - myst-templates@1.0.13
  - simple-validators@1.0.4
  - myst-spec-ext@1.1.15
  - myst-common@1.1.15
  - myst-config@1.1.15
  - tex-to-myst@1.0.14

## 1.1.29

### Patch Changes

- adb9121: Pass options to basicTransforms, including myst parser for caption parsing
- adb9121: Tidy up figures referencing other figures
- 4cb47395: Allow to individually hide stdout/stderr on a cell using a tag
- d9953976: Add output_matplotlib_strings as a project setting
- d9953976: Add `output_stderr` and `output_stdout` options to settings
- Updated dependencies [adb9121]
- Updated dependencies [ac9faabc]
- Updated dependencies [adb9121]
- Updated dependencies [d9953976]
- Updated dependencies [adb9121]
- Updated dependencies [d9953976]
- Updated dependencies [d9953976]
- Updated dependencies [d9953976]
  - myst-transforms@1.1.12
  - myst-config@1.1.14
  - myst-frontmatter@1.1.14
  - myst-common@1.1.14
  - myst-parser@1.0.15
  - myst-spec-ext@1.1.14

## 1.1.28

### Patch Changes

- 9410e8d: Fix circular dependencies
- b127d5e7: Do not duplicate site template options in redux store
- b127d5e7: Write myst-cli version in site config
- b127d5e7: Consume frontmatter parts alongside tagged parts
- b127d5e7: Transform frontmatter parts into blocks in the mdast
- b127d5e7: Resolve site logo path with other template options of type file
- b127d5e7: Template parts may now specify as_list
- b127d5e7: Consume frontmatter options for template/site options
- b127d5e7: Frontmatter parts each coerce to list
- Updated dependencies [9410e8d]
- Updated dependencies [dd8249c5]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [5bc1e96d]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
- Updated dependencies [b127d5e7]
  - myst-frontmatter@1.1.13
  - myst-parser@1.0.14
  - tex-to-myst@1.0.13
  - myst-config@1.1.13
  - myst-to-jats@1.0.17
  - myst-common@1.1.13
  - myst-templates@1.0.12
  - jtex@1.0.10
  - myst-transforms@1.1.11
  - myst-spec-ext@1.1.13
  - myst-to-tex@1.0.13

## 1.1.27

### Patch Changes

- 4534f995: Add table directive
- e25f20d9: Enable smartquotes
- c41e576e: Improve parsing of difficult DOIs.
- 32bec0dd: Turn off glossaries for raw tex output
- d5dcd0ac: Write thumbnails/banner back to redux store
- Updated dependencies [f15ec37b]
- Updated dependencies [01a0625]
- Updated dependencies [e25f20d9]
- Updated dependencies [4534f995]
- Updated dependencies [c41e576e]
- Updated dependencies [f15ec37b]
- Updated dependencies [f15ec37b]
- Updated dependencies [f15ec37b]
  - myst-frontmatter@1.1.12
  - myst-to-tex@1.0.12
  - jtex@1.0.9
  - myst-parser@1.0.13
  - myst-common@1.1.12
  - myst-transforms@1.1.10
  - simple-validators@1.0.3
  - myst-config@1.1.12
  - myst-spec-ext@1.1.12
  - tex-to-myst@1.0.12

## 1.1.26

### Patch Changes

- ae59eec: Fixes to file processing
- Updated dependencies [70748f52]
  - myst-transforms@1.1.9

## 1.1.25

### Patch Changes

- 116b1a5: Write images when serializing, not during mdast processing
  - myst-parser@1.0.12
  - myst-transforms@1.1.8

## 1.1.24

### Patch Changes

- 33140d21: Fix type in site config selector
- 5bd2985c: Cache mdast at full file path
- Updated dependencies [93b73d2]
  - myst-to-tex@1.0.11
  - tex-to-myst@1.0.11
  - myst-parser@1.0.11
  - myst-transforms@1.1.7

## 1.1.23

### Patch Changes

- f5da6486: Improve logging of MyST Template errors
- 5ede9051: Trim PDFs when converting to PNG, ensure WEBP conversion does not overwrite
- 3c5c5a6d: Improve plural function to add `y|ies` endings for words.
- 2c934d03: Specify port numbers for app and server ports
- f5da6486: Load raw/site/proj configs in single function with better caching
- f5da6486: Stop reloading files when getting raw frontmatter
- f5da6486: Export meca build functions
- Updated dependencies [fb4cb203]
- Updated dependencies [6c34634a]
- Updated dependencies [a8121e53]
- Updated dependencies [953dfe42]
- Updated dependencies [1574ff8]
- Updated dependencies [f5da6486]
- Updated dependencies [3980b6ff]
- Updated dependencies [3c5c5a6d]
- Updated dependencies [417efdc9]
- Updated dependencies [b211cc59]
- Updated dependencies [6c34634a]
- Updated dependencies [cd674261]
- Updated dependencies [e3edb2aa]
- Updated dependencies [417efdc9]
- Updated dependencies [52da08ee]
- Updated dependencies [ebe096b7]
- Updated dependencies [446f53ad]
- Updated dependencies [9010aa81]
- Updated dependencies [207b2f0f]
- Updated dependencies [a7f830af]
- Updated dependencies [1574ff8]
- Updated dependencies [b14b3a4a]
- Updated dependencies [417efdc9]
- Updated dependencies [95bd7567]
  - tex-to-myst@1.0.10
  - myst-to-jats@1.0.16
  - myst-to-tex@1.0.10
  - myst-templates@1.0.11
  - myst-cli-utils@2.0.6
  - myst-spec-ext@1.1.11
  - myst-frontmatter@1.1.11
  - myst-ext-proof@1.0.6
  - myst-transforms@1.1.6
  - myst-common@1.1.11
  - myst-config@1.1.11

## 1.1.22

### Patch Changes

- 34d4c2bd: Include transform was async, now awaiting it
- 8bd4ee2e: Improve HTML transforms for grouping and processing
- ff572f7: Write output content to file later in the transform process
- Updated dependencies [5737951e]
- Updated dependencies [5156d39d]
- Updated dependencies [34d4c2bd]
- Updated dependencies [8bd4ee2e]
- Updated dependencies [5737951e]
  - myst-spec-ext@1.1.10
  - myst-cli-utils@2.0.5
  - myst-transforms@1.1.5
  - myst-to-docx@1.0.7
  - myst-to-jats@1.0.15
  - myst-to-md@1.0.9
  - myst-to-tex@1.0.9
  - myst-common@1.1.10
  - myst-config@1.1.10
  - myst-frontmatter@1.1.10
  - tex-to-myst@1.0.9

## 1.1.21

### Patch Changes

- 6d0e4e3f: Allow for multiple types of abstracts in JATS
- ea86c404: Use updated meca package for writing
- 6e4977f: Delete temporary output files in reduceOutput transform
- 93900162: Add 'summary' to the list of known parts for `plain-text-summary` parts
- abdd546a: Create zero-indent XML by default (newlines, but no indentation)
- 3261536c: Update the comments in the github action
- 6d0e4e3f: Add acknowledgements to JATS renderer
- Updated dependencies [6d0e4e3f]
- Updated dependencies [e240579a]
- Updated dependencies [aecf6164]
- Updated dependencies [d25debf3]
- Updated dependencies [4846745e]
- Updated dependencies [912e8b54]
- Updated dependencies [ddf2a189]
- Updated dependencies [e240579a]
- Updated dependencies [912e8b54]
- Updated dependencies [6d0e4e3f]
- Updated dependencies [6fa758f8]
- Updated dependencies [74d48372]
- Updated dependencies [bb2cd4fb]
- Updated dependencies [09db3e25]
- Updated dependencies [651dd773]
- Updated dependencies [d25debf3]
- Updated dependencies [6d0e4e3f]
- Updated dependencies [51011604]
- Updated dependencies [6d0e4e3f]
- Updated dependencies [d25debf3]
- Updated dependencies [8fa5f438]
- Updated dependencies [3d2fe87e]
- Updated dependencies [651dd773]
- Updated dependencies [aecf6164]
- Updated dependencies [d25debf3]
- Updated dependencies [acffc6fa]
- Updated dependencies [fde21440]
- Updated dependencies [6d0e4e3f]
- Updated dependencies [27f48dba]
- Updated dependencies [6fa758f8]
- Updated dependencies [3d2fe87e]
- Updated dependencies [9303429b]
- Updated dependencies [0b090ca8]
- Updated dependencies [0e7a4895]
- Updated dependencies [08d3b3c8]
- Updated dependencies [abdd546a]
- Updated dependencies [08d3b3c8]
- Updated dependencies [6d0e4e3f]
- Updated dependencies [651dd773]
- Updated dependencies [3be5a920]
- Updated dependencies [09db3e25]
- Updated dependencies [eb6d80be]
- Updated dependencies [8fa5f438]
- Updated dependencies [8b7b5fe6]
  - myst-common@1.1.9
  - myst-to-jats@1.0.14
  - myst-templates@1.0.10
  - myst-transforms@1.1.4
  - myst-to-tex@1.0.8
  - tex-to-myst@1.0.8
  - myst-frontmatter@1.1.9
  - simple-validators@1.0.2
  - myst-ext-proof@1.0.5
  - myst-to-docx@1.0.6
  - myst-to-md@1.0.8
  - myst-config@1.1.9
  - myst-spec-ext@1.1.9
  - myst-parser@1.0.10

## 1.1.20

### Patch Changes

- cf23ba6a: Keep track of session clones for error reporting
- c154629: Add tex-zip to manuscripts included with meca
- e27bde2d: Fix up undefined types from selectors

## 1.1.19

### Patch Changes

- 2ad34da: Fix bug with async project/site loading
- 7f2a9a56: Update table of contents sorting for numbering (chapter10 is after chapter9)
- Updated dependencies [9a9b3953]
  - myst-transforms@1.1.3
  - myst-parser@1.0.9

## 1.1.18

### Patch Changes

- e846cf4: Add support for abbreviations in LaTeX (acronyms)
- 7741cb0e: Export loadPlugins function
- Updated dependencies [e846cf4]
  - myst-common@1.1.8
  - myst-to-tex@1.0.7
  - jtex@1.0.8
  - myst-config@1.1.8
  - myst-frontmatter@1.1.8
  - myst-spec-ext@1.1.8
  - tex-to-myst@1.0.7

## 1.1.17

### Patch Changes

- b74fb3c1: Add ruleId to file warnings in redux store
- 2743af51: Only process thumbnails for site builds not static exports
- b74fb3c1: Add ruleIds to all errors/warnings across myst-cli
- 2743af51: Eliminate some extra unwanted webp transforms
- ed7b430f: All instances of `name` options in directives can also use `label`. (e.g. in a figure or equation).
- 05132869: Update link to blog post about TOC changes <https://executablebooks.org/en/latest/blog/2021-06-18-update-toc/>
- 86c78957: Add MySTPlugin to common exported types
- 392ba779: Add `literalinclude` directive
- 757f1fe4: Do not add unknown citations to the bibliography.
- d35e02bc: Support for loading plugins in the session
- 99659250: Added support for glossaries and TEX/PDF export. Now it is possible to render glossaries in TeX and PDF documents.
- Updated dependencies [d35e02bc]
- Updated dependencies [4183c05c]
- Updated dependencies [b74fb3c1]
- Updated dependencies [ed7b430f]
- Updated dependencies [392ba779]
- Updated dependencies [4183c05c]
- Updated dependencies [757f1fe4]
- Updated dependencies [d35e02bc]
- Updated dependencies [392ba779]
- Updated dependencies [757f1fe4]
- Updated dependencies [239ae762]
- Updated dependencies [b74fb3c1]
- Updated dependencies [ed7b430f]
- Updated dependencies [86c78957]
- Updated dependencies [757f1fe4]
- Updated dependencies [d35e02bc]
- Updated dependencies [757f1fe4]
- Updated dependencies [d35e02bc]
- Updated dependencies [60cf9a53]
- Updated dependencies [757f1fe4]
- Updated dependencies [d35e02bc]
- Updated dependencies [d35e02bc]
- Updated dependencies [99659250]
  - myst-common@1.1.7
  - myst-ext-exercise@1.0.4
  - myst-ext-reactive@1.0.4
  - myst-ext-proof@1.0.4
  - myst-ext-card@1.0.4
  - myst-ext-grid@1.0.4
  - myst-ext-tabs@1.0.4
  - myst-transforms@1.1.2
  - myst-parser@1.0.8
  - myst-spec-ext@1.1.7
  - myst-cli-utils@2.0.4
  - myst-to-docx@1.0.5
  - myst-to-jats@1.0.13
  - myst-to-tex@1.0.6
  - tex-to-myst@1.0.6
  - myst-to-md@1.0.7
  - citation-js-utils@1.0.2
  - myst-config@1.1.7
  - jtex@1.0.7
  - myst-frontmatter@1.1.7

## 1.1.16

### Patch Changes

- 911d1b1: Consume myst-frontmatter Author -> Contributor type change
- Updated dependencies [911d1b1]
- Updated dependencies [911d1b1]
- Updated dependencies [911d1b1]
- Updated dependencies [911d1b1]
- Updated dependencies [911d1b1]
- Updated dependencies [911d1b1]
- Updated dependencies [911d1b1]
- Updated dependencies [911d1b1]
- Updated dependencies [59b54584]
  - myst-frontmatter@1.1.6
  - myst-to-jats@1.0.12
  - myst-templates@1.0.9
  - myst-common@1.1.6
  - myst-config@1.1.6
  - myst-spec-ext@1.1.6

## 1.1.15

### Patch Changes

- 7feeb49: 🏷 Tag reduced outputs as data.type.output
- Updated dependencies [7752cb70]
- Updated dependencies [ba0441a0]
- Updated dependencies [7752cb70]
  - myst-ext-exercise@1.0.3
  - myst-ext-reactive@1.0.3
  - myst-transforms@1.1.1
  - myst-ext-proof@1.0.3
  - myst-ext-card@1.0.3
  - myst-ext-grid@1.0.3
  - myst-ext-tabs@1.0.3
  - myst-to-docx@1.0.4
  - myst-to-jats@1.0.11
  - myst-common@1.1.5
  - myst-to-tex@1.0.5
  - tex-to-myst@1.0.5
  - myst-to-md@1.0.6
  - jtex@1.0.6
  - myst-frontmatter@1.1.5
  - myst-config@1.1.5
  - myst-spec-ext@1.1.5
  - myst-parser@1.0.7

## 1.1.14

### Patch Changes

- bc3e6a3f: checkLink is exported
- bc3e6a3f: selectFile resolves the input file path
- Updated dependencies [18f30dd]
  - myst-templates@1.0.8
  - jtex@1.0.5

## 1.1.13

### Patch Changes

- a5b188ac: Added location field to page data, dependencies and source fields which contains the path to the file relative to the project root. This is primarily used to appropraitely configure a thebe session with the correct notebook path.
- 55818f50: Add User-Agent to image and link fetches
- Updated dependencies [a5b188ac]
- Updated dependencies [2b318aa1]
  - myst-spec-ext@1.1.4
  - myst-templates@1.0.7
  - myst-common@1.1.4
  - myst-config@1.1.4
  - myst-frontmatter@1.1.4

## 1.1.12

### Patch Changes

- 0b2d47c1: Keep multiple outputs when reducing outputs for pdf/docx exports
- Updated dependencies [5f1ccfbe]
- Updated dependencies [2111cd0f]
- Updated dependencies [36fde09]
  - myst-to-jats@1.0.10

## 1.1.11

### Patch Changes

- cc8319ad: Handle notebook cell image attachments
- cc8319ad: Add transform to trim base64 urlSource values

## 1.1.10

### Patch Changes

- 2696fada: Add rich affiliations to frontmatter
- 24c0aae7: Move from Root in mdast to `GenericParent` to relax types
- fee1eea5: Translate mermaid and math code blocks by default.
- f7356fd0: Allow for an extra space between # and | in starting the labeled code cell.
- 24dcb725: Adjust notebook output image paths in mdast for pdf/docx exports
- 553eca1: Allow for `#| label` to come after an ipython magic.
- 2960da05: Transform code blocks with `math` language to be math blocks. This is GitHub markdown.
- Updated dependencies [2696fada]
- Updated dependencies [24c0aae7]
- Updated dependencies [d873b941]
- Updated dependencies [fee1eea5]
- Updated dependencies [d0ecdd74]
- Updated dependencies [30da1dab]
- Updated dependencies [2960da05]
  - myst-frontmatter@1.1.2
  - myst-transforms@1.1.0
  - myst-to-docx@1.0.3
  - myst-to-jats@1.0.9
  - myst-common@1.1.2
  - myst-parser@1.0.6
  - myst-templates@1.0.6
  - myst-config@1.1.2
  - myst-spec-ext@1.1.2

## 1.1.9

### Patch Changes

- eb32ae98: Add mathml to the exported JATS.
- Updated dependencies [eb32ae98]
  - myst-to-jats@1.0.8

## 1.1.8

### Patch Changes

- 915b9bc0: Update github.io domains to not have a BASE_PATH set in the actions
- e725666c: Fix github url for .github.io domains
- Updated dependencies [5dd77afe]
  - myst-transforms@1.0.6

## 1.1.7

### Patch Changes

- 8f687eba: Expose thumbnail on project if set on the index page
- 8f687eba: Allow thumbnail to be set on project or site
- Updated dependencies [ac650f5d]
- Updated dependencies [8f687eba]
  - myst-common@1.1.1
  - myst-frontmatter@1.1.1
  - myst-config@1.1.1
  - myst-spec-ext@1.1.1

## 1.1.6

### Patch Changes

- Updates to internal dependencies
- Updated dependencies [d67d5f7a]
- Updated dependencies [44ff6917]
- Updated dependencies [44ff6917]
- Updated dependencies
- Updated dependencies [50fddc70]
  - myst-to-tex@1.0.4
  - myst-common@1.1.0
  - myst-config@1.1.0
  - myst-frontmatter@1.1.0
  - myst-spec-ext@1.1.0
  - jtex@1.0.4
  - myst-cli-utils@2.0.3
  - myst-ext-card@1.0.2
  - myst-ext-exercise@1.0.2
  - myst-ext-grid@1.0.2
  - myst-ext-proof@1.0.2
  - myst-ext-reactive@1.0.2
  - myst-ext-tabs@1.0.2
  - myst-parser@1.0.5
  - myst-templates@1.0.5
  - myst-to-docx@1.0.2
  - myst-to-jats@1.0.7
  - myst-to-md@1.0.5
  - myst-transforms@1.0.5
  - tex-to-myst@1.0.4

## 1.1.5

### Patch Changes

- 1a191c89: Log errors instead of throwing on page frontmatter yaml load
- 7b72b097: Flatten blocks on embed nodes and embed nodes on container nodes
- 7b72b097: New Embed and Container node type in myst-spec-ext
- 28eed244: Do not log errors on copying folders in meca bundle
- 7b72b097: Add transform to replace figures with placeholders
- a4c3cdd7: Move isDirectory and copyFile functions from myst-cli to myst-cli-utils
- Updated dependencies [1a191c89]
- Updated dependencies [a4c3cdd7]
- Updated dependencies [7b72b097]
- Updated dependencies [7b72b097]
- Updated dependencies [f44ee18d]
- Updated dependencies [5f4770ab]
- Updated dependencies [a4c3cdd7]
- Updated dependencies [7b72b097]
  - myst-transforms@1.0.4
  - myst-templates@1.0.4
  - myst-spec-ext@1.0.3
  - myst-to-jats@1.0.6
  - myst-common@1.0.4
  - myst-cli-utils@2.0.2
  - myst-to-md@1.0.4
  - myst-parser@1.0.4

## 1.1.4

### Patch Changes

- f5915127: Improve latex logging errors
- 6a4f57b5: Notify about upgrades in the CLI
- 56872ae1: We are supporting LTS branches of node. This adds an additional check for >=16.
- Updated dependencies [016c55e7]
- Updated dependencies [016c55e7]
  - myst-templates@1.0.3
  - jtex@1.0.3
  - myst-to-jats@1.0.5

## 1.1.3

### Patch Changes

- ed0d571d: Add banner and bannerOptimized
- 2e66fe2c: Add URLs to project-level exports in site config
- Updated dependencies [ed0d571d]
  - myst-frontmatter@1.0.4
  - myst-config@1.0.2

## 1.1.2

### Patch Changes

- 1320ad98: Clean up tex errors associated with legends and empty outputs
- 1320ad98: Consolidate id deduplication/simplification for JATS to isolated myst-to-jats transforms
- 62da9929: Add note to top of github actions
- Updated dependencies [1320ad98]
- Updated dependencies [1320ad98]
  - myst-to-tex@1.0.3
  - myst-to-jats@1.0.4
  - tex-to-myst@1.0.3

## 1.1.1

### Patch Changes

- 18c513bb: Improve MECA export structure and contents for validation with meca js library
- 4df753a9: Add title and short_title to source dependency
- Updated dependencies [18c513bb]
- Updated dependencies [4df753a9]
  - myst-frontmatter@1.0.3
  - myst-common@1.0.3

## 1.1.0

### Minor Changes

The CLI is no longer exported directly from this package. Use `mystmd`.

### Patch Changes

- b0a2a34b: Move repositories from mystjs --> mystmd
- d33fd7a9: Add `myst init --gh-pages` to add the GitHub Action
- e3e03011: Fix race condition in project selection when writing to config
- Updated dependencies [b0a2a34b]
  - citation-js-utils@1.0.1
  - myst-ext-exercise@1.0.1
  - myst-ext-reactive@1.0.1
  - simple-validators@1.0.1
  - myst-frontmatter@1.0.2
  - myst-transforms@1.0.3
  - myst-cli-utils@2.0.1
  - myst-ext-proof@1.0.1
  - myst-templates@1.0.2
  - myst-ext-card@1.0.1
  - myst-ext-grid@1.0.1
  - myst-ext-tabs@1.0.1
  - myst-spec-ext@1.0.2
  - myst-to-docx@1.0.1
  - myst-to-jats@1.0.3
  - myst-common@1.0.2
  - myst-config@1.0.1
  - myst-parser@1.0.3
  - myst-to-tex@1.0.2
  - tex-to-myst@1.0.2
  - myst-to-md@1.0.3
  - jtex@1.0.2

## 1.0.5

### Patch Changes

- ab35bd09: Fix options on imagemagick commands
- ab35bd09: Return all temp folders and log files from export functions
- 438cdb28: Add download role
- 714b594f: Propagate identifiers from mystRoles and mystDirectives to their children when lifting
- Updated dependencies [714b594f]
  - myst-transforms@1.0.2
  - myst-parser@1.0.2

## 1.0.4

### Patch Changes

- 3b32538b: Add preliminary MECA export target
- 3b32538b: Incorporate myst-to-md into CLI, making md an export target
- 0410d194: Move from myst-tools.org --> mystmd.org
- Updated dependencies [6fa7f022]
- Updated dependencies [92fd39df]
- Updated dependencies [2c19d72c]
- Updated dependencies [3b32538b]
- Updated dependencies [3b32538b]
- Updated dependencies [3b32538b]
- Updated dependencies [3b32538b]
- Updated dependencies [0410d194]
  - tex-to-myst@1.0.1
  - myst-transforms@1.0.1
  - myst-frontmatter@1.0.1
  - myst-to-md@1.0.2
  - myst-templates@1.0.1
  - jtex@1.0.1
  - myst-to-tex@1.0.1

## 1.0.3

### Patch Changes

- Improve JATS export, including de-duplicating IDs.
- Updated dependencies
- Updated dependencies
  - myst-common@1.0.1
  - myst-to-jats@1.0.1

## 1.0.2

### Patch Changes

- 072e338e: support jupyter cell meta tags
- Updated dependencies [072e338e]
  - myst-spec-ext@1.0.1

## 1.0.1

### Patch Changes

- Updates to myst-directives and myst-to-md

## 1.0.0

### Major Changes

- 00c05fe9: Migrate to ESM modules

### Patch Changes

- Updated dependencies [00c05fe9]
- Updated dependencies [65efd6d6]
  - citation-js-utils@1.0.0
  - myst-ext-exercise@1.0.0
  - myst-ext-reactive@1.0.0
  - myst-transforms@1.0.0
  - myst-cli-utils@2.0.0
  - myst-ext-proof@1.0.0
  - myst-templates@1.0.0
  - myst-ext-card@1.0.0
  - myst-ext-grid@1.0.0
  - myst-ext-tabs@1.0.0
  - myst-spec-ext@1.0.0
  - myst-to-docx@1.0.0
  - myst-to-jats@1.0.0
  - myst-config@1.0.0
  - myst-parser@1.0.0
  - myst-to-tex@1.0.0
  - tex-to-myst@1.0.0
  - jtex@1.0.0

## 0.1.31

### Patch Changes

- f97d4d50: Add abbreviation frontmatter option to add abbreviations automatically to documents.
- de66ba19: Add glossary and term directives
- Updated dependencies [de66ba19]
- Updated dependencies [97518ca3]
- Updated dependencies [d068df65]
- Updated dependencies [f97d4d50]
- Updated dependencies [e530b082]
- Updated dependencies [de66ba19]
- Updated dependencies [83200b5c]
  - myst-transforms@0.0.32
  - myst-frontmatter@0.0.14
  - myst-templates@0.1.18
  - myst-parser@0.0.32
  - myst-to-tex@0.0.28
  - jtex@0.1.15
  - myst-config@0.0.16
  - myst-to-docx@0.0.24
  - myst-to-jats@0.0.30
  - tex-to-myst@0.0.28

## 0.1.30

### Patch Changes

- a7584e27: Add transform for gated directives
- 71e91665: Initial support for sphinx-exercise
- Updated dependencies [a7584e27]
- Updated dependencies [e98f86a6]
- Updated dependencies [330c0f08]
- Updated dependencies [1a8040e4]
- Updated dependencies [71e91665]
- Updated dependencies [bb019ae9]
  - myst-transforms@0.0.31
  - myst-to-tex@0.0.27
  - tex-to-myst@0.0.27
  - myst-ext-exercise@0.0.2
  - myst-parser@0.0.31
  - myst-to-jats@0.0.29

## 0.1.29

### Patch Changes

- 034ce741: Add pull requests and issues to known github links
- ce8932e0: Pick up frontmatter title that has a label/target node in front of it.
- Updated dependencies [034ce741]
- Updated dependencies [ce8932e0]
  - myst-transforms@0.0.30
  - myst-parser@0.0.30
  - myst-to-jats@0.0.28

## 0.1.28

### Patch Changes

- 78b7232e: Add support for sphinx proofs
- b2ac9d13: Add videos as mp4 using ![](my-video.mp4)
- Updated dependencies [78b7232e]
- Updated dependencies [79e24fd7]
- Updated dependencies [b2ac9d13]
  - myst-transforms@0.0.29
  - myst-common@0.0.17
  - myst-spec-ext@0.0.12
  - myst-parser@0.0.29
  - myst-ext-card@0.0.7
  - myst-ext-grid@0.0.7
  - myst-ext-proof@0.0.2
  - myst-ext-reactive@0.0.7
  - myst-ext-tabs@0.0.7
  - myst-templates@0.1.17
  - myst-to-docx@0.0.23
  - myst-to-jats@0.0.27
  - myst-to-tex@0.0.26
  - tex-to-myst@0.0.26

## 0.1.27

### Patch Changes

- 9f1a9788: Process exit on html build

## 0.1.26

### Patch Changes

- 96018fec: Link/xref url respects index url, dataUrl is also provided for accessing mdast
- 96018fec: Enable single project site with no project slug
- 7dacd1f0: Allow a static site build option
- b89b79e9: Improve the imagemagik command for layered EPS export
- e9c56681: Keep all static site assets in public folder, no \_static
- 96018fec: Default to article theme for site builds with no explicit projects
- Updated dependencies [96018fec]
- Updated dependencies [96018fec]
- Updated dependencies [7dacd1f0]
  - myst-transforms@0.0.28
  - myst-config@0.0.15
  - myst-cli-utils@0.0.12
  - jtex@0.1.14
  - myst-templates@0.1.16
  - myst-to-jats@0.0.26
  - myst-parser@0.0.28

## 0.1.25

### Patch Changes

- 01cdd78e: Allow output to be specified from the command line
- ff43d9c9: Fix crosslinked content for single file exports
- 79743342: Add inline evaluation role that pulls from user_expressions
- 84efceb6: Bug where we were not waiting for webp to be built, meaning large images!
- 01cdd78e: Have command line print jats rather than xml
- Updated dependencies [0c044516]
- Updated dependencies [8b1f65d9]
- Updated dependencies [79743342]
- Updated dependencies [fb0e9d7e]
- Updated dependencies [685bbe58]
- Updated dependencies [cb9c1f6a]
- Updated dependencies [da8abded]
- Updated dependencies [d3c120ee]
- Updated dependencies [ff43d9c9]
- Updated dependencies [09a34b20]
- Updated dependencies [3da85094]
- Updated dependencies [ff43d9c9]
- Updated dependencies [9a226245]
- Updated dependencies [da8abded]
  - myst-to-jats@0.0.25
  - myst-frontmatter@0.0.13
  - myst-spec-ext@0.0.11
  - myst-parser@0.0.27
  - myst-to-tex@0.0.25
  - tex-to-myst@0.0.25
  - myst-transforms@0.0.27
  - jtex@0.1.13
  - myst-config@0.0.14
  - myst-templates@0.1.15
  - myst-to-docx@0.0.22

## 0.1.24

### Patch Changes

- ac890599: Fix the types in myst-cli

## 0.1.23

### Patch Changes

- ea0c73b5: Add placeholder for end-to-end cli tests
- c7258e25: Consolidate export options logic and support multiple file exports
- Updated dependencies [a32e2aa2]
- Updated dependencies [caf45cd1]
  - myst-to-jats@0.0.24
  - myst-frontmatter@0.0.12
  - jtex@0.1.12
  - myst-config@0.0.13
  - myst-templates@0.1.14
  - myst-to-docx@0.0.21
  - myst-to-tex@0.0.24
  - tex-to-myst@0.0.24

## 0.1.22

### Patch Changes

- 2db5e057: Add p-limit to the dependencies
- Updated dependencies [3a42cd9e]
- Updated dependencies [8f502f5d]
  - myst-transforms@0.0.26
  - citation-js-utils@0.0.15
  - myst-to-jats@0.0.23
  - myst-parser@0.0.26

## 0.1.21

### Patch Changes

- 1670c49a: Do not publish local file paths to site json
- 624ea081: Add source url / key to embed nodes in mdast
- 5ba3b13f: Add bibliogrpahy from citations to JATS export backmatter
- d28b5e9d: Move KINDS --> SourceFileKind and move to myst-common
- Updated dependencies [c138efed]
- Updated dependencies [039a49a3]
- Updated dependencies [5ba3b13f]
- Updated dependencies [d28b5e9d]
- Updated dependencies [5ba3b13f]
  - myst-to-jats@0.0.22
  - myst-frontmatter@0.0.11
  - myst-common@0.0.16
  - citation-js-utils@0.0.14
  - jtex@0.1.11
  - myst-config@0.0.12
  - myst-templates@0.1.13
  - myst-to-docx@0.0.20
  - myst-to-tex@0.0.23
  - tex-to-myst@0.0.23
  - myst-ext-card@0.0.6
  - myst-ext-grid@0.0.6
  - myst-ext-reactive@0.0.6
  - myst-ext-tabs@0.0.6
  - myst-transforms@0.0.25
  - myst-parser@0.0.25

## 0.1.20

### Patch Changes

- c832b38e: myst-cli may now be used to build JATS xml exports
- c832b38e: FootnoteDefinitions remain on the mdast tree during processing
- 4619f158: Add prefix/suffix to inline citations
- Updated dependencies [8b76b444]
- Updated dependencies [c832b38e]
- Updated dependencies [98c47422]
- Updated dependencies [d6d41e51]
- Updated dependencies [e5fb426a]
- Updated dependencies [0ab667e5]
- Updated dependencies [c832b38e]
- Updated dependencies [c832b38e]
- Updated dependencies [265a8ed4]
  - citation-js-utils@0.0.13
  - myst-frontmatter@0.0.10
  - myst-to-tex@0.0.22
  - tex-to-myst@0.0.22
  - myst-spec-ext@0.0.10
  - myst-common@0.0.15
  - myst-transforms@0.0.24
  - myst-to-jats@0.0.21
  - jtex@0.1.10
  - myst-config@0.0.11
  - myst-templates@0.1.12
  - myst-to-docx@0.0.19
  - myst-ext-card@0.0.5
  - myst-ext-grid@0.0.5
  - myst-ext-reactive@0.0.5
  - myst-ext-tabs@0.0.5
  - myst-parser@0.0.24

## 0.1.19

### Patch Changes

- d12a6064: Move hash/copy file function from myst-cli to myst-cli-utils
- d12a6064: Support copying template files during export and writing relative paths; myst-cli uses this for tex exports
- 8e8d0fa9: Refactor image conversion transform for extensibility and code deduplication
- b383f68c: Resolve images with wildcard extensions to existing images
- Updated dependencies [d12a6064]
- Updated dependencies [762baee5]
- Updated dependencies [45ecdf86]
- Updated dependencies [45ecdf86]
- Updated dependencies [d12a6064]
- Updated dependencies [5a81cd36]
- Updated dependencies [44026903]
- Updated dependencies [3f800fc2]
- Updated dependencies [5fc02589]
  - myst-cli-utils@0.0.11
  - myst-to-tex@0.0.21
  - myst-parser@0.0.23
  - myst-spec-ext@0.0.9
  - jtex@0.1.9
  - myst-templates@0.1.11
  - myst-transforms@0.0.23
  - myst-to-docx@0.0.18
  - tex-to-myst@0.0.21

## 0.1.18

### Patch Changes

- 40beee4d: Prevent unwanted repeated site reload
- a965622a: Fix: project frontmatter is now respected with tex files
- Updated dependencies [3abbec6e]
- Updated dependencies [cf7b7004]
- Updated dependencies [78b30547]
- Updated dependencies [6713f432]
- Updated dependencies [6713f432]
- Updated dependencies [833be5a9]
- Updated dependencies [70519a00]
- Updated dependencies [826276dc]
- Updated dependencies [9cc49d1a]
- Updated dependencies [794fbc80]
- Updated dependencies [b4670ec4]
- Updated dependencies [55d64468]
- Updated dependencies [82b583ba]
  - myst-to-tex@0.0.20
  - tex-to-myst@0.0.20
  - myst-transforms@0.0.22
  - myst-spec-ext@0.0.8
  - citation-js-utils@0.0.12
  - myst-to-docx@0.0.17
  - myst-parser@0.0.22

## 0.1.17

### Patch Changes

- 9fcf25a9: Add citation nodes to myst-spec-ext
- 0859b295: Implement footnotes in myst-to-tex
- Updated dependencies [4da8eef5]
- Updated dependencies [452846eb]
- Updated dependencies [4da8eef5]
- Updated dependencies [4da8eef5]
- Updated dependencies [a353dba6]
- Updated dependencies [9fcf25a9]
- Updated dependencies [0859b295]
- Updated dependencies [efe55199]
- Updated dependencies [452846eb]
- Updated dependencies [8747eecd]
  - tex-to-myst@0.0.19
  - myst-to-docx@0.0.16
  - myst-to-tex@0.0.19
  - myst-spec-ext@0.0.7
  - myst-transforms@0.0.21
  - myst-parser@0.0.21

## 0.1.16

### Patch Changes

- Updated dependencies [f227a9e2]
- Updated dependencies [c643fa8e]
- Updated dependencies [f227a9e2]
- Updated dependencies [f227a9e2]
- Updated dependencies [7a78b7be]
- Updated dependencies [f227a9e2]
- Updated dependencies [ccd1d5ee]
  - myst-transforms@0.0.20
  - jtex@0.1.8
  - tex-to-myst@0.0.18
  - myst-frontmatter@0.0.9
  - myst-config@0.0.10
  - myst-templates@0.1.10
  - myst-to-docx@0.0.15
  - myst-to-tex@0.0.18
  - myst-parser@0.0.20

## 0.1.15

### Patch Changes

- a9913fc9: Update image conversion transform to handle EPS images
- Updated dependencies [9105d991]
  - myst-common@0.0.14
  - myst-parser@0.0.19
  - myst-ext-card@0.0.4
  - myst-ext-grid@0.0.4
  - myst-ext-reactive@0.0.4
  - myst-ext-tabs@0.0.4
  - myst-templates@0.1.9
  - myst-to-docx@0.0.14
  - myst-to-tex@0.0.17
  - myst-transforms@0.0.19
  - tex-to-myst@0.0.17

## 0.1.14

### Patch Changes

- 78bb237e: Support github-style admonitions, add the `simple` class
- 5f506356: Allow directives to have spaces, and trim the name before passing it onto other directives
- 8381c653: Allow admonitions to hide the icon
- Updated dependencies [78bb237e]
- Updated dependencies [a9f5bf70]
  - myst-transforms@0.0.18
  - myst-parser@0.0.18
  - myst-to-docx@0.0.13

## 0.1.13

### Patch Changes

- Updated dependencies
  - myst-common@0.0.13
  - myst-ext-card@0.0.3
  - myst-ext-grid@0.0.3
  - myst-ext-reactive@0.0.3
  - myst-ext-tabs@0.0.3
  - myst-templates@0.1.8
  - myst-to-docx@0.0.12
  - myst-to-tex@0.0.16
  - myst-transforms@0.0.17
  - tex-to-myst@0.0.16
  - myst-parser@0.0.17

## 0.1.12

### Patch Changes

- a22fafa0: Log parse errors with vfile
- 944ad031: Update myst.tools --> myst-tools.org
- ea89d8b2: Update admonition title to always be the argument.
- a22fafa0: Refactor role/directive implementations to allow declarative definitions. Pull all default roles/directives from mystjs and myst-cli into separate package with new implementation.
- a2a7044b: Deprecate codeBlockPlugin for the caption parsing, which now happens in myst-parser and myst-directives
- Updated dependencies [844d29fb]
- Updated dependencies [a22fafa0]
- Updated dependencies [944ad031]
- Updated dependencies [ea89d8b2]
- Updated dependencies [75b6bcb8]
- Updated dependencies [a22fafa0]
- Updated dependencies [a22fafa0]
- Updated dependencies [a22fafa0]
- Updated dependencies [a2a7044b]
  - myst-parser@0.0.16
  - jtex@0.1.7
  - myst-templates@0.1.7
  - myst-transforms@0.0.16
  - myst-ext-card@0.0.2
  - myst-ext-grid@0.0.2
  - myst-ext-reactive@0.0.2
  - myst-ext-tabs@0.0.2
  - myst-to-docx@0.0.11

## 0.1.11

### Patch Changes

- 037c8d58: Pull tab/grid/card directives into external packages

## 0.1.10

### Patch Changes

- dad0d6d0: Support PDF images in web and word export
- 81d3098e: Modify how doi references are counted to make log messages slightly more correct
- 81d3098e: Allow file loading to specify maxCharacters to nbtx minification, enabling text output in exports
- 52f0c028: Reload project on toc/bib file changes during site watch
- Updated dependencies [9f9954d2]
  - myst-frontmatter@0.0.8
  - jtex@0.1.6
  - myst-config@0.0.9
  - myst-templates@0.1.6
  - myst-to-docx@0.0.10
  - myst-to-tex@0.0.15
  - tex-to-myst@0.0.15

## 0.1.9

### Patch Changes

- 93fcaf3a: Log vfile errors from myst-to-tex pipeline
- 93fcaf3a: Support `include` node in myst-to-docx and myst-to-tex
- b8f3ccb2: Improve the logging around latex error messages
- Updated dependencies [93fcaf3a]
  - myst-to-docx@0.0.9
  - myst-to-tex@0.0.14
  - tex-to-myst@0.0.14

## 0.1.8

### Patch Changes

- 2f268d18: Embeded content from other pages resolves on single page PDF/docx export
- 2f268d18: Output nodes are reduced to simpler image/code nodes for static PDF/docx exports
- Updated dependencies [2f268d18]
  - myst-to-docx@0.0.8
  - myst-to-tex@0.0.13
  - tex-to-myst@0.0.13

## 0.1.7

### Patch Changes

- 9692b9dc: The `myst init` command currently triggers on any command, this now errors and shows help!
- 6da5544f: Update figure/image nodes to embed images if given a target instead of a file path / url
- 6da5544f: Embed block content (including notebook cells) based on block or code cell label in metadata
- 6da5544f: Fix inline DOIs to update references in tex/pdf export
- Updated dependencies [a1a4bd82]
- Updated dependencies [6da5544f]
- Updated dependencies [a1a4bd82]
- Updated dependencies [e1a2407f]
  - jtex@0.1.5
  - myst-transforms@0.0.15
  - myst-frontmatter@0.0.7
  - myst-config@0.0.8
  - myst-templates@0.1.5
  - myst-to-docx@0.0.7
  - myst-to-tex@0.0.12
  - tex-to-myst@0.0.12

## 0.1.6

### Patch Changes

- 8aa3b42b: Improve warning formatting and information capture for errors
- 1d823ca7: Remove dependence on @curvenote/blocks, migrate to nbtx 0.2.0
- a8a93ccb: Catch and mute additional spurious warnings in remix
- 90027bc0: Improve the ability of start function to recover from errors of changing or deleting files
- 89673078: Add timing information to word and latex exports
- 0aff6dc1: Expose short_title on the project pages and allow subtitle on project as well as pages
- 690626b0: Export a single file by default do everything!
- 32f0fb5b: Improve logging for exports when nothing is found
- 09f250a0: Allow myst init to be run simply by typing myst
- 61aa0d60: Pass in the hashing function to minifying notebooks
- 61aa0d60: Remove dependence on `crypto` package, which is built into node
- f40f398b: Move template listing to myst rather than jtex
  Be more explicit about looking for other templates, and allow template listing from local files.
- af6f3190: Add a `myst build --all` option
- ebb8aa2d: Improved error reporting for --write-toc
- 43f1553c: Improve onboarding of myst init
- Updated dependencies [61aa0d60]
- Updated dependencies [c27a0587]
- Updated dependencies [21af5ba9]
- Updated dependencies [8508c5e8]
- Updated dependencies [3769a662]
- Updated dependencies [dfc27de6]
- Updated dependencies [5436ab41]
- Updated dependencies [c522e2c5]
- Updated dependencies [0aff6dc1]
- Updated dependencies [5436ab41]
- Updated dependencies [dfc27de6]
- Updated dependencies [8b779cf7]
- Updated dependencies [61aa0d60]
- Updated dependencies [8cb35191]
- Updated dependencies [160e954f]
- Updated dependencies [770bb8da]
- Updated dependencies [f40f398b]
  - myst-to-docx@0.0.6
  - myst-frontmatter@0.0.6
  - jtex@0.1.4
  - myst-templates@0.1.4
  - myst-cli-utils@0.0.10
  - myst-config@0.0.7
  - myst-transforms@0.0.14
  - myst-to-tex@0.0.11
  - tex-to-myst@0.0.11

## 0.1.5

### Patch Changes

- Updated dependencies [27388448]
- Updated dependencies [c97bb569]
- Updated dependencies [8cdb5842]
  - myst-common@0.0.12
  - myst-to-docx@0.0.5
  - myst-to-tex@0.0.10
  - myst-transforms@0.0.13
  - jtex@0.1.3
  - myst-templates@0.1.3
  - tex-to-myst@0.0.10

## 0.1.4

### Patch Changes

- 3178dcda: Improve performance using cached mdast based on file hash
- 3178dcda: Look to known image extensions if the extension is not specified.
- 3178dcda: Add known bibtex files if they are explicitly specified.
- Updated dependencies [bfd72456]
- Updated dependencies [e7330dbb]
- Updated dependencies [8b545a0b]
- Updated dependencies [a79a78c4]
- Updated dependencies [0fa33b10]
- Updated dependencies [0a87866d]
- Updated dependencies [6ebaffda]
- Updated dependencies [e7330dbb]
- Updated dependencies [0e38fe7b]
- Updated dependencies [a5daa0d6]
  - myst-frontmatter@0.0.5
  - myst-common@0.0.11
  - tex-to-myst@0.0.2
  - simple-validators@0.0.3
  - myst-transforms@0.0.12
  - myst-cli-utils@0.0.9
  - jtex@0.1.2
  - myst-config@0.0.6
  - myst-templates@0.1.2
  - intersphinx@0.0.7

## 0.1.3

### Patch Changes

- Update jtex dependency

## 0.1.2

### Patch Changes

- ececeab6: Add option to throw error, rather than just log error, when exports fail
- ececeab6: Move template enums from myst-templates to myst-common
- Updated dependencies [4d41ccc3]
- Updated dependencies [ececeab6]
- Updated dependencies [ececeab6]
  - myst-config@0.0.5
  - myst-common@0.0.10
  - myst-templates@0.1.1
  - myst-to-tex@0.0.9

## 0.1.1

### Patch Changes

- 4e27734b: Default template may be passed directly to site build/start commands
- 4e27734b: Citations, Footnotes, and References type consolidated to myst-common
- Updated dependencies [4e27734b]
  - myst-common@0.0.9
  - myst-transforms@0.0.11

## 0.1.0

### Minor Changes

- d9b7457d: myst-cli now lets you initialize, build, and run myst sites locally

### Patch Changes

- 5403b5b5: Modify site frontmatter/config for templating - remove some fields, allow arbitrary template options, do not inherit from site frontmatter on page/project
- 48ae3284: Support basic callout admonitions that use the QMD format (e.g. `{.callout-tip}`). More to come in the future!
- e37dca1d: Add site build/start to myst-cli
- 11ff02b4: Update doi-utils to 1.0.9
- Updated dependencies [6439be3b]
- Updated dependencies [5403b5b5]
- Updated dependencies [5403b5b5]
- Updated dependencies [d9b7457d]
- Updated dependencies [adb6e7fa]
- Updated dependencies [4e1abca3]
- Updated dependencies [11ff02b4]
  - myst-to-tex@0.0.8
  - myst-config@0.0.4
  - myst-frontmatter@0.0.4
  - jtex@0.1.0
  - myst-templates@0.1.0
  - myst-transforms@0.0.10
  - myst-cli-utils@0.0.8
  - myst-common@0.0.8
  - intersphinx@0.0.6

## 0.0.9

### Patch Changes

- Fix modules type that picked up a bad tsconfig

## 0.0.8

### Patch Changes

- 8cb44548: Move isUrl utility to myst-cli-utils
- Updated dependencies [97a888c0]
- Updated dependencies [a6a03837]
- Updated dependencies [8cb44548]
  - myst-common@0.0.7
  - jtex@0.0.8
  - intersphinx@0.0.5
  - myst-cli-utils@0.0.7

## 0.0.7

### Patch Changes

- f3247103: Allow specifying valid imageExtensions to transformMdast
- 44c508bb: Bug fix: await docx export write to file
- f0db164a: Transform svg/gif images to png if imagemagick or inkscape are available
- Updated dependencies [fced5986]
- Updated dependencies [73db6da8]
- Updated dependencies [0170a2cc]
- Updated dependencies [3baa63eb]
- Updated dependencies [fced5986]
  - myst-to-docx@0.0.4
  - myst-transforms@0.0.9
  - myst-common@0.0.6
  - mystjs@0.0.15

## 0.0.6

### Patch Changes

- 17daf15e: Introduce GithubTransformer for file links.
- 88666aee: Deprecate unified exports from `mystjs`
- 184ad9f9: Move to https://github.com/jupyter-book/mystmd
- cfb1307b: Relative paths in config should be '.' not ''
- 615c1441: Sessions are now aware of their build path (making things more consistent)
  For example, change the template location to the site working directory.

  Word templates now use the myst cli, and jtex

- e6917c63: Bug fix: await docx export write to file
- Updated dependencies [17daf15e]
- Updated dependencies [88666aee]
- Updated dependencies [a9110bff]
- Updated dependencies [184ad9f9]
- Updated dependencies [a9110bff]
- Updated dependencies [615c1441]
- Updated dependencies [615c1441]
- Updated dependencies [a9110bff]
- Updated dependencies [0b2298fd]
- Updated dependencies [e3c5f93b]
- Updated dependencies [3fba7cb7]
  - myst-transforms@0.0.8
  - mystjs@0.0.14
  - citation-js-utils@0.0.11
  - intersphinx@0.0.4
  - jtex@0.0.7
  - myst-cli-utils@0.0.6
  - myst-common@0.0.5
  - myst-config@0.0.3
  - myst-frontmatter@0.0.3
  - myst-templates@0.0.3
  - myst-to-docx@0.0.3
  - myst-to-tex@0.0.7
  - simple-validators@0.0.2

## 0.0.5

### Patch Changes

Initial release of actual cli, including some docs!

- 0e3a511: Move @curvenote/nbtx --> nbtx
- Updated dependencies [0e3a511]
  - nbtx@0.1.12

## 0.0.4

### Patch Changes

- Updated dependencies [68d411e]
  - @curvenote/site-common@0.0.18

## 0.0.3

### Patch Changes

- Updated dependencies
  - @curvenote/site-common@0.0.17

## 0.0.2

### Patch Changes

- e3a2d05: Split standalone myst cli out of curvenote cli
- Updated dependencies [a662904]
- Updated dependencies [dbb283c]
- Updated dependencies [e3a2d05]
- Updated dependencies [9c2be36]
- Updated dependencies [de034db]
- Updated dependencies [e3a2d05]
- Updated dependencies [c9889c0]
  - myst-to-tex@0.0.6
  - jtex@0.0.6
  - @curvenote/blocks@1.5.16
  - myst-config@0.0.2
  - @curvenote/site-common@0.0.16
  - myst-cli-utils@0.0.5
  - intersphinx@0.0.3
