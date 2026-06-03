# AI Logs — Kcal.AI (Cal AI Clone)

Raw, unedited AI conversation/agent exports from the build, in the order they happened.
Files are copied verbatim from their source tools — nothing in the subfolders has been rewritten or cleaned up.

## Build provenance (chronological)

1. **Claude** — competitive research, PRD, and the UI mockup (HTML).
2. **Google Stitch** — generated the screen designs from that mockup; the Syne→Inter font override was applied here.
3. **Antigravity (Gemini agent)** — built the Expo/React Native app from the Stitch designs.

## Contents

```
01-design-claude/        Raw Claude conversation + outputs
  01-initial-research-and-ui-prompts.txt   Prompts + responses (research → "best UI/UX")
  02-competitive-analysis-and-prd.md       Claude's PRD & competitor deep-dive
  03-ui-mockup.html                        Claude's 6-screen mockup → input to Stitch

02-design-stitch/        Raw Stitch project data (pulled from the Stitch MCP API)
  get_project.raw.json                     Project + "Kinetic Noir" design system (tokens, fonts)
  list_screens.raw.json                    All 15 generated screens (titles, sizes, file refs)

03-build-antigravity/    Raw Antigravity (Gemini) agent trajectories
  01-main-build-4506ab37/                  Main build thread
    task.md, implementation_plan.md, walkthrough.md, overview.txt, steps/*-output.txt
  02-build-transcript-d02e66c0/
    transcript.jsonl                       Raw agent transcript

build_logs.md            Pre-existing curated summary (kept for reference)
```

## Notes

- Stitch's API stores design *artifacts* (screens, design system), not the natural-language prompts typed into it; the design-side prompts live in `01-design-claude/`.
- Secrets (API keys) were scanned for and are not present in any file.
