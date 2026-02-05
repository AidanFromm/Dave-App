//
//  ManualEntryView.swift
//  SecuredApp
//
//  Manual product entry without barcode scanning
//  Used for Pokemon items and products not in StockX
//

import SwiftUI

struct ManualEntryView: View {
    @State private var selectedType: ProductType = .sneakers

    enum ProductType: String, CaseIterable {
        case sneakers = "Sneakers"
        case pokemon = "Pokemon"

        var icon: String {
            switch self {
            case .sneakers: return "shoe.fill"
            case .pokemon: return "sparkles"
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Type selector
            Picker("Product Type", selection: $selectedType) {
                ForEach(ProductType.allCases, id: \.self) { type in
                    Label(type.rawValue, systemImage: type.icon).tag(type)
                }
            }
            .pickerStyle(.segmented)
            .padding()

            // Form based on type
            if selectedType == .sneakers {
                ProductEntryView()
            } else {
                PokemonEntryView()
            }
        }
        .navigationTitle("Manual Entry")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Pokemon Entry View

struct PokemonEntryView: View {
    @StateObject private var viewModel = InventoryViewModel()
    @Environment(\.dismiss) private var dismiss

    // Form fields
    @State private var name = ""
    @State private var setName = ""
    @State private var cardNumber = ""
    @State private var rarity = ""
    @State private var condition: PokemonCondition = .nearMint
    @State private var isGraded = false
    @State private var gradingCompany = ""
    @State private var grade = ""
    @State private var price = ""
    @State private var cost = ""
    @State private var quantity = "1"
    @State private var productDescription = ""

    // Categories
    @State private var categories: [Category] = []
    @State private var pokemonCategoryId: UUID?

    // UI State
    @State private var isSaving = false
    @State private var showingSuccessAlert = false

    enum PokemonCondition: String, CaseIterable {
        case mint = "Mint"
        case nearMint = "Near Mint"
        case excellent = "Excellent"
        case good = "Good"
        case lightlyPlayed = "Lightly Played"
        case played = "Played"
        case poor = "Poor"

        var productCondition: ProductCondition {
            switch self {
            case .mint, .nearMint:
                return .new
            case .excellent, .good:
                return .usedLikeNew
            case .lightlyPlayed:
                return .usedGood
            case .played, .poor:
                return .usedFair
            }
        }
    }

    var body: some View {
        Form {
            Section("Card Information") {
                TextField("Card Name *", text: $name)

                TextField("Set Name", text: $setName)

                TextField("Card Number (e.g., 25/102)", text: $cardNumber)

                TextField("Rarity", text: $rarity)
            }

            Section("Condition") {
                Picker("Condition", selection: $condition) {
                    ForEach(PokemonCondition.allCases, id: \.self) { cond in
                        Text(cond.rawValue).tag(cond)
                    }
                }

                Toggle("Graded Card", isOn: $isGraded)

                if isGraded {
                    TextField("Grading Company (PSA, BGS, CGC)", text: $gradingCompany)

                    TextField("Grade (e.g., 9, 10)", text: $grade)
                        .keyboardType(.decimalPad)
                }
            }

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

            Section("Inventory") {
                HStack {
                    Text("Quantity")
                    Spacer()
                    TextField("", text: $quantity)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 60)
                }
            }

            Section("Description (optional)") {
                TextField("Additional details...", text: $productDescription, axis: .vertical)
                    .lineLimit(3...6)
            }

            if let error = viewModel.error {
                Section {
                    Text(error)
                        .foregroundColor(.red)
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    Task { await saveProduct() }
                }
                .disabled(!isFormValid || isSaving)
            }
        }
        .task {
            await loadCategories()
        }
        .alert("Card Added!", isPresented: $showingSuccessAlert) {
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

    private var isFormValid: Bool {
        !name.isEmpty &&
        !price.isEmpty &&
        Decimal(string: price) != nil
    }

    private func loadCategories() async {
        do {
            categories = try await SupabaseService.shared.fetchCategories()
            pokemonCategoryId = categories.first(where: { $0.name.lowercased().contains("pokemon") })?.id
        } catch {
            print("Failed to load categories: \(error)")
        }
    }

    private func saveProduct() async {
        isSaving = true

        // Build full name with grading if applicable
        var fullName = name
        if !setName.isEmpty {
            fullName += " - \(setName)"
        }
        if !cardNumber.isEmpty {
            fullName += " #\(cardNumber)"
        }
        if isGraded && !gradingCompany.isEmpty && !grade.isEmpty {
            fullName += " (\(gradingCompany) \(grade))"
        }

        var newProduct = NewProduct()
        newProduct.name = fullName
        newProduct.description = productDescription.isEmpty ? nil : productDescription
        newProduct.categoryId = pokemonCategoryId
        newProduct.brand = "Pokemon"
        newProduct.condition = condition.productCondition
        newProduct.hasBox = false
        newProduct.price = Decimal(string: price) ?? 0
        newProduct.cost = cost.isEmpty ? nil : Decimal(string: cost)
        newProduct.quantity = Int(quantity) ?? 1
        newProduct.lowStockThreshold = 1
        newProduct.images = []

        // Build tags
        var tags: [String] = ["pokemon"]
        if !setName.isEmpty { tags.append(setName.lowercased()) }
        if !rarity.isEmpty { tags.append(rarity.lowercased()) }
        if isGraded { tags.append("graded") }
        newProduct.tags = tags

        let success = await viewModel.addProduct(newProduct)

        isSaving = false

        if success {
            showingSuccessAlert = true
        }
    }

    private func resetForm() {
        name = ""
        setName = ""
        cardNumber = ""
        rarity = ""
        condition = .nearMint
        isGraded = false
        gradingCompany = ""
        grade = ""
        price = ""
        cost = ""
        quantity = "1"
        productDescription = ""
        viewModel.clearMessages()
    }
}

#Preview {
    NavigationStack {
        ManualEntryView()
    }
}
