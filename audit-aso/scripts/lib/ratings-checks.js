/**
 * Ratings & reviews checks (12-14)
 */

const { c, log, header, badge, addFinding, exec } = require("./helpers");
const { GPS_SCRIPT } = require("../apps");

// ─── Check 12: Average Rating ───────────────────────────────────────────────────

async function auditRating(appConfig) {
  header("CHECK 12: Average Rating");

  const packageName = appConfig.packageName;
  const statsRaw = exec(`python3 ${GPS_SCRIPT} get-app-stats ${packageName}`, { silent: true });

  let rating = null;
  let reviewCount = null;
  let installs = null;

  if (statsRaw) {
    log(`\n  App Stats:`, c.dim);
    statsRaw.split("\n").slice(0, 15).forEach((line) => {
      console.log(`    ${c.dim}${line}${c.reset}`);
    });

    const ratingMatch = statsRaw.match(/Rating:\s*([\d.]+)/i) ||
                        statsRaw.match(/Score:\s*([\d.]+)/i);
    if (ratingMatch) rating = parseFloat(ratingMatch[1]);

    const reviewMatch = statsRaw.match(/Reviews?:\s*([\d,]+)/i) ||
                        statsRaw.match(/Ratings?:\s*([\d,]+)/i);
    if (reviewMatch) reviewCount = parseInt(reviewMatch[1].replace(/,/g, ""));

    const installMatch = statsRaw.match(/Installs?:\s*([\d,+]+)/i) ||
                         statsRaw.match(/Downloads?:\s*([\d,+]+)/i);
    if (installMatch) installs = installMatch[1];
  }

  if (!statsRaw) {
    log(`\n  ${badge("INFO")} Could not fetch app stats from Google Play`);
    log(`  App may not be published yet`);
    addFinding("Ratings & Reviews", "MEDIUM", "Rating", "Cannot fetch ratings — app may not be live yet");
    return { rating: null, reviewCount: null, installs: null };
  }

  if (rating === null) {
    log(`\n  ${badge("MEDIUM")} No rating available`);
    addFinding("Ratings & Reviews", "MEDIUM", "Rating", "No rating yet — new app needs ratings strategy");
    return { rating: null, reviewCount, installs };
  }

  log(`\n  Rating: ${rating}/5.0`, c.bold);
  if (reviewCount) log(`  Reviews: ${reviewCount}`);
  if (installs) log(`  Installs: ${installs}`);

  if (rating < 3.0) {
    addFinding("Ratings & Reviews", "CRITICAL", "Rating", `Rating is ${rating}/5.0 — below 3.0 severely hurts search ranking and conversion`);
  } else if (rating < 4.0) {
    addFinding("Ratings & Reviews", "HIGH", "Rating", `Rating is ${rating}/5.0 — below 4.0 impacts search ranking`);
  } else if (rating < 4.5) {
    addFinding("Ratings & Reviews", "LOW", "Rating", `Rating is ${rating}/5.0 — good but aim for 4.5+`);
  } else {
    log(`  ${badge("OK")} Excellent rating`);
  }

  return { rating, reviewCount, installs };
}

// ─── Check 13: Review Count ─────────────────────────────────────────────────────

async function auditReviewCount(appConfig, ratingData) {
  header("CHECK 13: Review Count");

  const reviewCount = ratingData?.reviewCount;

  if (reviewCount === null || reviewCount === undefined) {
    log(`\n  ${badge("MEDIUM")} No reviews yet`);
    addFinding("Ratings & Reviews", "MEDIUM", "Review Count", "No reviews — implement ratings prompt after first successful user action (win moment)");
    return;
  }

  log(`\n  Total reviews: ${reviewCount}`, c.bold);

  if (reviewCount === 0) {
    addFinding("Ratings & Reviews", "MEDIUM", "Review Count", "Zero reviews — implement StoreKit ratings prompt at win moment");
  } else if (reviewCount < 10) {
    addFinding("Ratings & Reviews", "LOW", "Review Count", `Only ${reviewCount} reviews — social proof is weak, accelerate ratings collection`);
  } else if (reviewCount >= 50) {
    log(`  ${badge("OK")} Good review volume (${reviewCount})`);
  }
}

// ─── Check 14: Recent Review Sentiment ──────────────────────────────────────────

async function auditReviewSentiment(appConfig) {
  header("CHECK 14: Recent Review Sentiment");

  const packageName = appConfig.packageName;
  const reviewsRaw = exec(
    `python3 ${GPS_SCRIPT} get-reviews ${packageName} 20 --sort NEWEST`,
    { silent: true }
  );

  if (!reviewsRaw) {
    log(`\n  ${badge("INFO")} No reviews available for sentiment analysis`);
    return { sentiment: null };
  }

  log(`\n  Recent Reviews:`, c.dim);
  reviewsRaw.split("\n").slice(0, 30).forEach((line) => {
    console.log(`    ${c.dim}${line}${c.reset}`);
  });

  // Parse star ratings from review output
  const starMatches = reviewsRaw.match(/(\d)\s*(?:star|★|⭐)/gi) || [];
  const scores = starMatches.map((m) => parseInt(m.match(/(\d)/)[1]));

  // Also try parsing "Score: X" or "Rating: X" patterns
  const scoreMatches = reviewsRaw.match(/(?:Score|Rating):\s*(\d)/gi) || [];
  scoreMatches.forEach((m) => {
    const num = parseInt(m.match(/(\d)/)[1]);
    if (num >= 1 && num <= 5) scores.push(num);
  });

  if (scores.length === 0) {
    log(`\n  Could not parse review scores from output`);
    return { sentiment: "unknown" };
  }

  const negative = scores.filter((s) => s <= 2).length;
  const positive = scores.filter((s) => s >= 4).length;
  const total = scores.length;
  const negPct = Math.round((negative / total) * 100);
  const posPct = Math.round((positive / total) * 100);

  log(`\n  Sentiment (${total} recent reviews):`);
  log(`    Positive (4-5★): ${positive} (${posPct}%)`);
  log(`    Negative (1-2★): ${negative} (${negPct}%)`);

  if (negPct > 50) {
    addFinding("Ratings & Reviews", "HIGH", "Review Sentiment", `${negPct}% of recent reviews are negative (1-2★) — address common complaints urgently`);
  } else if (negPct > 30) {
    addFinding("Ratings & Reviews", "MEDIUM", "Review Sentiment", `${negPct}% negative reviews — review common complaints for improvement`);
  } else {
    log(`  ${badge("OK")} Healthy sentiment`);
  }

  return { sentiment: negPct > 50 ? "negative" : negPct > 30 ? "mixed" : "positive" };
}

module.exports = {
  auditRating,
  auditReviewCount,
  auditReviewSentiment,
};
