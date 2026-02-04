import SwiftUI

// MARK: - Wishlist Button

struct WishlistButton: View {
    let productId: UUID
    @EnvironmentObject var wishlistViewModel: WishlistViewModel

    @State private var isAnimating = false
    @State private var showParticles = false

    private var isWishlisted: Bool {
        wishlistViewModel.isWishlisted(productId)
    }

    var body: some View {
        Button {
            toggleWishlist()
        } label: {
            ZStack {
                // Particle burst effect
                if showParticles {
                    ParticleBurst()
                }

                // Heart icon
                Image(systemName: isWishlisted ? "heart.fill" : "heart")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(isWishlisted ? Color.securedAccent : Color.securedTextPrimary)
                    .scaleEffect(isAnimating ? 1.3 : 1.0)
            }
            .frame(width: 36, height: 36)
            .background(Color.securedBackground.opacity(0.9))
            .clipShape(Circle())
            .securedSubtleShadow()
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.impact(weight: .medium), trigger: isWishlisted)
    }

    private func toggleWishlist() {
        withAnimation(SecuredAnimation.quickSpring) {
            isAnimating = true

            if !isWishlisted {
                showParticles = true
            }

            wishlistViewModel.toggleWishlist(productId)
        }

        // Reset animation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation {
                isAnimating = false
            }
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            showParticles = false
        }
    }
}

// MARK: - Compact Wishlist Button (for cards)

struct CompactWishlistButton: View {
    let productId: UUID
    @EnvironmentObject var wishlistViewModel: WishlistViewModel

    @State private var isAnimating = false

    private var isWishlisted: Bool {
        wishlistViewModel.isWishlisted(productId)
    }

    var body: some View {
        Button {
            toggleWishlist()
        } label: {
            Image(systemName: isWishlisted ? "heart.fill" : "heart")
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(isWishlisted ? Color.securedAccent : .white)
                .scaleEffect(isAnimating ? 1.2 : 1.0)
                .frame(width: 32, height: 32)
                .background(.ultraThinMaterial)
                .clipShape(Circle())
        }
        .buttonStyle(.plain)
        .sensoryFeedback(.impact(weight: .light), trigger: isWishlisted)
    }

    private func toggleWishlist() {
        withAnimation(SecuredAnimation.quickSpring) {
            isAnimating = true
            wishlistViewModel.toggleWishlist(productId)
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            withAnimation {
                isAnimating = false
            }
        }
    }
}

// MARK: - Particle Burst Effect

struct ParticleBurst: View {
    @State private var particles: [Particle] = []

    struct Particle: Identifiable {
        let id = UUID()
        var x: CGFloat
        var y: CGFloat
        var scale: CGFloat
        var opacity: Double
    }

    var body: some View {
        ZStack {
            ForEach(particles) { particle in
                Circle()
                    .fill(Color.securedAccent)
                    .frame(width: 6, height: 6)
                    .scaleEffect(particle.scale)
                    .opacity(particle.opacity)
                    .offset(x: particle.x, y: particle.y)
            }
        }
        .onAppear {
            createParticles()
        }
    }

    private func createParticles() {
        for _ in 0..<8 {
            let angle = Double.random(in: 0...(2 * .pi))
            let distance = CGFloat.random(in: 15...25)

            var particle = Particle(
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1
            )
            particles.append(particle)

            let index = particles.count - 1

            withAnimation(.easeOut(duration: 0.4)) {
                particles[index].x = cos(angle) * distance
                particles[index].y = sin(angle) * distance
                particles[index].scale = 0.3
                particles[index].opacity = 0
            }
        }
    }
}

// MARK: - Wishlist Badge (for tab bar or header)

struct WishlistBadge: View {
    @EnvironmentObject var wishlistViewModel: WishlistViewModel

    var body: some View {
        if wishlistViewModel.count > 0 {
            Text("\(wishlistViewModel.count)")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white)
                .frame(minWidth: 16, minHeight: 16)
                .padding(.horizontal, 4)
                .background(Color.securedAccent)
                .clipShape(Capsule())
        }
    }
}

// MARK: - Preview

#Preview {
    VStack(spacing: 40) {
        HStack(spacing: 20) {
            WishlistButton(productId: UUID())
            WishlistButton(productId: MockData.airJordan1Travis.id)
        }

        HStack(spacing: 20) {
            CompactWishlistButton(productId: UUID())
                .background(Color.gray)
            CompactWishlistButton(productId: MockData.nikeDunkLowPanda.id)
                .background(Color.gray)
        }
    }
    .padding()
    .environmentObject(WishlistViewModel())
}
