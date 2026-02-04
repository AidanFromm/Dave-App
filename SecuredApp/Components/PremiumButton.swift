import SwiftUI

// MARK: - Premium Button Styles

enum PremiumButtonStyle {
    case primary      // Solid accent color
    case secondary    // Outlined
    case ghost        // Text only
    case destructive  // Red for delete/remove actions
}

enum PremiumButtonSize {
    case small
    case medium
    case large

    var height: CGFloat {
        switch self {
        case .small: return 36
        case .medium: return 48
        case .large: return 56
        }
    }

    var fontSize: CGFloat {
        switch self {
        case .small: return 14
        case .medium: return 16
        case .large: return 18
        }
    }

    var horizontalPadding: CGFloat {
        switch self {
        case .small: return SecuredSpacing.md
        case .medium: return SecuredSpacing.lg
        case .large: return SecuredSpacing.xl
        }
    }
}

// MARK: - Premium Button

struct PremiumButton: View {
    let title: String
    let icon: String?
    let style: PremiumButtonStyle
    let size: PremiumButtonSize
    let isLoading: Bool
    let isDisabled: Bool
    let action: () -> Void

    @State private var isPressed = false

    init(
        _ title: String,
        icon: String? = nil,
        style: PremiumButtonStyle = .primary,
        size: PremiumButtonSize = .medium,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.style = style
        self.size = size
        self.isLoading = isLoading
        self.isDisabled = isDisabled
        self.action = action
    }

    var body: some View {
        Button {
            if !isLoading && !isDisabled {
                action()
            }
        } label: {
            HStack(spacing: SecuredSpacing.sm) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(foregroundColor)
                        .scaleEffect(0.8)
                } else {
                    if let icon = icon {
                        Image(systemName: icon)
                            .font(.system(size: size.fontSize, weight: .semibold))
                    }

                    Text(title)
                        .font(.system(size: size.fontSize, weight: .semibold))
                }
            }
            .foregroundStyle(foregroundColor)
            .frame(height: size.height)
            .frame(maxWidth: .infinity)
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))
            .overlay {
                if style == .secondary {
                    RoundedRectangle(cornerRadius: SecuredRadius.medium)
                        .strokeBorder(borderColor, lineWidth: 1.5)
                }
            }
            .scaleEffect(isPressed ? 0.98 : 1.0)
            .opacity(isDisabled ? 0.5 : 1.0)
        }
        .buttonStyle(.plain)
        .disabled(isDisabled || isLoading)
        .sensoryFeedback(.impact(weight: .medium), trigger: isPressed)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    withAnimation(SecuredAnimation.quickSpring) {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    withAnimation(SecuredAnimation.quickSpring) {
                        isPressed = false
                    }
                }
        )
    }

    // MARK: - Colors

    private var foregroundColor: Color {
        switch style {
        case .primary:
            return .white
        case .secondary:
            return Color.securedAccent
        case .ghost:
            return Color.securedAccent
        case .destructive:
            return .white
        }
    }

    private var backgroundColor: Color {
        switch style {
        case .primary:
            return Color.securedAccent
        case .secondary:
            return Color.clear
        case .ghost:
            return Color.clear
        case .destructive:
            return Color.securedError
        }
    }

    private var borderColor: Color {
        switch style {
        case .secondary:
            return Color.securedAccent
        default:
            return Color.clear
        }
    }
}

// MARK: - Add to Cart Button

struct AddToCartButton: View {
    let price: String
    let isInStock: Bool
    let isLoading: Bool
    let action: () -> Void

    @State private var showSuccess = false

    var body: some View {
        Button {
            if isInStock && !isLoading {
                action()
                showSuccessAnimation()
            }
        } label: {
            HStack(spacing: SecuredSpacing.sm) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                        .scaleEffect(0.8)
                } else if showSuccess {
                    Image(systemName: "checkmark")
                        .font(.system(size: 18, weight: .bold))
                        .transition(.scale.combined(with: .opacity))
                } else {
                    Image(systemName: "bag.badge.plus")
                        .font(.system(size: 18, weight: .medium))

                    Text("Add to Cart")
                        .font(.system(size: 16, weight: .semibold))

                    Text("•")
                        .foregroundStyle(.white.opacity(0.6))

                    Text(price)
                        .font(.system(size: 16, weight: .bold))
                }
            }
            .foregroundStyle(.white)
            .frame(height: 56)
            .frame(maxWidth: .infinity)
            .background(isInStock ? Color.securedAccent : Color.securedTextSecondary)
            .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))
        }
        .buttonStyle(.plain)
        .disabled(!isInStock || isLoading)
        .sensoryFeedback(.success, trigger: showSuccess)
    }

    private func showSuccessAnimation() {
        withAnimation(SecuredAnimation.quickSpring) {
            showSuccess = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            withAnimation(SecuredAnimation.quickSpring) {
                showSuccess = false
            }
        }
    }
}

// MARK: - Icon Button

struct IconButton: View {
    let icon: String
    let size: CGFloat
    let action: () -> Void

    @State private var isPressed = false

    init(_ icon: String, size: CGFloat = 44, action: @escaping () -> Void) {
        self.icon = icon
        self.size = size
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: size * 0.4, weight: .medium))
                .foregroundStyle(Color.securedTextPrimary)
                .frame(width: size, height: size)
                .background(Color.securedCardBackground)
                .clipShape(Circle())
                .scaleEffect(isPressed ? 0.9 : 1.0)
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.selection, trigger: isPressed)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    withAnimation(SecuredAnimation.quickSpring) {
                        isPressed = true
                    }
                }
                .onEnded { _ in
                    withAnimation(SecuredAnimation.quickSpring) {
                        isPressed = false
                    }
                }
        )
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 24) {
        VStack(spacing: 12) {
            PremiumButton("Add to Cart", icon: "bag.badge.plus", action: {})

            PremiumButton("View Details", style: .secondary, action: {})

            PremiumButton("Learn More", style: .ghost, action: {})

            PremiumButton("Remove", icon: "trash", style: .destructive, action: {})
        }
        .padding(.horizontal)

        Divider()

        AddToCartButton(price: "$180", isInStock: true, isLoading: false, action: {})
            .padding(.horizontal)

        AddToCartButton(price: "$180", isInStock: false, isLoading: false, action: {})
            .padding(.horizontal)

        HStack(spacing: 16) {
            IconButton("heart", action: {})
            IconButton("square.and.arrow.up", action: {})
            IconButton("ellipsis", action: {})
        }
    }
    .padding(.vertical)
    .background(Color.securedBackground)
}
