//
//  CartViewModel.swift
//  SecuredApp
//
//  Manages shopping cart state
//

import Foundation
import SwiftUI

@MainActor
class CartViewModel: ObservableObject {
    @Published var cart = Cart()
    @Published var isProcessingOrder = false
    @Published var orderError: String?
    @Published var completedOrder: Order?

    private let supabase = SupabaseService.shared

    var itemCount: Int {
        cart.itemCount
    }

    var isEmpty: Bool {
        cart.isEmpty
    }

    func addToCart(_ product: Product, quantity: Int = 1) {
        guard product.quantity >= quantity else {
            orderError = "Not enough stock available"
            return
        }
        cart.add(product, quantity: quantity)
    }

    func removeFromCart(_ productId: UUID) {
        cart.remove(productId)
    }

    func updateQuantity(for productId: UUID, quantity: Int) {
        cart.updateQuantity(for: productId, quantity: quantity)
    }

    func setFulfillmentType(_ type: FulfillmentType) {
        cart.fulfillmentType = type
    }

    func setShippingAddress(_ address: Address) {
        cart.shippingAddress = address
    }

    func clearCart() {
        cart.clear()
        completedOrder = nil
        orderError = nil
    }

    func checkout(
        customerEmail: String,
        customerId: UUID? = nil,
        stripePaymentId: String? = nil
    ) async -> Bool {
        isProcessingOrder = true
        orderError = nil

        do {
            // First, deduct inventory for all items
            for item in cart.items {
                let success = try await supabase.deductInventory(
                    productId: item.product.id,
                    quantity: item.quantity,
                    orderId: nil
                )

                if !success {
                    orderError = "\(item.product.name) is no longer available in the requested quantity"
                    isProcessingOrder = false
                    return false
                }
            }

            // Create the order
            let order = try await supabase.createOrder(
                customerEmail: customerEmail,
                customerId: customerId,
                items: cart.toOrderItems(),
                subtotal: cart.subtotal,
                tax: cart.tax,
                shippingCost: cart.shippingCost,
                total: cart.total,
                fulfillmentType: cart.fulfillmentType,
                shippingAddress: cart.shippingAddress,
                customerNotes: cart.customerNotes,
                stripePaymentId: stripePaymentId
            )

            completedOrder = order
            cart.clear()
            isProcessingOrder = false
            return true

        } catch {
            orderError = error.localizedDescription
            isProcessingOrder = false
            return false
        }
    }
}
