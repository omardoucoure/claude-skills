---
name: generate-app-screenshots
description: Generate professional App Store and Google Play screenshot sets from raw app screenshots. Use when user says "generate screenshots", "app store screenshots", "create store listing images", "screenshot generator", "ASO screenshots", or wants to create promotional screenshots for iOS or Android app stores.
---

# App Store Screenshot Generator

Generate premium, conversion-optimized App Store & Google Play screenshots from raw app screenshots.

## Important

- Always ask for the **target language** first (or use the one specified)
- Always ask for **raw screenshots** if not provided
- Follow the high-conversion screenshot formula (headline on top, big phone below, bleeds off bottom)
- Use **Plus Jakarta Sans** font (or the app's brand font if specified)
- Export at exact App Store dimensions: **1290x2796px** (iPhone 6.7")

## Instructions

### Step 1: Gather inputs

Ask the user for:
1. **Raw screenshots** from their app (simulator or device)
2. **Target language** (en, fr, es, ar, de, etc.)
3. **App name** and **key features** to highlight
4. **Color preferences** — or analyze the app's design system automatically
5. **Phone frame preference** — iPhone model and color (default: iPhone 17 Cosmic Orange)

### Step 2: Analyze the app's design system

Before designing, search the codebase for:
- Brand colors (gradients, accents)
- Font family and weights
- Theme tokens (dark/light mode)

Use this to match the screenshot background and typography to the app's visual identity.

### Step 3: Plan the screenshot sequence

Follow the **high-conversion formula** (based on ASO research):
- **Screenshot 1**: Hero benefit — the #1 value proposition (grabs attention)
- **Screenshot 2-3**: Core features — show the magic (what makes the app special)
- **Screenshot 4-5**: Secondary features — additional value
- **Screenshot 6-7**: Social proof / notifications / unique differentiators

For each screenshot, define:
- A short **tagline** (category label, uppercase, accent color)
- A bold **headline** (2 lines max, one word/phrase in accent color)
- Which **raw screenshot** to use
- Optional **feature badge** at the bottom

### Step 4: Generate the HTML template

Create a single HTML file with:

#### Background
- Vivid gradient background (match app's palette or use a complementary bold color)
- Should be bright and eye-catching, not dark
- Smooth diagonal gradient works best (e.g., purple-to-pink, blue-to-purple)

#### Phone mockup (iPhone 17 style)
- **Ultra-thin bezel**: 4px preview / 12px full-res (matches real 1.44mm)
- **Cosmic Orange frame** (`#C45E1A` to `#D4722A` gradient) or user's choice
- **Dynamic Island** with camera lens detail
- **Side buttons** matching the frame color
- **Glass reflection**: subtle diagonal light streak (10-14% opacity peak)
- **Screen depth shadow**: inset shadow for recessed glass effect
- Phone should be **large** and **bleed off the bottom** of the frame

#### Typography
- Google Fonts import for the app's font
- Tagline: small, uppercase, letter-spaced, accent color
- Headline: extra-bold (800), large, white with one colored accent word

#### Layout
- Headline at the top (compact)
- Phone below, taking up ~75% of the frame
- Phone overflows the bottom edge (clipped)
- Optional feature badge at the bottom of the frame

#### Export system
- Preview section at 1/3 scale for quick visual review
- Full-res section at exactly **1290x2796px** per frame
- html2canvas export button to download all PNGs at once

### Step 5: Output structure

Create the files in `{project}/app-store-screenshots/`:
```
app-store-screenshots/
  images/           # Raw screenshots (copied and renamed)
  screenshots-{lang}.html   # The generated template
```

### Step 6: Iterate with user

Open the HTML in the browser and iterate on:
- Headline wording and accent words
- Background gradient colors
- Phone frame color
- Glass effect intensity
- Font size and spacing
- Screenshot order

## Phone Frame Reference

### iPhone 17 (2025)
- Bezel: 1.44mm (ultra-thin)
- Screen corner radius: 55pt
- Material: Anodized aluminum
- Colors available:
  - **Cosmic Orange**: `#C45E1A` to `#D4722A` (highlight: `#FFBA80`)
  - **Black**: `#1c1c1e` to `#2c2c2e`
  - **Silver**: `#C0C0C0` to `#E0E0E0`
  - **Deep Blue**: `#1a3a6b` to `#2a5a9b`

### Dynamic Island
- Preview: width 96px, height 26px, border-radius 14px, top 10px
- Full-res: width 288px, height 78px, border-radius 42px, top 30px
- Camera lens: radial gradient, positioned right side

## Conversion Best Practices

- 70% of users decide based on visuals alone
- Users spend ~7 seconds deciding — first 3 screenshots are critical
- Well-designed screenshots boost conversion by 20-35%
- High contrast between background and app UI is the #1 factor
- Avoid blue backgrounds (competes with iOS "Get" button)
- Localize headlines for each market
- A/B test via Apple Product Page Optimization
- Update screenshots 2-4x per year

## App Store Dimensions

| Device | Size (px) |
|--------|-----------|
| iPhone 6.7" | 1290 x 2796 |
| iPhone 6.1" | 1179 x 2556 |
| iPad 12.9" | 2048 x 2732 |
| iPad 11" | 1668 x 2388 |

## Troubleshooting

### Screenshots look blurry in export
- Ensure html2canvas `scale: 1` and source images are full resolution
- Use simulator screenshots (not device screenshots which may be compressed)

### Glass effect not visible
- Check z-index ordering: img < glass-reflection < screen-depth
- Increase opacity of the diagonal streak (peak should be 10-14%)

### Phone frame too thick
- iPhone 17 bezel is only 1.44mm — use 4px padding at preview scale

### French accents missing
- Always use proper accents: é, è, ê, ë, à, ù, ç, etc.
- Double-check all headlines before export
