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
