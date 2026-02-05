//
//  InventoryListView.swift
//  SecuredApp
//
//  Browse, search, and manage all inventory
//

import SwiftUI

struct InventoryListView: View {
    @StateObject private var viewModel = InventoryViewModel()
    @State private var showingFilters = false
    @State private var selectedProduct: Product?
    @State private var showingEditSheet = false
    @State private var showingDeleteAlert = false
    @State private var productToDelete: Product?
    @State private var showingAdjustSheet = false
    @State private var productToAdjust: Product?

    var body: some View {
        VStack(spacing: 0) {
            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField("Search products...", text: $viewModel.searchQuery)
                    .textFieldStyle(.plain)

                if !viewModel.searchQuery.isEmpty {
                    Button(action: { viewModel.searchQuery = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }

                Button(action: { showingFilters = true }) {
                    Image(systemName: "line.3.horizontal.decrease.circle")
                        .foregroundColor(hasActiveFilters ? .blue : .secondary)
                }
            }
            .padding()
            .background(Color(.systemGray6))

            // Quick filters
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    FilterChip(
                        title: "Low Stock",
                        isActive: viewModel.showLowStockOnly,
                        count: viewModel.lowStockCount
                    ) {
                        viewModel.showLowStockOnly.toggle()
                        if viewModel.showLowStockOnly {
                            viewModel.showOutOfStockOnly = false
                        }
                    }

                    FilterChip(
                        title: "Out of Stock",
                        isActive: viewModel.showOutOfStockOnly,
                        count: viewModel.outOfStockCount
                    ) {
                        viewModel.showOutOfStockOnly.toggle()
                        if viewModel.showOutOfStockOnly {
                            viewModel.showLowStockOnly = false
                        }
                    }

                    ForEach(ProductCondition.allCases, id: \.self) { condition in
                        FilterChip(
                            title: condition.displayName,
                            isActive: viewModel.selectedCondition == condition
                        ) {
                            if viewModel.selectedCondition == condition {
                                viewModel.selectedCondition = nil
                            } else {
                                viewModel.selectedCondition = condition
                            }
                        }
                    }

                    if hasActiveFilters {
                        Button("Clear All") {
                            viewModel.clearFilters()
                        }
                        .font(.caption)
                        .foregroundColor(.blue)
                    }
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
            }

            Divider()

            // Results count
            HStack {
                Text("\(viewModel.filteredProducts.count) products")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
            }
            .padding(.horizontal)
            .padding(.vertical, 4)

            // Product list
            if viewModel.isLoading && viewModel.products.isEmpty {
                Spacer()
                ProgressView("Loading inventory...")
                Spacer()
            } else if viewModel.filteredProducts.isEmpty {
                Spacer()
                emptyStateView
                Spacer()
            } else {
                List {
                    ForEach(viewModel.filteredProducts) { product in
                        ProductRowView(product: product)
                            .contentShape(Rectangle())
                            .onTapGesture {
                                selectedProduct = product
                                showingEditSheet = true
                            }
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                Button(role: .destructive) {
                                    productToDelete = product
                                    showingDeleteAlert = true
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }

                                Button {
                                    selectedProduct = product
                                    showingEditSheet = true
                                } label: {
                                    Label("Edit", systemImage: "pencil")
                                }
                                .tint(.blue)
                            }
                            .swipeActions(edge: .leading, allowsFullSwipe: true) {
                                Button {
                                    productToAdjust = product
                                    showingAdjustSheet = true
                                } label: {
                                    Label("Adjust", systemImage: "plus.forwardslash.minus")
                                }
                                .tint(.orange)
                            }
                    }
                }
                .listStyle(.plain)
                .refreshable {
                    await viewModel.fetchProducts()
                }
            }
        }
        .navigationTitle("Inventory")
        .task {
            await viewModel.fetchProducts()
        }
        .sheet(isPresented: $showingEditSheet) {
            if let product = selectedProduct {
                NavigationStack {
                    ProductEditView(product: product, viewModel: viewModel)
                }
            }
        }
        .sheet(isPresented: $showingAdjustSheet) {
            if let product = productToAdjust {
                NavigationStack {
                    QuickAdjustSheet(product: product, viewModel: viewModel)
                }
            }
        }
        .sheet(isPresented: $showingFilters) {
            NavigationStack {
                InventoryFiltersView(viewModel: viewModel)
            }
        }
        .alert("Delete Product?", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                if let product = productToDelete {
                    Task { await viewModel.deleteProduct(product) }
                }
            }
        } message: {
            if let product = productToDelete {
                Text("Are you sure you want to delete \"\(product.name)\"? This action cannot be undone.")
            }
        }
    }

    // MARK: - Empty State

    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "shippingbox")
                .font(.system(size: 50))
                .foregroundColor(.secondary)

            Text("No Products Found")
                .font(.headline)

            if hasActiveFilters {
                Text("Try adjusting your filters")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Button("Clear Filters") {
                    viewModel.clearFilters()
                }
                .buttonStyle(.bordered)
            } else {
                Text("Add your first product using the scanner")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
    }

    private var hasActiveFilters: Bool {
        !viewModel.searchQuery.isEmpty ||
        viewModel.selectedCategory != nil ||
        viewModel.selectedCondition != nil ||
        viewModel.showLowStockOnly ||
        viewModel.showOutOfStockOnly
    }
}

// MARK: - Product Row View

struct ProductRowView: View {
    let product: Product

    var body: some View {
        HStack(spacing: 12) {
            // Image
            if let imageUrl = product.primaryImage,
               let url = URL(string: imageUrl) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                }
                .frame(width: 60, height: 60)
                .cornerRadius(8)
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(width: 60, height: 60)
                    .cornerRadius(8)
                    .overlay(
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                    )
            }

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(product.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    if let brand = product.brand {
                        Text(brand)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    if let size = product.size {
                        Text("Size \(size)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                HStack {
                    Text(product.formattedPrice)
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    Spacer()

                    // Stock indicator
                    stockBadge
                }
            }
        }
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private var stockBadge: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(stockColor)
                .frame(width: 8, height: 8)

            Text("\(product.quantity)")
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(stockColor.opacity(0.1))
        .cornerRadius(12)
    }

    private var stockColor: Color {
        if product.quantity == 0 {
            return .red
        } else if product.isLowStock {
            return .orange
        } else {
            return .green
        }
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let title: String
    let isActive: Bool
    var count: Int?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(title)
                if let count = count, count > 0 {
                    Text("(\(count))")
                }
            }
            .font(.caption)
            .fontWeight(isActive ? .semibold : .regular)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isActive ? Color.blue : Color(.systemGray5))
            .foregroundColor(isActive ? .white : .primary)
            .cornerRadius(16)
        }
    }
}

// MARK: - Inventory Filters View

struct InventoryFiltersView: View {
    @ObservedObject var viewModel: InventoryViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var categories: [Category] = []

    var body: some View {
        Form {
            Section("Category") {
                Picker("Category", selection: $viewModel.selectedCategory) {
                    Text("All Categories").tag(nil as Category?)
                    ForEach(categories) { category in
                        Text(category.name).tag(category as Category?)
                    }
                }
            }

            Section("Condition") {
                Picker("Condition", selection: $viewModel.selectedCondition) {
                    Text("All Conditions").tag(nil as ProductCondition?)
                    ForEach(ProductCondition.allCases, id: \.self) { condition in
                        Text(condition.displayName).tag(condition as ProductCondition?)
                    }
                }
            }

            Section("Stock Status") {
                Toggle("Low Stock Only", isOn: $viewModel.showLowStockOnly)
                Toggle("Out of Stock Only", isOn: $viewModel.showOutOfStockOnly)
            }

            Section {
                Button("Clear All Filters") {
                    viewModel.clearFilters()
                }
                .foregroundColor(.red)
            }
        }
        .navigationTitle("Filters")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Done") {
                    dismiss()
                }
            }
        }
        .task {
            do {
                categories = try await SupabaseService.shared.fetchCategories()
            } catch {
                print("Failed to load categories: \(error)")
            }
        }
    }
}

#Preview {
    NavigationStack {
        InventoryListView()
    }
}
