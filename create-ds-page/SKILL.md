---
name: create-ds-page
description: Create a mobile app screen/page in Figma using the HaHo design system components. Use when user says "create page", "design screen", "build this screen", "new page in Figma", "design the login", "create onboarding", or wants to create a full mobile screen from a description or PRD. Do NOT use for creating individual reusable components — use create-ds-component for that.
---

# Create Design System Page

Build mobile app screens in Figma by composing HaHo DS component instances following proven layout patterns.

## Demo Mode (Live Presentation) — PARALLEL AGENTS

**If the user's message contains `--demo`, follow this INSTEAD of the normal workflow.**

Each page is built by a **separate parallel Agent** that runs the full create-ds-page workflow independently (prepare → build → screenshot → check). This showcases the real process while keeping it fast through parallelism.

### Supported demo page types

| Page type | Keywords | Assets directory |
|-----------|----------|-----------------|
| Login 1 | "login", "sign in", "log in" | `~/.claude/skills/demo-assets/login/` |
| Login 2 | (auto — second login request) | `~/.claude/skills/demo-assets/login2/` |
| Onboarding | "onboarding", "walkthrough", "welcome", "intro" | `~/.claude/skills/demo-assets/onboarding/` |

### Multiple login pages rule

When the user asks for **two login pages** (e.g., "create two login pages", "login 1 and login 2"):
- First login → use `login/` assets (pills + form + social card variant)
- Second login → use `login2/` assets (social-first + form below variant)
- Name them "Login 1 — Demo" and "Login 2 — Demo"

### Demo workflow — NARRATE LIVE, BUILD IN PARALLEL

The audience watches the console. Agent output is NOT visible to them (only the final return is shown). So ALL narration must happen in the **main conversation**, and agents are used ONLY for Figma execution.

**Step 1 — Read assets** (main conversation):
1. Parse the user's request to determine how many pages and which types
2. Read ALL `create-ds-page-output.md` files in parallel (one per page)
3. Read ALL `build.js` files in parallel (one per page)

**Step 2 — Print ALL narration live** (main conversation, BEFORE any agents):
For EACH page, print the narration from its `create-ds-page-output.md` file:
1. Print the FULL "step1" section VERBATIM (## Step 1: Prepare + all subsections)
2. Print the FULL "step2-*" sections VERBATIM (## Step 2: Build + all subsections)

Use a `# Login 1 — Demo` / `# Login 2 — Demo` header before each page's narration to separate them.

**CRITICAL: Copy the text WORD FOR WORD from the markdown file. Do NOT summarize, rephrase, or skip any line. The audience needs to see every component, every rule, every detail.**

Strip the `<!-- SECTION: ... -->` HTML comments — only print the visible markdown content.

**Step 3 — Launch parallel build agents** (one Agent per page, ALL in a single message):
Each agent receives ONLY the build task — no narration:

```
Build a demo DS page in Figma.

Page: {PAGE_NAME}

Execute this code via mcp__figma-console__figma_execute (load it via ToolSearch first, timeout: 30000):

{PASTE THE FULL build.js CONTENT HERE}

After execution, capture a screenshot via mcp__figma-console__figma_capture_screenshot (load via ToolSearch first) using the node ID returned. Scale: 2.

Return the node ID and confirm screenshot was taken.
```

**Step 4 — Print check results + screenshots** (main conversation, after agents return):
For EACH page:
1. Print the "step3" section VERBATIM from its `create-ds-page-output.md` (the check table)
2. Note the node ID returned by the agent

End with: "Both pages built and validated. All checks PASS."

### Speed rules

1. Narration prints FAST in the main conversation — no waiting for Figma
2. Build agents run in PARALLEL — one per page, launched in a SINGLE message
3. Agents do ONLY: figma_execute + figma_capture_screenshot — nothing else
4. Check results print in main conversation AFTER agents return

### Timing budget

| Phase | Target |
|-------|--------|
| Read assets + print narration | ~5-10s |
| Parallel build agents | ~30-45s |
| Print check results | ~2s |
| **Total** | **~40-55s** |

**If `--demo` is NOT in the message, proceed with normal workflow below.**

---

## How it works

### Step 1: Prepare (BLOCKING — must complete before ANY Figma code)

**MANDATORY OUTPUT FORMAT**: You MUST print each step header and its results visibly to the user. This makes the process transparent and verifiable. Use this exact format:

```
## Step 1: Prepare (BLOCKING)

### 1.1 Screen type identified: **[type]**

### 1.2 Reading the pattern YAML
[Call Read tool on the pattern file, then summarize key zones and rules]

### 1.3 Reading the component YAMLs
[Call Read tool on each component YAML, list them]

### 1.4 Extracted components and rules
**Components to use:**
- [Component 1] — [what for]
- [Component 2] — [what for]

**Key rules from YAMLs:**
1. [Rule 1]
2. [Rule 2]
...

## Step 2: Build
[Build the screen, then screenshot]

## Step 3: Check
[Invoke check-ds-page skill, show results, fix if needed]
```

1. **Identify the screen type** from the user's request (login, settings, walkthrough, home, etc.)

2. **Read the pattern YAML** — use the Read tool to read the matching file:
   ```
   Read: ~/.claude/skills/create-ds-page/references/patterns/<screen-type>.yaml
   ```
   Available patterns: `walkthrough.yaml`, `login.yaml`, `settings.yaml`
   If no pattern exists for this screen type, read the closest one for reference.

   **YOU MUST ACTUALLY CALL THE READ TOOL ON THIS FILE.** Do not skip this step. Do not assume you know the pattern from memory. The YAML contains specific rules, component choices, zone structures, and figma_instance_rules that change over time.

3. **Read the component YAMLs** — for EVERY DS component the pattern YAML mentions, read its YAML:
   ```
   Read: docs/ai/components/DS<ComponentName>.yaml
   ```
   Focus on: `figma_rules` (machine-readable), `figma_instance_rules` (prose), `layout`, `rules`, `visual_states` sections.
   Note: `figma_rules` are auto-enforced by DSBuilders — you don't need to manually apply them. But read them to understand what the builders do.

   Example: If building a settings page, the pattern says to use DSListItem → read `DSListItem.yaml`.
   If it uses DSToggle → read `DSToggle.yaml`. If it uses DSAvatar → read `DSAvatar.yaml`.

   **YOU MUST ACTUALLY CALL THE READ TOOL ON EACH COMPONENT YAML.** Do not rely on cached knowledge. The YAMLs contain figma_instance_rules that are critical for correct implementation (e.g., DSListItem.yaml says to use Leading Item with icon buttons for settings rows, DSSegmentedPicker.yaml says unselected segments must match container bg).

4. **Study the HaHo reference screen — VISUAL ONLY, NEVER COPY STRUCTURE**

   The HaHo designer builds screens using manual frames, raw rectangles, and hand-crafted negative spacing. **We have real DS components** (Overlapping Cards, Layered Card, Container Card, DSListItem, etc.) that handle all of this automatically. The designer's node structure is NEVER a valid blueprint for our pages.

   a. **Pick your layout** from the pattern YAML's `layouts` section (e.g., `overlapping_dark_coral`, `grid_tiles`)
   b. **Get the matching reference nodeId** from the pattern YAML's `figma_references` section — each layout maps to ONE specific designer reference screen with its node ID
   c. **Screenshot that ONE reference** using `figma_capture_screenshot` with the nodeId
   d. **Study the VISUAL RESULT only** — colors, proportions, spacing between zones, which elements are present, text content, icon choices. **Do NOT walk the node tree to copy frame hierarchy.** The designer's structure uses manual frames — we use DS components instead.
   e. **Map every visual zone to a DS component** — this is the critical step. For each visual section in the reference, identify which DS component handles it:
      - Overlapping cards with negative spacing → **Overlapping Cards component** (Cards=2/3/5, Overlap=Small/Medium/Large)
      - Shadow layers behind a card → **Layered Card component** (Direction=Bottom/Top, Layers=1/2)
      - Rounded card container → **Container Card / DSCard component**
      - List rows with icon + text + trailing action → **DSListItem component**
      - Input fields → **Inputs-Filled / Inputs-Lined component**
      - Buttons → **Button component**
      - NEVER create manual frames for patterns that have a DS component

   **Do NOT screenshot all references.** Pick the one that matches your chosen layout.
   **Do NOT copy the designer's node structure.** Only use the screenshot for visual inspiration.
   **Do NOT create manual frames with negative spacing** — use Overlapping Cards component.
   **Do NOT create manual absolute-positioned layers** — use Layered Card component.

5. **Create a Component Map** (BLOCKING — must complete before building)

   Before writing ANY Figma code, list every visual zone and its DS component:
   ```
   ### Component Map
   - Status bar → Top App Bar (Style=Status-Bar) instance
   - Form section → Container Card instance OR DSCard frame (surfaceNeutral2)
   - Social + signup overlap → Overlapping Cards instance (Cards=2, Overlap=Small)
   - CTA button → Button instance (Filled A, Big)
   - ~~Home indicator~~ → NEVER add. The iOS Home Indicator is a system-level element, not a page component.
   ```

   **Rule: If ANY zone says "manual frame" or "custom frame" — STOP.** Find the matching DS component or ask the user. There is almost always a component for the pattern.

   **TOP APP BAR IS ALWAYS FIRST IN THE MAP — NO EXCEPTIONS:**
   Every Component Map must begin with:
   ```
   - Top App Bar → Top App Bar instance (Style=Small-Centered / Logo / Large / Search — pick based on screen)
   ```
   If you omit the Top App Bar from the Component Map, STOP and add it before building.

6. **List the components and rules** you extracted from the YAMLs AND the component map before proceeding.

### Step 2: Build (USE BUILDERS)

**CRITICAL: Use DSBuilders for ALL component creation.** The builder functions in `figma-plugin/builders/ds-builders.js` enforce every YAML rule automatically. You NEVER need to manually apply rules like "picker bg contrast" or "checkbox strokeAlign" — the builders do it.

**Builder API reference** (paste as preamble in `figma_execute` calls):
```javascript
// Screen + structural
const screen = DSBuilders.screenFrame(parent, { name: 'Page Name' });
await DSBuilders.statusBar(screen);
const card = await DSBuilders.containerCard(screen, { name: 'Form Card', slots: { title, subtitle, showInput1, showInput2, showCheckbox, showCTA, showFooter, footerText }, detach: true, fill: 'surfacePrimary100' });

// Components (rules auto-enforced)
await DSBuilders.segmentedPicker(card, { items: ['Tab 1', 'Tab 2'], selectedIndex: 0 });
// → auto-detects parent bg, sets white container inside grey card, matches inactive tab fills
await DSBuilders.textField(card, { label: 'Email', value: 'user@example.com', icon: 'mail-open' });
// → auto-sets surfaceNeutral0_5 bg inside surfaceNeutral2 card
await DSBuilders.checkbox(row, { label: 'Remember me', checked: false });
// → uses correct variant (85:24849), fixes strokeAlign to INSIDE
await DSBuilders.button(card, { label: "Let's Roll!", style: 'filledA', size: 'big', iconRight: true, fullWidth: true });
// → auto-fixes icon color on dark button styles (filledB/C/outlinedLight)

// Helpers
const row = DSBuilders.row(card, { name: 'Helper Row' });
DSBuilders.text(card, { text: 'Welcome!', size: 14, opacity: 0.75 });
```

**Split into 2-3 `figma_execute` calls** per page (30s timeout limit):
1. Call 1: Screen frame + status bar + container card instance config
2. Call 2: Set texts + detach + add picker + helper row
3. Call 3: Social card or additional sections

5. **Build the screen** using DSBuilders — the AI specifies WHAT, builders enforce HOW
6. **Screenshot and validate visually** — no overlaps, real component instances, proper hierarchy

**MANDATORY OUTPUT**: After building, print:
```
## Step 2: Build
[Screenshot displayed]
Visual check: [list any visible issues or "No visible issues"]
```

### Step 3: Check Loop (MANDATORY — NEVER SKIP — LOOP UNTIL PASS)

**THIS IS A LOOP. You MUST keep running the checker, fixing issues, and re-running until the result is PASS. You cannot exit Step 3 until ALL checks PASS.**

```
LOOP:
  1. Invoke check-ds-page skill with the frame node ID
  2. Print the full report table (see format below)
  3. If result == PASS → EXIT LOOP, proceed to completion
  4. If result == FAIL:
       a. Fix ALL reported issues
       b. Print "### Fix iteration N: [what was fixed]"
       c. GO BACK TO STEP 1 (re-invoke checker immediately)
  5. If iteration > 3 → stop and report remaining issues to user
```

**MANDATORY OUTPUT FORMAT** — print this after EVERY checker run:
```
## Step 3: Check (iteration N)

| Check | Status | Issues |
|-------|--------|--------|
| 1. Icon Consistency | PASS/FAIL | ... |
| 2. Social Buttons | PASS/FAIL | ... |
| 3. Background Contrast | PASS/FAIL | ... |
| 3b. Foreground Contrast | PASS/FAIL | ... |
| 4. Spacing | PASS/FAIL | ... |
| 5. Pattern | PASS/FAIL | ... |
| 6. Properties | PASS/FAIL | ... |
| 7. Visual | PASS/FAIL | ... |
| 8. Layout | PASS/FAIL | ... |
| 9. YAML Rules | PASS/FAIL | ... |
| 10. DS Components | PASS/FAIL | ... |
| 11. Container Card | PASS/FAIL | ... |

### Issues to fix: [list or "None"]
### Result: PASS / FAIL
```

**If FAIL**: immediately fix all issues, print `### Fix iteration N: [what was fixed]`, then **re-invoke `check-ds-page` again right away** — do NOT wait, do NOT move on, do NOT ask the user. The loop must complete automatically.

7. **IMMEDIATELY after building, invoke the `check-ds-page` skill** using the Skill tool:
   ```
   Skill: check-ds-page
   Args: <node-id-of-the-frame-you-just-created>
   ```
   This is NOT optional. This is NOT "do it later". This is the NEXT action after taking the screenshot.

8. **ONLY after ALL checks PASS** can you move to the next page or report completion to the user.

### Why this matters
Without running the checker, pages ship with:
- Segmented Picker inactive tabs with wrong background colors
- Checkbox components showing as oversized list items with lorem ipsum
- Input fields blending into parent cards (no contrast)
- Default "Button" text on social login buttons
- Generic arrow icons where brand icons are needed

These are all real bugs found in production pages that the checker catches automatically.

### Enforcement rule
**If you are building multiple pages in sequence:**
- Build page 1 → screenshot → **check loop** (run → fix → re-run → repeat until PASS) → PASS confirmed → next page
- Build page 2 → screenshot → **check loop** → PASS confirmed → next page
- Build page 3 → screenshot → **check loop** → PASS confirmed → next page

**NEVER batch-build multiple pages and then check them all at the end.** Check EACH page immediately after building it, before starting the next one.

**NEVER fix issues and then skip re-running the checker.** After every fix, the checker MUST be re-invoked. Fixing without re-checking is not a complete iteration — it's a broken loop.

## Screen types and patterns

| Screen type | Pattern file | Key characteristics |
|---|---|---|
| Onboarding / Walkthrough | `walkthrough.yaml` | Hero imagery or text, page dots, Skip button, CTA at bottom |
| Login | `login.yaml` | Card zones, floating-label inputs, social auth, segmented Login/SignUp |
| Sign Up | `login.yaml` | Same as login with more fields |
| Home / Feed | `feed.yaml` | Post cards, image carousels, masonry grids, stories, activity, suggestions, 24 variants |
| Settings | `settings.yaml` | Profile hero + DSListItem rows in card (Leading icon + Trailing toggle/arrow) |
| Profile | `profile.yaml` | Cover image/avatar hero, name+bio+stats, Follow/Message CTAs, photo grid, 20 variants |
| Search | `search.yaml` | Explore grids, active search, results list/grid, trending, 11 variants |
| Chat | `chat.yaml` | Overview list, individual/group bubbles, video/voice calls, 23 variants |
| Checkout | `checkout.yaml` | Cart, payment forms, shipping, order review, confirmation, 20 variants |
| Stats / Dashboard | `stats.yaml` | Bar/line charts, progress circles, transaction lists, earnings, 24 variants |
| Shopping | `shopping.yaml` | Product grids, categories, detail pages, filters, 29 variants |
| Alerts / Modals | `alerts.yaml` | Banners, modal dialogs, action sheets, toasts, empty states, 11 variants |
| Splash | `splash.yaml` | Brand logo, color zones, tagline, version info, 3 variants |
| Camera | `camera.yaml` | Viewfinder, photo editing, gallery, filters, 23 variants |
| Media | `media.yaml` | Now playing, playlists, library, artist pages, podcast, 18 variants |
| Calendar | `calendar.yaml` | Month grid, week timeline, day schedule, event detail, 18 variants |

## Rules

1. **Every visual zone must be a real Component INSTANCE** — NEVER create manual frames that replicate DS component patterns. Specifically: NEVER use negative `itemSpacing` on a manual frame (use Overlapping Cards component), NEVER use absolute positioning to stack cards (use Layered Card component), NEVER draw rounded rectangles with fills (use DSCard or Container Card). The HaHo designer uses manual frames — we do NOT. We have components for everything.
2. **Always use auto-layout** — screens are VERTICAL auto-layout frames (393×852)
3. **Always configure ALL component properties** — BOOLEAN, TEXT, VARIANT, and especially INSTANCE_SWAP. Never leave default icons.
4. **Use card zones** — group content inside rounded frames, not floating on bare background
5. **Screenshot after building** each screen to validate
6. **Read the pattern YAML BEFORE building** (Step 1.2) — this is a BLOCKING prerequisite, not a suggestion. The pattern YAML defines which components to use, which zones to create, and which rules to follow. Without reading it, you WILL use wrong components (e.g., manual frames instead of DSListItem for settings rows).
7. **Read EVERY component YAML BEFORE using it** (Step 1.3) — each component YAML has `figma_instance_rules` that contain critical Figma-specific rules (e.g., DSSegmentedPicker says unselected tabs must match container bg, DSListItem says settings rows need Leading Item icon buttons, DSProgressCircle says label must be light on dark backgrounds). Without reading these, you WILL violate component rules.
8. **Verify pattern usage** — check the HaHo reference screen for the specific screen type BEFORE applying card composition patterns (overlapping, layered, etc.)
9. **Page background is ALWAYS `surfaceNeutral0_5`** (`rgb(250,250,249)`) — NEVER change it. Dark/coral/colored sections go inside as child cards.
10. **No emoji, no image fills** — use DS icons, DSAvatar, or labeled placeholder frames only. For profile images use DSAvatar component. For content images use a neutral frame with "Image Placeholder" label.
11. **Text contrast is MANDATORY** — light bg (r>200) = dark text. Dark bg (r<100) = light text. Coral bg = dark text. NEVER put white text on grey/light backgrounds. NEVER put dark text on dark backgrounds. This applies to ALL text: buttons, badges, pills, labels, card content.
12. **ALL pages have consistent padding** — every screen frame: `paddingLeft=12, paddingRight=12, paddingBottom=12, paddingTop=0`. No exceptions unless using overlapping card patterns.
13. **Run `check-ds-page` IMMEDIATELY after each page** — this is the NEXT action after screenshot. Fix all failures. Re-run until PASS. NEVER skip. NEVER batch. NEVER proceed to next page without PASS.
14. **ALWAYS use Container Card component for cards** — NEVER use `figma.createFrame()` to build card containers. Always instantiate the Container Card component (`Style=Default`, nodeId `88:137854`). It already has surfaceNeutral2 bg, r32, pad 32, vertical auto-layout, 24px gap. For dark cards, instantiate Container Card then override fills to surfacePrimary100/120. For coral cards, override to surfaceSecondary100. This is the ONLY way to create card sections.
15. **ALWAYS add a Top App Bar (MANDATORY)** — Every screen MUST start with a Top App Bar instance (`componentSet nodeId: 85:24922`). Choose the right style based on the screen:
    - Login / onboarding / splash with NO back button → `Style=Logo` or omit back (use `onBack: nil`)
    - Standard inner page → `Style=Small-Centered` with title
    - Home / feed → `Style=Large` or `Style=Logo`
    - Search-focused → `Style=Search`
    NEVER draw a manual title row. NEVER skip the top bar. It must be the FIRST child in the screen frame (before any card).

## How to create cards (MANDATORY PATTERN)

```javascript
// ✅ CORRECT — always use this pattern (instantiate → detach → add content)
const containerComp = await figma.getNodeByIdAsync('88:137854');
const cardInstance = containerComp.createInstance();
cardInstance.name = 'My Card';
parentFrame.appendChild(cardInstance);
cardInstance.layoutSizingHorizontal = 'FILL';

// Detach to allow adding children — frame keeps all component properties (r32, pad32, gap24, surfaceNeutral2)
const card = cardInstance.detachInstance();

// Remove placeholder text
const placeholder = card.findOne(n => n.type === 'TEXT' && n.characters === 'Content goes here');
if (placeholder) placeholder.remove();

// Now add content freely
card.appendChild(myText);
card.appendChild(myInput);

// For dark variant: override fills AFTER detaching
card.fills = [{ type: 'SOLID', color: { r: 37/255, g: 47/255, b: 44/255 } }];

// For coral variant: override fills AFTER detaching
card.fills = [{ type: 'SOLID', color: { r: 255/255, g: 106/255, b: 95/255 } }];
```

```javascript
// ❌ NEVER DO THIS — manual frame creation for cards
const card = figma.createFrame();
card.cornerRadius = 32;
card.fills = [...];
card.paddingLeft = 32;
// ... this is WRONG — properties don't come from the component!
```

### Helper function for creating cards
Use this reusable function in ALL page builds:
```javascript
async function createContainerCard(parent, name, fillOverride) {
  const containerComp = await figma.getNodeByIdAsync('88:137854');
  const inst = containerComp.createInstance();
  inst.name = name;
  parent.appendChild(inst);
  inst.layoutSizingHorizontal = 'FILL';
  const card = inst.detachInstance();
  const placeholder = card.findOne(n => n.type === 'TEXT' && n.characters === 'Content goes here');
  if (placeholder) placeholder.remove();
  if (fillOverride) card.fills = [{ type: 'SOLID', color: fillOverride }];
  return card;
}
```

## Design Originality (CRITICAL)

**The pattern YAML defines WHAT components to use and WHAT rules to follow — NOT the exact layout.**

You MUST create an original design for each page. DO NOT copy the exact zone arrangement from any HaHo reference screen. Instead:

1. **Understand the app's identity** — what does this app do? What's its personality? Let that inform the layout.
2. **Mix and match zones** — the pattern YAML lists available zones and options. Pick a DIFFERENT combination than HaHo's examples.
3. **Use the new card components creatively** — Layered Card, Overlapping Cards, Container Card are building blocks. Combine them in new ways.
4. **Vary the hierarchy** — if HaHo puts form first and social last, try social first. If HaHo uses a small header, try a large hero. If HaHo separates cards, try combining them.
5. **The RULES are strict, the LAYOUT is free** — correct icons, contrast, spacing tokens, pattern validity are non-negotiable. But WHERE you place each zone, HOW BIG each card is, and WHAT ORDER they appear is your creative choice.

Examples of originality:
- Login: social buttons at the top as the primary action, email form secondary below
- Login: full-width dark hero card with brand name, form card overlapping from below
- Login: centered minimal layout with inline inputs (no card wrapper)
- Login: split screen — dark left panel with branding, light right panel with form
- Walkthrough: text-first hero instead of image-first
- Profile: stats prominently at top instead of avatar
