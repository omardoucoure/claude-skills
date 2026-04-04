---
name: connect-playstore
description: Use when checking Android app status, updating release notes, managing builds, metadata, rollouts, images, in-app products, reviews, or publishing apps to Google Play Store
---

# Google Play Developer API

## Overview

Comprehensive tool for managing Android apps via Google Play Developer API. Uses `playstore_connect.py` script for all operations. Always prefer API over browser automation.

## When to Use

**Use this skill when:**
- Checking app status on Google Play Console
- Uploading AAB/APK files to release tracks
- Managing staged rollouts (update %, halt, resume, complete)
- Promoting releases between tracks (internal → alpha → beta → production)
- Updating metadata (descriptions, release notes, images)
- Managing in-app products and subscriptions
- Fetching app reviews and ratings
- Uploading icons, feature graphics, screenshots
- Accessing crash reports (via Firebase BigQuery)

**Project-Aware:** When working in a project directory, the skill automatically detects the package name from CLAUDE.md.

## Script Location

**Path:** `/Users/omardoucoure/Documents/OmApps/scripts/playstore_connect.py`
**Run from:** `/Users/omardoucoure/Documents/OmApps` (parent directory)

## Quick Reference

### Basic Operations
| Task | Command |
|------|---------|
| List apps | `python3 scripts/playstore_connect.py list-apps` |
| Check status | `python3 scripts/playstore_connect.py status <package_name>` |
| Get app info | `python3 scripts/playstore_connect.py app-info <package_name>` |

### Release Management
| Task | Command |
|------|---------|
| Upload AAB | `python3 scripts/playstore_connect.py upload-bundle <package_name> <aab_file> [track] [rollout]` |
| Promote release | `python3 scripts/playstore_connect.py promote <package_name> <from_track> <to_track> [rollout]` |
| List all tracks | `python3 scripts/playstore_connect.py list-tracks <package_name>` |
| Get track info | `python3 scripts/playstore_connect.py track-info <package_name> <track>` |

### Rollout Management ✨ NEW
| Task | Command |
|------|---------|
| Update rollout % | `python3 scripts/playstore_connect.py update-rollout <package_name> <percentage>` |
| Halt rollout | `python3 scripts/playstore_connect.py halt-rollout <package_name>` |
| Resume rollout | `python3 scripts/playstore_connect.py resume-rollout <package_name> [percentage]` |
| Complete rollout | `python3 scripts/playstore_connect.py complete-rollout <package_name>` |

### Images & Graphics ✨ NEW
| Task | Command |
|------|---------|
| Upload icon | `python3 scripts/playstore_connect.py upload-icon <package_name> <locale> <image_path>` |
| Upload feature graphic | `python3 scripts/playstore_connect.py upload-feature-graphic <package_name> <locale> <image_path>` |
| Upload screenshots | `python3 scripts/playstore_connect.py upload-screenshots <package_name> <locale> <screen_type> <image1> [image2...]` |
| List images | `python3 scripts/playstore_connect.py list-images <package_name> <locale>` |
| Delete images | `python3 scripts/playstore_connect.py delete-images <package_name> <locale> <image_type>` |

### In-App Products ✨ NEW
| Task | Command |
|------|---------|
| List products | `python3 scripts/playstore_connect.py list-products <package_name>` |
| Create product | `python3 scripts/playstore_connect.py create-product <package_name> <sku> <title> <price_usd>` |
| Update product | `python3 scripts/playstore_connect.py update-product <package_name> <sku> --title "..." --price 4.99` |
| Delete product | `python3 scripts/playstore_connect.py delete-product <package_name> <sku>` |

### Reviews & Ratings ✨ NEW
| Task | Command |
|------|---------|
| Get reviews | `python3 scripts/playstore_connect.py get-reviews <package_name> [count] --lang en --country us --sort NEWEST` |
| Get app stats | `python3 scripts/playstore_connect.py get-app-stats <package_name>` |

### Crash Reports ✨ NEW
| Task | Command |
|------|---------|
| Get crashes | `python3 scripts/playstore_connect.py crashes <package_name> [days_back]` |

### Metadata & Localization
| Task | Command |
|------|---------|
| List locales | `python3 scripts/playstore_connect.py list-locales <package_name>` |
| Update listing | `python3 scripts/playstore_connect.py update-listing <package_name> <locale> --title "..." --short "..." --full "..."` |

## Known Package Names

| App | Package Name | Project Path |
|-----|--------------|--------------|
| FUT Evolution | com.futevolution.app | FUT/mobile/ |
| Cuisine de Chez Nous | com.cuisinedecheznous.app | cuisinedecheznous/Web/ |
| Afrique Sport | com.afriquesports | Afrique Sports/ |

## Common Workflows

### 1. Upload New Build to Internal Testing

```bash
cd /Users/omardoucoure/Documents/OmApps

# Upload AAB to internal track (default)
python3 scripts/playstore_connect.py upload-bundle com.futevolution.app /path/to/app-release.aab

# Or specify track explicitly
python3 scripts/playstore_connect.py upload-bundle com.futevolution.app /path/to/app-release.aab internal
```

### 2. Promote Release Through Tracks

```bash
# Promote from internal to alpha
python3 scripts/playstore_connect.py promote com.futevolution.app internal alpha

# Promote from beta to production (full rollout)
python3 scripts/playstore_connect.py promote com.futevolution.app beta production

# Promote to production with 10% staged rollout
python3 scripts/playstore_connect.py promote com.futevolution.app beta production 0.1
```

### 3. ✨ Manage Staged Rollout (NEW)

```bash
# Start with 5% rollout
python3 scripts/playstore_connect.py promote com.futevolution.app beta production 0.05

# Monitor for 24-48 hours, then increase to 25%
python3 scripts/playstore_connect.py update-rollout com.futevolution.app 0.25

# If issues detected, halt immediately
python3 scripts/playstore_connect.py halt-rollout com.futevolution.app

# After fixing, resume at 10%
python3 scripts/playstore_connect.py resume-rollout com.futevolution.app 0.1

# If all good, complete to 100%
python3 scripts/playstore_connect.py complete-rollout com.futevolution.app
```

### 4. ✨ Upload App Icons & Graphics (NEW)

```bash
# Upload app icon (512x512)
python3 scripts/playstore_connect.py upload-icon com.futevolution.app en-US /path/to/icon.png

# Upload feature graphic (1024x500)
python3 scripts/playstore_connect.py upload-feature-graphic com.futevolution.app en-US /path/to/feature.png

# Upload phone screenshots
python3 scripts/playstore_connect.py upload-screenshots com.futevolution.app en-US phoneScreenshots \
  /path/to/screenshot1.png \
  /path/to/screenshot2.png \
  /path/to/screenshot3.png

# List all images for a locale
python3 scripts/playstore_connect.py list-images com.futevolution.app en-US

# Delete all phone screenshots
python3 scripts/playstore_connect.py delete-images com.futevolution.app en-US phoneScreenshots
```

### 5. ✨ Manage In-App Products (NEW)

```bash
# Create premium upgrade product
python3 scripts/playstore_connect.py create-product com.futevolution.app premium_upgrade "Premium Upgrade" 4.99

# List all products
python3 scripts/playstore_connect.py list-products com.futevolution.app

# Update product price
python3 scripts/playstore_connect.py update-product com.futevolution.app premium_upgrade --price 2.99

# Update product title
python3 scripts/playstore_connect.py update-product com.futevolution.app premium_upgrade --title "Premium Features"

# Delete product
python3 scripts/playstore_connect.py delete-product com.futevolution.app premium_upgrade
```

### 6. ✨ Fetch Reviews & Ratings (NEW)

```bash
# Get latest 100 reviews
python3 scripts/playstore_connect.py get-reviews com.futevolution.app 100

# Get reviews sorted by newest
python3 scripts/playstore_connect.py get-reviews com.futevolution.app 50 --sort NEWEST

# Get French reviews
python3 scripts/playstore_connect.py get-reviews com.futevolution.app 100 --lang fr --country fr

# Get app stats (rating, review count, installs)
python3 scripts/playstore_connect.py get-app-stats com.futevolution.app
```

### 7. ✨ Access Crash Reports (NEW)

```bash
# Get crashes from last 7 days (requires BigQuery setup)
python3 scripts/playstore_connect.py crashes com.futevolution.app 7

# Get crashes from last 30 days
python3 scripts/playstore_connect.py crashes com.futevolution.app 30
```

**Note:** Crash reports require Firebase Crashlytics BigQuery export enabled. See setup instructions below.

### 8. Update App Metadata

```bash
# Update title and descriptions for a locale
python3 scripts/playstore_connect.py update-listing com.futevolution.app en-US \
  --title "FUT Evolution - Squad Builder" \
  --short "Build your ultimate FUT team" \
  --full "Complete description here..."

# Update French metadata
python3 scripts/playstore_connect.py update-listing com.futevolution.app fr-FR \
  --title "FUT Evolution - Créateur d'Équipe" \
  --short "Construisez votre équipe FUT ultime"
```

## Release Tracks

| Track | Purpose | Who Can Access |
|-------|---------|----------------|
| **internal** | Internal testing | Up to 100 testers (email list) |
| **alpha** | Closed testing | Invited testers only |
| **beta** | Open testing | Anyone with opt-in link |
| **production** | Public release | All users on Play Store |

**Typical workflow:** internal → alpha → beta → production

## Image Types

| Type | Dimensions | Description |
|------|------------|-------------|
| `icon` | 512x512 | App icon (PNG, 24-bit) |
| `featureGraphic` | 1024x500 | Feature graphic |
| `phoneScreenshots` | Various | Phone screenshots (JPEG/PNG) |
| `sevenInchScreenshots` | Various | 7" tablet screenshots |
| `tenInchScreenshots` | Various | 10" tablet screenshots |
| `tvScreenshots` | Various | Android TV screenshots |
| `wearScreenshots` | Various | Wear OS screenshots |

## Staged Rollout Strategy

**Best practice for production releases:**

1. **Start small (5-10%)**
   ```bash
   python3 scripts/playstore_connect.py promote com.futevolution.app beta production 0.05
   ```

2. **Monitor for 24-48 hours**
   - Check crash reports
   - Monitor ratings/reviews
   - Watch for ANRs (Application Not Responding)

3. **Increase gradually**
   ```bash
   # Increase to 25%
   python3 scripts/playstore_connect.py update-rollout com.futevolution.app 0.25

   # Then 50%
   python3 scripts/playstore_connect.py update-rollout com.futevolution.app 0.5
   ```

4. **Halt if issues detected**
   ```bash
   python3 scripts/playstore_connect.py halt-rollout com.futevolution.app
   ```

5. **Complete rollout**
   ```bash
   python3 scripts/playstore_connect.py complete-rollout com.futevolution.app
   ```

## Dependencies & Setup

### Required Python Packages

```bash
cd /Users/omardoucoure/Documents/OmApps
pip3 install -r scripts/requirements-playstore.txt
```

**Core (required):**
- `google-api-python-client` - Play Developer API
- `google-auth` - Authentication

**Optional (but recommended):**
- `google-play-scraper` - Reviews & ratings scraping
- `google-cloud-bigquery` - Crash reports
- `Pillow` - Image processing

### Service Account Setup

1. **Create service account** in Google Cloud Console
2. **Enable** Google Play Developer API
3. **Grant access** in Play Console > Setup > API access
4. **Save credentials** to:
   ```
   /Users/omardoucoure/Documents/OmApps/credentials/play-store-service-account.json
   ```

See `/Users/omardoucoure/Documents/OmApps/scripts/PLAYSTORE_SETUP.md` for detailed instructions.

### Firebase Crashlytics BigQuery Setup (Optional)

For crash reports:

1. **Firebase Console** → Project Settings → Integrations → BigQuery → Enable
2. **Wait 24-48 hours** for first data export
3. **Update query** in `playstore_connect.py` with your project ID
4. **Set environment variable:**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
   ```

## API Capabilities - Full List

### ✅ FULLY SUPPORTED (via API)

| Feature | Method | Since |
|---------|--------|-------|
| Upload AAB/APK | `upload-bundle` | v1.0 |
| Manage release tracks | `promote`, `list-tracks` | v1.0 |
| Update metadata | `update-listing` | v1.0 |
| **Update rollout %** | `update-rollout` | **v2.0 ✨** |
| **Halt/resume rollout** | `halt-rollout`, `resume-rollout` | **v2.0 ✨** |
| **Upload icons/graphics** | `upload-icon`, `upload-feature-graphic` | **v2.0 ✨** |
| **Upload screenshots** | `upload-screenshots` | **v2.0 ✨** |
| **Manage in-app products** | `create-product`, `update-product` | **v2.0 ✨** |

### ✅ SUPPORTED (via scraping)

| Feature | Method | Library |
|---------|--------|---------|
| **Get reviews** | `get-reviews` | `google-play-scraper` |
| **Get app stats** | `get-app-stats` | `google-play-scraper` |

### ✅ SUPPORTED (via BigQuery)

| Feature | Method | Requires |
|---------|--------|----------|
| **Crash reports** | `crashes` | Firebase + BigQuery |

### ❌ NOT SUPPORTED

| Feature | Workaround |
|---------|------------|
| Create new apps | Use Play Console web UI |

## Common Locales

| Locale Code | Language |
|-------------|----------|
| en-US | English (US) |
| fr-FR | French (France) |
| es-ES | Spanish (Spain) |
| de-DE | German |
| it-IT | Italian |
| pt-BR | Portuguese (Brazil) |
| ja-JP | Japanese |
| zh-CN | Chinese (Simplified) |
| ko-KR | Korean |
| ru-RU | Russian |

## Common Mistakes

**❌ Using browser automation**
- Slow, fragile, requires user interaction
- ✅ Use API instead - faster and more reliable

**❌ Wrong working directory**
- Script looks for credentials relative to OmApps directory
- ✅ Always `cd /Users/omardoucoure/Documents/OmApps` first

**❌ Trying to upload to production directly**
- Best practice is to test in lower tracks first
- ✅ Use internal → alpha → beta → production workflow

**❌ Forgetting to grant service account access**
- Service account must have permission for each app
- ✅ Play Console > Setup > API access > Grant access to service account

**❌ Invalid rollout percentage**
- Must be between 0.0 and 1.0 (e.g., 0.1 = 10%)
- ✅ Use decimal format: 0.05, 0.1, 0.25, 0.5

**❌ Not monitoring staged rollouts**
- Rollout issues can affect many users if not caught early
- ✅ Monitor crashes, ANRs, reviews during rollout

**❌ Wrong image dimensions**
- Icon must be 512x512, feature graphic 1024x500
- ✅ Check image dimensions before upload

**❌ Forgetting optional dependencies**
- Reviews require `google-play-scraper`
- Crashes require `google-cloud-bigquery`
- ✅ Install all dependencies from requirements-playstore.txt

## Error Handling

**"Service account key not found"**
- Check `/Users/omardoucoure/Documents/OmApps/credentials/play-store-service-account.json`
- Ensure service account JSON is in correct location

**"Package not found"**
- Service account doesn't have access to this package
- Grant access in Play Console > Setup > API access

**"No releases found in track"**
- Source track is empty, nothing to promote
- Upload a build to source track first

**"Invalid track"**
- Track must be: internal, alpha, beta, or production
- Check spelling and use lowercase

**"Rollout percentage out of range"**
- Must be 0.0 to 1.0 (not 0-100)
- Use 0.1 for 10%, not 10

**"google-play-scraper not installed" (Reviews)**
- Missing optional dependency
- Install with: `pip3 install google-play-scraper`

**"google-cloud-bigquery not installed" (Crashes)**
- Missing optional dependency
- Install with: `pip3 install google-cloud-bigquery`

**"Image upload failed"**
- Check image dimensions (icon=512x512, feature=1024x500)
- Ensure image is PNG (icon) or PNG/JPEG (others)

**"Product already exists"**
- SKU must be unique per app
- Use different SKU or update existing product

## Related Resources

- [Google Play Developer API](https://developers.google.com/android-publisher)
- [APKs and Tracks](https://developers.google.com/android-publisher/tracks)
- [Edits.images API](https://developers.google.com/android-publisher/api-ref/rest/v3/edits.images)
- [In-app products API](https://developers.google.com/android-publisher/api-ref/rest/v3/inappproducts)
- [google-play-scraper GitHub](https://github.com/JoMingyu/google-play-scraper)
- [Firebase Crashlytics BigQuery](https://firebase.google.com/docs/crashlytics/bigquery-export)
