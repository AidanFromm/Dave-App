import SwiftUI

// MARK: - Shimmer Loading Animation

struct ShimmerView: View {
    @State private var isAnimating = false

    var body: some View {
        GeometryReader { geometry in
            LinearGradient(
                gradient: Gradient(colors: [
                    Color.securedCardBackground,
                    Color.securedCardBackground.opacity(0.5),
                    Color.securedCardBackground
                ]),
                startPoint: .leading,
                endPoint: .trailing
            )
            .frame(width: geometry.size.width * 2)
            .offset(x: isAnimating ? geometry.size.width : -geometry.size.width)
        }
        .clipped()
        .onAppear {
            withAnimation(
                Animation
                    .linear(duration: 1.5)
                    .repeatForever(autoreverses: false)
            ) {
                isAnimating = true
            }
        }
    }
}

// MARK: - Shimmer Modifier

struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .overlay(
                GeometryReader { geometry in
                    LinearGradient(
                        gradient: Gradient(stops: [
                            .init(color: .clear, location: 0),
                            .init(color: Color.white.opacity(0.4), location: 0.3),
                            .init(color: Color.white.opacity(0.6), location: 0.5),
                            .init(color: Color.white.opacity(0.4), location: 0.7),
                            .init(color: .clear, location: 1)
                        ]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .frame(width: geometry.size.width * 2)
                    .offset(x: -geometry.size.width + (phase * geometry.size.width * 2))
                }
                .mask(content)
            )
            .onAppear {
                withAnimation(
                    Animation
                        .linear(duration: 1.5)
                        .repeatForever(autoreverses: false)
                ) {
                    phase = 1
                }
            }
    }
}

extension View {
    func shimmer() -> some View {
        modifier(ShimmerModifier())
    }
}

// MARK: - Product Card Skeleton

struct ProductCardSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.sm) {
            // Image placeholder
            RoundedRectangle(cornerRadius: SecuredRadius.large)
                .fill(Color.securedCardBackground)
                .aspectRatio(1, contentMode: .fit)
                .shimmer()

            // Brand placeholder
            RoundedRectangle(cornerRadius: SecuredRadius.small)
                .fill(Color.securedCardBackground)
                .frame(width: 60, height: 12)
                .shimmer()

            // Name placeholder
            VStack(alignment: .leading, spacing: 4) {
                RoundedRectangle(cornerRadius: SecuredRadius.small)
                    .fill(Color.securedCardBackground)
                    .frame(height: 14)
                    .shimmer()

                RoundedRectangle(cornerRadius: SecuredRadius.small)
                    .fill(Color.securedCardBackground)
                    .frame(width: 100, height: 14)
                    .shimmer()
            }

            // Price placeholder
            RoundedRectangle(cornerRadius: SecuredRadius.small)
                .fill(Color.securedCardBackground)
                .frame(width: 80, height: 16)
                .shimmer()
        }
        .padding(SecuredSpacing.sm)
        .background(Color.securedCardBackground.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.large))
    }
}

// MARK: - Product Grid Skeleton

struct ProductGridSkeleton: View {
    let columns = [
        GridItem(.flexible(), spacing: SecuredSpacing.md),
        GridItem(.flexible(), spacing: SecuredSpacing.md)
    ]

    var body: some View {
        LazyVGrid(columns: columns, spacing: SecuredSpacing.md) {
            ForEach(0..<6, id: \.self) { _ in
                ProductCardSkeleton()
            }
        }
        .padding(.horizontal, SecuredSpacing.md)
    }
}

// MARK: - Hero Banner Skeleton

struct HeroBannerSkeleton: View {
    var body: some View {
        RoundedRectangle(cornerRadius: SecuredRadius.large)
            .fill(Color.securedCardBackground)
            .frame(height: 200)
            .shimmer()
            .padding(.horizontal, SecuredSpacing.md)
    }
}

// MARK: - Preview

#Preview {
    ScrollView {
        VStack(spacing: 24) {
            HeroBannerSkeleton()
            ProductGridSkeleton()
        }
    }
    .background(Color.securedBackground)
}
