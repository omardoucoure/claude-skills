---
name: job-checker
description: Deep search for Senior iOS Developer jobs in Canada and international remote positions with salary above $140K CAD. Use when user says "job checker", "find jobs", "search jobs", "iOS jobs", "job search", or "check jobs".
---

# Job Checker - Senior iOS Developer Job Search

## Instructions

### Step 1: Deep Web Search

Perform multiple parallel web searches to maximize coverage. Use the CURRENT YEAR in all queries (check the system date). Run ALL searches in parallel:

**Canada-based searches:**
1. `Senior iOS Developer jobs Canada hiring now`
2. `Senior iOS Engineer Canada remote hybrid salary`
3. `Staff iOS Developer Toronto Montreal Vancouver`
4. `Senior Mobile Developer iOS Canada fintech banking`
5. `Senior Swift Developer Canada open positions`
6. `iOS Lead Developer Canada salary`
7. `Senior iOS Developer jobs Toronto LinkedIn`
8. `Senior iOS Developer jobs Canada Indeed`
9. `Senior iOS Developer jobs Canada Glassdoor`
10. `Senior iOS Developer Wellfound Canada startup`

**International remote searches:**
11. `Senior iOS Developer remote worldwide hiring`
12. `Senior iOS Engineer remote international salary`
13. `Staff iOS Developer remote global positions`
14. `Senior Swift Developer fully remote international`
15. `iOS Engineer remote US company open to worldwide`
16. `Senior iOS Developer weworkremotely`
17. `Senior iOS remote jobs remoteok`
18. `Senior iOS Engineer welcometothejungle`
19. `Senior iOS Developer remote otta jobs`
20. `Senior Mobile Engineer iOS remote high salary`

### Step 2: Fetch and VALIDATE Job Listings

This is the CRITICAL step. For each promising job found in search results:

1. **Use WebFetch on the ACTUAL job listing URL** (not search result pages, not salary aggregators)
2. **Verify the job is STILL OPEN** — look for:
   - "This position has been filled"
   - "No longer accepting applications"
   - "Expired" or "Closed"
   - "Job no longer available"
   - Missing "Apply" button
   - If the page returns a 404 or redirect to a generic careers page, the job is GONE
3. **Only include jobs that are confirmed ACTIVE** — if you can't verify, mark as "Unverified" in the table
4. **Extract from the ACTUAL listing page:**
   - Job title (exact)
   - Company name
   - Location / eligible regions (city/country or "Remote")
   - Salary range (from the listing itself, NOT from salary estimation sites)
   - Required skills/experience
   - Direct application URL (the ACTUAL page you fetched, not a search engine cache)
   - Date posted (if available)

**LOCATION CROSS-VERIFICATION — MANDATORY:**
Individual job posting pages sometimes show INCOMPLETE or OUTDATED location info (e.g., showing only "US" when the role is actually open to "Americas, EMEA"). To avoid this mistake:
- **ALWAYS fetch the company's main careers/jobs page** (e.g., jobs.ashbyhq.com/company, jobs.lever.co/company, company.com/careers) in ADDITION to the individual job posting
- Compare the location listed on the careers index page vs. the individual posting
- If they differ, TRUST THE CAREERS INDEX PAGE — it is the most up-to-date source
- Common pattern: careers index says "Americas, EMEA" but the old individual page says "US or Spain only" → the index is correct
- When reporting location, note BOTH sources if they conflict: "Americas, EMEA (per careers page; individual posting says US/Spain)"
- **Canada falls under "Americas"** — always flag when a role lists Americas/AMER/North America as eligible, since that includes Canada

**URL QUALITY RULES — MANDATORY:**
- NEVER link to search result pages (glassdoor.com/Job/...-jobs-SRCH_, indeed.com/q-..., linkedin.com/jobs/search)
- NEVER link to salary aggregator pages (ziprecruiter.com/Salaries, talent.com/salary, levels.fyi)
- NEVER link to generic job board category pages (wellfound.com/role/..., remoteok.com/remote-ios-jobs)
- ONLY link to SPECIFIC job posting pages (e.g., greenhouse.io/company/jobs/12345, lever.co/company/job-id, ashbyhq.com/company/job-id, company.com/careers/specific-job)
- If you cannot find a direct job posting URL, use the company's careers page and note "Apply on company site"
- Test each URL with WebFetch before including it — if it 404s, redirects to a different page, or shows "position filled", DO NOT include it

**ATS PAGE RENDERING CAVEAT:**
Some ATS pages (especially Ashby, Lever) return only JavaScript loading spinners when fetched. If a WebFetch returns only JS/loading content with no actual job data:
- Do NOT assume the job doesn't exist
- Instead, rely on the careers index page data + third-party sources (Glassdoor, Built In, echojobs.io) that have cached the listing
- Mark as "Active (via careers page)" rather than "Unverified"

### Step 3: Filter Jobs

Only keep jobs where:
- Salary >= $140K CAD (use approximate conversion: 1 USD ~ 1.36 CAD, 1 EUR ~ 1.50 CAD, 1 GBP ~ 1.75 CAD)
- Role is Senior/Staff/Lead level iOS or Mobile
- For "Canada" tab: job is located in Canada (on-site, hybrid, or remote within Canada)
- For "Remote International" tab: job is explicitly remote-friendly for international candidates or lists Americas/EMEA/Worldwide
- **Exclude** jobs that are strictly "Remote US only" with no indication of international eligibility
- Job is confirmed ACTIVE or posted within the last 30 days

**Salary source priority (use highest confidence source):**
1. Salary stated on the job listing itself (best)
2. Salary range from company's official careers page
3. Levels.fyi verified data for that company+level+location (good)
4. Glassdoor company-specific salary data (acceptable)
5. General market estimates (mark as "est." and explain source)

### Step 4: CV Match Rating

Rate each job against Omar's profile on a scale of 1-5 stars. Use these criteria:

**Omar's CV Profile:**
- **Title:** Senior iOS Developer, 11+ years experience (since 2014)
- **Current:** Senior iOS Developer at NumeriQ/Quebecor Media (May 2025-Present) - 8 iOS/tvOS streaming & news apps, millions of users
- **Previous:** Senior iOS Developer at Desjardins (Jul 2022-Apr 2025) - mobile banking app, Canada's largest financial cooperative, SwiftUI/UIKit, Keychain, biometric auth, modular MVVM
- **Previous:** Lead iOS Developer at BDSI/BNP Paribas (Apr 2019-Jun 2022) - banking app from scratch, white-label for 3 countries, mentored juniors
- **Previous:** Android Developer at Atos/La Poste, iOS Developer at Chaka Mobile (banking apps), iOS Developer at People Input (VoIP/messaging)
- **Core Skills:** Swift, SwiftUI, UIKit, tvOS, WidgetKit, Combine, MVVM, Clean Architecture, SPM, Keychain, OAuth2, Instruments, MetricKit, XCTest, Swift Testing, Snapshot Testing, Xcode Cloud, GitHub Actions, Fastlane
- **Bonus Skills:** Design Systems (multi-brand, Figma, design tokens), AI/Claude Agent SDK/MCP Servers, Kotlin, Next.js, Firebase
- **Domain Expertise:** Fintech/Banking, Streaming/Media, Consumer apps
- **Side Projects:** 800K+ downloads (Cuisine de Chez Nous), FUT Evolution (SwiftUI), WhatsApp to Video, Afrique Sports
- **Location:** Montreal, Canada

**Rating Criteria (each worth 1 star):**
1. **Tech match** - Job requires Swift/SwiftUI/iOS skills Omar has
2. **Seniority fit** - Job level matches Senior/Lead with 11+ years
3. **Domain match** - Job is in fintech, banking, streaming, media, or consumer apps
4. **Salary fit** - Salary is at or above $140K CAD (bonus if $160K+)
5. **Location fit** - Job is in Montreal/Canada or fully remote from Canada

### Step 5: Display Results

Present results in a clean, organized format:

```
## Job Search Results - [date]
### [X] verified active positions found | [Y] unverified

### Tab 1: By Type
#### Canada - On-site/Hybrid
[table of jobs]

#### Canada - Remote
[table of jobs]

#### International Remote (open to Canada)
[table of jobs]

### Tab 2: By Salary Range
#### $200K+ CAD
[table of jobs]

#### $160K - $200K CAD
[table of jobs]

#### $140K - $160K CAD
[table of jobs]

### Tab 3: Best CV Match (sorted by rating)
[table of jobs sorted by match rating, highest first]
```

Each job row should include:
| Company | Title | Salary (CAD) | Salary Source | Location | Eligible Regions | Status | CV Match | Apply Link |

- **Salary Source**: "Listed" (on job post), "Levels.fyi", "Glassdoor", "Est." (estimated)
- **Eligible Regions**: The actual regions where candidates can be based (e.g., "Americas, EMEA", "Canada only", "US only", "Worldwide"). This is critical — always verify via careers index page.
- **Status**: "Active" (verified open), "Active (via careers page)" (index confirms but individual page didn't load), "Unverified" (couldn't confirm)
- **Apply Link**: Direct link to the SPECIFIC job posting (not a search page)

### Step 6: Summary & Recommendations

End with:
1. **Top 3 recommendations** — Which jobs Omar should apply to first and why
2. **Application tips** — Any notes about the companies (culture, interview process, etc.)
3. **Jobs to watch** — Promising companies that didn't have matching openings but often hire senior iOS
4. **Expired/Closed jobs found during search** — List them briefly so Omar knows what just closed and can set alerts

## Performance Notes

- Be thorough - search at least 20 different queries
- **VALIDATE every URL** before including it — WebFetch it and confirm the job exists and is open
- **NEVER include dead links, expired jobs, or search result pages**
- **ALWAYS cross-reference location data** between the individual posting and the company careers index page. Individual postings can have stale/incomplete location data. The careers index is the source of truth.
- Quality over quantity — 10 verified active jobs > 30 unverified links
- If a job listing doesn't show salary, note "Not disclosed" but still include if the company/role typically pays above $140K
- Always convert salaries to CAD for easy comparison
- Include the original currency and amount in parentheses
- When salary comes from an estimation source, always mark it clearly as "est."
- Prefer fetching individual job posting pages from ATS systems (Greenhouse, Lever, Ashby, Workday, etc.) over aggregator sites
- When an ATS page doesn't render (returns JS only), fall back to the careers index page + cached data from third-party sites — do NOT mark the job as non-existent
