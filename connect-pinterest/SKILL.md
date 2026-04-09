---
name: connect-pinterest
description: Use when checking Pinterest stats, publishing pins, pinning recipes, managing boards, viewing top pins, or doing anything related to Pinterest for Cuisine de Chez Nous
---

# Pinterest API — Cuisine de Chez Nous

## Overview

Full Pinterest management via Pinterest API v5. Uses `pinterest_connect.py` for all operations.
Always use the script — never use browser automation for Pinterest.

**Account:** @cuisinedecheznous — BUSINESS account
- 302 followers · 835K monthly views · 3,172 pins · 2 boards

## Script Location

**Path:** `/Users/omardoucoure/Documents/OmApps/scripts/pinterest_connect.py`
**Run from:** `/Users/omardoucoure/Documents/OmApps`
**Token:** Stored at `$CREDENTIALS_DIR/pinterest_token.txt`

## Known Board IDs

| Board | ID | Pins |
|---|---|---|
| Cuisinedecheznous (main) | `YOUR_BOARD_ID` | ~3,167 |
| Social | `YOUR_BOARD_ID` | 4 |

**Default board for all new pins:** `YOUR_BOARD_ID` (Cuisinedecheznous)

## Quick Reference

### Account & Analytics
| Task | Command |
|------|---------|
| Show account info | `python3 scripts/pinterest_connect.py account` |
| Analytics (last 30d) | `python3 scripts/pinterest_connect.py analytics` |
| Analytics (custom days) | `python3 scripts/pinterest_connect.py analytics 7` |
| Analytics with daily table | `python3 scripts/pinterest_connect.py analytics 30 --daily` |
| Top 10 pins (last 30d) | `python3 scripts/pinterest_connect.py top-pins` |
| Top 25 pins, by saves | `python3 scripts/pinterest_connect.py top-pins 30 --count 25 --sort-by SAVE` |
| Top pins with URLs | `python3 scripts/pinterest_connect.py top-pins 30 --count 10 -v` |

### Board Management
| Task | Command |
|------|---------|
| List all boards | `python3 scripts/pinterest_connect.py boards` |
| List board sections | `python3 scripts/pinterest_connect.py board-sections <board_id>` |
| Create a board | `python3 scripts/pinterest_connect.py create-board "Plats africains" --description "..."` |
| Create a section | `python3 scripts/pinterest_connect.py create-section <board_id> "Poulet"` |

### Pin Management
| Task | Command |
|------|---------|
| List pins on main board | `python3 scripts/pinterest_connect.py pins` |
| List pins on board | `python3 scripts/pinterest_connect.py pins <board_id> --count 50` |
| Get pin details | `python3 scripts/pinterest_connect.py pin-info <pin_id>` |
| Pin analytics | `python3 scripts/pinterest_connect.py pin-analytics <pin_id>` |
| Pin analytics (7d) | `python3 scripts/pinterest_connect.py pin-analytics <pin_id> 7` |
| Delete a pin | `python3 scripts/pinterest_connect.py delete-pin <pin_id>` |
| Save/repin | `python3 scripts/pinterest_connect.py save-pin <pin_id> <board_id>` |

### Publishing Pins
| Task | Command |
|------|---------|
| **Pin a recipe** (smart) | `python3 scripts/pinterest_connect.py pin-recipe <recipe_url>` |
| Pin a recipe to specific board | `python3 scripts/pinterest_connect.py pin-recipe <recipe_url> --board-id <board_id>` |
| Create pin manually | `python3 scripts/pinterest_connect.py create-pin "Title" <image_url> <link_url>` |
| Create pin with description | `python3 scripts/pinterest_connect.py create-pin "Title" <img_url> <link> --description "..."` |
| Create pin in section | `python3 scripts/pinterest_connect.py create-pin "Title" <img_url> <link> --section-id <id>` |

## Common Workflows

### 1. Check Pinterest Performance

```bash
cd /Users/omardoucoure/Documents/OmApps

# Quick overview
python3 scripts/pinterest_connect.py account

# Last 30 days analytics
python3 scripts/pinterest_connect.py analytics 30

# See which recipe is crushing it
python3 scripts/pinterest_connect.py top-pins 30 --count 10 -v
```

### 2. Pin a Recipe from cuisinedecheznous.net

```bash
cd /Users/omardoucoure/Documents/OmApps

# Pin-recipe fetches the WordPress metadata automatically:
# - title from post title
# - featured image from WordPress media
# - description built from prep_time, cook_time, difficulty, servings
# - link = the recipe URL

python3 scripts/pinterest_connect.py pin-recipe \
  https://www.cuisinedecheznous.net/blog/2023/09/12/sautes-de-haricots-verts-et-poisson-capitaine/
```

**What pin-recipe does:**
1. Fetches post data from WordPress REST API (`/wp-json/wp/v2/posts?slug=...&_embed=1`)
2. Extracts title, featured image, prep time, cook time, difficulty, servings
3. Builds a French description with metadata
4. Creates a Pinterest pin on the main board

### 3. Compare Weekly vs Monthly Performance

```bash
python3 scripts/pinterest_connect.py analytics 7
python3 scripts/pinterest_connect.py analytics 30
python3 scripts/pinterest_connect.py analytics 90
```

### 4. Find Which Pins Drive Website Traffic

```bash
# Sort by outbound clicks (actual website visits from Pinterest)
python3 scripts/pinterest_connect.py top-pins 30 --count 25 --sort-by OUTBOUND_CLICK -v
```

### 5. Organize Content with Board Sections

```bash
# Create themed sections in the main board
python3 scripts/pinterest_connect.py create-section YOUR_BOARD_ID "Poulet"
python3 scripts/pinterest_connect.py create-section YOUR_BOARD_ID "Poisson"
python3 scripts/pinterest_connect.py create-section YOUR_BOARD_ID "Riz et légumes"
python3 scripts/pinterest_connect.py create-section YOUR_BOARD_ID "Desserts"

# Then pin a recipe into a specific section:
python3 scripts/pinterest_connect.py pin-recipe \
  https://www.cuisinedecheznous.net/blog/... \
  --board-id YOUR_BOARD_ID \
  --section-id <section_id>
```

### 6. Create a Pin Manually

```bash
# When you have a specific image URL and want full control
python3 scripts/pinterest_connect.py create-pin \
  "🍛 Poulet Yassa — Recette Sénégalaise Authentique" \
  "https://www.cuisinedecheznous.net/wp-content/uploads/sites/7/2023/01/poulet-yassa.jpg" \
  "https://www.cuisinedecheznous.net/blog/2023/01/15/poulet-yassa/" \
  --description "Difficulté : Facile • Préparation : 20 min • Cuisson : 45 min • Pour 4 personnes

Découvrez la recette complète sur Cuisine de Chez Nous !"
```

### 7. See Analytics for a Specific Pin

```bash
# First find the pin ID (from top-pins or pins list)
python3 scripts/pinterest_connect.py top-pins 30 -v

# Then get its analytics
python3 scripts/pinterest_connect.py pin-analytics 709528116329305709
python3 scripts/pinterest_connect.py pin-analytics 709528116329305709 90
```

## Analytics Metrics Explained

| Metric | What it means |
|--------|---------------|
| **Impressions** | Times your pin was seen in feeds, searches, or boards |
| **Pin Clicks** | Clicks on the pin (opens pin detail view) |
| **Saves** | Times someone saved your pin to their board |
| **Outbound Clicks** | Clicks that went to cuisinedecheznous.net (actual traffic) |
| **Save Rate** | Saves ÷ Impressions (engagement quality) |
| **Outbound CTR** | Outbound Clicks ÷ Impressions (traffic efficiency) |

**Available sort options for top-pins:** `IMPRESSION`, `PIN_CLICK`, `SAVE`, `OUTBOUND_CLICK`

**Date range limits:**
- Standard analytics: up to 90 days back
- Data takes 1-2 days to become "READY"

## What the API Can and Cannot Do

### ✅ Supported

- View account stats (followers, monthly views, pin count)
- Analytics for account (impressions, clicks, saves, outbound) — up to 90 days
- Top pins analytics — up to 25 pins at once
- Per-pin analytics (impressions, clicks, saves, outbound)
- List boards and board sections
- Create boards (PUBLIC, PROTECTED, SECRET)
- Create board sections
- List pins on a board (with pagination)
- Get pin details (title, description, link, image, type)
- Create image pins via URL (standard REGULAR type)
- Delete owned pins
- Save/repin public pins to your boards
- **pin-recipe**: Smart pin from any cuisinedecheznous.net recipe URL

### ❌ Not Supported via API

- Creating IDEA pins (only via Pinterest app/web)
- Uploading video pins (requires media upload flow — separate process)
- Viewing Pinterest search rankings
- Responding to comments
- Creating carousel pins (contact Pinterest for access)
- Real-time analytics (data has 1-2 day delay)
- Audience demographics breakdown
- Editing existing pin title/description (delete and recreate instead)

## Pin Types in Your Account

All ~3,172 existing pins are **IDEA** type (created via the Pinterest web/app interface).
New pins created via this script will be **REGULAR** type (standard image pins with link).
Both types appear in feeds and search — REGULAR type drives more outbound clicks.

## Error Handling

**"Authentication failed"**
- Token expired or revoked
- Get a new token from developers.pinterest.com → your app → "Generate access token"
- Save to `$CREDENTIALS_DIR/pinterest_token.txt`

**"Pin not found" (404) on top-pins**
- Some top pins are saved from other accounts (repins)
- Script handles this gracefully — shows `[repin — ID: ...]`

**"No recipe found for slug"**
- Recipe URL might use a different slug
- Try checking the WordPress REST API directly:
  `curl "https://www.cuisinedecheznous.net/wp-json/wp/v2/posts?slug=YOUR-SLUG"`

**"Image URL required"**
- Some older WordPress posts may not have a featured image
- Use `create-pin` manually and provide a direct image URL

## Daily Scheduler (Automated Publishing)

**Script:** `/Users/omardoucoure/Documents/OmApps/scripts/pinterest_scheduler.py`
**State file:** `$CREDENTIALS_DIR/pinterest_scheduler_state.json`

### Commands
| Task | Command |
|------|---------|
| Publish today's pins (Ramadan mode) | `python3 scripts/pinterest_scheduler.py --run --ramadan` |
| Publish today's pins (normal) | `python3 scripts/pinterest_scheduler.py --run` |
| Preview without publishing | `python3 scripts/pinterest_scheduler.py --dry-run --ramadan` |
| Check progress | `python3 scripts/pinterest_scheduler.py --status` |
| Custom count | `python3 scripts/pinterest_scheduler.py --run --ramadan --count 7` |
| Halal filter only (no Ramadan style) | `python3 scripts/pinterest_scheduler.py --run --halal-only` |

### Daily Pins Per Mode
- **Ramadan mode** (`--ramadan`): 5 pins/day, Halal filter ON, Iftar/Suhoor CTAs, Ramadan hashtags
- **Normal mode**: 3 pins/day

### Cron Job (run at 7pm daily during Ramadan)
```bash
# Add to crontab: crontab -e
0 19 * * * cd /Users/omardoucoure/Documents/OmApps && python3 scripts/pinterest_scheduler.py --run --ramadan >> /tmp/pinterest_scheduler.log 2>&1
```

### What the Scheduler Does
1. Fetches unpinned recipes from WordPress (4,301 total)
2. Filters out already-pinned recipes (tracked in state JSON)
3. Applies Halal filter (blocks: porc, lardons, bacon, vin, bière, rhum, etc.)
4. Scores recipes by completeness (prep_time + cook_time + servings = better)
5. Builds optimized description with hook → metadata → tease → CTA → hashtags
6. Creates REGULAR pins (with clickable "Visit site" button — drives outbound clicks)
7. Saves pinned IDs to state file so no recipe is pinned twice

## Account Reference

| Property | Value |
|----------|-------|
| Username | `cuisinedecheznous` |
| Account ID | `709528253702029555` |
| Type | BUSINESS |
| Monthly Views | ~835K |
| Main Board ID | `YOUR_BOARD_ID` |
| WordPress API | `https://www.cuisinedecheznous.net/wp-json/wp/v2` |
