# Shared Agent Operating Rules

Apply these rules for all Codex and Claude work in this repository.

These rules are the shared execution baseline. They complement:
- repo-specific rules in `CLAUDE.md`
- specialist rules such as `dengxiabai-podcast.md`
- the longer human-readable reference in `docs/Agent编程规则-牛马库-灯下白-通用.md`

Use them on every task unless a stricter local rule overrides them.

## Goals
- Turn AI help into a stable working system, not just one-off code generation
- Make long tasks plannable, recoverable, and reviewable
- Preserve project knowledge across sessions instead of losing it in chat history
- Keep proactivity bounded by real signals, risk, and source of truth

## Shared Workflow
1. Define the target and success condition before editing
2. Find the real source of truth before patching the surface
3. Plan risky work before implementation
4. Execute in small, recoverable steps
5. Review from multiple angles, not only "does it run"
6. Leave clear handoff notes, assumptions, and remaining risk

## Rule 1: Plan Before Patching
- For risky, cross-file, or cross-data-flow tasks, do a real plan before coding
- The minimum plan should identify goal, source of truth, main risks, and validation path
- Do not jump straight to UI patches when the issue may live in data, API, permissions, scripts, or deployment

## Rule 2: Long-Running Work Must Be Recoverable
- Any task that may outlive a single session should be restartable
- Prefer scripts and flows that support clear logs, dry-run modes, explicit outputs, and idempotent behavior
- Do not leave critical progress only in transient terminal state or unwritten context

## Rule 3: Memory Should Be Distilled, Not Hoarded
- Important decisions, constraints, known failures, and verification commands should be written down in stable project artifacts when they matter
- Capture only the context that helps future execution; avoid dumping raw chat history into docs
- Good memory is searchable, compact, and updateable

## Rule 4: Cross-Session Work Must Be Handoff-Friendly
- Assume the next agent or human does not know what happened in the previous session
- Leave enough context so the next step is obvious without rereading the whole conversation
- A good handoff includes current state, next action, major risk, and how to verify completion

## Rule 5: State Must Be Portable
- Avoid workflows that depend on one machine, one browser tab, or one person's unwritten local context
- Prefer repo-local scripts, explicit docs, stable file outputs, and repeatable commands
- Critical work should survive machine switches, session changes, and agent swaps

## Rule 6: Proactivity Needs Signals And Boundaries
- Be proactive only when there is a clear signal and a safe action boundary
- Good signals include failed validation, stale snapshots, missing i18n coverage, broken refresh flows, or empty critical data on a built page
- Do not "improve" things speculatively with broad rewrites, surprise redesigns, or speculative automation

## Rule 7: Important Changes Need Multi-Angle Review
- Review important work from product, data, engineering, UX, and security angles when relevant
- "The code runs" is necessary but not sufficient
- Prefer planning review before implementation, implementation review before merge, and release-confidence checks before shipping

## Rule 8: Preserve Momentum With Visible Progress
- Long-term engineering systems need visible wins, not only long TODO lists
- Make progress legible through concise docs, closed loops, successful validations, and recorded decisions
- Rules should reduce anxiety and rework, not just restrict behavior

## When Both Claude And Codex Are Available
- Use Claude first for framing, prioritization, tradeoff analysis, PRD-quality planning, and writing-heavy synthesis
- Use Codex for codebase inspection, concrete implementation, scripts, validation, and file-level execution
- For complex tasks, the preferred pattern is: plan with Claude, execute with Codex, then distill learnings back into shared rules or docs

## Shared Do-Nots
- Do not confuse speculative ideas with trusted product or engineering facts
- Do not parallelize work by default if coordination cost is higher than the gain
- Do not widen automation scope without clear stop conditions, ownership, and rollback thinking
- Do not leave project-critical knowledge only inside ephemeral conversations
- Do not patch the visible symptom while ignoring the deeper source-of-truth problem
