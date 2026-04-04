---
name: connect-revenuecat
description: Manage RevenueCat subscriptions, customers, revenue metrics, and troubleshoot purchase failures. Use when user says "check subscriptions", "RevenueCat", "revenue", "MRR", "subscribers", "purchase failed", "payment issue", "subscription status", "churn", "refund", "customer lookup", or asks about in-app purchase health.
---

# RevenueCat Manager

## Overview

Query and manage RevenueCat subscription data for FUT Evolution via the REST API v2. Use for revenue monitoring, customer debugging, subscription health checks, and purchase failure investigation.

## Authentication

- API key: `$REVENUECAT_SECRET_KEY` (stored in `~/.zshrc`)
- Always `source ~/.zshrc` before making API calls
- Base URL: `https://api.revenuecat.com/v2`
- Header: `Authorization: Bearer $REVENUECAT_SECRET_KEY`

## Project Configuration

- **Project ID**: `proj002f30fd`
- **Project Name**: FUT Evolution
- **Bundle ID**: `com.futevolution.app` (iOS + Android)
- **Entitlement**: `FUT Evolution Pro` (ID: `entl5c19ce5481`)
- **Offering**: `default` (ID: `ofrngbddaeb6386`)

### Apps
| App | ID | Platform |
|-----|----|----------|
| App Store | `app730a080dd6` | iOS |
| Play Store | `app796bc9691e` | Android |
| Test Store | `app524a5634cb` | Sandbox |

### Products
| Product | Store Identifier | Type |
|---------|-----------------|------|
| Monthly (iOS) | `monthly` | subscription (P1M) |
| Monthly (Android) | `monthly:monthly-base` | subscription |
| Lifetime (iOS) | `lifetime` | one_time |

## API Reference

All endpoints use v2 base: `https://api.revenuecat.com/v2/projects/proj002f30fd`

### Metrics Overview
```bash
curl -s "$BASE/metrics/overview" -H "Authorization: Bearer $REVENUECAT_SECRET_KEY"
```
Returns: active_trials, active_subscriptions, MRR, revenue (28d), new_customers (28d), active_users (28d), churned_subscriptions, refund_rate.

### List Customers
```bash
# List all (paginated, 20 per page)
curl -s "$BASE/customers?limit=20" -H "Authorization: Bearer $REVENUECAT_SECRET_KEY"

# Pagination: use next_page token
curl -s "$BASE/customers?limit=20&starting_after=CURSOR" -H "Authorization: Bearer $REVENUECAT_SECRET_KEY"
```
Each customer has: `id`, `first_seen_at`, `last_seen_at`, `last_seen_country`, `last_seen_platform`, `last_seen_app_version`.

### Customer Detail
```bash
# Full customer info with active entitlements
curl -s "$BASE/customers/CUSTOMER_ID" -H "Authorization: Bearer $REVENUECAT_SECRET_KEY"
```

### Customer Subscriptions
```bash
curl -s "$BASE/customers/CUSTOMER_ID/subscriptions" -H "Authorization: Bearer $REVENUECAT_SECRET_KEY"
```
Returns subscription history: product_id, store, status, purchase dates, expiration, auto_renew_status, environment (sandbox vs production).

### Customer Purchases
```bash
curl -s "$BASE/customers/CUSTOMER_ID/purchases" -H "Authorization: Bearer $REVENUECAT_SECRET_KEY"
```
Returns all purchase events including failed attempts, refunds, renewals.

### Customer Active Entitlements
```bash
curl -s "$BASE/customers/CUSTOMER_ID/active_entitlements" -H "Authorization: Bearer $REVENUECAT_SECRET_KEY"
```

### List Products
```bash
curl -s "$BASE/products" -H "Authorization: Bearer $REVENUECAT_SECRET_KEY"
```

### List Entitlements
```bash
curl -s "$BASE/entitlements" -H "Authorization: Bearer $REVENUECAT_SECRET_KEY"
```

### List Offerings
```bash
curl -s "$BASE/offerings" -H "Authorization: Bearer $REVENUECAT_SECRET_KEY"
```

### Delete Customer (use with caution)
```bash
curl -s -X DELETE "$BASE/customers/CUSTOMER_ID" -H "Authorization: Bearer $REVENUECAT_SECRET_KEY"
```

### Grant Promotional Entitlement
```bash
curl -s -X POST "$BASE/customers/CUSTOMER_ID/entitlements/ENTITLEMENT_ID/promotional" \
  -H "Authorization: Bearer $REVENUECAT_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"duration": "P1M"}'
```
Durations: P1D, P3D, P1W, P2W, P1M, P2M, P3M, P6M, P1Y, lifetime.

## Common Tasks

### 1. Revenue Dashboard
Run metrics overview, count active subscribers, calculate conversion rate from total customers.

### 2. Investigate Purchase Failures
When PostHog shows users tapping purchase but no `subscription_started`:
1. Cross-reference PostHog distinct_id with RevenueCat customer IDs
2. Check customer's subscriptions and purchases for errors
3. Look for sandbox vs production environment mismatches
4. Check if customer has active entitlements (might have subscribed via different ID)

### 3. Find Active Subscribers
Paginate through customers, check each for active_entitlements. Filter by country/platform as needed.

### 4. Churn Analysis
Compare customers who had subscriptions in the past vs currently active. Check auto_renew_status for at-risk subscribers.

### 5. Cross-Platform Debugging
Customer IDs differ between PostHog (UUID-based) and RevenueCat ($RCAnonymousID). To correlate:
- Check `last_seen_country`, `last_seen_platform`, `last_seen_app_version` timestamps
- Match by time proximity and platform

## Important Notes

- **NEVER delete customers** or grant entitlements without explicit user permission
- **Always ask** before any write operation (grants, deletions)
- Customer IDs contain `$` characters — URL-encode when needed in curl
- Pagination: use `starting_after` parameter with the last item's ID from previous page
- Timestamps are Unix milliseconds — divide by 1000 for seconds
- The v1 API is incompatible with this key — always use v2 endpoints
