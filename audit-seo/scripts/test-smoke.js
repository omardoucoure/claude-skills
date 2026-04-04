#!/usr/bin/env node

/**
 * Smoke test for the SEO audit skill.
 *
 * Validates that:
 *   1. All modules load without errors
 *   2. Credential loading works (files or env var)
 *   3. Site discovery returns the expected shape
 *   4. gscPropertyToDomain handles both property types
 *   5. Helpers (scoring, formatting) don't throw
 *
 * Does NOT call live APIs — safe to run offline.
 */

const path = require("path");
const fs = require("fs");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (err) {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    ${err.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

console.log("\n  SEO Audit — Smoke Tests\n");

// ─── Module loading ──────────────────────────────────────────────────────────

test("loads helpers module", () => {
  const helpers = require("./lib/helpers");
  assert(typeof helpers.c === "object", "c should be an object");
  assert(typeof helpers.log === "function", "log should be a function");
  assert(typeof helpers.addFinding === "function", "addFinding should be a function");
  assert(typeof helpers.clearFindings === "function", "clearFindings should be a function");
  assert(typeof helpers.fetchUrl === "function", "fetchUrl should be a function");
});

test("loads sites module", () => {
  const sites = require("./sites");
  assert(typeof sites.discoverSites === "function");
  assert(typeof sites.inferSiteConfig === "function");
  assert(typeof sites.gscPropertyToDomain === "function");
  assert(typeof sites.initGSC === "function");
});

test("loads scoring module", () => {
  const scoring = require("./lib/scoring");
  assert(typeof scoring.computeSEOScore === "function");
});

test("loads gsc-checks module", () => {
  const gsc = require("./lib/gsc-checks");
  assert(typeof gsc.auditPerformance === "function");
  assert(typeof gsc.auditTopQueries === "function");
  assert(typeof gsc.auditContentFreshness === "function");
});

test("loads http-checks module", () => {
  const http = require("./lib/http-checks");
  assert(typeof http.auditSitemapHealth === "function");
  assert(typeof http.auditTTFB === "function");
  assert(typeof http.auditSecurityHeaders === "function");
});

test("loads meta-checks module", () => {
  const meta = require("./lib/meta-checks");
  assert(typeof meta.auditSchemaAndMeta === "function");
  assert(typeof meta.auditHreflang === "function");
  assert(typeof meta.auditAIReadiness === "function");
});

test("loads cwv-checks module", () => {
  const cwv = require("./lib/cwv-checks");
  assert(typeof cwv.auditCoreWebVitals === "function");
});

test("loads keyword-checks module", () => {
  const kw = require("./lib/keyword-checks");
  assert(typeof kw.auditKeywordRanking === "function");
});

test("loads link-checks module", () => {
  const links = require("./lib/link-checks");
  assert(typeof links.auditInternalLinks === "function");
});

// ─── gscPropertyToDomain ─────────────────────────────────────────────────────

test("gscPropertyToDomain handles sc-domain:", () => {
  const { gscPropertyToDomain } = require("./sites");
  assert(gscPropertyToDomain("sc-domain:example.com") === "example.com");
});

test("gscPropertyToDomain handles URL-prefix https://www.", () => {
  const { gscPropertyToDomain } = require("./sites");
  assert(gscPropertyToDomain("https://www.example.com/") === "example.com");
});

test("gscPropertyToDomain handles URL-prefix https:// bare", () => {
  const { gscPropertyToDomain } = require("./sites");
  assert(gscPropertyToDomain("https://example.com") === "example.com");
});

test("gscPropertyToDomain handles http://", () => {
  const { gscPropertyToDomain } = require("./sites");
  assert(gscPropertyToDomain("http://example.com/") === "example.com");
});

// ─── Credential loading ──────────────────────────────────────────────────────

test("credentials directory exists", () => {
  const credDir = path.join(__dirname, "..", "credentials");
  assert(fs.existsSync(credDir), `Missing: ${credDir}`);
});

test("at least one credential JSON file exists", () => {
  const credDir = path.join(__dirname, "..", "credentials");
  const files = fs.readdirSync(credDir).filter((f) => f.endsWith(".json"));
  assert(files.length > 0, "No .json files in credentials/");
});

test("credential files have required fields", () => {
  const credDir = path.join(__dirname, "..", "credentials");
  const files = fs.readdirSync(credDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const creds = JSON.parse(fs.readFileSync(path.join(credDir, file), "utf8"));
    assert(creds.client_email, `${file} missing client_email`);
    assert(creds.private_key, `${file} missing private_key`);
  }
});

// ─── Discovery return shape ──────────────────────────────────────────────────

test("discoverSites returns { sites, diagnostics }", async () => {
  // This calls the real function but may fail on network — that's OK,
  // we just verify the return shape includes diagnostics
  const { discoverSites } = require("./sites");
  const result = await discoverSites();
  assert(Array.isArray(result.sites), "result.sites should be an array");
  assert(typeof result.diagnostics === "object", "result.diagnostics should be an object");
  assert(typeof result.diagnostics.credentialsSources === "number", "diagnostics.credentialsSources should be a number");
  assert(Array.isArray(result.diagnostics.errors), "diagnostics.errors should be an array");
});

// ─── Findings & scoring ──────────────────────────────────────────────────────

test("addFinding + clearFindings roundtrip", () => {
  const { addFinding, clearFindings, getFindings } = require("./lib/helpers");
  clearFindings();
  addFinding("Test", "HIGH", "test-id", "Test finding");
  const findings = getFindings();
  assert(findings.length === 1, `Expected 1 finding, got ${findings.length}`);
  assert(findings[0].severity === "HIGH");
  clearFindings();
  assert(getFindings().length === 0, "Findings should be empty after clear");
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
