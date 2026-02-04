//
//  ShopView.swift
//  SecuredApp
//
//  Main shopping view with hero banner, category tabs, and product grid
//  Premium Nike/Adidas-inspired design with smooth animations
//

import SwiftUI

struct ShopView: View {
    @StateObject private var viewModel = ProductViewModel()
    @EnvironmentObject var wishlistViewModel: WishlistViewModel
    @State private var searchText = ""
    @State private var showFilterSheet = false
    @State private var sortOption: SortOption = .newest
    @State private var filterOptions = FilterOptions()
    @Namespace private var animation

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Hero Banner (Featured Drops)
                    if !viewModel.featuredProducts.isEmpty && searchText.isEmpty {
                        HeroBannerView(
                            products: viewModel.featuredProducts,
                            onProductTap: { product in
                                // Navigation handled by NavigationLink
                            }
                        )
                        .padding(.top, SecuredSpacing.sm)
                        .padding(.bottom, SecuredSpacing.md)
                    }

                    // Search Bar
                    EnhancedSearchBar(
                        text: $searchText,
                        filterCount: filterOptions.activeFilterCount,
                        onFilterTap: {
                            showFilterSheet = true
                        }
                    )
                    .padding(.horizontal, SecuredSpacing.md)
                    .padding(.bottom, SecuredSpacing.sm)

                    // Category Tabs
                    CategoryTabsView(
                        categories: viewModel.categories,
                        selectedCategory: $viewModel.selectedCategory,
                        animation: animation
                    )

                    // Product Grid or States
                    if viewModel.isLoading {
                        ProductGridSkeleton()
                            .padding(.top, SecuredSpacing.md)
                    } else if sortedAndFilteredProducts.isEmpty {
                        emptyStateView
                    } else {
                        ProductGridView(
                            products: sortedAndFilteredProducts,
                            animation: animation
                        )
                        .padding(.top, SecuredSpacing.md)
                    }
                }
                .padding(.bottom, SecuredSpacing.xxl)
            }
            .background(Color.securedBackground)
            .navigationTitle("Secured")
            .navigationBarTitleDisplayMode(.large)
            .onChange(of: searchText) { _, newValue in
                viewModel.searchQuery = newValue
            }
            .refreshable {
                await viewModel.loadInitialData()
            }
            .task {
                await viewModel.loadInitialData()
            }
            .sheet(isPresented: $showFilterSheet) {
                FilterSortSheet(
                    sortOption: $sortOption,
                    filterOptions: $filterOptions
                )
            }
        }
    }

    // MARK: - Computed Properties

    private var sortedAndFilteredProducts: [Product] {
        var products = viewModel.filteredProducts

        // Apply filter options
        if !filterOptions.conditions.isEmpty {
            products = products.filter { filterOptions.conditions.contains($0.condition) }
        }

        if filterOptions.showInStockOnly {
            products = products.filter { $0.isInStock }
        }

        if filterOptions.showDropsOnly {
            products = products.filter { $0.isNewDrop }
        }

        let minPrice = Decimal(filterOptions.priceRange.lowerBound)
        let maxPrice = Decimal(filterOptions.priceRange.upperBound)
        products = products.filter { $0.price >= minPrice && $0.price <= maxPrice }

        // Apply sorting
        switch sortOption {
        case .newest:
            products.sort { $0.createdAt > $1.createdAt }
        case .priceLowToHigh:
            products.sort { $0.price < $1.price }
        case .priceHighToLow:
            products.sort { $0.price > $1.price }
        case .nameAZ:
            products.sort { $0.name < $1.name }
        case .nameZA:
            products.sort { $0.name > $1.name }
        }

        return products
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: SecuredSpacing.md) {
            Spacer()
                .frame(height: 60)

            Image(systemName: "bag")
                .font(.system(size: 48))
                .foregroundStyle(Color.securedTextSecondary)

            Text("No Products Found")
                .font(.title3)
                .fontWeight(.semibold)
                .foregroundStyle(Color.securedTextPrimary)

            Text("Try adjusting your filters or check back soon for new arrivals")
                .font(.subheadline)
                .foregroundStyle(Color.securedTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, SecuredSpacing.xl)

            if filterOptions.hasActiveFilters {
                Button {
                    withAnimation {
                        filterOptions.reset()
                    }
                } label: {
                    Text("Clear Filters")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color.securedAccent)
                }
                .padding(.top, SecuredSpacing.sm)
            }

            Spacer()
        }
    }
}

// MARK: - Enhanced Search Bar

struct EnhancedSearchBar: View {
    @Binding var text: String
    let filterCount: Int
    let onFilterTap: () -> Void
    @FocusState private var isFocused: Bool

    var body: some View {
        HStack(spacing: SecuredSpacing.sm) {
            // Search Field
            HStack(spacing: SecuredSpacing.sm) {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(Color.securedTextSecondary)

                TextField("Search products...", text: $text)
                    .font(.subheadline)
                    .foregroundStyle(Color.securedTextPrimary)
                    .focused($isFocused)

                if !text.isEmpty {
                    Button {
                        withAnimation {
                            text = ""
                        }
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(Color.securedTextSecondary)
                    }
                }
            }
            .padding(.horizontal, SecuredSpacing.md)
            .padding(.vertical, SecuredSpacing.sm + 2)
            .background(Color.securedCardBackground)
            .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))

            // Filter Button
            FilterButton(filterCount: filterCount, action: onFilterTap)
        }
    }
}

// MARK: - Category Tabs View

struct CategoryTabsView: View {
    let categories: [Category]
    @Binding var selectedCategory: Category?
    var animation: Namespace.ID

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: SecuredSpacing.sm) {
                CategoryTab(
                    title: "All",
                    isSelected: selectedCategory == nil,
                    animation: animation
                ) {
                    withAnimation(SecuredAnimation.tabSelection) {
                        selectedCategory = nil
                    }
                }

                ForEach(categories) { category in
                    CategoryTab(
                        title: category.name,
                        isSelected: selectedCategory?.id == category.id,
                        animation: animation
                    ) {
                        withAnimation(SecuredAnimation.tabSelection) {
                            selectedCategory = category
                        }
                    }
                }
            }
            .padding(.horizontal, SecuredSpacing.md)
            .padding(.vertical, SecuredSpacing.sm)
        }
    }
}

// MARK: - Category Tab

struct CategoryTab: View {
    let title: String
    let isSelected: Bool
    var animation: Namespace.ID
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .medium)
                .foregroundStyle(isSelected ? .white : Color.securedTextPrimary)
                .padding(.horizontal, SecuredSpacing.md)
                .padding(.vertical, SecuredSpacing.sm)
                .background {
                    if isSelected {
                        Capsule()
                            .fill(Color.securedAccent)
                            .matchedGeometryEffect(id: "categoryTab", in: animation)
                    } else {
                        Capsule()
                            .fill(Color.securedCardBackground)
                    }
                }
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.selection, trigger: isSelected)
    }
}

// MARK: - Preview

#Preview {
    ShopView()
        .environmentObject(CartViewModel())
        .environmentObject(WishlistViewModel())
}
