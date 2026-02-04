//
//  Category.swift
//  SecuredApp
//
//  Product category model
//

import Foundation

struct Category: Identifiable, Codable, Hashable {
    let id: UUID
    let name: String
    let slug: String
    let description: String?
    let imageUrl: String?
    let sortOrder: Int
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, slug, description
        case imageUrl = "image_url"
        case sortOrder = "sort_order"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// Default categories for preview/testing
extension Category {
    static let preview = Category(
        id: UUID(),
        name: "New Sneakers",
        slug: "new-sneakers",
        description: "Brand new sneakers",
        imageUrl: nil,
        sortOrder: 1,
        isActive: true,
        createdAt: Date(),
        updatedAt: Date()
    )

    static let previewList: [Category] = [
        Category(id: UUID(), name: "New Sneakers", slug: "new-sneakers", description: nil, imageUrl: nil, sortOrder: 1, isActive: true, createdAt: Date(), updatedAt: Date()),
        Category(id: UUID(), name: "Used Sneakers", slug: "used-sneakers", description: nil, imageUrl: nil, sortOrder: 2, isActive: true, createdAt: Date(), updatedAt: Date()),
        Category(id: UUID(), name: "Pokemon", slug: "pokemon", description: nil, imageUrl: nil, sortOrder: 3, isActive: true, createdAt: Date(), updatedAt: Date())
    ]
}
