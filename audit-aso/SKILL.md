---
name: audit-aso
description: "Run a 16-check ASO audit with 100-point scoring on any mobile app. Checks App Store Connect metadata (title, subtitle, keywords, description), Google Play listing (title, short/full description), competitor analysis, keyword density, char usage optimization, screenshot coverage, ratings, reviews, locale completeness, and generates optimized metadata for all locales."
argument-hint: "[app] — futevolution, chatbook, or any app in current directory"
allowed-tools: Bash, Read, Grep, Glob, Agent
user-invocable: true
---

# ASO Audit Skill (v2)

Run a comprehensive 16-check ASO audit with a 100-point scoring system using App Store Connect API + Google Play Developer API + competitor web scraping.

## Step 1: Determine the app

If `$ARGUMENTS` is provided, use it as the app key. Otherwise, infer from the current working directory:
- If cwd contains `futevo` or `futevolution` → use `futevolution`
- If cwd contains `chatbook` → use `chatbook`
- Otherwise, ask the user which app to audit

Valid app keys: `futevolution`, `chatbook`

## Step 2: Run the audit script

```bash
node ~/.claude/skills/audit-aso/scripts/audit-aso.js <app-key>
```

The script output will be large. Read the full output.

## Step 3: Analyze and present results

The script outputs an ASO score (0-100) with letter grade and per-dimension breakdown. Present the results as follows:

### Score Summary

Show the overall score, grade, and per-dimension bar chart from the script output.

### Issues by Severity

**CRITICAL** — Issues that actively harm discoverability (empty title, no keywords, app not live)
**HIGH** — Issues with significant ASO impact (wasted keyword chars, missing subtitle, no screenshots)
**MEDIUM** — Issues worth fixing but not urgent (suboptimal char usage, missing locales, low rating)
**LOW** — Minor or informational items

For each issue:
- State the problem clearly
- Show the relevant data from the audit
- Suggest a specific fix with optimized text

### Optimized Metadata

After presenting issues, generate optimized metadata for EACH supported locale:

**iOS (App Store Connect)**:
- App Name (max 30 chars): Brand + primary keyword
- Subtitle (max 30 chars): Secondary keyword phrase
- Keywords (max 100 chars): Comma-separated, no spaces after commas, no duplicates from title/subtitle
- Promotional Text (max 170 chars): Can be updated without review
- Description: Keyword-rich, structured with line breaks

**Android (Google Play)**:
- App Title (max 50 chars): Brand + primary keywords
- Short Description (max 80 chars): Most impactful keywords
- Full Description (max 4000 chars): Keywords in first 3 lines, feature bullets, call to action

### Growth Recommendations

End with 5 actionable growth strategies based on the audit findings.

### Highlight what's working well too

End with a "What's Working Well" section for items that pass all checks.

## Step 4: Implement changes (with approval)

1. **Present before/after table** — Show clear comparison for each locale
2. **Get user approval** — Always wait for confirmation before making changes
3. **Update App Store Connect** — Use the `connect-appstoreconnect` skill
4. **Update Google Play** — Use the `connect-playstore` skill

## Available Apps Reference

| Key | App | iOS Bundle | Android Package | Locales |
|-----|-----|-----------|-----------------|---------|
| `futevolution` | FUT Evolution | com.futevolution.app | com.futevolution.app | en, fr, es |
| `chatbook` | ChatBook | com.whatsapptovideo.app | com.whatsapptovideo.app | en, fr, es, de, it, pt, nl, ar, zh |

## Script location

`~/.claude/skills/audit-aso/scripts/audit-aso.js`

To add a new app, edit the `APPS` object in `~/.claude/skills/audit-aso/scripts/apps.js`.

## Checks Reference

See `~/.claude/skills/audit-aso/references/checks.md` for documentation of all 16 checks and severity thresholds.
