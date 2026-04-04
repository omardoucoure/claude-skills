/**
 * Dynamic GSC site discovery and initialization
 *
 * Discovers all sites from credential files stored alongside the skill.
 * Auto-infers siteUrl, keyPages, sitemaps, and locales from the live site.
 *
 * Credentials:
 *   1. GSC_CREDENTIALS_JSON env var (portable, no file dependency)
 *   2. ../credentials/*.json files (bundled with the skill)
 */

const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
const { fetchUrl } = require("./lib/helpers");

const CREDENTIALS_DIR = path.join(__dirname, "..", "credentials");

// ─── Load all credential files ───────────────────────────────────────────────

function loadAllCredentials() {
  const credentials = [];

  // 1. Direct env var (most portable)
  if (process.env.GSC_CREDENTIALS_JSON) {
    try {
      let creds;
      try { creds = JSON.parse(process.env.GSC_CREDENTIALS_JSON); }
      catch { creds = JSON.parse(Buffer.from(process.env.GSC_CREDENTIALS_JSON, "base64").toString("utf8")); }
      credentials.push({ label: "env", credentials: creds });
    } catch { /* invalid env var */ }
  }

  // 2. All JSON files in credentials/ directory
  if (fs.existsSync(CREDENTIALS_DIR)) {
    const files = fs.readdirSync(CREDENTIALS_DIR).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const creds = JSON.parse(fs.readFileSync(path.join(CREDENTIALS_DIR, file), "utf8"));
        if (creds.client_email && creds.private_key) {
          credentials.push({ label: file.replace(".json", ""), credentials: creds });
        }
      } catch { /* skip invalid files */ }
    }
  }

  return credentials;
}

// ─── Discover all GSC sites across all credentials ───────────────────────────

async function discoverSites() {
  const allCreds = loadAllCredentials();
  const discovered = new Map(); // gscProperty -> { gscProperty, credentials, source }
  const diagnostics = { credentialsSources: allCreds.length, errors: [], skipped: [] };

  if (allCreds.length === 0) {
    diagnostics.errors.push("No credential sources found. Add JSON files to credentials/ or set GSC_CREDENTIALS_JSON env var.");
  }

  for (const { label, credentials } of allCreds) {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
      });
      const wm = google.webmasters({ version: "v3", auth });
      const res = await wm.sites.list();

      for (const entry of res.data.siteEntry || []) {
        const prop = entry.siteUrl;
        // Accept both sc-domain: and URL-prefix properties
        if (!discovered.has(prop)) {
          discovered.set(prop, { gscProperty: prop, credentials, source: label });
        }
      }
    } catch (err) {
      diagnostics.errors.push(`[${label}] Auth failed: ${err.message}`);
    }
  }

  return { sites: [...discovered.values()], diagnostics };
}

// ─── Build siteConfig from a discovered site ─────────────────────────────────

function gscPropertyToDomain(gscProperty) {
  return gscProperty
    .replace("sc-domain:", "")
    .replace("https://", "")
    .replace("http://", "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

async function inferSiteConfig(site) {
  const domain = gscPropertyToDomain(site.gscProperty);
  const name = domain.replace(/\.(com|net|org|io|co)$/, "").replace(/[.-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // For URL-prefix properties, use the URL directly; for sc-domain, probe www vs bare
  let siteUrl;
  if (!site.gscProperty.startsWith("sc-domain:")) {
    siteUrl = site.gscProperty.replace(/\/$/, "");
  } else {
    siteUrl = `https://www.${domain}`;
    try {
      const probe = await fetchUrl(siteUrl);
      if (probe.statusCode >= 400 || probe.statusCode === 0) {
        siteUrl = `https://${domain}`;
      }
    } catch {
      siteUrl = `https://${domain}`;
    }
  }

  const config = {
    name,
    gscProperty: site.gscProperty,
    siteUrl,
    credentials: site.credentials,
    sitemaps: ["/sitemap.xml"],
    keyPages: ["/"],
    locales: [],
  };

  // Auto-discover key pages from sitemap
  try {
    const sitemapRes = await fetchUrl(`${siteUrl}/sitemap.xml`);
    if (sitemapRes.statusCode === 200 && sitemapRes.body) {
      const urls = [];
      const locMatches = sitemapRes.body.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi);
      for (const m of locMatches) urls.push(m[1]);

      if (urls.length > 0) {
        const isSitemapIndex = sitemapRes.body.includes("<sitemapindex");
        if (isSitemapIndex) {
          const childSitemapUrls = urls.filter((u) => u.startsWith(siteUrl));
          config.sitemaps = childSitemapUrls
            .map((u) => u.replace(siteUrl, ""))
            .slice(0, 10);
          if (!config.sitemaps.includes("/sitemap.xml")) {
            config.sitemaps.unshift("/sitemap.xml");
          }
          // Fetch first child sitemap to get actual page URLs for keyPages
          try {
            const childRes = await fetchUrl(childSitemapUrls[0]);
            if (childRes.statusCode === 200 && childRes.body) {
              const childUrls = [];
              const childLocs = childRes.body.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi);
              for (const cm of childLocs) childUrls.push(cm[1]);
              const paths = childUrls
                .filter((u) => u.startsWith(siteUrl))
                .map((u) => u.replace(siteUrl, "") || "/")
                .filter((p) => p !== "/")
                .slice(0, 5);
              if (paths.length > 0) config.keyPages = ["/", ...paths];
            }
          } catch { /* child sitemap fetch failed */ }
        } else {
          const paths = urls
            .filter((u) => u.startsWith(siteUrl))
            .map((u) => u.replace(siteUrl, "") || "/")
            .filter((p) => p !== "/")
            .slice(0, 5);
          config.keyPages = ["/", ...paths];
        }
      }
    }
  } catch { /* sitemap not available */ }

  // Auto-discover locales from homepage hreflang
  try {
    const homeRes = await fetchUrl(`${siteUrl}/`);
    if (homeRes.statusCode === 200 && homeRes.body) {
      const hreflangs = new Set();
      const hreflangMatches = homeRes.body.matchAll(/hreflang=["']([a-z]{2}(?:-[a-zA-Z]{2})?)["']/gi);
      for (const m of hreflangMatches) {
        const lang = m[1].split("-")[0].toLowerCase();
        if (lang !== "x") hreflangs.add(lang);
      }
      if (hreflangs.size > 0) config.locales = [...hreflangs];
    }
  } catch { /* no locales detected */ }

  return config;
}

// ─── GSC client initialization ───────────────────────────────────────────────

let searchConsole = null;
let webmastersApi = null;

async function initGSC(siteConfig) {
  if (!siteConfig.credentials) {
    throw new Error(`No credentials for ${siteConfig.name}`);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: siteConfig.credentials,
    scopes: [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/webmasters",
    ],
  });

  searchConsole = google.searchconsole({ version: "v1", auth });
  webmastersApi = google.webmasters({ version: "v3", auth });

  return { searchConsole, webmastersApi };
}

function getGSCClients() {
  return { searchConsole, webmastersApi };
}

module.exports = { discoverSites, inferSiteConfig, gscPropertyToDomain, initGSC, getGSCClients };
