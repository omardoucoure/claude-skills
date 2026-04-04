/**
 * Shared utilities for ASO audit modules
 * Colors, logging, findings infrastructure
 */

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
    INFO: `${c.blue}[INFO]${c.reset}`,
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

// ─── Exec helper ────────────────────────────────────────────────────────────────

const { execSync } = require("child_process");

function exec(cmd, options = {}) {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60000,
      cwd: options.cwd || process.env.HOME + "/Documents/OmApps",
      ...options,
    }).trim();
  } catch (e) {
    if (options.silent) return null;
    return e.stdout ? e.stdout.trim() : null;
  }
}

// ─── String utilities ───────────────────────────────────────────────────────────

function charUsage(text, max) {
  if (!text) return { used: 0, max, pct: 0, wasted: max };
  const used = text.length;
  return {
    used,
    max,
    pct: Math.round((used / max) * 100),
    wasted: max - used,
  };
}

function findDuplicateWords(text1, text2) {
  if (!text1 || !text2) return [];
  const words1 = new Set(text1.toLowerCase().split(/[\s,\-]+/).filter(Boolean));
  const words2 = new Set(text2.toLowerCase().split(/[\s,\-]+/).filter(Boolean));
  return [...words1].filter((w) => words2.has(w) && w.length > 2);
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
  exec,
  charUsage,
  findDuplicateWords,
};
