import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Real, scannable QR code encoding the customer's member code. */
export default function QrPreview({ seed, size = 220 }: { seed: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(`DONZANAHORIO:${seed}`, {
      width: size,
      margin: 1,
      color: { dark: "#1c1305", light: "#fdf6e3" },
    }).then((url) => {
      if (active) setDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [seed, size]);

  return (
    <div className="grid aspect-square w-full max-w-[10rem] place-items-center rounded-xl bg-carrot-50 p-3">
      {dataUrl ? (
        <img src={dataUrl} alt={`Código QR de cliente ${seed}`} className="h-full w-full" />
      ) : (
        <span className="text-xs text-ink-950/50">Generando QR...</span>
      )}
    </div>
  );
}
