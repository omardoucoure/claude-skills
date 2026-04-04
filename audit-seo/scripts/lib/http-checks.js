/**
 * HTTP-based audit checks (no GSC required)
 */

const { c, log, header, subHeader, badge, addFinding, fetchUrl, fetchCached, followRedirects } = require("./helpers");

// ─── 11. Sitemap URL Health ─────────────────────────────────────────────────────

async function auditSitemapHealth(siteConfig) {
  header("11. SITEMAP URL HEALTH CHECK");

  for (const sitemapPath of siteConfig.sitemaps) {
    const url = siteConfig.siteUrl + sitemapPath;
    subHeader(`Checking ${sitemapPath}`);

    try {
      const res = await fetchUrl(url);
      if (res.statusCode !== 200) {
        log(`  ${badge("HIGH")} ${sitemapPath} returned ${res.statusCode}`, c.red);
        addFinding("Technical", "HIGH", "sitemap-http-error", `${sitemapPath} returned HTTP ${res.statusCode}`);
        continue;
      }

      const urlMatches = res.body.match(/<loc>([^<]+)<\/loc>/g) || [];
      const urls = urlMatches.map((m) => m.replace(/<\/?loc>/g, ""));
      console.log(`  URLs found: ${urls.length}`);

      // Sample 10 random URLs
      const sample = urls.sort(() => Math.random() - 0.5).slice(0, 10);
      let ok = 0, errors = 0;

      for (const sampleUrl of sample) {
        try {
          const check = await fetchUrl(sampleUrl);
          const statusColor = check.statusCode === 200 ? c.green : check.statusCode >= 300 && check.statusCode < 400 ? c.yellow : c.red;
          const shortUrl = sampleUrl.replace(siteConfig.siteUrl, "").substring(0, 70);
          console.log(`    ${statusColor}${check.statusCode}${c.reset} ${shortUrl} (${check.ttfb}ms)`);
          if (check.statusCode === 200) ok++;
          else errors++;
        } catch (e) {
          console.log(`    ${c.red}ERR${c.reset} ${sampleUrl.substring(0, 70)} - ${e.message}`);
          errors++;
        }
      }

      console.log(`  Result: ${ok}/${sample.length} OK, ${errors} errors`);

      if (errors > 0) {
        addFinding("Technical", "MEDIUM", "sitemap-broken-urls", `${sitemapPath}: ${errors}/${sample.length} sampled URLs returned errors`);
      }
    } catch (e) {
      log(`  Error fetching sitemap: ${e.message}`, c.red);
      addFinding("Technical", "HIGH", "sitemap-fetch-error", `Cannot fetch ${sitemapPath}: ${e.message}`);
    }
  }
}

// ─── 12. TTFB ───────────────────────────────────────────────────────────────────

async function auditTTFB(siteConfig) {
  header("12. TTFB & SERVER RESPONSE TIME");

  const pages = siteConfig.keyPages.map((p) => siteConfig.siteUrl + p);

  console.log(`  ${"Page".padEnd(50)} | ${"Status".padStart(6)} | ${"TTFB".padStart(8)} | ${"Total".padStart(8)} | ${"Cache".padStart(10)}`);
  console.log(`  ${"─".repeat(95)}`);

  let slowCount = 0;

  for (const url of pages) {
    try {
      const res = await fetchUrl(url);
      const ttfbColor = res.ttfb < 200 ? c.green : res.ttfb < 600 ? c.yellow : c.red;
      const cacheStatus = res.headers["cf-cache-status"] || "N/A";
      const shortUrl = url.replace(siteConfig.siteUrl, "") || "/";

      console.log(
        `  ${shortUrl.padEnd(50)} | ${String(res.statusCode).padStart(6)} | ${ttfbColor}${(res.ttfb + "ms").padStart(8)}${c.reset} | ${(res.totalTime + "ms").padStart(8)} | ${cacheStatus.padStart(10)}`
      );

      if (res.ttfb > 600) slowCount++;
    } catch (e) {
      console.log(`  ${url.substring(0, 50).padEnd(50)} | ${c.red}ERROR${c.reset}  | ${e.message}`);
      slowCount++;
    }
  }

  if (slowCount > 0) {
    addFinding("Performance", "HIGH", "slow-ttfb", `${slowCount} key page(s) with TTFB > 600ms`);
  }
}

// ─── 13. Redirect Chains ────────────────────────────────────────────────────────

async function auditRedirectChains(siteConfig) {
  header("13. REDIRECT CHAIN DETECTION");

  const testUrls = [
    siteConfig.siteUrl.replace("www.", ""),
    siteConfig.siteUrl.replace("https://", "http://"),
    ...siteConfig.keyPages.map((p) => siteConfig.siteUrl + p + "/"),
  ];

  let chainCount = 0;

  for (const url of testUrls) {
    const chain = await followRedirects(url);
    const hops = chain.length - 1;
    const color = hops === 0 ? c.green : hops === 1 ? c.yellow : c.red;
    const shortUrl = url.replace(siteConfig.siteUrl, "").substring(0, 50) || url.substring(0, 50);

    if (hops > 0) {
      console.log(`  ${color}${hops} hop(s)${c.reset} ${shortUrl}`);
      for (const step of chain) {
        const prefix = step.redirectUrl ? "  -> " : "  OK ";
        console.log(`    ${prefix}${step.statusCode} ${step.url.substring(0, 70)}`);
      }
      if (hops >= 2) chainCount++;
    } else {
      console.log(`  ${c.green}Direct${c.reset}  ${shortUrl} -> ${chain[0].statusCode}`);
    }
  }

  if (chainCount > 0) {
    addFinding("Technical", "MEDIUM", "redirect-chains", `${chainCount} redirect chain(s) with 2+ hops detected`);
  }
}

// ─── 14. Robots.txt ─────────────────────────────────────────────────────────────

async function auditRobotsTxt(siteConfig) {
  header("14. ROBOTS.TXT VALIDATION");

  try {
    const res = await fetchUrl(siteConfig.siteUrl + "/robots.txt");
    console.log(`  Status: ${res.statusCode}`);
    console.log(`  Size: ${res.body.length} bytes`);

    if (res.statusCode !== 200) {
      addFinding("Technical", "CRITICAL", "robots-missing", `robots.txt returned HTTP ${res.statusCode}`);
      return;
    }

    // Parse robots.txt into per-user-agent blocks to avoid false positives
    // when specific bots (e.g. AI crawlers) have Disallow: / but * has Allow: /
    const lines = res.body.split("\n").map((l) => l.trim());
    let currentAgent = null;
    const agentRules = {}; // { agentName: { allow: [], disallow: [] } }
    for (const line of lines) {
      const agentMatch = line.match(/^User-agent:\s*(.+)/i);
      if (agentMatch) {
        currentAgent = agentMatch[1].trim();
        if (!agentRules[currentAgent]) agentRules[currentAgent] = { allow: [], disallow: [] };
      } else if (currentAgent) {
        if (/^Allow:\s*\/\s*$/i.test(line)) agentRules[currentAgent].allow.push("/");
        if (/^Disallow:\s*\/\s*$/i.test(line)) agentRules[currentAgent].disallow.push("/");
      }
    }

    const wildcardRules = agentRules["*"] || { allow: [], disallow: [] };
    const wildcardBlocksAll = wildcardRules.disallow.includes("/");
    const wildcardAllows = wildcardRules.allow.includes("/");

    if (wildcardBlocksAll && !wildcardAllows) {
      log(`  ${badge("CRITICAL")} robots.txt is blocking ALL crawlers with "Disallow: /"`, c.red);
      addFinding("Technical", "CRITICAL", "robots-block-all", "robots.txt blocks all crawlers with Disallow: /");
    } else if (wildcardBlocksAll && wildcardAllows) {
      log(`  ${badge("MEDIUM")} robots.txt User-agent: * has both "Disallow: /" and "Allow: /" - order matters`, c.yellow);
      addFinding("Technical", "MEDIUM", "robots-ambiguous", 'robots.txt has both "Disallow: /" and "Allow: /"');
    }

    if (res.body.includes("Allow: /")) {
      log(`  ${badge("OK")} Default Allow: / is set`, c.green);
    }

    const sitemapRefs = res.body.match(/Sitemap:\s*(.+)/gi) || [];
    console.log(`  Sitemaps declared: ${sitemapRefs.length}`);
    for (const ref of sitemapRefs) {
      console.log(`    ${ref.trim()}`);
    }

    if (sitemapRefs.length === 0) {
      addFinding("Technical", "MEDIUM", "robots-no-sitemap", "No Sitemap directive in robots.txt");
    }

    const socialBots = ["facebookexternalhit", "Twitterbot", "LinkedInBot", "WhatsApp"];
    for (const bot of socialBots) {
      if (res.body.includes(bot)) {
        log(`  ${badge("OK")} ${bot} explicitly allowed`, c.green);
      } else {
        log(`  ${badge("MEDIUM")} ${bot} not explicitly mentioned (relies on default Allow: /)`, c.yellow);
      }
    }

    console.log(`\n  First 30 lines:`);
    res.body.split("\n").slice(0, 30).forEach((line) => console.log(`    ${c.dim}${line}${c.reset}`));
  } catch (e) {
    log(`  ${badge("CRITICAL")} Cannot fetch robots.txt: ${e.message}`, c.red);
    addFinding("Technical", "CRITICAL", "robots-unreachable", `Cannot fetch robots.txt: ${e.message}`);
  }
}

// ─── 15. Security Headers (NEW) ─────────────────────────────────────────────────

async function auditSecurityHeaders(siteConfig) {
  header("15. SECURITY HEADERS");

  const url = siteConfig.siteUrl + "/";
  try {
    const res = await fetchCached(url);
    const hdrs = res.headers;

    const checks = [
      {
        name: "Strict-Transport-Security (HSTS)",
        header: "strict-transport-security",
        severity: "HIGH",
        validate: (val) => {
          if (!val) return { ok: false, msg: "MISSING" };
          const maxAge = val.match(/max-age=(\d+)/)?.[1];
          if (maxAge && parseInt(maxAge) < 31536000) return { ok: false, msg: `max-age=${maxAge} (should be >= 31536000)` };
          return { ok: true, msg: val.substring(0, 60) };
        },
      },
      {
        name: "Content-Security-Policy",
        header: "content-security-policy",
        severity: "MEDIUM",
        validate: (val) => val ? { ok: true, msg: val.substring(0, 60) + "..." } : { ok: false, msg: "MISSING" },
      },
      {
        name: "X-Frame-Options",
        header: "x-frame-options",
        severity: "MEDIUM",
        validate: (val) => val ? { ok: true, msg: val } : { ok: false, msg: "MISSING" },
      },
      {
        name: "X-Content-Type-Options",
        header: "x-content-type-options",
        severity: "MEDIUM",
        validate: (val) => val === "nosniff" ? { ok: true, msg: val } : { ok: false, msg: val || "MISSING" },
      },
      {
        name: "Referrer-Policy",
        header: "referrer-policy",
        severity: "LOW",
        validate: (val) => val ? { ok: true, msg: val } : { ok: false, msg: "MISSING" },
      },
      {
        name: "Permissions-Policy",
        header: "permissions-policy",
        severity: "LOW",
        validate: (val) => val ? { ok: true, msg: val.substring(0, 60) + "..." } : { ok: false, msg: "MISSING" },
      },
    ];

    let missingCount = 0;

    for (const check of checks) {
      const val = hdrs[check.header];
      const result = check.validate(val);

      if (result.ok) {
        console.log(`  ${badge("OK")} ${check.name}: ${result.msg}`);
      } else {
        console.log(`  ${badge(check.severity)} ${check.name}: ${result.msg}`);
        addFinding("Security", check.severity, `missing-${check.header}`, `${check.name}: ${result.msg}`);
        missingCount++;
      }
    }

    console.log(`\n  ${c.bold}Result: ${checks.length - missingCount}/${checks.length} security headers present${c.reset}`);
  } catch (e) {
    log(`  Error checking security headers: ${e.message}`, c.red);
    addFinding("Security", "HIGH", "security-headers-error", `Cannot check security headers: ${e.message}`);
  }
}

module.exports = {
  auditSitemapHealth,
  auditTTFB,
  auditRedirectChains,
  auditRobotsTxt,
  auditSecurityHeaders,
};
