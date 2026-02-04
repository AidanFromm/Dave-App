//
//  ProductGridView.swift
//  SecuredApp
//
//  Grid display of products
//

import SwiftUI

struct ProductGridView: View {
    let products: [Product]

    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]

    var body: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 16) {
                ForEach(products) { product in
                    NavigationLink(destination: ProductDetailView(product: product)) {
                        ProductCardView(product: product)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
    }
}

struct ProductCardView: View {
    let product: Product

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Product image
            ZStack(alignment: .topTrailing) {
                AsyncImage(url: URL(string: product.primaryImage ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color(.systemGray5))
                        .overlay {
                            Image(systemName: "photo")
                                .font(.largeTitle)
                                .foregroundStyle(.gray)
                        }
                }
                .frame(height: 180)
                .clipShape(RoundedRectangle(cornerRadius: 12))

                // Stock badge
                if !product.isInStock {
                    Text("Sold Out")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.red)
                        .clipShape(Capsule())
                        .padding(8)
                } else if product.isLowStock {
                    Text("Low Stock")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.orange)
                        .clipShape(Capsule())
                        .padding(8)
                }
            }

            // Product info
            VStack(alignment: .leading, spacing: 4) {
                if let brand = product.brand {
                    Text(brand.uppercased())
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                Text(product.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)

                HStack {
                    if let size = product.size {
                        Text("Size \(size)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    if product.condition != .new {
                        Text("• \(product.condition.displayName)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                HStack {
                    Text(product.formattedPrice)
                        .font(.headline)
                        .fontWeight(.bold)

                    if let compareAt = product.compareAtPrice, compareAt > product.price {
                        Text(formatPrice(compareAt))
                            .font(.caption)
                            .strikethrough()
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private func formatPrice(_ price: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: price as NSDecimalNumber) ?? ""
    }
}

#Preview {
    NavigationStack {
        ProductGridView(products: Product.previewList)
    }
}
