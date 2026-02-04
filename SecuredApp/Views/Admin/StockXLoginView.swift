//
//  StockXLoginView.swift
//  SecuredApp
//
//  StockX OAuth login UI for admin inventory management
//

import SwiftUI

struct StockXLoginView: View {
    @ObservedObject var authManager = StockXAuthManager.shared

    var body: some View {
        VStack(spacing: 24) {
            // StockX Logo/Header
            VStack(spacing: 8) {
                Image(systemName: "shoeprints.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.green)

                Text("StockX Integration")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Connect your StockX account to lookup products by barcode")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            .padding(.top, 40)

            Spacer()

            // Status Section
            if authManager.isAuthenticated {
                // Connected State
                VStack(spacing: 16) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.green)

                    Text("Connected to StockX")
                        .font(.headline)
                        .foregroundColor(.green)

                    Text("You can now scan barcodes to lookup products")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(12)
                .padding(.horizontal)

                // Disconnect Button
                Button(action: {
                    authManager.logout()
                }) {
                    Text("Disconnect Account")
                        .font(.subheadline)
                        .foregroundColor(.red)
                }
                .padding(.top, 8)

            } else {
                // Not Connected State
                VStack(spacing: 16) {
                    if let error = authManager.error {
                        // Error Message
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.orange)
                            Text(error)
                                .font(.subheadline)
                                .foregroundColor(.orange)
                        }
                        .padding()
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(8)
                    }

                    // Login Button
                    Button(action: {
                        Task {
                            await authManager.login()
                        }
                    }) {
                        HStack {
                            if authManager.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            } else {
                                Image(systemName: "link")
                            }
                            Text(authManager.isLoading ? "Connecting..." : "Connect StockX Account")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(authManager.isLoading)
                    .padding(.horizontal)
                }
            }

            Spacer()

            // Info Footer
            VStack(spacing: 8) {
                Text("Why connect StockX?")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                VStack(alignment: .leading, spacing: 4) {
                    InfoRow(icon: "barcode.viewfinder", text: "Scan shoe barcodes to auto-fill product info")
                    InfoRow(icon: "photo", text: "Get official product images")
                    InfoRow(icon: "dollarsign.circle", text: "See current market prices")
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            .padding(.horizontal)
            .padding(.bottom, 20)
        }
        .navigationTitle("StockX Login")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Info Row Component
struct InfoRow: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .frame(width: 20)
            Text(text)
        }
    }
}

#Preview {
    NavigationStack {
        StockXLoginView()
    }
}
