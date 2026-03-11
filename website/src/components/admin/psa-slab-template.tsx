"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface PSASlabProps {
  cardName: string;
  year: string;
  grade: string;
  certNumber: string;
  cardImageUrl: string;
  category?: string;
  variety?: string;
  onImageGenerated?: (dataUrl: string) => void;
}

interface GradeConfig {
  gradeText: string;
  labelBg: string;
  labelAccent: string;
  labelTextColor: string;
  isGem: boolean;
}

function getGradeConfig(grade: string): GradeConfig {
  const g = parseInt(grade, 10);
  if (g === 10) {
    return {
      gradeText: "GEM-MT 10",
      labelBg: "#8B0000",
      labelAccent: "#FFD700",
      labelTextColor: "#FFFFFF",
      isGem: true,
    };
  }
  if (g === 9) {
    return {
      gradeText: "MINT 9",
      labelBg: "#1a3a5c",
      labelAccent: "#4A90D9",
      labelTextColor: "#FFFFFF",
      isGem: false,
    };
  }
  if (g === 8) {
    return {
      gradeText: "NM-MT 8",
      labelBg: "#1a3a5c",
      labelAccent: "#4A90D9",
      labelTextColor: "#FFFFFF",
      isGem: false,
    };
  }
  // Default for other grades
  return {
    gradeText: `${grade}`,
    labelBg: "#1a3a5c",
    labelAccent: "#4A90D9",
    labelTextColor: "#FFFFFF",
    isGem: false,
  };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function PSASlabTemplate({
  cardName,
  year,
  grade,
  certNumber,
  cardImageUrl,
  category,
  variety,
  onImageGenerated,
}: PSASlabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [dataUrl, setDataUrl] = useState<string>("");

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Slab dimensions (portrait oriented, like real PSA case)
    const W = 600;
    const H = 880;
    canvas.width = W;
    canvas.height = H;

    const config = getGradeConfig(grade);

    // === OUTER CASE (clear plastic shell) ===
    // Background - transparent-ish grey for the case
    ctx.clearRect(0, 0, W, H);

    // Drop shadow behind the slab
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 12;

    // Main case body
    drawRoundedRect(ctx, 0, 0, W, H, 20);
    const caseBg = ctx.createLinearGradient(0, 0, W, H);
    caseBg.addColorStop(0, "#e8e8e8");
    caseBg.addColorStop(0.3, "#d4d4d4");
    caseBg.addColorStop(0.5, "#e0e0e0");
    caseBg.addColorStop(0.7, "#c8c8c8");
    caseBg.addColorStop(1, "#d0d0d0");
    ctx.fillStyle = caseBg;
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Case border (plastic edge)
    drawRoundedRect(ctx, 0, 0, W, H, 20);
    const borderGrad = ctx.createLinearGradient(0, 0, W, 0);
    borderGrad.addColorStop(0, "#b0b0b0");
    borderGrad.addColorStop(0.5, "#e0e0e0");
    borderGrad.addColorStop(1, "#a0a0a0");
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner plastic rim
    drawRoundedRect(ctx, 8, 8, W - 16, H - 16, 16);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // === PSA LABEL AREA (top section) ===
    const labelX = 24;
    const labelY = 20;
    const labelW = W - 48;
    const labelH = 200;

    // Label background
    drawRoundedRect(ctx, labelX, labelY, labelW, labelH, 10);
    const labelGrad = ctx.createLinearGradient(labelX, labelY, labelX, labelY + labelH);
    labelGrad.addColorStop(0, config.labelBg);
    labelGrad.addColorStop(1, config.isGem ? "#5c0000" : "#0f2840");
    ctx.fillStyle = labelGrad;
    ctx.fill();

    // Label border
    drawRoundedRect(ctx, labelX, labelY, labelW, labelH, 10);
    ctx.strokeStyle = config.isGem ? "#FFD700" : "#6ba3d6";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner glow line on label
    drawRoundedRect(ctx, labelX + 3, labelY + 3, labelW - 6, labelH - 6, 8);
    ctx.strokeStyle = config.isGem
      ? "rgba(255,215,0,0.3)"
      : "rgba(100,160,220,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // === PSA LOGO ===
    // Draw "PSA" text as the logo
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // PSA shield-like background
    const logoX = labelX + 20;
    const logoY = labelY + 15;

    // "PSA" text
    ctx.font = "bold 42px 'Arial Black', Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("PSA", logoX, logoY);

    // Subtitle under PSA
    ctx.font = "bold 8px Arial, sans-serif";
    ctx.fillStyle = config.isGem ? "#FFD700" : "#8ab8e0";
    ctx.letterSpacing = "2px";
    ctx.fillText("PROFESSIONAL SPORTS AUTHENTICATOR", logoX, logoY + 46);
    ctx.letterSpacing = "0px";

    // === GRADE DISPLAY (right side of label) ===
    const gradeX = labelX + labelW - 130;
    const gradeY = labelY + 12;
    const gradeW = 115;
    const gradeH = 70;

    // Grade box background
    drawRoundedRect(ctx, gradeX, gradeY, gradeW, gradeH, 8);
    if (config.isGem) {
      const gemGrad = ctx.createLinearGradient(gradeX, gradeY, gradeX + gradeW, gradeY + gradeH);
      gemGrad.addColorStop(0, "#FFD700");
      gemGrad.addColorStop(0.5, "#FFF8DC");
      gemGrad.addColorStop(1, "#FFD700");
      ctx.fillStyle = gemGrad;
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.15)";
    }
    ctx.fill();

    drawRoundedRect(ctx, gradeX, gradeY, gradeW, gradeH, 8);
    ctx.strokeStyle = config.isGem ? "#B8860B" : "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Grade number
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 40px 'Arial Black', Arial, sans-serif";
    ctx.fillStyle = config.isGem ? "#8B0000" : "#FFFFFF";
    ctx.fillText(grade, gradeX + gradeW / 2, gradeY + gradeH / 2 + 2);

    // === GRADE TEXT LINE ===
    ctx.textAlign = "center";
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.fillStyle = config.isGem ? "#FFD700" : "#8ab8e0";
    ctx.fillText(config.gradeText, labelX + labelW / 2, labelY + 100);

    // === CARD INFO LINES ===
    // Year + Brand line
    const infoLine1 = [year, category].filter(Boolean).join(" ");
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(infoLine1.toUpperCase(), labelX + labelW / 2, labelY + 126);

    // Card name
    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    const displayName = cardName.length > 40 ? cardName.substring(0, 37) + "..." : cardName;
    ctx.fillText(displayName, labelX + labelW / 2, labelY + 146);

    // Variety
    if (variety) {
      ctx.font = "11px Arial, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      const displayVariety = variety.length > 50 ? variety.substring(0, 47) + "..." : variety;
      ctx.fillText(displayVariety, labelX + labelW / 2, labelY + 164);
    }

    // === CERT NUMBER + BARCODE ===
    // Cert number
    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "center";
    ctx.fillText(`Cert #${certNumber}`, labelX + labelW / 2, labelY + labelH - 16);

    // Barcode simulation (thin lines)
    const barcodeX = labelX + labelW / 2 - 80;
    const barcodeY = labelY + labelH - 36;
    const barcodeW = 160;
    const barcodeH = 14;

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(barcodeX - 4, barcodeY - 2, barcodeW + 8, barcodeH + 4);

    // Generate barcode bars from cert number
    const barcodeData = certNumber.padEnd(20, "0");
    const barWidth = barcodeW / (barcodeData.length * 3);
    ctx.fillStyle = "#FFFFFF";
    for (let i = 0; i < barcodeData.length * 3; i++) {
      const charCode = barcodeData.charCodeAt(i % barcodeData.length);
      if ((charCode + i) % 3 !== 0) {
        ctx.fillRect(
          barcodeX + i * barWidth,
          barcodeY,
          barWidth * 0.7,
          barcodeH
        );
      }
    }

    // === CARD IMAGE AREA ===
    const cardAreaX = 36;
    const cardAreaY = 236;
    const cardAreaW = W - 72;
    const cardAreaH = H - 270;

    // Card area background (white mat)
    drawRoundedRect(ctx, cardAreaX, cardAreaY, cardAreaW, cardAreaH, 8);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    // Subtle inner border
    drawRoundedRect(ctx, cardAreaX + 2, cardAreaY + 2, cardAreaW - 4, cardAreaH - 4, 6);
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Load and draw card image
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = cardImageUrl;
      });

      // Calculate fit dimensions (maintain aspect ratio)
      const padding = 16;
      const maxW = cardAreaW - padding * 2;
      const maxH = cardAreaH - padding * 2;
      const imgRatio = img.width / img.height;
      const areaRatio = maxW / maxH;

      let drawW: number, drawH: number;
      if (imgRatio > areaRatio) {
        drawW = maxW;
        drawH = maxW / imgRatio;
      } else {
        drawH = maxH;
        drawW = maxH * imgRatio;
      }

      const drawX = cardAreaX + (cardAreaW - drawW) / 2;
      const drawY = cardAreaY + (cardAreaH - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } catch {
      // Show placeholder if image fails
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(cardAreaX + 10, cardAreaY + 10, cardAreaW - 20, cardAreaH - 20);
      ctx.fillStyle = "#999";
      ctx.font = "14px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Card Image", cardAreaX + cardAreaW / 2, cardAreaY + cardAreaH / 2);
    }

    // === PLASTIC SHINE EFFECTS ===
    // Top-left shine
    const shine1 = ctx.createLinearGradient(0, 0, W * 0.6, H * 0.4);
    shine1.addColorStop(0, "rgba(255,255,255,0.18)");
    shine1.addColorStop(0.3, "rgba(255,255,255,0.06)");
    shine1.addColorStop(1, "rgba(255,255,255,0)");
    drawRoundedRect(ctx, 0, 0, W, H, 20);
    ctx.fillStyle = shine1;
    ctx.fill();

    // Edge highlight (top)
    const topShine = ctx.createLinearGradient(0, 0, 0, 40);
    topShine.addColorStop(0, "rgba(255,255,255,0.25)");
    topShine.addColorStop(1, "rgba(255,255,255,0)");
    drawRoundedRect(ctx, 2, 2, W - 4, 40, 18);
    ctx.fillStyle = topShine;
    ctx.fill();

    // Diagonal reflection line
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.beginPath();
    ctx.moveTo(W * 0.3, 0);
    ctx.lineTo(W * 0.35, 0);
    ctx.lineTo(0, H * 0.5);
    ctx.lineTo(0, H * 0.45);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.restore();

    // Bottom case info
    ctx.font = "9px Arial, sans-serif";
    ctx.fillStyle = "#999";
    ctx.textAlign = "center";
    ctx.fillText("psacard.com", W / 2, H - 10);

    // Export
    const url = canvas.toDataURL("image/png", 1.0);
    setDataUrl(url);
    onImageGenerated?.(url);
    setLoading(false);
  }, [cardName, year, grade, certNumber, cardImageUrl, category, variety, onImageGenerated]);

  useEffect(() => {
    setLoading(true);
    render();
  }, [render]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `PSA-${grade}-${certNumber}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="max-w-[300px] w-full h-auto rounded-xl"
          style={{ imageRendering: "auto" }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-900/50 rounded-xl">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      {dataUrl && (
        <Button
          onClick={handleDownload}
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download Slab Image
        </Button>
      )}
    </div>
  );
}
