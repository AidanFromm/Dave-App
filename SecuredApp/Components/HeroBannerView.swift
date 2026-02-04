import SwiftUI

// MARK: - Hero Banner View

struct HeroBannerView: View {
    let products: [Product]
    let onProductTap: (Product) -> Void

    @State private var currentIndex = 0
    @State private var timer: Timer?

    var body: some View {
        VStack(spacing: SecuredSpacing.sm) {
            // Banner Carousel
            TabView(selection: $currentIndex) {
                ForEach(Array(products.enumerated()), id: \.element.id) { index, product in
                    HeroBannerCard(product: product)
                        .onTapGesture {
                            onProductTap(product)
                        }
                        .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 200)
            .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.large))
            .padding(.horizontal, SecuredSpacing.md)

            // Page Indicators
            HStack(spacing: SecuredSpacing.sm) {
                ForEach(0..<products.count, id: \.self) { index in
                    Capsule()
                        .fill(index == currentIndex ? Color.securedAccent : Color.securedTextSecondary.opacity(0.3))
                        .frame(width: index == currentIndex ? 24 : 8, height: 8)
                        .animation(SecuredAnimation.spring, value: currentIndex)
                }
            }
        }
        .onAppear {
            startAutoScroll()
        }
        .onDisappear {
            stopAutoScroll()
        }
        .onChange(of: currentIndex) { _, _ in
            // Reset timer on manual swipe
            restartAutoScroll()
        }
    }

    // MARK: - Auto-Scroll Logic

    private func startAutoScroll() {
        guard products.count > 1 else { return }

        timer = Timer.scheduledTimer(withTimeInterval: SecuredAnimation.heroBannerInterval, repeats: true) { _ in
            withAnimation(SecuredAnimation.spring) {
                currentIndex = (currentIndex + 1) % products.count
            }
        }
    }

    private func stopAutoScroll() {
        timer?.invalidate()
        timer = nil
    }

    private func restartAutoScroll() {
        stopAutoScroll()
        startAutoScroll()
    }
}

// MARK: - Hero Banner Card

struct HeroBannerCard: View {
    let product: Product

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .bottomLeading) {
                // Background Image
                AsyncImage(url: URL(string: product.primaryImage ?? "")) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                            .frame(width: geometry.size.width, height: geometry.size.height)
                            .clipped()
                    case .failure:
                        placeholderView(geometry: geometry)
                    case .empty:
                        placeholderView(geometry: geometry)
                            .shimmer()
                    @unknown default:
                        placeholderView(geometry: geometry)
                    }
                }

                // Gradient Overlay
                LinearGradient.heroOverlay

                // Content Overlay
                VStack(alignment: .leading, spacing: SecuredSpacing.xs) {
                    // Badges
                    HStack(spacing: SecuredSpacing.sm) {
                        if product.isNewDrop {
                            NewDropBadge()
                        }
                        if product.isFeatured {
                            FeaturedBadge()
                        }
                    }

                    Spacer()

                    // Product Info
                    VStack(alignment: .leading, spacing: 4) {
                        Text(product.brand?.uppercased() ?? "")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundStyle(.white.opacity(0.8))

                        Text(product.name)
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundStyle(.white)
                            .lineLimit(2)

                        HStack(spacing: SecuredSpacing.sm) {
                            Text(product.formattedPrice)
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundStyle(Color.securedAccent)

                            if let compareAt = product.formattedCompareAtPrice {
                                Text(compareAt)
                                    .font(.subheadline)
                                    .strikethrough()
                                    .foregroundStyle(.white.opacity(0.6))
                            }
                        }
                    }
                }
                .padding(SecuredSpacing.md)
            }
        }
    }

    private func placeholderView(geometry: GeometryProxy) -> some View {
        Rectangle()
            .fill(Color.securedCardBackground)
            .frame(width: geometry.size.width, height: geometry.size.height)
            .overlay {
                Image(systemName: "photo")
                    .font(.largeTitle)
                    .foregroundStyle(Color.securedTextSecondary)
            }
    }
}

// MARK: - Compact Banner (for smaller spaces)

struct CompactBannerView: View {
    let product: Product
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: SecuredSpacing.md) {
                // Image
                AsyncImage(url: URL(string: product.primaryImage ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.securedCardBackground)
                        .shimmer()
                }
                .frame(width: 80, height: 80)
                .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))

                // Info
                VStack(alignment: .leading, spacing: SecuredSpacing.xs) {
                    if product.isNewDrop {
                        NewDropBadge()
                    }

                    Text(product.name)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color.securedTextPrimary)
                        .lineLimit(2)

                    Text(product.formattedPrice)
                        .font(.headline)
                        .foregroundStyle(Color.securedAccent)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(Color.securedTextSecondary)
            }
            .padding(SecuredSpacing.md)
            .background(Color.securedCardBackground)
            .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.large))
            .securedCardShadow()
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Preview

#Preview {
    ScrollView {
        VStack(spacing: 24) {
            HeroBannerView(
                products: MockData.featuredProducts,
                onProductTap: { _ in }
            )

            Text("Compact Banner")
                .font(.headline)

            CompactBannerView(
                product: MockData.airJordan1Travis,
                onTap: {}
            )
            .padding(.horizontal)
        }
    }
    .background(Color.securedBackground)
}
