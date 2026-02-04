//
//  CartView.swift
//  SecuredApp
//
//  Shopping cart view
//

import SwiftUI

struct CartView: View {
    @EnvironmentObject var cartViewModel: CartViewModel
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showingCheckout = false

    var body: some View {
        NavigationStack {
            Group {
                if cartViewModel.isEmpty {
                    ContentUnavailableView(
                        "Your Cart is Empty",
                        systemImage: "cart",
                        description: Text("Add some products to get started")
                    )
                } else {
                    cartContent
                }
            }
            .navigationTitle("Cart")
            .sheet(isPresented: $showingCheckout) {
                CheckoutView()
            }
        }
    }

    private var cartContent: some View {
        VStack(spacing: 0) {
            List {
                ForEach(cartViewModel.cart.items) { item in
                    CartItemRow(item: item)
                }
                .onDelete(perform: deleteItems)
            }
            .listStyle(.plain)

            // Cart summary
            VStack(spacing: 16) {
                Divider()

                VStack(spacing: 8) {
                    SummaryRow(label: "Subtotal", value: cartViewModel.cart.formattedSubtotal)
                    SummaryRow(label: "Tax (7%)", value: cartViewModel.cart.formattedTax)
                    SummaryRow(label: "Shipping", value: cartViewModel.cart.formattedShipping)

                    Divider()

                    HStack {
                        Text("Total")
                            .font(.headline)
                        Spacer()
                        Text(cartViewModel.cart.formattedTotal)
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                }

                Button {
                    showingCheckout = true
                } label: {
                    HStack {
                        Image(systemName: "lock.fill")
                        Text("Checkout")
                    }
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            .padding()
            .background(.ultraThinMaterial)
        }
    }

    private func deleteItems(at offsets: IndexSet) {
        for index in offsets {
            let item = cartViewModel.cart.items[index]
            cartViewModel.removeFromCart(item.product.id)
        }
    }
}

struct CartItemRow: View {
    let item: CartItem
    @EnvironmentObject var cartViewModel: CartViewModel

    var body: some View {
        HStack(spacing: 12) {
            // Product image
            AsyncImage(url: URL(string: item.product.primaryImage ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color(.systemGray5))
                    .overlay {
                        Image(systemName: "photo")
                            .foregroundStyle(.gray)
                    }
            }
            .frame(width: 80, height: 80)
            .clipShape(RoundedRectangle(cornerRadius: 8))

            // Product info
            VStack(alignment: .leading, spacing: 4) {
                Text(item.product.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(2)

                if let size = item.product.size {
                    Text("Size: \(size)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Text(item.product.formattedPrice)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                // Quantity controls
                HStack(spacing: 12) {
                    Button {
                        cartViewModel.updateQuantity(
                            for: item.product.id,
                            quantity: item.quantity - 1
                        )
                    } label: {
                        Image(systemName: "minus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(.secondary)
                    }

                    Text("\(item.quantity)")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .frame(minWidth: 24)

                    Button {
                        cartViewModel.updateQuantity(
                            for: item.product.id,
                            quantity: item.quantity + 1
                        )
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(.primary)
                    }
                    .disabled(item.quantity >= item.product.quantity)
                }
            }

            Spacer()

            // Item total
            Text(item.formattedTotal)
                .font(.subheadline)
                .fontWeight(.bold)
        }
        .padding(.vertical, 8)
    }
}

struct SummaryRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
        .font(.subheadline)
    }
}

#Preview {
    CartView()
        .environmentObject(CartViewModel())
        .environmentObject(AuthViewModel())
}
