import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";

const ORANGE = "#FB4F14";
const NAVY = "#002244";

export const ProductShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Products to showcase (can be parameterized later with real product data)
  const products = [
    { name: "Jordan 4 Retro", subtitle: "Midnight Navy", price: "$215" },
    { name: "Yeezy Slide", subtitle: "Onyx", price: "$180" },
    { name: "Charizard VMAX", subtitle: "PSA 10", price: "$350" },
  ];

  // Each product gets ~70 frames (2.3s)
  const productDuration = 70;

  return (
    <AbsoluteFill
      style={{
        background: NAVY,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* Corner accents */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 80, height: 4, background: ORANGE }} />
      <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: 80, background: ORANGE }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 80, height: 4, background: ORANGE }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 4, height: 80, background: ORANGE }} />

      {/* Header */}
      <Sequence from={0} durationInFrames={240}>
        <div style={{
          position: "absolute", top: 40, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: ORANGE, letterSpacing: 6, textTransform: "uppercase" }}>
            Featured Product
          </div>
        </div>
      </Sequence>

      {/* Product rotation */}
      {products.map((product, i) => {
        const start = 20 + i * productDuration;
        const end = start + productDuration;
        if (frame < start || frame >= end + 10) return null;

        const localFrame = frame - start;
        const enterOpacity = interpolate(localFrame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
        const exitOpacity = interpolate(localFrame, [productDuration - 12, productDuration], [1, 0], { extrapolateRight: "clamp" });
        const opacity = Math.min(enterOpacity, exitOpacity);
        const scale = spring({ frame: localFrame, fps, config: { damping: 15 } });

        return (
          <Sequence key={product.name} from={start} durationInFrames={productDuration + 10}>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              textAlign: "center",
            }}>
              {/* Product image placeholder - white box */}
              <div style={{
                width: 500,
                height: 500,
                background: "white",
                borderRadius: 24,
                margin: "0 auto 40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 60px rgba(251, 79, 20, 0.2)`,
              }}>
                <div style={{ fontSize: 48, color: NAVY, fontWeight: 700 }}>
                  {product.name}
                </div>
              </div>

              {/* Product info */}
              <div style={{ fontSize: 42, fontWeight: 900, color: "white", letterSpacing: 2 }}>
                {product.name}
              </div>
              <div style={{ fontSize: 28, color: "rgba(255,255,255,0.6)", marginTop: 8, letterSpacing: 2 }}>
                {product.subtitle}
              </div>
              <div style={{
                fontSize: 52, fontWeight: 900, color: ORANGE, marginTop: 20,
                letterSpacing: 2,
              }}>
                {product.price}
              </div>
            </div>
          </Sequence>
        );
      })}

      {/* Footer CTA */}
      <Sequence from={200} durationInFrames={40}>
        <div style={{
          position: "absolute", bottom: 60, width: "100%", textAlign: "center",
          opacity: interpolate(frame, [200, 215], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <div style={{
            display: "inline-block", padding: "14px 40px",
            background: ORANGE, borderRadius: 8,
            color: "white", fontSize: 22, fontWeight: 800,
            letterSpacing: 3,
          }}>
            SHOP AT SECUREDTAMPA.COM
          </div>
        </div>
      </Sequence>

      {/* Logo watermark */}
      <div style={{
        position: "absolute", bottom: 16, right: 20,
        color: "rgba(255,255,255,0.2)", fontSize: 14, letterSpacing: 2,
      }}>
        SECURED TAMPA
      </div>
    </AbsoluteFill>
  );
};
