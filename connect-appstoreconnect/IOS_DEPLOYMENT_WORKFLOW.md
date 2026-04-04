# iOS App Deployment to App Store Connect - Complete Workflow

## Overview

This document provides the complete automated workflow for deploying iOS apps from Xcode projects to App Store Connect, including creating the app in App Store Connect, generating app icons, and uploading builds.

## When to Use This Workflow

**Automatically trigger this workflow when the user asks to:**
- "Deploy [app name] to App Store Connect"
- "Upload [app name] to TestFlight"
- "Build and publish [app name]"
- "Release [app name] to App Store"

**CRITICAL: Be proactive!** When you detect these requests, immediately:
1. Use `/connect-appstoreconnect` skill to check if app exists
2. If app doesn't exist, create it via browser automation
3. Execute the full build and upload workflow below

## Complete Deployment Steps

### Step 1: Check if App Exists in App Store Connect

```bash
cd /Users/omardoucoure/Documents/OmApps
python3 scripts/appstore_connect.py app-info [bundle-id]
```

If app doesn't exist, proceed to Step 2. If it exists, skip to Step 3.

### Step 2: Create App in App Store Connect (Browser Automation)

**CRITICAL: API cannot create apps!** Must use browser automation:

1. **Get context and create tab:**
```
mcp__claude-in-chrome__tabs_context_mcp(createIfEmpty: true)
mcp__claude-in-chrome__tabs_create_mcp()
```

2. **Create Bundle ID at developer.apple.com:**
   - Navigate to https://developer.apple.com/account/resources/identifiers/list
   - Sign in if needed
   - Click "+" button to create new identifier
   - Select "App IDs" → Continue
   - Select "App" → Continue
   - Enter Description and Bundle ID
   - Click "Continue" → "Register"

3. **Create App at appstoreconnect.apple.com:**
   - Navigate to https://appstoreconnect.apple.com/apps
   - Sign in if needed
   - Click "+" → "New App"
   - Select iOS platform
   - Enter App Name, Primary Language
   - Select the Bundle ID created in step 2
   - Enter SKU (typically same as bundle ID)
   - Select "Full Access" for User Access
   - Click "Create"

### Step 3: Prepare Xcode Project for App Store

**Extract bundle ID from Xcode project:**
```bash
cd "/path/to/project"
grep -A 1 "PRODUCT_BUNDLE_IDENTIFIER" *.xcodeproj/project.pbxproj | grep "=" | cut -d'=' -f2 | tr -d ' ;' | head -1
```

**Team ID:**
`FD4Q5PUHPM` (use for all projects)

### Step 4: Generate App Icons (if missing)

**Check if app icons exist:**
```bash
find . -name "AppIcon.appiconset" -exec ls -la {} \;
```

**If icons are missing or empty, generate them:**

```python
from PIL import Image, ImageDraw, ImageFont

# Create 1024x1024 base icon WITHOUT alpha channel
size = 1024
img = Image.new('RGB', (size, size))  # IMPORTANT: RGB not RGBA!
draw = ImageDraw.Draw(img)

# Gradient background (adjust colors for app theme)
for y in range(size):
    ratio = y / size
    r = int(120 * (1 - ratio) + 60 * ratio)
    g = int(80 * (1 - ratio) + 120 * ratio)
    b = int(200 * (1 - ratio) + 240 * ratio)
    draw.rectangle([(0, y), (size, y+1)], fill=(r, g, b))

# Add app-specific graphics (book, letter, symbol, etc.)
# ... (customize based on app purpose)

# Save 1024x1024 icon
img.save('path/to/Assets.xcassets/AppIcon.appiconset/icon_1024x1024.png')

# Generate all required sizes
sizes = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180]
for size in sizes:
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(f'path/to/Assets.xcassets/AppIcon.appiconset/icon_{size}x{size}.png')
```

**Update Contents.json:**
```json
{
  "images": [
    {"filename": "icon_1024x1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"},
    {"filename": "icon_20x20.png", "idiom": "iphone", "scale": "1x", "size": "20x20"},
    {"filename": "icon_40x40.png", "idiom": "iphone", "scale": "2x", "size": "20x20"},
    {"filename": "icon_60x60.png", "idiom": "iphone", "scale": "3x", "size": "20x20"},
    {"filename": "icon_29x29.png", "idiom": "iphone", "scale": "1x", "size": "29x29"},
    {"filename": "icon_58x58.png", "idiom": "iphone", "scale": "2x", "size": "29x29"},
    {"filename": "icon_87x87.png", "idiom": "iphone", "scale": "3x", "size": "29x29"},
    {"filename": "icon_40x40.png", "idiom": "iphone", "scale": "1x", "size": "40x40"},
    {"filename": "icon_80x80.png", "idiom": "iphone", "scale": "2x", "size": "40x40"},
    {"filename": "icon_120x120.png", "idiom": "iphone", "scale": "3x", "size": "40x40"},
    {"filename": "icon_120x120.png", "idiom": "iphone", "scale": "2x", "size": "60x60"},
    {"filename": "icon_180x180.png", "idiom": "iphone", "scale": "3x", "size": "60x60"},
    {"filename": "icon_20x20.png", "idiom": "ipad", "scale": "1x", "size": "20x20"},
    {"filename": "icon_40x40.png", "idiom": "ipad", "scale": "2x", "size": "20x20"},
    {"filename": "icon_29x29.png", "idiom": "ipad", "scale": "1x", "size": "29x29"},
    {"filename": "icon_58x58.png", "idiom": "ipad", "scale": "2x", "size": "29x29"},
    {"filename": "icon_40x40.png", "idiom": "ipad", "scale": "1x", "size": "40x40"},
    {"filename": "icon_80x80.png", "idiom": "ipad", "scale": "2x", "size": "40x40"},
    {"filename": "icon_76x76.png", "idiom": "ipad", "scale": "1x", "size": "76x76"},
    {"filename": "icon_152x152.png", "idiom": "ipad", "scale": "2x", "size": "76x76"},
    {"filename": "icon_167x167.png", "idiom": "ipad", "scale": "2x", "size": "83.5x83.5"}
  ],
  "info": {"author": "xcode", "version": 1}
}
```

### Step 5: Ensure Assets.xcassets is in Xcode Project

**Check if Assets.xcassets is referenced:**
```bash
grep "Assets.xcassets" project.pbxproj
```

**If not found, add it to project.pbxproj:**

1. Add PBXFileReference:
```
BB0019 /* Assets.xcassets */ = {isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; };
```

2. Add to PBXBuildFile:
```
AA0019 /* Assets.xcassets in Resources */ = {isa = PBXBuildFile; fileRef = BB0019 /* Assets.xcassets */; };
```

3. Add to PBXGroup (find the main group, add BB0019):
```
children = (
    ...,
    BB0019 /* Assets.xcassets */,
);
```

4. Add to PBXResourcesBuildPhase:
```
files = (
    AA0019 /* Assets.xcassets in Resources */,
);
```

### Step 6: Configure Info.plist for App Icons and Encryption

**If project uses GENERATE_INFOPLIST_FILE = YES:**

Change to manual Info.plist in project.pbxproj:
```
GENERATE_INFOPLIST_FILE = NO;
INFOPLIST_FILE = [AppName]/Info.plist;
```

**Add CFBundleIconName to Info.plist:**
```xml
<key>CFBundleIconName</key>
<string>AppIcon</string>
```

**Add Encryption Compliance Keys (CRITICAL - Avoids Manual Dialog):**

For most standard apps that only use Apple's built-in encryption (HTTPS, standard iOS data protection), add:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

This tells Apple that your app does NOT use custom encryption algorithms and only relies on Apple's operating system encryption. This bypasses the manual "App Encryption Documentation" dialog during upload.

**When to use `<false/>`:**
- App only uses HTTPS for network communication
- App only uses standard iOS data protection APIs
- App does NOT implement custom encryption algorithms
- App does NOT use third-party encryption libraries (other than standard SSL/TLS)

**When to use `<true/>` and provide documentation:**
- App implements custom encryption algorithms
- App uses third-party encryption libraries (e.g., OpenSSL, libsodium)
- App performs cryptographic operations beyond standard HTTPS/data protection

**Complete Info.plist Example:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIconName</key>
    <string>AppIcon</string>
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>
    <!-- Other keys... -->
</dict>
</plist>
```

### Step 7: Create ExportOptions.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>destination</key>
    <string>upload</string>
    <key>teamID</key>
    <string>FD4Q5PUHPM</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>uploadSymbols</key>
    <true/>
</dict>
</plist>
```

Save in project root directory.

### Step 8: Build and Archive

```bash
cd "/path/to/project"
xcodebuild -project [AppName].xcodeproj \
  -scheme [AppName] \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/[AppName].xcarchive \
  -allowProvisioningUpdates \
  archive
```

**Check for success:**
```
** ARCHIVE SUCCEEDED **
```

### Step 9: Export and Upload to App Store Connect

```bash
xcodebuild -exportArchive \
  -archivePath build/[AppName].xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/export \
  -allowProvisioningUpdates
```

**Check for success:**
```
** EXPORT SUCCEEDED **
Progress 100%: Upload succeeded.
```

### Step 10: Verify Upload

Wait 1-2 minutes for processing, then check:

```bash
cd /Users/omardoucoure/Documents/OmApps
python3 scripts/appstore_connect.py list-builds [bundle-id]
python3 scripts/appstore_connect.py status [bundle-id]
```

## Common Issues and Solutions

### Issue: "App Encryption Documentation" Dialog After Upload

**Symptoms:**
After upload succeeds, App Store Connect shows a dialog asking "What type of encryption algorithms does your app implement?"

**Solution:**
Add `ITSAppUsesNonExemptEncryption` key to Info.plist BEFORE uploading:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

For standard apps using only Apple's built-in encryption, set to `<false/>`. This bypasses the manual dialog entirely.

**If dialog already appeared:**
1. Select "None of the algorithms mentioned above" (for standard apps)
2. Click "Save"
3. Add the Info.plist key for future uploads
4. No need to re-upload - the build is already accepted

### Issue: "Missing required icon file" or "Missing CFBundleIconName"

**Solution:**
1. Ensure Assets.xcassets is added to project.pbxproj (Step 5)
2. Ensure CFBundleIconName is in Info.plist (Step 6)
3. Rebuild archive

### Issue: "Invalid large app icon" (alpha channel)

**Solution:**
Recreate icons using `Image.new('RGB', ...)` instead of `Image.new('RGBA', ...)`. App icons MUST NOT have transparency.

### Issue: "No profiles for [bundle-id] were found"

**Solution:**
Use `-allowProvisioningUpdates` flag with xcodebuild. This allows Xcode to automatically create distribution profiles.

### Issue: Assets.car not in app bundle

**Solution:**
Assets.xcassets is not in Xcode project. Follow Step 5 to add it.

## Credentials and Configuration

**Team ID:** FD4Q5PUHPM
**API Key:** AuthKey_52Q2P8DHLU.p8
**Key ID:** 52Q2P8DHLU
**Issuer ID:** 382a7b25-765f-4e15-ba75-5a7575276772

**API Key Location:**
- `/Users/omardoucoure/Documents/OmApps/credentials/AuthKey_52Q2P8DHLU.p8`

## Automation Workflow Summary

When user requests "Deploy [app] to App Store", execute:

1. **Check app exists** → If no, **create via browser** (developer.apple.com + appstoreconnect.apple.com)
2. **Extract bundle ID** from project
3. **Generate app icons** if missing (RGB only, no alpha!)
4. **Add Assets.xcassets** to Xcode project if not present
5. **Configure Info.plist** (manual mode + CFBundleIconName)
6. **Create ExportOptions.plist**
7. **Build archive** with xcodebuild
8. **Export and upload** to App Store Connect
9. **Verify upload** via API

**Be autonomous for build/upload steps** — do NOT ask for permission at each build step. However, **ALWAYS ask for explicit permission before submitting for review or releasing**. These are irreversible actions that affect the app's public state. Stop after upload + build assignment and confirm with the user before submitting.

## Examples

### Example 1: New App (MaichaLearning)

```bash
# User: "Deploy MaichaLearning to App Store Connect"

# 1. Check if exists
cd /Users/omardoucoure/Documents/OmApps
python3 scripts/appstore_connect.py app-info com.doucoure.MaichaLearning
# → App not found

# 2. Create bundle ID + app via browser automation
# (use chrome tools)

# 3-9. Follow Steps 3-9 above

# Result: App uploaded successfully to TestFlight
```

### Example 2: Existing App Update

```bash
# User: "Upload new build of Cuisine de Chez Nous"

# 1. App exists, skip creation
# 2. Icons exist, skip generation
# 3-9. Build and upload directly

cd "/Users/omardoucoure/Documents/OmApps/cuisinedecheznous/mobile"
xcodebuild -project ... archive
xcodebuild -exportArchive ... upload
```

## Related Skills

- `/connect-appstoreconnect` - Check app status, manage versions, update metadata
- `/connect-playstore` - Android equivalent

## Notes

- **Be proactive** with build, upload, icon generation, and project configuration steps
- **ALWAYS ask before submitting for review or releasing** — these are irreversible and affect the app's public state
- **ALWAYS** use browser automation for app creation (API can't create apps)
- **ALWAYS** ensure icons have NO alpha channel (RGB only)
- **ALWAYS** add Assets.xcassets to Xcode project
- Build process takes 2-5 minutes
- Upload takes 1-2 minutes
- Processing in App Store Connect takes 5-15 minutes

---

Last Updated: 2026-02-08
