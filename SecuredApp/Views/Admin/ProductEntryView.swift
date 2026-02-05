//
//  ProductEntryView.swift
//  SecuredApp
//
//  Form for adding new products to inventory
//  Can be pre-filled from StockX or entered manually
//

import SwiftUI
import PhotosUI

struct ProductEntryView: View {
    // Pre-fill data (optional)
    var stockXProduct: StockXProductDetail?
    var variant: StockXVariant?
    var barcode: String?

    @StateObject private var viewModel = InventoryViewModel()
    @Environment(\.dismiss) private var dismiss

    // Form fields
    @State private var name = ""
    @State private var brand = ""
    @State private var sku = ""
    @State private var barcodeField = ""
    @State private var size = ""
    @State private var colorway = ""
    @State private var productDescription = ""
    @State private var condition: ProductCondition = .new
    @State private var hasBox = true
    @State private var price = ""
    @State private var cost = ""
    @State private var quantity = "1"
    @State private var lowStockThreshold = "5"
    @State private var selectedCategoryId: UUID?

    // Images
    @State private var imageUrls: [String] = []
    @State private var selectedPhotos: [PhotosPickerItem] = []
    @State private var uploadedImages: [UIImage] = []
    @State private var isUploadingImages = false

    // Categories
    @State private var categories: [Category] = []

    // UI State
    @State private var showingImagePicker = false
    @State private var showingSuccessAlert = false
    @State private var isSaving = false

    init(stockXProduct: StockXProductDetail? = nil, variant: StockXVariant? = nil, barcode: String? = nil) {
        self.stockXProduct = stockXProduct
        self.variant = variant
        self.barcode = barcode
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
                    Text("Select Category").tag(nil as UUID?)
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

            // Images Section
            Section("Images") {
                if !imageUrls.isEmpty || !uploadedImages.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            // StockX images
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

                            // Uploaded images
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

                // Add photos (for used items or additional images)
                PhotosPicker(
                    selection: $selectedPhotos,
                    maxSelectionCount: 5,
                    matching: .images
                ) {
                    Label(
                        condition == .new && !imageUrls.isEmpty ? "Add More Photos" : "Add Photos",
                        systemImage: "photo.badge.plus"
                    )
                }
                .onChange(of: selectedPhotos) { _, newItems in
                    Task { await loadSelectedPhotos(newItems) }
                }

                if condition != .new {
                    Text("Upload photos for used items")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Error/Success Messages
            if let error = viewModel.error {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle(stockXProduct != nil ? "Add from StockX" : "Add Product")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }

            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    Task { await saveProduct() }
                }
                .disabled(!isFormValid || isSaving)
            }
        }
        .onAppear {
            prefillFromStockX()
            Task { await loadCategories() }
        }
        .alert("Product Added!", isPresented: $showingSuccessAlert) {
            Button("Add Another") {
                resetForm()
            }
            Button("Done") {
                dismiss()
            }
        } message: {
            Text("\(name) has been added to inventory.")
        }
    }

    // MARK: - Form Validation

    private var isFormValid: Bool {
        !name.isEmpty &&
        !price.isEmpty &&
        Decimal(string: price) != nil &&
        Int(quantity) != nil
    }

    // MARK: - Pre-fill from StockX

    private func prefillFromStockX() {
        if let product = stockXProduct {
            name = product.name
            brand = product.brand ?? ""
            sku = product.styleId ?? ""
            colorway = product.colorway ?? ""
            productDescription = product.description ?? ""

            if let retailPrice = product.retailPrice {
                price = String(retailPrice)
            }

            if let imageUrl = product.imageUrl {
                imageUrls = [imageUrl]
            }
        }

        if let variant = variant {
            size = variant.sizeUS ?? variant.sizeEU ?? ""
        }

        if let barcode = barcode {
            barcodeField = barcode
        }
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

    // MARK: - Save Product

    private func saveProduct() async {
        isSaving = true

        // TODO: Upload images to Supabase Storage and get URLs
        // For now, just use StockX URLs or skip uploaded images
        var allImageUrls = imageUrls

        // Create the product
        var newProduct = NewProduct()
        newProduct.name = name
        newProduct.brand = brand.isEmpty ? nil : brand
        newProduct.sku = sku.isEmpty ? nil : sku
        newProduct.barcode = barcodeField.isEmpty ? nil : barcodeField
        newProduct.size = size.isEmpty ? nil : size
        newProduct.colorway = colorway.isEmpty ? nil : colorway
        newProduct.description = productDescription.isEmpty ? nil : productDescription
        newProduct.categoryId = selectedCategoryId
        newProduct.condition = condition
        newProduct.hasBox = hasBox
        newProduct.price = Decimal(string: price) ?? 0
        newProduct.cost = cost.isEmpty ? nil : Decimal(string: cost)
        newProduct.quantity = Int(quantity) ?? 1
        newProduct.lowStockThreshold = Int(lowStockThreshold) ?? 5
        newProduct.images = allImageUrls
        newProduct.tags = []

        let success = await viewModel.addProduct(newProduct)

        isSaving = false

        if success {
            showingSuccessAlert = true
        }
    }

    // MARK: - Reset Form

    private func resetForm() {
        name = ""
        brand = ""
        sku = ""
        barcodeField = ""
        size = ""
        colorway = ""
        productDescription = ""
        condition = .new
        hasBox = true
        price = ""
        cost = ""
        quantity = "1"
        lowStockThreshold = "5"
        selectedCategoryId = nil
        imageUrls = []
        uploadedImages = []
        viewModel.clearMessages()
    }
}

#Preview {
    NavigationStack {
        ProductEntryView(barcode: "123456789")
    }
}
