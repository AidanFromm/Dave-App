//
//  ThemeManager.swift
//  SecuredApp
//
//  Manages app-wide appearance settings with persistent storage
//

import SwiftUI

/// Manages the app's color scheme preference
class ThemeManager: ObservableObject {

    /// User's preferred color scheme stored in UserDefaults
    @AppStorage("colorScheme") var colorSchemePreference: AppColorScheme = .system

    /// Color scheme options available to the user
    enum AppColorScheme: String, CaseIterable, Identifiable {
        case system = "System"
        case light = "Light"
        case dark = "Dark"

        var id: String { rawValue }

        /// System image for each option
        var icon: String {
            switch self {
            case .system: return "circle.lefthalf.filled"
            case .light: return "sun.max.fill"
            case .dark: return "moon.fill"
            }
        }

        /// Description for each option
        var description: String {
            switch self {
            case .system: return "Follows your device settings"
            case .light: return "Always use light appearance"
            case .dark: return "Always use dark appearance"
            }
        }
    }

    /// Returns the SwiftUI ColorScheme based on user preference
    /// Returns nil for .system to let the system decide
    var resolvedColorScheme: ColorScheme? {
        switch colorSchemePreference {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}
