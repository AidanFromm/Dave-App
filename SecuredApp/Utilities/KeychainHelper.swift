//
//  KeychainHelper.swift
//  SecuredApp
//
//  Secure storage for API tokens using iOS Keychain
//

import Foundation
import Security

final class KeychainHelper {
    static let shared = KeychainHelper()
    private init() {}

    // MARK: - Keychain Keys
    enum Key: String {
        case stockXAccessToken = "com.secured.stockx.accessToken"
        case stockXRefreshToken = "com.secured.stockx.refreshToken"
        case stockXTokenExpiry = "com.secured.stockx.tokenExpiry"
    }

    // MARK: - Save
    func save(_ data: Data, forKey key: Key) -> Bool {
        // Delete existing item first
        delete(forKey: key)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key.rawValue,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    func save(_ string: String, forKey key: Key) -> Bool {
        guard let data = string.data(using: .utf8) else { return false }
        return save(data, forKey: key)
    }

    // MARK: - Read
    func read(forKey key: Key) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key.rawValue,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess else { return nil }
        return result as? Data
    }

    func readString(forKey key: Key) -> String? {
        guard let data = read(forKey: key) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    // MARK: - Delete
    @discardableResult
    func delete(forKey key: Key) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key.rawValue
        ]

        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }

    // MARK: - StockX Specific Helpers
    func saveStockXTokens(accessToken: String, refreshToken: String, expiresIn: Int) {
        save(accessToken, forKey: .stockXAccessToken)
        save(refreshToken, forKey: .stockXRefreshToken)

        // Calculate expiry date
        let expiryDate = Date().addingTimeInterval(TimeInterval(expiresIn))
        let expiryString = ISO8601DateFormatter().string(from: expiryDate)
        save(expiryString, forKey: .stockXTokenExpiry)
    }

    func getStockXAccessToken() -> String? {
        readString(forKey: .stockXAccessToken)
    }

    func getStockXRefreshToken() -> String? {
        readString(forKey: .stockXRefreshToken)
    }

    func isStockXTokenExpired() -> Bool {
        guard let expiryString = readString(forKey: .stockXTokenExpiry),
              let expiryDate = ISO8601DateFormatter().date(from: expiryString) else {
            return true
        }
        // Consider expired if less than 5 minutes remaining
        return expiryDate.timeIntervalSinceNow < 300
    }

    func clearStockXTokens() {
        delete(forKey: .stockXAccessToken)
        delete(forKey: .stockXRefreshToken)
        delete(forKey: .stockXTokenExpiry)
    }
}
