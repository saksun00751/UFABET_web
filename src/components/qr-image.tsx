"use client";
import * as React from "react";
import QRCode from "qrcode";

export function QrImage({ text, src, size = 220 }: { text?: string; src?: string; size?: number }) {
  const [url, setUrl] = React.useState<string | null>(src ?? null);
  React.useEffect(() => {
    if (src) return setUrl(src);
    if (!text) return setUrl(null);
    QRCode.toDataURL(text, { width: size * 2, margin: 1 }).then(setUrl).catch(() => setUrl(null));
  }, [text, src, size]);
  if (!url) return null;
  return (
    <span className="inline-flex rounded-3xl bg-white p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="QR สำหรับชำระเงิน" width={size} height={size} />
    </span>
  );
}
