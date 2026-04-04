/**
 * GSC-dependent audit checks (requires Google Search Console API)
 */

const { c, log, header, subHeader, badge, addFinding, fetchCached } = require("./helpers");

// ─── Date helpers ───────────────────────────────────────────────────────────────

function dates() {
  const today = new Date();
  return {
    d3ago: new Date(today - 3 * 86400000).toISOString().split("T")[0],
    d7ago: new Date(today - 7 * 86400000).toISOString().split("T")[0],
    d28ago: new Date(today - 28 * 86400000).toISOString().split("T")[0],
    d56ago: new Date(today - 56 * 86400000).toISOString().split("T")[0],
    d90ago: new Date(today - 90 * 86400000).toISOString().split("T")[0],
  };
}

// ─── 1. Performance Overview ────────────────────────────────────────────────────

async function auditPerformance(siteConfig, { webmastersApi }) {
  header("1. PERFORMANCE OVERVIEW (Last 28 days vs Previous 28 days)");
  const { d3ago, d28ago, d56ago } = dates();

  const searchTypes = ["web", "image", "video", "news", "discover", "googleNews"];

  for (const searchType of searchTypes) {
    try {
      const [current, previous] = await Promise.all([
        webmastersApi.searchanalytics.query({
          siteUrl: siteConfig.gscProperty,
          requestBody: { startDate: d28ago, endDate: d3ago, searchType, dimensions: [] },
        }),
        webmastersApi.searchanalytics.query({
          siteUrl: siteConfig.gscProperty,
          requestBody: { startDate: d56ago, endDate: d28ago, searchType, dimensions: [] },
        }),
      ]);

      const cur = current.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      const prev = previous.data.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

      const clickChange = prev.clicks > 0 ? (((cur.clicks - prev.clicks) / prev.clicks) * 100).toFixed(1) : "N/A";
      const impChange = prev.impressions > 0 ? (((cur.impressions - prev.impressions) / prev.impressions) * 100).toFixed(1) : "N/A";
      const color = cur.clicks < prev.clicks ? c.red : c.green;

      console.log(
        `  ${searchType.padEnd(15)} Clicks: ${String(cur.clicks).padStart(8)} (${color}${clickChange}%${c.reset}) | ` +
        `Imp: ${String(cur.impressions).padStart(8)} (${impChange}%) | ` +
        `CTR: ${(cur.ctr * 100).toFixed(2)}% | Pos: ${cur.position?.toFixed(1) || "N/A"}`
      );

      if (searchType === "web" && typeof clickChange === "string" && parseFloat(clickChange) < -20) {
        addFinding("GSC Health", "HIGH", "performance-decline", `Web clicks declined ${clickChange}% vs previous period`);
      }
    } catch (e) {
      if (!e.message?.includes("not supported")) {
        console.log(`  ${searchType.padEnd(15)} ${c.dim}Not available${c.reset}`);
      }
    }
  }
}

// ─── 2. Top Queries ─────────────────────────────────────────────────────────────

async function auditTopQueries(siteConfig, { webmastersApi }, limit = 30) {
  header("2. TOP QUERIES BY CLICKS (Last 28 days)");
  const { d3ago, d28ago } = dates();

  const res = await webmastersApi.searchanalytics.query({
    siteUrl: siteConfig.gscProperty,
    requestBody: { startDate: d28ago, endDate: d3ago, dimensions: ["query"], rowLimit: limit },
  });

  console.log(`  ${"#".padStart(3)}  ${"Query".padEnd(55)} | ${"Clicks".padStart(7)} | ${"Imp".padStart(8)} | ${"CTR".padStart(6)} | ${"Pos".padStart(5)}`);
  console.log(`  ${"─".repeat(95)}`);

  for (let i = 0; i < (res.data.rows || []).length; i++) {
    const r = res.data.rows[i];
    const query = r.keys[0].substring(0, 55).padEnd(55);
    console.log(
      `  ${String(i + 1).padStart(3)}  ${query} | ${String(r.clicks).padStart(7)} | ${String(r.impressions).padStart(8)} | ${(r.ctr * 100).toFixed(1).padStart(5)}% | ${r.position.toFixed(1).padStart(5)}`
    );
  }
}

// ─── 3. Top Pages ───────────────────────────────────────────────────────────────

async function auditTopPages(siteConfig, { webmastersApi }, limit = 30) {
  header("3. TOP PAGES BY CLICKS (Last 28 days)");
  const { d3ago, d28ago } = dates();

  const res = await webmastersApi.searchanalytics.query({
    siteUrl: siteConfig.gscProperty,
    requestBody: { startDate: d28ago, endDate: d3ago, dimensions: ["page"], rowLimit: limit },
  });

  console.log(`  ${"#".padStart(3)}  ${"Page".padEnd(70)} | ${"Clicks".padStart(7)} | ${"Imp".padStart(8)} | ${"CTR".padStart(6)} | ${"Pos".padStart(5)}`);
  console.log(`  ${"─".repeat(110)}`);

  for (let i = 0; i < (res.data.rows || []).length; i++) {
    const r = res.data.rows[i];
    const page = r.keys[0].replace(siteConfig.siteUrl, "").substring(0, 70).padEnd(70);
    console.log(
      `  ${String(i + 1).padStart(3)}  ${page} | ${String(r.clicks).padStart(7)} | ${String(r.impressions).padStart(8)} | ${(r.ctr * 100).toFixed(1).padStart(5)}% | ${r.position.toFixed(1).padStart(5)}`
    );
  }
}

// ─── 4. CTR Opportunities ───────────────────────────────────────────────────────

async function auditCTROpportunities(siteConfig, { webmastersApi }) {
  header("4. CTR OPPORTUNITIES (High impressions, low CTR)");
  const { d3ago, d28ago } = dates();

  const res = await webmastersApi.searchanalytics.query({
    siteUrl: siteConfig.gscProperty,
    requestBody: { startDate: d28ago, endDate: d3ago, dimensions: ["query"], rowLimit: 500 },
  });

  const opportunities = (res.data.rows || [])
    .filter((r) => r.impressions >= 50 && r.ctr < 0.05 && r.position <= 20)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 25);

  console.log(`  Found ${opportunities.length} opportunities (imp >= 50, CTR < 5%, pos <= 20)\n`);
  console.log(`  ${"#".padStart(3)}  ${"Query".padEnd(55)} | ${"Imp".padStart(8)} | ${"Clicks".padStart(7)} | ${"CTR".padStart(6)} | ${"Pos".padStart(5)} | Potential`);
  console.log(`  ${"─".repeat(110)}`);

  for (let i = 0; i < opportunities.length; i++) {
    const r = opportunities[i];
    const potential = Math.round(r.impressions * 0.05 - r.clicks);
    console.log(
      `  ${String(i + 1).padStart(3)}  ${r.keys[0].substring(0, 55).padEnd(55)} | ${String(r.impressions).padStart(8)} | ${String(r.clicks).padStart(7)} | ${(r.ctr * 100).toFixed(1).padStart(5)}% | ${r.position.toFixed(1).padStart(5)} | ${c.green}+${potential} clicks${c.reset}`
    );
  }

  if (opportunities.length > 10) {
    addFinding("GSC Health", "MEDIUM", "ctr-opportunities", `${opportunities.length} queries with high impressions but CTR < 5%`);
  }
}

// ─── 5. Declining Pages ─────────────────────────────────────────────────────────

async function auditDeclinePages(siteConfig, { webmastersApi }) {
  header("5. DECLINING PAGES (Traffic drop)");
  const { d3ago, d28ago, d56ago } = dates();

  const [current, previous] = await Promise.all([
    webmastersApi.searchanalytics.query({
      siteUrl: siteConfig.gscProperty,
      requestBody: { startDate: d28ago, endDate: d3ago, dimensions: ["page"], rowLimit: 500 },
    }),
    webmastersApi.searchanalytics.query({
      siteUrl: siteConfig.gscProperty,
      requestBody: { startDate: d56ago, endDate: d28ago, dimensions: ["page"], rowLimit: 500 },
    }),
  ]);

  const prevMap = {};
  for (const r of previous.data.rows || []) prevMap[r.keys[0]] = r;

  const declines = [];
  for (const r of current.data.rows || []) {
    const prev = prevMap[r.keys[0]];
    if (prev && prev.clicks > 5) {
      const change = ((r.clicks - prev.clicks) / prev.clicks) * 100;
      if (change < -30) declines.push({ url: r.keys[0], current: r.clicks, previous: prev.clicks, change });
    }
  }

  declines.sort((a, b) => a.change - b.change);
  const top = declines.slice(0, 20);

  console.log(`  Found ${declines.length} pages with >30% traffic decline\n`);
  for (const d of top) {
    const page = d.url.replace(siteConfig.siteUrl, "").substring(0, 65);
    console.log(
      `  ${c.red}${d.change.toFixed(0).padStart(5)}%${c.reset}  ${page.padEnd(65)} ${d.previous} -> ${d.current} clicks`
    );
  }

  if (declines.length > 5) {
    addFinding("GSC Health", "HIGH", "declining-pages", `${declines.length} pages with >30% traffic decline`);
  }
}

// ─── 6. Sitemap Status ──────────────────────────────────────────────────────────

async function auditSitemaps(siteConfig, { searchConsole }) {
  header("6. SITEMAP STATUS");

  try {
    const res = await searchConsole.sitemaps.list({ siteUrl: siteConfig.gscProperty });
    const sitemaps = res.data.sitemap || [];
    console.log(`  Total sitemaps registered: ${sitemaps.length}\n`);

    console.log(`  ${"Path".padEnd(55)} | ${"Status".padEnd(10)} | ${"Submitted".padStart(10)} | ${"Errors".padStart(6)} | Contents`);
    console.log(`  ${"─".repeat(110)}`);

    let totalSubmitted = 0;
    let totalIndexed = 0;

    for (const sm of sitemaps) {
      const smPath = sm.path.replace(siteConfig.siteUrl, "").substring(0, 55).padEnd(55);
      const submitted = sm.lastSubmitted?.split("T")[0] || "N/A";
      const errors = sm.errors || 0;

      let contentInfo = "";
      for (const content of sm.contents || []) {
        const sub = content.submitted || 0;
        const idx = content.indexed || 0;
        totalSubmitted += sub;
        totalIndexed += idx;
        contentInfo += `${content.type}: ${sub} submitted, ${idx} indexed; `;
      }

      const statusColor = sm.isPending ? c.yellow : errors > 0 ? c.red : c.green;
      const status = sm.isPending ? "Pending" : errors > 0 ? "Error" : "Success";

      console.log(
        `  ${smPath} | ${statusColor}${status.padEnd(10)}${c.reset} | ${submitted.padStart(10)} | ${String(errors).padStart(6)} | ${contentInfo}`
      );

      if (errors > 0) {
        addFinding("Technical", "HIGH", "sitemap-errors", `Sitemap ${sm.path} has ${errors} error(s)`);
      }
    }

    const indexRate = totalSubmitted > 0 ? (totalIndexed / totalSubmitted) * 100 : 0;
    console.log(`\n  ${c.bold}Total: ${totalSubmitted} submitted, ${totalIndexed} indexed (${indexRate.toFixed(1)}%)${c.reset}`);

    if (indexRate < 50 && totalSubmitted > 0) {
      addFinding("GSC Health", "HIGH", "low-index-rate", `Only ${indexRate.toFixed(1)}% of sitemap URLs indexed`);
    }
  } catch (e) {
    console.log(`  ${c.red}Error fetching sitemaps: ${e.message}${c.reset}`);
    addFinding("Technical", "CRITICAL", "sitemaps-unavailable", `Cannot fetch sitemaps: ${e.message}`);
  }
}

// ─── 7. Weekly Trends ───────────────────────────────────────────────────────────

async function auditWeeklyTrends(siteConfig, { webmastersApi }) {
  header("7. WEEKLY TRAFFIC TRENDS (Last 90 days)");
  const { d3ago, d90ago } = dates();

  const res = await webmastersApi.searchanalytics.query({
    siteUrl: siteConfig.gscProperty,
    requestBody: { startDate: d90ago, endDate: d3ago, dimensions: ["date"] },
  });

  const rows = res.data.rows || [];
  if (rows.length === 0) {
    console.log("  No data available");
    return;
  }

  const weeks = {};
  for (const r of rows) {
    const date = new Date(r.keys[0]);
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const key = weekStart.toISOString().split("T")[0];
    if (!weeks[key]) weeks[key] = { clicks: 0, impressions: 0, days: 0 };
    weeks[key].clicks += r.clicks;
    weeks[key].impressions += r.impressions;
    weeks[key].days++;
  }

  const weekKeys = Object.keys(weeks).sort();
  const maxClicks = Math.max(...weekKeys.map((k) => weeks[k].clicks));

  console.log(`  ${"Week".padEnd(12)} | ${"Clicks".padStart(8)} | ${"Impressions".padStart(12)} | Chart`);
  console.log(`  ${"─".repeat(70)}`);

  for (const key of weekKeys) {
    const w = weeks[key];
    const barLen = maxClicks > 0 ? Math.round((w.clicks / maxClicks) * 30) : 0;
    const bar = "\u2588".repeat(barLen);
    console.log(
      `  ${key.padEnd(12)} | ${String(w.clicks).padStart(8)} | ${String(w.impressions).padStart(12)} | ${c.cyan}${bar}${c.reset}`
    );
  }

  const firstHalf = weekKeys.slice(0, Math.floor(weekKeys.length / 2));
  const secondHalf = weekKeys.slice(Math.floor(weekKeys.length / 2));
  const firstClicks = firstHalf.reduce((s, k) => s + weeks[k].clicks, 0);
  const secondClicks = secondHalf.reduce((s, k) => s + weeks[k].clicks, 0);
  const trendPct = firstClicks > 0 ? (((secondClicks - firstClicks) / firstClicks) * 100).toFixed(1) : "N/A";
  const trendColor = secondClicks >= firstClicks ? c.green : c.red;

  console.log(`\n  ${c.bold}Trend: First half ${firstClicks} clicks -> Second half ${secondClicks} clicks (${trendColor}${trendPct}%${c.reset})`);

  if (typeof trendPct === "string" && parseFloat(trendPct) < -15) {
    addFinding("GSC Health", "HIGH", "traffic-downtrend", `90-day trend shows ${trendPct}% decline`);
  }
}

// ─── 8. Device & Country ────────────────────────────────────────────────────────

async function auditDeviceCountry(siteConfig, { webmastersApi }) {
  header("8. DEVICE & COUNTRY BREAKDOWN");
  const { d3ago, d28ago } = dates();

  subHeader("By Device");
  const deviceRes = await webmastersApi.searchanalytics.query({
    siteUrl: siteConfig.gscProperty,
    requestBody: { startDate: d28ago, endDate: d3ago, dimensions: ["device"] },
  });

  for (const r of deviceRes.data.rows || []) {
    console.log(
      `  ${r.keys[0].padEnd(10)} Clicks: ${String(r.clicks).padStart(7)} | Imp: ${String(r.impressions).padStart(8)} | CTR: ${(r.ctr * 100).toFixed(1)}% | Pos: ${r.position.toFixed(1)}`
    );
  }

  subHeader("By Country (Top 15)");
  const countryRes = await webmastersApi.searchanalytics.query({
    siteUrl: siteConfig.gscProperty,
    requestBody: { startDate: d28ago, endDate: d3ago, dimensions: ["country"], rowLimit: 15 },
  });

  for (const r of countryRes.data.rows || []) {
    console.log(
      `  ${r.keys[0].padEnd(5)} Clicks: ${String(r.clicks).padStart(7)} | Imp: ${String(r.impressions).padStart(8)} | CTR: ${(r.ctr * 100).toFixed(1)}% | Pos: ${r.position.toFixed(1)}`
    );
  }
}

// ─── 9. URL Inspection ──────────────────────────────────────────────────────────

async function auditURLInspection(siteConfig, { searchConsole }) {
  header("9. URL INSPECTION (Key pages)");

  const urls = siteConfig.keyPages.map((p) => siteConfig.siteUrl + p);

  for (const url of urls.slice(0, 5)) {
    try {
      const res = await searchConsole.urlInspection.index.inspect({
        requestBody: { inspectionUrl: url, siteUrl: siteConfig.gscProperty },
      });

      const result = res.data.inspectionResult;
      const idx = result.indexStatusResult;
      const shortUrl = url.replace(siteConfig.siteUrl, "") || "/";
      const verdictColor = idx.verdict === "PASS" ? c.green : idx.verdict === "FAIL" ? c.red : c.yellow;

      console.log(`\n  ${c.bold}${shortUrl}${c.reset}`);
      console.log(`    Verdict:     ${verdictColor}${idx.verdict}${c.reset}`);
      console.log(`    Coverage:    ${idx.coverageState || "N/A"}`);
      console.log(`    Robots.txt:  ${idx.robotsTxtState || "N/A"}`);
      console.log(`    Last crawl:  ${idx.lastCrawlTime || "Never"}`);
      console.log(`    Fetch:       ${idx.pageFetchState || "N/A"}`);
      console.log(`    Canonical:   ${idx.googleCanonical || "N/A"}`);

      if (idx.verdict === "FAIL") {
        addFinding("GSC Health", "CRITICAL", "indexation-fail", `${shortUrl} failed URL inspection: ${idx.coverageState}`);
      }
    } catch (e) {
      const shortUrl = url.replace(siteConfig.siteUrl, "") || "/";
      console.log(`\n  ${shortUrl}: ${c.red}${e.message?.substring(0, 80)}${c.reset}`);
    }
  }
}

// ─── 10. Content Freshness (NEW) ────────────────────────────────────────────────

async function auditContentFreshness(siteConfig, { webmastersApi }) {
  header("10. CONTENT FRESHNESS (Top pages staleness check)");
  const { d3ago, d28ago } = dates();

  const res = await webmastersApi.searchanalytics.query({
    siteUrl: siteConfig.gscProperty,
    requestBody: { startDate: d28ago, endDate: d3ago, dimensions: ["page"], rowLimit: 30 },
  });

  const topPages = (res.data.rows || []).map((r) => r.keys[0]).filter((u) => u !== siteConfig.siteUrl + "/");
  const now = Date.now();
  let stale365 = 0, stale180 = 0, stale90 = 0;

  console.log(`  Checking last-modified dates for top ${topPages.length} pages...\n`);
  console.log(`  ${"Page".padEnd(60)} | ${"Last Modified".padEnd(20)} | Age`);
  console.log(`  ${"─".repeat(100)}`);

  for (const url of topPages.slice(0, 20)) {
    try {
      const pageRes = await fetchCached(url);
      const shortUrl = url.replace(siteConfig.siteUrl, "").substring(0, 58);

      // Check Last-Modified header
      let lastMod = pageRes.headers["last-modified"];
      // Fallback: check article:modified_time meta
      if (!lastMod) {
        const metaMatch = pageRes.body.match(/property="article:modified_time"\s+content="([^"]*)"/);
        lastMod = metaMatch?.[1];
      }

      if (lastMod) {
        const modDate = new Date(lastMod);
        const ageDays = Math.floor((now - modDate.getTime()) / 86400000);
        const ageColor = ageDays > 365 ? c.red : ageDays > 180 ? c.yellow : c.green;
        const dateStr = modDate.toISOString().split("T")[0];

        console.log(`  ${shortUrl.padEnd(60)} | ${dateStr.padEnd(20)} | ${ageColor}${ageDays}d${c.reset}`);

        if (ageDays > 365) stale365++;
        else if (ageDays > 180) stale180++;
        else if (ageDays > 90) stale90++;
      } else {
        console.log(`  ${shortUrl.padEnd(60)} | ${c.dim}Unknown${c.reset}`);
      }
    } catch (e) {
      // Skip failures silently
    }
  }

  console.log(`\n  Summary: ${c.red}${stale365}${c.reset} >365d | ${c.yellow}${stale180}${c.reset} >180d | ${c.green}${stale90}${c.reset} >90d`);

  if (stale365 > 3) {
    addFinding("Content/Meta", "HIGH", "stale-content", `${stale365} top-traffic pages not updated in over a year`);
  } else if (stale180 > 5) {
    addFinding("Content/Meta", "MEDIUM", "stale-content", `${stale180} top-traffic pages not updated in over 6 months`);
  }
}

module.exports = {
  auditPerformance,
  auditTopQueries,
  auditTopPages,
  auditCTROpportunities,
  auditDeclinePages,
  auditSitemaps,
  auditWeeklyTrends,
  auditDeviceCountry,
  auditURLInspection,
  auditContentFreshness,
};
