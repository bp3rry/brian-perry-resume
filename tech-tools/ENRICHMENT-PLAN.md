# Description Enrichment Plan

## Goal

Keep every technology, tool, and practice page concise, source-based, and
useful when the portfolio inventory grows.

## Workflow

1. Add an inventory entry with an official HTTPS `reference`. When the
   documentation page is not suitable for extraction, provide an optional
   official HTTPS `descriptionReference` instead.
2. Run `npm run enrich:tech-tools`. The harness reads source metadata,
   structured data, or visible page content, then limits accepted descriptions
   to 180 characters.
3. Review `tech-tools/data/enrichment-review.json`. Address P0 failures
   first, then P1 generic descriptions, followed by P2 entries missing an
   official reference. Add or correct the official URL rather than accepting a
   generic description.
4. Run `npm run generate:tech-tools` to rebuild pages and
   `npm run validate:tech-tools` to check the generated site.

## Quality Gates

- Reject known error, access-denied, JavaScript-required, and bot-challenge
  messages.
- Do not replace an existing definition when no usable source description is
  found.
- Preserve the public `reference` link for readers while allowing an
  alternative official `descriptionReference` for extraction.
- Use `npm run enrich:tech-tools -- --strict` in automation when unresolved
  source URLs must fail the command.

## Reusable Skill

`skills/tech-tool-enrichment/SKILL.md` contains the repeatable operating
procedure for future portfolio updates. Use `npm run refresh:tech-tools` to
execute the complete harness.

## Backlog

- Add official reference URLs for existing entries that still use generic
  descriptions.
- Add fixture-based tests for error-page rejection and truncation before
  extending extraction strategies further.
