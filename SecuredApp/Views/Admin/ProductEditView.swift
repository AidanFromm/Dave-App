//
//  ProductEditView.swift
//  SecuredApp
//
//  Edit existing product details
//

import SwiftUI
import PhotosUI

struct ProductEditView: View {
    let product: Product
    @ObservedObject var viewModel: InventoryViewModel

    @Environment(\.dismiss) private var dismiss

    // Form fields
    @State private var name: String
    @State private var brand: String
    @State private var sku: String
    @State private var barcodeField: String
    @State private var size: String
    @State private var colorway: String
    @State private var productDescription: String
    @State private var condition: ProductCondition
    @State private var hasBox: Bool
    @State private var price: String
    @State private var cost: String
    @State private var quantity: String
    @State private var lowStockThreshold: String
    @State private var isActive: Bool
    @State private var isFeatured: Bool

    // Images
    @State private var imageUrls: [String]
    @State private var selectedPhotos: [PhotosPickerItem] = []
    @State private var uploadedImages: [UIImage] = []

    // Categories
    @State private var categories: [Category] = []
    @State private var selectedCategoryId: UUID?

    // UI State
    @State private var isSaving = false
    @State private var showingSuccessAlert = false

    init(product: Product, viewModel: InventoryViewModel) {
        self.product = product
        self.viewModel = viewModel

        // Initialize state from product
        _name = State(initialValue: product.name)
        _brand = State(initialValue: product.brand ?? "")
        _sku = State(initialValue: product.sku ?? "")
        _barcodeField = State(initialValue: product.barcode ?? "")
        _size = State(initialValue: product.size ?? "")
        _colorway = State(initialValue: product.colorway ?? "")
        _productDescription = State(initialValue: product.description ?? "")
        _condition = State(initialValue: product.condition)
        _hasBox = State(initialValue: product.hasBox)
        _price = State(initialValue: "\(product.price)")
        _cost = State(initialValue: product.cost != nil ? "\(product.cost!)" : "")
        _quantity = State(initialValue: "\(product.quantity)")
        _lowStockThreshold = State(initialValue: "\(product.lowStockThreshold)")
        _isActive = State(initialValue: product.isActive)
        _isFeatured = State(initialValue: product.isFeatured)
        _imageUrls = State(initialValue: product.images)
        _selectedCategoryId = State(initialValue: product.categoryId)
    }

    var body: some View {
        Form {
            // Product Info Section
            Section("Product Information") {
                TextField("Product Name *", text: $name)

                TextField("Brand", text: $brand)

                TextField("SKU / Style ID", text: $sku)

                TextField("Barcode / UPC", text: $barcodeField)
                    .keyboardType(.numberPad)

                TextField("Size", text: $size)

                TextField("Colorway", text: $colorway)

                TextField("Description", text: $productDescription, axis: .vertical)
                    .lineLimit(3...6)
            }

            // Category Section
            Section("Category") {
                Picker("Category", selection: $selectedCategoryId) {
                    Text("No Category").tag(nil as UUID?)
                    ForEach(categories) { category in
                        Text(category.name).tag(category.id as UUID?)
                    }
                }
            }

            // Condition Section
            Section("Condition") {
                Picker("Condition", selection: $condition) {
                    ForEach(ProductCondition.allCases, id: \.self) { cond in
                        Text(cond.displayName).tag(cond)
                    }
                }
                .pickerStyle(.segmented)

                Toggle("Has Original Box", isOn: $hasBox)
            }

            // Pricing Section
            Section("Pricing") {
                HStack {
                    Text("$")
                    TextField("Selling Price *", text: $price)
                        .keyboardType(.decimalPad)
                }

                HStack {
                    Text("$")
                    TextField("Cost (optional)", text: $cost)
                        .keyboardType(.decimalPad)
                }
            }

            // Inventory Section
            Section("Inventory") {
                HStack {
                    Text("Quantity")
                    Spacer()
                    TextField("", text: $quantity)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 60)
                }

                HStack {
                    Text("Low Stock Alert")
                    Spacer()
                    TextField("", text: $lowStockThreshold)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 60)
                }
            }

            // Status Section
            Section("Status") {
                Toggle("Active (visible in store)", isOn: $isActive)
                Toggle("Featured", isOn: $isFeatured)
            }

            // Images Section
            Section("Images") {
                if !imageUrls.isEmpty || !uploadedImages.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(imageUrls, id: \.self) { urlString in
                                if let url = URL(string: urlString) {
                                    AsyncImage(url: url) { image in
                                        image
                                            .resizable()
                                            .aspectRatio(contentMode: .fill)
                                    } placeholder: {
                                        ProgressView()
                                    }
                                    .frame(width: 100, height: 100)
                                    .cornerRadius(8)
                                    .overlay(
                                        Button(action: {
                                            imageUrls.removeAll { $0 == urlString }
                                        }) {
                                            Image(systemName: "xmark.circle.fill")
                                                .foregroundColor(.white)
                                                .background(Circle().fill(Color.black.opacity(0.5)))
                                        }
                                        .offset(x: 40, y: -40)
                                    )
                                }
                            }

                            ForEach(uploadedImages.indices, id: \.self) { index in
                                Image(uiImage: uploadedImages[index])
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(width: 100, height: 100)
                                    .cornerRadius(8)
                                    .overlay(
                                        Button(action: {
                                            uploadedImages.remove(at: index)
                                        }) {
                                            Image(systemName: "xmark.circle.fill")
                                                .foregroundColor(.white)
                                                .background(Circle().fill(Color.black.opacity(0.5)))
                                        }
                                        .offset(x: 40, y: -40)
                                    )
                            }
                        }
                        .padding(.vertical, 8)
                    }
                }

                PhotosPicker(
                    selection: $selectedPhotos,
                    maxSelectionCount: 5,
                    matching: .images
                ) {
                    Label("Add Photos", systemImage: "photo.badge.plus")
                }
                .onChange(of: selectedPhotos) { _, newItems in
                    Task { await loadSelectedPhotos(newItems) }
                }
            }

            // Error Message
            if let error = viewModel.error {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("Edit Product")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }

            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    Task { await saveChanges() }
                }
                .disabled(!isFormValid || isSaving)
            }
        }
        .task {
            await loadCategories()
        }
        .alert("Changes Saved!", isPresented: $showingSuccessAlert) {
            Button("OK") {
                dismiss()
            }
        }
    }

    // MARK: - Form Validation

    private var isFormValid: Bool {
        !name.isEmpty &&
        !price.isEmpty &&
        Decimal(string: price) != nil &&
        Int(quantity) != nil
    }

    // MARK: - Load Categories

    private func loadCategories() async {
        do {
            categories = try await SupabaseService.shared.fetchCategories()
        } catch {
            print("Failed to load categories: \(error)")
        }
    }

    // MARK: - Load Photos

    private func loadSelectedPhotos(_ items: [PhotosPickerItem]) async {
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                uploadedImages.append(image)
            }
        }
        selectedPhotos = []
    }

    // MARK: - Save Changes

    private func saveChanges() async {
        isSaving = true

        // Build updated product
        let updatedProduct = Product(
            id: product.id,
            sku: sku.isEmpty ? nil : sku,
            barcode: barcodeField.isEmpty ? nil : barcodeField,
            name: name,
            description: productDescription.isEmpty ? nil : productDescription,
            categoryId: selectedCategoryId,
            brand: brand.isEmpty ? nil : brand,
            size: size.isEmpty ? nil : size,
            condition: condition,
            colorway: colorway.isEmpty ? nil : colorway,
            hasBox: hasBox,
            price: Decimal(string: price) ?? product.price,
            cost: cost.isEmpty ? nil : Decimal(string: cost),
            compareAtPrice: product.compareAtPrice,
            quantity: Int(quantity) ?? product.quantity,
            lowStockThreshold: Int(lowStockThreshold) ?? product.lowStockThreshold,
            images: imageUrls, // TODO: Upload new images
            isDrop: product.isDrop,
            dropDate: product.dropDate,
            ebayListingId: product.ebayListingId,
            whatnotListingId: product.whatnotListingId,
            isActive: isActive,
            isFeatured: isFeatured,
            tags: product.tags,
            createdAt: product.createdAt,
            updatedAt: Date()
        )

        let success = await viewModel.updateProduct(updatedProduct)

        isSaving = false

        if success {
            showingSuccessAlert = true
        }
    }
}

#Preview {
    NavigationStack {
        ProductEditView(
            product: Product.preview,
            viewModel: InventoryViewModel()
        )
    }
}
