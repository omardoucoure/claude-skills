/**
 * HTML/meta-based audit checks (fetches pages and inspects markup)
 */

const { c, log, header, subHeader, badge, addFinding, fetchUrl, fetchCached } = require("./helpers");

// ─── 16. Schema, OG & Meta ─────────────────────────────────────────────────────

async function auditSchemaAndMeta(siteConfig, { webmastersApi } = {}) {
  header("16. SCHEMA, OG TAGS & META AUDIT (sample pages)");

  let testUrls = [];

  if (webmastersApi) {
    const today = new Date();
    const d7ago = new Date(today - 7 * 86400000).toISOString().split("T")[0];
    const d3ago = new Date(today - 3 * 86400000).toISOString().split("T")[0];

    try {
      const res = await webmastersApi.searchanalytics.query({
        siteUrl: siteConfig.gscProperty,
        requestBody: { startDate: d7ago, endDate: d3ago, dimensions: ["page"], rowLimit: 5 },
      });
      testUrls = (res.data.rows || []).map((r) => r.keys[0]).filter((u) => u !== siteConfig.siteUrl + "/");
    } catch {
      // Fall through to key pages
    }
  }

  if (testUrls.length === 0) {
    testUrls = siteConfig.keyPages.slice(1, 4).map((p) => siteConfig.siteUrl + p);
  }

  for (const url of testUrls.slice(0, 3)) {
    subHeader(url.replace(siteConfig.siteUrl, "").substring(0, 60));

    try {
      const res = await fetchCached(url);
      const html = res.body;

      // JSON-LD
      const jsonLdBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
      console.log(`  JSON-LD blocks: ${jsonLdBlocks.length}`);
      for (const block of jsonLdBlocks) {
        try {
          const content = block.replace(/<\/?script[^>]*>/gi, "");
          const data = JSON.parse(content);
          const type = data["@type"] || (data["@graph"] ? "Graph" : "Unknown");
          console.log(`    Type: ${c.cyan}${type}${c.reset}`);
        } catch {
          console.log(`    ${c.red}Invalid JSON-LD${c.reset}`);
          addFinding("Content/Meta", "MEDIUM", "invalid-jsonld", `Invalid JSON-LD on ${url}`);
        }
      }

      if (jsonLdBlocks.length === 0) {
        addFinding("Content/Meta", "HIGH", "no-jsonld", `No JSON-LD structured data on ${url}`);
      }

      // OG tags
      const ogTitle = html.match(/property="og:title"\s+content="([^"]*)"/)?.[1];
      const ogDesc = html.match(/property="og:description"\s+content="([^"]*)"/)?.[1];
      const ogImage = html.match(/property="og:image"\s+content="([^"]*)"/)?.[1];
      const ogType = html.match(/property="og:type"\s+content="([^"]*)"/)?.[1];

      console.log(`  og:title:   ${ogTitle ? badge("OK") + " " + ogTitle.substring(0, 60) : badge("HIGH") + " MISSING"}`);
      console.log(`  og:desc:    ${ogDesc ? badge("OK") + " " + ogDesc.substring(0, 60) : badge("HIGH") + " MISSING"}`);
      console.log(`  og:image:   ${ogImage ? (ogImage.includes("placeholder") ? badge("HIGH") + " PLACEHOLDER" : badge("OK") + " " + ogImage.substring(0, 60)) : badge("HIGH") + " MISSING"}`);
      console.log(`  og:type:    ${ogType ? badge("OK") + " " + ogType : badge("MEDIUM") + " MISSING"}`);

      if (!ogTitle) addFinding("Content/Meta", "HIGH", "missing-og-title", `Missing og:title on ${url}`);
      if (!ogImage || ogImage.includes("placeholder")) addFinding("Content/Meta", "HIGH", "missing-og-image", `Missing/placeholder og:image on ${url}`);

      // Twitter
      const twitterCard = html.match(/name="twitter:card"\s+content="([^"]*)"/)?.[1];
      const twitterSite = html.match(/name="twitter:site"\s+content="([^"]*)"/)?.[1];
      console.log(`  tw:card:    ${twitterCard ? badge("OK") + " " + twitterCard : badge("MEDIUM") + " MISSING"}`);
      console.log(`  tw:site:    ${twitterSite ? badge("OK") + " " + twitterSite : badge("MEDIUM") + " MISSING"}`);

      // Canonical
      const canonical = html.match(/rel="canonical"\s+href="([^"]*)"/)?.[1];
      console.log(`  canonical:  ${canonical ? badge("OK") + " " + canonical.substring(0, 60) : badge("HIGH") + " MISSING"}`);

      // Title tag
      const title = html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1];
      const titleLen = title?.length || 0;
      const titleColor = titleLen > 60 ? c.yellow : titleLen < 30 ? c.yellow : c.green;
      console.log(`  <title>:    ${title ? `${titleColor}${titleLen} chars${c.reset} - ${title.substring(0, 60)}` : badge("HIGH") + " MISSING"}`);

      // Hreflang
      const hreflangs = html.match(/hreflang="[^"]*"|hrefLang="[^"]*"/gi) || [];
      console.log(`  hreflangs:  ${hreflangs.length > 0 ? badge("OK") + " " + hreflangs.length + " tags" : badge("MEDIUM") + " NONE"}`);

      // Robots meta
      const robotsMeta = html.match(/name="robots"\s+content="([^"]*)"/)?.[1];
      console.log(`  robots:     ${robotsMeta ? badge("OK") + " " + robotsMeta : c.dim + "Not set (defaults to index,follow)" + c.reset}`);
    } catch (e) {
      log(`  Error: ${e.message}`, c.red);
    }
  }
}

// ─── 17. Hreflang (NEW) ─────────────────────────────────────────────────────────

async function auditHreflang(siteConfig) {
  header("17. HREFLANG AUDIT");

  if (!siteConfig.locales || siteConfig.locales.length <= 1) {
    console.log(`  ${c.dim}Single-locale site, skipping hreflang check${c.reset}`);
    return;
  }

  const expectedLocales = new Set(siteConfig.locales);
  const testPages = siteConfig.keyPages.slice(0, 3);
  let issueCount = 0;

  for (const pagePath of testPages) {
    const url = siteConfig.siteUrl + pagePath;
    subHeader(pagePath || "/");

    try {
      const res = await fetchCached(url);
      const html = res.body;

      // Extract hreflang tags
      const hreflangMatches = html.match(/<link[^>]*hreflang="([^"]*)"[^>]*href="([^"]*)"[^>]*\/?>/gi) || [];
      const found = {};

      for (const tag of hreflangMatches) {
        const lang = tag.match(/hreflang="([^"]*)"/i)?.[1];
        const href = tag.match(/href="([^"]*)"/i)?.[1];
        if (lang && href) found[lang] = href;
      }

      const foundLocales = Object.keys(found);
      console.log(`  Found ${foundLocales.length} hreflang tags: ${foundLocales.join(", ") || "none"}`);

      // Check for missing locales
      for (const locale of expectedLocales) {
        if (!found[locale]) {
          console.log(`  ${badge("HIGH")} Missing hreflang for "${locale}"`);
          issueCount++;
        }
      }

      // Check self-referential
      const selfRef = found[siteConfig.locales[0]];
      if (selfRef) {
        console.log(`  ${badge("OK")} Self-referential hreflang present`);
      } else if (foundLocales.length > 0) {
        console.log(`  ${badge("MEDIUM")} No self-referential hreflang tag`);
        issueCount++;
      }

      // Check x-default
      if (found["x-default"]) {
        console.log(`  ${badge("OK")} x-default present: ${found["x-default"].substring(0, 50)}`);
      } else if (foundLocales.length > 0) {
        console.log(`  ${badge("LOW")} No x-default hreflang`);
      }

      // Protocol consistency check
      for (const [lang, href] of Object.entries(found)) {
        if (href.startsWith("http://")) {
          console.log(`  ${badge("HIGH")} hreflang "${lang}" uses HTTP instead of HTTPS`);
          issueCount++;
        }
      }
    } catch (e) {
      log(`  Error: ${e.message}`, c.red);
    }
  }

  if (issueCount > 0) {
    addFinding("Technical", "HIGH", "hreflang-issues", `${issueCount} hreflang issue(s) across key pages`);
  }
}

// ─── 18. Canonical (NEW) ────────────────────────────────────────────────────────

async function auditCanonical(siteConfig) {
  header("18. CANONICAL TAG AUDIT");

  const testPages = siteConfig.keyPages.slice(0, 5);
  let issueCount = 0;

  for (const pagePath of testPages) {
    const url = siteConfig.siteUrl + pagePath;
    const shortUrl = pagePath || "/";

    try {
      const res = await fetchCached(url);
      const html = res.body;

      const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*\/?>/i)?.[1];
      const robotsMeta = html.match(/name="robots"\s+content="([^"]*)"/i)?.[1] || "";

      if (!canonical) {
        console.log(`  ${badge("HIGH")} ${shortUrl} - No canonical tag`);
        addFinding("Technical", "HIGH", "missing-canonical", `No canonical tag on ${shortUrl}`);
        issueCount++;
        continue;
      }

      // Canonical + noindex conflict
      if (robotsMeta.includes("noindex")) {
        console.log(`  ${badge("HIGH")} ${shortUrl} - Canonical set but page is noindex`);
        addFinding("Technical", "HIGH", "canonical-noindex-conflict", `${shortUrl} has canonical but is noindex`);
        issueCount++;
        continue;
      }

      // Protocol mismatch
      if (canonical.startsWith("http://") && url.startsWith("https://")) {
        console.log(`  ${badge("MEDIUM")} ${shortUrl} - Canonical uses HTTP, page is HTTPS`);
        addFinding("Technical", "MEDIUM", "canonical-protocol-mismatch", `${shortUrl} canonical uses HTTP`);
        issueCount++;
        continue;
      }

      // Trailing slash consistency
      const canonicalHasSlash = canonical.endsWith("/");
      const urlHasSlash = url.endsWith("/");
      if (canonicalHasSlash !== urlHasSlash && url !== siteConfig.siteUrl) {
        console.log(`  ${badge("LOW")} ${shortUrl} - Trailing slash mismatch (URL: ${urlHasSlash}, canonical: ${canonicalHasSlash})`);
      }

      console.log(`  ${badge("OK")} ${shortUrl} -> ${canonical.substring(0, 60)}`);
    } catch (e) {
      console.log(`  ${c.red}Error checking ${shortUrl}: ${e.message}${c.reset}`);
    }
  }

  if (issueCount === 0) {
    console.log(`\n  ${c.green}All canonical tags look healthy${c.reset}`);
  }
}

// ─── 19. Duplicate Meta (NEW) ───────────────────────────────────────────────────

async function auditDuplicateMeta(siteConfig) {
  header("19. DUPLICATE META AUDIT (sitemap sample)");

  // Fetch sitemap and collect up to 50 URLs
  const sitemapUrl = siteConfig.siteUrl + siteConfig.sitemaps[0];
  let urls = [];

  try {
    const smRes = await fetchUrl(sitemapUrl);
    const urlMatches = smRes.body.match(/<loc>([^<]+)<\/loc>/g) || [];
    urls = urlMatches.map((m) => m.replace(/<\/?loc>/g, ""))
      .filter((u) => !u.endsWith(".xml")) // Skip XML sitemaps
      .slice(0, 50);
  } catch {
    // Fall back to key pages
    urls = siteConfig.keyPages.map((p) => siteConfig.siteUrl + p);
  }

  console.log(`  Scanning ${urls.length} pages for duplicate titles/descriptions...\n`);

  const titles = {};
  const descriptions = {};
  let emptyTitles = 0;
  let emptyDescs = 0;

  for (const url of urls) {
    try {
      const res = await fetchCached(url);
      const html = res.body;
      const shortUrl = url.replace(siteConfig.siteUrl, "").substring(0, 60);

      const title = html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1]?.trim();
      const desc = html.match(/name="description"\s+content="([^"]*)"/)?.[1]?.trim();

      if (!title || title.length === 0) {
        emptyTitles++;
      } else {
        if (!titles[title]) titles[title] = [];
        titles[title].push(shortUrl);
      }

      if (!desc || desc.length === 0) {
        emptyDescs++;
      } else {
        if (!descriptions[desc]) descriptions[desc] = [];
        descriptions[desc].push(shortUrl);
      }
    } catch {
      // Skip failures
    }
  }

  // Report duplicate titles
  const dupTitles = Object.entries(titles).filter(([, pages]) => pages.length > 1);
  if (dupTitles.length > 0) {
    console.log(`  ${badge("HIGH")} ${dupTitles.length} duplicate title(s):`);
    for (const [title, pages] of dupTitles.slice(0, 5)) {
      console.log(`    "${title.substring(0, 50)}" -> ${pages.length} pages`);
      for (const p of pages.slice(0, 3)) console.log(`      ${c.dim}${p}${c.reset}`);
    }
    addFinding("Content/Meta", "HIGH", "duplicate-titles", `${dupTitles.length} sets of pages share the same <title>`);
  } else {
    console.log(`  ${badge("OK")} No duplicate titles`);
  }

  // Report duplicate descriptions
  const dupDescs = Object.entries(descriptions).filter(([, pages]) => pages.length > 1);
  if (dupDescs.length > 0) {
    console.log(`  ${badge("MEDIUM")} ${dupDescs.length} duplicate description(s):`);
    for (const [desc, pages] of dupDescs.slice(0, 5)) {
      console.log(`    "${desc.substring(0, 50)}" -> ${pages.length} pages`);
    }
    addFinding("Content/Meta", "MEDIUM", "duplicate-descriptions", `${dupDescs.length} sets of pages share the same meta description`);
  } else {
    console.log(`  ${badge("OK")} No duplicate descriptions`);
  }

  // Empty titles/descriptions
  if (emptyTitles > 0) {
    console.log(`  ${badge("HIGH")} ${emptyTitles} page(s) with empty <title>`);
    addFinding("Content/Meta", "HIGH", "empty-titles", `${emptyTitles} page(s) have empty <title> tags`);
  }
  if (emptyDescs > 0) {
    console.log(`  ${badge("MEDIUM")} ${emptyDescs} page(s) with empty meta description`);
    addFinding("Content/Meta", "MEDIUM", "empty-descriptions", `${emptyDescs} page(s) have empty meta descriptions`);
  }

  console.log(`\n  ${c.bold}Scanned: ${urls.length} pages | Duplicates: ${dupTitles.length} titles, ${dupDescs.length} descriptions${c.reset}`);
}

// ─── 21. AI Readiness (NEW) ─────────────────────────────────────────────────────

async function auditAIReadiness(siteConfig) {
  header("21. AI READINESS AUDIT");

  const testPages = siteConfig.keyPages.slice(0, 3);

  for (const pagePath of testPages) {
    const url = siteConfig.siteUrl + pagePath;
    subHeader(pagePath || "/");

    try {
      const res = await fetchCached(url);
      const html = res.body;

      // JSON-LD completeness
      const jsonLdBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
      let hasArticle = false, hasFAQ = false, hasHowTo = false, hasOrg = false, hasBreadcrumb = false;

      for (const block of jsonLdBlocks) {
        const content = block.replace(/<\/?script[^>]*>/gi, "");
        try {
          const data = JSON.parse(content);
          const types = [];

          // Handle @graph
          if (data["@graph"]) {
            for (const item of data["@graph"]) types.push(item["@type"]);
          } else {
            types.push(data["@type"]);
          }

          for (const t of types) {
            if (["Article", "NewsArticle", "BlogPosting", "Recipe"].includes(t)) hasArticle = true;
            if (t === "FAQPage") hasFAQ = true;
            if (t === "HowTo") hasHowTo = true;
            if (t === "Organization") hasOrg = true;
            if (t === "BreadcrumbList") hasBreadcrumb = true;
          }
        } catch {
          // Skip invalid JSON-LD
        }
      }

      console.log(`  JSON-LD types:`);
      console.log(`    ${hasArticle ? badge("OK") : badge("MEDIUM")} Article/Recipe schema`);
      console.log(`    ${hasFAQ ? badge("OK") : badge("LOW")} FAQ schema`);
      console.log(`    ${hasHowTo ? badge("OK") : badge("LOW")} HowTo schema`);
      console.log(`    ${hasOrg ? badge("OK") : badge("LOW")} Organization schema`);
      console.log(`    ${hasBreadcrumb ? badge("OK") : badge("MEDIUM")} Breadcrumb schema`);

      // Heading structure
      const h1s = html.match(/<h1[^>]*>/gi) || [];
      const h2s = html.match(/<h2[^>]*>/gi) || [];
      const h3s = html.match(/<h3[^>]*>/gi) || [];

      console.log(`  Heading structure: H1:${h1s.length} H2:${h2s.length} H3:${h3s.length}`);
      if (h1s.length === 0) {
        console.log(`    ${badge("HIGH")} No H1 tag`);
        addFinding("Content/Meta", "HIGH", "missing-h1", `No H1 tag on ${pagePath || "/"}`);
      } else if (h1s.length > 1) {
        console.log(`    ${badge("MEDIUM")} Multiple H1 tags (${h1s.length})`);
        addFinding("Content/Meta", "MEDIUM", "multiple-h1", `${h1s.length} H1 tags on ${pagePath || "/"}`);
      }

      // Content length (rough text extraction)
      const textContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const wordCount = textContent.split(" ").length;
      const wordColor = wordCount > 300 ? c.green : wordCount > 100 ? c.yellow : c.red;
      console.log(`  Content: ${wordColor}~${wordCount} words${c.reset}`);

      if (wordCount < 100) {
        addFinding("Content/Meta", "HIGH", "thin-content", `${pagePath || "/"} has very thin content (~${wordCount} words)`);
      }

      // Author entity
      const hasAuthor = html.includes('rel="author"') || html.includes('"author"') || html.includes("article:author");
      console.log(`  Author entity: ${hasAuthor ? badge("OK") : badge("LOW") + " Not found"}`);

    } catch (e) {
      log(`  Error: ${e.message}`, c.red);
    }
  }
}

module.exports = {
  auditSchemaAndMeta,
  auditHreflang,
  auditCanonical,
  auditDuplicateMeta,
  auditAIReadiness,
};
