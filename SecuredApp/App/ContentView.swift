//
//  ContentView.swift
//  SecuredApp
//
//  Main tab navigation view
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var cartViewModel: CartViewModel

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
        .tint(.primary)
    }
}

#Preview {
    ContentView()
        .environmentObject(CartViewModel())
        .environmentObject(AuthViewModel())
}
