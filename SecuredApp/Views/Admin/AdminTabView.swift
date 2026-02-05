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
    @StateObject private var inventoryVM = InventoryViewModel()
    @State private var showingScanner = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Quick Stats
                    statsSection

                    // Quick Actions
                    quickActionsSection

                    // StockX Connection
                    stockXConnectionSection

                    // Recent Activity (placeholder for future)
                    recentActivitySection
                }
                .padding()
            }
            .navigationTitle("Admin Dashboard")
            .refreshable {
                await inventoryVM.fetchProducts()
            }
            .task {
                await inventoryVM.fetchProducts()
            }
            .fullScreenCover(isPresented: $showingScanner) {
                NavigationStack {
                    BarcodeScannerView()
                }
            }
        }
    }

    // MARK: - Stats Section

    private var statsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Inventory Overview")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                StatCard(
                    title: "Total Products",
                    value: "\(inventoryVM.totalProducts)",
                    icon: "shippingbox.fill",
                    color: .blue
                )

                StatCard(
                    title: "Low Stock",
                    value: "\(inventoryVM.lowStockCount)",
                    icon: "exclamationmark.triangle.fill",
                    color: inventoryVM.lowStockCount > 0 ? .orange : .green
                )

                StatCard(
                    title: "Out of Stock",
                    value: "\(inventoryVM.outOfStockCount)",
                    icon: "xmark.circle.fill",
                    color: inventoryVM.outOfStockCount > 0 ? .red : .green
                )

                StatCard(
                    title: "Inventory Value",
                    value: formatCurrency(inventoryVM.totalInventoryValue),
                    icon: "dollarsign.circle.fill",
                    color: .green
                )
            }
        }
    }

    // MARK: - Quick Actions Section

    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            VStack(spacing: 12) {
                // Scan Barcode - Primary Action
                Button(action: { showingScanner = true }) {
                    HStack {
                        Image(systemName: "barcode.viewfinder")
                            .font(.title2)

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Scan Barcode")
                                .font(.headline)
                            Text("Add new item with camera or scanner")
                                .font(.caption)
                                .opacity(0.8)
                        }

                        Spacer()

                        Image(systemName: "chevron.right")
                    }
                    .foregroundColor(.white)
                    .padding()
                    .background(
                        LinearGradient(
                            colors: stockXAuth.isAuthenticated ? [.blue, .blue.opacity(0.8)] : [.gray, .gray.opacity(0.8)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(12)
                }
                .disabled(!stockXAuth.isAuthenticated)

                if !stockXAuth.isAuthenticated {
                    HStack {
                        Image(systemName: "info.circle")
                            .foregroundColor(.orange)
                        Text("Connect StockX to enable barcode scanning")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }

                // Secondary Actions
                HStack(spacing: 12) {
                    NavigationLink {
                        ManualEntryView()
                    } label: {
                        ActionCard(
                            title: "Manual Entry",
                            subtitle: "Add without scan",
                            icon: "square.and.pencil",
                            color: .orange
                        )
                    }

                    NavigationLink {
                        InventoryListView()
                    } label: {
                        ActionCard(
                            title: "Inventory",
                            subtitle: "View & edit all",
                            icon: "list.bullet.clipboard",
                            color: .purple
                        )
                    }
                }
            }
        }
    }

    // MARK: - StockX Connection Section

    private var stockXConnectionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("API Connections")
                .font(.headline)

            NavigationLink {
                StockXLoginView()
            } label: {
                HStack {
                    // Status indicator
                    Circle()
                        .fill(stockXAuth.isAuthenticated ? Color.green : Color.red)
                        .frame(width: 12, height: 12)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("StockX API")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.primary)

                        Text(stockXAuth.isAuthenticated ? "Connected - Ready for lookups" : "Not connected - Tap to connect")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    if stockXAuth.isAuthenticated {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                    } else {
                        Text("Connect")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.blue)
                            .cornerRadius(16)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Recent Activity Section

    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Quick Links")
                    .font(.headline)
                Spacer()
            }

            VStack(spacing: 8) {
                QuickLinkRow(
                    title: "Low Stock Items",
                    count: inventoryVM.lowStockCount,
                    icon: "exclamationmark.triangle",
                    color: .orange
                ) {
                    // Navigate to inventory with low stock filter
                }

                QuickLinkRow(
                    title: "Out of Stock",
                    count: inventoryVM.outOfStockCount,
                    icon: "xmark.circle",
                    color: .red
                ) {
                    // Navigate to inventory with out of stock filter
                }

                NavigationLink {
                    InventoryListView()
                } label: {
                    HStack {
                        Image(systemName: "arrow.right.circle")
                            .foregroundColor(.blue)
                        Text("View All Inventory")
                            .font(.subheadline)
                            .foregroundColor(.primary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                }
            }
        }
    }

    // MARK: - Helpers

    private func formatCurrency(_ value: Decimal) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.maximumFractionDigits = 0
        return formatter.string(from: value as NSDecimalNumber) ?? "$0"
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
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .lineLimit(1)
                .minimumScaleFactor(0.8)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Action Card Component

struct ActionCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)

            Text(subtitle)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Quick Link Row

struct QuickLinkRow: View {
    let title: String
    let count: Int
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)

                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.primary)

                Spacer()

                if count > 0 {
                    Text("\(count)")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(color)
                        .cornerRadius(12)
                }

                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(8)
        }
    }
}

#Preview {
    AdminTabView()
}
