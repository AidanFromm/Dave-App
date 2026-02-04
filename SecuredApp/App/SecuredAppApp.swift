//
//  SecuredAppApp.swift
//  SecuredApp
//
//  Main entry point for the Secured App
//

import SwiftUI

@main
struct SecuredAppApp: App {
    @StateObject private var cartViewModel = CartViewModel()
    @StateObject private var authViewModel = AuthViewModel()
    @StateObject private var wishlistViewModel = WishlistViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(cartViewModel)
                .environmentObject(authViewModel)
                .environmentObject(wishlistViewModel)
        }
    }
}
