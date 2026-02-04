import Foundation
import SwiftUI
import Combine

// MARK: - Wishlist View Model

@MainActor
class WishlistViewModel: ObservableObject {

    // MARK: - Published Properties

    @Published private(set) var wishlistIds: Set<UUID> = []

    // MARK: - Storage Keys

    private let storageKey = "secured_wishlist"

    // MARK: - Computed Properties

    var count: Int {
        wishlistIds.count
    }

    var isEmpty: Bool {
        wishlistIds.isEmpty
    }

    // MARK: - Initialization

    init() {
        loadWishlist()
    }

    // MARK: - Public Methods

    /// Check if a product is in the wishlist
    func isWishlisted(_ productId: UUID) -> Bool {
        wishlistIds.contains(productId)
    }

    /// Toggle wishlist status for a product
    func toggleWishlist(_ productId: UUID) {
        if wishlistIds.contains(productId) {
            removeFromWishlist(productId)
        } else {
            addToWishlist(productId)
        }
    }

    /// Add a product to the wishlist
    func addToWishlist(_ productId: UUID) {
        wishlistIds.insert(productId)
        saveWishlist()
    }

    /// Remove a product from the wishlist
    func removeFromWishlist(_ productId: UUID) {
        wishlistIds.remove(productId)
        saveWishlist()
    }

    /// Clear the entire wishlist
    func clearWishlist() {
        wishlistIds.removeAll()
        saveWishlist()
    }

    /// Get wishlisted products from a list
    func wishlistedProducts(from products: [Product]) -> [Product] {
        products.filter { wishlistIds.contains($0.id) }
    }

    // MARK: - Persistence

    private func loadWishlist() {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let ids = try? JSONDecoder().decode(Set<UUID>.self, from: data) else {
            return
        }
        wishlistIds = ids
    }

    private func saveWishlist() {
        guard let data = try? JSONEncoder().encode(wishlistIds) else { return }
        UserDefaults.standard.set(data, forKey: storageKey)
    }
}

// MARK: - Environment Key

private struct WishlistViewModelKey: EnvironmentKey {
    static let defaultValue: WishlistViewModel = WishlistViewModel()
}

extension EnvironmentValues {
    var wishlistViewModel: WishlistViewModel {
        get { self[WishlistViewModelKey.self] }
        set { self[WishlistViewModelKey.self] = newValue }
    }
}
