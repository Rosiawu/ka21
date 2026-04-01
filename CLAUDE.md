# KA21 Project Rules

@AGENT_RULES.md
@.claude/rules/dengxiabai-podcast.md

## Scope
These are the default working rules for this repository.

This repo is the KA21 AI tools site ("牛马库"), built around trustworthy AI-tool discovery, tutorials, events, devlogs, and a podcast dashboard. Treat it as a content product with real data constraints, not just a UI playground.

Core stack and shape:
- Next.js App Router
- React + TypeScript
- next-intl i18n
- Tailwind CSS
- Jest tests
- Cloudflare / OpenNext deployment
- Shared data flowing into web and some miniapp surfaces

Primary goals:
1. Help users find genuinely useful AI tools and tutorials faster
2. Keep data trustworthy and structure maintainable
3. Improve without breaking existing user flows

## Product Principles
- User trust comes first
- Data correctness matters more than visual novelty
- Prefer small, verifiable changes over broad rewrites
- Reuse existing patterns before inventing parallel systems
- Mobile readability and predictable UX matter on every core page

## Source Of Truth
- `src/data/tools.json`: tool data
- `src/data/tutorials.json`: tutorial data
- `src/data/featured.json`: homepage featured/hot configuration
- `src/data/devLogs.ts` and `src/data/devlog-submissions.json`: devlog content
- `messages/zh.json` and `messages/en.json`: localized UI copy
- `src/app/[locale]/`: main localized routes
- `src/lib/`: mapping, validation, config, security, helpers
- `miniprogram/`: miniapp-facing pages and data consumers

If a task affects sorting, recommendation, filtering, detail pages, or visible content, find the actual source of truth first. Do not patch only the presentation layer.

## Default Working Style
- Inspect current code and data flow before editing
- Prefer focused diffs over broad refactors
- Preserve established UI patterns unless redesign is explicitly requested
- Keep behavior data-driven instead of hardcoding values in components
- Reuse existing types, helpers, and component patterns where possible

## Data Rules
- Published IDs for tools, tutorials, events, and devlogs are treated as stable unless there is a strong reason to change them
- Before editing `featured`, verify the referenced IDs really exist
- Tool/tutorial relationships should stay internally consistent
- Do not invent capabilities, pricing, or availability facts in content data
- When cleaning content, prefer structural cleanup and clarity over silent factual rewrites

## i18n Rules
- Treat all user-facing copy as potentially bilingual
- Do not fix only Chinese and forget English
- Prefer `messages/*.json` or existing bilingual data fields over hardcoded text
- Preserve the current locale-routing approach instead of inventing a new one

## UX Rules
- Homepage, search, category views, and detail pages are core flows; change them carefully
- Optimize for scanability, clarity, and mobile use
- Do not trade predictability for cleverness

## Engineering Rules
- Be conservative with security-sensitive or GitHub-writeback flows
- Avoid unnecessary cross-file rewrites
- Fix root causes where possible, not just visible symptoms
- If a change may affect miniapp data shape, check downstream impact before shipping

## Common Task Guidance

### Adding or editing tools/tutorials
- Update source data first, then presentation
- Fill required fields fully instead of relying on fragile UI fallbacks
- Check icons, tags, category, and related links
- If downstream miniapp data depends on the change, consider export/sync steps

### Homepage or hot-section work
- Inspect `src/data/featured.json` first
- Do not adjust only card visuals while ignoring ordering and fallback logic

### Search or filtering issues
- Inspect mapping and query logic before patching UI behavior

### i18n issues
- Determine whether the issue is missing keys, route behavior, or data mismatch
- Do not leave "temporary" hardcoded English as the final fix

## Validation Defaults

### Data/config changes
- `npm run validate-featured`
- `npm run validate-tutorial-relations`
- `npm run check-i18n-keys`

### UI, interaction, or page logic changes
- `npm test`
- `npm run lint`

### Larger changes or pre-release confidence
- `npm run build`

### Cloudflare / OpenNext work
- `npm run build:cloudflare`

### Miniapp-shared data work
- Consider `npm run export:miniapp-data`
- If tutorial fulltext is involved, consider `npm run cache:miniapp-fulltext`

## Explicit Do-Nots
- Do not delete or bulk-rename stable data fields just to make a task easier
- Do not fix only visible UI while leaving broken underlying data logic
- Do not perform unsolicited visual overhauls on the homepage
- Do not treat temporary script output as long-term source data
- Do not skip bilingual consistency checks

## Output Expectations
- Say what changed and why
- State assumptions clearly
- If you skipped a validation command, say so explicitly
- If the real issue is structural, data-related, or process-related, say that directly instead of hiding it behind a cosmetic patch

## Auto Routing Rule
Always apply the shared agent execution rules in `AGENT_RULES.md` and the repo-wide rules in this file by default.

Then auto-detect whether the task also belongs to the "灯下白" specialist flow.

Automatically apply the podcast specialist rules when the request:
- mentions `灯下白`, podcast dashboard, podcast snapshot, refresh button, refresh API, platform capture, or podcast play counts
- touches files under `data/podcast-dashboard/`
- touches `scripts/podcast/capture-snapshot.ts`
- touches `src/app/api/podcast/dashboard/route.ts`
- touches files under `public/podcast-dashboard/`
- touches `src/app/[locale]/podcast/page.tsx`

If a task spans both the main site and the podcast flow, apply both rule sets together:
- use the repo-wide rules as the base
- use the podcast specialist rules for the touched podcast area

Only ask the user to clarify when the task is genuinely ambiguous and the wrong routing would create meaningful risk.

## Specialist Rule
If the task matches the podcast flow above, also apply:
- `.claude/rules/dengxiabai-podcast.md`

Typical triggers:
- `data/podcast-dashboard/*`
- `scripts/podcast/capture-snapshot.ts`
- `src/app/api/podcast/dashboard/route.ts`
- `public/podcast-dashboard/*`
- `src/app/[locale]/podcast/page.tsx`

## Success Criteria
- Users find useful tools faster
- Data stays trustworthy
- Structure stays stable
- Chinese and English stay aligned
- The site remains usable on mobile
