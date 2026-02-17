import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";

const ORANGE = "#FB4F14";
const NAVY = "#002244";

export const InstagramStory: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background pulse
  const bgBrightness = interpolate(Math.sin(frame * 0.03), [-1, 1], [0.8, 1.1]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${NAVY} 0%, #000a15 50%, #000000 100%)`,
        fontFamily: "Arial, Helvetica, sans-serif",
        filter: `brightness(${bgBrightness})`,
      }}
    >
      {/* Top accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: ORANGE,
        transform: `scaleX(${interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" })})`,
      }} />

      {/* Shield logo */}
      <Sequence from={0} durationInFrames={210}>
        <div style={{
          position: "absolute", top: 80, left: "50%",
          transform: `translate(-50%, 0) scale(${spring({ frame, fps, config: { damping: 12 } })})`,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <svg width="80" height="96" viewBox="0 0 100 120">
            <path d="M50 5 L90 20 L90 65 C90 85 70 102 50 110 C30 102 10 85 10 65 L10 20 Z" fill={ORANGE} />
            <path d="M50 12 L84 25 L84 63 C84 80 67 95 50 102 C33 95 16 80 16 63 L16 25 Z" fill={NAVY} />
            <text x="50" y="72" textAnchor="middle" fill={ORANGE} fontSize="40" fontWeight="bold">S</text>
          </svg>
        </div>
      </Sequence>

      {/* SECURED TAMPA */}
      <Sequence from={15} durationInFrames={195}>
        <div style={{
          position: "absolute", top: 200, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(frame, [15, 35], [30, 0], { extrapolateRight: "clamp" })}px)`,
        }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: "white", letterSpacing: 8 }}>SECURED</div>
          <div style={{ fontSize: 64, fontWeight: 900, color: ORANGE, letterSpacing: 8 }}>TAMPA</div>
        </div>
      </Sequence>

      {/* Divider line */}
      <Sequence from={40} durationInFrames={170}>
        <div style={{
          position: "absolute", top: 380, left: "50%",
          width: interpolate(frame, [40, 60], [0, 200], { extrapolateRight: "clamp" }),
          height: 2, background: ORANGE,
          transform: "translateX(-50%)",
        }} />
      </Sequence>

      {/* Main message - rotating text */}
      <Sequence from={50} durationInFrames={160}>
        {(() => {
          const messages = [
            { text: "NEW DROPS\nEVERY WEEK", start: 50, end: 100 },
            { text: "AUTHENTIC\nGUARANTEED", start: 100, end: 150 },
            { text: "SHOP NOW", start: 150, end: 210 },
          ];
          const current = messages.find(m => frame >= m.start && frame < m.end);
          if (!current) return null;
          const localFrame = frame - current.start;
          const opacity = interpolate(localFrame, [0, 10, 40, 48], [0, 1, 1, 0], { extrapolateRight: "clamp" });
          const scale = interpolate(localFrame, [0, 10], [0.9, 1], { extrapolateRight: "clamp" });
          return (
            <div style={{
              position: "absolute", top: 450, width: "100%", textAlign: "center",
              opacity,
              transform: `scale(${scale})`,
            }}>
              <div style={{
                fontSize: current.text === "SHOP NOW" ? 72 : 56,
                fontWeight: 900, color: "white", letterSpacing: 4,
                lineHeight: 1.2, whiteSpace: "pre-line",
              }}>
                {current.text}
              </div>
            </div>
          );
        })()}
      </Sequence>

      {/* Features list */}
      <Sequence from={60} durationInFrames={150}>
        <div style={{
          position: "absolute", top: 750, width: "100%",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        }}>
          {["Sneakers", "Pokemon TCG", "Graded Cards", "Sealed Product"].map((item, i) => {
            const delay = i * 12;
            const opacity = interpolate(frame - 60, [delay, delay + 15], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            return (
              <div key={item} style={{
                opacity,
                fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.8)",
                letterSpacing: 3, textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ORANGE }} />
                {item}
              </div>
            );
          })}
        </div>
      </Sequence>

      {/* Store info */}
      <Sequence from={120} durationInFrames={90}>
        <div style={{
          position: "absolute", bottom: 300, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [120, 140], [0, 1], { extrapolateRight: "clamp" }),
          color: "rgba(255,255,255,0.5)", fontSize: 22,
        }}>
          <div>Tampa Premium Outlets</div>
          <div style={{ marginTop: 4 }}>(813) 943-2777</div>
        </div>
      </Sequence>

      {/* CTA */}
      <Sequence from={150} durationInFrames={60}>
        <div style={{
          position: "absolute", bottom: 160, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [150, 170], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{
            display: "inline-block", padding: "16px 48px",
            background: ORANGE, borderRadius: 8,
            color: "white", fontSize: 24, fontWeight: 800,
            letterSpacing: 3, textTransform: "uppercase",
            transform: `scale(${1 + Math.sin((frame - 150) * 0.15) * 0.03})`,
          }}>
            securedtampa.com
          </div>
        </div>
      </Sequence>

      {/* Instagram handle */}
      <Sequence from={160} durationInFrames={50}>
        <div style={{
          position: "absolute", bottom: 100, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [160, 175], [0, 1], { extrapolateRight: "clamp" }),
          color: "rgba(255,255,255,0.6)", fontSize: 20,
        }}>
          @securedtampa
        </div>
      </Sequence>

      {/* Bottom accent */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        background: ORANGE,
        transform: `scaleX(${interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" })})`,
        transformOrigin: "right",
      }} />
    </AbsoluteFill>
  );
};
