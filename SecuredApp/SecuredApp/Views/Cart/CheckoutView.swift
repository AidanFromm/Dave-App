//
//  CheckoutView.swift
//  SecuredApp
//
//  Checkout flow
//

import SwiftUI

struct CheckoutView: View {
    @EnvironmentObject var cartViewModel: CartViewModel
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var street = ""
    @State private var apartment = ""
    @State private var city = ""
    @State private var state = "FL"
    @State private var zipCode = ""
    @State private var phone = ""

    @State private var currentStep = 0
    @State private var showingOrderConfirmation = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Step indicator
                StepIndicator(currentStep: currentStep)
                    .padding()

                TabView(selection: $currentStep) {
                    // Step 1: Contact & Shipping
                    shippingForm
                        .tag(0)

                    // Step 2: Review & Pay
                    reviewAndPay
                        .tag(1)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: currentStep)
            }
            .navigationTitle("Checkout")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showingOrderConfirmation) {
                OrderConfirmationView(order: cartViewModel.completedOrder)
            }
            .onAppear {
                prefillUserData()
            }
        }
    }

    private var shippingForm: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Fulfillment type
                VStack(alignment: .leading, spacing: 12) {
                    Text("Delivery Method")
                        .font(.headline)

                    Picker("Delivery", selection: Binding(
                        get: { cartViewModel.cart.fulfillmentType },
                        set: { cartViewModel.setFulfillmentType($0) }
                    )) {
                        Label("Ship to Address", systemImage: "shippingbox.fill")
                            .tag(FulfillmentType.ship)
                        Label("Store Pickup", systemImage: "storefront.fill")
                            .tag(FulfillmentType.pickup)
                    }
                    .pickerStyle(.segmented)
                }

                // Contact info
                VStack(alignment: .leading, spacing: 12) {
                    Text("Contact Information")
                        .font(.headline)

                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)

                    TextField("Phone", text: $phone)
                        .textContentType(.telephoneNumber)
                        .keyboardType(.phonePad)
                }

                // Shipping address (only if shipping)
                if cartViewModel.cart.fulfillmentType == .ship {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Shipping Address")
                            .font(.headline)

                        HStack {
                            TextField("First Name", text: $firstName)
                                .textContentType(.givenName)
                            TextField("Last Name", text: $lastName)
                                .textContentType(.familyName)
                        }

                        TextField("Street Address", text: $street)
                            .textContentType(.streetAddressLine1)

                        TextField("Apartment, suite, etc. (optional)", text: $apartment)
                            .textContentType(.streetAddressLine2)

                        HStack {
                            TextField("City", text: $city)
                                .textContentType(.addressCity)

                            TextField("State", text: $state)
                                .textContentType(.addressState)
                                .frame(width: 60)

                            TextField("ZIP", text: $zipCode)
                                .textContentType(.postalCode)
                                .keyboardType(.numberPad)
                                .frame(width: 80)
                        }
                    }
                }

                Spacer()

                // Continue button
                Button {
                    saveShippingInfo()
                    withAnimation {
                        currentStep = 1
                    }
                } label: {
                    Text("Continue to Review")
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isShippingValid ? Color.primary : Color.gray)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(!isShippingValid)
            }
            .padding()
            .textFieldStyle(.roundedBorder)
        }
    }

    private var reviewAndPay: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Order items
                VStack(alignment: .leading, spacing: 12) {
                    Text("Order Summary")
                        .font(.headline)

                    ForEach(cartViewModel.cart.items) { item in
                        HStack {
                            Text("\(item.quantity)x")
                                .foregroundStyle(.secondary)
                            Text(item.product.name)
                                .lineLimit(1)
                            Spacer()
                            Text(item.formattedTotal)
                                .fontWeight(.medium)
                        }
                        .font(.subheadline)
                    }
                }

                Divider()

                // Shipping info
                if cartViewModel.cart.fulfillmentType == .ship {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Ship to")
                                .font(.headline)
                            Spacer()
                            Button("Edit") {
                                currentStep = 0
                            }
                            .font(.subheadline)
                        }

                        Text("\(firstName) \(lastName)")
                        Text(street)
                        if !apartment.isEmpty {
                            Text(apartment)
                        }
                        Text("\(city), \(state) \(zipCode)")
                    }
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Store Pickup")
                            .font(.headline)
                        Text("Secured Tampa")
                            .foregroundStyle(.secondary)
                        Text("We'll notify you when ready")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Divider()

                // Price breakdown
                VStack(spacing: 8) {
                    SummaryRow(label: "Subtotal", value: cartViewModel.cart.formattedSubtotal)
                    SummaryRow(label: "Tax (7%)", value: cartViewModel.cart.formattedTax)
                    SummaryRow(label: "Shipping", value: cartViewModel.cart.formattedShipping)

                    Divider()

                    HStack {
                        Text("Total")
                            .font(.headline)
                        Spacer()
                        Text(cartViewModel.cart.formattedTotal)
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                }

                Spacer()

                // Error message
                if let error = cartViewModel.orderError {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.red.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                // Place order button
                Button {
                    Task {
                        await placeOrder()
                    }
                } label: {
                    HStack {
                        if cartViewModel.isProcessingOrder {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "lock.fill")
                            Text("Place Order")
                        }
                    }
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(cartViewModel.isProcessingOrder)

                Text("By placing this order, you agree to our Terms of Service")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding()
        }
    }

    private var isShippingValid: Bool {
        let emailValid = email.contains("@")

        if cartViewModel.cart.fulfillmentType == .pickup {
            return emailValid
        }

        return emailValid &&
               !firstName.isEmpty &&
               !lastName.isEmpty &&
               !street.isEmpty &&
               !city.isEmpty &&
               !state.isEmpty &&
               zipCode.count >= 5
    }

    private func prefillUserData() {
        if let customer = authViewModel.customer {
            email = customer.email
            firstName = customer.firstName ?? ""
            lastName = customer.lastName ?? ""
            phone = customer.phone ?? ""

            if let address = customer.defaultAddress {
                street = address.street
                apartment = address.apartment ?? ""
                city = address.city
                state = address.state
                zipCode = address.zipCode
            }
        }
    }

    private func saveShippingInfo() {
        if cartViewModel.cart.fulfillmentType == .ship {
            let address = Address(
                firstName: firstName,
                lastName: lastName,
                street: street,
                apartment: apartment.isEmpty ? nil : apartment,
                city: city,
                state: state,
                zipCode: zipCode,
                country: "US",
                phone: phone.isEmpty ? nil : phone
            )
            cartViewModel.setShippingAddress(address)
        }
    }

    private func placeOrder() async {
        // TODO: Integrate Stripe payment here
        let success = await cartViewModel.checkout(
            customerEmail: email,
            customerId: authViewModel.customer?.id,
            stripePaymentId: nil // Will be set after Stripe integration
        )

        if success {
            showingOrderConfirmation = true
        }
    }
}

struct StepIndicator: View {
    let currentStep: Int
    let steps = ["Shipping", "Review & Pay"]

    var body: some View {
        HStack {
            ForEach(0..<steps.count, id: \.self) { index in
                HStack(spacing: 4) {
                    Circle()
                        .fill(index <= currentStep ? Color.primary : Color.gray.opacity(0.3))
                        .frame(width: 24, height: 24)
                        .overlay {
                            if index < currentStep {
                                Image(systemName: "checkmark")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.white)
                            } else {
                                Text("\(index + 1)")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundStyle(index <= currentStep ? .white : .gray)
                            }
                        }

                    Text(steps[index])
                        .font(.caption)
                        .fontWeight(index == currentStep ? .semibold : .regular)
                        .foregroundStyle(index <= currentStep ? .primary : .secondary)
                }

                if index < steps.count - 1 {
                    Rectangle()
                        .fill(index < currentStep ? Color.primary : Color.gray.opacity(0.3))
                        .frame(height: 2)
                }
            }
        }
    }
}

struct OrderConfirmationView: View {
    let order: Order?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundStyle(.green)

            Text("Order Confirmed!")
                .font(.title)
                .fontWeight(.bold)

            if let order = order {
                VStack(spacing: 8) {
                    Text("Order #\(order.orderNumber)")
                        .font(.headline)

                    Text("Total: \(order.formattedTotal)")
                        .font(.title2)
                        .fontWeight(.semibold)

                    Text("We'll send a confirmation email shortly")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            Button {
                dismiss()
            } label: {
                Text("Continue Shopping")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding()
        }
        .interactiveDismissDisabled()
    }
}

#Preview {
    CheckoutView()
        .environmentObject(CartViewModel())
        .environmentObject(AuthViewModel())
}
