# Requirements

## Repository Structure

- `resume.json`: Canonical, schema-valid [JSON Resume](https://jsonresume.org/schema/) data.
- `profiles/radical-minimal.json`: Selection and ordering rules for the concise resume.
- `data/project-evidence.json`: Public project-evidence inventory. Add concise,
  non-confidential summaries and links only after review.
- `data/qualifications.json`: Professional qualifications that do not map
  directly to JSON Resume certificate fields.
- `projects/`: Human-readable project cards, one Markdown file per public project.
- `scripts/`: Resume validation and rendering commands.
- `dist/`: Published resume files. `full-resume.md` and
  `radical-minimal.md` are the editorial masters; HTML and PDF files render
  from them.

## Project Evidence

- [Security Engineering Automation](projects/security-engineering-automation.md)
- [Cloud and DevSecOps Engineering](projects/cloud-devsecops-engineering.md)
- [AI-Agent and LLM Workflows](projects/ai-agent-workflows.md)

## Commands

```bash
npm run validate
npm run build
```

`npm run build` (or `npm run render`) updates HTML and PDF from the editorial
Markdown. `npm run generate` recreates the Markdown drafts from the structured
data and will overwrite editorial revisions.

HTML and PDF render directly from Markdown with native Node.js scripts. No
third-party rendering or PDF-processing package is used.

## Publication Rules

Do not publish client names, internal URLs, credentials, source code, private
architecture, security findings, or any project content that has not been
cleared for public release. Keep the micro-resume self-contained: the
repository URL supplements the resume but does not replace material
qualifications or keywords.
