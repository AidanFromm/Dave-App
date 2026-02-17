import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";

const ORANGE = "#FB4F14";
const NAVY = "#002244";

export const PromoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Shield logo entrance (frames 0-40)
  const shieldScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const shieldOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Title entrance (frames 30-70)
  const titleY = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 15 } });
  const titleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });

  // Tagline (frames 60-100)
  const tagOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });
  const tagY = interpolate(frame, [60, 80], [30, 0], { extrapolateRight: "clamp" });

  // Features stagger in (frames 90-180)
  const features = [
    "Authentic Sneakers",
    "Pokemon TCG",
    "Graded Cards",
    "New Drops Weekly",
  ];

  // Store info (frames 180-240)
  const infoOpacity = interpolate(frame, [180, 200], [0, 1], { extrapolateRight: "clamp" });

  // CTA pulse (frames 230-300)
  const ctaScale = frame > 230 ? 1 + Math.sin((frame - 230) * 0.1) * 0.05 : 0;
  const ctaOpacity = interpolate(frame, [230, 250], [0, 1], { extrapolateRight: "clamp" });

  // Background gradient animation
  const gradientAngle = interpolate(frame, [0, 300], [135, 225]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${NAVY} 0%, #001122 40%, #000a15 100%)`,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* Animated accent lines */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: ORANGE,
          transform: `scaleX(${interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" })})`,
          transformOrigin: "left",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: ORANGE,
          transform: `scaleX(${interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" })})`,
          transformOrigin: "right",
        }}
      />

      {/* Shield Logo */}
      <Sequence from={0} durationInFrames={300}>
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${shieldScale})`,
            opacity: shieldOpacity,
          }}
        >
          <svg width="120" height="140" viewBox="0 0 100 120">
            <path d="M50 5 L90 20 L90 65 C90 85 70 102 50 110 C30 102 10 85 10 65 L10 20 Z" fill={ORANGE} />
            <path d="M50 12 L84 25 L84 63 C84 80 67 95 50 102 C33 95 16 80 16 63 L16 25 Z" fill={NAVY} />
            <text x="50" y="72" textAnchor="middle" fill={ORANGE} fontSize="40" fontWeight="bold" fontFamily="Arial">S</text>
          </svg>
        </div>
      </Sequence>

      {/* SECURED TAMPA title */}
      <Sequence from={30} durationInFrames={270}>
        <div
          style={{
            position: "absolute",
            top: "38%",
            width: "100%",
            textAlign: "center",
            opacity: titleOpacity,
            transform: `translateY(${interpolate(titleY, [0, 1], [40, 0])}px)`,
          }}
        >
          <div style={{ fontSize: 96, fontWeight: 900, color: "white", letterSpacing: 12, lineHeight: 1 }}>
            SECURED
          </div>
          <div style={{ fontSize: 96, fontWeight: 900, color: ORANGE, letterSpacing: 12, lineHeight: 1, marginTop: 8 }}>
            TAMPA
          </div>
        </div>
      </Sequence>

      {/* Tagline */}
      <Sequence from={60} durationInFrames={240}>
        <div
          style={{
            position: "absolute",
            top: "58%",
            width: "100%",
            textAlign: "center",
            opacity: tagOpacity,
            transform: `translateY(${tagY}px)`,
          }}
        >
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", letterSpacing: 4, textTransform: "uppercase" }}>
            Premium Sneakers & Collectibles
          </div>
        </div>
      </Sequence>

      {/* Feature pills */}
      <Sequence from={90} durationInFrames={210}>
        <div
          style={{
            position: "absolute",
            top: "66%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {features.map((feat, i) => {
            const delay = i * 15;
            const opacity = interpolate(frame - 90, [delay, delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const y = interpolate(frame - 90, [delay, delay + 20], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div
                key={feat}
                style={{
                  opacity,
                  transform: `translateY(${y}px)`,
                  padding: "12px 28px",
                  border: `2px solid ${ORANGE}`,
                  borderRadius: 50,
                  color: "white",
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                {feat}
              </div>
            );
          })}
        </div>
      </Sequence>

      {/* Store info */}
      <Sequence from={180} durationInFrames={120}>
        <div
          style={{
            position: "absolute",
            top: "78%",
            width: "100%",
            textAlign: "center",
            opacity: infoOpacity,
            color: "rgba(255,255,255,0.6)",
            fontSize: 22,
          }}
        >
          <div>Tampa Premium Outlets | (813) 943-2777</div>
          <div style={{ marginTop: 8 }}>@securedtampa</div>
        </div>
      </Sequence>

      {/* CTA */}
      <Sequence from={230} durationInFrames={70}>
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            width: "100%",
            textAlign: "center",
            opacity: ctaOpacity,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "18px 60px",
              background: ORANGE,
              borderRadius: 8,
              color: "white",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 3,
              transform: `scale(${1 + ctaScale * 0.05})`,
              textTransform: "uppercase",
            }}
          >
            Shop Now — securedtampa.com
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
