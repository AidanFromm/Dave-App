//
//  StockXService.swift
//  SecuredApp
//
//  StockX API client for product lookup
//
//  Endpoints:
//  - Search catalog by name/SKU
//  - Get product details
//  - Get product variants (sizes with UPC/GTIN)
//

import Foundation

class StockXService {
    static let shared = StockXService()
    private init() {}

    private let baseURL = "https://api.stockx.com/v2"
    private let apiKey = "qAYBY1lFUv2PVXRldvSf4ya1pkjGhQZ9rxBj4LW7"

    private let authManager = StockXAuthManager.shared

    // MARK: - Search Products
    func searchProducts(query: String, limit: Int = 20) async throws -> [StockXProduct] {
        guard let accessToken = await authManager.getValidAccessToken() else {
            throw StockXError.notAuthenticated
        }

        var components = URLComponents(string: "\(baseURL)/catalog/search")!
        components.queryItems = [
            URLQueryItem(name: "query", value: query),
            URLQueryItem(name: "pageSize", value: String(limit))
        ]

        guard let url = components.url else {
            throw StockXError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw StockXError.invalidResponse
        }

        if httpResponse.statusCode == 401 {
            throw StockXError.notAuthenticated
        }

        guard httpResponse.statusCode == 200 else {
            throw StockXError.apiError(statusCode: httpResponse.statusCode)
        }

        let searchResponse = try JSONDecoder().decode(SearchResponse.self, from: data)
        return searchResponse.products
    }

    // MARK: - Get Product by ID
    func getProduct(id: String) async throws -> StockXProductDetail {
        guard let accessToken = await authManager.getValidAccessToken() else {
            throw StockXError.notAuthenticated
        }

        guard let url = URL(string: "\(baseURL)/catalog/products/\(id)") else {
            throw StockXError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw StockXError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw StockXError.apiError(statusCode: httpResponse.statusCode)
        }

        return try JSONDecoder().decode(StockXProductDetail.self, from: data)
    }

    // MARK: - Get Product Variants (Sizes with UPC)
    func getProductVariants(productId: String) async throws -> [StockXVariant] {
        guard let accessToken = await authManager.getValidAccessToken() else {
            throw StockXError.notAuthenticated
        }

        guard let url = URL(string: "\(baseURL)/catalog/products/\(productId)/variants") else {
            throw StockXError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw StockXError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw StockXError.apiError(statusCode: httpResponse.statusCode)
        }

        let variantsResponse = try JSONDecoder().decode(VariantsResponse.self, from: data)
        return variantsResponse.variants
    }

    // MARK: - Lookup by Barcode/UPC
    func lookupByBarcode(_ barcode: String) async throws -> StockXLookupResult? {
        // First, search for products that might match this barcode
        // StockX stores UPC/GTIN in variant data, so we need to search broadly
        // then check variants for matching barcode

        // Try searching with the barcode directly (some products index by UPC)
        let products = try await searchProducts(query: barcode, limit: 10)

        for product in products {
            let variants = try await getProductVariants(productId: product.id)

            for variant in variants {
                // Check if any GTIN matches the scanned barcode
                if let gtins = variant.gtins {
                    for gtin in gtins {
                        if gtin.identifier == barcode {
                            // Found a match!
                            let productDetail = try await getProduct(id: product.id)
                            return StockXLookupResult(
                                product: productDetail,
                                matchedVariant: variant,
                                matchedBarcode: barcode
                            )
                        }
                    }
                }
            }
        }

        return nil
    }
}

// MARK: - Error Types
enum StockXError: Error, LocalizedError {
    case notAuthenticated
    case invalidURL
    case invalidResponse
    case apiError(statusCode: Int)
    case productNotFound

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Please log in to StockX first"
        case .invalidURL:
            return "Invalid request URL"
        case .invalidResponse:
            return "Invalid server response"
        case .apiError(let code):
            return "API error (HTTP \(code))"
        case .productNotFound:
            return "Product not found"
        }
    }
}

// MARK: - Response Models
struct SearchResponse: Decodable {
    let products: [StockXProduct]

    enum CodingKeys: String, CodingKey {
        case products
    }
}

struct VariantsResponse: Decodable {
    let variants: [StockXVariant]
}

// MARK: - StockX Product Models
struct StockXProduct: Decodable, Identifiable {
    let id: String
    let name: String
    let brand: String?
    let colorway: String?
    let styleId: String?
    let retailPrice: Int?
    let releaseDate: String?
    let thumbnailUrl: String?

    enum CodingKeys: String, CodingKey {
        case id = "productId"
        case name = "productName"
        case brand
        case colorway
        case styleId
        case retailPrice
        case releaseDate
        case thumbnailUrl = "thumbUrl"
    }
}

struct StockXProductDetail: Decodable {
    let id: String
    let name: String
    let brand: String?
    let colorway: String?
    let styleId: String?
    let retailPrice: Int?
    let releaseDate: String?
    let description: String?
    let imageUrl: String?
    let category: String?

    enum CodingKeys: String, CodingKey {
        case id = "productId"
        case name = "productName"
        case brand
        case colorway
        case styleId
        case retailPrice
        case releaseDate
        case description
        case imageUrl = "image"
        case category
    }
}

struct StockXVariant: Decodable, Identifiable {
    let id: String
    let sizeUS: String?
    let sizeEU: String?
    let sizeUK: String?
    let gtins: [GTIN]?

    enum CodingKeys: String, CodingKey {
        case id = "variantId"
        case sizeUS = "sizeChart.us.size"
        case sizeEU = "sizeChart.eu.size"
        case sizeUK = "sizeChart.uk.size"
        case gtins
    }

    // Custom decoding for nested size values
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        gtins = try container.decodeIfPresent([GTIN].self, forKey: .gtins)

        // Handle nested sizeChart structure
        if let sizeChart = try? container.nestedContainer(keyedBy: SizeChartKeys.self, forKey: .sizeUS) {
            sizeUS = try? sizeChart.nestedContainer(keyedBy: SizeKeys.self, forKey: .us).decode(String.self, forKey: .size)
            sizeEU = try? sizeChart.nestedContainer(keyedBy: SizeKeys.self, forKey: .eu).decode(String.self, forKey: .size)
            sizeUK = try? sizeChart.nestedContainer(keyedBy: SizeKeys.self, forKey: .uk).decode(String.self, forKey: .size)
        } else {
            sizeUS = nil
            sizeEU = nil
            sizeUK = nil
        }
    }

    private enum SizeChartKeys: String, CodingKey {
        case us, eu, uk
    }

    private enum SizeKeys: String, CodingKey {
        case size
    }
}

struct GTIN: Decodable {
    let type: String      // "UPC" or "EAN-13"
    let identifier: String
}

// MARK: - Lookup Result
struct StockXLookupResult {
    let product: StockXProductDetail
    let matchedVariant: StockXVariant
    let matchedBarcode: String

    var displaySize: String {
        matchedVariant.sizeUS ?? matchedVariant.sizeEU ?? "Unknown"
    }
}
