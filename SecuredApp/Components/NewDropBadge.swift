import SwiftUI

// MARK: - New Drop Badge

struct NewDropBadge: View {
    @State private var isAnimating = false

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "flame.fill")
                .font(.system(size: 10))
                .scaleEffect(isAnimating ? 1.1 : 1.0)

            Text("NEW DROP")
                .font(.system(size: 10, weight: .heavy))
                .tracking(0.5)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, SecuredSpacing.sm)
        .padding(.vertical, SecuredSpacing.xs)
        .background(
            LinearGradient(
                colors: [Color.securedAccent, Color.securedAccentSecondary],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
        .clipShape(Capsule())
        .securedSubtleShadow()
        .onAppear {
            withAnimation(
                Animation
                    .easeInOut(duration: 0.8)
                    .repeatForever(autoreverses: true)
            ) {
                isAnimating = true
            }
        }
    }
}

// MARK: - Featured Badge

struct FeaturedBadge: View {
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "star.fill")
                .font(.system(size: 9))

            Text("FEATURED")
                .font(.system(size: 9, weight: .bold))
                .tracking(0.3)
        }
        .foregroundStyle(Color.securedAccent)
        .padding(.horizontal, SecuredSpacing.sm)
        .padding(.vertical, SecuredSpacing.xs)
        .background(Color.securedAccent.opacity(0.15))
        .clipShape(Capsule())
    }
}

// MARK: - Sale Badge

struct SaleBadge: View {
    let percentage: Int

    var body: some View {
        Text("-\(percentage)%")
            .font(.system(size: 10, weight: .heavy))
            .foregroundStyle(.white)
            .padding(.horizontal, SecuredSpacing.sm)
            .padding(.vertical, SecuredSpacing.xs)
            .background(Color.securedConditionNew)
            .clipShape(Capsule())
    }
}

// MARK: - Stock Badge

struct StockBadge: View {
    enum StockStatus {
        case inStock
        case lowStock
        case soldOut
    }

    let status: StockStatus

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(statusColor)
                .frame(width: 6, height: 6)

            Text(statusText)
                .font(.system(size: 10, weight: .semibold))
        }
        .foregroundStyle(statusColor)
        .padding(.horizontal, SecuredSpacing.sm)
        .padding(.vertical, SecuredSpacing.xs)
        .background(statusColor.opacity(0.15))
        .clipShape(Capsule())
    }

    private var statusColor: Color {
        switch status {
        case .inStock:
            return .securedConditionNew
        case .lowStock:
            return .securedWarning
        case .soldOut:
            return .securedError
        }
    }

    private var statusText: String {
        switch status {
        case .inStock:
            return "In Stock"
        case .lowStock:
            return "Low Stock"
        case .soldOut:
            return "Sold Out"
        }
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 20) {
        NewDropBadge()

        FeaturedBadge()

        HStack(spacing: 12) {
            SaleBadge(percentage: 20)
            SaleBadge(percentage: 50)
        }

        HStack(spacing: 12) {
            StockBadge(status: .inStock)
            StockBadge(status: .lowStock)
            StockBadge(status: .soldOut)
        }
    }
    .padding()
    .background(Color.securedBackground)
}
