import { useEffect, useState } from "react";
import usePwaInstall from "../hooks/usePwaInstall";
import { Download, X } from "lucide-react";

export default function InstallBanner() {
  const { canInstall, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("sakuku_install_dismissed") === "1"; } catch { return false; }
  });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (canInstall && !dismissed) {
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
    setShow(false);
  }, [canInstall, dismissed]);

  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem("sakuku_install_dismissed", "1"); } catch {}
    setDismissed(true);
    setShow(false);
  };

  const onInstall = async () => {
    const ok = await install();
    if (ok) setShow(false);
  };

  return (
    <div
      className="absolute top-3 left-3 right-3 z-30 bg-[#0F172A] text-white rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 fade-up"
      data-testid="install-banner"
    >
      <div className="w-10 h-10 rounded-xl bg-[#FF8A00] grid place-items-center shrink-0">
        <Download className="w-5 h-5 text-white" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold leading-tight">Pasang Sakuku</div>
        <div className="text-[11px] text-white/70">Akses cepat seperti aplikasi asli.</div>
      </div>
      <button
        onClick={onInstall}
        data-testid="install-confirm"
        className="px-3 h-9 rounded-lg bg-[#FF8A00] text-white text-xs font-bold hover:opacity-90 active:scale-95"
      >
        Pasang
      </button>
      <button
        onClick={dismiss}
        data-testid="install-dismiss"
        className="w-8 h-8 rounded-lg text-white/60 hover:text-white grid place-items-center"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
