//
//  QuickAdjustSheet.swift
//  SecuredApp
//
//  Quick quantity adjustment with reason logging
//

import SwiftUI

struct QuickAdjustSheet: View {
    let product: Product
    @ObservedObject var viewModel: InventoryViewModel

    @Environment(\.dismiss) private var dismiss

    @State private var adjustmentAmount = 0
    @State private var reason: AdjustmentReason = .received
    @State private var customReason = ""
    @State private var isSaving = false
    @State private var showingSuccessAlert = false

    enum AdjustmentReason: String, CaseIterable {
        case received = "Received shipment"
        case damaged = "Damaged/Defective"
        case stolen = "Theft/Loss"
        case returned = "Customer return"
        case correction = "Inventory correction"
        case sold = "Manual sale"
        case other = "Other"

        var isAddition: Bool {
            switch self {
            case .received, .returned, .correction:
                return true
            default:
                return false
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Product info header
            HStack(spacing: 12) {
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
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(product.name)
                        .font(.headline)
                        .lineLimit(1)

                    HStack {
                        Text("Current Stock:")
                        Text("\(product.quantity)")
                            .fontWeight(.semibold)
                            .foregroundColor(product.quantity == 0 ? .red : .primary)
                    }
                    .font(.subheadline)
                }

                Spacer()
            }
            .padding()
            .background(Color(.systemGray6))

            Form {
                // Adjustment amount
                Section("Adjustment") {
                    HStack {
                        Button(action: { adjustmentAmount -= 1 }) {
                            Image(systemName: "minus.circle.fill")
                                .font(.title)
                                .foregroundColor(.red)
                        }
                        .buttonStyle(.plain)

                        Spacer()

                        VStack {
                            Text(adjustmentAmount >= 0 ? "+\(adjustmentAmount)" : "\(adjustmentAmount)")
                                .font(.system(size: 48, weight: .bold, design: .rounded))
                                .foregroundColor(adjustmentAmount >= 0 ? .green : .red)

                            Text("New total: \(max(0, product.quantity + adjustmentAmount))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        Spacer()

                        Button(action: { adjustmentAmount += 1 }) {
                            Image(systemName: "plus.circle.fill")
                                .font(.title)
                                .foregroundColor(.green)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.vertical, 8)

                    // Quick buttons
                    HStack(spacing: 12) {
                        ForEach([-5, -1, 1, 5], id: \.self) { amount in
                            Button(action: { adjustmentAmount += amount }) {
                                Text(amount > 0 ? "+\(amount)" : "\(amount)")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 8)
                                    .background(amount > 0 ? Color.green.opacity(0.2) : Color.red.opacity(0.2))
                                    .foregroundColor(amount > 0 ? .green : .red)
                                    .cornerRadius(8)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }

                // Reason
                Section("Reason") {
                    Picker("Reason", selection: $reason) {
                        ForEach(AdjustmentReason.allCases, id: \.self) { r in
                            Text(r.rawValue).tag(r)
                        }
                    }
                    .pickerStyle(.menu)

                    if reason == .other {
                        TextField("Describe reason...", text: $customReason)
                    }
                }

                // Warning if going negative
                if product.quantity + adjustmentAmount < 0 {
                    Section {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                            Text("Quantity cannot go below 0. Will be set to 0.")
                                .font(.caption)
                                .foregroundColor(.orange)
                        }
                    }
                }

                // Error message
                if let error = viewModel.error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }

            // Save button
            VStack(spacing: 12) {
                Button(action: { Task { await saveAdjustment() } }) {
                    HStack {
                        if isSaving {
                            ProgressView()
                                .tint(.white)
                        }
                        Text(isSaving ? "Saving..." : "Save Adjustment")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(adjustmentAmount == 0 ? Color.gray : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(adjustmentAmount == 0 || isSaving)
            }
            .padding()
            .background(Color(.systemBackground))
        }
        .navigationTitle("Adjust Quantity")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }
        }
        .alert("Adjustment Saved!", isPresented: $showingSuccessAlert) {
            Button("OK") {
                dismiss()
            }
        } message: {
            let newQty = max(0, product.quantity + adjustmentAmount)
            Text("Stock updated from \(product.quantity) to \(newQty)")
        }
    }

    // MARK: - Save

    private func saveAdjustment() async {
        isSaving = true

        let reasonText = reason == .other ? customReason : reason.rawValue

        let success = await viewModel.adjustQuantity(
            product: product,
            adjustment: adjustmentAmount,
            reason: reasonText
        )

        isSaving = false

        if success {
            showingSuccessAlert = true
        }
    }
}

#Preview {
    NavigationStack {
        QuickAdjustSheet(
            product: Product.preview,
            viewModel: InventoryViewModel()
        )
    }
}
