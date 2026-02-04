//
//  Cart.swift
//  SecuredApp
//
//  Shopping cart model
//

import Foundation

struct CartItem: Identifiable, Hashable {
    let id: UUID
    let product: Product
    var quantity: Int

    var total: Decimal {
        product.price * Decimal(quantity)
    }

    var formattedTotal: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: total as NSDecimalNumber) ?? "$0.00"
    }
}

struct Cart {
    var items: [CartItem] = []
    var fulfillmentType: FulfillmentType = .ship
    var shippingAddress: Address?
    var customerNotes: String?

    // Pricing
    var subtotal: Decimal {
        items.reduce(0) { $0 + $1.total }
    }

    var taxRate: Decimal = 0.07 // 7% Florida sales tax

    var tax: Decimal {
        subtotal * taxRate
    }

    var shippingCost: Decimal {
        guard fulfillmentType == .ship else { return 0 }
        // Free shipping over $150
        return subtotal >= 150 ? 0 : 10.00
    }

    var total: Decimal {
        subtotal + tax + shippingCost
    }

    var itemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }

    var isEmpty: Bool {
        items.isEmpty
    }

    // Formatted prices
    var formattedSubtotal: String {
        formatCurrency(subtotal)
    }

    var formattedTax: String {
        formatCurrency(tax)
    }

    var formattedShipping: String {
        shippingCost == 0 ? "FREE" : formatCurrency(shippingCost)
    }

    var formattedTotal: String {
        formatCurrency(total)
    }

    private func formatCurrency(_ value: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: value as NSDecimalNumber) ?? "$0.00"
    }

    // Cart operations
    mutating func add(_ product: Product, quantity: Int = 1) {
        if let index = items.firstIndex(where: { $0.product.id == product.id }) {
            items[index].quantity += quantity
        } else {
            items.append(CartItem(id: UUID(), product: product, quantity: quantity))
        }
    }

    mutating func remove(_ productId: UUID) {
        items.removeAll { $0.product.id == productId }
    }

    mutating func updateQuantity(for productId: UUID, quantity: Int) {
        if let index = items.firstIndex(where: { $0.product.id == productId }) {
            if quantity <= 0 {
                items.remove(at: index)
            } else {
                items[index].quantity = quantity
            }
        }
    }

    mutating func clear() {
        items.removeAll()
        shippingAddress = nil
        customerNotes = nil
    }

    // Convert to order items for API
    func toOrderItems() -> [OrderItem] {
        items.map { item in
            OrderItem(
                productId: item.product.id,
                name: item.product.name,
                sku: item.product.sku,
                size: item.product.size,
                quantity: item.quantity,
                price: item.product.price,
                total: item.total
            )
        }
    }
}
