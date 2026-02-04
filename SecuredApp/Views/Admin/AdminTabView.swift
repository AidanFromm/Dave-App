//
//  AdminTabView.swift
//  SecuredApp
//
//  Admin dashboard for inventory management
//  Access restricted to admin users only
//

import SwiftUI

struct AdminTabView: View {
    @StateObject private var stockXAuth = StockXAuthManager.shared

    var body: some View {
        NavigationStack {
            List {
                // StockX Connection Section
                Section {
                    NavigationLink {
                        StockXLoginView()
                    } label: {
                        HStack {
                            Image(systemName: "link.circle.fill")
                                .font(.title2)
                                .foregroundColor(stockXAuth.isAuthenticated ? .green : .gray)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("StockX Connection")
                                    .font(.headline)
                                Text(stockXAuth.isAuthenticated ? "Connected" : "Not connected")
                                    .font(.caption)
                                    .foregroundColor(stockXAuth.isAuthenticated ? .green : .secondary)
                            }

                            Spacer()

                            if stockXAuth.isAuthenticated {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                } header: {
                    Text("API Connections")
                }

                // Inventory Actions Section
                Section {
                    NavigationLink {
                        BarcodeScannerView()
                    } label: {
                        HStack {
                            Image(systemName: "barcode.viewfinder")
                                .font(.title2)
                                .foregroundColor(.blue)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Scan Barcode")
                                    .font(.headline)
                                Text("Add new inventory item")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .disabled(!stockXAuth.isAuthenticated)
                    .opacity(stockXAuth.isAuthenticated ? 1.0 : 0.5)

                    NavigationLink {
                        ManualEntryView()
                    } label: {
                        HStack {
                            Image(systemName: "square.and.pencil")
                                .font(.title2)
                                .foregroundColor(.orange)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Manual Entry")
                                    .font(.headline)
                                Text("Add item without barcode")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }

                    NavigationLink {
                        InventoryListView()
                    } label: {
                        HStack {
                            Image(systemName: "list.bullet.clipboard")
                                .font(.title2)
                                .foregroundColor(.purple)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("View Inventory")
                                    .font(.headline)
                                Text("Browse all products")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                } header: {
                    Text("Inventory Management")
                } footer: {
                    if !stockXAuth.isAuthenticated {
                        Text("Connect StockX to enable barcode scanning")
                            .foregroundColor(.orange)
                    }
                }

                // Quick Stats Section
                Section {
                    HStack {
                        StatCard(title: "Total Items", value: "—", icon: "shippingbox.fill", color: .blue)
                        StatCard(title: "Low Stock", value: "—", icon: "exclamationmark.triangle.fill", color: .orange)
                    }
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                } header: {
                    Text("Quick Stats")
                }
            }
            .navigationTitle("Admin")
        }
    }
}

// MARK: - Stat Card Component
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title)
                .foregroundColor(color)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .padding(4)
    }
}

// MARK: - Placeholder Views (to be implemented)
struct BarcodeScannerView: View {
    var body: some View {
        Text("Barcode Scanner Coming Soon")
            .navigationTitle("Scan Barcode")
    }
}

struct ManualEntryView: View {
    var body: some View {
        Text("Manual Entry Coming Soon")
            .navigationTitle("Manual Entry")
    }
}

struct InventoryListView: View {
    var body: some View {
        Text("Inventory List Coming Soon")
            .navigationTitle("Inventory")
    }
}

#Preview {
    AdminTabView()
}
