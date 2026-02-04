import SwiftUI

// MARK: - Secured App Color System
// Premium Nike/Adidas-inspired color palette with automatic light/dark mode support

extension Color {

    // MARK: - Accent Colors

    /// Primary accent color - Red/Orange for CTAs, badges, selected states
    /// Light: #FF4D00, Dark: #FF6B2C
    static let securedAccent = Color("AccentPrimary")

    /// Secondary accent - slightly lighter variant
    static let securedAccentSecondary = Color("AccentSecondary")

    // MARK: - Background Colors

    /// Main background - Light: White, Dark: Black
    static let securedBackground = Color("BackgroundPrimary")

    /// Card/Surface background - Light: #F5F5F5, Dark: #1C1C1E
    static let securedCardBackground = Color("BackgroundSecondary")

    /// Elevated surface for modals/sheets
    static let securedElevated = Color("BackgroundElevated")

    // MARK: - Text Colors

    /// Primary text - Headlines - Light: #111111, Dark: #FFFFFF
    static let securedTextPrimary = Color("TextPrimary")

    /// Secondary text - Captions - Light: #757575, Dark: #8E8E93
    static let securedTextSecondary = Color("TextSecondary")

    // MARK: - Condition Badge Colors

    /// New condition badge - Light: #00A86B, Dark: #34C759
    static let securedConditionNew = Color("ConditionNew")

    /// Used condition badge - Light: #007AFF, Dark: #0A84FF
    static let securedConditionUsed = Color("ConditionUsed")

    // MARK: - Status Colors

    /// Success state
    static let securedSuccess = Color("StatusSuccess")

    /// Warning state
    static let securedWarning = Color("StatusWarning")

    /// Error state
    static let securedError = Color("StatusError")

    // MARK: - Semantic Helpers

    /// Accent color with specified opacity
    static func securedAccent(opacity: Double) -> Color {
        securedAccent.opacity(opacity)
    }

    /// Card background with overlay for hover/press states
    static var securedCardPressed: Color {
        securedCardBackground.opacity(0.7)
    }
}

// MARK: - Color Scheme Extension

extension ColorScheme {
    var isLight: Bool {
        self == .light
    }

    var isDark: Bool {
        self == .dark
    }
}

// MARK: - Gradient Definitions

extension LinearGradient {
    /// Premium accent gradient for CTAs
    static let securedAccentGradient = LinearGradient(
        colors: [Color.securedAccent, Color.securedAccentSecondary],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    /// Subtle fade gradient for hero overlays
    static let heroOverlay = LinearGradient(
        colors: [.clear, .black.opacity(0.6)],
        startPoint: .top,
        endPoint: .bottom
    )

    /// Card shimmer gradient for loading states
    static func shimmer(isAnimating: Bool) -> LinearGradient {
        LinearGradient(
            colors: [
                Color.securedCardBackground.opacity(0.3),
                Color.securedCardBackground.opacity(0.6),
                Color.securedCardBackground.opacity(0.3)
            ],
            startPoint: isAnimating ? .leading : .trailing,
            endPoint: isAnimating ? .trailing : .leading
        )
    }
}

// MARK: - Shadow Styles

extension View {
    /// Premium card shadow
    func securedCardShadow() -> some View {
        self.shadow(
            color: Color.black.opacity(0.08),
            radius: 12,
            x: 0,
            y: 4
        )
    }

    /// Elevated shadow for floating elements
    func securedElevatedShadow() -> some View {
        self.shadow(
            color: Color.black.opacity(0.15),
            radius: 20,
            x: 0,
            y: 8
        )
    }

    /// Subtle shadow for interactive elements
    func securedSubtleShadow() -> some View {
        self.shadow(
            color: Color.black.opacity(0.05),
            radius: 4,
            x: 0,
            y: 2
        )
    }
}

// MARK: - Animation Constants

struct SecuredAnimation {
    /// Standard spring animation for UI interactions
    static let spring = Animation.spring(response: 0.3, dampingFraction: 0.7)

    /// Quick spring for micro-interactions
    static let quickSpring = Animation.spring(response: 0.2, dampingFraction: 0.8)

    /// Smooth easing for transitions
    static let smooth = Animation.easeInOut(duration: 0.25)

    /// Hero banner auto-scroll interval
    static let heroBannerInterval: Double = 5.0

    /// Stagger delay for grid items
    static let staggerDelay: Double = 0.05

    /// Tab selection animation
    static let tabSelection = Animation.spring(response: 0.3, dampingFraction: 0.8)
}

// MARK: - Corner Radius Constants

struct SecuredRadius {
    static let small: CGFloat = 8
    static let medium: CGFloat = 12
    static let large: CGFloat = 16
    static let extraLarge: CGFloat = 24
    static let pill: CGFloat = 100
}

// MARK: - Spacing Constants

struct SecuredSpacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
    static let xxl: CGFloat = 48
}
