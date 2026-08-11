# Workflow

## Current Phase: v0.1 Baseline

This repository begins as a v0.1 baseline. Its two editorial masters are:

- `dist/brian.perry.resume.brief.md`: Version 1, the micro-resume.
- `dist/brian.perry.resume.full.md`: Version 2, the full resume.

These Markdown files are the working documents for reaching the job-search
release. Edit them directly for wording, ordering, inclusion, and formatting.
Their restraint is intentional: preserve the plain Markdown hierarchy and
avoid decorative elements.

## Iterating Toward v1.0

1. Edit the relevant Markdown resume.
2. Run `npm run build` to regenerate its matching HTML and PDF versions.
3. Review the HTML and PDF files in `dist/` for content, readability, and
   layout.
4. Repeat until both versions accurately present the desired job-search
   narrative.
5. Commit the Markdown and its rendered HTML/PDF outputs together.
6. When the content is ready for use, create the v1.0 release.

## Adding Evidence and Updates

Add project details, certifications, and other public professional updates in
the appropriate supporting file:

- `projects/` for project cards and supporting narrative.
- `data/qualifications.json` for qualifications not represented by a JSON
  Resume certificate field.
- `resume.json` for structured resume data.

`npm run generate` can create fresh Markdown drafts from the structured data,
but it overwrites the editorial masters. Use it only when intentionally
starting a new draft; preserve or reapply any approved editorial revisions.

## Publication Standard

Before publishing an update, keep all descriptions factual, concise, and safe
for public release. Exclude client names, internal URLs, credentials, private
architecture, security findings, and any uncleared material.
