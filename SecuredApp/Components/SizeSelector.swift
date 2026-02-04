import SwiftUI

// MARK: - Size Selector

struct SizeSelector: View {
    let sizes: [String]
    @Binding var selectedSize: String?
    var showLabel: Bool = true

    var body: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.sm) {
            if showLabel {
                HStack {
                    Text("Size")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color.securedTextPrimary)

                    Spacer()

                    if let selected = selectedSize {
                        Text("Selected: \(selected)")
                            .font(.caption)
                            .foregroundStyle(Color.securedTextSecondary)
                    }
                }
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: SecuredSpacing.sm) {
                    ForEach(sizes, id: \.self) { size in
                        SizeChip(
                            size: size,
                            isSelected: selectedSize == size,
                            isAvailable: true
                        ) {
                            withAnimation(SecuredAnimation.quickSpring) {
                                selectedSize = size
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Size Chip

struct SizeChip: View {
    let size: String
    let isSelected: Bool
    let isAvailable: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(size)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(foregroundColor)
                .frame(minWidth: 48, minHeight: 44)
                .background(backgroundColor)
                .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))
                .overlay {
                    if isSelected {
                        RoundedRectangle(cornerRadius: SecuredRadius.medium)
                            .strokeBorder(Color.securedAccent, lineWidth: 2)
                    } else if isAvailable {
                        RoundedRectangle(cornerRadius: SecuredRadius.medium)
                            .strokeBorder(Color.securedTextSecondary.opacity(0.2), lineWidth: 1)
                    }
                }
                .overlay {
                    // Sold out diagonal line
                    if !isAvailable {
                        GeometryReader { geometry in
                            Path { path in
                                path.move(to: CGPoint(x: 0, y: geometry.size.height))
                                path.addLine(to: CGPoint(x: geometry.size.width, y: 0))
                            }
                            .stroke(Color.securedTextSecondary.opacity(0.5), lineWidth: 1)
                        }
                    }
                }
        }
        .buttonStyle(.plain)
        .disabled(!isAvailable)
        .sensoryFeedback(.selection, trigger: isSelected)
    }

    private var foregroundColor: Color {
        if !isAvailable {
            return Color.securedTextSecondary.opacity(0.5)
        }
        return isSelected ? .white : Color.securedTextPrimary
    }

    private var backgroundColor: Color {
        if !isAvailable {
            return Color.securedCardBackground.opacity(0.5)
        }
        return isSelected ? Color.securedAccent : Color.securedCardBackground
    }
}

// MARK: - Size Grid

struct SizeGrid: View {
    let sizes: [String]
    @Binding var selectedSize: String?
    let columns: Int

    private var gridColumns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: SecuredSpacing.sm), count: columns)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.md) {
            HStack {
                Text("Select Size")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundStyle(Color.securedTextPrimary)

                Spacer()

                Button {
                    // Size guide action
                } label: {
                    Text("Size Guide")
                        .font(.subheadline)
                        .foregroundStyle(Color.securedAccent)
                }
            }

            LazyVGrid(columns: gridColumns, spacing: SecuredSpacing.sm) {
                ForEach(sizes, id: \.self) { size in
                    SizeChip(
                        size: size,
                        isSelected: selectedSize == size,
                        isAvailable: true
                    ) {
                        withAnimation(SecuredAnimation.quickSpring) {
                            selectedSize = size
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Common Sizes

struct CommonSizes {
    static let sneakers = ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13"]
    static let clothing = ["XS", "S", "M", "L", "XL", "XXL"]
    static let kids = ["4Y", "4.5Y", "5Y", "5.5Y", "6Y", "6.5Y", "7Y"]
}

// MARK: - Preview

#Preview {
    VStack(spacing: 32) {
        SizeSelector(
            sizes: CommonSizes.sneakers,
            selectedSize: .constant("10")
        )
        .padding(.horizontal)

        Divider()

        SizeGrid(
            sizes: CommonSizes.sneakers,
            selectedSize: .constant("9.5"),
            columns: 4
        )
        .padding(.horizontal)
    }
    .padding(.vertical)
    .background(Color.securedBackground)
}
