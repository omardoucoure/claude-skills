---
name: check-ds-page
description: Validate a Figma page against HaHo design system rules. Checks every component instance for correct icon swaps, property configuration, spacing values, pattern usage, and visual quality. Use when user says "check page", "validate design", "audit page", "is this correct", or automatically after create-ds-page finishes. Returns PASS/FAIL with specific issues to fix.
---

# Check Design System Page

Lightweight checker engine. Component-specific rules live in `docs/ai/components/*.yaml` — this skill reads them and validates programmatically.

## Demo Mode

If the user's message contains `--demo`: read `~/.claude/skills/demo-assets/login/check-ds-page-output.md`, print section by section, do NOT call any Figma tools.

---

## When to run

- **Automatically** after every `create-ds-page` — MANDATORY
- **Manually** when user asks to check/validate/audit
- **Before delivery** — never present a page without checking

## Workflow

1. Get the page node ID from argument or context
2. Collect all nodes via `figma_execute` (instances, frames, texts with fills, parent fills, properties, icon swaps)
3. Run checks 1–7 below
4. Generate report. If FAIL → fix, re-run (max 3 iterations)

---

## CHECK 1: YAML Component Rules (CRITICAL — NOW COMPILED)

**Source of truth**: `figma-plugin/builders/compiled-checks.js` — auto-generated from `docs/ai/components/*.yaml` `figma_rules` sections.

Run `node scripts/compile-rules.js` to regenerate after any YAML change.

### Process (DETERMINISTIC — no AI interpretation)

Use `figma_execute` to load the compiled checks and run them against every instance on the page:

```javascript
// Embed compiled-checks.js content here (read from figma-plugin/builders/compiled-checks.js)

// Map Figma component names to COMPILED_CHECKS keys
const COMPONENT_MAP = {
  'Button': 'DSButton',
  'Inputs-Filled': 'DSTextField', 'Inputs-Lined': 'DSTextField',
  'Segmented Picker': 'DSSegmentedPicker',
  'Checkbox': 'DSCheckbox',
  'Top App Bar': 'DSTopAppBar',
  'List': 'DSListItem',
  'Progress-Circle': 'DSProgressCircle',
  'Layered Card': 'DSLayeredCard',
  'Overlapping Cards': 'DSOverlappingCards',
};

// Run all compiled checks
const instances = figma.currentPage.findAll(n => n.type === 'INSTANCE');
const failures = [];
for (const inst of instances) {
  const mc = await inst.getMainComponentAsync();
  const setName = mc?.parent?.name;
  const key = COMPONENT_MAP[setName];
  if (!key || !COMPILED_CHECKS[key]) continue;
  for (const rule of COMPILED_CHECKS[key]) {
    const passed = typeof rule.validate === 'function'
      ? await rule.validate(inst)
      : true;
    if (!passed) {
      failures.push({ node: inst.id, name: inst.name, rule: rule.id, severity: rule.severity, message: rule.fail_message });
    }
  }
}
return failures;
```

This replaces the old process of reading YAMLs and interpreting prose rules. The compiled checks are executable JS functions generated from the same YAML source that the builders use — they cannot diverge.

### Additionally check:
4. Check all TEXT properties — FAIL if still default ("Button", "Label", "Lorem ipsum")
5. Check all INSTANCE_SWAP properties — FAIL if generic icon where context needs specific one

---

## CHECK 2: Color Contrast (CRITICAL)

Two sub-checks:

### 2a: Component-Parent Background
- Read node fill color → walk parent tree → find nearest card (cornerRadius >= 16 with solid fill)
- FAIL if same color (rgb 5 tolerance per channel)
- Fix: read component YAML `figma_instance_rules` for correct background

### 2b: Foreground-Background
- For each component with solid fill: find child icons/text, compare fills
- **Use IMMEDIATE parent**, not grandparent (walk inside-out)
- Dark bg (r < 100) needs light foreground (r > 200), and vice versa
- FAIL if child fill matches container fill (rgb 30 tolerance)
- Also FAIL: empty icon containers, duplicate leading icons in lists, same icon on different-label buttons

---

## CHECK 3: Spacing Tokens (IMPORTANT)

Valid values: `0, 4, 8, 12, 16, 24, 32, 40, 48, 64`

For every frame with `layoutMode`:
- `itemSpacing` must be a valid token (negative only for Overlapping Cards/Layered Card)
- All paddings must be valid tokens
- Card containers (cornerRadius >= 24): padding should be 32
- Screen frame (393×852): padL=12, padR=12

---

## CHECK 4: Screen Layout (CRITICAL)

- **Top App Bar MANDATORY** as first child (exemption: splash screens)
- **NO Home Indicator** — system element, not a page component. Remove if found.
- **Page-Controls** must have `layoutAlign = "CENTER"`
- **Screen fills vertically** — at least one element with `layoutGrow = 1` or content naturally fills. FAIL if > 50px unused space.

---

## CHECK 5: DS Component Usage (NON-DISMISSABLE)

Every visual element must be a component INSTANCE. Raw FRAMEs replicating components are HARD FAILs.

### Detection (check `node.type` only, never `node.name`)

| If FRAME has... | Must be... |
|---|---|
| `itemSpacing < 0` + children with cornerRadius >= 24 | Overlapping Cards INSTANCE |
| `layoutMode = NONE` + 2-3 decreasing-width children | Layered Card INSTANCE |
| `cornerRadius >= 24` + solid fill + padding >= 16 + VERTICAL | Container Card INSTANCE (detached OK if properties match: r32, pad32, gap24) |

### Exemptions (valid raw frames)
- Screen frame (393×852)
- Spacer frames (no fills)
- Content wrapper frames grouping instances (rows, columns)
- Text-only frames
- Image placeholder frames

### Container Card validation
Detached Container Cards (type=FRAME) must have: `cornerRadius=32`, `padding=32`, `itemSpacing=24`, `layoutMode=VERTICAL`. Non-standard values → likely created from scratch → FAIL.

---

## CHECK 6: Pattern Correctness (IMPORTANT)

- Identify screen type from frame name/content
- Load pattern YAML from `~/.claude/skills/create-ds-page/references/patterns/`
- Overlapping cards OK: Alerts, Media, Camera, Shopping, Stats, Calendar, Navigation, Walkthrough, Splash, Checkout
- Overlapping cards NOT OK: Login, Sign Up, Feed, Chat, Profile, Settings, Search

---

## CHECK 7: Visual Validation (IMPORTANT)

Screenshot at 2x → analyze for: overflow/bleeding, text truncation, blank areas, wrong icons, contrast issues. Compare with HaHo reference.

---

## Report Format

```
## DS Page Check Report — [Page Name]

| Check | Status | Issues |
|-------|--------|--------|
| 1. YAML Component Rules | PASS/FAIL | N |
| 2. Color Contrast | PASS/FAIL | N |
| 3. Spacing Tokens | PASS/FAIL | N |
| 4. Screen Layout | PASS/FAIL | N |
| 5. DS Component Usage | PASS/FAIL | N |
| 6. Pattern Correctness | PASS/FAIL | N |
| 7. Visual Validation | PASS/FAIL | N |

### Issues
1. [Node ID] [Component] — [Problem] → [Fix]

### Result: PASS / FAIL (N total issues)
```

## Fix Loop

Fix all issues → re-run → repeat until PASS (max 3 iterations).
