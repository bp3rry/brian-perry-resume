---
name: tech-tool-enrichment
description: Refresh source-based descriptions and triage the technology, tool, and practice inventory.
---

# Technology, Tool, and Practice Enrichment

Use this skill whenever a project adds or changes a technology, tool, or
practice in `tech-tools/data/inventory.json`.

1. Add or update the inventory entry with an official HTTPS `reference`.
   Use `descriptionReference` only when a different official page is better
   suited to description extraction.
2. Run `npm run refresh:tech-tools`.
3. Triage `tech-tools/data/enrichment-review.json` in priority order:
   - P0: source URL failed or returned unusable content.
   - P1: a referenced entry still has a generic description.
   - P2: a generic entry needs an official reference.
4. Correct entries, then repeat the refresh command until the remaining queue
   is intentional and documented.

Descriptions are source-derived, limited to 180 characters, and retain `...`
when truncated. Do not accept error pages, bot challenges, or generic
category definitions as final descriptions.
