//
//  ProductLookupView.swift
//  SecuredApp
//
//  Looks up scanned barcode in StockX, shows results or search fallback
//

import SwiftUI

struct ProductLookupView: View {
    let barcode: String

    @StateObject private var stockXService = StockXService.shared
    @State private var lookupResult: StockXLookupResult?
    @State private var searchResults: [StockXProduct] = []
    @State private var isLoading = true
    @State private var error: String?
    @State private var showSearch = false
    @State private var searchQuery = ""
    @State private var selectedProduct: StockXProductDetail?
    @State private var selectedVariant: StockXVariant?
    @State private var navigateToEntry = false

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Barcode display
                HStack {
                    Image(systemName: "barcode")
                        .foregroundColor(.secondary)
                    Text(barcode)
                        .font(.system(.body, design: .monospaced))
                    Spacer()
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)

                if isLoading {
                    loadingView
                } else if let result = lookupResult {
                    // Found in StockX
                    foundProductView(result)
                } else if showSearch {
                    // Search mode
                    searchView
                } else {
                    // Not found
                    notFoundView
                }
            }
            .padding()
        }
        .navigationTitle("Product Lookup")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await lookupBarcode()
        }
        .navigationDestination(isPresented: $navigateToEntry) {
            if let product = selectedProduct {
                ProductEntryView(
                    stockXProduct: product,
                    variant: selectedVariant,
                    barcode: barcode
                )
            } else {
                ProductEntryView(barcode: barcode)
            }
        }
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)

            Text("Looking up product in StockX...")
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }

    // MARK: - Found Product View

    private func foundProductView(_ result: StockXLookupResult) -> some View {
        VStack(spacing: 20) {
            // Success banner
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
                Text("Product Found!")
                    .fontWeight(.semibold)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.green.opacity(0.1))
            .cornerRadius(8)

            // Product card
            VStack(alignment: .leading, spacing: 12) {
                // Image
                if let imageUrl = result.product.imageUrl,
                   let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } placeholder: {
                        Rectangle()
                            .fill(Color.gray.opacity(0.2))
                            .overlay(ProgressView())
                    }
                    .frame(height: 200)
                    .cornerRadius(12)
                }

                // Details
                Text(result.product.name)
                    .font(.headline)

                HStack {
                    if let brand = result.product.brand {
                        Label(brand, systemImage: "tag")
                    }
                    Spacer()
                    Text("Size: \(result.displaySize)")
                        .fontWeight(.medium)
                }
                .font(.subheadline)
                .foregroundColor(.secondary)

                if let colorway = result.product.colorway {
                    Text("Colorway: \(colorway)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                if let price = result.product.retailPrice {
                    Text("Retail: $\(price)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                if let styleId = result.product.styleId {
                    Text("Style: \(styleId)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.1), radius: 5, y: 2)

            // Add button
            Button(action: {
                selectedProduct = result.product
                selectedVariant = result.matchedVariant
                navigateToEntry = true
            }) {
                Label("Add to Inventory", systemImage: "plus.circle.fill")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
        }
    }

    // MARK: - Not Found View

    private var notFoundView: some View {
        VStack(spacing: 20) {
            Image(systemName: "questionmark.circle")
                .font(.system(size: 60))
                .foregroundColor(.orange)

            Text("Product Not Found")
                .font(.title2)
                .fontWeight(.semibold)

            Text("This barcode wasn't found in StockX.\nYou can search by name or enter manually.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            VStack(spacing: 12) {
                Button(action: { showSearch = true }) {
                    Label("Search StockX", systemImage: "magnifyingglass")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                }

                Button(action: {
                    selectedProduct = nil
                    navigateToEntry = true
                }) {
                    Label("Enter Manually", systemImage: "square.and.pencil")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray5))
                        .foregroundColor(.primary)
                        .cornerRadius(12)
                }
            }
        }
        .padding(.vertical, 20)
    }

    // MARK: - Search View

    private var searchView: some View {
        VStack(spacing: 16) {
            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField("Search by name, style ID...", text: $searchQuery)
                    .textFieldStyle(.plain)
                    .onSubmit {
                        Task { await searchStockX() }
                    }

                if !searchQuery.isEmpty {
                    Button(action: { searchQuery = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)

            Button(action: { Task { await searchStockX() } }) {
                Text("Search")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(searchQuery.isEmpty ? Color.gray : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            .disabled(searchQuery.isEmpty)

            // Results
            if !searchResults.isEmpty {
                LazyVStack(spacing: 12) {
                    ForEach(searchResults) { product in
                        searchResultRow(product)
                    }
                }
            }

            // Manual entry option
            Button(action: {
                selectedProduct = nil
                navigateToEntry = true
            }) {
                Text("Can't find it? Enter manually")
                    .font(.subheadline)
                    .foregroundColor(.blue)
            }
            .padding(.top, 8)
        }
    }

    private func searchResultRow(_ product: StockXProduct) -> some View {
        Button(action: {
            Task { await selectProduct(product) }
        }) {
            HStack(spacing: 12) {
                // Thumbnail
                if let thumbUrl = product.thumbnailUrl,
                   let url = URL(string: thumbUrl) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
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
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(product.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .lineLimit(2)
                        .foregroundColor(.primary)

                    if let brand = product.brand {
                        Text(brand)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.05), radius: 2, y: 1)
        }
    }

    // MARK: - API Calls

    private func lookupBarcode() async {
        isLoading = true
        error = nil

        do {
            lookupResult = try await stockXService.lookupByBarcode(barcode)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    private func searchStockX() async {
        guard !searchQuery.isEmpty else { return }

        isLoading = true
        error = nil

        do {
            searchResults = try await stockXService.searchProducts(query: searchQuery)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    private func selectProduct(_ product: StockXProduct) async {
        isLoading = true

        do {
            let detail = try await stockXService.getProduct(id: product.id)
            let variants = try await stockXService.getProductVariants(productId: product.id)

            selectedProduct = detail
            selectedVariant = variants.first
            navigateToEntry = true
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }
}

#Preview {
    NavigationStack {
        ProductLookupView(barcode: "194956623137")
    }
}
