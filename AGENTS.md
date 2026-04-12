# Agent Entry

Use [CLAUDE.md](/Users/rosiawoo/Desktop/ka21-tools-main/CLAUDE.md) as the canonical project rule file for this repository.

Always load the shared execution baseline as well:
- [AGENT_RULES.md](/Users/rosiawoo/Desktop/ka21-tools-main/AGENT_RULES.md)

If you are working on the podcast dashboard or the "灯下白" data pipeline, also load:
- [dengxiabai-podcast.md](/Users/rosiawoo/Desktop/ka21-tools-main/.claude/rules/dengxiabai-podcast.md)

Default expectation:
- Follow the shared agent rules in `AGENT_RULES.md`
- Follow the repo-wide rules in `CLAUDE.md`
- Auto-detect whether the task is repo-wide only or also belongs to the `灯下白` podcast flow
- Apply the podcast specialist rules whenever the task mentions `灯下白` or touches the podcast files/paths described in `CLAUDE.md`
- If a task spans both areas, apply both rule sets together and use the stricter podcast rules inside that scope
- Prefer the source-of-truth files and existing data flow over display-only patches
