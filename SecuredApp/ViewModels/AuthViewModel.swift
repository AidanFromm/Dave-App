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
            await loadCustomerProfile()
        } catch {
            isAuthenticated = false
            currentUser = nil
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
        } catch {
            self.error = error.localizedDescription
        }
    }

    func continueAsGuest() {
        isAuthenticated = false
        currentUser = nil
        customer = nil
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
