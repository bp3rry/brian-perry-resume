# Adding a Project

Use this workflow for every new public project represented in the portfolio.

1. Create `projects/<project-slug>.md` with front matter for `id`, `title`,
   `status`, and `capabilities`, followed by a concise public summary.
2. Add a matching entry to `data/project-evidence.json`. Use the same `id`,
   list the public capabilities, and point `card` to the project Markdown
   file.
3. Run `npm run generate` to refresh `projects/index.md` and the resume
   Markdown drafts. Add the project ID to
   `profiles/radical-minimal.json` only when it belongs in the brief resume.
4. Run `npm run render` and `npm run validate` before publishing.

Keep cards factual and safe for public release. Do not include client names,
credentials, internal URLs, private architecture, security findings, or
unapproved source material.
