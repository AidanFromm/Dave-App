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
  cardNumber?: string;
  onImageGenerated?: (dataUrl: string) => void;
}

function getGradeText(grade: string): string {
  const g = parseInt(grade, 10);
  if (g === 10) return "GEM MT";
  if (g === 9) return "MINT";
  if (g === 8) return "NM-MT";
  if (g === 7) return "NM";
  if (g === 6) return "EX-MT";
  if (g === 5) return "EX";
  return grade;
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
  cardNumber,
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

    const W = 600;
    const H = 880;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    // === OUTER SLAB SHELL ===
    // Drop shadow
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;

    // Outer case — light gray, big rounded corners
    drawRoundedRect(ctx, 0, 0, W, H, 28);
    ctx.fillStyle = "#e8e8e8";
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Outer border
    drawRoundedRect(ctx, 0, 0, W, H, 28);
    ctx.strokeStyle = "#c0c0c0";
    ctx.lineWidth = 2;
    ctx.stroke();

    // === TOP LABEL AREA (white background with red border) ===
    const labelX = 32;
    const labelY = 24;
    const labelW = W - 64;
    const labelH = 100;

    // White label background
    drawRoundedRect(ctx, labelX, labelY, labelW, labelH, 6);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    // Red border around label
    drawRoundedRect(ctx, labelX, labelY, labelW, labelH, 6);
    ctx.strokeStyle = "#D42027";
    ctx.lineWidth = 3;
    ctx.stroke();

    // === LABEL CONTENT ===
    const isFirstEdition = variety?.toUpperCase().includes("1ST EDITION");
    const displayName = cardName.length > 30 ? cardName.substring(0, 27) + "..." : cardName;

    // Left side — card name / year / set info
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Line 1: "1ST EDITION" or year + category
    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillStyle = "#000000";
    if (isFirstEdition) {
      ctx.fillText("1ST EDITION", labelX + 14, labelY + 14);
    } else {
      const yearLine = [year, category].filter(Boolean).join(" ");
      ctx.fillText(yearLine.toUpperCase(), labelX + 14, labelY + 14);
    }

    // Line 2: Card name
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.fillStyle = "#333333";
    ctx.fillText(displayName.toUpperCase(), labelX + 14, labelY + 34);

    // Line 3: Variety/set (smaller)
    if (variety) {
      ctx.font = "11px Arial, sans-serif";
      ctx.fillStyle = "#666666";
      const displayVariety = variety.length > 35 ? variety.substring(0, 32) + "..." : variety;
      ctx.fillText(displayVariety.toUpperCase(), labelX + 14, labelY + 52);
    }

    // Barcode (left bottom of label)
    const barcodeX = labelX + 14;
    const barcodeY = labelY + 70;
    const barcodeW = 100;
    const barcodeH = 18;

    // Draw barcode lines from cert number
    const barcodeData = certNumber.padEnd(16, "0");
    const barUnitW = barcodeW / (barcodeData.length * 2.5);
    ctx.fillStyle = "#000000";
    for (let i = 0; i < barcodeData.length * 2.5; i++) {
      const charCode = barcodeData.charCodeAt(Math.floor(i % barcodeData.length));
      if ((charCode + i) % 2 !== 0) {
        ctx.fillRect(barcodeX + i * barUnitW, barcodeY, barUnitW * 0.6, barcodeH);
      }
    }

    // === PSA LOGO (center of label) ===
    const logoX = labelX + labelW / 2 - 20;
    const logoY = labelY + 68;

    // PSA text logo
    ctx.textAlign = "center";
    ctx.font = "bold italic 22px 'Arial Black', Arial, sans-serif";
    ctx.fillStyle = "#D42027";
    ctx.fillText("P", logoX, logoY);
    ctx.fillStyle = "#1a56a0";
    ctx.fillText("S", logoX + 16, logoY);
    ctx.fillStyle = "#D42027";
    ctx.fillText("A", logoX + 33, logoY);

    // === RIGHT SIDE — Card number + Grade ===
    ctx.textAlign = "right";
    ctx.textBaseline = "top";

    // Card number
    if (cardNumber) {
      ctx.font = "bold 14px Arial, sans-serif";
      ctx.fillStyle = "#000000";
      ctx.fillText(`#${cardNumber}`, labelX + labelW - 14, labelY + 14);
    }

    // Grade text (e.g. "GEM MT")
    const gradeText = getGradeText(grade);
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillStyle = "#000000";
    ctx.fillText(gradeText, labelX + labelW - 14, labelY + 38);

    // Grade number (large)
    ctx.font = "bold 32px 'Arial Black', Arial, sans-serif";
    ctx.fillStyle = "#000000";
    ctx.fillText(grade, labelX + labelW - 14, labelY + 56);

    // === CARD IMAGE AREA ===
    const cardPadding = 40;
    const cardAreaX = cardPadding;
    const cardAreaY = labelY + labelH + 24;
    const cardAreaW = W - cardPadding * 2;
    const cardAreaH = H - cardAreaY - 32;

    // Outer dark border (the thick dark gray frame)
    const frameThick = 10;
    drawRoundedRect(ctx, cardAreaX, cardAreaY, cardAreaW, cardAreaH, 10);
    ctx.fillStyle = "#3a3a3a";
    ctx.fill();

    // Inner lighter border
    drawRoundedRect(
      ctx,
      cardAreaX + frameThick,
      cardAreaY + frameThick,
      cardAreaW - frameThick * 2,
      cardAreaH - frameThick * 2,
      6
    );
    ctx.fillStyle = "#e0e0e0";
    ctx.fill();

    // White card area
    const innerPad = frameThick + 6;
    drawRoundedRect(
      ctx,
      cardAreaX + innerPad,
      cardAreaY + innerPad,
      cardAreaW - innerPad * 2,
      cardAreaH - innerPad * 2,
      4
    );
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    // Inner thin dark border
    drawRoundedRect(
      ctx,
      cardAreaX + innerPad,
      cardAreaY + innerPad,
      cardAreaW - innerPad * 2,
      cardAreaH - innerPad * 2,
      4
    );
    ctx.strokeStyle = "#3a3a3a";
    ctx.lineWidth = 2;
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

      const imgPad = innerPad + 8;
      const maxW = cardAreaW - imgPad * 2;
      const maxH = cardAreaH - imgPad * 2;
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
      // Placeholder if image fails
      ctx.fillStyle = "#f5f5f5";
      const phPad = innerPad + 4;
      ctx.fillRect(
        cardAreaX + phPad,
        cardAreaY + phPad,
        cardAreaW - phPad * 2,
        cardAreaH - phPad * 2
      );
      ctx.fillStyle = "#999";
      ctx.font = "14px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "Card Image",
        cardAreaX + cardAreaW / 2,
        cardAreaY + cardAreaH / 2
      );
    }

    // === SUBTLE PLASTIC SHINE ===
    const shine = ctx.createLinearGradient(0, 0, W * 0.5, H * 0.3);
    shine.addColorStop(0, "rgba(255,255,255,0.12)");
    shine.addColorStop(0.4, "rgba(255,255,255,0.03)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    drawRoundedRect(ctx, 0, 0, W, H, 28);
    ctx.fillStyle = shine;
    ctx.fill();

    // Export
    const url = canvas.toDataURL("image/png", 1.0);
    setDataUrl(url);
    onImageGenerated?.(url);
    setLoading(false);
  }, [cardName, year, grade, certNumber, cardImageUrl, category, variety, cardNumber, onImageGenerated]);

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
