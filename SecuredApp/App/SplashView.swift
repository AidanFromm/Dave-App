//
//  SplashView.swift
//  SecuredApp
//
//  Animated splash screen with SECURED logo and animated underline
//

import SwiftUI

struct SplashView: View {
    @EnvironmentObject var splashManager: SplashManager

    // Animation states
    @State private var logoScale: CGFloat = 0.6
    @State private var logoOpacity: Double = 0
    @State private var underlineProgress: CGFloat = 0
    @State private var pulseScale: CGFloat = 1.0

    // Logo configuration
    private let logoText = "SECURED"
    private let logoFontSize: CGFloat = 48
    private let letterSpacing: CGFloat = 3.84 // 8% of font size
    private let underlineHeight: CGFloat = 3
    private let underlineColor = Color(red: 251/255, green: 79/255, blue: 20/255) // #FB4F14

    var body: some View {
        ZStack {
            // Dark background
            Color(red: 13/255, green: 13/255, blue: 13/255) // #0D0D0D
                .ignoresSafeArea()

            // Logo container
            VStack(spacing: 4) {
                // Logo with underline
                ZStack(alignment: .bottomLeading) {
                    // SECURED text
                    Text(logoText)
                        .font(.system(size: logoFontSize, weight: .bold))
                        .tracking(letterSpacing)
                        .foregroundColor(.white)

                    // Animated underline under "S"
                    GeometryReader { geometry in
                        let sWidth = calculateSWidth(totalWidth: geometry.size.width)

                        Rectangle()
                            .fill(underlineColor)
                            .frame(width: sWidth * underlineProgress, height: underlineHeight)
                            .offset(y: geometry.size.height - underlineHeight + 2)
                    }
                }
                .fixedSize()
            }
            .scaleEffect(logoScale * pulseScale)
            .opacity(logoOpacity)
            .scaleEffect(splashManager.isExiting ? 1.1 : 1.0)
            .opacity(splashManager.isExiting ? 0 : 1)
        }
        .onAppear {
            startAnimations()
        }
    }

    private func calculateSWidth(totalWidth: CGFloat) -> CGFloat {
        // Approximate width of "S" character (roughly 1/8 of total with spacing)
        // Since we have 7 characters with spacing, "S" is about 1/7 of the width
        // Adding a bit extra to look good
        let characterCount = CGFloat(logoText.count)
        let sWidth = (totalWidth / characterCount) + letterSpacing
        return sWidth
    }

    private func startAnimations() {
        // 0.0s - 0.6s: Logo fades in + scales
        withAnimation(SecuredAnimation.splashEntry) {
            logoScale = 1.0
            logoOpacity = 1.0
        }

        // 0.3s - 0.9s: Orange underline draws left-to-right
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation(SecuredAnimation.splashUnderline) {
                underlineProgress = 1.0
            }
        }

        // 1.2s - 1.5s: Subtle pulse
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            withAnimation(.easeInOut(duration: 0.15)) {
                pulseScale = 1.02
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                withAnimation(.easeInOut(duration: 0.15)) {
                    pulseScale = 1.0
                }
            }
        }
    }
}

#Preview {
    SplashView()
        .environmentObject(SplashManager())
}
