//
//  AuthViewModel.swift
//  SecuredApp
//
//  Manages authentication state
//

import Foundation
import SwiftUI
import Combine
import Supabase

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var currentUser: User?
    @Published var customer: Customer?
    @Published var error: String?

    // Email verification state
    @Published var isEmailVerified = false
    @Published var showEmailVerificationPrompt = false
    @Published var emailVerificationSent = false

    // Password reset state
    @Published var passwordResetSent = false
    @Published var showPasswordResetForm = false
    @Published var resetToken: String?

    // Computed property for user email (avoids needing Auth import in views)
    var userEmail: String? {
        currentUser?.email
    }

    private let supabase = SupabaseService.shared

    init() {
        Task {
            await checkSession()
        }
    }

    func checkSession() async {
        do {
            let session = try await supabase.client.auth.session
            currentUser = session.user
            isAuthenticated = true

            // Check email verification status
            if let confirmedAt = session.user.emailConfirmedAt {
                isEmailVerified = true
            } else {
                isEmailVerified = false
                showEmailVerificationPrompt = true
            }

            await loadCustomerProfile()
        } catch {
            isAuthenticated = false
            currentUser = nil
            isEmailVerified = false
        }
    }

    func signUp(email: String, password: String, firstName: String, lastName: String) async -> Bool {
        isLoading = true
        error = nil

        do {
            let response = try await supabase.client.auth.signUp(
                email: email,
                password: password
            )

            currentUser = response.user
            isAuthenticated = true

            // Check if email is verified (usually not for new signups)
            if response.user.emailConfirmedAt != nil {
                isEmailVerified = true
            } else {
                isEmailVerified = false
                showEmailVerificationPrompt = true
            }

            // Create customer profile
            await createCustomerProfile(
                authUserId: response.user.id,
                email: email,
                firstName: firstName,
                lastName: lastName
            )

            isLoading = false
            return true
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            return false
        }
    }

    func signIn(email: String, password: String) async -> Bool {
        isLoading = true
        error = nil

        do {
            let session = try await supabase.client.auth.signIn(
                email: email,
                password: password
            )

            currentUser = session.user
            isAuthenticated = true

            // Check email verification status
            if session.user.emailConfirmedAt != nil {
                isEmailVerified = true
            } else {
                isEmailVerified = false
                showEmailVerificationPrompt = true
            }

            await loadCustomerProfile()

            isLoading = false
            return true
        } catch {
            self.error = error.localizedDescription
            isLoading = false
            return false
        }
    }

    func signOut() async {
        do {
            try await supabase.client.auth.signOut()
            isAuthenticated = false
            currentUser = nil
            customer = nil
            isEmailVerified = false
            showEmailVerificationPrompt = false
        } catch {
            self.error = error.localizedDescription
        }
    }

    func continueAsGuest() {
        isAuthenticated = false
        currentUser = nil
        customer = nil
        isEmailVerified = false
        showEmailVerificationPrompt = false
    }

    // MARK: - Deep Link Handler

    func handleAuthCallback(url: URL) async {
        // Parse the URL for auth tokens
        // Expected formats:
        // securedapp://auth/callback#access_token=...&refresh_token=...&type=signup
        // securedapp://auth/reset-password#access_token=...&type=recovery

        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true) else {
            return
        }

        // Check the path
        let path = components.path

        // Get fragment parameters (tokens are in the fragment after #)
        if let fragment = components.fragment {
            let params = parseFragment(fragment)

            if let accessToken = params["access_token"],
               let refreshToken = params["refresh_token"] {

                do {
                    // Set the session with the tokens
                    try await supabase.client.auth.setSession(
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    )

                    // Check the type of callback
                    let type = params["type"] ?? ""

                    if type == "recovery" || path.contains("reset-password") {
                        // Password reset flow
                        resetToken = accessToken
                        showPasswordResetForm = true
                    } else {
                        // Email confirmation or sign in
                        await checkSession()
                        isEmailVerified = true
                        showEmailVerificationPrompt = false
                    }
                } catch {
                    self.error = "Failed to process authentication: \(error.localizedDescription)"
                }
            }
        }
    }

    private func parseFragment(_ fragment: String) -> [String: String] {
        var params: [String: String] = [:]
        let pairs = fragment.split(separator: "&")
        for pair in pairs {
            let keyValue = pair.split(separator: "=", maxSplits: 1)
            if keyValue.count == 2 {
                let key = String(keyValue[0])
                let value = String(keyValue[1]).removingPercentEncoding ?? String(keyValue[1])
                params[key] = value
            }
        }
        return params
    }

    // MARK: - Email Verification

    func resendVerificationEmail() async {
        guard let email = currentUser?.email else {
            error = "No email address found"
            return
        }

        isLoading = true
        error = nil

        do {
            try await supabase.client.auth.resend(
                email: email,
                type: .signup
            )
            emailVerificationSent = true
            isLoading = false
        } catch {
            self.error = "Failed to send verification email: \(error.localizedDescription)"
            isLoading = false
        }
    }

    func dismissEmailVerificationPrompt() {
        showEmailVerificationPrompt = false
    }

    // MARK: - Password Reset

    func sendPasswordResetEmail(email: String) async -> Bool {
        isLoading = true
        error = nil

        do {
            try await supabase.client.auth.resetPasswordForEmail(
                email,
                redirectTo: URL(string: "securedapp://auth/reset-password")
            )
            passwordResetSent = true
            isLoading = false
            return true
        } catch {
            self.error = "Failed to send reset email: \(error.localizedDescription)"
            isLoading = false
            return false
        }
    }

    func resetPassword(newPassword: String) async -> Bool {
        isLoading = true
        error = nil

        do {
            try await supabase.client.auth.update(user: UserAttributes(password: newPassword))
            showPasswordResetForm = false
            resetToken = nil
            isLoading = false

            // Re-check session after password reset
            await checkSession()
            return true
        } catch {
            self.error = "Failed to reset password: \(error.localizedDescription)"
            isLoading = false
            return false
        }
    }

    private func loadCustomerProfile() async {
        guard let userId = currentUser?.id else { return }

        do {
            let customers: [Customer] = try await supabase.client
                .from("customers")
                .select()
                .eq("auth_user_id", value: userId.uuidString)
                .execute()
                .value

            customer = customers.first
        } catch {
            print("Failed to load customer profile: \(error)")
        }
    }

    private func createCustomerProfile(
        authUserId: UUID,
        email: String,
        firstName: String,
        lastName: String
    ) async {
        struct NewCustomer: Encodable {
            let auth_user_id: UUID
            let email: String
            let first_name: String
            let last_name: String
        }

        let newCustomer = NewCustomer(
            auth_user_id: authUserId,
            email: email,
            first_name: firstName,
            last_name: lastName
        )

        do {
            customer = try await supabase.client
                .from("customers")
                .insert(newCustomer)
                .select()
                .single()
                .execute()
                .value
        } catch {
            print("Failed to create customer profile: \(error)")
        }
    }
}
