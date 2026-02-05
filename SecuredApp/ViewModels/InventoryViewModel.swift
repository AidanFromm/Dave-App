//
//  InventoryViewModel.swift
//  SecuredApp
//
//  Manages inventory operations for admin panel
//

import Foundation
import Combine

@MainActor
class InventoryViewModel: ObservableObject {
    // MARK: - Published State
    @Published var products: [Product] = []
    @Published var filteredProducts: [Product] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var successMessage: String?

    // Filters
    @Published var searchQuery = ""
    @Published var selectedCategory: Category?
    @Published var selectedCondition: ProductCondition?
    @Published var showLowStockOnly = false
    @Published var showOutOfStockOnly = false

    // Stats
    @Published var totalProducts = 0
    @Published var lowStockCount = 0
    @Published var outOfStockCount = 0
    @Published var totalInventoryValue: Decimal = 0

    private let supabase = SupabaseService.shared
    private var cancellables = Set<AnyCancellable>()

    init() {
        setupFilters()
    }

    // MARK: - Filter Setup

    private func setupFilters() {
        // Combine all filter changes and apply them
        Publishers.CombineLatest4(
            $searchQuery.debounce(for: .milliseconds(300), scheduler: RunLoop.main),
            $selectedCategory,
            $selectedCondition,
            Publishers.CombineLatest($showLowStockOnly, $showOutOfStockOnly)
        )
        .sink { [weak self] query, category, condition, stockFilters in
            self?.applyFilters(
                query: query,
                category: category,
                condition: condition,
                lowStockOnly: stockFilters.0,
                outOfStockOnly: stockFilters.1
            )
        }
        .store(in: &cancellables)
    }

    private func applyFilters(
        query: String,
        category: Category?,
        condition: ProductCondition?,
        lowStockOnly: Bool,
        outOfStockOnly: Bool
    ) {
        var filtered = products

        // Search query
        if !query.isEmpty {
            let lowercased = query.lowercased()
            filtered = filtered.filter { product in
                product.name.lowercased().contains(lowercased) ||
                product.brand?.lowercased().contains(lowercased) == true ||
                product.sku?.lowercased().contains(lowercased) == true ||
                product.barcode?.lowercased().contains(lowercased) == true
            }
        }

        // Category filter
        if let category = category {
            filtered = filtered.filter { $0.categoryId == category.id }
        }

        // Condition filter
        if let condition = condition {
            filtered = filtered.filter { $0.condition == condition }
        }

        // Stock filters
        if outOfStockOnly {
            filtered = filtered.filter { $0.quantity == 0 }
        } else if lowStockOnly {
            filtered = filtered.filter { $0.isLowStock }
        }

        filteredProducts = filtered
    }

    // MARK: - Fetch Products

    func fetchProducts() async {
        isLoading = true
        error = nil

        do {
            products = try await supabase.fetchProducts()
            updateStats()
            applyFilters(
                query: searchQuery,
                category: selectedCategory,
                condition: selectedCondition,
                lowStockOnly: showLowStockOnly,
                outOfStockOnly: showOutOfStockOnly
            )
        } catch {
            self.error = "Failed to load products: \(error.localizedDescription)"
        }

        isLoading = false
    }

    // MARK: - Add Product

    func addProduct(_ product: NewProduct) async -> Bool {
        isLoading = true
        error = nil

        do {
            let productData: [String: Any] = [
                "sku": product.sku ?? "",
                "barcode": product.barcode ?? "",
                "name": product.name,
                "description": product.description ?? "",
                "category_id": product.categoryId?.uuidString ?? "",
                "brand": product.brand ?? "",
                "size": product.size ?? "",
                "condition": product.condition.rawValue,
                "colorway": product.colorway ?? "",
                "has_box": product.hasBox,
                "price": NSDecimalNumber(decimal: product.price).doubleValue,
                "cost": product.cost != nil ? NSDecimalNumber(decimal: product.cost!).doubleValue : 0,
                "quantity": product.quantity,
                "low_stock_threshold": product.lowStockThreshold,
                "images": product.images,
                "is_active": true,
                "is_featured": false,
                "tags": product.tags
            ]

            try await supabase.client
                .from("products")
                .insert(productData)
                .execute()

            successMessage = "Product added successfully!"
            await fetchProducts()
            isLoading = false
            return true

        } catch {
            self.error = "Failed to add product: \(error.localizedDescription)"
            isLoading = false
            return false
        }
    }

    // MARK: - Update Product

    func updateProduct(_ product: Product) async -> Bool {
        isLoading = true
        error = nil

        do {
            let updateData: [String: Any] = [
                "name": product.name,
                "description": product.description ?? "",
                "brand": product.brand ?? "",
                "size": product.size ?? "",
                "condition": product.condition.rawValue,
                "colorway": product.colorway ?? "",
                "has_box": product.hasBox,
                "price": NSDecimalNumber(decimal: product.price).doubleValue,
                "cost": product.cost != nil ? NSDecimalNumber(decimal: product.cost!).doubleValue : 0,
                "quantity": product.quantity,
                "low_stock_threshold": product.lowStockThreshold,
                "images": product.images,
                "is_active": product.isActive,
                "is_featured": product.isFeatured,
                "tags": product.tags,
                "updated_at": ISO8601DateFormatter().string(from: Date())
            ]

            try await supabase.client
                .from("products")
                .update(updateData)
                .eq("id", value: product.id.uuidString)
                .execute()

            successMessage = "Product updated successfully!"
            await fetchProducts()
            isLoading = false
            return true

        } catch {
            self.error = "Failed to update product: \(error.localizedDescription)"
            isLoading = false
            return false
        }
    }

    // MARK: - Delete Product

    func deleteProduct(_ product: Product) async -> Bool {
        isLoading = true
        error = nil

        do {
            // Soft delete - just mark as inactive
            try await supabase.client
                .from("products")
                .update(["is_active": false])
                .eq("id", value: product.id.uuidString)
                .execute()

            successMessage = "Product deleted"
            await fetchProducts()
            isLoading = false
            return true

        } catch {
            self.error = "Failed to delete product: \(error.localizedDescription)"
            isLoading = false
            return false
        }
    }

    // MARK: - Adjust Quantity

    func adjustQuantity(
        product: Product,
        adjustment: Int,
        reason: String
    ) async -> Bool {
        isLoading = true
        error = nil

        let newQuantity = max(0, product.quantity + adjustment)

        do {
            // Update product quantity
            try await supabase.client
                .from("products")
                .update([
                    "quantity": newQuantity,
                    "updated_at": ISO8601DateFormatter().string(from: Date())
                ])
                .eq("id", value: product.id.uuidString)
                .execute()

            // Log the adjustment
            let logEntry: [String: Any] = [
                "product_id": product.id.uuidString,
                "change_type": adjustment > 0 ? "addition" : "removal",
                "quantity_change": adjustment,
                "quantity_before": product.quantity,
                "quantity_after": newQuantity,
                "reason": reason,
                "channel": "admin_adjustment"
            ]

            try await supabase.client
                .from("inventory_logs")
                .insert(logEntry)
                .execute()

            let direction = adjustment > 0 ? "added" : "removed"
            successMessage = "\(abs(adjustment)) unit(s) \(direction)"
            await fetchProducts()
            isLoading = false
            return true

        } catch {
            self.error = "Failed to adjust quantity: \(error.localizedDescription)"
            isLoading = false
            return false
        }
    }

    // MARK: - Stats

    private func updateStats() {
        totalProducts = products.count
        lowStockCount = products.filter { $0.isLowStock }.count
        outOfStockCount = products.filter { $0.quantity == 0 }.count
        totalInventoryValue = products.reduce(Decimal(0)) { total, product in
            total + (product.price * Decimal(product.quantity))
        }
    }

    // MARK: - Clear Filters

    func clearFilters() {
        searchQuery = ""
        selectedCategory = nil
        selectedCondition = nil
        showLowStockOnly = false
        showOutOfStockOnly = false
    }

    // MARK: - Clear Messages

    func clearMessages() {
        error = nil
        successMessage = nil
    }
}

// MARK: - New Product Model

struct NewProduct {
    var sku: String?
    var barcode: String?
    var name: String
    var description: String?
    var categoryId: UUID?
    var brand: String?
    var size: String?
    var condition: ProductCondition
    var colorway: String?
    var hasBox: Bool
    var price: Decimal
    var cost: Decimal?
    var quantity: Int
    var lowStockThreshold: Int
    var images: [String]
    var tags: [String]

    init() {
        self.name = ""
        self.condition = .new
        self.hasBox = true
        self.price = 0
        self.quantity = 1
        self.lowStockThreshold = 5
        self.images = []
        self.tags = []
    }

    init(from stockXProduct: StockXProductDetail, variant: StockXVariant?, barcode: String?) {
        self.sku = stockXProduct.styleId
        self.barcode = barcode
        self.name = stockXProduct.name
        self.description = stockXProduct.description
        self.brand = stockXProduct.brand
        self.size = variant?.sizeUS
        self.condition = .new
        self.colorway = stockXProduct.colorway
        self.hasBox = true
        self.price = Decimal(stockXProduct.retailPrice ?? 0)
        self.quantity = 1
        self.lowStockThreshold = 5
        self.images = stockXProduct.imageUrl != nil ? [stockXProduct.imageUrl!] : []
        self.tags = []
    }
}
