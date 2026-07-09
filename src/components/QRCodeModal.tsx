import { QRCodeSVG } from "qrcode.react";
import { X, Download, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortUrl: string;
  shortCode: string;
}

export default function QRCodeModal({ isOpen, onClose, shortUrl, shortCode }: QRCodeModalProps) {
  if (!isOpen) return null;

  const downloadQR = () => {
    const svg = document.getElementById("linksnap-qr") as any;
    if (!svg) return;

    // Convert SVG to Canvas for PNG download
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const svgSize = svg.getBoundingClientRect();
    canvas.width = 512;
    canvas.height = 512;

    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 32, 32, 448, 448);
        const pngFile = canvas.toDataURL("image/png");
        
        const downloadLink = document.createElement("a");
        downloadLink.download = `qr-linksnap-${shortCode}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-sm overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="font-display font-semibold text-lg text-slate-800">Scan QR Code</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col items-center p-6 text-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner mb-4">
              <QRCodeSVG
                id="linksnap-qr"
                value={shortUrl}
                size={200}
                level="H"
                includeMargin={true}
                className="w-48 h-48 rounded-lg"
              />
            </div>

            <p className="font-mono text-xs font-semibold text-indigo-600 mb-1">
              /{shortCode}
            </p>
            <p className="text-sm text-slate-500 max-w-[240px] leading-relaxed mb-6">
              Scan this code on your mobile device to open the shortened URL instantly.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={downloadQR}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-indigo-200 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
