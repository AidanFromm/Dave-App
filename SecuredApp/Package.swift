// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "SecuredApp",
    platforms: [
        .iOS(.v17)
    ],
    dependencies: [
        .package(url: "https://github.com/supabase/supabase-swift.git", from: "2.0.0"),
        .package(url: "https://github.com/stripe/stripe-ios.git", from: "23.0.0")
    ],
    targets: [
        .target(
            name: "SecuredApp",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
                .product(name: "Stripe", package: "stripe-ios")
            ]
        )
    ]
)
