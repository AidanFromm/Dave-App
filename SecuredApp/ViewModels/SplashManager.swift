//
//  SplashManager.swift
//  SecuredApp
//
//  Manages splash screen state and timing
//

import SwiftUI
import Combine

@MainActor
class SplashManager: ObservableObject {
    @Published var showSplash: Bool = true
    @Published var isExiting: Bool = false

    private let splashDuration: TimeInterval = 1.5
    private let exitDuration: TimeInterval = 0.3

    func startSplash() {
        // After splash duration, trigger exit animation
        Task {
            try? await Task.sleep(nanoseconds: UInt64(splashDuration * 1_000_000_000))
            completeSplash()
        }
    }

    func completeSplash() {
        withAnimation(SecuredAnimation.splashExit) {
            isExiting = true
        }

        // After exit animation, hide splash completely
        Task {
            try? await Task.sleep(nanoseconds: UInt64(exitDuration * 1_000_000_000))
            showSplash = false
        }
    }
}
