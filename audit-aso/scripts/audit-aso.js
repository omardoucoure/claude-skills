#!/usr/bin/env node

/**
 * ASO Audit Script (v2 — modular)
 * 16 checks + 100-point ASO score
 *
 * Usage:
 *   node audit-aso.js                  # Interactive app selection
 *   node audit-aso.js futevolution     # Direct app selection
 *   node audit-aso.js chatbook         # Direct app selection
 *   node audit-aso.js --list-apps      # List all configured apps
 */

const { c, log, header, clearFindings } = require("./lib/helpers");
const { APPS } = require("./apps");
const {
  auditIOSTitle,
  auditIOSSubtitle,
  auditIOSKeywords,
  auditIOSDescription,
  auditIOSPromoText,
} = require("./lib/ios-checks");
const {
  auditAndroidTitle,
  auditAndroidShortDesc,
  auditAndroidFullDesc,
} = require("./lib/android-checks");
const {
  auditIOSScreenshots,
  auditAndroidScreenshots,
  auditPromoVideo,
} = require("./lib/visual-checks");
const {
  auditRating,
  auditReviewCount,
  auditReviewSentiment,
} = require("./lib/ratings-checks");
const {
  auditLocaleCompleteness,
  auditKeywordLocalization,
} = require("./lib/locale-checks");
const { computeASOScore } = require("./lib/scoring");

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Handle --list-apps
  if (args.includes("--list-apps")) {
    console.log("\nConfigured apps:");
    for (const [key, app] of Object.entries(APPS)) {
      console.log(`  ${key.padEnd(15)} ${app.name.padEnd(20)} iOS: ${app.bundleId}  Android: ${app.packageName}`);
      console.log(`  ${"".padEnd(15)} Locales: ${app.locales.ios.join(", ")}`);
    }
    return;
  }

  // App selection
  let appKey = args[0]?.toLowerCase();

  if (!appKey) {
    console.log("\n  Select an app to audit:\n");
    const keys = Object.keys(APPS);
    keys.forEach((key, i) => {
      console.log(`    ${i + 1}. ${APPS[key].name} (${key})`);
    });
    console.log(`\n  Usage: node audit-aso.js <app-key>`);
    console.log(`  Example: node audit-aso.js futevolution`);
    return;
  }

  // Allow partial match
  const matchedKey = Object.keys(APPS).find((k) => k.startsWith(appKey) || k.includes(appKey));
  if (!matchedKey) {
    console.error(`\n  App "${appKey}" not found. Available: ${Object.keys(APPS).join(", ")}`);
    return;
  }

  const appConfig = APPS[matchedKey];

  // Reset state
  clearFindings();

  console.log("\n" + "\u2588".repeat(80));
  log(`  ASO AUDIT v2 — ${appConfig.name}`, c.bold + c.cyan);
  log(`  iOS: ${appConfig.bundleId} | Android: ${appConfig.packageName}`, c.dim);
  log(`  Category: ${appConfig.category}`, c.dim);
  log(`  Locales: ${appConfig.locales.ios.join(", ")}`, c.dim);
  log(`  Date: ${new Date().toISOString()}`, c.dim);
  log(`  Checks: 16 | Score: 100 points`, c.dim);
  console.log("\u2588".repeat(80));

  const startTime = Date.now();

  // ── iOS Metadata Checks (1-5) ─────────────────────────────────────────────────
  const titleData = await auditIOSTitle(appConfig);
  const subtitleData = await auditIOSSubtitle(appConfig, titleData);
  await auditIOSKeywords(appConfig, titleData, subtitleData);
  await auditIOSDescription(appConfig, titleData);
  await auditIOSPromoText(appConfig, titleData);

  // ── Android Metadata Checks (6-8) ─────────────────────────────────────────────
  const androidTitleData = await auditAndroidTitle(appConfig);
  await auditAndroidShortDesc(appConfig, androidTitleData);
  await auditAndroidFullDesc(appConfig, androidTitleData);

  // ── Visual Assets Checks (9-11) ───────────────────────────────────────────────
  await auditIOSScreenshots(appConfig);
  await auditAndroidScreenshots(appConfig);
  await auditPromoVideo(appConfig);

  // ── Ratings & Reviews Checks (12-14) ──────────────────────────────────────────
  const ratingData = await auditRating(appConfig);
  await auditReviewCount(appConfig, ratingData);
  await auditReviewSentiment(appConfig);

  // ── Locale Coverage Checks (15-16) ────────────────────────────────────────────
  await auditLocaleCompleteness(appConfig);
  await auditKeywordLocalization(appConfig);

  // ── Score (summary) ───────────────────────────────────────────────────────────
  computeASOScore();

  // ── App Context (for Claude to generate optimizations) ────────────────────────
  header("APP CONTEXT FOR OPTIMIZATION");
  console.log(`\n  App: ${appConfig.name}`);
  console.log(`  Bundle: ${appConfig.bundleId}`);
  console.log(`  Category: ${appConfig.category}`);
  console.log(`  Primary Keywords: ${appConfig.keywords.primary.join(", ")}`);
  console.log(`  Secondary Keywords: ${appConfig.keywords.secondary.join(", ")}`);
  console.log(`  Long-tail Keywords: ${appConfig.keywords.longtail.join(", ")}`);
  console.log(`  Supported Locales: ${appConfig.locales.ios.join(", ")}`);
  console.log(`\n  Key Features:`);
  appConfig.features.forEach((f) => console.log(`    - ${f}`));
  if (appConfig.competitors.length > 0) {
    console.log(`\n  Competitors:`);
    appConfig.competitors.forEach((comp) => {
      console.log(`    - ${comp.name} (iOS: ${comp.iosId}, Android: ${comp.androidId})`);
    });
  }

  // ── Footer ────────────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  header("AUDIT COMPLETE");
  console.log(`  Duration: ${elapsed}s`);
  console.log(`  App: ${appConfig.name} (${appConfig.bundleId})`);
  console.log(`  Checks run: 16`);
  console.log(`  Date: ${new Date().toISOString()}\n`);
}

main().catch((err) => {
  console.error(`\n${c.red}Fatal error: ${err.message}${c.reset}`);
  console.error(err.stack);
  process.exit(1);
});
