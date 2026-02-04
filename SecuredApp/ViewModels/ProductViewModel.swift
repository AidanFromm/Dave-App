//
//  ProductViewModel.swift
//  SecuredApp
//
//  Manages product data, filtering, sorting, and real-time updates
//

import Foundation
import SwiftUI
import Combine

@MainActor
class ProductViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var categories: [Category] = []
    @Published var selectedCategory: Category?
    @Published var isLoading = false
    @Published var error: String?
    @Published var searchQuery = "" {
        didSet {
            debounceSearch()
        }
    }

    private let supabase = SupabaseService.shared
    private var searchTask: Task<Void, Never>?
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Computed Properties

    /// Products filtered by category and search query
    var filteredProducts: [Product] {
        var result = products.filter { $0.isActive }

        // Filter by category
        if let category = selectedCategory {
            result = result.filter { $0.categoryId == category.id }
        }

        // Filter by search
        if !searchQuery.isEmpty {
            let query = searchQuery.lowercased()
            result = result.filter {
                $0.name.lowercased().contains(query) ||
                ($0.brand?.lowercased().contains(query) ?? false) ||
                ($0.colorway?.lowercased().contains(query) ?? false) ||
                $0.tags.contains { $0.lowercased().contains(query) }
            }
        }

        return result
    }

    /// Featured products for hero banner (isFeatured = true and in stock)
    var featuredProducts: [Product] {
        products.filter { $0.isFeatured && $0.isActive && $0.isInStock }
            .sorted { $0.createdAt > $1.createdAt }
            .prefix(5)
            .map { $0 }
    }

    /// New drop products (isDrop = true and within last 7 days)
    var newDropProducts: [Product] {
        products.filter { $0.isNewDrop && $0.isActive }
            .sorted { $0.createdAt > $1.createdAt }
    }

    /// Products by condition
    func products(forCondition condition: ProductCondition) -> [Product] {
        filteredProducts.filter { $0.condition == condition }
    }

    /// Products in stock
    var inStockProducts: [Product] {
        filteredProducts.filter { $0.isInStock }
    }

    /// Low stock products
    var lowStockProducts: [Product] {
        filteredProducts.filter { $0.isLowStock }
    }

    // MARK: - Data Loading

    func loadInitialData() async {
        isLoading = true
        error = nil

        do {
            async let categoriesTask = supabase.fetchCategories()
            async let productsTask = supabase.fetchProducts()

            let (fetchedCategories, fetchedProducts) = try await (categoriesTask, productsTask)

            categories = fetchedCategories
            products = fetchedProducts

            // Start real-time subscription
            startRealtimeSubscription()
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func loadProducts(for category: Category?) async {
        isLoading = true
        selectedCategory = category

        do {
            products = try await supabase.fetchProducts(categoryId: category?.id)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Search with Debounce

    private func debounceSearch() {
        // Cancel any existing search task
        searchTask?.cancel()

        // Create new debounced search task
        searchTask = Task {
            // Wait for 300ms debounce
            try? await Task.sleep(nanoseconds: 300_000_000)

            // Check if task was cancelled
            guard !Task.isCancelled else { return }

            // Perform search if query is not empty
            if !searchQuery.isEmpty {
                await performSearch(searchQuery)
            }
        }
    }

    private func performSearch(_ query: String) async {
        guard !query.isEmpty else { return }

        // For local filtering, we don't need to call the API
        // The filteredProducts computed property handles this
        // But if you want server-side search:
        /*
        do {
            products = try await supabase.searchProducts(query: query)
        } catch {
            self.error = error.localizedDescription
        }
        */
    }

    func searchProducts(_ query: String) async {
        guard !query.isEmpty else {
            await loadInitialData()
            return
        }

        isLoading = true

        do {
            products = try await supabase.searchProducts(query: query)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func refreshProduct(_ productId: UUID) async {
        do {
            let updatedProduct = try await supabase.fetchProduct(id: productId)
            if let index = products.firstIndex(where: { $0.id == productId }) {
                products[index] = updatedProduct
            }
        } catch {
            print("Failed to refresh product: \(error)")
        }
    }

    // MARK: - Sorting

    func sortProducts(by option: SortOption) -> [Product] {
        var sorted = filteredProducts

        switch option {
        case .newest:
            sorted.sort { $0.createdAt > $1.createdAt }
        case .priceLowToHigh:
            sorted.sort { $0.price < $1.price }
        case .priceHighToLow:
            sorted.sort { $0.price > $1.price }
        case .nameAZ:
            sorted.sort { $0.name < $1.name }
        case .nameZA:
            sorted.sort { $0.name > $1.name }
        }

        return sorted
    }

    // MARK: - Filtering

    func filterProducts(
        conditions: Set<ProductCondition> = [],
        priceRange: ClosedRange<Double>? = nil,
        inStockOnly: Bool = false,
        dropsOnly: Bool = false
    ) -> [Product] {
        var result = filteredProducts

        // Filter by conditions
        if !conditions.isEmpty {
            result = result.filter { conditions.contains($0.condition) }
        }

        // Filter by price range
        if let range = priceRange {
            let minPrice = Decimal(range.lowerBound)
            let maxPrice = Decimal(range.upperBound)
            result = result.filter { $0.price >= minPrice && $0.price <= maxPrice }
        }

        // Filter by stock
        if inStockOnly {
            result = result.filter { $0.isInStock }
        }

        // Filter by drops
        if dropsOnly {
            result = result.filter { $0.isNewDrop }
        }

        return result
    }

    // MARK: - Real-time Updates

    private func startRealtimeSubscription() {
        supabase.subscribeToProducts { updatedProduct in
            Task { @MainActor [weak self] in
                self?.handleProductUpdate(updatedProduct)
            }
        }
    }

    private func handleProductUpdate(_ product: Product) {
        if let index = products.firstIndex(where: { $0.id == product.id }) {
            // Update existing product
            products[index] = product

            // Remove if no longer active
            if !product.isActive {
                products.remove(at: index)
            }
        } else if product.isActive {
            // Add new product
            products.insert(product, at: 0)
        }
    }

    // MARK: - Statistics

    var totalProductCount: Int {
        products.count
    }

    var activeProductCount: Int {
        products.filter { $0.isActive }.count
    }

    var totalInventoryValue: Decimal {
        products.reduce(Decimal.zero) { $0 + ($1.price * Decimal($1.quantity)) }
    }
}
