//
//  ProductGridView.swift
//  SecuredApp
//
//  Premium product grid with enhanced cards, badges, and animations
//

import SwiftUI

struct ProductGridView: View {
    let products: [Product]
    var animation: Namespace.ID?

    private let columns = [
        GridItem(.flexible(), spacing: SecuredSpacing.md),
        GridItem(.flexible(), spacing: SecuredSpacing.md)
    ]

    var body: some View {
        LazyVGrid(columns: columns, spacing: SecuredSpacing.md) {
            ForEach(Array(products.enumerated()), id: \.element.id) { index, product in
                NavigationLink(destination: ProductDetailView(product: product)) {
                    ProductCardView(product: product, index: index)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, SecuredSpacing.md)
    }
}

// MARK: - Product Card View

struct ProductCardView: View {
    let product: Product
    var index: Int = 0
    @EnvironmentObject var wishlistViewModel: WishlistViewModel
    @State private var isPressed = false
    @State private var hasAppeared = false

    var body: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.sm) {
            // Product Image with Overlays
            imageSection

            // Product Info
            infoSection
        }
        .background(Color.securedCardBackground)
        .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.large))
        .securedCardShadow()
        .scaleEffect(isPressed ? 0.97 : 1.0)
        .opacity(hasAppeared ? 1 : 0)
        .offset(y: hasAppeared ? 0 : 20)
        .onAppear {
            withAnimation(
                SecuredAnimation.spring.delay(Double(index) * SecuredAnimation.staggerDelay)
            ) {
                hasAppeared = true
            }
        }
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

    // MARK: - Image Section

    private var imageSection: some View {
        ZStack(alignment: .topLeading) {
            // Product Image
            AsyncImage(url: URL(string: product.primaryImage ?? "")) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                case .failure:
                    imagePlaceholder
                case .empty:
                    imagePlaceholder
                        .shimmer()
                @unknown default:
                    imagePlaceholder
                }
            }
            .frame(height: 180)
            .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.large - 4))
            .padding(SecuredSpacing.xs)

            // Overlays
            VStack(alignment: .leading, spacing: SecuredSpacing.xs) {
                HStack {
                    // New Drop Badge (top-left)
                    if product.isNewDrop {
                        NewDropBadge()
                    }

                    Spacer()

                    // Wishlist Button (top-right)
                    CompactWishlistButton(productId: product.id)
                }

                Spacer()

                // Condition Badge (bottom-left)
                HStack {
                    ConditionBadge(condition: product.condition)

                    Spacer()

                    // Discount Badge
                    if let discount = product.discountPercentage, discount > 0 {
                        SaleBadge(percentage: discount)
                    }
                }
            }
            .padding(SecuredSpacing.sm + SecuredSpacing.xs)
        }
    }

    private var imagePlaceholder: some View {
        Rectangle()
            .fill(Color.securedCardBackground)
            .overlay {
                Image(systemName: "photo")
                    .font(.title)
                    .foregroundStyle(Color.securedTextSecondary)
            }
    }

    // MARK: - Info Section

    private var infoSection: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.xs) {
            // Brand
            if let brand = product.brand {
                Text(brand.uppercased())
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(Color.securedTextSecondary)
                    .tracking(0.5)
            }

            // Name
            Text(product.name)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(Color.securedTextPrimary)
                .lineLimit(2)
                .multilineTextAlignment(.leading)

            // Size & Stock
            HStack(spacing: SecuredSpacing.xs) {
                if let size = product.size {
                    Text("Size \(size)")
                        .font(.caption)
                        .foregroundStyle(Color.securedTextSecondary)
                }

                if !product.isInStock {
                    StockBadge(status: .soldOut)
                } else if product.isLowStock {
                    StockBadge(status: .lowStock)
                }
            }

            // Price
            HStack(spacing: SecuredSpacing.sm) {
                Text(product.formattedPrice)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundStyle(Color.securedAccent)

                if let compareAt = product.formattedCompareAtPrice {
                    Text(compareAt)
                        .font(.caption)
                        .strikethrough()
                        .foregroundStyle(Color.securedTextSecondary)
                }
            }
        }
        .padding(.horizontal, SecuredSpacing.sm)
        .padding(.bottom, SecuredSpacing.md)
    }
}

// MARK: - Quick Action Card (alternative compact style)

struct QuickActionProductCard: View {
    let product: Product
    let onTap: () -> Void
    let onAddToCart: () -> Void

    var body: some View {
        HStack(spacing: SecuredSpacing.md) {
            // Image
            AsyncImage(url: URL(string: product.primaryImage ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color.securedCardBackground)
            }
            .frame(width: 80, height: 80)
            .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))

            // Info
            VStack(alignment: .leading, spacing: SecuredSpacing.xs) {
                Text(product.brand?.uppercased() ?? "")
                    .font(.caption2)
                    .foregroundStyle(Color.securedTextSecondary)

                Text(product.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(Color.securedTextPrimary)
                    .lineLimit(2)

                Text(product.formattedPrice)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundStyle(Color.securedAccent)
            }

            Spacer()

            // Quick Add Button
            Button(action: onAddToCart) {
                Image(systemName: "plus")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(Color.securedAccent)
                    .clipShape(Circle())
            }
            .disabled(!product.isInStock)
            .opacity(product.isInStock ? 1 : 0.5)
        }
        .padding(SecuredSpacing.md)
        .background(Color.securedCardBackground)
        .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.large))
        .securedCardShadow()
        .onTapGesture(perform: onTap)
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        ScrollView {
            ProductGridView(products: MockData.products)
        }
        .background(Color.securedBackground)
    }
    .environmentObject(WishlistViewModel())
}
