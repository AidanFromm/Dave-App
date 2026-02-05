//
//  StockXAuthManager.swift
//  SecuredApp
//
//  Handles StockX OAuth 2.0 Authorization Code flow
//
//  Flow:
//  1. Open StockX login in browser
//  2. User logs in, StockX redirects to securedtampa.com
//  3. Redirect page forwards to securedapp:// with auth code
//  4. Exchange auth code for access/refresh tokens
//  5. Store tokens in Keychain
//  6. Auto-refresh tokens before expiry
//

import Foundation
import AuthenticationServices
import Combine

@MainActor
class StockXAuthManager: NSObject, ObservableObject {
    static let shared = StockXAuthManager()

    // MARK: - Published State
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var error: String?

    // MARK: - StockX OAuth Configuration
    private let clientId = "6iancV9MkHjtn9dIE8VoflhwK0H3jCFc"
    private let clientSecret = "oTNzarbhweQGzF2aQJn_TPWFbT5y5wvRHuQFxjH-hJ5oweeFocZJ:"
    private let apiKey = "qAYBY1lFUv2PVXRldvSf4ya1pkjGhQZ9rxBj4LW7"

    private let authorizationEndpoint = "https://accounts.stockx.com/authorize"
    private let tokenEndpoint = "https://accounts.stockx.com/oauth/token"
    private let audience = "gateway.stockx.com"
    private let redirectUri = "https://securedtampa.com/stockx/callback"
    private let scope = "offline_access openid"

    private var authSession: ASWebAuthenticationSession?

    private let keychain = KeychainHelper.shared

    // MARK: - Init
    private override init() {
        super.init()
        checkExistingAuth()
    }

    // MARK: - Check Existing Auth
    func checkExistingAuth() {
        if let _ = keychain.getStockXAccessToken(), !keychain.isStockXTokenExpired() {
            isAuthenticated = true
        } else if let _ = keychain.getStockXRefreshToken() {
            // Try to refresh
            Task {
                await refreshTokenIfNeeded()
            }
        }
    }

    // MARK: - Login Flow
    func login() async {
        isLoading = true
        error = nil

        // Generate state for CSRF protection
        let state = UUID().uuidString

        // Build authorization URL
        var components = URLComponents(string: authorizationEndpoint)!
        components.queryItems = [
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "redirect_uri", value: redirectUri),
            URLQueryItem(name: "scope", value: scope),
            URLQueryItem(name: "audience", value: audience),
            URLQueryItem(name: "state", value: state)
        ]

        guard let authURL = components.url else {
            error = "Failed to build authorization URL"
            isLoading = false
            return
        }

        // Open authentication session
        await startAuthSession(url: authURL)
    }

    private func startAuthSession(url: URL) async {
        await withCheckedContinuation { continuation in
            authSession = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: "securedapp"
            ) { [weak self] callbackURL, authError in
                Task { @MainActor in
                    if let authError = authError {
                        if (authError as NSError).code == ASWebAuthenticationSessionError.canceledLogin.rawValue {
                            self?.error = "Login cancelled"
                        } else {
                            self?.error = authError.localizedDescription
                        }
                        self?.isLoading = false
                        continuation.resume()
                        return
                    }

                    guard let callbackURL = callbackURL,
                          let code = self?.extractCode(from: callbackURL) else {
                        self?.error = "Failed to get authorization code"
                        self?.isLoading = false
                        continuation.resume()
                        return
                    }

                    // Exchange code for tokens
                    await self?.exchangeCodeForTokens(code: code)
                    continuation.resume()
                }
            }

            authSession?.presentationContextProvider = self
            authSession?.prefersEphemeralWebBrowserSession = false
            authSession?.start()
        }
    }

    private func extractCode(from url: URL) -> String? {
        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        return components?.queryItems?.first(where: { $0.name == "code" })?.value
    }

    // MARK: - Token Exchange
    private func exchangeCodeForTokens(code: String) async {
        let parameters: [String: String] = [
            "grant_type": "authorization_code",
            "client_id": clientId,
            "client_secret": clientSecret,
            "code": code,
            "redirect_uri": redirectUri
        ]

        await performTokenRequest(parameters: parameters)
    }

    // MARK: - Token Refresh
    func refreshTokenIfNeeded() async {
        guard keychain.isStockXTokenExpired(),
              let refreshToken = keychain.getStockXRefreshToken() else {
            return
        }

        let parameters: [String: String] = [
            "grant_type": "refresh_token",
            "client_id": clientId,
            "client_secret": clientSecret,
            "refresh_token": refreshToken
        ]

        await performTokenRequest(parameters: parameters)
    }

    private func performTokenRequest(parameters: [String: String]) async {
        guard let url = URL(string: tokenEndpoint) else {
            error = "Invalid token endpoint"
            isLoading = false
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        let body = parameters.map { "\($0.key)=\($0.value.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? $0.value)" }
            .joined(separator: "&")
        request.httpBody = body.data(using: .utf8)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                error = "Invalid response"
                isLoading = false
                return
            }

            if httpResponse.statusCode == 200 {
                let tokenResponse = try JSONDecoder().decode(TokenResponse.self, from: data)
                keychain.saveStockXTokens(
                    accessToken: tokenResponse.accessToken,
                    refreshToken: tokenResponse.refreshToken ?? keychain.getStockXRefreshToken() ?? "",
                    expiresIn: tokenResponse.expiresIn
                )
                isAuthenticated = true
                error = nil
            } else {
                let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data)
                error = errorResponse?.errorDescription ?? "Authentication failed (HTTP \(httpResponse.statusCode))"
            }
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    // MARK: - Logout
    func logout() {
        keychain.clearStockXTokens()
        isAuthenticated = false
        error = nil
    }

    // MARK: - Get Valid Access Token
    func getValidAccessToken() async -> String? {
        if keychain.isStockXTokenExpired() {
            await refreshTokenIfNeeded()
        }
        return keychain.getStockXAccessToken()
    }

    // MARK: - API Key Header
    var apiKeyHeader: String {
        apiKey
    }

}

// MARK: - ASWebAuthenticationPresentationContextProviding
extension StockXAuthManager: ASWebAuthenticationPresentationContextProviding {
    nonisolated func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        ASPresentationAnchor()
    }
}

// MARK: - Token Response
private struct TokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String?
    let expiresIn: Int
    let tokenType: String

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case tokenType = "token_type"
    }
}

private struct ErrorResponse: Decodable {
    let error: String
    let errorDescription: String?

    enum CodingKeys: String, CodingKey {
        case error
        case errorDescription = "error_description"
    }
}

