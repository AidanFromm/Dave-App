//
//  ProfileView.swift
//  SecuredApp
//
//  User profile and account management
//

import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var showingSignIn = false
    @State private var showingSignUp = false

    var body: some View {
        NavigationStack {
            List {
                if authViewModel.isAuthenticated {
                    // User info section
                    Section {
                        HStack(spacing: 16) {
                            Circle()
                                .fill(Color.primary.opacity(0.1))
                                .frame(width: 60, height: 60)
                                .overlay {
                                    Text(authViewModel.customer?.firstName?.prefix(1).uppercased() ?? "U")
                                        .font(.title)
                                        .fontWeight(.semibold)
                                }

                            VStack(alignment: .leading) {
                                Text(authViewModel.customer?.fullName ?? "User")
                                    .font(.headline)
                                Text(authViewModel.customer?.email ?? "")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 8)
                    }

                    // Orders
                    Section("Orders") {
                        NavigationLink {
                            OrderHistoryView()
                        } label: {
                            Label("Order History", systemImage: "bag")
                        }

                        NavigationLink {
                            // Tracking view
                            Text("Track Order")
                        } label: {
                            Label("Track Order", systemImage: "shippingbox")
                        }
                    }

                    // Preferences
                    Section("Preferences") {
                        NavigationLink {
                            // Size alerts view
                            Text("Size Alerts")
                        } label: {
                            Label("Size Alerts", systemImage: "bell")
                        }

                        NavigationLink {
                            // Addresses view
                            Text("Saved Addresses")
                        } label: {
                            Label("Saved Addresses", systemImage: "map")
                        }
                    }

                    // Account
                    Section("Account") {
                        Button(role: .destructive) {
                            Task {
                                await authViewModel.signOut()
                            }
                        } label: {
                            Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                        }
                    }
                } else {
                    // Guest view
                    Section {
                        VStack(spacing: 16) {
                            Image(systemName: "person.circle")
                                .font(.system(size: 60))
                                .foregroundStyle(.secondary)

                            Text("Sign in for the best experience")
                                .font(.headline)

                            Text("Track orders, save addresses, and get notified about drops")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)

                            Button {
                                showingSignIn = true
                            } label: {
                                Text("Sign In")
                                    .font(.headline)
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(.primary)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }

                            Button {
                                showingSignUp = true
                            } label: {
                                Text("Create Account")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                        .padding(.vertical)
                    }
                }

                // App info
                Section("App") {
                    NavigationLink {
                        Text("About")
                    } label: {
                        Label("About Secured", systemImage: "info.circle")
                    }

                    Link(destination: URL(string: "https://secured.com/help")!) {
                        Label("Help & Support", systemImage: "questionmark.circle")
                    }

                    NavigationLink {
                        Text("Privacy Policy")
                    } label: {
                        Label("Privacy Policy", systemImage: "hand.raised")
                    }
                }
            }
            .navigationTitle("Profile")
            .sheet(isPresented: $showingSignIn) {
                SignInView()
            }
            .sheet(isPresented: $showingSignUp) {
                SignUpView()
            }
        }
    }
}

struct SignInView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Welcome Back")
                        .font(.title)
                        .fontWeight(.bold)

                    Text("Sign in to your account")
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)

                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .textFieldStyle(.roundedBorder)
                }

                if let error = authViewModel.error {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                }

                Button {
                    Task {
                        let success = await authViewModel.signIn(email: email, password: password)
                        if success {
                            dismiss()
                        }
                    }
                } label: {
                    HStack {
                        if authViewModel.isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Sign In")
                        }
                    }
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(email.isEmpty || password.isEmpty || authViewModel.isLoading)

                Spacer()
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct SignUpView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var firstName = ""
    @State private var lastName = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Create Account")
                        .font(.title)
                        .fontWeight(.bold)

                    Text("Join Secured for exclusive drops")
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: 16) {
                    HStack {
                        TextField("First Name", text: $firstName)
                            .textContentType(.givenName)
                        TextField("Last Name", text: $lastName)
                            .textContentType(.familyName)
                    }
                    .textFieldStyle(.roundedBorder)

                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)

                    SecureField("Password", text: $password)
                        .textContentType(.newPassword)
                        .textFieldStyle(.roundedBorder)
                }

                if let error = authViewModel.error {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                }

                Button {
                    Task {
                        let success = await authViewModel.signUp(
                            email: email,
                            password: password,
                            firstName: firstName,
                            lastName: lastName
                        )
                        if success {
                            dismiss()
                        }
                    }
                } label: {
                    HStack {
                        if authViewModel.isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Create Account")
                        }
                    }
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(!isValid || authViewModel.isLoading)

                Spacer()
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private var isValid: Bool {
        !firstName.isEmpty &&
        !lastName.isEmpty &&
        email.contains("@") &&
        password.count >= 6
    }
}

struct OrderHistoryView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var orders: [Order] = []
    @State private var isLoading = true

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading orders...")
            } else if orders.isEmpty {
                ContentUnavailableView(
                    "No Orders",
                    systemImage: "bag",
                    description: Text("Your order history will appear here")
                )
            } else {
                List(orders) { order in
                    NavigationLink {
                        OrderDetailView(order: order)
                    } label: {
                        OrderRow(order: order)
                    }
                }
            }
        }
        .navigationTitle("Order History")
        .task {
            await loadOrders()
        }
    }

    private func loadOrders() async {
        guard let customerId = authViewModel.customer?.id else {
            isLoading = false
            return
        }

        do {
            orders = try await SupabaseService.shared.fetchOrders(customerId: customerId)
        } catch {
            print("Failed to load orders: \(error)")
        }

        isLoading = false
    }
}

struct OrderRow: View {
    let order: Order

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(order.orderNumber)
                    .font(.headline)
                Spacer()
                Text(order.status.displayName)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.2))
                    .clipShape(Capsule())
            }

            Text("\(order.itemCount) item(s)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack {
                Text(order.createdAt, style: .date)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(order.formattedTotal)
                    .fontWeight(.semibold)
            }
        }
        .padding(.vertical, 4)
    }
}

struct OrderDetailView: View {
    let order: Order

    var body: some View {
        List {
            Section("Order Info") {
                LabeledContent("Order Number", value: order.orderNumber)
                LabeledContent("Status", value: order.status.displayName)
                LabeledContent("Date", value: order.createdAt.formatted())
            }

            Section("Items") {
                ForEach(order.items) { item in
                    HStack {
                        Text("\(item.quantity)x")
                            .foregroundStyle(.secondary)
                        Text(item.name)
                        Spacer()
                        Text("$\(item.total as NSDecimalNumber)")
                    }
                }
            }

            Section("Total") {
                LabeledContent("Subtotal", value: "$\(order.subtotal as NSDecimalNumber)")
                LabeledContent("Tax", value: "$\(order.tax as NSDecimalNumber)")
                LabeledContent("Shipping", value: "$\(order.shippingCost as NSDecimalNumber)")
                LabeledContent("Total", value: order.formattedTotal)
                    .fontWeight(.bold)
            }

            if let tracking = order.trackingNumber {
                Section("Tracking") {
                    LabeledContent("Tracking Number", value: tracking)
                }
            }
        }
        .navigationTitle("Order Details")
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthViewModel())
}
