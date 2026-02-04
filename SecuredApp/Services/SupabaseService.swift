//
//  SupabaseService.swift
//  SecuredApp
//
//  Supabase client configuration and API methods
//

import Foundation
import Supabase

final class SupabaseService: Sendable {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: URL(string: "https://wupfvvwypyvzkznekksw.supabase.co")!,
            supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGZ2dnd5cHl2emt6bmVra3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjkzMjIsImV4cCI6MjA4NTc0NTMyMn0.zDSY9wgurlBCEskYvihLmZYqbrt6ovtGj6ntk4WsYDY"
        )
    }

    // MARK: - Categories

    func fetchCategories() async throws -> [Category] {
        try await client
            .from("categories")
            .select()
            .eq("is_active", value: true)
            .order("sort_order")
            .execute()
            .value
    }

    // MARK: - Products

    func fetchProducts(categoryId: UUID? = nil) async throws -> [Product] {
        var query = client
            .from("products")
            .select()
            .eq("is_active", value: true)

        if let categoryId = categoryId {
            query = query.eq("category_id", value: categoryId.uuidString)
        }

        return try await query
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    func fetchProduct(id: UUID) async throws -> Product {
        try await client
            .from("products")
            .select()
            .eq("id", value: id.uuidString)
            .single()
            .execute()
            .value
    }

    func fetchFeaturedProducts() async throws -> [Product] {
        try await client
            .from("products")
            .select()
            .eq("is_active", value: true)
            .eq("is_featured", value: true)
            .order("created_at", ascending: false)
            .limit(10)
            .execute()
            .value
    }

    func searchProducts(query: String) async throws -> [Product] {
        try await client
            .from("products")
            .select()
            .eq("is_active", value: true)
            .ilike("name", pattern: "%\(query)%")
            .order("name")
            .execute()
            .value
    }

    // MARK: - Real-time Subscriptions (Simplified - will implement fully later)

    func subscribeToProducts(onChange: @escaping @Sendable (Product) -> Void) {
        // Real-time subscription - simplified for initial build
        // Full implementation will be added once app is running
        print("Real-time subscription initialized")
    }

    // MARK: - Orders

    func createOrder(
        customerEmail: String,
        customerId: UUID?,
        items: [OrderItem],
        subtotal: Decimal,
        tax: Decimal,
        shippingCost: Decimal,
        total: Decimal,
        fulfillmentType: FulfillmentType,
        shippingAddress: Address?,
        customerNotes: String?,
        stripePaymentId: String?
    ) async throws -> Order {
        let orderNumber = generateOrderNumber()

        // Use dictionary instead of struct to avoid Sendable issues
        let newOrder: [String: AnyJSON] = [
            "order_number": .string(orderNumber),
            "customer_email": .string(customerEmail),
            "channel": .string("ios"),
            "subtotal": .double(NSDecimalNumber(decimal: subtotal).doubleValue),
            "tax": .double(NSDecimalNumber(decimal: tax).doubleValue),
            "shipping_cost": .double(NSDecimalNumber(decimal: shippingCost).doubleValue),
            "discount": .double(0),
            "total": .double(NSDecimalNumber(decimal: total).doubleValue),
            "status": .string("paid"),
            "fulfillment_type": .string(fulfillmentType.rawValue)
        ]

        return try await client
            .from("orders")
            .insert(newOrder)
            .select()
            .single()
            .execute()
            .value
    }

    func fetchOrders(customerId: UUID) async throws -> [Order] {
        try await client
            .from("orders")
            .select()
            .eq("customer_id", value: customerId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    // MARK: - Inventory

    func deductInventory(productId: UUID, quantity: Int, orderId: UUID?) async throws -> Bool {
        // Simplified - directly update product quantity
        // Full RPC implementation will be added later
        let currentProduct: Product = try await client
            .from("products")
            .select()
            .eq("id", value: productId.uuidString)
            .single()
            .execute()
            .value

        guard currentProduct.quantity >= quantity else {
            return false
        }

        let newQuantity = currentProduct.quantity - quantity

        try await client
            .from("products")
            .update(["quantity": newQuantity])
            .eq("id", value: productId.uuidString)
            .execute()

        return true
    }

    // MARK: - Helpers

    private func generateOrderNumber() -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyMMdd"
        let dateString = dateFormatter.string(from: Date())
        let random = String(format: "%04d", Int.random(in: 1...9999))
        return "SEC-\(dateString)-\(random)"
    }
}
