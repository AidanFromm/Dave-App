import SwiftUI

// MARK: - Sort Options

enum SortOption: String, CaseIterable, Identifiable {
    case newest = "Newest"
    case priceLowToHigh = "Price: Low to High"
    case priceHighToLow = "Price: High to Low"
    case nameAZ = "Name: A-Z"
    case nameZA = "Name: Z-A"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .newest:
            return "clock"
        case .priceLowToHigh:
            return "arrow.up"
        case .priceHighToLow:
            return "arrow.down"
        case .nameAZ:
            return "textformat"
        case .nameZA:
            return "textformat"
        }
    }
}

// MARK: - Filter Options

struct FilterOptions: Equatable {
    var conditions: Set<ProductCondition> = []
    var priceRange: ClosedRange<Double> = 0...5000
    var showInStockOnly: Bool = false
    var showDropsOnly: Bool = false

    var hasActiveFilters: Bool {
        !conditions.isEmpty ||
        priceRange != 0...5000 ||
        showInStockOnly ||
        showDropsOnly
    }

    var activeFilterCount: Int {
        var count = 0
        if !conditions.isEmpty { count += 1 }
        if priceRange != 0...5000 { count += 1 }
        if showInStockOnly { count += 1 }
        if showDropsOnly { count += 1 }
        return count
    }

    mutating func reset() {
        conditions = []
        priceRange = 0...5000
        showInStockOnly = false
        showDropsOnly = false
    }
}

// MARK: - Filter Sort Sheet

struct FilterSortSheet: View {
    @Binding var sortOption: SortOption
    @Binding var filterOptions: FilterOptions
    @Environment(\.dismiss) private var dismiss

    @State private var tempPriceRange: ClosedRange<Double> = 0...5000

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: SecuredSpacing.lg) {
                    // Sort Section
                    sortSection

                    Divider()
                        .padding(.horizontal, SecuredSpacing.md)

                    // Filter Section
                    filterSection
                }
                .padding(.vertical, SecuredSpacing.md)
            }
            .background(Color.securedBackground)
            .navigationTitle("Sort & Filter")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Reset") {
                        withAnimation {
                            sortOption = .newest
                            filterOptions.reset()
                            tempPriceRange = 0...5000
                        }
                    }
                    .foregroundStyle(Color.securedAccent)
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Apply") {
                        filterOptions.priceRange = tempPriceRange
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.securedAccent)
                }
            }
        }
        .onAppear {
            tempPriceRange = filterOptions.priceRange
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    // MARK: - Sort Section

    private var sortSection: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.md) {
            Text("Sort By")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(Color.securedTextPrimary)
                .padding(.horizontal, SecuredSpacing.md)

            VStack(spacing: 0) {
                ForEach(SortOption.allCases) { option in
                    Button {
                        withAnimation(SecuredAnimation.quickSpring) {
                            sortOption = option
                        }
                    } label: {
                        HStack {
                            Image(systemName: option.icon)
                                .frame(width: 24)
                                .foregroundStyle(sortOption == option ? Color.securedAccent : Color.securedTextSecondary)

                            Text(option.rawValue)
                                .foregroundStyle(Color.securedTextPrimary)

                            Spacer()

                            if sortOption == option {
                                Image(systemName: "checkmark")
                                    .fontWeight(.semibold)
                                    .foregroundStyle(Color.securedAccent)
                            }
                        }
                        .padding(.horizontal, SecuredSpacing.md)
                        .padding(.vertical, SecuredSpacing.md)
                        .background(sortOption == option ? Color.securedAccent.opacity(0.1) : Color.clear)
                    }
                    .buttonStyle(.plain)

                    if option != SortOption.allCases.last {
                        Divider()
                            .padding(.leading, 52)
                    }
                }
            }
            .background(Color.securedCardBackground)
            .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))
            .padding(.horizontal, SecuredSpacing.md)
        }
    }

    // MARK: - Filter Section

    private var filterSection: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.lg) {
            Text("Filter")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(Color.securedTextPrimary)
                .padding(.horizontal, SecuredSpacing.md)

            // Condition Filter
            conditionFilter

            // Price Range
            priceRangeFilter

            // Quick Filters
            quickFilters
        }
    }

    private var conditionFilter: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.sm) {
            Text("Condition")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(Color.securedTextSecondary)
                .padding(.horizontal, SecuredSpacing.md)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: SecuredSpacing.sm) {
                    ForEach(ProductCondition.allCases, id: \.self) { condition in
                        FilterChip(
                            title: condition.displayName,
                            isSelected: filterOptions.conditions.contains(condition)
                        ) {
                            withAnimation(SecuredAnimation.quickSpring) {
                                if filterOptions.conditions.contains(condition) {
                                    filterOptions.conditions.remove(condition)
                                } else {
                                    filterOptions.conditions.insert(condition)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, SecuredSpacing.md)
            }
        }
    }

    private var priceRangeFilter: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.sm) {
            HStack {
                Text("Price Range")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(Color.securedTextSecondary)

                Spacer()

                Text("$\(Int(tempPriceRange.lowerBound)) - $\(Int(tempPriceRange.upperBound))")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.securedTextPrimary)
            }
            .padding(.horizontal, SecuredSpacing.md)

            RangeSlider(range: $tempPriceRange, bounds: 0...5000)
                .padding(.horizontal, SecuredSpacing.md)
        }
    }

    private var quickFilters: some View {
        VStack(alignment: .leading, spacing: SecuredSpacing.sm) {
            Text("Quick Filters")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(Color.securedTextSecondary)
                .padding(.horizontal, SecuredSpacing.md)

            VStack(spacing: 0) {
                Toggle(isOn: $filterOptions.showInStockOnly) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(Color.securedConditionNew)
                        Text("In Stock Only")
                            .foregroundStyle(Color.securedTextPrimary)
                    }
                }
                .tint(Color.securedAccent)
                .padding(.horizontal, SecuredSpacing.md)
                .padding(.vertical, SecuredSpacing.md)

                Divider()

                Toggle(isOn: $filterOptions.showDropsOnly) {
                    HStack {
                        Image(systemName: "flame.fill")
                            .foregroundStyle(Color.securedAccent)
                        Text("New Drops Only")
                            .foregroundStyle(Color.securedTextPrimary)
                    }
                }
                .tint(Color.securedAccent)
                .padding(.horizontal, SecuredSpacing.md)
                .padding(.vertical, SecuredSpacing.md)
            }
            .background(Color.securedCardBackground)
            .clipShape(RoundedRectangle(cornerRadius: SecuredRadius.medium))
            .padding(.horizontal, SecuredSpacing.md)
        }
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(isSelected ? .white : Color.securedTextPrimary)
                .padding(.horizontal, SecuredSpacing.md)
                .padding(.vertical, SecuredSpacing.sm)
                .background(isSelected ? Color.securedAccent : Color.securedCardBackground)
                .clipShape(Capsule())
                .overlay {
                    if !isSelected {
                        Capsule()
                            .strokeBorder(Color.securedTextSecondary.opacity(0.3), lineWidth: 1)
                    }
                }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Range Slider

struct RangeSlider: View {
    @Binding var range: ClosedRange<Double>
    let bounds: ClosedRange<Double>

    var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            let minX = CGFloat((range.lowerBound - bounds.lowerBound) / (bounds.upperBound - bounds.lowerBound)) * width
            let maxX = CGFloat((range.upperBound - bounds.lowerBound) / (bounds.upperBound - bounds.lowerBound)) * width

            ZStack(alignment: .leading) {
                // Track
                Capsule()
                    .fill(Color.securedCardBackground)
                    .frame(height: 4)

                // Selected Range
                Capsule()
                    .fill(Color.securedAccent)
                    .frame(width: maxX - minX, height: 4)
                    .offset(x: minX)

                // Min Thumb
                Circle()
                    .fill(Color.securedBackground)
                    .frame(width: 24, height: 24)
                    .overlay {
                        Circle()
                            .fill(Color.securedAccent)
                            .frame(width: 16, height: 16)
                    }
                    .securedSubtleShadow()
                    .offset(x: minX - 12)
                    .gesture(
                        DragGesture()
                            .onChanged { value in
                                let newValue = bounds.lowerBound + Double(value.location.x / width) * (bounds.upperBound - bounds.lowerBound)
                                let clamped = min(max(newValue, bounds.lowerBound), range.upperBound - 50)
                                range = clamped...range.upperBound
                            }
                    )

                // Max Thumb
                Circle()
                    .fill(Color.securedBackground)
                    .frame(width: 24, height: 24)
                    .overlay {
                        Circle()
                            .fill(Color.securedAccent)
                            .frame(width: 16, height: 16)
                    }
                    .securedSubtleShadow()
                    .offset(x: maxX - 12)
                    .gesture(
                        DragGesture()
                            .onChanged { value in
                                let newValue = bounds.lowerBound + Double(value.location.x / width) * (bounds.upperBound - bounds.lowerBound)
                                let clamped = max(min(newValue, bounds.upperBound), range.lowerBound + 50)
                                range = range.lowerBound...clamped
                            }
                    )
            }
        }
        .frame(height: 24)
    }
}

// MARK: - Filter Button (for ShopView)

struct FilterButton: View {
    let filterCount: Int
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: "slider.horizontal.3")
                    .font(.system(size: 14, weight: .medium))

                if filterCount > 0 {
                    Text("\(filterCount)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 18, height: 18)
                        .background(Color.securedAccent)
                        .clipShape(Circle())
                }
            }
            .foregroundStyle(Color.securedTextPrimary)
            .padding(.horizontal, SecuredSpacing.md)
            .padding(.vertical, SecuredSpacing.sm)
            .background(Color.securedCardBackground)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Preview

#Preview {
    FilterSortSheet(
        sortOption: .constant(.newest),
        filterOptions: .constant(FilterOptions())
    )
}
