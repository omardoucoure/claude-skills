# ASO Audit Checks Reference

16 checks organized into 5 scoring dimensions (100 points total).

## Scoring Dimensions

| Dimension | Max Points | Description |
|-----------|-----------|-------------|
| iOS Metadata | 25 | Title, subtitle, keywords field, description, promotional text |
| Android Metadata | 20 | Title, short description, full description |
| Visual Assets | 20 | Screenshots count & coverage, icon presence, preview video |
| Ratings & Reviews | 15 | Average rating, review count, recent review sentiment |
| Locale Coverage | 20 | Metadata completeness across all supported locales |

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

## iOS Metadata Checks (1-5)

### 1. App Name (Title)
- **Source**: App Store Connect API (`appStoreVersionLocalizations`)
- **Max chars**: 30
- **What**: Brand presence, primary keyword inclusion, character usage
- **Findings**:
  - Empty title → CRITICAL
  - Title < 15 chars (wasting > 50% of space) → HIGH
  - Title doesn't include category keyword → MEDIUM
  - Title uses all 30 chars optimally → OK

### 2. Subtitle
- **Source**: App Store Connect API (`appStoreVersionLocalizations.subtitle`)
- **Max chars**: 30
- **What**: Secondary keyword presence, complements title (no duplication)
- **Findings**:
  - No subtitle set → HIGH
  - Subtitle < 15 chars → MEDIUM
  - Subtitle duplicates words from title → MEDIUM
  - Subtitle uses all 30 chars optimally → OK

### 3. Keyword Field
- **Source**: App Store Connect API (`appStoreVersionLocalizations.keywords`)
- **Max chars**: 100
- **What**: Character usage, no spaces after commas, no duplicates from title/subtitle, keyword relevance
- **Findings**:
  - No keywords set → CRITICAL
  - Keywords < 50 chars (wasting > 50%) → HIGH
  - Spaces after commas (wasting chars) → MEDIUM
  - Keywords duplicate words from title/subtitle → MEDIUM
  - Uses singular instead of covering both forms → LOW

### 4. Description
- **Source**: App Store Connect API (`appStoreVersionLocalizations.description`)
- **Max chars**: 4000
- **What**: First 3 lines keyword-rich, feature bullets, social proof, structured format
- **Findings**:
  - No description → CRITICAL
  - Description < 200 chars → HIGH
  - No feature bullets or structured format → MEDIUM
  - First 3 lines lack primary keywords → MEDIUM

### 5. Promotional Text
- **Source**: App Store Connect API (`appInfoLocalizations.promotionalText`)
- **Max chars**: 170
- **What**: Updated regularly, includes seasonal/event keywords, highlights unique value
- **Findings**:
  - No promotional text → MEDIUM (can be updated without review)
  - Promotional text < 80 chars → LOW

---

## Android Metadata Checks (6-8)

### 6. Google Play Title
- **Source**: Google Play Developer API (`listings.title`)
- **Max chars**: 50
- **What**: Brand + primary keywords, character usage
- **Findings**:
  - Empty title → CRITICAL
  - Title < 25 chars (wasting > 50%) → HIGH
  - Title doesn't include category keyword → MEDIUM

### 7. Short Description
- **Source**: Google Play Developer API (`listings.shortDescription`)
- **Max chars**: 80
- **What**: Compelling, keyword-rich, character usage
- **Findings**:
  - No short description → HIGH
  - Short description < 40 chars → MEDIUM
  - Doesn't include primary keywords → MEDIUM

### 8. Full Description
- **Source**: Google Play Developer API (`listings.fullDescription`)
- **Max chars**: 4000
- **What**: Keywords in first 3 lines, feature bullets, call to action, keyword density
- **Findings**:
  - No full description → CRITICAL
  - Description < 500 chars → HIGH
  - No feature bullets → MEDIUM
  - First paragraph lacks keywords → MEDIUM

---

## Visual Assets Checks (9-11)

### 9. iOS Screenshots
- **Source**: App Store Connect API (`appScreenshotSets`)
- **What**: Count per device type, caption presence, feature coverage
- **Findings**:
  - No screenshots → CRITICAL
  - < 3 screenshots for primary device → HIGH
  - No iPhone 6.9" (mandatory) screenshots → HIGH
  - No iPad screenshots → MEDIUM
  - < 6 screenshots (missing opportunities) → LOW

### 10. Android Screenshots
- **Source**: Google Play Developer API (`images.list`)
- **What**: Count per screen type, quality
- **Findings**:
  - No phone screenshots → CRITICAL
  - < 4 phone screenshots → HIGH
  - No tablet screenshots → MEDIUM

### 11. App Preview / Promo Video
- **Source**: App Store Connect (preview sets), Google Play (promo video URL)
- **What**: Video presence on either platform
- **Findings**:
  - No video on either platform → LOW (nice-to-have)
  - Video present → OK (conversion boost)

---

## Ratings & Reviews Checks (12-14)

### 12. Average Rating
- **Source**: App Store Connect analytics / Google Play scraper
- **What**: Current average star rating
- **Findings**:
  - No ratings yet (new app) → MEDIUM
  - Rating < 3.0 → CRITICAL
  - Rating 3.0-3.9 → HIGH
  - Rating 4.0-4.4 → LOW
  - Rating >= 4.5 → OK

### 13. Review Count
- **Source**: App Store Connect / Google Play scraper
- **What**: Total number of reviews, recent review velocity
- **Findings**:
  - 0 reviews → MEDIUM
  - < 10 reviews → LOW
  - >= 50 reviews → OK

### 14. Recent Review Sentiment
- **Source**: Google Play scraper (last 20 reviews)
- **What**: Sentiment of recent reviews, common complaints
- **Findings**:
  - >50% negative (1-2 stars) in recent reviews → HIGH
  - >30% negative → MEDIUM
  - <20% negative → OK

---

## Locale Coverage Checks (15-16)

### 15. Locale Completeness
- **Source**: App Store Connect + Google Play locale listings
- **What**: All supported locales have title, description, keywords, screenshots
- **Findings**:
  - Locale with missing title → CRITICAL
  - Locale with missing description → HIGH
  - Locale with missing keywords (iOS) → HIGH
  - Locale with missing screenshots → MEDIUM

### 16. Keyword Localization Quality
- **Source**: Cross-check localized keywords against locale
- **What**: Keywords are actually localized (not just English copied), locale-specific search terms
- **Findings**:
  - Non-English locale with only English keywords → HIGH
  - Keywords identical across all locales → MEDIUM
  - Keywords properly localized → OK

---

## Competitor Context (Informational — no score impact)

### Competitor Analysis
- **Source**: Web scraping of App Store / Google Play search results
- **What**: Top 5 competitors' titles, subtitles, ratings, download counts
- **Purpose**: Context for keyword gap analysis and positioning recommendations
- **Output**: Comparison table with keyword overlap and differentiation opportunities
