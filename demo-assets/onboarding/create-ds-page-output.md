<!-- SECTION: step1 -->
## Step 1: Prepare (BLOCKING)

### 1.1 Screen type identified: **walkthrough/onboarding**

### 1.2 Reading the pattern YAML
Reading `~/.claude/skills/create-ds-page/references/patterns/walkthrough.yaml`...
Pattern loaded. 18 walkthrough screens, 7 layout variants available.
Selected layout: `carousel_hero_dark_cta` (nodeId: `85:56062`)

### 1.3 Reading the component YAMLs
- `DSCarousel.yaml` — spotlight style, image cards with rounded corners
- `DSPageControl.yaml` — 5 dots, first active (dark), rest inactive (neutral)
- `DSButton.yaml` — filledA (coral), Skip button
- `DSCard.yaml` — container padding, surfacePrimary100 background
- `DSTopAppBar.yaml` — Status Bar style + Home Indicator

### 1.4 Extracted components and rules

**Components to use:**
- `Status Bar` — iOS status bar (8:30, signal, wifi, battery)
- `DSCarousel` — spotlight style, hero image cards with rounded corners (surfaceNeutral2 bg)
- `Page Controls` — 5 dots, first active (surfacePrimary120), rest inactive (borderNeutral2)
- `DSCard` — dark CTA card (surfacePrimary100, rgb 70,90,84), radius 32, padding 32
- `DSButton` — "Skip" coral button (filledA), small size
- `Home Indicator` — iOS swipe bar at bottom

**Key rules from YAMLs:**
1. Hero image carousel takes ~60% of screen height — this is the visual anchor
2. Page dots sit between carousel and CTA card, left-aligned
3. CTA card uses `surfacePrimary100` (rgb 70,90,84) — same as login social card
4. Text on dark card must be light (`textNeutral05`)
5. Skip button is coral (`filledA`), positioned bottom-right of CTA card
6. Page background always `surfaceNeutral05`

<!-- SECTION: step2 -->
## Step 2: Build

Creating onboarding page in Figma...

- **Screen frame**: 393 × 852, `surfaceNeutral05` background
- **Status Bar**: iOS status bar (8:30, signal indicators, battery)
- **Carousel**: spotlight hero with 3D art images, rounded corners (surfaceNeutral2)
  - Main card visible (~85% width), peek of next card on right
  - High-quality abstract/3D art fills
- **Page Controls**: 5 dots, first active (dark pill), rest inactive (circles)
- **CTA Card**: `surfacePrimary100` (rgb 70,90,84), radius 32, padding 32
  - Title: "Colors That Pop, Designs That Wow" (h4, `textNeutral05`)
  - Description: "Compose with a palette of endless possibilities." (body, `textNeutral05`, 60% opacity)
  - Skip button: filledA (coral), small, bottom-right
- **Home Indicator**: iOS swipe bar pinned at bottom

**Screenshot captured** — displaying Figma result:

[Screenshot: Onboarding page with carousel hero + page dots + dark CTA card + skip button]

Visual check: All components correctly placed, no overflow, proper contrast.

<!-- SECTION: step3 -->
## Step 3: Check

Running `check-ds-page`...

| Check | Status | Issues |
|-------|--------|--------|
| 1. Icon Consistency | ✅ PASS | No icons required for this layout |
| 2. Social Button Icons | ✅ PASS | N/A — no social buttons on onboarding |
| 3. Background Contrast | ✅ PASS | Image cards on surfaceNeutral05, CTA card surfacePrimary100 |
| 3b. Foreground Contrast | ✅ PASS | Light text on dark CTA card, coral Skip button readable |
| 4. Spacing Token Values | ✅ PASS | All spacing uses DS tokens (xl=32, lg=24, sm=12) |
| 5. Pattern Correctness | ✅ PASS | Walkthrough pattern with carousel + CTA card |
| 6. Property Completeness | ✅ PASS | All text content configured, page dots correct count |
| 7. Visual Validation | ✅ PASS | No bleeds, truncation, or overlap artifacts |
| 8. Screen Layout Structure | ✅ PASS | Status Bar first child, Home Indicator last child |
| 9. YAML Component Rules | ✅ PASS | All figma_instance_rules satisfied |
| 10. DS Component Usage | ✅ PASS | All elements are real component instances |
| 11. Container Card Usage | ✅ PASS | CTA card from Container Card component |

### Issues to fix: 0
### Result: ✅ PASS — All 11 checks passed

Onboarding page created successfully.
