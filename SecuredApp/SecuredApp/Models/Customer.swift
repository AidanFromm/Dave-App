//
//  Customer.swift
//  SecuredApp
//
//  Customer model
//

import Foundation

struct Address: Codable, Hashable {
    var firstName: String
    var lastName: String
    var street: String
    var apartment: String?
    var city: String
    var state: String
    var zipCode: String
    var country: String
    var phone: String?

    enum CodingKeys: String, CodingKey {
        case firstName = "first_name"
        case lastName = "last_name"
        case street, apartment, city, state
        case zipCode = "zip_code"
        case country, phone
    }

    var fullName: String {
        "\(firstName) \(lastName)"
    }

    var formattedAddress: String {
        var lines = [street]
        if let apt = apartment, !apt.isEmpty {
            lines[0] += ", \(apt)"
        }
        lines.append("\(city), \(state) \(zipCode)")
        return lines.joined(separator: "\n")
    }
}

struct SizeAlert: Codable, Hashable {
    let size: String
    let categoryId: UUID?

    enum CodingKeys: String, CodingKey {
        case size
        case categoryId = "category_id"
    }
}

struct Customer: Identifiable, Codable {
    let id: UUID
    let authUserId: UUID?
    let email: String
    let phone: String?
    let firstName: String?
    let lastName: String?
    var addresses: [Address]
    var defaultAddressIndex: Int
    var pushToken: String?
    var sizeAlerts: [SizeAlert]
    let marketingOptIn: Bool
    let totalOrders: Int
    let totalSpent: Decimal
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case authUserId = "auth_user_id"
        case email, phone
        case firstName = "first_name"
        case lastName = "last_name"
        case addresses
        case defaultAddressIndex = "default_address_index"
        case pushToken = "push_token"
        case sizeAlerts = "size_alerts"
        case marketingOptIn = "marketing_opt_in"
        case totalOrders = "total_orders"
        case totalSpent = "total_spent"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var fullName: String {
        [firstName, lastName].compactMap { $0 }.joined(separator: " ")
    }

    var defaultAddress: Address? {
        guard addresses.indices.contains(defaultAddressIndex) else { return nil }
        return addresses[defaultAddressIndex]
    }
}

extension Customer {
    static let preview = Customer(
        id: UUID(),
        authUserId: UUID(),
        email: "john@example.com",
        phone: "555-123-4567",
        firstName: "John",
        lastName: "Doe",
        addresses: [
            Address(
                firstName: "John",
                lastName: "Doe",
                street: "123 Main St",
                apartment: "Apt 4B",
                city: "Tampa",
                state: "FL",
                zipCode: "33601",
                country: "US",
                phone: "555-123-4567"
            )
        ],
        defaultAddressIndex: 0,
        pushToken: nil,
        sizeAlerts: [],
        marketingOptIn: true,
        totalOrders: 5,
        totalSpent: 750.00,
        createdAt: Date(),
        updatedAt: Date()
    )
}
