import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";

const ORANGE = "#FB4F14";
const NAVY = "#002244";

export const StoreIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sections = [
    { title: "WHO WE ARE", body: "Tampa's trusted source for authentic sneakers and Pokemon collectibles.", start: 0 },
    { title: "WHAT WE SELL", body: "New & used sneakers, Pokemon TCG cards, graded collectibles, and sealed product.", start: 60 },
    { title: "WHY US", body: "Every product authenticated. Fair prices. No fakes, no games.", start: 120 },
    { title: "VISIT US", body: "Tampa Premium Outlets\n2398 Grand Cypress Dr STE 420\nLutz, FL 33559", start: 180 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #000000 0%, ${NAVY} 100%)`,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 5,
        background: ORANGE,
        transform: `scaleX(${interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" })})`,
        transformOrigin: "left",
      }} />

      {/* Logo + brand */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <svg width="40" height="48" viewBox="0 0 100 120">
          <path d="M50 5 L90 20 L90 65 C90 85 70 102 50 110 C30 102 10 85 10 65 L10 20 Z" fill={ORANGE} />
          <path d="M50 12 L84 25 L84 63 C84 80 67 95 50 102 C33 95 16 80 16 63 L16 25 Z" fill={NAVY} />
          <text x="50" y="72" textAnchor="middle" fill={ORANGE} fontSize="40" fontWeight="bold">S</text>
        </svg>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "white", letterSpacing: 4 }}>SECURED</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: ORANGE, letterSpacing: 4 }}>TAMPA</div>
        </div>
      </div>

      {/* Sections that transition */}
      {sections.map((section, i) => {
        const localFrame = frame - section.start;
        const enterOpacity = interpolate(localFrame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const exitOpacity = i < sections.length - 1
          ? interpolate(localFrame, [50, 58], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 1;
        const opacity = Math.min(enterOpacity, exitOpacity);
        const y = interpolate(localFrame, [0, 15], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        if (frame < section.start - 5) return null;

        return (
          <Sequence key={section.title} from={section.start} durationInFrames={i < sections.length - 1 ? 65 : 90}>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) translateY(${y}px)`,
              opacity,
              textAlign: "center",
              width: "80%",
            }}>
              <div style={{
                fontSize: 24, fontWeight: 600, color: ORANGE,
                letterSpacing: 8, marginBottom: 24,
              }}>
                {section.title}
              </div>
              <div style={{
                fontSize: 48, fontWeight: 700, color: "white",
                lineHeight: 1.3, whiteSpace: "pre-line",
              }}>
                {section.body}
              </div>
            </div>
          </Sequence>
        );
      })}

      {/* Contact + CTA */}
      <Sequence from={230} durationInFrames={40}>
        <div style={{
          position: "absolute", bottom: 80, width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [230, 245], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 22, marginBottom: 16 }}>
            (813) 943-2777 | @securedtampa
          </div>
          <div style={{
            display: "inline-block", padding: "14px 48px",
            background: ORANGE, borderRadius: 8,
            color: "white", fontSize: 24, fontWeight: 800, letterSpacing: 3,
          }}>
            SECUREDTAMPA.COM
          </div>
        </div>
      </Sequence>

      {/* Bottom bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 5,
        background: ORANGE,
        transform: `scaleX(${interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" })})`,
        transformOrigin: "right",
      }} />
    </AbsoluteFill>
  );
};
