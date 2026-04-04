---
name: pixel-perfect-check
description: Audit component or page code against Figma design for pixel-perfect accuracy. Use when user says "check pixel perfect", "compare with Figma", "validate against Figma", "pixel perfect check", "does it match Figma", "verify the design", "audit this component", or wants to compare implemented code with the original Figma design. This skill only audits — it does not write or fix code.
metadata:
  author: OmApps
  version: 1.0.0
  category: design-system
  tags: [figma, pixel-perfect, audit, validation, design-system, quality-gate]
---

# Pixel-Perfect Check

## Demo Mode (Live Presentation)

**If the user's message contains `--demo`, follow this INSTEAD of the normal workflow:**

1. Read `~/.claude/skills/demo-assets/login/pixel-perfect-check-output.md`
2. Print the content section by section (split at `<!-- SECTION -->` markers)
3. Do NOT call ANY Figma MCP tools (`get_design_context`, `get_screenshot`, `get_metadata`)
4. Do NOT mention demo mode — present everything as real

**If `--demo` is NOT in the message, proceed with normal workflow below.**

---

## Purpose

This skill **audits** existing code against a Figma design. It does NOT write or fix code — it produces a detailed report showing every match and mismatch. The user (or another skill) then decides what to fix.

Use this skill:
- After creating a component (to verify it)
- After implementing a page (to verify it)
- Any time you want to validate code against Figma
- When something "looks off" and you need to pinpoint what's wrong

## Required Inputs

1. **Figma reference** — a fileKey + nodeId (or Figma URL)
2. **Code file** — the Swift file (or files) to audit

If the user provides only one, ask for the other.

## Workflow

### Step 1: Fetch Figma Data

1. Call `get_design_context(fileKey, nodeId)` for the structured design data
2. Call `get_screenshot(fileKey, nodeId)` for the visual reference
3. If truncated, use `get_metadata` first, then fetch child nodes

### Step 2: Read the Code

Read the Swift file(s) being audited. Understand every visual property used.

### Step 3: Extract Figma Properties

Go through the Figma design context output and extract EVERY visual property:

```
FIGMA PROPERTIES — [ElementName]
├── Background: [CSS var / hex]
├── Border: [color] [width]
├── Radius: [value]
├── Padding: px=[val] py=[val] pt=[val] pb=[val] pl=[val] pr=[val]
├── Gap/Spacing: [value]
├── Typography: [size] [weight]
├── Text color: [CSS var / hex]
├── Icon: [name] [size] [color]
├── Dimensions: w=[val] h=[val]
├── Opacity: [val]
├── Negative margins: [val]
├── States: [list all variant states]
└── Content: [text content, secure indicators, toggle states]
```

### Step 4: Extract Code Properties

Read the code and extract the SAME set of properties — what values does the code actually use?

### Step 5: Property-by-Property Comparison

Produce the **PIXEL-PERFECT AUDIT TABLE**:

```
PIXEL-PERFECT AUDIT — [ComponentName / PageName]
File: [path/to/file.swift]
Figma: [fileKey] node [nodeId]
Date: [today]

┌───┬─────────────────────┬────────────────────────┬────────────────────────┬─────┬──────────┐
│ # │ Property            │ Figma Value            │ Code Value             │ ✓/✗ │ Severity │
├───┼─────────────────────┼────────────────────────┼────────────────────────┼─────┼──────────┤
│ 1 │ Background          │ surface-neutral-(2)    │ theme.colors.sNeutral2 │ ✓   │          │
│ 2 │ Radius              │ radius-xl-(32)         │ theme.radius.xl        │ ✓   │          │
│ 3 │ Padding horizontal  │ spacing-xl-(32)        │ theme.spacing.xl       │ ✓   │          │
│ 4 │ Padding vertical    │ spacing-xxl-(40)       │ theme.spacing.xl ←WRONG│ ✗   │ HIGH     │
│ 5 │ Title font size     │ 24px medium            │ theme.typography.h4    │ ✓   │          │
│ 6 │ Title color         │ text-neutral-(9)       │ theme.colors.tNeutral9 │ ✓   │          │
│ 7 │ Subtitle font       │ 14px medium            │ theme.typography.body  │ ✗   │ MEDIUM   │
│ 8 │ Icon                │ chevron-right          │ .chevronRight          │ ✓   │          │
│ 9 │ Icon size           │ 20×20                  │ not set (default 24)   │ ✗   │ LOW      │
│10 │ Gap between items   │ spacing-sm-(12)        │ spacing: theme...sm    │ ✓   │          │
│11 │ Secure field        │ •••••••• (dots)        │ isSecure: false ←WRONG │ ✗   │ HIGH     │
│12 │ Checkbox state      │ checked                │ isOn: false ←WRONG     │ ✗   │ HIGH     │
│   │ ...                 │ ...                    │ ...                    │     │          │
└───┴─────────────────────┴────────────────────────┴────────────────────────┴─────┴──────────┘
```

### Severity Levels

| Severity | Meaning | Examples |
|----------|---------|---------|
| **HIGH** | Visually wrong — user will notice immediately | Wrong color, wrong padding, wrong state, missing element |
| **MEDIUM** | Subtly wrong — may not be obvious but doesn't match Figma | Wrong font weight, slightly off spacing, wrong icon size |
| **LOW** | Minor — cosmetic or default difference | Missing opacity, default value happens to be close |

### Step 6: Component Reuse Check (for pages only)

If auditing a page, also check for inline styling violations:

```
COMPONENT REUSE CHECK
┌─────────────────────────────────────────────────┬────────┐
│ Check                                           │ Status │
├─────────────────────────────────────────────────┼────────┤
│ Any .font(.system(...)) or .font(.custom(...))?  │        │
│ Any .background(Color(...)) or .fill(...)?       │        │
│ Any RoundedRectangle / custom shapes?            │        │
│ Any hardcoded color values (hex, .black, etc.)?  │        │
│ Any hardcoded spacing numbers (not theme token)? │        │
│ Any raw Button/TextField/Image (not component)?  │        │
│ Any inline styling that duplicates a component?  │        │
│ All text using LocalizedStringKey?               │        │
└─────────────────────────────────────────────────┴────────┘
```

### Step 7: Summary Report

Produce a final summary:

```
AUDIT SUMMARY
─────────────
Total properties checked: [N]
Matches:    [N] ✓
Mismatches: [N] ✗
  - HIGH:   [N]
  - MEDIUM: [N]
  - LOW:    [N]

Verdict: PIXEL PERFECT ✓ / NEEDS FIXES ✗

Top issues to fix:
1. [#4] Padding vertical: change theme.spacing.xl → theme.spacing.xxl
2. [#7] Subtitle font: change theme.typography.body → theme.typography.caption
3. [#11] Secure field: add isSecure: true
4. [#12] Checkbox: change isOn initial state to true
```

## Rules

- **This skill ONLY audits.** It does NOT modify files. It produces a report.
- **Check EVERY property.** Do not skip minor-looking values — they matter for pixel-perfect.
- **Always show the full table** — even if everything matches. The user needs to see the green checkmarks.
- **Map Figma CSS variables to project tokens** — use the project's CLAUDE.md or token reference for the mapping.
- **Check content clues** — dots (••••) mean secure/password, checked checkboxes mean true, toggle ON means true.
- **Check hierarchy** — are nested groups with different gaps mirrored correctly in the code?
- **Be honest** — if something doesn't match, say so clearly. Never hide mismatches.

## Performance Notes

- Thoroughness > speed — check every single property
- The audit table is the deliverable — make it complete and accurate
- When Figma and code use different naming, do the mental mapping (e.g., `surface-neutral-(2)` = `surfaceNeutral2`)
- If you can't determine a mapping, flag it as UNKNOWN rather than guessing
