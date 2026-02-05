import SwiftUI

// MARK: - Secured App Color System
// Brand color palette with automatic light/dark mode support

extension Color {

    // MARK: - Primary Colors

    /// Primary accent color - Main CTAs, buttons, badges
    /// Light: #FB4F14, Dark: #FF6B3D
    static let securedAccent = Color("AccentPrimary")

    /// Primary hover/pressed state
    /// Light: #E54510, Dark: #FF8A5C
    static let securedAccentHover = Color("PrimaryHover")

    /// Secondary accent color
    /// Light: #002244, Dark: #4A7DB8
    static let securedSecondary = Color("AccentSecondary")

    // MARK: - Background Colors

    /// Main background
    /// Light: #FFFFFF, Dark: #0D0D0D
    static let securedBackground = Color("BackgroundPrimary")

    /// Card/Surface background
    /// Light: #F5F5F7, Dark: #1A1A1A
    static let securedCardBackground = Color("BackgroundSecondary")

    /// Surface alias for semantic clarity
    static let securedSurface = Color("BackgroundSecondary")

    /// Elevated surface for modals/sheets
    /// Light: #EAEAEC, Dark: #252525
    static let securedElevated = Color("BackgroundElevated")

    /// Surface secondary alias
    static let securedSurfaceSecondary = Color("BackgroundElevated")

    // MARK: - Text Colors

    /// Primary text - Headlines
    /// Light: #1A1A1A, Dark: #FFFFFF
    static let securedTextPrimary = Color("TextPrimary")

    /// Secondary text - Body text
    /// Light: #6B6B6B, Dark: #A0A0A0
    static let securedTextSecondary = Color("TextSecondary")

    /// Muted text - Captions, placeholders
    /// Light: #9A9A9A, Dark: #666666
    static let securedTextMuted = Color("TextMuted")

    // MARK: - Border Colors

    /// Dividers and borders
    /// Light: #E5E5E5, Dark: #2A2A2A
    static let securedBorder = Color("Border")

    // MARK: - Condition Badge Colors

    /// New condition badge
    /// Light: #34C759, Dark: #30D158
    static let securedConditionNew = Color("ConditionNew")

    /// Used condition badge
    /// Light: #007AFF, Dark: #0A84FF
    static let securedConditionUsed = Color("ConditionUsed")

    // MARK: - Status Colors

    /// Success state
    /// Light: #34C759, Dark: #30D158
    static let securedSuccess = Color("StatusSuccess")

    /// Warning state
    /// Light: #FF9500, Dark: #FFA726
    static let securedWarning = Color("StatusWarning")

    /// Error state
    /// Light: #FF3B30, Dark: #FF453A
    static let securedError = Color("StatusError")

    /// Info state
    /// Light: #007AFF, Dark: #0A84FF
    static let securedInfo = Color("Info")

    // MARK: - Legacy Aliases (for backward compatibility)

    static let securedAccentSecondary = securedSecondary

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
        colors: [Color.securedAccent, Color.securedAccentHover],
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

    // MARK: - Splash Screen Animations

    /// Splash screen logo entry animation
    static let splashEntry = Animation.spring(response: 0.6, dampingFraction: 0.8)

    /// Splash screen underline draw animation
    static let splashUnderline = Animation.easeOut(duration: 0.6)

    /// Splash screen exit animation
    static let splashExit = Animation.easeInOut(duration: 0.3)
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
