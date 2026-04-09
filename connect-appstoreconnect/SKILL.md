---
name: connect-appstoreconnect
description: Use when checking app status, rejection details, updating release notes, creating versions, managing builds, screenshots, metadata, or submitting iOS apps to App Store
---

# App Store Connect API

## Overview

Comprehensive tool for managing iOS apps via App Store Connect API. Uses `appstore_connect.py` script for all operations. Always prefer API over browser automation.

**🚀 IMPORTANT: Full App Deployment Workflow**
When the user requests to "deploy", "build and publish", or "upload to App Store/TestFlight", see `IOS_DEPLOYMENT_WORKFLOW.md` for the complete autonomous workflow that includes:
1. Creating apps in App Store Connect (via browser automation if needed)
2. Generating app icons
3. Configuring Xcode project
4. Building and uploading to TestFlight

**Be proactive** with build/upload steps, but **ALWAYS ask for explicit permission** before:
- Submitting for App Store review (`submit` command)
- Releasing a version (`release` command)
- Any action that changes the app's public-facing state

These are irreversible actions visible to Apple reviewers or end users. Never auto-submit or auto-release.

## When to Use

**Use this skill when:**
- **Deploying/uploading new or existing iOS apps** (see IOS_DEPLOYMENT_WORKFLOW.md)
- Checking app review status or rejection reasons
- Creating or managing app versions
- Assigning builds to versions
- Updating metadata (release notes, descriptions, keywords)
- Managing screenshots and localizations
- Submitting apps for review or releasing them **(only with explicit user permission)**
- Managing phased releases
- Getting app or build information

**Project-Aware:** When working in a project directory, the skill automatically detects the bundle ID from CLAUDE.md.

## Script Location

**Path:** `/Users/omardoucoure/Documents/OmApps/scripts/appstore_connect.py`
**Run from:** `/Users/omardoucoure/Documents/OmApps` (parent directory)

## Quick Reference

### Basic Operations
| Task | Command |
|------|---------|
| List all apps | `python3 scripts/appstore_connect.py list-apps` |
| Check status | `python3 scripts/appstore_connect.py status <bundle_id>` |
| Check rejection | `python3 scripts/appstore_connect.py rejection <bundle_id>` |
| Get app info | `python3 scripts/appstore_connect.py app-info <bundle_id>` |

### Version Management
| Task | Command |
|------|---------|
| List versions | `python3 scripts/appstore_connect.py list-versions <bundle_id>` |
| Create version | `python3 scripts/appstore_connect.py create-version <bundle_id> <version>` |
| Get version info | `python3 scripts/appstore_connect.py version-info <version_id>` |

### Build Management
| Task | Command |
|------|---------|
| List builds | `python3 scripts/appstore_connect.py list-builds <bundle_id>` |
| Get build info | `python3 scripts/appstore_connect.py build-info <build_id>` |
| Assign build | `python3 scripts/appstore_connect.py assign-build <version_id> <build_id>` |

### Metadata & Localization
| Task | Command |
|------|---------|
| List locales | `python3 scripts/appstore_connect.py list-locales <version_id>` |
| Update release notes | `python3 scripts/appstore_connect.py update-notes <bundle_id> <locale> <text>` |
| Update description | `python3 scripts/appstore_connect.py update-description <bundle_id> <locale> <text>` |
| Update keywords | `python3 scripts/appstore_connect.py update-keywords <bundle_id> <locale> <keywords>` |

### Screenshots
| Task | Command |
|------|---------|
| List screenshot sets | `python3 scripts/appstore_connect.py screenshot-sets <version_id> <locale>` |
| List screenshots | `python3 scripts/appstore_connect.py list-screenshots <version_id> <locale>` |
| Show accepted sizes | `python3 scripts/appstore_connect.py screenshot-sizes` |
| Upload single screenshot | `python3 scripts/appstore_connect.py upload-screenshot <bundle_id> <locale> <display_type> <image_path>` |
| Upload to multiple devices | `python3 scripts/appstore_connect.py upload-screenshots <bundle_id> <locale> <device_group> <image_path>` |
| Delete all in a set | `python3 scripts/appstore_connect.py delete-screenshots <set_id>` |

### Submission & Release
| Task | Command |
|------|---------|
| Submit for review | `python3 scripts/appstore_connect.py submit <bundle_id>` |
| Release version | `python3 scripts/appstore_connect.py release <version_id>` |

### Phased Release
| Task | Command |
|------|---------|
| Start phased | `python3 scripts/appstore_connect.py start-phased <version_id>` |
| Pause phased | `python3 scripts/appstore_connect.py pause-phased <version_id>` |
| Complete phased | `python3 scripts/appstore_connect.py complete-phased <version_id>` |

### Categories
| Task | Command |
|------|---------|
| List categories | `python3 scripts/appstore_connect.py categories` |

### Analytics & Statistics
| Task | Command |
|------|---------|
| Request analytics | `python3 scripts/appstore_connect.py request-analytics <bundle_id> <category>` |
| List analytics requests | `python3 scripts/appstore_connect.py list-analytics-requests [bundle_id]` |
| Check request status | `python3 scripts/appstore_connect.py analytics-status <request_id>` |
| List reports | `python3 scripts/appstore_connect.py list-analytics-reports <request_id>` |
| Download report data | `python3 scripts/appstore_connect.py download-analytics <report_id> [output_dir]` |
| Quick summary | `python3 scripts/appstore_connect.py analytics-summary <bundle_id>` |
| Stop analytics request | `python3 scripts/appstore_connect.py stop-analytics <request_id>` |

**Available Categories:**
- `APP_USAGE` - Active devices, sessions, installations, deletions
- `APP_STORE_ENGAGEMENT` - Impressions, page views, conversion rate
- `APP_STORE_COMMERCE` - Sales, revenue, in-app purchases
- `PERFORMANCE` - Crashes, hangs, memory, battery usage
- `FRAMEWORKS_USAGE` - Framework adoption

## Known Bundle IDs

| App | Bundle ID | Project Path |
|-----|-----------|--------------|
| Cuisine de Chez Nous | com.cuisinedecheznous.app | cuisinedecheznous/Web/ |
| MaichaLearning | com.doucoure.MaichaLearning | Projet Maicha/ |
| Adhan (Salah for Muslim) | D-labs.Adhan | Adhan/ |
| FUT Evolution | com.futevolution.app | FUT/mobile/ |
| Real Fan | D-labs.Real-de-Madrid | real-madrid-website/ |
| Afrique Sport | com.afriquesports | Afrique Sports/ |

## Project-Aware Detection

When user asks about "my app" or "this app" without specifying bundle ID:
1. Check current working directory
2. Look for APP_STORE_BUNDLE_ID in project's CLAUDE.md
3. Use that bundle ID automatically

**Example:**
```bash
# User is in /Users/omardoucoure/Documents/OmApps/cuisinedecheznous/Web/
# User says: "Check why my app was rejected"
# Automatically use: com.cuisinedecheznous.app
```

## Common Workflows

### 1. Check Rejection Status

```bash
cd /Users/omardoucoure/Documents/OmApps
python3 scripts/appstore_connect.py rejection com.cuisinedecheznous.app
```

**Output shows:**
- Rejected version numbers and states
- Creation dates
- Reminder to check email and Resolution Center

**Important:** API doesn't expose detailed rejection text. Direct user to:
1. Check email from App Review
2. Log into App Store Connect > Resolution Center

### 2. Create New Version After Rejection Fix

```bash
# Create version 6.1
python3 scripts/appstore_connect.py create-version com.cuisinedecheznous.app 6.1

# List available builds
python3 scripts/appstore_connect.py list-builds com.cuisinedecheznous.app

# Get version ID from create-version output, then assign build
python3 scripts/appstore_connect.py assign-build <version_id> <build_id>

# Update release notes for all locales
python3 scripts/appstore_connect.py update-notes com.cuisinedecheznous.app en-US "Bug fixes"
python3 scripts/appstore_connect.py update-notes com.cuisinedecheznous.app fr-FR "Corrections de bugs"

# Submit
python3 scripts/appstore_connect.py submit com.cuisinedecheznous.app
```

### 3. Manage Phased Release

```bash
# After app is approved, start phased release
python3 scripts/appstore_connect.py start-phased <version_id>

# Pause if issues detected
python3 scripts/appstore_connect.py pause-phased <version_id>

# Complete early if all good
python3 scripts/appstore_connect.py complete-phased <version_id>
```

### 4. Update Metadata for Existing Version

```bash
# Must be in PREPARE_FOR_SUBMISSION, WAITING_FOR_REVIEW, or IN_REVIEW state

# Update description
python3 scripts/appstore_connect.py update-description com.cuisinedecheznous.app fr-FR "Nouvelle description"

# Update keywords (comma-separated, max 100 chars)
python3 scripts/appstore_connect.py update-keywords com.cuisinedecheznous.app en-US "recipes,cooking,food"
```

### 5. List All Versions and Builds

```bash
# See all versions
python3 scripts/appstore_connect.py list-versions com.cuisinedecheznous.app

# See recent builds
python3 scripts/appstore_connect.py list-builds com.cuisinedecheznous.app

# Get detailed version info
python3 scripts/appstore_connect.py version-info <version_id>

# Get detailed build info
python3 scripts/appstore_connect.py build-info <build_id>
```

### 6. Analytics & Statistics (Async Workflow)

**⚠️ IMPORTANT:** Analytics requires "App Analytics" permission on your API key.

#### Enable Analytics Permission:
1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Go to **Users and Access > Keys**
3. Edit your API key (YOUR_KEY_ID)
4. Enable **"App Analytics"** role
5. Save changes

#### Analytics Workflow:

```bash
# Step 1: Request analytics report (async operation)
python3 scripts/appstore_connect.py request-analytics com.cuisinedecheznous.app APP_USAGE

# Output:
# ✓ Analytics report requested!
#   Request ID: abc123...
#   Category: APP_USAGE
#   Access Type: ONGOING
#
# 💡 Report generation is asynchronous.
#    Check status with: analytics-status abc123...

# Step 2: Check status (wait a few hours for first report)
python3 scripts/appstore_connect.py analytics-status abc123...

# Step 3: List available reports
python3 scripts/appstore_connect.py list-analytics-reports abc123...

# Step 4: Download report data (TSV files)
python3 scripts/appstore_connect.py download-analytics report_id ./analytics_data

# Quick Summary (checks existing requests and reports)
python3 scripts/appstore_connect.py analytics-summary com.cuisinedecheznous.app
```

**Available Metrics by Category:**

| Category | Metrics |
|----------|---------|
| **APP_USAGE** | Active Devices, Sessions, Installations, Deletions (Uninstalls) |
| **APP_STORE_ENGAGEMENT** | Impressions, Product Page Views, Conversion Rate, Install Events |
| **APP_STORE_COMMERCE** | Sales, Revenue, In-App Purchases, Subscription Renewals |
| **PERFORMANCE** | Crashes, Hang Rate, Memory Usage, Battery Usage |
| **FRAMEWORKS_USAGE** | Framework Adoption, API Usage Patterns |

**Notes:**
- Reports are generated **asynchronously** (takes hours to days for first report)
- **ONGOING** requests provide continuous daily updates
- **ONE_TIME_SNAPSHOT** provides historical data once
- Downloaded data is in **TSV format** (tab-separated values)
- Each report contains daily/weekly/monthly granularity

### 7. Upload Screenshots for App Store Submission

```bash
# View all accepted screenshot sizes
python3 scripts/appstore_connect.py screenshot-sizes

# Upload a single screenshot to a specific device type
python3 scripts/appstore_connect.py upload-screenshot com.futevolution.app en-US APP_IPHONE_67 /path/to/screenshot.png

# Upload to ALL iPhone + iPad sizes at once (auto-resize)
python3 scripts/appstore_connect.py upload-screenshots com.futevolution.app en-US all_ios /path/to/screenshot.png

# Upload to just iPhones
python3 scripts/appstore_connect.py upload-screenshots com.futevolution.app en-US iphone /path/to/screenshot.png

# Upload to just iPads
python3 scripts/appstore_connect.py upload-screenshots com.futevolution.app en-US ipad /path/to/screenshot.png

# Delete all screenshots from a specific set (get set_id from screenshot-sets)
python3 scripts/appstore_connect.py delete-screenshots <set_id>
```

**Upload workflow (behind the scenes):**
1. Gets editable version and locale ID for the bundle
2. Gets or creates a screenshot set for the display type
3. Resizes source image to target resolution (Pillow, aspect-ratio crop)
4. Reserves upload slot via API
5. Uploads binary to Apple's asset delivery URL (PUT)
6. Commits upload with MD5 checksum verification

**Tips:**
- Upload up to 10 screenshots per device type
- Use the largest device size screenshot (6.9" for iPhone, 13" for iPad) as source for best quality
- Apple auto-generates smaller device sizes from the largest upload
- Both portrait and landscape orientations are accepted

## Version States

| State | Meaning | Can Edit? |
|-------|---------|-----------|
| PREPARE_FOR_SUBMISSION | Ready to submit | ✅ Yes |
| WAITING_FOR_REVIEW | Submitted, in queue | ✅ Yes |
| IN_REVIEW | Apple reviewing | ✅ Yes |
| PENDING_DEVELOPER_RELEASE | Approved, manual release | ❌ No |
| READY_FOR_SALE | Live on App Store | ❌ No |
| REJECTED | Rejected by Apple | ❌ No |
| METADATA_REJECTED | Metadata needs fixes | ❌ No |
| DEVELOPER_REJECTED | Developer cancelled | ❌ No |

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
| zh-Hans | Chinese (Simplified) |

## Screenshot Display Types & Resolutions

### iPhone Display Types (Official Apple Resolutions)

| Display Type | Size | Primary Resolution | Description |
|---|---|---|---|
| `APP_IPHONE_67` | 6.9" | 1320x2868 | iPhone 16 Pro Max, 15 Pro Max (mandatory) |
| `APP_IPHONE_65` | 6.5" | 1284x2778 | iPhone 14 Plus, 13 Pro Max, 11 Pro Max |
| `APP_IPHONE_61` | 6.1" | 1206x2622 | iPhone 16 Pro, 16, 15 |
| `APP_IPHONE_58` | 5.8" | 1125x2436 | iPhone X, XS, 11 Pro |
| `APP_IPHONE_55` | 5.5" | 1242x2208 | iPhone 8 Plus, 7 Plus, 6s Plus |

### iPad Display Types

| Display Type | Size | Primary Resolution | Description |
|---|---|---|---|
| `APP_IPAD_PRO_3GEN_129` | 13" | 2064x2752 | iPad Pro 13" (mandatory for iPad) |
| `APP_IPAD_PRO_3GEN_11` | 11" | 1668x2420 | iPad Pro 11", iPad Air |
| `APP_IPAD_PRO_129` | 12.9" | 2048x2732 | iPad Pro 12.9" (1st/2nd gen) |
| `APP_IPAD_105` | 10.5" | 1668x2224 | iPad Air 3rd gen, iPad Pro 10.5" |
| `APP_IPAD_97` | 9.7" | 1536x2048 | iPad 9th gen and older |

### Other Platforms

| Display Type | Resolution | Description |
|---|---|---|
| `APP_APPLE_TV` | 3840x2160 | Apple TV |
| `APP_WATCH_ULTRA` | 410x502 | Apple Watch Ultra |
| `APP_WATCH_SERIES_7` | 396x484 | Apple Watch Series 7+ |

### Device Groups for Batch Upload

Use these preset groups with `upload-screenshots`:
- `iphone` - All 5 iPhone sizes (6.9", 6.5", 6.1", 5.8", 5.5")
- `ipad` - All 5 iPad sizes (13", 11", 12.9", 10.5", 9.7")
- `all_ios` - All iPhone + iPad sizes (10 total)
- `tv` - Apple TV only
- `watch` - All Apple Watch sizes

**Auto-resize:** Screenshots are automatically resized with aspect-ratio-aware cropping using Pillow. Upload one source image and it gets adapted to each device's required resolution.

**Apple downscaling:** Upload the largest resolution for each family. Apple automatically generates smaller sizes from the 6.9" (iPhone) and 13" (iPad) uploads.

## Common Mistakes

**❌ Using browser automation**
- Slow, fragile, requires user interaction
- ✅ Use API instead - faster and more reliable

**❌ Wrong working directory**
- Script looks for credentials relative to OmApps directory
- ✅ Always `cd /Users/omardoucoure/Documents/OmApps` first

**❌ Expecting detailed rejection reasons from API**
- API only shows state (REJECTED, METADATA_REJECTED)
- ✅ Direct user to email and Resolution Center for details

**❌ Trying to edit live version**
- READY_FOR_SALE versions are read-only
- ✅ Create new version to make changes

**❌ Forgetting to assign build**
- Creating version doesn't assign a build automatically
- ✅ Use `assign-build` after `create-version`

**❌ Using wrong locale code**
- Must match exact Apple locale codes (e.g., `en-US` not `en`)
- ✅ Use `list-locales` to see available locales

**❌ Keywords too long**
- Keywords have 100-character limit total
- ✅ Keep keywords concise, comma-separated

**❌ Analytics API 403 Forbidden**
- API key doesn't have "App Analytics" permission
- ✅ Enable "App Analytics" role in App Store Connect > Users and Access > Keys

**❌ Expecting immediate analytics data**
- Analytics reports are generated asynchronously (takes hours/days)
- ✅ Create request, wait, then check status periodically

**❌ Not understanding ONGOING vs ONE_TIME_SNAPSHOT**
- ONGOING = continuous daily updates (recommended)
- ONE_TIME_SNAPSHOT = one-time historical data
- ✅ Use ONGOING for monitoring, ONE_TIME for historical analysis

**❌ Uploading wrong screenshot resolution**
- Apple rejects screenshots that don't match accepted dimensions
- ✅ Use `screenshot-sizes` to check accepted resolutions, or use `upload-screenshot`/`upload-screenshots` which auto-resize

**❌ Using simulator screenshots directly**
- Simulator screenshots have non-standard resolutions (e.g., 1206x2622)
- ✅ Script auto-resizes to correct dimensions, but higher-res source images produce better quality

**❌ Trying to create an app via API**
- App Store Connect API returns 403 for POST /v1/apps even with Admin key
- ✅ Create apps manually via App Store Connect web UI, then manage via API

## Error Handling

**"App not found with bundle ID"**
- Check bundle ID spelling
- Use `list-apps` to see all available apps

**"No editable version found"**
- Version is not in PREPARE_FOR_SUBMISSION, WAITING_FOR_REVIEW, or IN_REVIEW
- Check current state with `status` command
- Create new version if needed

**"Could not find AuthKey_YOUR_KEY_ID.p8"**
- Key missing from expected locations
- Check `$CREDENTIALS_DIR/`

**"Locale not found"**
- Locale doesn't exist for this version
- Use `list-locales` to see available locales
- May need to add locale in App Store Connect web UI first

**"No version ready for submission"**
- No version in PREPARE_FOR_SUBMISSION state
- Check `status` to see current version states
- Ensure build is assigned and all metadata is complete

**"Analytics API access denied" (403 Forbidden)**
- API key doesn't have "App Analytics" permission enabled
- Fix: App Store Connect > Users and Access > Keys > Edit key > Enable "App Analytics"
- This permission is separate from basic app management permissions

**"No reports available yet" (Analytics)**
- Reports are generated asynchronously (takes hours to days for first report)
- ONGOING requests provide daily updates after initial generation
- Check back periodically with `analytics-status` command

**"Display Type Not Allowed!" (Screenshots)**
- Using a locale ID from the wrong platform version
- Apps registered as UNIVERSAL may have two versions (iOS + macOS)
- ✅ Use `list-versions` to find the correct iOS version ID, then get locale from that version

**"Screenshot upload failed" / MD5 mismatch**
- Binary upload or checksum verification failed
- ✅ Retry the upload; script handles MD5 computation automatically

**"Pillow/PIL not installed" (Screenshots)**
- Screenshot resize requires Pillow library
- ✅ Install with `pip install Pillow`

## Dependencies

**Required Python packages:**
```bash
pip install pyjwt requests cryptography Pillow
```

**Authentication:**
- Script auto-generates JWT tokens (20-minute expiry)
- No manual token management needed
- Credentials stored in .p8 file

## API Limitations

**What API CAN do:**
- ✅ Create versions, assign builds
- ✅ Update metadata (notes, description, keywords)
- ✅ Submit for review, release versions
- ✅ Manage phased releases
- ✅ **Upload, list, and delete screenshots** (with auto-resize)
- ✅ Get app/version/build information
- ✅ **Request and download analytics reports** (async)
- ✅ **Access 50+ analytics metrics** (downloads, revenue, crashes, engagement)

**What API CANNOT do:**
- ❌ Create apps (must use App Store Connect web UI)
- ❌ Upload app icons (requires web UI)
- ❌ Get detailed rejection reasons (check email/Resolution Center)
- ❌ Manage TestFlight (different API endpoints)
- ❌ Upload builds (use Xcode, Transporter, or fastlane)
- ❌ Get real-time analytics (reports are generated asynchronously)

## Related Resources

- [App Store Connect API Documentation](https://developer.apple.com/documentation/appstoreconnectapi)
- [Runway's Complete Guide](https://www.runway.team/blog/a-hitchhikers-guide-to-the-app-store-connect-api)
- [Upload Assets Guide](https://www.runway.team/blog/how-to-upload-assets-using-the-app-store-connect-api)
- [WWDC 2020 Session](https://developer.apple.com/videos/play/wwdc2020/10004/)
