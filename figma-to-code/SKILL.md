---
name: figma-to-code
description: Pixel-perfect Figma-to-code quality gate. Enforces mandatory property extraction, component mapping, and visual validation before delivering any UI implementation. Use when implementing screens from Figma, when user says "implement this page", "build this screen", "code this design", provides a Figma node ID or URL, or asks to match a Figma design. Do NOT use for simple code edits unrelated to Figma designs.
metadata:
  author: OmApps
  version: 1.1.0
  category: design-to-code
  tags: [figma, pixel-perfect, design-system, quality-gate]
---

# Figma-to-Code Quality Gate

## Critical

**This skill enforces a mandatory extraction-then-build workflow.** Writing ANY code before completing the extraction phase is forbidden. Every visual property must be traced from Figma data to code — zero hallucination, zero guessing.

## Why This Skill Exists

Common failure modes when implementing Figma designs:
1. **Skipping extraction** — jumping to code based on a screenshot glance
2. **Assuming component defaults** — trusting that a component's default props match Figma
3. **Ignoring Figma hierarchy** — flattening nested groups that have different spacing
4. **Missing properties** — skipping opacity, z-index, negative margins, border widths
5. **Wrong icon/asset handling** — substituting generic icons when Figma has custom assets

## Project-Specific Configuration

This skill is **framework-agnostic and project-agnostic**. It defines the methodology only.

Each project's CLAUDE.md contains the project-specific details: component catalog, token mappings, icon system, file conventions, build commands, and special patterns. **Always read the project's CLAUDE.md first** to understand the design system, available components, and how Figma CSS variables map to project tokens.

## Required Workflow

**Follow these phases in strict order. Do not skip or merge phases.**

### Phase 0: Load Project Context

1. Read the project's CLAUDE.md for component catalog, token mappings, icon system, and conventions
2. Identify: framework, component library, token system, icon approach, file conventions
3. If CLAUDE.md has no design system section, scan the codebase to understand the stack before proceeding

### Phase 1: Fetch and Screenshot

1. Call `get_design_context(fileKey, nodeId)` to get the structured design data
2. Call `get_screenshot(fileKey, nodeId)` to get the visual reference
3. If the response is truncated, use `get_metadata` first, then fetch child nodes individually
4. Save the screenshot — it is the source of truth for final validation

### Phase 2: Line-by-Line Property Extraction

**Before writing ANY code**, go through the Figma design context output and extract EVERY property into a structured inventory:

```
ELEMENT: [element name from Figma]
├── Typography: [font-size] [font-weight] → [project token]
├── Background: [CSS var or hex] → [project token]
├── Text color: [CSS var or hex] → [project token]
├── Border: [color] [width] → [project tokens]
├── Padding: px=[val] py=[val] pt=[val] pb=[val] pl=[val] pr=[val] → asymmetric or uniform?
├── Gap/spacing: [val] → [project token]
├── Radius: [val] → [project token]
├── Dimensions: w=[val] h=[val] → fixed or flexible?
├── Opacity: [val]
├── Z-index: [val]
├── Negative margin: mb=[-val] → overlap
├── Icon/image: [name] → [how to reference in project]
└── Content clues: [dots=password, checked=true, toggle=on, etc.]
```

**Rules:**
- Read EVERY CSS variable in the Figma output
- Map each to the project's token system using the project reference
- Flag any value you cannot map — ASK the user, do not guess
- Check for asymmetric padding (px != py, or pt != pb) — #1 source of bugs
- Note the Figma layer hierarchy — nested groups with different gaps must be mirrored

### Phase 3: Component Inventory

For each element, determine which project component to use:

1. **Check existing components** from the project reference or components directory
2. **Map each Figma element to a component** with ALL properties explicitly listed — not just the ones that differ from defaults
3. **Verify every property against Figma** — read the component's source if needed to confirm what the defaults actually are
4. If no matching component exists, flag it for creation before proceeding

### Phase 4: Hierarchy Matching

Map the Figma layer tree to the project's layout structure:

1. Identify all Figma groups/frames and their `gap` values
2. Nested groups with different gaps = nested layout containers with different spacing
3. Note which elements share a group vs. are in separate groups
4. Check for overlapping or stacked elements (negative margins, z-index)

Example:
```
Figma: OuterGroup (gap=16) > [A, InnerGroup (gap=8) > [B, C]]

CORRECT: Layout(spacing: 16) { A; Layout(spacing: 8) { B; C } }
WRONG:   Layout(spacing: 16) { A; B; C }  // Loses inner gap
```

### Phase 5: Write Code

Now — and only now — write the code:

1. Use ONLY project components and design tokens — no raw/hardcoded values
2. Mirror the Figma hierarchy exactly
3. Apply every extracted property from Phase 2
4. Check the project reference for any special patterns that apply (overlaps, asymmetric padding, platform-specific conventions, etc.)

### Phase 6: Pre-Delivery Validation

**Before declaring the page complete, run this checklist:**

#### 6a. Property Audit
Go back to Phase 2 extraction. For EVERY property extracted:
- [ ] Is it present in the code?
- [ ] Does it use the correct project token (not a hardcoded value)?
- [ ] Does it match the Figma value exactly?

#### 6b. Component Property Verification
For each component used:
- [ ] Are ALL properties explicitly set (not relying on defaults without verifying them)?
- [ ] Does each property value match what Figma shows?

#### 6c. Hierarchy Check
- [ ] Does the code's nesting structure match Figma's layer tree?
- [ ] Does each container have the correct spacing/gap?

#### 6d. Visual Comparison
- [ ] Compare code output against the Phase 1 screenshot
- [ ] Check spacing, alignment, icon sizes, text styling, colors

#### 6e. Build Verification
- [ ] Code builds without errors
- [ ] New files registered in project config if needed

## Common Traps

| Trap | What goes wrong | How to prevent |
|------|----------------|----------------|
| Default component props | Component looks different than Figma because a prop was left as default | Read component source, verify every prop |
| Asymmetric padding | Single padding value when Figma has different horizontal/vertical | Check px vs py — if different, apply separately |
| Icon/asset substitution | Using a generic icon when Figma has a specific asset | Use project's icon system; download from Figma if missing |
| Missing border details | Wrong border width or color | Read exact border values from Figma |
| Wrong input/field state | Defaulting to normal when Figma shows error/active/disabled | Read border color and content to determine state |
| Flattened hierarchy | One container when Figma has nested groups with different gaps | Mirror every Figma group |
| Hardcoded values | Raw numbers instead of design tokens | Every value must map to a project token |
| Wrong initial state | UI element in wrong state (unchecked vs checked, off vs on) | Read Figma content to determine initial state |

## Performance Notes

- Phase 2 extraction is the most important phase — take your time
- A thorough extraction prevents 90% of revision cycles
- Do not skip Phase 6 checklist
- When in doubt about any value, ASK rather than guess
