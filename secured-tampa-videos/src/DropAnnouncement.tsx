import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";

const ORANGE = "#FB4F14";
const NAVY = "#002244";

export const DropAnnouncement: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flash effect at start
  const flashOpacity = interpolate(frame, [0, 3, 8], [1, 0.8, 0], { extrapolateRight: "clamp" });

  // Shake effect
  const shakeX = frame < 15 ? Math.sin(frame * 2) * (15 - frame) * 0.5 : 0;

  return (
    <AbsoluteFill
      style={{
        background: "#000000",
        fontFamily: "Arial, Helvetica, sans-serif",
        transform: `translateX(${shakeX}px)`,
      }}
    >
      {/* Flash overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: ORANGE, opacity: flashOpacity,
        zIndex: 10,
      }} />

      {/* Diagonal accent lines */}
      <div style={{
        position: "absolute", top: -200, left: -100,
        width: 1400, height: 200,
        background: ORANGE, opacity: 0.05,
        transform: "rotate(-15deg)",
      }} />
      <div style={{
        position: "absolute", bottom: -200, right: -100,
        width: 1400, height: 200,
        background: ORANGE, opacity: 0.05,
        transform: "rotate(-15deg)",
      }} />

      {/* "NEW DROP" flash text */}
      <Sequence from={5} durationInFrames={175}>
        <div style={{
          position: "absolute", top: 200, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [5, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{
            fontSize: 36, fontWeight: 600, color: ORANGE,
            letterSpacing: 12, textTransform: "uppercase",
          }}>
            New Drop Alert
          </div>
        </div>
      </Sequence>

      {/* Big product name */}
      <Sequence from={15} durationInFrames={165}>
        <div style={{
          position: "absolute", top: 320, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 10, stiffness: 80 } })})`,
        }}>
          {/* Product image placeholder */}
          <div style={{
            width: 600, height: 600, margin: "0 auto",
            background: "white", borderRadius: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 100px rgba(251, 79, 20, 0.3)`,
          }}>
            <div style={{ fontSize: 48, color: NAVY, fontWeight: 800, textAlign: "center", padding: 40 }}>
              YOUR PRODUCT HERE
            </div>
          </div>
        </div>
      </Sequence>

      {/* Product details */}
      <Sequence from={40} durationInFrames={140}>
        <div style={{
          position: "absolute", top: 1000, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: "white", letterSpacing: 3 }}>
            JORDAN 4 RETRO
          </div>
          <div style={{ fontSize: 32, color: "rgba(255,255,255,0.6)", marginTop: 8, letterSpacing: 2 }}>
            Midnight Navy
          </div>
          <div style={{ fontSize: 60, fontWeight: 900, color: ORANGE, marginTop: 20 }}>
            $215
          </div>
        </div>
      </Sequence>

      {/* Urgency text */}
      <Sequence from={80} durationInFrames={100}>
        <div style={{
          position: "absolute", top: 1280, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [80, 95], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{
            display: "inline-block", padding: "10px 32px",
            border: `2px solid ${ORANGE}`, borderRadius: 50,
            color: ORANGE, fontSize: 24, fontWeight: 700, letterSpacing: 4,
          }}>
            LIMITED STOCK
          </div>
        </div>
      </Sequence>

      {/* CTA */}
      <Sequence from={110} durationInFrames={70}>
        <div style={{
          position: "absolute", bottom: 280, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [110, 125], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{
            display: "inline-block", padding: "18px 56px",
            background: ORANGE, borderRadius: 12,
            color: "white", fontSize: 28, fontWeight: 900, letterSpacing: 4,
            transform: `scale(${1 + Math.sin((frame - 110) * 0.12) * 0.03})`,
          }}>
            SHOP NOW
          </div>
        </div>
      </Sequence>

      {/* Store branding */}
      <Sequence from={120} durationInFrames={60}>
        <div style={{
          position: "absolute", bottom: 160, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [120, 135], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.4)", letterSpacing: 4 }}>
            securedtampa.com | @securedtampa
          </div>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
