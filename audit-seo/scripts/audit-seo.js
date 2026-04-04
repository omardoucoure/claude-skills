#!/usr/bin/env node

/**
 * SEO Audit Script (v4 — dynamic discovery)
 * 23 checks + 115-point SEO score
 *
 * Usage:
 *   node audit-seo.js                    # Discover sites and select
 *   node audit-seo.js futevolution       # Partial match on domain
 *   node audit-seo.js --list-sites       # List all discovered GSC sites
 */

const { c, log, header, clearFindings, clearCache } = require("./lib/helpers");
const { discoverSites, inferSiteConfig, gscPropertyToDomain, initGSC, getGSCClients } = require("./sites");
const {
  auditPerformance, auditTopQueries, auditTopPages,
  auditCTROpportunities, auditDeclinePages, auditSitemaps,
  auditWeeklyTrends, auditDeviceCountry, auditURLInspection,
  auditContentFreshness,
} = require("./lib/gsc-checks");
const {
  auditSitemapHealth, auditTTFB, auditRedirectChains,
  auditRobotsTxt, auditSecurityHeaders,
} = require("./lib/http-checks");
const { auditCoreWebVitals } = require("./lib/cwv-checks");
const { auditKeywordRanking } = require("./lib/keyword-checks");
const {
  auditSchemaAndMeta, auditHreflang, auditCanonical,
  auditDuplicateMeta, auditAIReadiness,
} = require("./lib/meta-checks");
const { auditInternalLinks } = require("./lib/link-checks");
const { computeSEOScore } = require("./lib/scoring");

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Discover all sites
  log("\n  Discovering GSC sites...", c.dim);
  const { sites, diagnostics } = await discoverSites();

  if (sites.length === 0) {
    log("\n  No GSC sites found.", c.red);
    if (diagnostics.credentialsSources === 0) {
      log("  No credential sources found.", c.red);
      log("  Add service account JSON files to ~/.claude/skills/audit-seo/credentials/", c.yellow);
      log("  Or set GSC_CREDENTIALS_JSON env var.", c.yellow);
    }
    for (const err of diagnostics.errors) {
      log(`  ${err}`, c.red);
    }
    process.exit(1);
  }

  // Show warnings for partial failures
  if (diagnostics.errors.length > 0) {
    for (const err of diagnostics.errors) {
      log(`  Warning: ${err}`, c.yellow);
    }
  }

  // Handle --list-sites
  if (args.includes("--list-sites")) {
    console.log(`\n  Found ${sites.length} site(s) from ${diagnostics.credentialsSources} credential source(s):\n`);
    for (const site of sites) {
      const domain = gscPropertyToDomain(site.gscProperty);
      const type = site.gscProperty.startsWith("sc-domain:") ? "domain" : "url-prefix";
      console.log(`    ${domain.padEnd(30)} ${site.gscProperty.padEnd(40)} [${site.source}] (${type})`);
    }
    return;
  }

  // Site selection
  let selected;
  const query = args[0]?.toLowerCase();

  if (query) {
    // Match by domain substring
    selected = sites.find((s) => {
      const domain = gscPropertyToDomain(s.gscProperty);
      return domain.includes(query) || query.includes(domain.split(".")[0]);
    });
    if (!selected) {
      log(`\n  No site matching "${query}". Available:`, c.red);
      for (const s of sites) {
        console.log(`    ${gscPropertyToDomain(s.gscProperty)}`);
      }
      process.exit(1);
    }
  } else {
    console.log(`\n  Select a site to audit:\n`);
    sites.forEach((s, i) => {
      console.log(`    ${i + 1}. ${gscPropertyToDomain(s.gscProperty)}`);
    });
    console.log(`\n  Usage: node audit-seo.js <domain-keyword>`);
    console.log(`  Example: node audit-seo.js cuisine\n`);
    return;
  }

  // Infer full site config
  log(`\n  Building config for ${gscPropertyToDomain(selected.gscProperty)}...`, c.dim);
  const siteConfig = await inferSiteConfig(selected);

  // Reset state
  clearFindings();
  clearCache();

  console.log("\n" + "\u2588".repeat(80));
  log(`  SEO AUDIT v4 — ${siteConfig.name}`, c.bold + c.cyan);
  log(`  ${siteConfig.siteUrl}`, c.dim);
  log(`  Date: ${new Date().toISOString()}`, c.dim);
  log(`  Checks: 23 | Score: 115 points`, c.dim);
  if (siteConfig.locales.length > 0) {
    log(`  Locales: ${siteConfig.locales.join(", ")}`, c.dim);
  }
  log(`  Key pages: ${siteConfig.keyPages.length} | Sitemaps: ${siteConfig.sitemaps.length}`, c.dim);
  console.log("\u2588".repeat(80));

  // Initialize GSC
  let gscClients = null;
  try {
    await initGSC(siteConfig);
    gscClients = getGSCClients();
    log(`\n  \u2713 Connected to Google Search Console (${siteConfig.gscProperty})`, c.green);
  } catch (e) {
    log(`\n  \u2717 GSC connection failed: ${e.message}`, c.red);
    log("  Continuing with HTTP-only checks...\n", c.yellow);
  }

  const startTime = Date.now();

  // ── GSC checks (1-10) ───────────────────────────────────────────────────────
  if (gscClients) {
    await auditPerformance(siteConfig, gscClients);
    await auditTopQueries(siteConfig, gscClients);
    await auditTopPages(siteConfig, gscClients);
    await auditCTROpportunities(siteConfig, gscClients);
    await auditDeclinePages(siteConfig, gscClients);
    await auditSitemaps(siteConfig, gscClients);
    await auditWeeklyTrends(siteConfig, gscClients);
    await auditDeviceCountry(siteConfig, gscClients);
    await auditURLInspection(siteConfig, gscClients);
    await auditContentFreshness(siteConfig, gscClients);
  }

  // ── HTTP checks (11-15) ────────────────────────────────────────────────────
  await auditSitemapHealth(siteConfig);
  await auditTTFB(siteConfig);
  await auditRedirectChains(siteConfig);
  await auditRobotsTxt(siteConfig);
  await auditSecurityHeaders(siteConfig);

  // ── Meta/HTML checks (16-21) ───────────────────────────────────────────────
  await auditSchemaAndMeta(siteConfig, gscClients || {});
  await auditHreflang(siteConfig);
  await auditCanonical(siteConfig);
  await auditDuplicateMeta(siteConfig);
  await auditInternalLinks(siteConfig);
  await auditAIReadiness(siteConfig);

  // ── Core Web Vitals (22) ───────────────────────────────────────────────────
  await auditCoreWebVitals(siteConfig);

  // ── Keyword Ranking (23) — requires GSC ────────────────────────────────────
  if (gscClients) {
    await auditKeywordRanking(siteConfig, gscClients);
  }

  // ── Score (summary) ──────────────────────────────────────────────────────────
  computeSEOScore();

  // ── Footer ───────────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  header("AUDIT COMPLETE");
  console.log(`  Duration: ${elapsed}s`);
  console.log(`  Site: ${siteConfig.name} (${siteConfig.siteUrl})`);
  console.log(`  Checks run: 23`);
  console.log(`  Date: ${new Date().toISOString()}\n`);
}

main().catch((err) => {
  console.error(`\n${c.red}Fatal error: ${err.message}${c.reset}`);
  console.error(err.stack);
  process.exit(1);
});
