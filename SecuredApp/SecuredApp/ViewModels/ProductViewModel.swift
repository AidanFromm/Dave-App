//
//  ProductViewModel.swift
//  SecuredApp
//
//  Manages product data and real-time updates
//

import Foundation
import SwiftUI

@MainActor
class ProductViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var categories: [Category] = []
    @Published var selectedCategory: Category?
    @Published var isLoading = false
    @Published var error: String?
    @Published var searchQuery = ""

    private let supabase = SupabaseService.shared

    var filteredProducts: [Product] {
        var result = products

        // Filter by category
        if let category = selectedCategory {
            result = result.filter { $0.categoryId == category.id }
        }

        // Filter by search
        if !searchQuery.isEmpty {
            result = result.filter {
                $0.name.localizedCaseInsensitiveContains(searchQuery) ||
                ($0.brand?.localizedCaseInsensitiveContains(searchQuery) ?? false) ||
                ($0.colorway?.localizedCaseInsensitiveContains(searchQuery) ?? false)
            }
        }

        return result
    }

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

    private func startRealtimeSubscription() {
        Task {
            await supabase.subscribeToProducts { [weak self] updatedProduct in
                Task { @MainActor in
                    self?.handleProductUpdate(updatedProduct)
                }
            }
        }
    }

    private func handleProductUpdate(_ product: Product) {
        if let index = products.firstIndex(where: { $0.id == product.id }) {
            products[index] = product
        } else if product.isActive {
            products.insert(product, at: 0)
        }
    }
}
