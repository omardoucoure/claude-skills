---
name: create-ds-component
description: Create a reusable mobile design system component from Figma. Use when user says "create component", "new DS component", "build component from Figma", "add to design system", or wants to extract a reusable component from a Figma design. Do NOT use for page/screen implementation — use implement-ds-page for that.
metadata:
  author: OmApps
  version: 1.0.0
  category: design-system
  tags: [figma, design-system, component, swift, mobile, pixel-perfect]
---

# Create Design System Component

## Critical

**This skill creates pixel-perfect, highly reusable mobile design system components from Figma designs.** Every property must be traced from Figma — zero hallucination. The component must be simple, clean, and maximally reusable through properties.

## Two Modes

This skill supports two modes based on the project context:

### Mode: `implement` (Company / has designers)
- Designers have already chosen the component and designed it in Figma
- AI role: **execute** pixel-perfect translation — no design decisions needed
- YAMLs focus on: token mapping, padding, color→style mapping, exact properties
- Skip `use_when` / `never_use_when` in generated YAML

### Mode: `full` (Personal / no designers)
- AI may need to decide which component to use or create
- AI role: **decide** + execute
- YAMLs include: `use_when`, `never_use_when`, variant decision guidance, plus all implementation details

**Default to `implement` mode. Use `full` mode only when the user explicitly states there are no designers or no Figma for this project.**

## Component Naming — Prefix Convention

Component names use a **project-specific prefix** (e.g., `DS`, `MDS`, `VT`, `NM`).

- **First component in a project:** Ask the user: "What prefix should I use for components? (e.g., DS, MDS, VT...)"
- **Subsequent components:** Reuse the same prefix automatically — do not ask again
- **How to detect the prefix:** If the project already has components, read the existing component names to determine the prefix. Look in the components directory or `INDEX.yaml`.
- The prefix applies to: struct name, file name, enums (e.g., `MDSButtonStyle`), YAML/markdown filenames

Example: If the user says the prefix is `MDS`, then:
- File: `MDSButton.swift`
- Struct: `public struct MDSButton: View`
- Enum: `public enum MDSButtonStyle`
- YAML: `MDSButton.yaml`

## Required Workflow

**Follow these phases in strict order. Do not skip any phase.**

### Phase 0: Load Project Context

1. Read the project's `CLAUDE.md` for: component catalog, token system, file structure, naming conventions
2. If the project has `docs/ai/components/INDEX.yaml`, read it to understand existing components
3. Identify: framework (SwiftUI/UIKit/etc), token system, icon approach, theme access pattern
4. Identify the components directory and file naming convention
5. **Determine the component prefix:** Check existing components for the naming pattern. If no components exist yet, ask the user for the prefix. Remember it for all subsequent components in this project.

### Phase 1: Fetch Figma Design

1. Call `get_design_context(fileKey, nodeId)` for the component
2. Call `get_screenshot(fileKey, nodeId)` for visual reference
3. If truncated, use `get_metadata` first, then fetch child nodes individually

### Phase 2: Property Extraction (MANDATORY before any code)

Go through the Figma output and extract EVERY property into a structured inventory:

```
COMPONENT: [name from Figma]
├── Container
│   ├── Background: [CSS var / hex] → [project token]
│   ├── Border: [color] [width] → [project tokens]
│   ├── Radius: [val] → [project token]
│   ├── Padding: px=[val] py=[val] pt=[val] pb=[val] → asymmetric?
│   └── Dimensions: w=[val] h=[val] → fixed, flexible, or intrinsic?
│
├── Typography (for each text element)
│   ├── Font: [size] [weight] → [project token]
│   ├── Color: [CSS var / hex] → [project token]
│   └── Content: [static text vs dynamic]
│
├── Icons/Images
│   ├── Name: [icon identifier]
│   ├── Size: [w×h]
│   └── Color: [CSS var / hex] → [project token]
│
├── States (identify ALL states in Figma variants)
│   ├── Default: [properties]
│   ├── Active/Focused: [what changes]
│   ├── Disabled: [what changes]
│   ├── Error: [what changes]
│   └── [other states]: [what changes]
│
├── Spacing
│   ├── Internal gaps: [between elements]
│   └── Element-specific margins: [if any]
│
└── Interactions
    ├── Tappable: [yes/no]
    ├── Toggle: [yes/no]
    └── Dismissable: [yes/no]
```

**Rules:**
- Read EVERY CSS variable — do not skip any
- Map each to project tokens
- Flag unmappable values — ASK, do not guess
- Note state differences precisely (what changes between states)
- Identify which properties should become component parameters vs which are fixed

### Phase 3: Component API Design

Design the component's public API for **maximum reusability with minimum complexity**:

#### 3a. Identify Parameters

For each extracted property, decide:
- **Fixed** — same in every use (hardcode using theme tokens)
- **Parameter with default** — usually the same but sometimes different
- **Required parameter** — always varies per usage

**Principles:**
- Keep the component SIMPLE — fewer parameters is better
- Use enums for discrete options (styles, sizes, states) — not raw values
- Accept `LocalizedStringKey` for all user-facing text (EN/FR/ES support)
- Use `@ViewBuilder` for flexible content slots
- Access theme via `@Environment` — never pass theme as parameter

#### 3b. Design the Init Signature

```
Component Design:
├── Required: [list required params with types]
├── Optional: [list optional params with defaults]
├── Enums to create: [Style, Size, State enums if needed]
├── ViewBuilder slots: [if flexible content areas needed]
└── Callbacks: [onTap, onDismiss, etc.]
```

#### 3c. Present to User for Confirmation

**STOP HERE.** Show the user:
1. The property extraction table from Phase 2
2. The proposed API (init signature, enums, defaults)
3. Ask: "Does this API look right? Should any parameter be added/removed?"

**Wait for confirmation before writing code.**

### Phase 4: Write Component Code

Rules for writing the component:

1. **Simple and clean** — the component does ONE thing well
2. **All values from theme tokens** — zero hardcoded colors, sizes, fonts, spacing
3. **No business logic** — component is purely visual + interaction
4. **Responsive** — never hardcode width (use `.frame(maxWidth: .infinity)` or intrinsic sizing)
5. **Match Figma hierarchy** — nested groups with different gaps = nested containers
6. **State handling via enums** — not raw booleans or strings
7. **Public API only exposes what's needed** — internal layout details stay private
8. **Follow project conventions** — file location, naming, imports, access control
9. **Match sub-components by Figma node name, not concept** — When a composite component uses existing components, grep `@figma:` in the codebase and match the exact Figma `data-name` or `data-node-id` from the design context. NEVER guess which component to use based on the concept name (e.g., "locked" does NOT mean use `ContenuReserve` — check if Figma uses `lock_circle` or `contenu_réservé`). Two components can share a concept but be visually different.

#### File structure:
```swift
import SwiftUI

// Use the project's prefix (DS, MDS, VT, etc.) — never hardcode "DS"
public struct {Prefix}ComponentName: View {
    // MARK: - Environment
    @Environment(\.theme) private var theme

    // MARK: - Properties (public init params)

    // MARK: - Body
    public var body: some View {
        // Use ONLY theme tokens for all values
    }

    // MARK: - Init
    public init(...) { }
}

// MARK: - Supporting Types (enums, styles)
// e.g., {Prefix}ButtonStyle, {Prefix}ButtonSize
```

### Phase 5: Pixel-Perfect Validation (MANDATORY — RE-FETCH FROM FIGMA)

**CRITICAL: Do NOT validate against the Phase 2 extraction. Go back to the ACTUAL Figma output.**

This phase exists because Phase 2 extraction can have errors. The validation must be an independent check.

#### 5a. Re-read the raw Figma CSS classes

For each variant of the component, go back to the `get_design_context` output and extract the **raw Tailwind/CSS class values** directly:
- `px-[12px]` → horizontal padding = 12
- `py-[4px]` → vertical padding = 4
- `rounded-[20px]` → radius = 20
- `text-[16px]` → font size = 16
- `bg-[#D9141F]` → background color
- `gap-[3px]` → spacing between elements

**Read the actual class string for EACH variant separately.** Do not assume variants share values — check each one.

#### 5b. Read the code values

For each property, find the actual value in the Swift code. Follow the switch/case logic to find what each brand/variant resolves to.

#### 5c. Compare in a table — Figma CSS → Code

Present this table to the user, with the **raw Figma CSS value** in column 2 (not the Phase 2 extraction):

```
VALIDATION TABLE — [ComponentName]
┌─────────────────┬──────────────────────┬──────────────────┬─────┐
│ Property        │ Figma Raw CSS        │ Code Value       │ ✓/✗ │
├─────────────────┼──────────────────────┼──────────────────┼─────┤
│ JDX padding H   │ px-[12px] → 12       │ spacing12 (12)   │ ✓   │
│ JDX padding V   │ py-[4px] → 4         │ spacing4 (4)     │ ✓   │
│ JDX radius      │ rounded-[20px] → 20  │ 20               │ ✓   │
│ JDX font        │ text-[16px] → 16     │ button2() (16)   │ ✓   │
│ ...             │ ...                  │ ...              │     │
└─────────────────┴──────────────────────┴──────────────────┴─────┘
```

#### 5d. For composite components — validate sub-components

For components that contain other components:
1. Read the `data-name` attribute of each sub-component instance in the Figma output
2. Verify the code passes the correct brand/variant matching that `data-name`
3. Verify the sub-component is the right one (check `@figma:` metadata)

#### 5e. SwiftUI-specific checks

- **Button**: SwiftUI `Button` adds default padding. If using `Button`, verify with `.buttonStyle(.plain)` or avoid `Button` and use `Text` + `onTapGesture` instead
- **Image scaling**: Verify `scaledToFit` vs `scaledToFill` matches Figma's `overflow-clip` and positioning
- **Font names**: Verify PostScript names match the actual font files (not guessed names)

**If ANY mismatch: fix it before proceeding.** Do not deliver code with known mismatches.

### Phase 6: Create Documentation

Create companion files based on project conventions:

#### 6a. Component YAML (if project has `docs/ai/components/`)

Generate a YAML following the project's existing YAML structure. Check `docs/ai/components/INDEX.yaml` for the format.

- In `implement` mode: focus on visual specs, token mapping, parameters, rules
- In `full` mode: add `use_when`, `never_use_when`, variant decision guidance

#### 6b. Component Markdown (if project has `docs/components/`)

Generate markdown documentation following the project's existing format. Check an existing `.md` file for the structure.

#### 6c. Update Index Files

- Add to `INDEX.yaml` if it exists
- Register new file in Xcode project (`.pbxproj`) if applicable

### Phase 7: Final Checklist

Before declaring complete:

- [ ] Component builds without errors
- [ ] All Figma properties mapped to theme tokens (zero hardcoded values)
- [ ] Validation table shows ALL properties match
- [ ] Component is simple — no unnecessary complexity
- [ ] Parameters use enums for discrete options
- [ ] Text uses `LocalizedStringKey`
- [ ] File placed in correct directory
- [ ] Documentation created (YAML + markdown if applicable)
- [ ] Index files updated
- [ ] No duplicate functionality with existing components

## Common Traps

| Trap | Prevention |
|------|------------|
| Over-engineering | Start with minimum params. Add more only when needed |
| Hardcoded values | Every number maps to a theme token |
| Missing states | Check ALL Figma variants, not just the default |
| Wrong defaults | Read component source to verify actual defaults |
| Inline styling in parent | All styling lives in the component, not the caller |
| Ignoring asymmetric padding | If px != py, handle them separately |
| Guessing icon names | Use project's icon enum/system — never raw strings |
| Wrong sub-component | Match by Figma node name/ID, not by concept. Two components can share a concept (e.g., "lock") but look completely different. Always grep `@figma:` and cross-reference with `data-name` from Figma output |
| Propagating parent brand to children | NEVER assume sub-components inherit the parent's brand. Read each sub-component's `data-name` attribute (e.g., `brand=jdx`) from Figma — a `brand=qub` card may contain `brand=jdx` sub-components. The designer chose that specific variant intentionally |
| Hardcoded width from Figma | Figma component definitions show fixed pixel dimensions (e.g., 285x160) — these are **design-time preview sizes**, not runtime constraints. Components should use `.frame(maxWidth: .infinity)` with `.aspectRatio()` so they fill their parent width and derive height from the ratio. Never hardcode width from Figma component dimensions |
| Skipping validation table | Phase 5 is mandatory — show the table every time |

## Performance Notes

- Phase 2 extraction prevents 90% of revision cycles — be thorough
- Phase 5 validation table is non-negotiable — always show it
- Simple > clever — a component that's easy to use beats one with many options
- When in doubt about a value, ASK — never guess
