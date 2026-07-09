import { useState } from "react";
import { ShortLink } from "../types";
import { Copy, Check, QrCode, ExternalLink, Calendar, TrendingUp, Search, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LinkHistoryListProps {
  links: ShortLink[];
  onShowQR: (shortUrl: string, shortCode: string) => void;
  onCopy: (shortUrl: string, id: string) => void;
  copiedId: string | null;
}

export default function LinkHistoryList({ links, onShowQR, onCopy, copiedId }: LinkHistoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLinks = links.filter(
    (link) =>
      link.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800">Your Analytics History</h2>
          <p className="text-sm text-slate-500 mt-1">Track click rates and scan QR codes for your shortlinks</p>
        </div>

        {links.length > 0 && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search links or aliases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 shadow-xs"
            />
          </div>
        )}
      </div>

      {/* Main List Area */}
      {links.length === 0 ? (
        // Initial Empty State
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center shadow-xs">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400 mb-4">
            <Info className="w-8 h-8" />
          </div>
          <h3 className="font-display font-semibold text-lg text-slate-700">No shortened links yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mt-1 leading-relaxed">
            Paste a long URL in the field above to generate your first shortcode and track analytics!
          </p>
        </div>
      ) : filteredLinks.length === 0 ? (
        // No Search Results State
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-xs">
          <p className="text-slate-500 text-sm">No results match your search term "{searchTerm}".</p>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : (
        // Bento-grid/Card Layout of History list
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredLinks.map((link) => (
              <motion.div
                key={link.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header with clicks & dates */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {formatDate(link.createdAt)}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-100 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Active
                    </span>
                  </div>

                  {/* Shortened Link Display */}
                  <div className="mb-2">
                    <span className="font-sans font-extrabold text-lg text-slate-900 hover:text-blue-600 transition-colors break-all">
                      {link.shortUrl.replace(/^https?:\/\//, "")}
                    </span>
                  </div>

                  {/* Truncated original destination link */}
                  <div className="mb-4">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                      Destination URL
                    </p>
                    <a
                      href={link.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-slate-500 hover:text-blue-600 flex items-center gap-1 break-all transition-all line-clamp-1"
                    >
                      {link.originalUrl}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                {/* Grid Analytics Tracker section with custom styling from design theme */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-xl font-black text-blue-600 font-sans">{link.clicks}</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Clicks</div>
                </div>

                {/* Quick actions bar */}
                <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-2">
                  <button
                    onClick={() => onCopy(link.shortUrl, link.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-semibold text-slate-600 transition-all border border-slate-100 hover:border-blue-100 cursor-pointer"
                  >
                    {copiedId === link.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onShowQR(link.shortUrl, link.id)}
                    className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl border border-slate-100 hover:border-blue-100 transition-all cursor-pointer"
                    title="Generate QR code"
                  >
                    <QrCode className="w-4.5 h-4.5" />
                  </button>

                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl border border-slate-100 hover:border-blue-100 transition-all cursor-pointer"
                    title="Visit link"
                  >
                    <ExternalLink className="w-4.5 h-4.5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
