/**
 * iOS App Store Connect metadata checks (1-5)
 */

const { c, log, header, subHeader, badge, addFinding, exec, charUsage, findDuplicateWords } = require("./helpers");
const { ASC_SCRIPT, OMAPPS } = require("../apps");

// ─── Fetch iOS localization metadata for a version ──────────────────────────────

function fetchVersionLocaleData(bundleId) {
  // Step 1: Get the latest version ID
  const versionsRaw = exec(`python3 ${ASC_SCRIPT} list-versions ${bundleId}`, { silent: true });
  if (!versionsRaw) return null;

  // Find first version ID (format: "  ID: uuid")
  const versionMatch = versionsRaw.match(/ID:\s*([0-9a-f-]{36})/);
  if (!versionMatch) return null;

  const versionId = versionMatch[1];

  // Step 2: Get full localization data
  const localesRaw = exec(`python3 ${ASC_SCRIPT} list-locales ${versionId}`, { silent: true });
  if (!localesRaw) return null;

  // Parse all locales into a structured object
  const locales = {};
  const localeBlocks = localesRaw.split(/(?=Locale: )/);

  for (const block of localeBlocks) {
    const localeMatch = block.match(/Locale:\s*(\S+)/);
    if (!localeMatch) continue;

    const locale = localeMatch[1];
    const idMatch = block.match(/ID:\s*(\S+)/);
    const subtitleMatch = block.match(/Subtitle:\s*(.+)/);
    const keywordsMatch = block.match(/Keywords:\s*(.+)/);
    const descMatch = block.match(/Description:\s*(\d+)\s*chars/);
    const descPreviewMatch = block.match(/Description Preview:\s*(.+)/);
    const promoMatch = block.match(/Promotional Text:\s*(.+)/);

    locales[locale] = {
      id: idMatch ? idMatch[1] : null,
      subtitle: subtitleMatch ? subtitleMatch[1].trim() : null,
      keywords: keywordsMatch ? keywordsMatch[1].trim() : null,
      descriptionLength: descMatch ? parseInt(descMatch[1]) : 0,
      descriptionPreview: descPreviewMatch ? descPreviewMatch[1].trim() : null,
      promotionalText: promoMatch ? promoMatch[1].trim() : null,
    };

    // Filter out "(empty)" values
    for (const key of Object.keys(locales[locale])) {
      const val = locales[locale][key];
      if (val === "(empty)" || val === "None" || val === "N/A") {
        locales[locale][key] = null;
      }
    }
  }

  return { versionId, locales, raw: localesRaw };
}

// ─── Check 1: App Name (Title) ─────────────────────────────────────────────────

async function auditIOSTitle(appConfig) {
  header("CHECK 1: iOS App Name (Title)");

  const bundleId = appConfig.bundleId;
  const primaryLocale = appConfig.locales.ios[0] || "en-US";

  // Get app info (basic: name, bundle, SKU)
  const appInfo = exec(`python3 ${ASC_SCRIPT} app-info ${bundleId}`, { silent: true });

  let title = null;

  if (appInfo) {
    const nameMatch = appInfo.match(/^App:\s*(.+)/im) ||
                      appInfo.match(/Name:\s*(.+)/i) ||
                      appInfo.match(/App Name:\s*(.+)/i) ||
                      appInfo.match(/Title:\s*(.+)/i);
    if (nameMatch) title = nameMatch[1].trim();

    log(`\n  App Info Response:`, c.dim);
    appInfo.split("\n").slice(0, 20).forEach((line) => {
      console.log(`    ${c.dim}${line}${c.reset}`);
    });
  }

  if (!appInfo) {
    log(`\n  ${badge("CRITICAL")} Could not connect to App Store Connect API`, c.red);
    addFinding("iOS Metadata", "CRITICAL", "iOS Title", "Cannot fetch iOS metadata — app may not exist in App Store Connect");
    return { title: null };
  }

  // Fetch full localization data (subtitle, keywords, description, promo)
  const localeData = fetchVersionLocaleData(bundleId);

  if (!title) {
    addFinding("iOS Metadata", "CRITICAL", "iOS Title", "No app title found");
    return { title: null, localeData };
  }

  const usage = charUsage(title, 30);
  log(`\n  Title: "${title}"`, c.bold);
  log(`  Chars: ${usage.used}/${usage.max} (${usage.pct}% used, ${usage.wasted} wasted)`);

  if (usage.used < 15) {
    addFinding("iOS Metadata", "HIGH", "iOS Title", `Title "${title}" uses only ${usage.used}/30 chars (${usage.pct}%) — wasting ${usage.wasted} chars of keyword space`);
  } else if (usage.pct >= 80) {
    log(`  ${badge("OK")} Good character usage`, c.green);
  }

  // Check if title contains category keywords
  const hasKeyword = appConfig.keywords.primary.some((kw) =>
    title.toLowerCase().includes(kw.toLowerCase())
  );
  if (!hasKeyword) {
    addFinding("iOS Metadata", "MEDIUM", "iOS Title", `Title "${title}" doesn't include any primary keywords: ${appConfig.keywords.primary.join(", ")}`);
  }

  return { title, appInfo, localeData };
}

// ─── Check 2: Subtitle ─────────────────────────────────────────────────────────

async function auditIOSSubtitle(appConfig, titleData) {
  header("CHECK 2: iOS Subtitle");

  const primaryLocale = appConfig.locales.ios[0] || "en-US";
  const localeData = titleData?.localeData;
  let subtitle = localeData?.locales?.[primaryLocale]?.subtitle || null;

  // Show all locale subtitles
  if (localeData?.locales) {
    log(`\n  Subtitles by locale:`, c.dim);
    for (const [locale, data] of Object.entries(localeData.locales)) {
      const sub = data.subtitle || "(empty)";
      console.log(`    ${c.dim}${locale}: ${sub}${c.reset}`);
    }
  }

  if (!subtitle) {
    log(`\n  ${badge("HIGH")} No subtitle set`, c.red);
    log(`  30 chars of keyword space completely unused`);
    addFinding("iOS Metadata", "HIGH", "iOS Subtitle", "No subtitle configured — 30 chars of keyword space wasted");
    return { subtitle: null };
  }

  const usage = charUsage(subtitle, 30);
  log(`\n  Subtitle: "${subtitle}"`, c.bold);
  log(`  Chars: ${usage.used}/${usage.max} (${usage.pct}% used)`);

  if (usage.used < 15) {
    addFinding("iOS Metadata", "MEDIUM", "iOS Subtitle", `Subtitle "${subtitle}" uses only ${usage.used}/30 chars — room for more keywords`);
  }

  // Check for duplicate words with title
  if (titleData?.title) {
    const dupes = findDuplicateWords(titleData.title, subtitle);
    if (dupes.length > 0) {
      addFinding("iOS Metadata", "MEDIUM", "iOS Subtitle", `Subtitle duplicates words from title: "${dupes.join(", ")}" — Apple already indexes title words`);
    }
  }

  return { subtitle };
}

// ─── Check 3: Keywords Field ────────────────────────────────────────────────────

async function auditIOSKeywords(appConfig, titleData, subtitleData) {
  header("CHECK 3: iOS Keyword Field");

  const primaryLocale = appConfig.locales.ios[0] || "en-US";
  const localeData = titleData?.localeData;
  let keywords = localeData?.locales?.[primaryLocale]?.keywords || null;

  // Show all locale keywords
  if (localeData?.locales) {
    log(`\n  Keywords by locale:`, c.dim);
    for (const [locale, data] of Object.entries(localeData.locales)) {
      const kw = data.keywords || "(empty)";
      const kwLen = data.keywords ? data.keywords.length : 0;
      console.log(`    ${c.dim}${locale} (${kwLen}/100): ${kw}${c.reset}`);
    }
  }

  if (!keywords) {
    log(`\n  ${badge("CRITICAL")} No keywords set`, c.red);
    log(`  100 chars of keyword space completely unused — this is the most impactful iOS ASO field`);
    addFinding("iOS Metadata", "CRITICAL", "iOS Keywords", "No keywords configured — 100 chars of the most impactful ASO field completely unused");
    return { keywords: null };
  }

  const usage = charUsage(keywords, 100);
  log(`\n  Keywords: "${keywords}"`, c.bold);
  log(`  Chars: ${usage.used}/${usage.max} (${usage.pct}% used)`);

  if (usage.used < 50) {
    addFinding("iOS Metadata", "HIGH", "iOS Keywords", `Keywords use only ${usage.used}/100 chars (${usage.pct}%) — ${usage.wasted} chars wasted`);
  } else if (usage.used < 90) {
    addFinding("iOS Metadata", "MEDIUM", "iOS Keywords", `Keywords use ${usage.used}/100 chars — ${usage.wasted} chars still available`);
  } else {
    log(`  ${badge("OK")} Good keyword space usage`, c.green);
  }

  // Check for spaces after commas
  if (keywords.includes(", ")) {
    const spacesWasted = (keywords.match(/, /g) || []).length;
    addFinding("iOS Metadata", "MEDIUM", "iOS Keywords", `Keywords have spaces after commas — wasting ${spacesWasted} char(s). Use "word1,word2" not "word1, word2"`);
  }

  // Check for duplicates with title/subtitle
  const titleWords = titleData?.title || "";
  const subtitleWords = subtitleData?.subtitle || "";
  const combined = `${titleWords} ${subtitleWords}`;
  const dupes = findDuplicateWords(combined, keywords);
  if (dupes.length > 0) {
    addFinding("iOS Metadata", "MEDIUM", "iOS Keywords", `Keywords duplicate words already in title/subtitle: "${dupes.join(", ")}" — Apple already indexes those`);
  }

  // Check per-locale keyword coverage
  if (localeData?.locales) {
    for (const locale of appConfig.locales.ios) {
      const locKw = localeData.locales[locale]?.keywords;
      if (!locKw) {
        addFinding("iOS Metadata", "HIGH", "iOS Keywords", `No keywords set for locale ${locale}`);
      } else if (locKw.length < 50) {
        addFinding("iOS Metadata", "MEDIUM", "iOS Keywords", `${locale} keywords only ${locKw.length}/100 chars`);
      }
    }
  }

  return { keywords };
}

// ─── Check 4: Description ───────────────────────────────────────────────────────

async function auditIOSDescription(appConfig, titleData) {
  header("CHECK 4: iOS Description");

  const primaryLocale = appConfig.locales.ios[0] || "en-US";
  const localeData = titleData?.localeData;
  const descLen = localeData?.locales?.[primaryLocale]?.descriptionLength || 0;
  const descPreview = localeData?.locales?.[primaryLocale]?.descriptionPreview || null;

  // Show all locale descriptions
  if (localeData?.locales) {
    log(`\n  Descriptions by locale:`, c.dim);
    for (const [locale, data] of Object.entries(localeData.locales)) {
      const len = data.descriptionLength || 0;
      console.log(`    ${c.dim}${locale}: ${len} chars${len > 0 ? ` — "${(data.descriptionPreview || '').substring(0, 60)}..."` : " (empty)"}${c.reset}`);
    }
  }

  if (!descLen || descLen === 0) {
    log(`\n  ${badge("CRITICAL")} No description set`);
    addFinding("iOS Metadata", "CRITICAL", "iOS Description", "No description configured");
    return { description: null };
  }

  log(`\n  Description: ${descLen} chars (max 4000)`, c.bold);
  if (descPreview) {
    log(`  Preview: "${descPreview}..."`, c.dim);
  }

  if (descLen < 200) {
    addFinding("iOS Metadata", "HIGH", "iOS Description", `Description only ${descLen} chars — too short for keyword coverage`);
  } else if (descLen < 500) {
    addFinding("iOS Metadata", "MEDIUM", "iOS Description", `Description ${descLen} chars — consider expanding to 1000+ for better keyword coverage`);
  } else {
    log(`  ${badge("OK")} Good description length`, c.green);
  }

  return { description: descPreview, descriptionLength: descLen };
}

// ─── Check 5: Promotional Text ──────────────────────────────────────────────────

async function auditIOSPromoText(appConfig, titleData) {
  header("CHECK 5: iOS Promotional Text");

  const primaryLocale = appConfig.locales.ios[0] || "en-US";
  const localeData = titleData?.localeData;
  let promoText = localeData?.locales?.[primaryLocale]?.promotionalText || null;

  // Show all locale promo texts
  if (localeData?.locales) {
    log(`\n  Promotional text by locale:`, c.dim);
    for (const [locale, data] of Object.entries(localeData.locales)) {
      const promo = data.promotionalText || "(empty)";
      console.log(`    ${c.dim}${locale}: ${promo}${c.reset}`);
    }
  }

  if (!promoText) {
    log(`\n  ${badge("MEDIUM")} No promotional text set`);
    log(`  Can be updated without app review — good for seasonal keywords`);
    addFinding("iOS Metadata", "MEDIUM", "iOS Promo Text", "No promotional text — 170 chars that can be updated without review, great for seasonal keywords");
    return { promoText: null };
  }

  const usage = charUsage(promoText, 170);
  log(`\n  Promotional Text: "${promoText}"`, c.bold);
  log(`  Chars: ${usage.used}/${usage.max} (${usage.pct}% used)`);

  if (usage.used < 80) {
    addFinding("iOS Metadata", "LOW", "iOS Promo Text", `Promotional text uses only ${usage.used}/170 chars — more room for keywords`);
  }

  return { promoText };
}

module.exports = {
  auditIOSTitle,
  auditIOSSubtitle,
  auditIOSKeywords,
  auditIOSDescription,
  auditIOSPromoText,
};
