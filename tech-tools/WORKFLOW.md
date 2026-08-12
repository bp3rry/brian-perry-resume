# Technology and Tools Workflow

## Purpose

`tech-tools/` is a static, categorized wiki supporting the resume. Its
inventory is derived from an AI-generated scan of recent project artifacts.
Inclusion documents recent hands-on use, not expertise or a proficiency rating.

Pages contain a stable name, a one-line generic definition, an official
reference only when one is known, optional existing public evidence, and a
review date. They do not contain project-specific usage narratives.

## Source and Generated Files

`tech-tools/data/inventory.json` is the editable inventory. Each entry has one
primary category, preventing duplicate pages. `aliases` preserve equivalent
labels from the source scan without creating another page.

`scripts/generate-tech-tools.mjs` is a first-party Node generator using only
Node built-ins. It writes the categorized Markdown and HTML pages, plus
`tech-tools/index.md` and `tech-tools/index.html`. Generated pages use the
existing `tech-tools/styles.css` and no third-party renderer or site generator.

```text
tech-tools/
  data/inventory.json       # edit this
  index.md, index.html      # generated
  tools/
  technologies/
  practices/                # generated category pages
  styles.css
```

## Commands

```sh
npm run generate:tech-tools
npm run validate:tech-tools
npm run enrich:tech-tools
npm run refresh:tech-tools
```

Generation replaces only the generated `tools/`, `technologies/`, and
`practices/` page trees and rewrites the two indexes. Validation checks the
inventory shape, generated-file freshness, unexpected generated files, and
local HTML links. Run generation after any inventory edit, then validation
before sharing changes.

## Maintaining the Inventory

1. Add one entry to `entries` with a stable `name`, one `category`, and a
   one-line `definition`.
2. Use an HTTPS official URL in `reference` only when it is confidently known;
   add `descriptionReference` when a different official page provides a better
   extractable description.
3. Add `evidence` only for an existing, reliable public link.
4. Add equivalent scan labels to `aliases` instead of adding duplicate entries.
5. Regenerate and validate the site.

## Refreshing Reference Descriptions

`npm run enrich:tech-tools` retrieves each entry's official reference page and
uses its description metadata, structured data, or visible page content to
replace the inventory definition. Descriptions are capped at 180 characters
and end in `...` when truncated. Entries without an official reference remain
unchanged; the script reports any reference it cannot describe so it can be
reviewed manually. Known error and bot-challenge messages are rejected rather
than saved as descriptions. Add `--strict` to make unresolved references fail
the command. See [ENRICHMENT-PLAN.md](ENRICHMENT-PLAN.md) for the reusable
workflow and quality gates.

`npm run refresh:tech-tools` is the full maintenance harness. It enriches the
inventory, rebuilds the generated pages, and validates the result. Each
enrichment run writes `tech-tools/data/enrichment-review.json`, a prioritized
queue for broken references (P0), generic descriptions with a reference (P1),
and generic descriptions that need an official reference (P2).

Keep the hierarchy shallow. The current categories cover tools (security,
development, and DevOps), technologies (languages, frameworks, cloud
infrastructure, data/databases, and platforms), and practices (security,
delivery, engineering, and AI/machine learning).
