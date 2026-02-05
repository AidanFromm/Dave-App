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
    @StateObject private var themeManager = ThemeManager()
    @StateObject private var splashManager = SplashManager()

    var body: some Scene {
        WindowGroup {
            ZStack {
                ContentView()
                    .environmentObject(cartViewModel)
                    .environmentObject(authViewModel)
                    .environmentObject(wishlistViewModel)
                    .environmentObject(themeManager)
                    .preferredColorScheme(themeManager.resolvedColorScheme)
                    .onOpenURL { url in
                        Task {
                            await authViewModel.handleAuthCallback(url: url)
                        }
                    }
                    .opacity(splashManager.showSplash ? 0 : 1)

                if splashManager.showSplash {
                    SplashView()
                        .environmentObject(splashManager)
                        .transition(.opacity)
                }
            }
            .onAppear {
                splashManager.startSplash()
            }
        }
    }
}
