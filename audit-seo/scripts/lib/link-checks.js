/**
 * Internal linking analysis
 */

const { c, log, header, subHeader, badge, addFinding, fetchUrl, fetchCached } = require("./helpers");

// ─── 20. Internal Links (NEW) ───────────────────────────────────────────────────

async function auditInternalLinks(siteConfig) {
  header("20. INTERNAL LINKING ANALYSIS");

  // Fetch sitemap URLs (up to 50)
  const sitemapUrl = siteConfig.siteUrl + siteConfig.sitemaps[0];
  let sitemapUrls = [];

  try {
    const smRes = await fetchUrl(sitemapUrl);
    const urlMatches = smRes.body.match(/<loc>([^<]+)<\/loc>/g) || [];
    sitemapUrls = urlMatches.map((m) => m.replace(/<\/?loc>/g, ""))
      .filter((u) => !u.endsWith(".xml")); // Skip XML sub-sitemaps
  } catch {
    sitemapUrls = siteConfig.keyPages.map((p) => siteConfig.siteUrl + p);
  }

  // Take a sample of pages to crawl for links
  const sampleSize = Math.min(30, sitemapUrls.length);
  const sample = sitemapUrls.sort(() => Math.random() - 0.5).slice(0, sampleSize);
  // Always include homepage
  if (!sample.includes(siteConfig.siteUrl + "/")) {
    sample.unshift(siteConfig.siteUrl + "/");
  }

  console.log(`  Crawling ${sample.length} pages for internal link graph...\n`);

  const inboundLinks = {}; // URL -> Set of pages linking to it
  const outboundCounts = {}; // URL -> count of internal links

  const domain = new URL(siteConfig.siteUrl).hostname;

  for (const url of sample) {
    try {
      const res = await fetchCached(url);
      const html = res.body;

      // Extract all href links
      const linkMatches = html.match(/href="([^"]*?)"/gi) || [];
      const internalLinks = new Set();

      for (const match of linkMatches) {
        const href = match.match(/href="([^"]*)"/)?.[1];
        if (!href) continue;

        let fullUrl;
        try {
          fullUrl = href.startsWith("http") ? href : new URL(href, url).href;
        } catch {
          continue;
        }

        const linkDomain = new URL(fullUrl).hostname;
        if (linkDomain === domain || linkDomain === domain.replace("www.", "") || linkDomain === "www." + domain) {
          // Normalize: remove trailing slash, query, hash
          const normalized = fullUrl.split("?")[0].split("#")[0].replace(/\/$/, "") || fullUrl;
          internalLinks.add(normalized);
        }
      }

      outboundCounts[url] = internalLinks.size;

      for (const linked of internalLinks) {
        if (!inboundLinks[linked]) inboundLinks[linked] = new Set();
        inboundLinks[linked].add(url);
      }
    } catch {
      // Skip pages that fail to load
    }
  }

  // Find orphan pages (in sitemap but 0 inbound links from sample)
  const orphans = sitemapUrls.filter((url) => {
    const normalized = url.replace(/\/$/, "");
    const count = inboundLinks[normalized]?.size || inboundLinks[url]?.size || 0;
    return count === 0 && url !== siteConfig.siteUrl + "/" && url !== siteConfig.siteUrl;
  }).slice(0, 20);

  // Find dead-end pages (0 or very few outbound internal links)
  const deadEnds = sample.filter((url) => (outboundCounts[url] || 0) < 3).slice(0, 10);

  // Homepage reach
  const homepageNormalized = siteConfig.siteUrl.replace(/\/$/, "");
  const homepageLinks = inboundLinks[homepageNormalized]?.size || inboundLinks[siteConfig.siteUrl + "/"]?.size || 0;
  const pagesReachedFromHome = outboundCounts[siteConfig.siteUrl + "/"] || outboundCounts[siteConfig.siteUrl] || 0;

  console.log(`  ${c.bold}Link Graph Summary:${c.reset}`);
  console.log(`    Pages crawled:              ${sample.length}`);
  console.log(`    Avg internal links/page:    ${Math.round(Object.values(outboundCounts).reduce((a, b) => a + b, 0) / sample.length)}`);
  console.log(`    Homepage outbound links:    ${pagesReachedFromHome}`);
  console.log(`    Pages linking to homepage:  ${homepageLinks}`);

  // Orphan pages
  if (orphans.length > 0) {
    console.log(`\n  ${badge("MEDIUM")} Potential orphan pages (0 inbound links in sample):`);
    for (const url of orphans.slice(0, 10)) {
      console.log(`    ${c.dim}${url.replace(siteConfig.siteUrl, "").substring(0, 70)}${c.reset}`);
    }
    addFinding("Content/Meta", "MEDIUM", "orphan-pages", `${orphans.length} potential orphan page(s) with no inbound internal links`);
  } else {
    console.log(`\n  ${badge("OK")} No orphan pages detected in sample`);
  }

  // Dead-end pages
  if (deadEnds.length > 0) {
    console.log(`\n  ${badge("LOW")} Dead-end pages (<3 internal links):`);
    for (const url of deadEnds.slice(0, 5)) {
      console.log(`    ${c.dim}${url.replace(siteConfig.siteUrl, "").substring(0, 70)} (${outboundCounts[url]} links)${c.reset}`);
    }
    if (deadEnds.length > 3) {
      addFinding("Content/Meta", "LOW", "dead-end-pages", `${deadEnds.length} page(s) with fewer than 3 internal links`);
    }
  }
}

module.exports = { auditInternalLinks };
