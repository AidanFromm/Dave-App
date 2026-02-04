//
//  ShopView.swift
//  SecuredApp
//
//  Main shopping view with category tabs and product grid
//

import SwiftUI

struct ShopView: View {
    @StateObject private var viewModel = ProductViewModel()
    @State private var searchText = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Category tabs
                CategoryTabsView(
                    categories: viewModel.categories,
                    selectedCategory: $viewModel.selectedCategory
                )

                // Product grid
                if viewModel.isLoading {
                    Spacer()
                    ProgressView("Loading products...")
                    Spacer()
                } else if viewModel.filteredProducts.isEmpty {
                    Spacer()
                    ContentUnavailableView(
                        "No Products",
                        systemImage: "bag",
                        description: Text("Check back soon for new arrivals")
                    )
                    Spacer()
                } else {
                    ProductGridView(products: viewModel.filteredProducts)
                }
            }
            .navigationTitle("Secured")
            .searchable(text: $searchText, prompt: "Search products...")
            .onChange(of: searchText) { _, newValue in
                viewModel.searchQuery = newValue
            }
            .refreshable {
                await viewModel.loadInitialData()
            }
            .task {
                await viewModel.loadInitialData()
            }
        }
    }
}

struct CategoryTabsView: View {
    let categories: [Category]
    @Binding var selectedCategory: Category?

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                CategoryTab(
                    title: "All",
                    isSelected: selectedCategory == nil
                ) {
                    selectedCategory = nil
                }

                ForEach(categories) { category in
                    CategoryTab(
                        title: category.name,
                        isSelected: selectedCategory?.id == category.id
                    ) {
                        selectedCategory = category
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
        }
        .background(Color(.systemBackground))
    }
}

struct CategoryTab: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundStyle(isSelected ? .white : .primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.primary : Color(.systemGray6))
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    ShopView()
        .environmentObject(CartViewModel())
}
