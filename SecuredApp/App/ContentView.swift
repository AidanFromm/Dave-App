//
//  ContentView.swift
//  SecuredApp
//
//  Main tab navigation view with premium styling
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var cartViewModel: CartViewModel
    @EnvironmentObject var authViewModel: AuthViewModel
    @EnvironmentObject var wishlistViewModel: WishlistViewModel

    // TODO: Check if user is admin before showing Admin tab
    // For now, showing to all users during development
    private let isAdmin = true

    var body: some View {
        TabView {
            ShopView()
                .tabItem {
                    Label("Shop", systemImage: "bag.fill")
                }

            CartView()
                .tabItem {
                    Label("Cart", systemImage: "cart.fill")
                }
                .badge(cartViewModel.itemCount)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }

            // Admin tab - only visible to admin users
            if isAdmin {
                AdminTabView()
                    .tabItem {
                        Label("Admin", systemImage: "gearshape.fill")
                    }
            }
        }
        .tint(Color.securedAccent)
        .sheet(isPresented: $authViewModel.showPasswordResetForm) {
            ResetPasswordFormView()
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(CartViewModel())
        .environmentObject(AuthViewModel())
        .environmentObject(WishlistViewModel())
}
