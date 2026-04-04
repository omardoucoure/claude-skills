/**
 * Google Play Store metadata checks (6-8)
 */

const { c, log, header, badge, addFinding, exec, charUsage } = require("./helpers");
const { GPS_SCRIPT, OMAPPS } = require("../apps");

// ─── Fetch Android metadata ────────────────────────────────────────────────────

function fetchAndroidListing(packageName, locale) {
  const raw = exec(
    `python3 ${GPS_SCRIPT} list-locales ${packageName}`,
    { silent: true }
  );
  return raw;
}

function fetchAndroidStatus(packageName) {
  return exec(`python3 ${GPS_SCRIPT} status ${packageName}`, { silent: true });
}

function fetchAndroidListing2(packageName, locale) {
  return exec(
    `python3 ${GPS_SCRIPT} update-listing ${packageName} ${locale}`,
    { silent: true }
  );
}

// ─── Check 6: Google Play Title ─────────────────────────────────────────────────

async function auditAndroidTitle(appConfig) {
  header("CHECK 6: Google Play Title");

  const packageName = appConfig.packageName;
  const statusRaw = fetchAndroidStatus(packageName);

  let title = null;

  if (statusRaw) {
    const titleMatch = statusRaw.match(/Title:\s*(.+)/i) ||
                       statusRaw.match(/Name:\s*(.+)/i);
    if (titleMatch) title = titleMatch[1].trim();

    log(`\n  Play Store Status:`, c.dim);
    statusRaw.split("\n").slice(0, 15).forEach((line) => {
      console.log(`    ${c.dim}${line}${c.reset}`);
    });
  }

  if (!statusRaw) {
    log(`\n  ${badge("CRITICAL")} Could not connect to Google Play Developer API`, c.red);
    log(`  Possible reasons: app not created yet, service account missing, or credentials issue`, c.dim);
    addFinding("Android Metadata", "CRITICAL", "Android Title", "Cannot fetch Android metadata — app may not exist on Google Play");
    return { title: null, statusRaw: null };
  }

  if (!title) {
    addFinding("Android Metadata", "CRITICAL", "Android Title", "No title found on Google Play listing");
    return { title: null, statusRaw };
  }

  const usage = charUsage(title, 50);
  log(`\n  Title: "${title}"`, c.bold);
  log(`  Chars: ${usage.used}/${usage.max} (${usage.pct}% used, ${usage.wasted} wasted)`);

  if (usage.used < 25) {
    addFinding("Android Metadata", "HIGH", "Android Title", `Title "${title}" uses only ${usage.used}/50 chars (${usage.pct}%) — wasting ${usage.wasted} chars`);
  }

  const hasKeyword = appConfig.keywords.primary.some((kw) =>
    title.toLowerCase().includes(kw.toLowerCase())
  );
  if (!hasKeyword) {
    addFinding("Android Metadata", "MEDIUM", "Android Title", `Title doesn't include primary keywords: ${appConfig.keywords.primary.join(", ")}`);
  }

  return { title, statusRaw };
}

// ─── Check 7: Short Description ─────────────────────────────────────────────────

async function auditAndroidShortDesc(appConfig, titleData) {
  header("CHECK 7: Google Play Short Description");

  const statusRaw = titleData?.statusRaw;

  let shortDesc = null;
  if (statusRaw) {
    const match = statusRaw.match(/Short Description:\s*(.+)/i) ||
                  statusRaw.match(/Short Desc:\s*(.+)/i);
    if (match) shortDesc = match[1].trim();
    if (shortDesc === "None" || shortDesc === "N/A" || shortDesc === "") shortDesc = null;
  }

  if (!shortDesc) {
    log(`\n  ${badge("HIGH")} No short description set`);
    addFinding("Android Metadata", "HIGH", "Android Short Desc", "No short description — 80 chars of prime keyword space unused");
    return { shortDesc: null };
  }

  const usage = charUsage(shortDesc, 80);
  log(`\n  Short Description: "${shortDesc}"`, c.bold);
  log(`  Chars: ${usage.used}/${usage.max} (${usage.pct}% used)`);

  if (usage.used < 40) {
    addFinding("Android Metadata", "MEDIUM", "Android Short Desc", `Short description uses only ${usage.used}/80 chars — room for more keywords`);
  }

  const hasKeyword = appConfig.keywords.primary.some((kw) =>
    shortDesc.toLowerCase().includes(kw.toLowerCase())
  );
  if (!hasKeyword) {
    addFinding("Android Metadata", "MEDIUM", "Android Short Desc", "Short description doesn't include primary keywords");
  }

  return { shortDesc };
}

// ─── Check 8: Full Description ──────────────────────────────────────────────────

async function auditAndroidFullDesc(appConfig, titleData) {
  header("CHECK 8: Google Play Full Description");

  const statusRaw = titleData?.statusRaw;

  let fullDesc = null;
  if (statusRaw) {
    const match = statusRaw.match(/Full Description:\s*([\s\S]*?)(?=\n\s*(?:Short|Title|Version|Track|$))/i) ||
                  statusRaw.match(/Description:\s*([\s\S]*?)(?=\n\s*(?:Short|Title|Version|Track|$))/i);
    if (match) fullDesc = match[1].trim();
    if (fullDesc === "None" || fullDesc === "N/A" || fullDesc === "") fullDesc = null;
  }

  if (!fullDesc) {
    log(`\n  ${badge("CRITICAL")} No full description set`);
    addFinding("Android Metadata", "CRITICAL", "Android Full Desc", "No full description — Google indexes entire description for search ranking");
    return { fullDesc: null };
  }

  const len = fullDesc.length;
  log(`\n  Full Description: ${len} chars (max 4000)`, c.bold);
  log(`  First 200 chars: "${fullDesc.substring(0, 200)}..."`, c.dim);

  if (len < 500) {
    addFinding("Android Metadata", "HIGH", "Android Full Desc", `Description only ${len} chars — Google indexes full description, more text = more keyword coverage`);
  }

  const hasBullets = /[•\-\*✓✔]/.test(fullDesc);
  if (!hasBullets) {
    addFinding("Android Metadata", "MEDIUM", "Android Full Desc", "Description lacks feature bullets — structured format improves readability and conversion");
  }

  const first3Lines = fullDesc.split("\n").slice(0, 3).join(" ").toLowerCase();
  const hasKeyword = appConfig.keywords.primary.some((kw) => first3Lines.includes(kw.toLowerCase()));
  if (!hasKeyword) {
    addFinding("Android Metadata", "MEDIUM", "Android Full Desc", "First 3 lines don't contain primary keywords — Google weights early content higher");
  }

  return { fullDesc };
}

module.exports = {
  auditAndroidTitle,
  auditAndroidShortDesc,
  auditAndroidFullDesc,
};
