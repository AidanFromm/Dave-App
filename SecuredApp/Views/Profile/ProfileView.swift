//
//  ProfileView.swift
//  SecuredApp
//
//  User profile and account management
//

import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @EnvironmentObject var themeManager: ThemeManager
    @State private var activeSheet: AuthSheet?

    enum AuthSheet: Identifiable {
        case signIn, signUp
        var id: Self { self }
    }

    // Computed properties for user display
    private var displayName: String {
        if let fullName = authViewModel.customer?.fullName, !fullName.isEmpty {
            return fullName
        }
        return authViewModel.userEmail?.components(separatedBy: "@").first?.capitalized ?? "User"
    }

    private var displayEmail: String {
        authViewModel.customer?.email ?? authViewModel.userEmail ?? ""
    }

    private var avatarInitial: String {
        if let firstName = authViewModel.customer?.firstName, !firstName.isEmpty {
            return String(firstName.prefix(1)).uppercased()
        }
        if let email = authViewModel.userEmail, !email.isEmpty {
            return String(email.prefix(1)).uppercased()
        }
        return "U"
    }

    var body: some View {
        NavigationStack {
            List {
                if authViewModel.isAuthenticated {
                    // Email verification banner (non-blocking)
                    if authViewModel.showEmailVerificationPrompt && !authViewModel.isEmailVerified {
                        Section {
                            EmailVerificationBanner()
                        }
                    }

                    // User info section
                    Section {
                        HStack(spacing: 16) {
                            // Avatar with gradient
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [Color.securedAccent, Color.securedAccent.opacity(0.7)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 64, height: 64)
                                .overlay {
                                    Text(avatarInitial)
                                        .font(.title)
                                        .fontWeight(.bold)
                                        .foregroundStyle(.white)
                                }
                                .shadow(color: Color.securedAccent.opacity(0.3), radius: 4, y: 2)

                            VStack(alignment: .leading, spacing: 4) {
                                Text(displayName)
                                    .font(.title3)
                                    .fontWeight(.semibold)
                                Text(displayEmail)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()
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
                            Text("Track Order")
                        } label: {
                            Label("Track Order", systemImage: "shippingbox")
                        }
                    }

                    // Preferences
                    Section("Preferences") {
                        NavigationLink {
                            AppearanceSettingsView()
                        } label: {
                            Label("Appearance", systemImage: "moon.circle")
                        }

                        NavigationLink {
                            Text("Size Alerts")
                        } label: {
                            Label("Size Alerts", systemImage: "bell")
                        }

                        NavigationLink {
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
                        VStack(spacing: 20) {
                            // Icon
                            ZStack {
                                Circle()
                                    .fill(Color.securedAccent.opacity(0.1))
                                    .frame(width: 80, height: 80)

                                Image(systemName: "person.fill")
                                    .font(.system(size: 36))
                                    .foregroundStyle(Color.securedAccent)
                            }
                            .padding(.top, 8)

                            // Text
                            VStack(spacing: 8) {
                                Text("Sign in for the best experience")
                                    .font(.title3)
                                    .fontWeight(.semibold)

                                Text("Track orders, save addresses, and get notified about drops")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .multilineTextAlignment(.center)
                            }

                            // Buttons
                            VStack(spacing: 12) {
                                Button {
                                    activeSheet = .signIn
                                } label: {
                                    Text("Sign In")
                                        .font(.headline)
                                        .foregroundStyle(.white)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 14)
                                        .background(Color.securedAccent)
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                .buttonStyle(.borderless)

                                Button {
                                    activeSheet = .signUp
                                } label: {
                                    Text("Create Account")
                                        .font(.headline)
                                        .foregroundStyle(Color.securedAccent)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 14)
                                        .background(Color.securedAccent.opacity(0.1))
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                .buttonStyle(.borderless)
                            }
                            .padding(.bottom, 8)
                        }
                        .padding(.vertical, 8)
                    }

                    // Guest order lookup
                    Section("Guest Orders") {
                        NavigationLink {
                            GuestOrderLookupView()
                        } label: {
                            Label("Look Up Order", systemImage: "magnifyingglass")
                        }
                    }
                }

                // App info
                Section("App") {
                    if !authViewModel.isAuthenticated {
                        NavigationLink {
                            AppearanceSettingsView()
                        } label: {
                            Label("Appearance", systemImage: "moon.circle")
                        }
                    }

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
            .sheet(item: $activeSheet) { sheet in
                switch sheet {
                case .signIn:
                    SignInView()
                case .signUp:
                    SignUpView()
                }
            }
            .onChange(of: authViewModel.isAuthenticated) { _, isAuthenticated in
                if isAuthenticated {
                    activeSheet = nil
                }
            }
        }
    }
}

// MARK: - Styled Text Field

struct StyledTextField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    var keyboardType: UIKeyboardType = .default
    var textContentType: UITextContentType?

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
                .frame(width: 20)

            if isSecure {
                SecureField(placeholder, text: $text)
                    .textContentType(textContentType)
            } else {
                TextField(placeholder, text: $text)
                    .keyboardType(keyboardType)
                    .autocapitalization(keyboardType == .emailAddress ? .none : .words)
                    .textContentType(textContentType)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Email Verification Banner

struct EmailVerificationBanner: View {
    @EnvironmentObject var authViewModel: AuthViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "envelope.badge")
                    .foregroundStyle(.orange)
                Text("Verify your email")
                    .font(.headline)
                Spacer()
                Button {
                    authViewModel.dismissEmailVerificationPrompt()
                } label: {
                    Image(systemName: "xmark")
                        .foregroundStyle(.secondary)
                }
            }

            Text("Verify your email address to secure your account and receive order updates.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            if authViewModel.emailVerificationSent {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                    Text("Verification email sent!")
                        .font(.subheadline)
                }
            } else {
                Button {
                    Task {
                        await authViewModel.resendVerificationEmail()
                    }
                } label: {
                    HStack {
                        if authViewModel.isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                        } else {
                            Text("Send Verification Email")
                        }
                    }
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.securedAccent)
                    .clipShape(Capsule())
                }
                .disabled(authViewModel.isLoading)
            }
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Sign In View

struct SignInView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var showingForgotPassword = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    // Header
                    VStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(Color.securedAccent.opacity(0.1))
                                .frame(width: 80, height: 80)

                            Image(systemName: "person.fill")
                                .font(.system(size: 36))
                                .foregroundStyle(Color.securedAccent)
                        }

                        Text("Welcome Back")
                            .font(.title)
                            .fontWeight(.bold)

                        Text("Sign in to your account")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 20)

                    // Form
                    VStack(spacing: 16) {
                        StyledTextField(
                            icon: "envelope",
                            placeholder: "Email",
                            text: $email,
                            keyboardType: .emailAddress,
                            textContentType: .emailAddress
                        )

                        StyledTextField(
                            icon: "lock",
                            placeholder: "Password",
                            text: $password,
                            isSecure: true,
                            textContentType: .password
                        )

                        HStack {
                            Spacer()
                            Button {
                                showingForgotPassword = true
                            } label: {
                                Text("Forgot password?")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundStyle(Color.securedAccent)
                            }
                        }
                    }

                    // Error
                    if let error = authViewModel.error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                    }

                    // Sign In Button
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
                        .padding(.vertical, 16)
                        .background(
                            (email.isEmpty || password.isEmpty) ? Color.gray : Color.securedAccent
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(email.isEmpty || password.isEmpty || authViewModel.isLoading)

                    Spacer()
                }
                .padding(.horizontal, 24)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        authViewModel.error = nil
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showingForgotPassword) {
                ForgotPasswordView()
            }
        }
    }
}

// MARK: - Sign Up View

struct SignUpView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var firstName = ""
    @State private var lastName = ""

    private var isValid: Bool {
        !firstName.isEmpty &&
        !lastName.isEmpty &&
        email.contains("@") &&
        password.count >= 6
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    // Header
                    VStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(Color.securedAccent.opacity(0.1))
                                .frame(width: 80, height: 80)

                            Image(systemName: "person.badge.plus")
                                .font(.system(size: 36))
                                .foregroundStyle(Color.securedAccent)
                        }

                        Text("Create Account")
                            .font(.title)
                            .fontWeight(.bold)

                        Text("Join Secured for exclusive drops")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 20)

                    // Form
                    VStack(spacing: 16) {
                        HStack(spacing: 12) {
                            StyledTextField(
                                icon: "person",
                                placeholder: "First Name",
                                text: $firstName,
                                textContentType: .givenName
                            )

                            StyledTextField(
                                icon: "person",
                                placeholder: "Last Name",
                                text: $lastName,
                                textContentType: .familyName
                            )
                        }

                        StyledTextField(
                            icon: "envelope",
                            placeholder: "Email",
                            text: $email,
                            keyboardType: .emailAddress,
                            textContentType: .emailAddress
                        )

                        StyledTextField(
                            icon: "lock",
                            placeholder: "Password (min 6 characters)",
                            text: $password,
                            isSecure: true,
                            textContentType: .newPassword
                        )
                    }

                    // Error
                    if let error = authViewModel.error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                    }

                    // Create Account Button
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
                        .padding(.vertical, 16)
                        .background(isValid ? Color.securedAccent : Color.gray)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(!isValid || authViewModel.isLoading)

                    Spacer()
                }
                .padding(.horizontal, 24)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        authViewModel.error = nil
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Forgot Password View

struct ForgotPasswordView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    // Header
                    VStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(Color.securedAccent.opacity(0.1))
                                .frame(width: 80, height: 80)

                            Image(systemName: "lock.rotation")
                                .font(.system(size: 36))
                                .foregroundStyle(Color.securedAccent)
                        }

                        Text("Reset Password")
                            .font(.title)
                            .fontWeight(.bold)

                        Text("Enter your email address and we'll send you a link to reset your password.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 20)

                    // Form
                    StyledTextField(
                        icon: "envelope",
                        placeholder: "Email",
                        text: $email,
                        keyboardType: .emailAddress,
                        textContentType: .emailAddress
                    )

                    if authViewModel.passwordResetSent {
                        VStack(spacing: 16) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 50))
                                .foregroundStyle(.green)

                            Text("Reset link sent!")
                                .font(.headline)

                            Text("Check your email for a link to reset your password.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)

                            Button("Done") {
                                authViewModel.passwordResetSent = false
                                dismiss()
                            }
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(Color.securedAccent)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    } else {
                        if let error = authViewModel.error {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }

                        Button {
                            Task {
                                await authViewModel.sendPasswordResetEmail(email: email)
                            }
                        } label: {
                            HStack {
                                if authViewModel.isLoading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text("Send Reset Link")
                                }
                            }
                            .font(.headline)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(email.contains("@") ? Color.securedAccent : Color.gray)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .disabled(!email.contains("@") || authViewModel.isLoading)
                    }

                    Spacer()
                }
                .padding(.horizontal, 24)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        authViewModel.passwordResetSent = false
                        authViewModel.error = nil
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Reset Password Form

struct ResetPasswordFormView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var newPassword = ""
    @State private var confirmPassword = ""

    private var passwordsMatch: Bool {
        !newPassword.isEmpty && newPassword == confirmPassword
    }

    private var isValidPassword: Bool {
        newPassword.count >= 6
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    // Header
                    VStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(Color.securedAccent.opacity(0.1))
                                .frame(width: 80, height: 80)

                            Image(systemName: "lock.shield")
                                .font(.system(size: 36))
                                .foregroundStyle(Color.securedAccent)
                        }

                        Text("Create New Password")
                            .font(.title)
                            .fontWeight(.bold)

                        Text("Enter a new password for your account.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 20)

                    // Form
                    VStack(spacing: 16) {
                        StyledTextField(
                            icon: "lock",
                            placeholder: "New Password",
                            text: $newPassword,
                            isSecure: true,
                            textContentType: .newPassword
                        )

                        StyledTextField(
                            icon: "lock.fill",
                            placeholder: "Confirm Password",
                            text: $confirmPassword,
                            isSecure: true,
                            textContentType: .newPassword
                        )

                        if !newPassword.isEmpty && !isValidPassword {
                            Text("Password must be at least 6 characters")
                                .font(.caption)
                                .foregroundStyle(.orange)
                        }

                        if !confirmPassword.isEmpty && !passwordsMatch {
                            Text("Passwords don't match")
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                    }

                    if let error = authViewModel.error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }

                    Button {
                        Task {
                            let success = await authViewModel.resetPassword(newPassword: newPassword)
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
                                Text("Reset Password")
                            }
                        }
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background((passwordsMatch && isValidPassword) ? Color.securedAccent : Color.gray)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(!passwordsMatch || !isValidPassword || authViewModel.isLoading)

                    Spacer()
                }
                .padding(.horizontal, 24)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        authViewModel.showPasswordResetForm = false
                        authViewModel.error = nil
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Guest Order Lookup View

struct GuestOrderLookupView: View {
    @State private var email = ""
    @State private var orders: [Order] = []
    @State private var isLoading = false
    @State private var hasSearched = false
    @State private var error: String?

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Find your orders by email")
                        .font(.headline)

                    Text("Enter the email address you used during checkout.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    StyledTextField(
                        icon: "envelope",
                        placeholder: "Email",
                        text: $email,
                        keyboardType: .emailAddress,
                        textContentType: .emailAddress
                    )

                    Button {
                        Task {
                            await lookupOrders()
                        }
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Look Up Orders")
                            }
                        }
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(email.contains("@") ? Color.securedAccent : Color.gray)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(!email.contains("@") || isLoading)
                }
                .padding(.vertical, 8)
            }

            if let error = error {
                Section {
                    Text(error)
                        .foregroundStyle(.red)
                }
            }

            if hasSearched {
                if orders.isEmpty {
                    Section {
                        ContentUnavailableView(
                            "No Orders Found",
                            systemImage: "bag",
                            description: Text("No orders found for this email address.")
                        )
                    }
                } else {
                    Section("Your Orders") {
                        ForEach(orders) { order in
                            NavigationLink {
                                OrderDetailView(order: order)
                            } label: {
                                OrderRow(order: order)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Order Lookup")
    }

    private func lookupOrders() async {
        isLoading = true
        error = nil
        hasSearched = false

        do {
            orders = try await SupabaseService.shared.fetchOrdersByEmail(email: email)
            hasSearched = true
        } catch {
            self.error = "Failed to look up orders: \(error.localizedDescription)"
        }

        isLoading = false
    }
}

// MARK: - Order Views

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
                    .fontWeight(.medium)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.2))
                    .foregroundStyle(.green)
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

// MARK: - Appearance Settings View

struct AppearanceSettingsView: View {
    @EnvironmentObject var themeManager: ThemeManager

    var body: some View {
        List {
            Section {
                ForEach(ThemeManager.AppColorScheme.allCases) { scheme in
                    Button {
                        withAnimation(SecuredAnimation.smooth) {
                            themeManager.colorSchemePreference = scheme
                        }
                    } label: {
                        HStack(spacing: 16) {
                            Image(systemName: scheme.icon)
                                .font(.title2)
                                .foregroundStyle(
                                    themeManager.colorSchemePreference == scheme
                                        ? Color.securedAccent
                                        : .secondary
                                )
                                .frame(width: 32)

                            VStack(alignment: .leading, spacing: 4) {
                                Text(scheme.rawValue)
                                    .font(.headline)
                                    .foregroundStyle(Color.securedTextPrimary)

                                Text(scheme.description)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            if themeManager.colorSchemePreference == scheme {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(Color.securedAccent)
                                    .font(.title2)
                            }
                        }
                        .padding(.vertical, 8)
                    }
                    .buttonStyle(.plain)
                }
            } header: {
                Text("Color Scheme")
            } footer: {
                Text("Choose your preferred appearance. System will automatically switch between light and dark mode based on your device settings.")
            }
        }
        .navigationTitle("Appearance")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthViewModel())
        .environmentObject(ThemeManager())
}
