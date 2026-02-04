//
//  ProductDetailView.swift
//  SecuredApp
//
//  Premium product detail view with enhanced gallery, size selector, and animations
//

import SwiftUI

struct ProductDetailView: View {
    let product: Product
    @EnvironmentObject var cartViewModel: CartViewModel
    @EnvironmentObject var wishlistViewModel: WishlistViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var quantity = 1
    @State private var selectedSize: String?
    @State private var showingAddedAlert = false
    @State private var isAddingToCart = false
    @State private var showShareSheet = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Enhanced Image Gallery
                EnhancedImageGallery(
                    images: product.images,
                    productId: product.id
                )

                // Product Info Section
                VStack(alignment: .leading, spacing: SecuredSpacing.lg) {
                    // Header: Brand, Name, Wishlist
                    headerSection

                    // Price Section
                    priceSection

                    // Badges Row
                    badgesRow

                    Divider()
                        .padding(.vertical, SecuredSpacing.xs)

                    // Size Selector (if applicable)
                    if product.size != nil {
                        sizeSection
                    }

                    // Product Details
                    detailsSection

                    // Condition Details (for used items)
                    if product.condition != .new {
                        conditionSection
                    }

                    // Description
                    if let description = product.description, !description.isEmpty {
                        descriptionSection(description)
                    }
                }
                .padding(.horizontal, SecuredSpacing.md)
                .padding(.top, SecuredSpacing.lg)
                .padding(.bottom, 120) // Space for bottom bar
            }
        }
        .background(Color.securedBackground)
        .ignoresSafeArea(edges: .top)
        .safeAreaInset(edge: .bottom) {
            bottomActionBar
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: SecuredSpacing.sm) {
                    Button {
                        showShareSheet = true
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundStyle(Color.securedTextPrimary)
                    }
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: [product.name, product.formattedPrice])
        }
        .alert("Added to Cart", isPresented: $showingAddedAlert) {
            Button("Continue Shopping", role: .cancel) {}
        } message: {
            Text("\(quantity)x \(product.name) added to your cart")
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: SecuredSpacing.xs) {
                if let brand = product.brand {
                    Text(brand.uppercased())
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color.securedTextSecondary)
                        .tracking(1)
                }

                Text(product.name)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(Color.securedTextPrimary)
            }

            Spacer()

            WishlistButton(productId: product.id)
        }
    }

    // MARK: - Price Section

    private var priceSection: some View {
        HStack(alignment: .firstTextBaseline, spacing: SecuredSpacing.md) {
            Text(product.formattedPrice)
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(Color.securedAccent)

            if let compareAt = product.formattedCompareAtPrice {
                Text(compareAt)
                    .font(.body)
                    .strikethrough()
                    .foregroundStyle(Color.securedTextSecondary)

                if let discount = product.discountPercentage {
                    Text("\(discount)% OFF")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                        .padding(.horizontal, SecuredSpacing.sm)
                        .padding(.vertical, SecuredSpacing.xs)
                        .background(Color.securedConditionNew)
                        .clipShape(Capsule())
                }
            }
        }
    }

    // MARK: - Badges Row

    private var badgesRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: SecuredSpacing.sm) {
                if product.isNewDrop {
                    NewDropBadge()
                }

                ConditionBadge(condition: product.condition)

                StockBadge(status: product.stockStatus)

                if product.hasBox {
                    HStack(spacing: 4) {
                        Image(systemName: "shippingbox.fill")
                            .font(.system(size: 10))
                        Text("WITH BOX")
                            .font(.system(size: 10, weight: .semibold))
                    }
                    .foregroundStyle(Color.securedTextSecondary)
                    .padding(.horizontal, SecuredSpacing.sm)
                    .padding(.vertical, SecuredSpacing.xs)
                    .background(Color.securedCardBackground)
                    .clipShape(Capsule())
                }
            }
        }
    }

    // MARK: - Size Section

    private var sizeSection: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.sm) {
            HStack {
                Text("Size")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundStyle(Color.securedTextPrimary)

                Spacer()

                if let size = product.size {
                    Text("Available: \(size)")
                        .font(.subheadline)
                        .foregroundStyle(Color.securedAccent)
                }
            }

            // For single-size products, just show the size
            if let size = product.size {
                SizeChip(
                    size: size,
                    isSelected: true,
                    isAvailable: product.isInStock
                ) {}
            }
        }
    }

    // MARK: - Details Section

    private var detailsSection: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.md) {
            Text("Details")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(Color.securedTextPrimary)

            VStack(spacing: 0) {
                if let size = product.size {
                    DetailRowView(label: "Size", value: size)
                    Divider()
                }

                DetailRowView(label: "Condition", value: product.condition.displayName)
                Divider()

                if let colorway = product.colorway {
                    DetailRowView(label: "Colorway", value: colorway)
                    Divider()
                }

                DetailRowView(label: "Box Included", value: product.hasBox ? "Yes" : "No")

                if let sku = product.sku {
                    Divider()
                    DetailRowView(label: "SKU", value: sku)
                }
            }
            .background(Color.securedCardBackground)
            .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))
        }
    }

    // MARK: - Condition Section (for used items)

    private var conditionSection: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.md) {
            Text("Condition Details")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(Color.securedTextPrimary)

            VStack(alignment: .leading, spacing: SecuredSpacing.sm) {
                DetailedConditionBadge(condition: product.condition, hasBox: product.hasBox)

                Text(conditionDescription)
                    .font(.subheadline)
                    .foregroundStyle(Color.securedTextSecondary)
            }
            .padding(SecuredSpacing.md)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.securedCardBackground)
            .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))
        }
    }

    private var conditionDescription: String {
        switch product.condition {
        case .new:
            return "Brand new, never worn. Comes with original packaging."
        case .usedLikeNew:
            return "Worn once or twice with no visible signs of wear. Excellent condition."
        case .usedGood:
            return "Gently used with minor signs of wear. Overall good condition."
        case .usedFair:
            return "Shows visible wear and use. Priced accordingly."
        }
    }

    // MARK: - Description Section

    private func descriptionSection(_ description: String) -> some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.sm) {
            Text("About This Product")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(Color.securedTextPrimary)

            Text(description)
                .font(.body)
                .foregroundStyle(Color.securedTextSecondary)
                .lineSpacing(4)
        }
    }

    // MARK: - Bottom Action Bar

    private var bottomActionBar: some View {
        VStack(spacing: 0) {
            Divider()

            HStack(spacing: SecuredSpacing.md) {
                if product.isInStock {
                    // Quantity Selector
                    HStack(spacing: 0) {
                        Button {
                            if quantity > 1 {
                                withAnimation(SecuredAnimation.quickSpring) {
                                    quantity -= 1
                                }
                            }
                        } label: {
                            Image(systemName: "minus")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(quantity > 1 ? Color.securedTextPrimary : Color.securedTextSecondary)
                                .frame(width: 40, height: 40)
                        }
                        .disabled(quantity <= 1)

                        Text("\(quantity)")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundStyle(Color.securedTextPrimary)
                            .frame(width: 32)

                        Button {
                            if quantity < product.quantity {
                                withAnimation(SecuredAnimation.quickSpring) {
                                    quantity += 1
                                }
                            }
                        } label: {
                            Image(systemName: "plus")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(quantity < product.quantity ? Color.securedTextPrimary : Color.securedTextSecondary)
                                .frame(width: 40, height: 40)
                        }
                        .disabled(quantity >= product.quantity)
                    }
                    .background(Color.securedCardBackground)
                    .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))

                    // Add to Cart Button
                    AddToCartButton(
                        price: product.formattedPrice,
                        isInStock: product.isInStock,
                        isLoading: isAddingToCart
                    ) {
                        addToCart()
                    }
                } else {
                    PremiumButton(
                        "Out of Stock",
                        icon: "xmark.circle",
                        style: .secondary,
                        isDisabled: true
                    ) {}
                }
            }
            .padding(.horizontal, SecuredSpacing.md)
            .padding(.vertical, SecuredSpacing.md)
        }
        .background(.ultraThinMaterial)
    }

    // MARK: - Actions

    private func addToCart() {
        isAddingToCart = true

        // Simulate network delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            cartViewModel.addToCart(product, quantity: quantity)
            isAddingToCart = false
            showingAddedAlert = true
        }
    }
}

// MARK: - Enhanced Image Gallery

struct EnhancedImageGallery: View {
    let images: [String]
    let productId: UUID
    @State private var selectedIndex = 0
    @State private var scale: CGFloat = 1.0
    @State private var lastScale: CGFloat = 1.0
    @EnvironmentObject var wishlistViewModel: WishlistViewModel

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selectedIndex) {
                if images.isEmpty {
                    placeholderImage
                        .tag(0)
                } else {
                    ForEach(Array(images.enumerated()), id: \.offset) { index, imageUrl in
                        ZoomableImageView(url: imageUrl)
                            .tag(index)
                    }
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 400)
            .background(Color.securedCardBackground)

            // Custom Page Indicator
            if images.count > 1 {
                HStack(spacing: SecuredSpacing.sm) {
                    ForEach(0..<images.count, id: \.self) { index in
                        Capsule()
                            .fill(index == selectedIndex ? Color.securedAccent : Color.white.opacity(0.5))
                            .frame(width: index == selectedIndex ? 24 : 8, height: 8)
                            .animation(SecuredAnimation.spring, value: selectedIndex)
                    }
                }
                .padding(.bottom, SecuredSpacing.md)
            }
        }
    }

    private var placeholderImage: some View {
        Rectangle()
            .fill(Color.securedCardBackground)
            .overlay {
                VStack(spacing: SecuredSpacing.sm) {
                    Image(systemName: "photo")
                        .font(.system(size: 48))
                        .foregroundStyle(Color.securedTextSecondary)

                    Text("No Image Available")
                        .font(.subheadline)
                        .foregroundStyle(Color.securedTextSecondary)
                }
            }
    }
}

// MARK: - Zoomable Image View

struct ZoomableImageView: View {
    let url: String
    @State private var scale: CGFloat = 1.0
    @State private var lastScale: CGFloat = 1.0
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero

    var body: some View {
        AsyncImage(url: URL(string: url)) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .scaleEffect(scale)
                    .offset(offset)
                    .gesture(
                        MagnificationGesture()
                            .onChanged { value in
                                let delta = value / lastScale
                                lastScale = value
                                scale = min(max(scale * delta, 1), 4)
                            }
                            .onEnded { _ in
                                lastScale = 1.0
                                if scale < 1.2 {
                                    withAnimation(SecuredAnimation.spring) {
                                        scale = 1.0
                                        offset = .zero
                                    }
                                }
                            }
                    )
                    .simultaneousGesture(
                        DragGesture()
                            .onChanged { value in
                                if scale > 1 {
                                    offset = CGSize(
                                        width: lastOffset.width + value.translation.width,
                                        height: lastOffset.height + value.translation.height
                                    )
                                }
                            }
                            .onEnded { _ in
                                lastOffset = offset
                            }
                    )
                    .onTapGesture(count: 2) {
                        withAnimation(SecuredAnimation.spring) {
                            if scale > 1 {
                                scale = 1.0
                                offset = .zero
                                lastOffset = .zero
                            } else {
                                scale = 2.0
                            }
                        }
                    }
            case .failure:
                Rectangle()
                    .fill(Color.securedCardBackground)
                    .overlay {
                        Image(systemName: "photo")
                            .font(.largeTitle)
                            .foregroundStyle(Color.securedTextSecondary)
                    }
            case .empty:
                Rectangle()
                    .fill(Color.securedCardBackground)
                    .shimmer()
            @unknown default:
                EmptyView()
            }
        }
    }
}

// MARK: - Detail Row View

struct DetailRowView: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(Color.securedTextSecondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(Color.securedTextPrimary)
        }
        .padding(.horizontal, SecuredSpacing.md)
        .padding(.vertical, SecuredSpacing.sm + 2)
    }
}

// MARK: - Share Sheet

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - Preview

#Preview {
    NavigationStack {
        ProductDetailView(product: MockData.airJordan1Travis)
            .environmentObject(CartViewModel())
            .environmentObject(WishlistViewModel())
    }
}
