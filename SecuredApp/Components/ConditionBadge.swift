import SwiftUI

// MARK: - Condition Badge

struct ConditionBadge: View {
    let condition: ProductCondition

    var body: some View {
        Text(condition.displayText)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .padding(.horizontal, SecuredSpacing.sm)
            .padding(.vertical, SecuredSpacing.xs)
            .background(badgeColor)
            .clipShape(Capsule())
    }

    private var badgeColor: Color {
        switch condition {
        case .new:
            return .securedConditionNew
        case .usedLikeNew, .usedGood, .usedFair:
            return .securedConditionUsed
        }
    }
}

// MARK: - Condition Display Extension

extension ProductCondition {
    var displayText: String {
        switch self {
        case .new:
            return "NEW"
        case .usedLikeNew:
            return "LIKE NEW"
        case .usedGood:
            return "GOOD"
        case .usedFair:
            return "FAIR"
        }
    }

    var shortDisplayText: String {
        switch self {
        case .new:
            return "New"
        case .usedLikeNew:
            return "Like New"
        case .usedGood:
            return "Good"
        case .usedFair:
            return "Fair"
        }
    }
}

// MARK: - Detailed Condition Badge

struct DetailedConditionBadge: View {
    let condition: ProductCondition
    let hasBox: Bool

    var body: some View {
        HStack(spacing: SecuredSpacing.sm) {
            // Condition indicator
            Circle()
                .fill(condition == .new ? Color.securedConditionNew : Color.securedConditionUsed)
                .frame(width: 8, height: 8)

            Text(condition.shortDisplayText)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(Color.securedTextPrimary)

            if hasBox {
                Text("with Box")
                    .font(.caption)
                    .foregroundStyle(Color.securedTextSecondary)
            }
        }
        .padding(.horizontal, SecuredSpacing.md)
        .padding(.vertical, SecuredSpacing.sm)
        .background(Color.securedCardBackground)
        .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 16) {
        HStack(spacing: 12) {
            ConditionBadge(condition: .new)
            ConditionBadge(condition: .usedLikeNew)
            ConditionBadge(condition: .usedGood)
            ConditionBadge(condition: .usedFair)
        }

        Divider()

        VStack(alignment: .leading, spacing: 12) {
            DetailedConditionBadge(condition: .new, hasBox: true)
            DetailedConditionBadge(condition: .usedLikeNew, hasBox: true)
            DetailedConditionBadge(condition: .usedGood, hasBox: false)
        }
    }
    .padding()
    .background(Color.securedBackground)
}
