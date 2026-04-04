/**
 * Locale coverage checks (15-16)
 */

const { c, log, header, badge, addFinding, exec } = require("./helpers");
const { ASC_SCRIPT, GPS_SCRIPT } = require("../apps");

// ─── Fetch version locale data (shared helper) ─────────────────────────────────

function fetchLocaleKeywords(bundleId) {
  const versionsRaw = exec(`python3 ${ASC_SCRIPT} list-versions ${bundleId}`, { silent: true });
  if (!versionsRaw) return null;

  const match = versionsRaw.match(/ID:\s*([0-9a-f-]{36})/);
  if (!match) return null;

  const versionId = match[1];
  const localesRaw = exec(`python3 ${ASC_SCRIPT} list-locales ${versionId}`, { silent: true });
  if (!localesRaw) return null;

  // Parse keywords per locale from list-locales output
  const result = {};
  const blocks = localesRaw.split(/(?=Locale: )/);
  for (const block of blocks) {
    const localeMatch = block.match(/Locale:\s*(\S+)/);
    if (!localeMatch) continue;
    const locale = localeMatch[1];
    const kwMatch = block.match(/Keywords:\s*(.+)/);
    let keywords = kwMatch ? kwMatch[1].trim() : null;
    if (keywords === "(empty)" || keywords === "None") keywords = null;
    result[locale] = keywords;
  }
  return result;
}

// ─── Check 15: Locale Completeness ──────────────────────────────────────────────

async function auditLocaleCompleteness(appConfig) {
  header("CHECK 15: Locale Completeness");

  const bundleId = appConfig.bundleId;
  const packageName = appConfig.packageName;

  log(`\n  Expected locales:`, c.bold);
  log(`    iOS: ${appConfig.locales.ios.join(", ")}`);
  log(`    Android: ${appConfig.locales.android.join(", ")}`);

  let iosIssues = 0;
  let androidIssues = 0;

  // Check iOS locales
  log(`\n  ${c.bold}iOS Locale Check:${c.reset}`);

  const versionsRaw = exec(`python3 ${ASC_SCRIPT} list-versions ${bundleId}`, { silent: true });
  let versionId = null;
  if (versionsRaw) {
    const match = versionsRaw.match(/ID:\s*([0-9a-f-]{36})/);
    if (match) versionId = match[1];
  }

  if (versionId) {
    const localesRaw = exec(`python3 ${ASC_SCRIPT} list-locales ${versionId}`, { silent: true });

    if (localesRaw) {
      log(`\n  Available iOS locales:`, c.dim);
      // Show compact locale list
      const foundLocales = [];
      const localeMatches = localesRaw.matchAll(/Locale:\s*(\S+)/g);
      for (const m of localeMatches) foundLocales.push(m[1]);
      console.log(`    ${c.dim}${foundLocales.join(", ")}${c.reset}`);

      for (const locale of appConfig.locales.ios) {
        const hasLocale = foundLocales.some(l => l.toLowerCase() === locale.toLowerCase());
        if (!hasLocale) {
          log(`    ${badge("HIGH")} Missing locale: ${locale}`);
          addFinding("Locale Coverage", "HIGH", "Locale Completeness", `iOS locale "${locale}" not found in App Store Connect`);
          iosIssues++;
        } else {
          log(`    ${badge("OK")} ${locale}`);
        }
      }
    } else {
      log(`    ${badge("INFO")} Could not fetch iOS locale list`);
    }
  } else {
    log(`    ${badge("INFO")} No iOS version found — cannot check locales`);
    addFinding("Locale Coverage", "MEDIUM", "Locale Completeness", "Cannot verify iOS locale coverage — no version in App Store Connect");
  }

  // Check Android locales
  log(`\n  ${c.bold}Android Locale Check:${c.reset}`);

  const androidLocalesRaw = exec(`python3 ${GPS_SCRIPT} list-locales ${packageName}`, { silent: true });

  if (androidLocalesRaw) {
    log(`\n  Available Android locales:`, c.dim);
    androidLocalesRaw.split("\n").slice(0, 10).forEach((line) => {
      console.log(`    ${c.dim}${line}${c.reset}`);
    });

    for (const locale of appConfig.locales.android) {
      const hasLocale = androidLocalesRaw.toLowerCase().includes(locale.toLowerCase());
      if (!hasLocale) {
        log(`    ${badge("HIGH")} Missing locale: ${locale}`);
        addFinding("Locale Coverage", "HIGH", "Locale Completeness", `Android locale "${locale}" not found on Google Play`);
        androidIssues++;
      } else {
        log(`    ${badge("OK")} ${locale}`);
      }
    }
  } else {
    log(`    ${badge("INFO")} Could not fetch Android locale list`);
    addFinding("Locale Coverage", "MEDIUM", "Locale Completeness", "Cannot verify Android locale coverage — Google Play API inaccessible");
  }

  const totalIssues = iosIssues + androidIssues;
  if (totalIssues === 0) {
    log(`\n  ${badge("OK")} All expected locales are configured`);
  }

  return { iosIssues, androidIssues };
}

// ─── Check 16: Keyword Localization Quality ─────────────────────────────────────

async function auditKeywordLocalization(appConfig) {
  header("CHECK 16: Keyword Localization Quality");

  const bundleId = appConfig.bundleId;

  // Fetch keywords per locale from version localizations
  const keywordsByLocale = fetchLocaleKeywords(bundleId) || {};

  let allIdentical = true;
  let firstKeywords = null;

  for (const locale of appConfig.locales.ios) {
    const keywords = keywordsByLocale[locale] || null;

    if (keywords) {
      log(`  ${locale} (${keywords.length}/100): "${keywords.substring(0, 60)}${keywords.length > 60 ? '...' : ''}"`, "");
      if (firstKeywords === null) {
        firstKeywords = keywords;
      } else if (keywords !== firstKeywords) {
        allIdentical = false;
      }
    } else {
      log(`  ${locale}: (empty)`, c.dim);
    }
  }

  // Also show extra locales not in expected list
  for (const [locale, kw] of Object.entries(keywordsByLocale)) {
    if (!appConfig.locales.ios.includes(locale) && kw) {
      log(`  ${locale} (${kw.length}/100): "${kw.substring(0, 60)}${kw.length > 60 ? '...' : ''}"`, c.dim);
    }
  }

  // Check for non-English locales with only English keywords
  const nonEnLocales = appConfig.locales.ios.filter((l) => !l.startsWith("en"));
  for (const locale of nonEnLocales) {
    const kw = keywordsByLocale[locale];
    if (kw && firstKeywords && kw === firstKeywords) {
      const lang = locale.split("-")[0];
      addFinding("Locale Coverage", "HIGH", "Keyword Localization", `Locale "${locale}" has identical keywords to English — localize for ${lang} search terms`);
    }
  }

  if (allIdentical && firstKeywords && nonEnLocales.length > 0) {
    addFinding("Locale Coverage", "MEDIUM", "Keyword Localization", "Keywords are identical across all locales — users search in their native language");
  }

  const allEmpty = appConfig.locales.ios.every((l) => !keywordsByLocale[l]);
  if (allEmpty) {
    log(`\n  ${badge("HIGH")} No keywords set for any locale`);
    addFinding("Locale Coverage", "HIGH", "Keyword Localization", "No keywords configured for any locale");
  } else {
    const localizedCount = appConfig.locales.ios.filter((l) => keywordsByLocale[l]).length;
    if (localizedCount === appConfig.locales.ios.length) {
      log(`\n  ${badge("OK")} Keywords set for all ${localizedCount} expected locales`, c.green);
    }
  }

  return { keywordsByLocale };
}

module.exports = {
  auditLocaleCompleteness,
  auditKeywordLocalization,
};
