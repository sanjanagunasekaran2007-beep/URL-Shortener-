import { useState, useEffect, FormEvent } from "react";
import { ShortLink } from "./types";
import QRCodeModal from "./components/QRCodeModal";
import LinkHistoryList from "./components/LinkHistoryList";
import { Link2, Sparkles, Copy, Check, ArrowRight, RefreshCw, AlertCircle, Info, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Input fields
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showAlias, setShowAlias] = useState(false);

  // Statuses
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<ShortLink | null>(null);

  // Redirection notification
  const [redirectError, setRedirectError] = useState<string | null>(null);

  // History & Analytics
  const [history, setHistory] = useState<ShortLink[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // QR Modal controller
  const [activeQR, setActiveQR] = useState<{ shortUrl: string; shortCode: string } | null>(null);

  // Clipboard feedbacks
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);

  // Fetch past shortened links
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Check URL parameters for redirect errors (HTTP 404 from server.ts redirection logic)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam === "not_found") {
      setRedirectError("The short link you visited was not found in our system or might have expired. Feel free to shorten a new one below!");
      // Clean query parameter from browser address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam === "server_error") {
      setRedirectError("We encountered a server error while redirecting your link. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Load initial history
    fetchHistory();
  }, []);

  // Handle Copy to Clipboard for newly shortened link
  const handleCopyNew = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Handle Copy to Clipboard for history links
  const handleCopyHistory = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHistoryId(id);
      setTimeout(() => setCopiedHistoryId(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Shorten submission handler
  const handleShorten = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessLink(null);

    if (!originalUrl.trim()) {
      setError("Please paste or type a destination URL first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalUrl: originalUrl.trim(),
          customAlias: showAlias ? customAlias.trim() : "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSuccessLink(data);
      // Reset input fields
      setOriginalUrl("");
      setCustomAlias("");
      setShowAlias(false);

      // Refresh list to display the newly shortened link
      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      {/* Top Banner / Navbar */}
      <nav className="flex items-center justify-between px-6 sm:px-8 py-4 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Link2 className="w-4.5 h-4.5 rotate-45" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            LinkSnap
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#dashboard" className="text-blue-600 font-semibold">Dashboard</a>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
            v1.0 Demo
          </span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Full-width Hero Banner section (Vibrant Palette style) */}
        <section className="px-6 sm:px-8 py-12 sm:py-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white relative overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl -z-10" />

          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Not Found Redirect Notice inside the Hero wrapper */}
            <AnimatePresence>
              {redirectError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-100 rounded-2xl flex items-start gap-3 shadow-md text-left mb-4"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-300 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">Shortlink Redirection Alert</h4>
                    <p className="text-xs text-amber-100/90 mt-1 leading-relaxed">{redirectError}</p>
                  </div>
                  <button
                    onClick={() => setRedirectError(null)}
                    className="text-xs text-amber-300 hover:text-white font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-blue-100">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Simplest, fastest URL redirection manager</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-white font-display">
                Shorten your links in seconds.
              </h1>
              <p className="text-blue-100 text-base sm:text-lg max-w-lg mx-auto opacity-90">
                Paste your long URL and get a snappy, shareable link instantly.
              </p>
            </div>

            {/* Compact form input inside the Hero (faithful to vibrant theme container) */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-5 sm:p-6 text-left shadow-2xl max-w-2xl mx-auto">
              <form onSubmit={handleShorten} className="space-y-4">
                <div>
                  <label htmlFor="originalUrl" className="block text-xs font-semibold uppercase tracking-wider text-blue-200 mb-2">
                    Paste your long URL
                  </label>
                  <div className="relative">
                    <input
                      id="originalUrl"
                      type="text"
                      placeholder="https://example.com/very-long-link-path-parameters..."
                      value={originalUrl}
                      onChange={(e) => setOriginalUrl(e.target.value)}
                      className="w-full pl-5 pr-5 py-3.5 bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl text-sm focus:outline-hidden focus:ring-4 focus:ring-white/20 transition-all font-sans shadow-md"
                    />
                  </div>
                </div>

                {/* Custom Alias Option */}
                <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAlias(!showAlias);
                      if (showAlias) setCustomAlias("");
                    }}
                    className="text-xs font-bold text-blue-200 hover:text-white flex items-center gap-1.5 cursor-pointer self-start transition-colors"
                  >
                    <span>{showAlias ? "− Remove custom alias" : "+ Set a custom alias"}</span>
                  </button>

                  <AnimatePresence>
                    {showAlias && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 space-y-2">
                          <label htmlFor="customAlias" className="block text-xs font-semibold uppercase tracking-wider text-blue-200">
                            Custom Slug Alias (Optional)
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-blue-100 bg-white/10 px-3 py-3 border border-white/10 rounded-xl select-none shrink-0">
                              linksnap.app/
                            </span>
                            <input
                              id="customAlias"
                              type="text"
                              placeholder="my-project"
                              value={customAlias}
                              onChange={(e) => setCustomAlias(e.target.value)}
                              className="flex-1 px-4 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-300 transition-all font-mono"
                            />
                          </div>
                          <p className="text-[11px] text-blue-200/80 leading-normal">
                            Only letters, numbers, hyphens, and underscores are allowed. (e.g. <code>my-profile</code>)
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Validation and errors */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="p-3 bg-rose-500/20 border border-rose-400/30 text-rose-100 text-xs rounded-xl flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-300 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-blue-50 disabled:bg-blue-200/80 text-blue-700 font-extrabold rounded-2xl text-sm transition-all shadow-lg hover:shadow-xl cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin text-blue-600" />
                      Creating Shortlink...
                    </>
                  ) : (
                    <>
                      Shorten URL Now
                      <ArrowRight className="w-4 h-4 text-blue-700" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Success box in the Hero (faithful to the layout pattern of the design HTML) */}
            <AnimatePresence>
              {successLink && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="mt-6 p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-left max-w-2xl mx-auto"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="p-2.5 bg-white/20 rounded-xl text-blue-200">
                      <Link2 className="w-5 h-5 rotate-45" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-blue-200 uppercase font-extrabold tracking-wider">Your Snappy Link</p>
                      <span className="font-mono font-bold text-lg text-white break-all select-all">
                        {successLink.shortUrl.replace(/^https?:\/\//, "")}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleCopyNew(successLink.shortUrl)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        copiedSuccess
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-indigo-700 hover:bg-blue-50"
                      }`}
                    >
                      {copiedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy URL
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveQR({ shortUrl: successLink.shortUrl, shortCode: successLink.id })}
                      className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors cursor-pointer"
                      title="View QR Code"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Dashboard Analytics & History list below */}
        <section id="dashboard" className="flex-1 p-6 sm:p-8 bg-slate-50 max-w-5xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 items-start">
            
            {/* List side */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Dashboard & Metrics</span>
                <button
                  onClick={fetchHistory}
                  disabled={loadingHistory}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
                  <span>Refresh History</span>
                </button>
              </div>

              <LinkHistoryList
                links={history}
                onShowQR={(url, code) => setActiveQR({ shortUrl: url, shortCode: code })}
                onCopy={handleCopyHistory}
                copiedId={copiedHistoryId}
              />
            </div>

            {/* Sidebar with Viva student guide */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Info className="w-4.5 h-4.5 text-blue-600" />
                  Student Viva Guide
                </h3>

                <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">1. How Redirection Works</h4>
                    <p>
                      When a shortened URL (e.g. <code>/aB3xY9</code>) is requested, the Node/Express server intercepts it. It queries the Firestore database using the code as the document key.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">2. Click Analytics Tracker</h4>
                    <p>
                      Right before issuing the HTTP 302 redirect header, the server increments the click counter atomically inside Firestore using <code>increment(1)</code>, preventing dirty writes.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">3. Custom Slugs (Aliases)</h4>
                    <p>
                      Allows specific keywords. The server checks Firestore if the custom alias is already reserved to prevent collisions.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400">Database: Cloud Firestore</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-semibold font-mono text-[10px]">FULL-STACK</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 sm:px-8 py-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 mt-16">
        <span className="text-xs text-slate-400">© 2026 LinkSnap — Project Demo for Web Dev Viva</span>
        <div className="flex gap-4">
          <span className="text-xs text-slate-400">Status: <span className="text-emerald-500 font-bold">● Online</span></span>
          <span className="text-xs text-slate-400">Server: <span className="text-slate-600 font-medium">Firestore DB</span></span>
        </div>
      </footer>

      {/* QR Code display Modal */}
      <QRCodeModal
        isOpen={activeQR !== null}
        onClose={() => setActiveQR(null)}
        shortUrl={activeQR?.shortUrl || ""}
        shortCode={activeQR?.shortCode || ""}
      />
    </div>
  );
}
