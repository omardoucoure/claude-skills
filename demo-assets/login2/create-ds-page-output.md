<!-- SECTION: step1 -->
## Step 1: Prepare (BLOCKING)

### 1.1 Screen type identified: **login (variant 2 — social first)**

### 1.2 Reading the pattern YAML
Reading `~/.claude/skills/create-ds-page/references/patterns/login.yaml`...
Pattern loaded. 17 login/signup layouts available.
Selected layout: `social_first_form_below` (nodeId: `85:55766`)

### 1.3 Reading the component YAMLs
- `DSButton.yaml` — filledC (dark) for social buttons, filledA for CTA
- `DSTextField.yaml` — filled variant, label on top + value below, background contrast rules
- `DSCheckbox.yaml` — stroke align = INSIDE
- `DSCard.yaml` — container padding, surfaceNeutral2 background
- `DSTopAppBar.yaml` — Status Bar style (time, signal, battery)

### 1.4 Extracted components and rules

**Components to use:**
- `Status Bar` — iOS status bar (8:30, signal, wifi, battery)
- `DSButton` x 2 — "Continue with Google" + "Continue with Facebook" (filledC, dark, full width, brand icons)
- `DSCard` — form card (surfaceNeutral2), radius 32, padding 32
- `DSTextField` x 2 — Email (mailOpen icon, filled) + Password (eyeClosed, isSecure, filled)
- `DSCheckbox` — "Remember me"
- `DSButton` x 2 — CTA "Let's Roll!" filledA + "Forgot Password?" text

**Key rules from YAMLs:**
1. Social buttons are PRIMARY — placed at top before the form, full-width dark (filledC)
2. Welcome text centered above social buttons, no card wrapper
3. Form card is SECONDARY — "Or better yet..." heading (no logo) with email/password below
4. Input background must be `surfaceNeutral05` inside `surfaceNeutral2` card
5. Checkbox strokeAlign must be INSIDE (YAML figma_instance_rules)
6. filledC buttons need light icons (textNeutral05) — dark icons invisible on dark bg

<!-- SECTION: step2-frame -->
## Step 2: Build

Creating the screen frame (393 x 852, surfaceNeutral05 background)...

<!-- SECTION: step2-statusbar -->
Adding **Status Bar** — iOS status bar with time, signal, wifi, battery indicators...

<!-- SECTION: step2-social -->
Adding **Social Section** (no card wrapper, centered):
- Welcome text: "Welcome back! Log in to continue enjoying the Haho benefits." (18px, centered)
- "Continue with Google" — filledC (dark), full width, Google icon
- "Continue with Facebook" — filledC (dark), full width, Facebook icon

<!-- SECTION: step2-formcard -->
Adding **Form Card** (surfaceNeutral2, radius 32, padding 32):
- "Or better yet..." heading (h4)
- Email field: filled, label "Your Email", value "omar@omardoucoure.com", `mailOpen` trailing icon
- Password field: filled, label "Your Password", value dots, `eyeClosed` trailing icon
- Remember me checkbox + "Forgot Password?" text button
- CTA: "Let's Roll!", filledA, big, arrow right icon, full width
- "Don't have an account? **Sign Up**" text link

<!-- SECTION: step3 -->
## Step 3: Check

Running `check-ds-page`...

| Check | Status | Issues |
|-------|--------|--------|
| 1. YAML Component Rules | PASS | All figma_instance_rules satisfied (checkbox strokeAlign=INSIDE, input icons, filledC light icons) |
| 2. Color Contrast | PASS | Inputs surfaceNeutral05 inside surfaceNeutral2 card, light text/icons on dark buttons |
| 3. Spacing Tokens | PASS | All spacing uses DS tokens (xl=32, lg=24, md=16) |
| 4. Screen Layout | PASS | Status Bar first child, no Home Indicator |
| 5. DS Component Usage | PASS | All elements are real component instances, form card from Container Card |
| 6. Pattern Correctness | PASS | Login pattern, social-first variant |
| 7. Visual Validation | PASS | No bleeds, truncation, or overlap artifacts |

### Issues to fix: 0
### Result: PASS — All 7 checks passed

Login 2 created successfully.
