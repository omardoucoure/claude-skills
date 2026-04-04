/**
 * Core Web Vitals audit using Lighthouse CLI (primary) with PSI API fallback
 *
 * Metrics checked:
 *   LCP  - Largest Contentful Paint   (loading)       Google ranking signal
 *   CLS  - Cumulative Layout Shift    (stability)     Google ranking signal
 *   INP  - Interaction to Next Paint  (responsiveness) Google ranking signal
 *   FCP  - First Contentful Paint     (perceived load)
 *   TTFB - Time to First Byte         (server)
 *   TBT  - Total Blocking Time        (main thread)
 *   SI   - Speed Index                (visual load)
 *
 * Primary: Lighthouse CLI (no quota limits, always available)
 * Fallback: PSI API (if Lighthouse CLI is not installed)
 */

const https = require("https");
const { execSync } = require("child_process");
const { c, log, header, subHeader, badge, addFinding } = require("./helpers");

const PSI_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

// Thresholds aligned with Google's pass/needs-improvement/fail bands
const THRESHOLDS = {
  lcp:  { good: 2500, poor: 4000, unit: "ms", label: "LCP  (Largest Contentful Paint)" },
  cls:  { good: 0.1,  poor: 0.25, unit: "",   label: "CLS  (Cumulative Layout Shift)" },
  inp:  { good: 200,  poor: 500,  unit: "ms", label: "INP  (Interaction to Next Paint)" },
  fcp:  { good: 1800, poor: 3000, unit: "ms", label: "FCP  (First Contentful Paint)" },
  ttfb: { good: 800,  poor: 1800, unit: "ms", label: "TTFB (Time to First Byte)" },
  tbt:  { good: 200,  poor: 600,  unit: "ms", label: "TBT  (Total Blocking Time)" },
  si:   { good: 3400, poor: 5800, unit: "ms", label: "SI   (Speed Index)" },
};

// Lighthouse audit IDs → our metric keys
const LAB_METRIC_MAP = {
  "largest-contentful-paint":   { key: "lcp",  scale: 1 },
  "cumulative-layout-shift":    { key: "cls",  scale: 1 },
  "total-blocking-time":        { key: "tbt",  scale: 1 },
  "first-contentful-paint":     { key: "fcp",  scale: 1 },
  "speed-index":                { key: "si",   scale: 1 },
};

// CrUX field data metric IDs (only available via PSI API)
const FIELD_METRIC_MAP = {
  "LARGEST_CONTENTFUL_PAINT_MS":        { key: "lcp",  scale: 1 },
  "CUMULATIVE_LAYOUT_SHIFT_SCORE":      { key: "cls",  scale: 1 },
  "INTERACTION_TO_NEXT_PAINT":          { key: "inp",  scale: 1 },
  "FIRST_CONTENTFUL_PAINT_MS":          { key: "fcp",  scale: 1 },
  "EXPERIMENTAL_TIME_TO_FIRST_BYTE":    { key: "ttfb", scale: 1 },
};

function runLighthouseCLI(url, strategy) {
  try {
    const preset = strategy === "mobile" ? "perf" : "desktop";
    const cmd = `lighthouse "${url}" --only-categories=performance --output=json --chrome-flags="--headless --no-sandbox --disable-gpu" --quiet --preset=${preset} 2>/dev/null`;
    const output = execSync(cmd, { timeout: 120000, maxBuffer: 10 * 1024 * 1024 }).toString();
    const lhr = JSON.parse(output);
    return {
      lighthouseResult: lhr,
      loadingExperience: null,
      originLoadingExperience: null,
      source: "lighthouse",
    };
  } catch (e) {
    return null;
  }
}

function fetchPSI(url, strategy) {
  return new Promise((resolve, reject) => {
    const apiUrl = `${PSI_API}?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance`;
    const req = https.get(apiUrl, { timeout: 60000 }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (data.error) {
            reject(new Error(data.error.message));
          } else {
            data.source = "psi";
            resolve(data);
          }
        } catch (e) {
          reject(new Error(`Invalid JSON from PSI API`));
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("PSI API timeout (60s)"));
    });
  });
}

function rateMetric(key, value) {
  const t = THRESHOLDS[key];
  if (!t) return { color: c.dim, label: "N/A" };
  if (value <= t.good) return { color: c.green, label: "GOOD" };
  if (value <= t.poor) return { color: c.yellow, label: "NEEDS IMPROVEMENT" };
  return { color: c.red, label: "POOR" };
}

function formatValue(key, value) {
  if (value === null || value === undefined) return "N/A";
  const t = THRESHOLDS[key];
  if (!t) return String(value);
  if (t.unit === "ms") return `${Math.round(value)}ms`;
  if (t.unit === "") return value.toFixed(3); // CLS
  return String(value);
}

function extractLabMetrics(audits) {
  const metrics = {};
  for (const [auditId, map] of Object.entries(LAB_METRIC_MAP)) {
    const audit = audits[auditId];
    if (!audit) continue;
    const raw = audit.numericValue;
    if (raw !== undefined && raw !== null) {
      metrics[map.key] = raw * map.scale;
    }
  }
  return metrics;
}

function extractFieldMetrics(loadingExperience) {
  if (!loadingExperience || !loadingExperience.metrics) return null;
  const metrics = {};
  for (const [metricId, map] of Object.entries(FIELD_METRIC_MAP)) {
    const m = loadingExperience.metrics[metricId];
    if (!m) continue;
    const p75 = m.percentile;
    if (p75 !== undefined && p75 !== null) {
      metrics[map.key] = p75 * map.scale;
    }
  }
  return Object.keys(metrics).length > 0 ? metrics : null;
}

function printMetricRow(key, labValue, fieldValue) {
  const t = THRESHOLDS[key];
  if (!t) return;

  const label = t.label.padEnd(42);
  const labStr = formatValue(key, labValue);
  const { color: labColor, label: labRating } = labValue !== undefined
    ? rateMetric(key, labValue)
    : { color: c.dim, label: "N/A" };

  let line = `  ${label}  Lab: ${labColor}${labStr.padStart(8)}${c.reset}  (${labColor}${labRating}${c.reset})`;

  if (fieldValue !== undefined && fieldValue !== null) {
    const { color: fColor, label: fRating } = rateMetric(key, fieldValue);
    line += `   Field p75: ${fColor}${formatValue(key, fieldValue).padStart(8)}${c.reset}  (${fColor}${fRating}${c.reset})`;
  }

  console.log(line);
}

function printScoreBar(score) {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  const color = score >= 90 ? c.green : score >= 50 ? c.yellow : c.red;
  return `${color}${"█".repeat(filled)}${c.dim}${"░".repeat(empty)}${c.reset} ${color}${score}${c.reset}`;
}

async function auditCoreWebVitals(siteConfig) {
  header("22. CORE WEB VITALS (PageSpeed Insights)");

  const testPages = siteConfig.keyPages
    .slice(0, 2)
    .map((p) => siteConfig.siteUrl + p);

  const strategies = ["mobile"];
  const findings_cwv = { lcp: [], cls: [], inp: [], fcp: [], ttfb: [] };

  for (const pageUrl of testPages) {
    const shortUrl = pageUrl.replace(siteConfig.siteUrl, "") || "/";
    subHeader(`Page: ${shortUrl}`);

    for (const strategy of strategies) {
      console.log(`\n  ${c.bold}${strategy.toUpperCase()}${c.reset}`);

      try {
        // Primary: Lighthouse CLI (no quota limits)
        log(`  ${c.dim}Running Lighthouse CLI...${c.reset}`);
        let data = runLighthouseCLI(pageUrl, strategy);

        if (data) {
          log(`  ${badge("OK")} Lighthouse CLI succeeded`, c.green);
        } else {
          // Fallback: PSI API
          log(`  ${c.yellow}Lighthouse CLI not available, falling back to PSI API...${c.reset}`, c.yellow);
          try {
            data = await fetchPSI(pageUrl, strategy);
            log(`  ${badge("OK")} PSI API succeeded`, c.green);
          } catch (psiErr) {
            log(`  ${badge("HIGH")} Both Lighthouse CLI and PSI API failed: ${psiErr.message}`, c.red);
            addFinding("Core Web Vitals", "HIGH", "cwv-fetch-error", `Cannot measure CWV for ${shortUrl}: Lighthouse CLI unavailable, PSI error: ${psiErr.message}`);
            continue;
          }
        }

        const lhr = data.lighthouseResult;
        const loadExp = data.loadingExperience;
        const originExp = data.originLoadingExperience;

        // Performance score
        const perfScore = Math.round((lhr?.categories?.performance?.score || 0) * 100);
        console.log(`  Performance Score: ${printScoreBar(perfScore)}/100`);

        // Lab metrics
        const lab = extractLabMetrics(lhr?.audits || {});

        // Field data (CrUX) — only available from PSI API
        const field = extractFieldMetrics(loadExp) || extractFieldMetrics(originExp);
        if (field) {
          console.log(`  ${c.dim}(Field data: real-user CrUX p75)${c.reset}`);
        } else {
          console.log(`  ${c.dim}(No field data available — lab data only)${c.reset}`);
        }

        console.log();
        printMetricRow("lcp",  lab.lcp,  field?.lcp);
        printMetricRow("cls",  lab.cls,  field?.cls);
        printMetricRow("inp",  lab.inp,  field?.inp);
        printMetricRow("fcp",  lab.fcp,  field?.fcp);
        printMetricRow("ttfb", lab.ttfb, field?.ttfb);
        printMetricRow("tbt",  lab.tbt,  undefined);
        printMetricRow("si",   lab.si,   undefined);

        // Collect findings for ranking-signal metrics
        const lcpVal  = field?.lcp  ?? lab.lcp;
        const clsVal  = field?.cls  ?? lab.cls;
        const inpVal  = field?.inp  ?? lab.inp;

        if (lcpVal !== undefined) findings_cwv.lcp.push({ page: shortUrl, value: lcpVal, strategy });
        if (clsVal !== undefined) findings_cwv.cls.push({ page: shortUrl, value: clsVal, strategy });
        if (inpVal !== undefined) findings_cwv.inp.push({ page: shortUrl, value: inpVal, strategy });
        if (lab.fcp !== undefined) findings_cwv.fcp.push({ page: shortUrl, value: lab.fcp, strategy });
        if (lab.ttfb !== undefined) findings_cwv.ttfb.push({ page: shortUrl, value: lab.ttfb, strategy });

        // Opportunity hints
        const opportunities = Object.values(lhr?.audits || {})
          .filter((a) => a.details?.type === "opportunity" && a.score !== null && a.score < 0.9 && a.numericValue > 0)
          .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
          .slice(0, 4);

        if (opportunities.length > 0) {
          console.log(`\n  ${c.bold}Top Opportunities:${c.reset}`);
          for (const opp of opportunities) {
            const savings = opp.numericValue ? ` (save ~${Math.round(opp.numericValue)}ms)` : "";
            const scoreColor = opp.score < 0.5 ? c.red : c.yellow;
            console.log(`    ${scoreColor}●${c.reset} ${opp.title}${c.dim}${savings}${c.reset}`);
          }
        }

      } catch (e) {
        log(`  ${badge("HIGH")} CWV measurement failed: ${e.message}`, c.red);
        addFinding("Core Web Vitals", "HIGH", "cwv-fetch-error", `Cannot measure CWV for ${shortUrl} (${strategy}): ${e.message}`);
      }

      // Small delay between measurements
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // ── Aggregate findings ──────────────────────────────────────────────────────

  console.log(`\n${"─".repeat(60)}`);
  log("  RANKING SIGNAL SUMMARY (mobile, Google's primary signal)", c.bold);
  console.log(`${"─".repeat(60)}`);

  const rankingMetrics = ["lcp", "cls", "inp"];
  for (const key of rankingMetrics) {
    const vals = findings_cwv[key];
    if (vals.length === 0) continue;

    const poorPages  = vals.filter((v) => rateMetric(key, v.value).label === "POOR");
    const needsPages = vals.filter((v) => rateMetric(key, v.value).label === "NEEDS IMPROVEMENT");

    for (const v of vals) {
      const { color, label } = rateMetric(key, v.value);
      console.log(`  ${THRESHOLDS[key].label.padEnd(42)}  ${color}${formatValue(key, v.value).padStart(8)}  ${label}${c.reset}  ${c.dim}(${v.page})${c.reset}`);
    }

    if (poorPages.length > 0) {
      addFinding(
        "Core Web Vitals", "HIGH", `cwv-${key}-poor`,
        `${key.toUpperCase()} POOR on mobile: ${poorPages.map((v) => `${v.page} (${formatValue(key, v.value)})`).join(", ")} — Google ranking signal`
      );
    } else if (needsPages.length > 0) {
      addFinding(
        "Core Web Vitals", "MEDIUM", `cwv-${key}-needs-improvement`,
        `${key.toUpperCase()} needs improvement on mobile: ${needsPages.map((v) => `${v.page} (${formatValue(key, v.value)})`).join(", ")}`
      );
    }
  }

  // Secondary metrics (FCP, TTFB)
  for (const key of ["fcp", "ttfb"]) {
    const vals = findings_cwv[key];
    for (const v of vals) {
      const { label } = rateMetric(key, v.value);
      if (label === "POOR") {
        addFinding(
          "Core Web Vitals", "MEDIUM", `cwv-${key}-poor`,
          `${key.toUpperCase()} POOR on mobile: ${v.page} (${formatValue(key, v.value)})`
        );
      }
    }
  }
}

module.exports = { auditCoreWebVitals };
