/**
 * Shared utilities for SEO audit modules
 * Colors, HTTP helpers, logging, findings infrastructure
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");

// ─── Colors ─────────────────────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
};

// ─── Logging ────────────────────────────────────────────────────────────────────

function log(msg, color = "") {
  console.log(`${color}${msg}${c.reset}`);
}

function header(title) {
  console.log(`\n${"═".repeat(80)}`);
  log(`  ${title}`, c.bold + c.cyan);
  console.log(`${"═".repeat(80)}`);
}

function subHeader(title) {
  console.log(`\n${"─".repeat(60)}`);
  log(`  ${title}`, c.bold);
  console.log(`${"─".repeat(60)}`);
}

function badge(severity) {
  const badges = {
    CRITICAL: `${c.bgRed}${c.bold} CRITICAL ${c.reset}`,
    HIGH: `${c.red}${c.bold}[HIGH]${c.reset}`,
    MEDIUM: `${c.yellow}[MEDIUM]${c.reset}`,
    LOW: `${c.dim}[LOW]${c.reset}`,
    OK: `${c.green}[OK]${c.reset}`,
  };
  return badges[severity] || severity;
}

// ─── Findings infrastructure ────────────────────────────────────────────────────

const findings = [];

function addFinding(section, severity, check, message) {
  findings.push({ section, severity, check, message, timestamp: Date.now() });
}

function getFindings() {
  return findings;
}

function clearFindings() {
  findings.length = 0;
}

// ─── HTTP helpers ───────────────────────────────────────────────────────────────

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: {
        "User-Agent":
          options.userAgent ||
          "Mozilla/5.0 (compatible; SEOAudit/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...options.headers,
      },
      timeout: 15000,
    };

    const req = lib.request(reqOptions, (res) => {
      let body = "";
      const ttfb = Date.now() - startTime;

      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          ttfb,
          totalTime: Date.now() - startTime,
          url,
          redirectUrl: res.headers.location || null,
        });
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
    req.end();
  });
}

async function followRedirects(url, maxHops = 10) {
  const chain = [];
  let currentUrl = url;

  for (let i = 0; i < maxHops; i++) {
    try {
      const res = await fetchUrl(currentUrl);
      chain.push({
        url: currentUrl,
        statusCode: res.statusCode,
        redirectUrl: res.redirectUrl,
        ttfb: res.ttfb,
      });

      if (res.statusCode >= 300 && res.statusCode < 400 && res.redirectUrl) {
        currentUrl = res.redirectUrl.startsWith("http")
          ? res.redirectUrl
          : new URL(res.redirectUrl, currentUrl).href;
      } else {
        break;
      }
    } catch (e) {
      chain.push({ url: currentUrl, statusCode: "ERROR", error: e.message });
      break;
    }
  }

  return chain;
}

// ─── Page cache ─────────────────────────────────────────────────────────────────

const pageCache = new Map();

async function fetchCached(url) {
  if (pageCache.has(url)) return pageCache.get(url);
  const result = await fetchUrl(url);
  pageCache.set(url, result);
  return result;
}

function clearCache() {
  pageCache.clear();
}

module.exports = {
  c,
  log,
  header,
  subHeader,
  badge,
  findings,
  addFinding,
  getFindings,
  clearFindings,
  fetchUrl,
  followRedirects,
  fetchCached,
  clearCache,
};
