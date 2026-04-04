---
name: audit-seo
description: "Run an SEO audit on sites discovered from Google Search Console credentials. Use when the user says 'audit SEO', 'check SEO', 'SEO score', 'run SEO audit', 'how is my SEO', 'check search performance', or mentions SEO health for a specific site. Supports both domain properties (sc-domain:) and URL-prefix properties. Covers 23 checks across 6 dimensions: technical, content/meta, performance, GSC health, security, and Core Web Vitals."
argument-hint: "[domain keyword] — e.g. cuisine, futevo, realmadrid (auto-discovered from GSC)"
allowed-tools: Bash, Read, Grep, Glob, Agent
model: sonnet
---

# SEO Audit Skill (v4)

Run a comprehensive 23-check SEO audit with a 115-point scoring system using Google Search Console API + PageSpeed Insights API + Google SERP analysis + HTTP analysis.

Sites are **auto-discovered** from GSC service account credentials — no hardcoded site list.

## Examples

**User**: "audit SEO for cuisine de chez nous"
→ Run `node ~/.claude/skills/audit-seo/scripts/audit-seo.js cuisine`, present score summary, issues by severity, and what's working well.

**User**: "how is my SEO?" (cwd is `/Users/.../futevo`)
→ Infer keyword `futevo` from cwd, run `node ~/.claude/skills/audit-seo/scripts/audit-seo.js futevo`.

**User**: "check SEO" (no context)
→ Run `node ~/.claude/skills/audit-seo/scripts/audit-seo.js` to list discovered sites, ask user to pick one.

## Step 1: Determine the site

If `$ARGUMENTS` is provided, pass it as the domain keyword to the script. Otherwise, infer from the current working directory:
- If cwd contains a recognizable project name (e.g. `futevo`, `cuisinedecheznous`, `real-madrid`, `afriquesports`), extract a keyword from it
- Otherwise, run the script without arguments to list discovered sites and ask the user to pick one

## Step 2: Run the audit script

```bash
node ~/.claude/skills/audit-seo/scripts/audit-seo.js <domain-keyword>
```

The script auto-discovers all GSC sites from known credential sources, matches the keyword against discovered domains, then infers siteUrl, keyPages, sitemaps, and locales from the live site.

To list all available sites:
```bash
node ~/.claude/skills/audit-seo/scripts/audit-seo.js --list-sites
```

The script output will be large. Read the full output.

## Step 3: Analyze and present results

The script outputs an SEO score (0-115) with letter grade and per-dimension breakdown. Present the results as follows:

### Score Summary

Show the overall score, grade, and per-dimension bar chart from the script output.

### Issues by Severity

**CRITICAL** — Issues that actively harm SEO (blocking crawlers, broken pages, missing sitemaps)
**HIGH** — Issues with significant SEO impact (missing OG images, duplicate content, slow TTFB)
**MEDIUM** — Issues worth fixing but not urgent (missing twitter:site, title length, redirect chains)
**LOW** — Minor or informational items

For each issue:
- State the problem clearly
- Show the relevant data from the audit
- Suggest a specific fix

### Highlight what's working well too

End with a "What's Working Well" section for items that pass all checks.

## How discovery works

The script loads service account JSON files from `credentials/` (bundled with the skill), authenticates with GSC, calls `sites.list()` on each, and collects all properties (both `sc-domain:` domain properties and URL-prefix properties like `https://example.com/`). For each site it then auto-infers:
- **siteUrl**: used directly for URL-prefix properties; for `sc-domain:` properties, probes `https://www.<domain>` with bare-domain fallback
- **keyPages**: parsed from `/sitemap.xml` (first 5 content URLs + homepage)
- **sitemaps**: detected from sitemap index if present, else `["/sitemap.xml"]`
- **locales**: detected from `hreflang` tags on the homepage

To add a new site, just add the GSC service account as an owner/user in Google Search Console — it will be auto-discovered on next run.

## Script location

`~/.claude/skills/audit-seo/scripts/audit-seo.js`

Credentials are stored in `~/.claude/skills/audit-seo/credentials/*.json` (service account JSON files). To add a new GSC account, drop a JSON file there. Alternatively, set `GSC_CREDENTIALS_JSON` env var (JSON or base64-encoded) for portable use without files.

## Troubleshooting

### No sites discovered
- Ensure at least one valid service account JSON file exists in `~/.claude/skills/audit-seo/credentials/`
- Or set `GSC_CREDENTIALS_JSON` env var with the service account JSON
- Run `--list-sites` to debug which credentials are working
- The service account email must be added as a user/owner in GSC for each property

### GSC credentials expired or invalid
- Script falls back to HTTP-only checks (11-23) if GSC auth fails
- Check that the JSON credentials in `credentials/` haven't been rotated

### Script fails mid-audit
- Network timeouts on PageSpeed Insights API: re-run, the API is free but rate-limited
- GSC API quota exceeded: wait a few minutes and retry
- If a single check crashes, the script exits — check the stack trace for which check failed

### Domain keyword not matching
- Use `--list-sites` to see exact domains available
- The keyword is matched as a substring against the domain (e.g., `cuisine` matches `cuisinedecheznous.net`)

### Core Web Vitals check returns no data
- PageSpeed Insights API may not have CrUX field data for low-traffic sites
- Lab data (Lighthouse) is always available as fallback

## Checks Reference

See `~/.claude/skills/audit-seo/references/checks.md` for documentation of all 23 checks and severity thresholds.
