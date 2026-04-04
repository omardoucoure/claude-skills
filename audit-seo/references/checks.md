# SEO Audit Checks Reference

23 checks organized into 6 scoring dimensions (115 points total).

## Scoring Dimensions

| Dimension | Max Points | Description |
|-----------|-----------|-------------|
| Technical | 20 | robots.txt, sitemaps, sitemap health, redirects, canonical, hreflang |
| Content/Meta | 25 | schema, OG tags, title/desc, duplicate meta, AI readiness, content freshness, internal links |
| Performance | 20 | TTFB, server response time |
| GSC Health | 20 | trends, declining pages, CTR opportunities, indexation |
| Security | 15 | HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Core Web Vitals | 15 | LCP, CLS, INP, FCP, TTFB, TBT, Speed Index via Lighthouse CLI (PSI API fallback) |

### Deductions per finding severity
- CRITICAL: -5 points
- HIGH: -3 points
- MEDIUM: -1.5 points
- LOW: -0.5 points

Deductions are capped at the dimension maximum (score never goes below 0).

### Letter Grades
- A: 90-100
- B: 80-89
- C: 70-79
- D: 60-69
- F: <60

---

## GSC-Dependent Checks (1-10)

### 1. Performance Overview
- **Source**: GSC Search Analytics API
- **Period**: Last 28 days vs previous 28 days
- **What**: Clicks, impressions, CTR, position across web/image/video/news/discover
- **Finding**: Web clicks declining >20% triggers HIGH

### 2. Top Queries
- **Source**: GSC Search Analytics (query dimension)
- **Limit**: Top 30 queries by clicks
- **What**: Identifies strongest performing keywords

### 3. Top Pages
- **Source**: GSC Search Analytics (page dimension)
- **Limit**: Top 30 pages by clicks
- **What**: Identifies highest-traffic pages

### 4. CTR Opportunities
- **Source**: GSC Search Analytics (500 queries)
- **Filter**: Impressions >= 50, CTR < 5%, position <= 20
- **Finding**: >10 opportunities triggers MEDIUM

### 5. Declining Pages
- **Source**: GSC Search Analytics (page dimension, 2 periods)
- **Filter**: Previous clicks > 5, decline > 30%
- **Finding**: >5 declining pages triggers HIGH

### 6. Sitemap Status
- **Source**: GSC Sitemaps API
- **What**: Submitted vs indexed counts, errors, pending status
- **Finding**: Sitemap errors trigger HIGH; index rate <50% triggers HIGH

### 7. Weekly Trends
- **Source**: GSC Search Analytics (date dimension, 90 days)
- **What**: Weekly click charts, first-half vs second-half trend
- **Finding**: >15% decline triggers HIGH

### 8. Device & Country
- **Source**: GSC Search Analytics (device/country dimensions)
- **What**: Traffic breakdown by device type and top 15 countries

### 9. URL Inspection
- **Source**: GSC URL Inspection API
- **What**: Index status, coverage, robots state, canonical for key pages
- **Finding**: FAIL verdict triggers CRITICAL

### 10. Content Freshness (NEW)
- **Source**: GSC top pages + HTTP Last-Modified / article:modified_time meta
- **What**: Checks if top-traffic pages have been recently updated
- **Thresholds**: >365 days = stale, >180 days = aging, >90 days = watch
- **Finding**: >3 pages stale (365d) triggers HIGH; >5 pages (180d) triggers MEDIUM

---

## HTTP-Only Checks (11-15)

### 11. Sitemap URL Health
- **Source**: HTTP fetch of sitemap XML + 10 random URL samples
- **What**: Verifies sitemap URLs return 200
- **Finding**: Errors in sample trigger MEDIUM; sitemap HTTP error triggers HIGH

### 12. TTFB & Server Response
- **Source**: HTTP requests to key pages
- **Thresholds**: <200ms = good, 200-600ms = warning, >600ms = slow
- **Finding**: Key pages >600ms trigger HIGH

### 13. Redirect Chains
- **Source**: HTTP redirect following (non-www, http, trailing slash)
- **What**: Detects multi-hop redirects
- **Finding**: Chains with 2+ hops trigger MEDIUM

### 14. Robots.txt Validation
- **Source**: HTTP fetch of /robots.txt
- **What**: Block-all detection, sitemap directives, social bot rules
- **Finding**: Block-all triggers CRITICAL; no sitemap directive triggers MEDIUM

### 15. Security Headers (NEW)
- **Source**: HTTP response headers from homepage
- **Headers checked**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Finding**: Missing HSTS = HIGH; missing CSP/X-Frame/X-Content-Type = MEDIUM; missing Referrer/Permissions = LOW

---

## Meta/HTML Checks (16-21)

### 16. Schema, OG & Meta
- **Source**: HTML of top GSC pages (or key pages fallback)
- **What**: JSON-LD types, OG tags (title, desc, image, type), Twitter cards, canonical, title length, hreflang count, robots meta
- **Finding**: Missing JSON-LD = HIGH; missing OG title/image = HIGH; invalid JSON-LD = MEDIUM

### 17. Hreflang (NEW)
- **Source**: HTML of key pages
- **Requires**: Multi-locale site (locales.length > 1)
- **What**: Missing locales, self-referential tags, x-default, protocol consistency
- **Finding**: Issues trigger HIGH (cumulative)

### 18. Canonical (NEW)
- **Source**: HTML of key pages
- **What**: Missing canonical, canonical+noindex conflict, protocol mismatch, trailing slash
- **Finding**: Missing canonical = HIGH; noindex conflict = HIGH; protocol mismatch = MEDIUM

### 19. Duplicate Meta (NEW)
- **Source**: Sitemap crawl (50 pages)
- **What**: Pages sharing identical `<title>` or `<meta description>`, empty titles/descriptions
- **Finding**: Duplicate titles = HIGH; empty titles = HIGH; duplicate descriptions = MEDIUM; empty descriptions = MEDIUM

### 20. Internal Links (NEW)
- **Source**: Crawl of 30 sitemap pages + link extraction
- **What**: Orphan pages (0 inbound), dead-end pages (<3 outbound), homepage reach
- **Finding**: Orphan pages trigger MEDIUM; dead-end pages >3 trigger LOW

### 21. AI Readiness (NEW)
- **Source**: HTML of key pages
- **What**: JSON-LD completeness (Article, FAQ, HowTo, Organization, Breadcrumb), heading structure (H1/H2/H3), content word count, author entity
- **Finding**: Missing H1 = HIGH; multiple H1 = MEDIUM; thin content (<100 words) = HIGH

---

## Core Web Vitals Check (22)

### 22. Core Web Vitals (PageSpeed Insights API)
- **Source**: Google PageSpeed Insights API (free, no auth required)
- **Pages tested**: Homepage + top key page, both mobile and desktop
- **Lab metrics** (Lighthouse synthetic): LCP, CLS, INP, FCP, TTFB, TBT, Speed Index
- **Field data** (CrUX real-user p75): LCP, CLS, INP, FCP, TTFB — shown when available
- **Google ranking signals**: LCP, CLS, INP are direct ranking factors
- **Thresholds**:
  - LCP: good ≤2500ms, poor >4000ms
  - CLS: good ≤0.1, poor >0.25
  - INP: good ≤200ms, poor >500ms
  - FCP: good ≤1800ms, poor >3000ms
  - TTFB: good ≤800ms, poor >1800ms
  - TBT: good ≤200ms, poor >600ms
  - Speed Index: good ≤3400ms, poor >5800ms
- **Findings**:
  - LCP/CLS/INP POOR on mobile → HIGH (Google ranking signal)
  - LCP/CLS/INP needs improvement on mobile → MEDIUM
  - FCP/TTFB POOR on mobile → MEDIUM
- **Top opportunities**: Shows up to 4 Lighthouse opportunities with estimated savings (ms)

---

## Keyword Ranking Check (23)

### 23. Keyword Ranking Analysis
- **Source**: GSC Search Analytics (200 queries + query×page dimension for cannibalization) + Google SERP scrape
- **Section A — Position distribution**: Bar chart of all 200 keywords across 5 bands (Top3 / Pos4-5 / Pos6-10 / Pos11-20 / Pos20+) with impressions and clicks per band
- **Section B — Top 15 deep-dive**: Per keyword: position, clicks, impressions, CTR vs expected CTR for that position, cannibalization marker
- **Section C — Near-#1 opportunities**: Keywords in pos 2-5 sorted by impressions, with estimated click gain if reaching #1 (using 28% CTR benchmark)
- **Section D — SERP competitor analysis**: For top 5 near-#1 keywords, scrapes Google SERP to show:
  - #1, #2, #3 results (domain + page title)
  - Rich features: Featured Snippet, People Also Ask, Recipe Rich Results, Video Carousel
  - Per-keyword action plan with severity (HIGH/MEDIUM/LOW)
- **Section E — Cannibalization report**: All keywords where multiple pages compete, with canonical recommendations
- **Expected CTR benchmarks**: pos1=28%, pos2=15%, pos3=11%, pos4=8%, pos5=6%, pos6=5%, pos7=4%, pos8=3%, pos9=2.5%, pos10=2%
- **Findings**:
  - Cannibalization detected → HIGH
  - >3 keywords stuck pos 4-10 with ≥200 impressions → MEDIUM
  - >3 keywords with CTR <50% of expected at their position → MEDIUM

---

## Summary Check

### SEO Score
- **Source**: Aggregation of all findings from checks 1-23
- **Output**: Total score (0-115), letter grade, per-dimension bar chart, top 5 issues
