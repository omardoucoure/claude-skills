/**
 * ASO Score computation with bar charts, grades, and top issues
 */

const { c, log, header, badge, getFindings } = require("./helpers");

// ─── Score computation ──────────────────────────────────────────────────────────

const DIMENSIONS = {
  "iOS Metadata": 25,
  "Android Metadata": 20,
  "Visual Assets": 20,
  "Ratings & Reviews": 15,
  "Locale Coverage": 20,
};

const DEDUCTIONS = {
  CRITICAL: 5,
  HIGH: 3,
  MEDIUM: 1.5,
  LOW: 0.5,
};

function computeASOScore() {
  header("ASO SCORE");

  const findings = getFindings();

  // Calculate per-dimension scores
  const scores = {};
  for (const [dim, maxPts] of Object.entries(DIMENSIONS)) {
    const dimFindings = findings.filter((f) => f.section === dim);
    let deduction = 0;
    for (const f of dimFindings) {
      deduction += DEDUCTIONS[f.severity] || 0;
    }
    scores[dim] = {
      max: maxPts,
      deducted: Math.min(deduction, maxPts),
      score: Math.max(0, maxPts - deduction),
      findings: dimFindings,
    };
  }

  const totalScore = Object.values(scores).reduce((s, d) => s + d.score, 0);
  const totalMax = Object.values(scores).reduce((s, d) => s + d.max, 0);

  // Grade
  let grade, gradeColor;
  if (totalScore >= 90) { grade = "A"; gradeColor = c.green; }
  else if (totalScore >= 80) { grade = "B"; gradeColor = c.green; }
  else if (totalScore >= 70) { grade = "C"; gradeColor = c.yellow; }
  else if (totalScore >= 60) { grade = "D"; gradeColor = c.yellow; }
  else { grade = "F"; gradeColor = c.red; }

  // Big score display
  console.log(`\n  ${c.bold}${gradeColor}  SCORE: ${totalScore.toFixed(0)} / ${totalMax}  (${grade})${c.reset}\n`);

  // Per-dimension bar chart
  const barWidth = 30;

  for (const [dim, data] of Object.entries(scores)) {
    const pct = data.score / data.max;
    const filled = Math.round(pct * barWidth);
    const empty = barWidth - filled;
    const barColor = pct >= 0.8 ? c.green : pct >= 0.6 ? c.yellow : c.red;

    const bar = barColor + "\u2588".repeat(filled) + c.dim + "\u2591".repeat(empty) + c.reset;
    const label = `${dim.padEnd(18)}`;
    const scoreStr = `${data.score.toFixed(0)}/${data.max}`.padStart(6);
    const issueCount = data.findings.length > 0 ? ` (${data.findings.length} issue${data.findings.length > 1 ? "s" : ""})` : "";

    console.log(`  ${label} ${bar} ${scoreStr}${c.dim}${issueCount}${c.reset}`);
  }

  // Top 5 issues to fix
  const sorted = [...findings].sort((a, b) => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
  });

  const top5 = sorted.slice(0, 5);
  if (top5.length > 0) {
    console.log(`\n  ${c.bold}Top Issues to Fix:${c.reset}\n`);
    for (let i = 0; i < top5.length; i++) {
      const f = top5[i];
      console.log(`  ${i + 1}. ${badge(f.severity)} ${f.message}`);
      console.log(`     ${c.dim}Section: ${f.section} | Check: ${f.check}${c.reset}`);
    }
  }

  // Full findings summary
  const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const f of findings) bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;

  console.log(`\n  ${c.bold}All Findings:${c.reset} ${findings.length} total`);
  console.log(`    ${c.bgRed}${c.bold} CRITICAL ${c.reset} ${bySeverity.CRITICAL}  ${c.red}${c.bold}HIGH${c.reset} ${bySeverity.HIGH}  ${c.yellow}MEDIUM${c.reset} ${bySeverity.MEDIUM}  ${c.dim}LOW${c.reset} ${bySeverity.LOW}`);

  // App config summary for Claude
  console.log(`\n  ${c.bold}App Keywords for Optimization:${c.reset}`);
  console.log(`  ${c.dim}(Use these in metadata recommendations)${c.reset}`);

  return { totalScore, grade, scores, findings };
}

module.exports = { computeASOScore };
