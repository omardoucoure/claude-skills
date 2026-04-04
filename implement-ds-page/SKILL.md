---
name: implement-ds-page
description: Implement a full mobile screen/page from Figma using existing design system components. Use when user says "implement this page", "build this screen", "create this view", "code this page from Figma", provides a Figma URL for a full page, or wants to implement a complete screen. Do NOT use for creating individual reusable components — use create-ds-component for that.
metadata:
  author: OmApps
  version: 1.0.0
  category: design-system
  tags: [figma, design-system, page, swift, mobile, pixel-perfect, implementation]
---

# Implement Design System Page

## Demo Mode (Live Presentation)

**If the user's message contains `--demo`, follow this INSTEAD of the normal workflow:**

1. Read `~/.claude/skills/demo-assets/login/implement-ds-page-output.md`
2. Print the content section by section (split at `<!-- SECTION -->` markers)
3. Do NOT call ANY Figma MCP tools (`get_design_context`, `get_screenshot`, `get_metadata`)
4. In Phase 5 (Write Page Code): read the pre-baked code from `~/.claude/skills/demo-assets/login/LoginView.swift` and WRITE it to `ios/DemoApp/DemoApp/LoginView.swift` using the Write tool. This makes the file actually appear in the project — the audience sees real code being generated.
5. After writing LoginView.swift, update DemoView.swift:
   - Read `ios/DemoApp/DemoApp/DemoView.swift`
   - Add `NavigationLink("Open Login Page") { LoginView() }` below the comment line
6. Regenerate the Xcode project so it picks up the new file:
   - Run `cd /Users/omardoucoure/Documents/OmApps/design-systems/ios/DemoApp && xcodegen generate`
7. Do NOT mention demo mode — present everything as real

**If `--demo` is NOT in the message, proceed with normal workflow below.**

---

## Critical

**Pages are THIN compositions of design system components.** A page file should contain only:
- Component composition (layout)
- State management (@State, @Binding)
- Navigation logic

**A page must NEVER contain raw styling.** Every visual element must be a component from the design system.

## Anti-Hallucination: The #1 Rule

**NEVER recreate what a component already does.** The most common AI mistake is having components available but rebuilding their functionality inline. Before writing ANY view code, verify: "Is there an existing component for this?"

## Component Prefix Convention

Components use a **project-specific prefix** (e.g., `DS`, `MDS`, `VT`). Detect this from existing components in the project. Check the components directory or `INDEX.yaml`.

## Required Workflow

### Phase 0: Load Project Context

1. Read the project's `CLAUDE.md` — component catalog, token mappings, layout patterns, anti-patterns
2. Read `docs/ai/components/INDEX.yaml` (if exists) — master list of all available components
3. Note the page file location convention and any registration requirements (e.g., Xcode pbxproj)
4. Identify the component prefix from existing components

### Phase 1: Fetch Figma Design

1. Call `get_design_context(fileKey, nodeId)` for the full page
2. Call `get_screenshot(fileKey, nodeId)` for visual reference
3. If truncated, use `get_metadata` first, then fetch sections individually

### Phase 2: Component Inventory (MANDATORY — before ANY code)

**Scan the entire Figma page. Map EVERY element to an existing component.**

For each component, read its YAML from `docs/ai/components/` to understand its exact API.

Present this table:

```
PAGE COMPONENT INVENTORY — [PageName]
┌───┬────────────────────┬──────────────────┬──────────────────────────────────┐
│ # │ Figma Element      │ Component        │ Key Properties                   │
├───┼────────────────────┼──────────────────┼──────────────────────────────────┤
│ 1 │ Top navigation bar │ {Prefix}TopAppBar│ style: .small, title: "Profile"  │
│ 2 │ Profile card       │ {Prefix}UserCard │ avatar: .image, stat: true       │
│ 3 │ Settings list      │ {Prefix}ListItem │ ×5, leading: icon, trailing: chev│
│ 4 │ ???                │ NOT FOUND        │ Need to create first             │
└───┴────────────────────┴──────────────────┴──────────────────────────────────┘

Missing components: [list — must be created first using create-ds-component]
```

**Rules:**
- EVERY visual element must map to a component — no exceptions
- If a component is missing, **create it FIRST** using the create-ds-component workflow
- Read each component's YAML to understand its exact API
- Note VARIANT/STYLE/SIZE for each — read from Figma, never guess

**STOP HERE.** Show inventory to user and confirm before proceeding.

### Phase 3: Full Property Extraction

For each component in the inventory, extract ALL Figma properties. Map every CSS variable to a project token. Extract from Figma — do NOT guess any value.

### Phase 4: Layout Structure

Map the Figma page layout to code. Check CLAUDE.md for the project's standard page layout pattern (e.g., ZStack + VStack + ScrollView for floating elements).

### Phase 5: Write Page Code

Rules:
1. **ONLY project components** — no raw SwiftUI styling
2. **ONLY theme tokens** — no hardcoded values
3. **Text uses LocalizedStringKey** — for multi-locale support
4. **Mirror Figma hierarchy** — groups with different gaps = nested containers
5. **Page is THIN** — only composition + state + navigation
6. **Follow project's layout pattern** from CLAUDE.md
7. **Register the file** if needed (e.g., Xcode pbxproj)

### Phase 6: Run Pixel-Perfect Check

After writing the code, **invoke the `pixel-perfect-check` skill** to audit the implementation against Figma. This produces the validation table and reuse verification.

If the audit finds mismatches — fix them before delivering.

### Phase 7: Build and Verify

1. Build the project — fix any compilation errors
2. Verify the page is registered and accessible

## Two Modes

- **`implement`** (DEFAULT) — Designer chose everything in Figma. AI just executes pixel-perfect.
- **`full`** (personal / no Figma) — AI decides which components to use. Read component YAMLs for `use_when` guidance.

## Common Traps

| Trap | Prevention |
|------|------------|
| Rebuilding a component inline | Phase 2 inventory — check existing components FIRST |
| Using .font(.system(...)) | Always use theme.typography tokens |
| Hardcoded colors | Always use theme.colors tokens |
| Missing toolbar(.hidden) | Check Figma for native nav bar presence |
| Wrong ScrollView padding | Horizontal padding INSIDE ScrollView on content |
| Creating new view instead of reusing component | pixel-perfect-check will catch this |

## Performance Notes

- Phase 2 (Component Inventory) is the most critical — get this right and the rest flows
- Pages should be SHORT — if over 200 lines, you're probably inlining too much
- Always run pixel-perfect-check before delivering
