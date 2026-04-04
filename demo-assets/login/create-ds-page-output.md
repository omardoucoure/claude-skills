<!-- SECTION: step1 -->
## Step 1: Prepare (BLOCKING)

### 1.1 Screen type identified: **login**

### 1.2 Reading the pattern YAML
Reading `~/.claude/skills/create-ds-page/references/patterns/login.yaml`...
Pattern loaded. 17 login/signup layouts available.
Selected layout: `segmented_pills_form_dark_social` (nodeId: `85:55825`)

### 1.3 Reading the component YAMLs
- `DSSegmentedPicker.yaml` — pills variant, picker bg = surfaceNeutral05 (lighter than card)
- `DSTextField.yaml` — filled variant, label on top + value below, background contrast rules
- `DSCheckbox.yaml` — stroke align = INSIDE
- `DSButton.yaml` — filledA, neutral, text styles + icon rules
- `DSCard.yaml` — container padding, background tokens
- `DSTopAppBar.yaml` — Status Bar style (time, signal, battery)

### 1.4 Extracted components and rules

**Components to use:**
- `Status Bar` — iOS status bar (8:30, signal, wifi, battery)
- `DSSegmentedPicker` — Pills style, 2 items ["Log In", "Sign Up"], surfaceNeutral05 bg
- `DSTextField` x 2 — Email (mailOpen icon, filled) + Password (eyeClosed, isSecure, filled)
- `DSCheckbox` — "Remember me"
- `DSButton` x 5 — CTA filledA, Forgot Password text, 3 social neutral
- `DSCard` x 2 — Form card (surfaceNeutral2), Social card (surfacePrimary100)

**Key rules from YAMLs:**
1. Input background must be `surfaceNeutral05` inside `surfaceNeutral2` card (contrast rule)
2. Picker container bg = `surfaceNeutral05` (lighter than card), inactive segments match picker bg
3. Social buttons use icon-only (no text labels) — googleCircle, facebookTag, x
4. Password field requires `isSecure: true` (dots display)
5. Checkbox strokeAlign must be INSIDE (YAML figma_instance_rules)
6. Social card uses `surfacePrimary100` (rgb 70,90,84)

<!-- SECTION: step2-frame -->
## Step 2: Build

Creating the screen frame (393 x 852, surfaceNeutral05 background)...

<!-- SECTION: step2-statusbar -->
Adding **Status Bar** — iOS status bar with time, signal, wifi, battery indicators...

<!-- SECTION: step2-formcard -->
Adding **Form Card** (surfaceNeutral2, radius 32, padding 32):
- Segmented Picker: Pills, ["Log In", "Sign Up"], Log In active
- Welcome text: "Welcome back!" (caption)
- Title: "Login" (h2)
- Email field: filled, label "Your Email", value "omar@omardoucoure.com", `mailOpen` trailing icon
- Password field: filled, label "Your Password", value dots, `eyeClosed` trailing icon
- Remember me checkbox + "Forgot Password?" text button
- CTA: "Let's Roll!", filledA, big, arrow right icon, full width
- Footer: "Don't have an account? **Sign Up**"

<!-- SECTION: step2-socialcard -->
Adding **Social Card** (surfacePrimary100, dark green, radius 32, padding 32):
- "Continue with:" heading (h4, white text)
- 3 icon buttons row: Google, Facebook, X (neutral style, brand icons)

<!-- SECTION: step3 -->
## Step 3: Check

Running `check-ds-page`...

| Check | Status | Issues |
|-------|--------|--------|
| 1. YAML Component Rules | PASS | All figma_instance_rules satisfied (checkbox strokeAlign=INSIDE, picker bg contrast, input icons) |
| 2. Color Contrast | PASS | Inputs surfaceNeutral05 inside surfaceNeutral2 card, light text on dark social card |
| 3. Spacing Tokens | PASS | All spacing uses DS tokens (xl=32, lg=24, sm=12) |
| 4. Screen Layout | PASS | Status Bar first child, no Home Indicator |
| 5. DS Component Usage | PASS | All elements are real component instances, cards from Container Card |
| 6. Pattern Correctness | PASS | Login pattern, segmented pills + form + dark social |
| 7. Visual Validation | PASS | No bleeds, truncation, or overlap artifacts |

### Issues to fix: 0
### Result: PASS — All 7 checks passed

Login 1 created successfully.
