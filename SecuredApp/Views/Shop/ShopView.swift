//
//  ShopView.swift
//  SecuredApp
//
//  Main shopping view with filter tabs and product grid
//  Premium Nike/Adidas-inspired design with smooth animations
//

import SwiftUI

// MARK: - Shop Filter Enum

enum ShopFilter: String, CaseIterable {
    case all = "All"
    case drops = "Drops"
    case new = "New"
    case used = "Used"
    case pokemon = "Pokemon"
}

struct ShopView: View {
    @StateObject private var viewModel = ProductViewModel()
    @EnvironmentObject var wishlistViewModel: WishlistViewModel
    @State private var searchText = ""
    @State private var showFilterSheet = false
    @State private var sortOption: SortOption = .newest
    @State private var filterOptions = FilterOptions()
    @State private var selectedFilter: ShopFilter = .all
    @Namespace private var animation

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    // Custom Title
                    HStack {
                        Text("Secured")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundStyle(Color.securedTextPrimary)
                        Spacer()
                    }
                    .padding(.horizontal, SecuredSpacing.md)
                    .padding(.top, SecuredSpacing.xs)
                    .padding(.bottom, SecuredSpacing.sm)

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

                    // Filter Tabs (2 rows)
                    FilterTabsView(
                        selectedFilter: $selectedFilter,
                        animation: animation
                    )
                    .padding(.bottom, SecuredSpacing.sm)

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
            .navigationBarHidden(true)
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

        // Apply shop filter based on selected tab
        switch selectedFilter {
        case .all:
            // Show all products
            break
        case .drops:
            // Products created within last 5 days
            products = products.filter { $0.isNewDrop }
        case .new:
            // Products with condition == .new AND older than 5 days
            let fiveDaysAgo = Calendar.current.date(byAdding: .day, value: -5, to: Date()) ?? Date()
            products = products.filter { $0.condition == .new && $0.createdAt < fiveDaysAgo }
        case .used:
            // Products with used conditions
            let usedConditions: Set<ProductCondition> = [.usedLikeNew, .usedGood, .usedFair]
            products = products.filter { usedConditions.contains($0.condition) }
        case .pokemon:
            // Products in Pokemon category (filter by category name since we don't have fixed UUID)
            let pokemonCategory = viewModel.categories.first { $0.slug == "pokemon" || $0.name.lowercased() == "pokemon" }
            if let categoryId = pokemonCategory?.id {
                products = products.filter { $0.categoryId == categoryId }
            } else {
                // Fallback: filter by name/tags if no category found
                products = products.filter {
                    $0.name.lowercased().contains("pokemon") ||
                    $0.tags.contains { $0.lowercased().contains("pokemon") }
                }
            }
        }

        // Apply additional filter options from sheet
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

            if filterOptions.hasActiveFilters || selectedFilter != .all {
                Button {
                    withAnimation {
                        filterOptions.reset()
                        selectedFilter = .all
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

// MARK: - Filter Tabs View (2 Rows)

struct FilterTabsView: View {
    @Binding var selectedFilter: ShopFilter
    var animation: Namespace.ID

    var body: some View {
        VStack(spacing: SecuredSpacing.sm) {
            // Row 1: All (small) + Drops (large accent)
            HStack(spacing: SecuredSpacing.sm) {
                // All button - compact
                FilterTabButton(
                    title: "All",
                    isSelected: selectedFilter == .all,
                    animation: animation,
                    matchId: "filterTab"
                ) {
                    withAnimation(SecuredAnimation.tabSelection) {
                        selectedFilter = .all
                    }
                }
                .frame(width: 60)

                // Drops button - prominent, fills remaining space
                DropsFilterButton(
                    isSelected: selectedFilter == .drops,
                    animation: animation
                ) {
                    withAnimation(SecuredAnimation.tabSelection) {
                        selectedFilter = .drops
                    }
                }
            }
            .padding(.horizontal, SecuredSpacing.md)

            // Row 2: New, Used, Pokemon - equal width
            HStack(spacing: SecuredSpacing.sm) {
                FilterTabButton(
                    title: "New",
                    isSelected: selectedFilter == .new,
                    animation: animation,
                    matchId: "filterTab"
                ) {
                    withAnimation(SecuredAnimation.tabSelection) {
                        selectedFilter = .new
                    }
                }

                FilterTabButton(
                    title: "Used",
                    isSelected: selectedFilter == .used,
                    animation: animation,
                    matchId: "filterTab"
                ) {
                    withAnimation(SecuredAnimation.tabSelection) {
                        selectedFilter = .used
                    }
                }

                FilterTabButton(
                    title: "Pokemon",
                    isSelected: selectedFilter == .pokemon,
                    animation: animation,
                    matchId: "filterTab"
                ) {
                    withAnimation(SecuredAnimation.tabSelection) {
                        selectedFilter = .pokemon
                    }
                }
            }
            .padding(.horizontal, SecuredSpacing.md)
        }
        .padding(.vertical, SecuredSpacing.xs)
    }
}

// MARK: - Filter Tab Button

struct FilterTabButton: View {
    let title: String
    let isSelected: Bool
    var animation: Namespace.ID
    let matchId: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .medium)
                .foregroundStyle(isSelected ? .white : Color.securedTextPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, SecuredSpacing.sm)
                .background {
                    if isSelected {
                        RoundedRectangle(cornerRadius: SecuredRadius.small)
                            .fill(Color.securedAccent)
                    } else {
                        RoundedRectangle(cornerRadius: SecuredRadius.small)
                            .fill(Color.securedCardBackground)
                    }
                }
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.selection, trigger: isSelected)
    }
}

// MARK: - Drops Filter Button (Prominent)

struct DropsFilterButton: View {
    let isSelected: Bool
    var animation: Namespace.ID
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: SecuredSpacing.xs) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 14, weight: .semibold))

                Text("DROPS")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .tracking(0.5)
            }
            .foregroundStyle(isSelected ? .white : Color.securedAccent)
            .frame(maxWidth: .infinity)
            .padding(.vertical, SecuredSpacing.sm)
            .background {
                if isSelected {
                    RoundedRectangle(cornerRadius: SecuredRadius.small)
                        .fill(Color.securedAccent)
                } else {
                    RoundedRectangle(cornerRadius: SecuredRadius.small)
                        .fill(Color.securedAccent.opacity(0.15))
                        .overlay {
                            RoundedRectangle(cornerRadius: SecuredRadius.small)
                                .strokeBorder(Color.securedAccent, lineWidth: 1.5)
                        }
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
