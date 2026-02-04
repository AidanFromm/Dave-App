import Foundation

// MARK: - Mock Data for Development & Testing
// 10 products: 3 new sneakers, 4 used sneakers, 3 Pokemon cards

struct MockData {

    // MARK: - Mock Category IDs
    static let sneakersCategoryId = UUID(uuidString: "11111111-1111-1111-1111-111111111111")!
    static let pokemonCategoryId = UUID(uuidString: "22222222-2222-2222-2222-222222222222")!

    // MARK: - All Mock Products
    static let products: [Product] = [
        // NEW SNEAKERS (3)
        airJordan1Travis,
        nikeDunkLowPanda,
        yeezySlide,

        // USED SNEAKERS (4)
        airJordan4Bred,
        newBalance550,
        nikeSBDunk,
        adidasSamba,

        // POKEMON CARDS (3)
        charizardVmax,
        pikachuVmax,
        umbreonAltArt
    ]

    // MARK: - Featured Products (for Hero Banner)
    static var featuredProducts: [Product] {
        products.filter { $0.isFeatured }
    }

    // MARK: - New Drop Products
    static var newDropProducts: [Product] {
        products.filter { $0.isDrop }
    }

    // MARK: - NEW SNEAKERS

    static let airJordan1Travis = Product(
        id: UUID(uuidString: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")!,
        sku: "NK-AJ1-TS-001",
        barcode: "194502123456",
        name: "Air Jordan 1 Retro High OG SP x Travis Scott",
        description: "The highly coveted Travis Scott x Air Jordan 1 features the signature reversed Swoosh and premium materials. Deadstock condition with original box and accessories.",
        categoryId: sneakersCategoryId,
        brand: "Jordan",
        size: "10",
        condition: .new,
        colorway: "Mocha",
        hasBox: true,
        price: 1850.00,
        cost: 1200.00,
        compareAtPrice: 2100.00,
        quantity: 2,
        lowStockThreshold: 3,
        images: [
            "https://images.stockx.com/images/Air-Jordan-1-Retro-High-Travis-Scott-Product.jpg",
            "https://images.stockx.com/images/Air-Jordan-1-Retro-High-Travis-Scott-Product-2.jpg"
        ],
        isDrop: true,
        dropDate: Calendar.current.date(byAdding: .day, value: -3, to: Date()),
        ebayListingId: nil,
        whatnotListingId: nil,
        isActive: true,
        isFeatured: true,
        tags: ["travis-scott", "jordan", "grail", "hype"],
        createdAt: Calendar.current.date(byAdding: .day, value: -3, to: Date())!,
        updatedAt: Date()
    )

    static let nikeDunkLowPanda = Product(
        id: UUID(uuidString: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")!,
        sku: "NK-DUNK-PND-002",
        barcode: "194501987654",
        name: "Nike Dunk Low Retro",
        description: "The iconic Panda colorway. Brand new with all original packaging. One of the most popular sneakers of the year.",
        categoryId: sneakersCategoryId,
        brand: "Nike",
        size: "9.5",
        condition: .new,
        colorway: "White/Black",
        hasBox: true,
        price: 135.00,
        cost: 100.00,
        compareAtPrice: 150.00,
        quantity: 8,
        lowStockThreshold: 5,
        images: [
            "https://images.stockx.com/images/Nike-Dunk-Low-Retro-White-Black-2021-Product.jpg"
        ],
        isDrop: true,
        dropDate: Calendar.current.date(byAdding: .day, value: -1, to: Date()),
        ebayListingId: nil,
        whatnotListingId: nil,
        isActive: true,
        isFeatured: true,
        tags: ["dunk", "panda", "essential"],
        createdAt: Calendar.current.date(byAdding: .day, value: -1, to: Date())!,
        updatedAt: Date()
    )

    static let yeezySlide = Product(
        id: UUID(uuidString: "cccccccc-cccc-cccc-cccc-cccccccccccc")!,
        sku: "AD-YZY-SLD-003",
        barcode: "194503456789",
        name: "adidas Yeezy Slide",
        description: "Ultra comfortable foam slide in the neutral Bone colorway. Brand new, never worn.",
        categoryId: sneakersCategoryId,
        brand: "adidas",
        size: "11",
        condition: .new,
        colorway: "Bone",
        hasBox: true,
        price: 160.00,
        cost: 70.00,
        compareAtPrice: nil,
        quantity: 15,
        lowStockThreshold: 5,
        images: [
            "https://images.stockx.com/images/adidas-Yeezy-Slide-Bone-2022-Restock-Product.jpg"
        ],
        isDrop: true,
        dropDate: Date(),
        ebayListingId: nil,
        whatnotListingId: nil,
        isActive: true,
        isFeatured: true,
        tags: ["yeezy", "slide", "comfort"],
        createdAt: Date(),
        updatedAt: Date()
    )

    // MARK: - USED SNEAKERS

    static let airJordan4Bred = Product(
        id: UUID(uuidString: "dddddddd-dddd-dddd-dddd-dddddddddddd")!,
        sku: "NK-AJ4-BRD-004",
        barcode: "194504111222",
        name: "Air Jordan 4 Retro OG",
        description: "Classic Bred colorway in excellent used condition. Minimal creasing, original box included. These have been well maintained and show light wear.",
        categoryId: sneakersCategoryId,
        brand: "Jordan",
        size: "10.5",
        condition: .usedLikeNew,
        colorway: "Bred",
        hasBox: true,
        price: 320.00,
        cost: 200.00,
        compareAtPrice: 380.00,
        quantity: 1,
        lowStockThreshold: 2,
        images: [
            "https://images.stockx.com/images/Air-Jordan-4-Retro-Bred-2019-Product.jpg"
        ],
        isDrop: false,
        dropDate: nil,
        ebayListingId: "EBAY123456",
        whatnotListingId: nil,
        isActive: true,
        isFeatured: false,
        tags: ["jordan", "bred", "classic"],
        createdAt: Calendar.current.date(byAdding: .day, value: -14, to: Date())!,
        updatedAt: Date()
    )

    static let newBalance550 = Product(
        id: UUID(uuidString: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")!,
        sku: "NB-550-WG-005",
        barcode: "194505333444",
        name: "New Balance 550",
        description: "The trending NB 550 in clean white/green. Gently used with minor scuffs on the midsole. Includes original box.",
        categoryId: sneakersCategoryId,
        brand: "New Balance",
        size: "9",
        condition: .usedGood,
        colorway: "White/Green",
        hasBox: true,
        price: 95.00,
        cost: 60.00,
        compareAtPrice: 130.00,
        quantity: 1,
        lowStockThreshold: 2,
        images: [
            "https://images.stockx.com/images/New-Balance-550-White-Green-Product.jpg"
        ],
        isDrop: false,
        dropDate: nil,
        ebayListingId: nil,
        whatnotListingId: "WN789012",
        isActive: true,
        isFeatured: false,
        tags: ["new-balance", "550", "vintage"],
        createdAt: Calendar.current.date(byAdding: .day, value: -21, to: Date())!,
        updatedAt: Date()
    )

    static let nikeSBDunk = Product(
        id: UUID(uuidString: "ffffffff-ffff-ffff-ffff-ffffffffffff")!,
        sku: "NK-SB-STR-006",
        barcode: "194506555666",
        name: "Nike SB Dunk Low Pro",
        description: "Skated a few times, showing honest wear. Great beater pair or skate shoe. No box.",
        categoryId: sneakersCategoryId,
        brand: "Nike",
        size: "10",
        condition: .usedFair,
        colorway: "Court Purple",
        hasBox: false,
        price: 65.00,
        cost: 30.00,
        compareAtPrice: nil,
        quantity: 1,
        lowStockThreshold: 2,
        images: [
            "https://images.stockx.com/images/Nike-SB-Dunk-Low-Court-Purple-Product.jpg"
        ],
        isDrop: false,
        dropDate: nil,
        ebayListingId: nil,
        whatnotListingId: nil,
        isActive: true,
        isFeatured: false,
        tags: ["sb", "dunk", "skate"],
        createdAt: Calendar.current.date(byAdding: .day, value: -30, to: Date())!,
        updatedAt: Date()
    )

    static let adidasSamba = Product(
        id: UUID(uuidString: "00000000-0000-0000-0000-000000000001")!,
        sku: "AD-SMB-OG-007",
        barcode: "194507777888",
        name: "adidas Samba OG",
        description: "Classic Samba in original colorway. Light wear on toe box, suede in great condition. With box.",
        categoryId: sneakersCategoryId,
        brand: "adidas",
        size: "8.5",
        condition: .usedLikeNew,
        colorway: "White/Black/Gum",
        hasBox: true,
        price: 85.00,
        cost: 50.00,
        compareAtPrice: 100.00,
        quantity: 1,
        lowStockThreshold: 2,
        images: [
            "https://images.stockx.com/images/adidas-Samba-OG-Cloud-White-Core-Black-Product.jpg"
        ],
        isDrop: false,
        dropDate: nil,
        ebayListingId: nil,
        whatnotListingId: nil,
        isActive: true,
        isFeatured: false,
        tags: ["samba", "classic", "terrace"],
        createdAt: Calendar.current.date(byAdding: .day, value: -7, to: Date())!,
        updatedAt: Date()
    )

    // MARK: - POKEMON CARDS

    static let charizardVmax = Product(
        id: UUID(uuidString: "00000000-0000-0000-0000-000000000002")!,
        sku: "PKM-CHZ-VMAX-008",
        barcode: "820650850097",
        name: "Charizard VMAX (Shiny)",
        description: "PSA 10 graded Charizard VMAX from Shining Fates. One of the most sought-after modern Pokemon cards.",
        categoryId: pokemonCategoryId,
        brand: "Pokemon",
        size: "PSA 10",
        condition: .new,
        colorway: "Shining Fates",
        hasBox: true,
        price: 450.00,
        cost: 300.00,
        compareAtPrice: 550.00,
        quantity: 1,
        lowStockThreshold: 1,
        images: [
            "https://images.pokemoncard.io/images/SV/SV3/SV107.png"
        ],
        isDrop: false,
        dropDate: nil,
        ebayListingId: nil,
        whatnotListingId: nil,
        isActive: true,
        isFeatured: false,
        tags: ["pokemon", "charizard", "graded", "psa10"],
        createdAt: Calendar.current.date(byAdding: .day, value: -5, to: Date())!,
        updatedAt: Date()
    )

    static let pikachuVmax = Product(
        id: UUID(uuidString: "00000000-0000-0000-0000-000000000003")!,
        sku: "PKM-PIK-VMAX-009",
        barcode: "820650850098",
        name: "Pikachu VMAX Rainbow",
        description: "Beautiful rainbow rare Pikachu VMAX. Mint condition, ungraded. Perfect centering.",
        categoryId: pokemonCategoryId,
        brand: "Pokemon",
        size: "Raw",
        condition: .new,
        colorway: "Vivid Voltage",
        hasBox: false,
        price: 185.00,
        cost: 120.00,
        compareAtPrice: nil,
        quantity: 2,
        lowStockThreshold: 2,
        images: [
            "https://images.pokemoncard.io/images/SV/SV4/TG29.png"
        ],
        isDrop: false,
        dropDate: nil,
        ebayListingId: nil,
        whatnotListingId: nil,
        isActive: true,
        isFeatured: false,
        tags: ["pokemon", "pikachu", "rainbow", "vmax"],
        createdAt: Calendar.current.date(byAdding: .day, value: -10, to: Date())!,
        updatedAt: Date()
    )

    static let umbreonAltArt = Product(
        id: UUID(uuidString: "00000000-0000-0000-0000-000000000004")!,
        sku: "PKM-UMB-ALT-010",
        barcode: "820650850099",
        name: "Umbreon VMAX Alt Art",
        description: "The holy grail of modern Pokemon. Umbreon VMAX Alternate Art from Evolving Skies. PSA 9 grade.",
        categoryId: pokemonCategoryId,
        brand: "Pokemon",
        size: "PSA 9",
        condition: .new,
        colorway: "Evolving Skies",
        hasBox: true,
        price: 750.00,
        cost: 500.00,
        compareAtPrice: 900.00,
        quantity: 1,
        lowStockThreshold: 1,
        images: [
            "https://images.pokemoncard.io/images/SV/SV3/215.png"
        ],
        isDrop: false,
        dropDate: nil,
        ebayListingId: "EBAY789456",
        whatnotListingId: nil,
        isActive: true,
        isFeatured: false,
        tags: ["pokemon", "umbreon", "alt-art", "graded", "chase"],
        createdAt: Calendar.current.date(byAdding: .day, value: -2, to: Date())!,
        updatedAt: Date()
    )
}

// MARK: - Mock Categories

extension MockData {
    static let categories: [Category] = [
        Category(
            id: sneakersCategoryId,
            name: "Sneakers",
            slug: "sneakers",
            description: "Premium sneakers and footwear",
            imageUrl: "https://example.com/sneakers.jpg",
            sortOrder: 1,
            isActive: true,
            createdAt: Date(),
            updatedAt: Date()
        ),
        Category(
            id: pokemonCategoryId,
            name: "Pokemon",
            slug: "pokemon",
            description: "Pokemon trading cards",
            imageUrl: "https://example.com/pokemon.jpg",
            sortOrder: 2,
            isActive: true,
            createdAt: Date(),
            updatedAt: Date()
        )
    ]
}
