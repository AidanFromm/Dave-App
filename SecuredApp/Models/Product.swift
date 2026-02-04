//
//  Product.swift
//  SecuredApp
//
//  Product model matching Supabase schema
//

import Foundation

enum ProductCondition: String, Codable, CaseIterable {
    case new = "new"
    case usedLikeNew = "used_like_new"
    case usedGood = "used_good"
    case usedFair = "used_fair"

    var displayName: String {
        switch self {
        case .new: return "New"
        case .usedLikeNew: return "Like New"
        case .usedGood: return "Good"
        case .usedFair: return "Fair"
        }
    }
}

struct Product: Identifiable, Codable, Hashable {
    let id: UUID
    let sku: String?
    let barcode: String?
    let name: String
    let description: String?
    let categoryId: UUID?

    // Product specifics
    let brand: String?
    let size: String?
    let condition: ProductCondition
    let colorway: String?
    let hasBox: Bool

    // Pricing
    let price: Decimal
    let cost: Decimal?
    let compareAtPrice: Decimal?

    // Inventory
    var quantity: Int
    let lowStockThreshold: Int

    // Images
    let images: [String]

    // Drops
    let isDrop: Bool
    let dropDate: Date?

    // External listings
    let ebayListingId: String?
    let whatnotListingId: String?

    // Metadata
    let isActive: Bool
    let isFeatured: Bool
    let tags: [String]

    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, sku, barcode, name, description
        case categoryId = "category_id"
        case brand, size, condition, colorway
        case hasBox = "has_box"
        case price, cost
        case compareAtPrice = "compare_at_price"
        case quantity
        case lowStockThreshold = "low_stock_threshold"
        case images
        case isDrop = "is_drop"
        case dropDate = "drop_date"
        case ebayListingId = "ebay_listing_id"
        case whatnotListingId = "whatnot_listing_id"
        case isActive = "is_active"
        case isFeatured = "is_featured"
        case tags
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    // Computed properties
    var isInStock: Bool {
        quantity > 0
    }

    var isLowStock: Bool {
        quantity > 0 && quantity <= lowStockThreshold
    }

    var primaryImage: String? {
        images.first
    }

    var formattedPrice: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: price as NSDecimalNumber) ?? "$0.00"
    }

    /// Returns true if this is a new drop (isDrop is true and created within last 7 days)
    var isNewDrop: Bool {
        guard isDrop else { return false }

        // Check if created within the last 7 days
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        return createdAt >= sevenDaysAgo
    }

    /// Formatted compare-at price for display
    var formattedCompareAtPrice: String? {
        guard let compareAt = compareAtPrice else { return nil }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: compareAt as NSDecimalNumber)
    }

    /// Discount percentage from compare-at price
    var discountPercentage: Int? {
        guard let compareAt = compareAtPrice,
              compareAt > price else { return nil }
        let discount = ((compareAt - price) / compareAt) * 100
        return Int(truncating: discount as NSDecimalNumber)
    }

    /// Stock status for badge display
    var stockStatus: StockBadge.StockStatus {
        if quantity <= 0 {
            return .soldOut
        } else if isLowStock {
            return .lowStock
        } else {
            return .inStock
        }
    }
}

// Preview data
extension Product {
    static let preview = Product(
        id: UUID(),
        sku: "NK-AJ1-001",
        barcode: "123456789",
        name: "Air Jordan 1 Retro High OG",
        description: "The Air Jordan 1 Retro High OG brings back the classic silhouette.",
        categoryId: UUID(),
        brand: "Nike",
        size: "10",
        condition: .new,
        colorway: "Chicago",
        hasBox: true,
        price: 180.00,
        cost: 120.00,
        compareAtPrice: 200.00,
        quantity: 5,
        lowStockThreshold: 5,
        images: ["https://example.com/shoe1.jpg"],
        isDrop: false,
        dropDate: nil,
        ebayListingId: nil,
        whatnotListingId: nil,
        isActive: true,
        isFeatured: true,
        tags: ["jordan", "retro", "chicago"],
        createdAt: Date(),
        updatedAt: Date()
    )

    static let previewList: [Product] = [
        preview,
        Product(
            id: UUID(),
            sku: "NK-DUNK-002",
            barcode: "987654321",
            name: "Nike Dunk Low Panda",
            description: "Classic black and white colorway",
            categoryId: UUID(),
            brand: "Nike",
            size: "9.5",
            condition: .new,
            colorway: "Panda",
            hasBox: true,
            price: 110.00,
            cost: 70.00,
            compareAtPrice: nil,
            quantity: 12,
            lowStockThreshold: 5,
            images: [],
            isDrop: false,
            dropDate: nil,
            ebayListingId: nil,
            whatnotListingId: nil,
            isActive: true,
            isFeatured: false,
            tags: ["dunk", "panda"],
            createdAt: Date(),
            updatedAt: Date()
        )
    ]
}
