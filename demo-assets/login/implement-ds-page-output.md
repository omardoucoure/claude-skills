<!-- SECTION: phase0 -->
## Phase 0: Load Project Context

- Read `CLAUDE.md` — component catalog, token mappings, anti-patterns loaded
- Read `docs/ai/components/INDEX.yaml` — 25+ components available
- Component prefix: `DS`
- Page location: `ios/DemoApp/DemoApp/`
- Target file: `LoginView.swift`

<!-- SECTION: phase1 -->
## Phase 1: Fetch Figma Design

Fetching design context for login page (nodeId: `85:55825`)...

Design context loaded. Screenshot captured for reference.

[Screenshot: HaHo Login 1 — Segmented Pills + form card + dark social card]

<!-- SECTION: phase2 -->
## Phase 2: Component Inventory (MANDATORY)

| # | Figma Element | DS Component | Props |
|---|---------------|-------------|-------|
| 1 | Form container | `DSCard` | default (surfaceNeutral2, r32, pad xl) |
| 2 | Log In / Sign Up toggle | `DSSegmentedPicker` | items: ["Log In", "Sign Up"], .pills, containerBg: surfaceNeutral05 |
| 3 | "Welcome back!" text | `Text` | typography: caption, opacity: 0.6 |
| 4 | "Login" heading + logo | `HStack` | typography: h2 + Image("haho_logotype") 47×40 |
| 5 | Full Name input (Sign Up) | `DSTextField` + `DSFormField` | field: fullName, icon: .userCircle, bg: surfaceNeutral05 |
| 6 | Email input | `DSTextField` + `DSFormField` | field: email, icon: .mailOpen, bg: surfaceNeutral05 |
| 7 | Password input | `DSTextField` + `DSFormField` | field: password, icon: .eyeClosed, secure, bg: surfaceNeutral05 |
| 8 | Confirm Password (Sign Up) | `DSTextField` + `DSFormField` | field: confirmPassword, icon: .eyeClosed, secure |
| 9 | Remember me | `DSCheckbox` | label: "Remember me" (18×18, r xxs, border widthSm) |
| 10 | Forgot Password | `DSButton` | .text, .medium |
| 11 | CTA "Let's Roll!" | `DSButton` | .filledA, icon: .arrowRightLong right, .fullWidth() |
| 12 | Social container | `DSCard` | bg: surfacePrimary100, padding: 0 + manual xl all sides |
| 13 | "Continue with:" | `Text` | typography: h4, color: textNeutral05 |
| 14 | Google button | `DSButton` | .neutral, icon: .googleCircle, .fullWidth() |
| 15 | Facebook button | `DSButton` | .neutral, icon: .facebookTag, .fullWidth() |
| 16 | X button | `DSButton` | .neutral, icon: .x, .fullWidth() |

**16 elements mapped → 0 missing components**

<!-- SECTION: phase3 -->
## Phase 3: Full Property Extraction

**Form Card:**
- Background: `surfaceNeutral2` → DSCard default
- Radius: `32` → `theme.radius.xl` (DSCard default)
- Padding: `32` → `theme.spacing.xl` (DSCard default)
- Inner gap: `24` → `theme.spacing.lg`

**Input fields:**
- Background: `surfaceNeutral05` → `.fieldBackground(theme.colors.surfaceNeutral05)` (contrast against surfaceNeutral2 card)
- Labels: "Your Email", "Your Password" (NOT "Email", "Password")
- Validation: `DSFormField` with `.required()`, `.email()`, `.minLength(8)` rules

**Title section:**
- "Welcome back!" and "Login + logo" are SEPARATE children of the card VStack (24px gap each)
- NOT nested in a sub-VStack with xxs spacing — that collapses the gap
- Logo: `Image("haho_logotype")` 47×40, right-aligned via HStack + Spacer

**Checkbox:**
- Size: 18×18 (NOT 20×20)
- Corner radius: `theme.radius.xxs` (4px, NOT `xs` = 8px — too round)
- Border: `theme.borders.widthSm` (1px, NOT `widthMd` = 2px)
- Alignment: HStack `.center` (NOT `.top`)

**Forgot Password:**
- Style: `.text`, size: `.medium` — NOT `.small` (font too heavy with small)

**Social Card:**
- Background: `surfacePrimary100` (rgb 70,90,84) — NOT surfacePrimary120
- Padding: uniform `xl` (32px) all sides — NOT xxl (40px) vertical
- Button row spacing: `theme.spacing.sm` (12px) — NOT `xs` (8px)

**Page:**
- Background: `surfaceNeutral05`
- Horizontal content padding: `theme.spacing.sm`
- Card gap: `theme.spacing.sm`
- No navigation bar: `.toolbar(.hidden, for: .navigationBar)`

<!-- SECTION: phase4 -->
## Phase 4: Layout Structure

```
VStack(spacing: 0)
└── ScrollView
    └── VStack(spacing: sm)
        ├── DSCard (form — surfaceNeutral2 default)
        │   └── VStack(spacing: lg)
        │       ├── DSSegmentedPicker (pills, containerBg: surfaceNeutral05)
        │       ├── Text ("Welcome back!" / "Join the community!")
        │       ├── HStack (h2 title + logo)
        │       ├── [Sign Up] DSTextField (fullName — DSFormField)
        │       ├── DSTextField (email — DSFormField)
        │       ├── DSTextField (password — DSFormField, .secure())
        │       ├── [Sign Up] DSTextField (confirmPassword — DSFormField)
        │       ├── [Login] HStack (DSCheckbox + DSButton .text)
        │       ├── [Sign Up] DSCheckbox (Terms & Conditions)
        │       └── DSButton (CTA — .filledA, .fullWidth())
        └── DSCard (social — surfacePrimary100, padding: 0)
            └── VStack(spacing: lg) + manual padding xl
                ├── Text ("Continue with:" — h4, textNeutral05)
                └── HStack (3 social buttons — spacing: sm)
```

<!-- SECTION: phase5 -->
## Phase 5: Write Page Code

Writing `LoginView.swift`...

```swift
import SwiftUI
import DesignSystem

struct LoginView: View {
    @Environment(\.theme) private var theme

    @State private var pickerIndex = 0
    @StateObject private var fullName = DSFormField(rules: [.required("Name is required")])
    @StateObject private var email = DSFormField("omar@omardoucoure.com", rules: [.required("Email is required"), .email()])
    @StateObject private var password = DSFormField("password12345678", rules: [.required("Password is required"), .minLength(8)])
    @StateObject private var confirmPassword = DSFormField(rules: [.required("Please confirm your password")])
    @State private var rememberMe = false
    @State private var acceptTerms = false

    private var isSignUp: Bool { pickerIndex == 1 }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: theme.spacing.sm) {
                    formCard
                    socialCard
                }
                .padding(.horizontal, theme.spacing.sm)
                .padding(.bottom, theme.spacing.lg)
            }
            .scrollIndicators(.hidden)
        }
        .background(theme.colors.surfaceNeutral05)
        .toolbar(.hidden, for: .navigationBar)
        .animation(.easeInOut(duration: 0.25), value: pickerIndex)
        .onChange(of: pickerIndex) { _ in
            DSFormField.resetAll(fullName, email, password, confirmPassword)
        }
    }

    // MARK: - Form Card

    @ViewBuilder
    private var formCard: some View {
        DSCard {
            VStack(spacing: theme.spacing.lg) {
                DSSegmentedPicker(items: ["Log In", "Sign Up"], selectedIndex: $pickerIndex)
                    .pickerStyle(.pills)
                    .containerBackground(theme.colors.surfaceNeutral05)

                Text(isSignUp ? "Join the community!" : "Welcome back!")
                    .font(theme.typography.caption.font)
                    .tracking(theme.typography.caption.tracking)
                    .foregroundStyle(theme.colors.textNeutral9.opacity(0.6))
                    .frame(maxWidth: .infinity, alignment: .leading)

                HStack {
                    Text(isSignUp ? "Sign Up" : "Login")
                        .font(theme.typography.h2.font)
                        .tracking(theme.typography.h2.tracking)
                        .foregroundStyle(theme.colors.textNeutral9)
                    Spacer()
                    Image("haho_logotype")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 47, height: 40)
                }

                if isSignUp {
                    DSTextField(field: fullName, placeholder: "Enter your full name")
                        .label("Your Name").icon(.userCircle)
                        .fieldBackground(theme.colors.surfaceNeutral05)
                }

                DSTextField(field: email, placeholder: "Enter your email")
                    .label("Your Email").icon(.mailOpen)
                    .fieldBackground(theme.colors.surfaceNeutral05)

                DSTextField(field: password, placeholder: "Enter your password")
                    .label("Your Password").secure().icon(.eyeClosed)
                    .fieldBackground(theme.colors.surfaceNeutral05)

                if isSignUp {
                    DSTextField(field: confirmPassword, placeholder: "Confirm your password")
                        .label("Confirm Password").secure().icon(.eyeClosed)
                        .fieldBackground(theme.colors.surfaceNeutral05)
                }

                if isSignUp {
                    DSCheckbox(isOn: $acceptTerms).label("I accept the Terms & Conditions")
                } else {
                    HStack {
                        DSCheckbox(isOn: $rememberMe).label("Remember me")
                        Spacer()
                        DSButton("Forgot Password?") {
                            // TODO: Navigate to forgot password flow
                        }
                        .buttonStyle(.text).buttonSize(.medium)
                    }
                }

                DSButton(isSignUp ? "Create Account" : "Let's Roll!") {
                    if isSignUp {
                        DSFormField.validateAll(fullName, email, password, confirmPassword)
                    } else {
                        DSFormField.validateAll(email, password)
                    }
                }
                .buttonStyle(.filledA)
                .icon(.arrowRightLong, position: .right)
                .fullWidth()
            }
        }
    }

    // MARK: - Social Card

    @ViewBuilder
    private var socialCard: some View {
        DSCard {
            VStack(spacing: theme.spacing.lg) {
                Text("Continue with:")
                    .font(theme.typography.h4.font)
                    .tracking(theme.typography.h4.tracking)
                    .foregroundStyle(theme.colors.textNeutral05)
                    .frame(maxWidth: .infinity, alignment: .leading)

                HStack(spacing: theme.spacing.sm) {
                    DSButton {
                        /* TODO */
                    }
                    .buttonStyle(.neutral)
                    .icon(.googleCircle)
                    .fullWidth()

                    DSButton {
                        /* TODO */
                    }
                    .buttonStyle(.neutral)
                    .icon(.facebookTag)
                    .fullWidth()

                    DSButton {
                        /* TODO */
                    }
                    .buttonStyle(.neutral)
                    .icon(.x)
                    .fullWidth()
                }
            }
            .padding(.horizontal, theme.spacing.xl)
            .padding(.vertical, theme.spacing.xl)
        }
        .cardBackground(theme.colors.surfacePrimary100)
        .cardPadding(0)
    }
}
```

File written: `ios/DemoApp/DemoApp/LoginView.swift` (153 lines)

<!-- SECTION: phase6 -->
## Phase 6: Verification

All 16 Figma elements mapped to DS components. No raw SwiftUI styling used.

- ✅ All colors from `theme.colors.*`
- ✅ All spacing from `theme.spacing.*`
- ✅ All typography from `theme.typography.*`
- ✅ All radii from `theme.radius.*`
- ✅ Password fields use `.secure()`
- ✅ Input backgrounds contrast with card background (surfaceNeutral05 inside surfaceNeutral2)
- ✅ Social icons use brand-specific DS icons
- ✅ HaHo logo displayed next to title
- ✅ `DSFormField` handles validation (required, email, minLength)
- ✅ Login/Sign Up toggle changes form content with animation
- ✅ Checkbox: 18×18, radius xxs (4), border widthSm (1), center-aligned
- ✅ Social button row spacing: sm (12), card padding: xl (32) uniform
- ✅ Welcome text + title are separate VStack children (24px gap each)
- ✅ Multi-line DSButton closure style, @ViewBuilder on view fragments

Ready for build and pixel-perfect check.
