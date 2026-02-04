//
//  Order.swift
//  SecuredApp
//
//  Order model
//

import Foundation

enum OrderStatus: String, Codable, CaseIterable {
    case pending
    case paid
    case processing
    case shipped
    case delivered
    case cancelled
    case refunded

    var displayName: String {
        rawValue.capitalized
    }

    var color: String {
        switch self {
        case .pending: return "orange"
        case .paid: return "blue"
        case .processing: return "purple"
        case .shipped: return "indigo"
        case .delivered: return "green"
        case .cancelled: return "red"
        case .refunded: return "gray"
        }
    }
}

enum SalesChannel: String, Codable, CaseIterable {
    case pos
    case ios
    case web
    case ebay
    case whatnot

    var displayName: String {
        switch self {
        case .pos: return "In-Store"
        case .ios: return "iOS App"
        case .web: return "Website"
        case .ebay: return "eBay"
        case .whatnot: return "Whatnot"
        }
    }
}

enum FulfillmentType: String, Codable {
    case ship
    case pickup

    var displayName: String {
        switch self {
        case .ship: return "Shipping"
        case .pickup: return "Store Pickup"
        }
    }
}

struct OrderItem: Codable, Hashable, Identifiable {
    var id: UUID { productId }
    let productId: UUID
    let name: String
    let sku: String?
    let size: String?
    let quantity: Int
    let price: Decimal
    let total: Decimal

    enum CodingKeys: String, CodingKey {
        case productId = "product_id"
        case name, sku, size, quantity, price, total
    }
}

struct Order: Identifiable, Codable {
    let id: UUID
    let orderNumber: String
    let customerId: UUID?
    let customerEmail: String
    let channel: SalesChannel
    let items: [OrderItem]
    let subtotal: Decimal
    let tax: Decimal
    let shippingCost: Decimal
    let discount: Decimal
    let total: Decimal
    var status: OrderStatus
    let fulfillmentType: FulfillmentType
    let shippingAddress: Address?
    var trackingNumber: String?
    var shippedAt: Date?
    var deliveredAt: Date?
    let stripePaymentId: String?
    let stripePaymentStatus: String?
    let customerNotes: String?
    var internalNotes: String?
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case orderNumber = "order_number"
        case customerId = "customer_id"
        case customerEmail = "customer_email"
        case channel, items, subtotal, tax
        case shippingCost = "shipping_cost"
        case discount, total, status
        case fulfillmentType = "fulfillment_type"
        case shippingAddress = "shipping_address"
        case trackingNumber = "tracking_number"
        case shippedAt = "shipped_at"
        case deliveredAt = "delivered_at"
        case stripePaymentId = "stripe_payment_id"
        case stripePaymentStatus = "stripe_payment_status"
        case customerNotes = "customer_notes"
        case internalNotes = "internal_notes"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var formattedTotal: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: total as NSDecimalNumber) ?? "$0.00"
    }

    var itemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }
}

extension Order {
    static let preview = Order(
        id: UUID(),
        orderNumber: "SEC-250204-0001",
        customerId: UUID(),
        customerEmail: "john@example.com",
        channel: .ios,
        items: [
            OrderItem(
                productId: UUID(),
                name: "Air Jordan 1 Retro High OG",
                sku: "NK-AJ1-001",
                size: "10",
                quantity: 1,
                price: 180.00,
                total: 180.00
            )
        ],
        subtotal: 180.00,
        tax: 12.60,
        shippingCost: 10.00,
        discount: 0,
        total: 202.60,
        status: .paid,
        fulfillmentType: .ship,
        shippingAddress: Address(
            firstName: "John",
            lastName: "Doe",
            street: "123 Main St",
            apartment: nil,
            city: "Tampa",
            state: "FL",
            zipCode: "33601",
            country: "US",
            phone: nil
        ),
        trackingNumber: nil,
        shippedAt: nil,
        deliveredAt: nil,
        stripePaymentId: "pi_123456",
        stripePaymentStatus: "succeeded",
        customerNotes: nil,
        internalNotes: nil,
        createdAt: Date(),
        updatedAt: Date()
    )
}
