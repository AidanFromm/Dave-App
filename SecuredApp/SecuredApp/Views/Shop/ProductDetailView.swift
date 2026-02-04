//
//  ProductDetailView.swift
//  SecuredApp
//
//  Detailed product view with add to cart
//

import SwiftUI

struct ProductDetailView: View {
    let product: Product
    @EnvironmentObject var cartViewModel: CartViewModel
    @State private var quantity = 1
    @State private var showingAddedAlert = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Image gallery
                ProductImageGallery(images: product.images)

                VStack(alignment: .leading, spacing: 16) {
                    // Brand & Name
                    VStack(alignment: .leading, spacing: 4) {
                        if let brand = product.brand {
                            Text(brand.uppercased())
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }

                        Text(product.name)
                            .font(.title2)
                            .fontWeight(.bold)
                    }

                    // Price
                    HStack(alignment: .firstTextBaseline) {
                        Text(product.formattedPrice)
                            .font(.title)
                            .fontWeight(.bold)

                        if let compareAt = product.compareAtPrice, compareAt > product.price {
                            Text(formatPrice(compareAt))
                                .font(.body)
                                .strikethrough()
                                .foregroundStyle(.secondary)

                            let savings = compareAt - product.price
                            Text("Save \(formatPrice(savings))")
                                .font(.caption)
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(.green)
                                .clipShape(Capsule())
                        }
                    }

                    Divider()

                    // Product details
                    VStack(alignment: .leading, spacing: 12) {
                        if let size = product.size {
                            DetailRow(label: "Size", value: size)
                        }

                        DetailRow(label: "Condition", value: product.condition.displayName)

                        if let colorway = product.colorway {
                            DetailRow(label: "Colorway", value: colorway)
                        }

                        DetailRow(label: "Box Included", value: product.hasBox ? "Yes" : "No")

                        if let sku = product.sku {
                            DetailRow(label: "SKU", value: sku)
                        }
                    }

                    Divider()

                    // Stock status
                    HStack {
                        Circle()
                            .fill(product.isInStock ? .green : .red)
                            .frame(width: 8, height: 8)

                        Text(product.isInStock ? "In Stock (\(product.quantity) available)" : "Out of Stock")
                            .font(.subheadline)
                            .foregroundStyle(product.isInStock ? .primary : .red)
                    }

                    // Description
                    if let description = product.description {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Description")
                                .font(.headline)

                            Text(description)
                                .font(.body)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .safeAreaInset(edge: .bottom) {
            // Add to cart section
            VStack(spacing: 12) {
                Divider()

                if product.isInStock {
                    HStack {
                        // Quantity selector
                        HStack {
                            Button {
                                if quantity > 1 { quantity -= 1 }
                            } label: {
                                Image(systemName: "minus")
                                    .frame(width: 32, height: 32)
                            }
                            .disabled(quantity <= 1)

                            Text("\(quantity)")
                                .font(.headline)
                                .frame(width: 40)

                            Button {
                                if quantity < product.quantity { quantity += 1 }
                            } label: {
                                Image(systemName: "plus")
                                    .frame(width: 32, height: 32)
                            }
                            .disabled(quantity >= product.quantity)
                        }
                        .padding(.horizontal, 8)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                        // Add to cart button
                        Button {
                            cartViewModel.addToCart(product, quantity: quantity)
                            showingAddedAlert = true
                        } label: {
                            HStack {
                                Image(systemName: "cart.badge.plus")
                                Text("Add to Cart")
                            }
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(.primary)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                } else {
                    Button {} label: {
                        Text("Out of Stock")
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(.gray)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(true)
                }
            }
            .padding()
            .background(.ultraThinMaterial)
        }
        .navigationBarTitleDisplayMode(.inline)
        .alert("Added to Cart", isPresented: $showingAddedAlert) {
            Button("Continue Shopping", role: .cancel) {}
        } message: {
            Text("\(quantity)x \(product.name) added to your cart")
        }
    }

    private func formatPrice(_ price: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: price as NSDecimalNumber) ?? ""
    }
}

struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
        .font(.subheadline)
    }
}

struct ProductImageGallery: View {
    let images: [String]
    @State private var selectedIndex = 0

    var body: some View {
        TabView(selection: $selectedIndex) {
            if images.isEmpty {
                PlaceholderImage()
                    .tag(0)
            } else {
                ForEach(Array(images.enumerated()), id: \.offset) { index, imageUrl in
                    AsyncImage(url: URL(string: imageUrl)) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } placeholder: {
                        PlaceholderImage()
                    }
                    .tag(index)
                }
            }
        }
        .tabViewStyle(.page(indexDisplayMode: images.count > 1 ? .always : .never))
        .frame(height: 350)
        .background(Color(.systemGray6))
    }
}

struct PlaceholderImage: View {
    var body: some View {
        Rectangle()
            .fill(Color(.systemGray5))
            .overlay {
                Image(systemName: "photo")
                    .font(.system(size: 50))
                    .foregroundStyle(.gray)
            }
    }
}

#Preview {
    NavigationStack {
        ProductDetailView(product: Product.preview)
            .environmentObject(CartViewModel())
    }
}
