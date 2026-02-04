//
//  SupabaseService.swift
//  SecuredApp
//
//  Supabase client configuration and API methods
//

import Foundation
import Supabase

class SupabaseService {
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

    // MARK: - Real-time Subscriptions

    func subscribeToProducts(onChange: @escaping (Product) -> Void) async {
        let channel = client.channel("products-changes")

        let changes = channel.postgresChange(
            AnyAction.self,
            schema: "public",
            table: "products"
        )

        await channel.subscribe()

        for await change in changes {
            switch change {
            case .update(let action):
                if let product: Product = try? action.decodeRecord() {
                    onChange(product)
                }
            case .insert(let action):
                if let product: Product = try? action.decodeRecord() {
                    onChange(product)
                }
            default:
                break
            }
        }
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

        struct NewOrder: Encodable {
            let order_number: String
            let customer_id: UUID?
            let customer_email: String
            let channel: String
            let items: [OrderItem]
            let subtotal: Decimal
            let tax: Decimal
            let shipping_cost: Decimal
            let discount: Decimal
            let total: Decimal
            let status: String
            let fulfillment_type: String
            let shipping_address: Address?
            let stripe_payment_id: String?
            let customer_notes: String?
        }

        let newOrder = NewOrder(
            order_number: orderNumber,
            customer_id: customerId,
            customer_email: customerEmail,
            channel: "ios",
            items: items,
            subtotal: subtotal,
            tax: tax,
            shipping_cost: shippingCost,
            discount: 0,
            total: total,
            status: "paid",
            fulfillment_type: fulfillmentType.rawValue,
            shipping_address: shippingAddress,
            stripe_payment_id: stripePaymentId,
            customer_notes: customerNotes
        )

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
        struct DeductParams: Encodable {
            let p_product_id: UUID
            let p_quantity: Int
            let p_channel: String
            let p_order_id: UUID?
        }

        let params = DeductParams(
            p_product_id: productId,
            p_quantity: quantity,
            p_channel: "ios",
            p_order_id: orderId
        )

        let result: Bool = try await client
            .rpc("deduct_inventory", params: params)
            .execute()
            .value

        return result
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
