//
//  ContentView.swift
//  SecuredApp
//
//  Main tab navigation view
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var cartViewModel: CartViewModel

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
        }
        .tint(.primary)
    }
}

#Preview {
    ContentView()
        .environmentObject(CartViewModel())
        .environmentObject(AuthViewModel())
}
