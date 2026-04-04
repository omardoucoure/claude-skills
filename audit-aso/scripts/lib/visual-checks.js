/**
 * Visual assets checks (9-11): Screenshots, icons, preview videos
 */

const { c, log, header, badge, addFinding, exec } = require("./helpers");
const { ASC_SCRIPT, GPS_SCRIPT } = require("../apps");

// ─── Check 9: iOS Screenshots ──────────────────────────────────────────────────

async function auditIOSScreenshots(appConfig) {
  header("CHECK 9: iOS Screenshots");

  const bundleId = appConfig.bundleId;

  // Get version info to find screenshot sets
  const versionsRaw = exec(`python3 ${ASC_SCRIPT} list-versions ${bundleId}`, { silent: true });

  let versionId = null;
  if (versionsRaw) {
    const match = versionsRaw.match(/Version ID:\s*(\S+)/i) || versionsRaw.match(/ID:\s*(\S+)/);
    if (match) versionId = match[1];
  }

  if (!versionId) {
    log(`\n  ${badge("INFO")} Cannot check screenshots — no version found in App Store Connect`);
    addFinding("Visual Assets", "MEDIUM", "iOS Screenshots", "Cannot verify iOS screenshots — no version found in App Store Connect");
    return { iosScreenshots: null };
  }

  const primaryLocale = appConfig.locales.ios[0] || "en-US";
  const screenshotsRaw = exec(
    `python3 ${ASC_SCRIPT} list-screenshots ${versionId} ${primaryLocale}`,
    { silent: true }
  );

  if (!screenshotsRaw) {
    log(`\n  ${badge("CRITICAL")} No screenshots found for ${primaryLocale}`);
    addFinding("Visual Assets", "CRITICAL", "iOS Screenshots", `No screenshots uploaded for ${primaryLocale} — screenshots are the #1 conversion factor`);
    return { iosScreenshots: 0 };
  }

  // Parse screenshot count
  const setMatches = screenshotsRaw.match(/Screenshots?:\s*(\d+)/gi) || [];
  const totalCount = setMatches.reduce((sum, m) => {
    const num = m.match(/(\d+)/);
    return sum + (num ? parseInt(num[1]) : 0);
  }, 0);

  // Check for specific device types
  const has67 = screenshotsRaw.toLowerCase().includes("6.9") || screenshotsRaw.toLowerCase().includes("iphone_67");
  const hasIPad = screenshotsRaw.toLowerCase().includes("ipad");

  log(`\n  Screenshots Response:`, c.dim);
  screenshotsRaw.split("\n").slice(0, 20).forEach((line) => {
    console.log(`    ${c.dim}${line}${c.reset}`);
  });

  // Count from output lines
  const lineCount = (screenshotsRaw.match(/screenshot/gi) || []).length;
  const effectiveCount = totalCount || lineCount || 0;

  log(`\n  Screenshot sets found: ~${effectiveCount}`);

  if (effectiveCount === 0) {
    addFinding("Visual Assets", "CRITICAL", "iOS Screenshots", "No screenshots uploaded — required for App Store submission");
  } else if (effectiveCount < 3) {
    addFinding("Visual Assets", "HIGH", "iOS Screenshots", `Only ~${effectiveCount} screenshots — recommend at least 6 for conversion`);
  } else if (effectiveCount < 6) {
    addFinding("Visual Assets", "LOW", "iOS Screenshots", `${effectiveCount} screenshots — consider adding more (up to 10) for better showcase`);
  } else {
    log(`  ${badge("OK")} Good screenshot coverage`);
  }

  if (!has67) {
    addFinding("Visual Assets", "HIGH", "iOS Screenshots", "No iPhone 6.9\" (16 Pro Max) screenshots — this is the mandatory primary device");
  }

  if (!hasIPad) {
    addFinding("Visual Assets", "MEDIUM", "iOS Screenshots", "No iPad screenshots — missing iPad users in search results");
  }

  return { iosScreenshots: effectiveCount };
}

// ─── Check 10: Android Screenshots ──────────────────────────────────────────────

async function auditAndroidScreenshots(appConfig) {
  header("CHECK 10: Android Screenshots");

  const packageName = appConfig.packageName;
  const primaryLocale = appConfig.locales.android[0] || "en-US";

  const imagesRaw = exec(
    `python3 ${GPS_SCRIPT} list-images ${packageName} ${primaryLocale}`,
    { silent: true }
  );

  if (!imagesRaw) {
    log(`\n  ${badge("CRITICAL")} No images found for ${primaryLocale} on Google Play`);
    addFinding("Visual Assets", "CRITICAL", "Android Screenshots", `No screenshots on Google Play for ${primaryLocale}`);
    return { androidScreenshots: 0 };
  }

  log(`\n  Images Response:`, c.dim);
  imagesRaw.split("\n").slice(0, 20).forEach((line) => {
    console.log(`    ${c.dim}${line}${c.reset}`);
  });

  // Parse phone screenshots
  const phoneMatch = imagesRaw.match(/phoneScreenshots?[:\s]*(\d+)/i);
  const phoneCount = phoneMatch ? parseInt(phoneMatch[1]) : 0;

  const tabletMatch = imagesRaw.match(/(?:sevenInch|tenInch)Screenshots?[:\s]*(\d+)/i);
  const hasTablet = tabletMatch && parseInt(tabletMatch[1]) > 0;

  if (phoneCount === 0) {
    // Check if there are any screenshots mentioned
    const anyScreenshots = imagesRaw.toLowerCase().includes("screenshot");
    if (!anyScreenshots) {
      addFinding("Visual Assets", "CRITICAL", "Android Screenshots", "No phone screenshots on Google Play");
    }
  } else if (phoneCount < 4) {
    addFinding("Visual Assets", "HIGH", "Android Screenshots", `Only ${phoneCount} phone screenshots — recommend at least 6`);
  } else {
    log(`  ${badge("OK")} ${phoneCount} phone screenshots`);
  }

  if (!hasTablet) {
    addFinding("Visual Assets", "MEDIUM", "Android Screenshots", "No tablet screenshots on Google Play");
  }

  return { androidScreenshots: phoneCount };
}

// ─── Check 11: App Preview / Promo Video ────────────────────────────────────────

async function auditPromoVideo(appConfig) {
  header("CHECK 11: App Preview / Promo Video");

  // Check iOS app previews
  const bundleId = appConfig.bundleId;
  const versionsRaw = exec(`python3 ${ASC_SCRIPT} list-versions ${bundleId}`, { silent: true });

  let hasIOSVideo = false;
  if (versionsRaw) {
    hasIOSVideo = versionsRaw.toLowerCase().includes("preview") ||
                  versionsRaw.toLowerCase().includes("video");
  }

  // Check Android promo video (from app stats / listing)
  const statsRaw = exec(`python3 ${GPS_SCRIPT} get-app-stats ${appConfig.packageName}`, { silent: true });
  let hasAndroidVideo = false;
  if (statsRaw) {
    hasAndroidVideo = statsRaw.toLowerCase().includes("video") ||
                      statsRaw.toLowerCase().includes("promo");
  }

  if (!hasIOSVideo && !hasAndroidVideo) {
    log(`\n  ${badge("LOW")} No app preview video on either platform`);
    log(`  Videos can increase conversion rate by 20-30%`);
    addFinding("Visual Assets", "LOW", "Promo Video", "No app preview video — videos boost conversion rate by 20-30%");
  } else {
    log(`\n  iOS preview: ${hasIOSVideo ? "Yes" : "No"}`);
    log(`  Android promo: ${hasAndroidVideo ? "Yes" : "No"}`);
    log(`  ${badge("OK")} Video present`);
  }

  return { hasIOSVideo, hasAndroidVideo };
}

module.exports = {
  auditIOSScreenshots,
  auditAndroidScreenshots,
  auditPromoVideo,
};
