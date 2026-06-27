"use client";

import { QRCodeSVG } from "qrcode.react";
import { getPulseUrl } from "@/lib/pulseUtils";

interface PulseQRCodeProps {
  url?: string;
  size?: number;
  className?: string;
}

export function PulseQRCode({
  url,
  size = 160,
  className,
}: PulseQRCodeProps) {
  const pulseUrl = url ?? getPulseUrl();

  return (
    <div
      className={`inline-flex flex-col items-center gap-3 ${className ?? ""}`}
    >
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-sm">
        <QRCodeSVG
          value={pulseUrl}
          size={size}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#171717"
        />
      </div>
      <p className="text-xs text-neutral-500 text-center max-w-[200px] break-all">
        {pulseUrl}
      </p>
    </div>
  );
}
