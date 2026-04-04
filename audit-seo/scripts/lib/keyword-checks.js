/**
 * Keyword Ranking Checker — Check #23
 *
 * For each top keyword:
 *   1. Position classification (Top3 / Push / Low-hanging / Long game)
 *   2. Near-#1 opportunities (ranked 2-5, high impressions)
 *   3. SERP scrape — who is #1, their title, rich snippets present
 *   4. Gap analysis — specific actions to reach #1
 *   5. Cannibalization detection — multiple pages competing for same query
 */

const https = require("https");
const { c, log, header, subHeader, badge, addFinding, fetchUrl } = require("./helpers");

// ─── Position band labels ────────────────────────────────────────────────────────

function classify(pos) {
  if (pos <= 3)  return { label: "TOP 3  — Defend",          color: c.green,   priority: 4 };
  if (pos <= 5)  return { label: "POS 4-5 — Very close #1",  color: c.cyan,    priority: 1 };
  if (pos <= 10) return { label: "POS 6-10 — Push to top 3", color: c.yellow,  priority: 2 };
  if (pos <= 20) return { label: "POS 11-20 — Low-hanging",  color: c.magenta, priority: 3 };
  return           { label: "POS 20+ — Long game",           color: c.dim,     priority: 5 };
}

// Expected CTR by position (industry average)
const EXPECTED_CTR = [0.28, 0.15, 0.11, 0.08, 0.06, 0.05, 0.04, 0.03, 0.025, 0.02];

function expectedCTR(pos) {
  const idx = Math.round(pos) - 1;
  return EXPECTED_CTR[Math.min(idx, EXPECTED_CTR.length - 1)] || 0.01;
}

// ─── SERP scrape ─────────────────────────────────────────────────────────────────

async function fetchSERP(query, lang = "en") {
  const gl = lang.length === 2 ? lang : lang.split("-")[0];
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=${lang}&num=5&gl=${gl}`;
  try {
    const res = await fetchUrl(url, {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      headers: {
        "Accept-Language": `${lang};q=0.9,en;q=0.8`,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (res.statusCode !== 200) return null;

    const body = res.body;

    // Extract organic results — Google's HTML structure
    // Each result is wrapped in a div with data-hveid or class="g"
    const results = [];

    // Match <h3> titles within result blocks — most reliable signal
    const titleMatches = [...body.matchAll(/<h3[^>]*class="[^"]*LC20lb[^"]*"[^>]*>([^<]+)<\/h3>/g)];
    // Fallback: any <h3> that isn't navigation
    const h3Matches = titleMatches.length > 0
      ? titleMatches
      : [...body.matchAll(/<h3[^>]*>([^<]{10,100})<\/h3>/g)];

    // Extract domains from cite tags (shown under each result)
    const citeMatches = [...body.matchAll(/<cite[^>]*>([^<]+)<\/cite>/g)];

    for (let i = 0; i < Math.min(5, h3Matches.length); i++) {
      const title = h3Matches[i][1]
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
        .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .trim();

      const cite = citeMatches[i]?.[1]
        ?.replace(/<[^>]+>/g, "")
        ?.replace(/\s+/g, " ")
        ?.trim() || "unknown";

      // Extract domain from cite
      const domainMatch = cite.match(/^([a-zA-Z0-9.-]+)/);
      const domain = domainMatch?.[1] || cite.substring(0, 40);

      results.push({ rank: i + 1, title, domain, cite });
    }

    // Detect rich features in the SERP
    const hasRecipeSchema  = body.includes("data-attrid=\"recipe\"") || body.includes("RecipeRichResult");
    const hasFeaturedSnip  = body.includes("featured-snippet") || body.includes("IZ6rdc") || body.includes("c2xzTb");
    const hasPAA           = body.includes("related-question") || body.includes("related_question") || body.includes("dnXCYb");
    const hasVideoCarousel = body.includes("video-result") || body.includes("RzdJxc");

    return { results, features: { hasRecipeSchema, hasFeaturedSnip, hasPAA, hasVideoCarousel } };
  } catch (e) {
    return null;
  }
}

// ─── Gap analysis — specific recommendations ────────────────────────────────────

function buildActionPlan(keyword, ourData, serpData, ourPages) {
  const actions = [];
  const pos = ourData.position;
  const ctr = ourData.ctr;
  const expCtr = expectedCTR(pos);
  const ctrGap = expCtr - ctr;

  const top1 = serpData?.results?.[0];
  const features = serpData?.features || {};

  // CTR below expected for position
  if (ctrGap > 0.03) {
    actions.push({
      severity: "HIGH",
      action: `CTR is ${(ctr * 100).toFixed(1)}% vs expected ${(expCtr * 100).toFixed(0)}% at pos ${pos.toFixed(1)} — rewrite title/meta to be more click-worthy`,
    });
  }

  // Position 2-5: very close, high-value push
  if (pos > 1 && pos <= 5) {
    if (top1) {
      actions.push({
        severity: "HIGH",
        action: `#1 is "${top1.domain}" with title: "${top1.title.substring(0, 70)}" — analyze their content depth, word count, and schema`,
      });
    }
    actions.push({
      severity: "HIGH",
      action: `At pos ${pos.toFixed(1)}, add more specific content: exact recipe steps, precise quantities, timing, cultural context`,
    });
  }

  // Position 6-10
  if (pos > 5 && pos <= 10) {
    actions.push({
      severity: "MEDIUM",
      action: `At pos ${pos.toFixed(1)}, strengthen internal linking — add links to this page from your homepage and category pages`,
    });
    if (top1) {
      actions.push({
        severity: "MEDIUM",
        action: `#1 "${top1.domain}" — check if they have a longer/more detailed version and match or exceed their content`,
      });
    }
  }

  // Missing rich features that #1 has
  if (features.hasFeaturedSnip && pos > 1) {
    actions.push({
      severity: "HIGH",
      action: "Featured snippet detected in SERP — add a concise 40-60 word answer/definition paragraph near the top of the page",
    });
  }

  if (features.hasPAA) {
    actions.push({
      severity: "MEDIUM",
      action: "People Also Ask box present — add FAQ schema with 3-5 Q&As that match common sub-questions for this keyword",
    });
  }

  if (features.hasRecipeSchema && pos > 1) {
    actions.push({
      severity: "HIGH",
      action: "Recipe rich results in SERP — verify your Recipe schema has: cookTime, prepTime, recipeYield, nutrition, recipeIngredient, recipeInstructions",
    });
  }

  if (features.hasVideoCarousel) {
    actions.push({
      severity: "LOW",
      action: "Video carousel in SERP — consider adding a short recipe video to capture video carousel impressions",
    });
  }

  // Cannibalization
  if (ourPages.length > 1) {
    actions.push({
      severity: "HIGH",
      action: `${ourPages.length} pages competing for "${keyword}" — set canonical on weaker pages to point to your best page: ${ourPages[0].page}`,
    });
  }

  return actions;
}

// ─── Main check ──────────────────────────────────────────────────────────────────

async function auditKeywordRanking(siteConfig, { webmastersApi }) {
  header("23. KEYWORD RANKING ANALYSIS");

  const { d3ago, d28ago } = (() => {
    const today = new Date();
    return {
      d3ago: new Date(today - 3 * 86400000).toISOString().split("T")[0],
      d28ago: new Date(today - 28 * 86400000).toISOString().split("T")[0],
    };
  })();

  // Fetch top 200 queries + their pages (to detect cannibalization)
  const [queryRes, pageQueryRes] = await Promise.all([
    webmastersApi.searchanalytics.query({
      siteUrl: siteConfig.gscProperty,
      requestBody: {
        startDate: d28ago, endDate: d3ago,
        dimensions: ["query"],
        rowLimit: 200,
      },
    }),
    webmastersApi.searchanalytics.query({
      siteUrl: siteConfig.gscProperty,
      requestBody: {
        startDate: d28ago, endDate: d3ago,
        dimensions: ["query", "page"],
        rowLimit: 500,
      },
    }),
  ]);

  const queries = queryRes.data.rows || [];
  const queryPageRows = pageQueryRes.data.rows || [];

  // Build query → pages map for cannibalization detection
  const queryPages = {};
  for (const r of queryPageRows) {
    const q = r.keys[0];
    const p = r.keys[1].replace(siteConfig.siteUrl, "");
    if (!queryPages[q]) queryPages[q] = [];
    queryPages[q].push({ page: p, clicks: r.clicks, position: r.position });
  }

  // ── Section A: Position distribution ────────────────────────────────────────
  subHeader("A. POSITION DISTRIBUTION (top 200 keywords)");

  const bands = { top3: [], pos4_5: [], pos6_10: [], pos11_20: [], pos20plus: [] };
  for (const r of queries) {
    const pos = r.position;
    if (pos <= 3)       bands.top3.push(r);
    else if (pos <= 5)  bands.pos4_5.push(r);
    else if (pos <= 10) bands.pos6_10.push(r);
    else if (pos <= 20) bands.pos11_20.push(r);
    else                bands.pos20plus.push(r);
  }

  const totalImpressions = queries.reduce((s, r) => s + r.impressions, 0);
  const totalClicks      = queries.reduce((s, r) => s + r.clicks, 0);

  console.log(`  Total keywords tracked: ${queries.length} | Impressions: ${totalImpressions.toLocaleString()} | Clicks: ${totalClicks.toLocaleString()}\n`);

  const bandDefs = [
    { key: "top3",     label: "Top 3     (defend)",          color: c.green },
    { key: "pos4_5",   label: "Pos 4-5   (very close #1)",   color: c.cyan },
    { key: "pos6_10",  label: "Pos 6-10  (push to top 3)",   color: c.yellow },
    { key: "pos11_20", label: "Pos 11-20 (low-hanging)",     color: c.magenta },
    { key: "pos20plus",label: "Pos 20+   (long game)",       color: c.dim },
  ];

  for (const bd of bandDefs) {
    const arr = bands[bd.key];
    const imp = arr.reduce((s, r) => s + r.impressions, 0);
    const clk = arr.reduce((s, r) => s + r.clicks, 0);
    const barLen = totalImpressions > 0 ? Math.round((imp / totalImpressions) * 30) : 0;
    const bar = "█".repeat(barLen) + "░".repeat(30 - barLen);
    console.log(
      `  ${bd.color}${bar}${c.reset}  ${bd.label.padEnd(30)} ${String(arr.length).padStart(4)} keywords  ${String(imp.toLocaleString()).padStart(8)} imp  ${String(clk.toLocaleString()).padStart(6)} clicks`
    );
  }

  // ── Section B: Top 15 keywords deep-dive ────────────────────────────────────
  subHeader("B. TOP 15 KEYWORDS — DEEP DIVE");

  const top15 = queries.slice(0, 15);

  console.log(
    `  ${"#".padStart(2)}  ${"Keyword".padEnd(45)}  ${"Pos".padStart(5)}  ${"Clicks".padStart(6)}  ${"Imp".padStart(7)}  ${"CTR".padStart(5)}  ${"vsCTR".padStart(6)}  Status`
  );
  console.log(`  ${"─".repeat(115)}`);

  for (let i = 0; i < top15.length; i++) {
    const r = top15[i];
    const pos = r.position;
    const { label, color } = classify(pos);
    const expCtr = expectedCTR(pos);
    const ctrDiff = r.ctr - expCtr;
    const ctrDiffStr = (ctrDiff >= 0 ? "+" : "") + (ctrDiff * 100).toFixed(1) + "%";
    const ctrDiffColor = ctrDiff >= 0 ? c.green : c.red;
    const pages = queryPages[r.keys[0]] || [];
    const cannibal = pages.length > 1 ? ` ${c.red}[!${pages.length} pages]${c.reset}` : "";

    console.log(
      `  ${String(i + 1).padStart(2)}  ${r.keys[0].substring(0, 45).padEnd(45)}  ${color}${pos.toFixed(1).padStart(5)}${c.reset}  ${String(r.clicks).padStart(6)}  ${String(r.impressions).padStart(7)}  ${(r.ctr * 100).toFixed(1).padStart(4)}%  ${ctrDiffColor}${ctrDiffStr.padStart(6)}${c.reset}  ${color}${label}${c.reset}${cannibal}`
    );
  }

  // ── Section C: Near-#1 opportunities (pos 2-5, sorted by impressions) ───────
  subHeader("C. NEAR-#1 OPPORTUNITIES (pos 2–5, highest impressions)");

  const near1 = queries
    .filter((r) => r.position > 1.5 && r.position <= 5)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8);

  if (near1.length === 0) {
    console.log("  No keywords in position 2-5.");
  } else {
    console.log(`  Found ${near1.length} keywords within striking distance of #1:\n`);
    console.log(
      `  ${"Keyword".padEnd(45)}  ${"Pos".padStart(4)}  ${"Imp".padStart(7)}  ${"Clicks".padStart(6)}  ${"CTR".padStart(5)}  Est. gain if #1`
    );
    console.log(`  ${"─".repeat(100)}`);

    for (const r of near1) {
      const gainIfFirst = Math.round(r.impressions * 0.28) - r.clicks;
      console.log(
        `  ${r.keys[0].substring(0, 45).padEnd(45)}  ${c.cyan}${r.position.toFixed(1).padStart(4)}${c.reset}  ${String(r.impressions).padStart(7)}  ${String(r.clicks).padStart(6)}  ${(r.ctr * 100).toFixed(1).padStart(4)}%  ${c.green}+${Math.max(0, gainIfFirst)} clicks/mo${c.reset}`
      );
    }
  }

  // ── Section D: SERP analysis for top near-#1 keywords ───────────────────────
  subHeader("D. SERP COMPETITOR ANALYSIS (top 5 near-#1 keywords)");

  const serpTargets = near1.slice(0, 5);

  if (serpTargets.length === 0) {
    // Fall back to top keywords in pos 3-8
    const fallback = queries.filter((r) => r.position >= 2 && r.position <= 8)
      .sort((a, b) => b.impressions - a.impressions).slice(0, 5);
    serpTargets.push(...fallback);
  }

  const lang = siteConfig.locales?.[0] || "en";
  const cannibalKeywords = [];

  for (const r of serpTargets) {
    const keyword = r.keys[0];
    const pages   = queryPages[keyword] || [];
    const pos     = r.position;

    console.log(`\n  ${c.bold}▸ "${keyword}"${c.reset}  ${c.dim}pos ${pos.toFixed(1)} · ${r.impressions} imp · ${r.clicks} clicks${c.reset}`);

    if (pages.length > 1) {
      console.log(`  ${c.red}  ⚠ Cannibalization: ${pages.length} pages ranking for this keyword${c.reset}`);
      pages.forEach((p, i) => {
        console.log(`      ${i + 1}. ${p.page} (pos ${p.position?.toFixed(1)}, ${p.clicks} clicks)`);
      });
      cannibalKeywords.push(keyword);
    } else if (pages.length === 1) {
      console.log(`  ${c.dim}  Our page: ${pages[0].page}${c.reset}`);
    }

    // Fetch SERP
    process.stdout.write(`  ${c.dim}  Fetching Google SERP...${c.reset}`);
    const serp = await fetchSERP(keyword, lang);

    if (!serp || serp.results.length === 0) {
      console.log(`\r  ${c.dim}  SERP unavailable (rate limited or blocked)${c.reset}`);
    } else {
      process.stdout.write("\r" + " ".repeat(50) + "\r");

      // Show top 3 results
      for (const result of serp.results.slice(0, 3)) {
        const rankColor = result.rank === 1 ? c.green : result.rank === 2 ? c.yellow : c.dim;
        const isUs = siteConfig.siteUrl.includes(result.domain) || result.domain.includes(siteConfig.siteUrl.replace("https://www.", ""));
        const usMarker = isUs ? ` ${c.cyan}← US${c.reset}` : "";
        console.log(`    ${rankColor}#${result.rank}${c.reset} ${c.bold}${result.domain}${c.reset}${usMarker}`);
        console.log(`       "${result.title.substring(0, 80)}"`);
      }

      // Rich features
      const featureFlags = [];
      if (serp.features.hasFeaturedSnip)  featureFlags.push(`${c.yellow}Featured Snippet${c.reset}`);
      if (serp.features.hasPAA)           featureFlags.push(`${c.yellow}People Also Ask${c.reset}`);
      if (serp.features.hasRecipeSchema)  featureFlags.push(`${c.green}Recipe Rich Result${c.reset}`);
      if (serp.features.hasVideoCarousel) featureFlags.push(`${c.magenta}Video Carousel${c.reset}`);

      if (featureFlags.length > 0) {
        console.log(`  ${c.dim}  SERP features: ${c.reset}${featureFlags.join("  ")}`);
      }

      // Action plan
      const actions = buildActionPlan(keyword, r, serp, pages);
      if (actions.length > 0) {
        console.log(`  ${c.bold}  Action plan:${c.reset}`);
        for (const a of actions) {
          const col = a.severity === "HIGH" ? c.red : a.severity === "MEDIUM" ? c.yellow : c.dim;
          console.log(`    ${col}[${a.severity}]${c.reset} ${a.action}`);
        }
      }
    }

    // Delay to avoid Google rate-limiting
    await new Promise((r) => setTimeout(r, 2500));
  }

  // ── Section E: Cannibalization summary ──────────────────────────────────────
  const allCannibal = queries.filter((r) => (queryPages[r.keys[0]] || []).length > 1);

  if (allCannibal.length > 0) {
    subHeader("E. CANNIBALIZATION REPORT");
    console.log(`  ${allCannibal.length} keywords have multiple pages competing:\n`);

    for (const r of allCannibal.slice(0, 10)) {
      const pages = queryPages[r.keys[0]];
      console.log(`  ${c.red}"${r.keys[0]}"${c.reset}  (${r.impressions} imp, pos ${r.position.toFixed(1)})`);
      pages.forEach((p, i) => {
        console.log(`    ${i === 0 ? "→ KEEP" : "→ canonical to above"}: ${p.page}  (${p.clicks} clicks, pos ${p.position?.toFixed(1)})`);
      });
    }

    addFinding(
      "GSC Health", "HIGH", "keyword-cannibalization",
      `${allCannibal.length} keywords have multiple pages competing — consolidate with canonical tags`
    );
  }

  // ── Findings ─────────────────────────────────────────────────────────────────

  const stuck4_10highImp = queries.filter(
    (r) => r.position > 3 && r.position <= 10 && r.impressions >= 200
  );
  if (stuck4_10highImp.length > 3) {
    addFinding(
      "GSC Health", "MEDIUM", "keywords-stuck-4-10",
      `${stuck4_10highImp.length} high-impression keywords stuck in positions 4-10 — content improvements needed`
    );
  }

  const lowCTRvsExpected = queries.filter((r) => {
    const exp = expectedCTR(r.position);
    return r.position <= 10 && (r.ctr < exp * 0.5) && r.impressions >= 100;
  });
  if (lowCTRvsExpected.length > 3) {
    addFinding(
      "GSC Health", "MEDIUM", "low-ctr-vs-expected",
      `${lowCTRvsExpected.length} keywords have CTR below 50% of expected for their position — title/meta rewrites needed`
    );
  }
}

module.exports = { auditKeywordRanking };
