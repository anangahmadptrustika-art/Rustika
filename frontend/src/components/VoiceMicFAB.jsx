import { useEffect, useState } from "react";
import useVoiceCommand from "../hooks/useVoiceCommand";
import api, { formatRupiah } from "../lib/api";
import { Mic, MicOff, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VoiceMicFAB({ onTransactionAdded }) {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [walletId, setWalletId] = useState("");

  const { supported, listening, transcript, start, stop, reset } = useVoiceCommand({
    lang: "id-ID",
    onFinal: async (finalText) => {
      setParsing(true);
      try {
        const { data } = await api.post("/voice/parse", { text: finalText });
        setParsed(data);
      } catch (e) {
        toast.error("Gagal mengurai perintah suara");
      } finally {
        setParsing(false);
      }
    },
  });

  useEffect(() => {
    if (open && supported && !listening && !transcript) {
      start();
      api.get("/wallets").then((r) => {
        setWallets(r.data);
        if (r.data.length > 0) setWalletId(r.data[0].id); // default first wallet
      }).catch(() => {});
    }
    if (!open) {
      stop();
      reset();
      setParsed(null);
      setWalletId("");
    }
    // eslint-disable-next-line
  }, [open]);

  const handleConfirm = async () => {
    if (!parsed?.amount) {
      toast.error("Jumlah tidak dapat dikenali. Coba lagi.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/transactions", {
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description || transcript,
        wallet_id: walletId || null,
      });
      toast.success("Transaksi ditambahkan via suara!");
      onTransactionAdded?.();
      setOpen(false);
    } catch (e) {
      toast.error("Gagal menyimpan transaksi");
    } finally {
      setSubmitting(false);
    }
  };

  if (!supported) return null;

  return (
    <>
      {/* Floating Mic Button - inside mobile frame */}
      <button
        onClick={() => setOpen(true)}
        data-testid="voice-mic-button"
        className="absolute bottom-24 right-5 z-40"
        aria-label="Tambah transaksi via suara"
      >
        <span className="relative grid place-items-center w-14 h-14 rounded-full bg-[#FF8A00] text-white shadow-xl active:scale-95 transition-transform duration-200">
          <Mic className="w-6 h-6" strokeWidth={1.8} />
          <span className="absolute inset-0 rounded-full bg-[#FF8A00]/40 mic-pulse-ring" />
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="absolute inset-0 z-50 grid place-items-center bg-[#0F172A]/50 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
          data-testid="voice-modal"
        >
          <div
            className="bg-white rounded-3xl border border-[#E5E9F0] w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="eyebrow">Perintah Suara</div>
                <h3 className="font-display text-2xl font-bold text-[#0F172A] mt-1">
                  {listening ? "Mendengarkan..." : parsed ? "Konfirmasi" : "Bicara sekarang"}
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#EDF2F7] text-[#5C677D]"
                data-testid="voice-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mic Animation Area */}
            <div className="relative grid place-items-center my-6 h-32">
              {listening && (
                <>
                  <span className="absolute w-24 h-24 rounded-full bg-[#EE4B5C]/30 mic-pulse-ring" />
                  <span className="absolute w-24 h-24 rounded-full bg-[#EE4B5C]/30 mic-pulse-ring-2" />
                </>
              )}
              <button
                onClick={listening ? stop : start}
                data-testid="voice-toggle"
                className={`relative w-24 h-24 rounded-full grid place-items-center transition-colors ${
                  listening
                    ? "bg-[#EE4B5C] text-white"
                    : "bg-[#FF8A00] text-white"
                }`}
              >
                {listening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
              </button>
            </div>

            {/* Transcript */}
            <div className="mb-4">
              <div className="eyebrow mb-2">Anda mengatakan</div>
              <div
                className="min-h-[60px] p-4 rounded-xl bg-[#F5F7FA] border border-[#E5E9F0] text-[#0F172A] italic"
                data-testid="voice-transcript"
              >
                {transcript || (listening ? "..." : "Tekan mikrofon dan bicara")}
              </div>
            </div>

            {/* Parsed Result */}
            {parsing && (
              <div className="flex items-center gap-2 text-[#5C677D]">
                <Loader2 className="w-4 h-4 animate-spin" /> Mengurai perintah...
              </div>
            )}
            {parsed && !parsing && (
              <div className="space-y-3 fade-up" data-testid="voice-parsed">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#EDF2F7]">
                  <span className="eyebrow">Tipe</span>
                  <span className={`text-sm font-bold uppercase ${parsed.type === "income" ? "text-[#21BE7C]" : "text-[#EE4B5C]"}`}>
                    {parsed.type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#EDF2F7]">
                  <span className="eyebrow">Jumlah</span>
                  <span className="font-display text-xl font-bold text-[#0F172A] tabular">
                    {parsed.amount ? formatRupiah(parsed.amount) : "Tidak dikenali"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#EDF2F7]">
                  <span className="eyebrow">Kategori</span>
                  <span className="text-sm font-semibold text-[#0F172A]">{parsed.category}</span>
                </div>
                {parsed.description && (
                  <div className="p-3 rounded-xl bg-[#EDF2F7]">
                    <div className="eyebrow mb-1">Catatan</div>
                    <div className="text-sm text-[#0F172A]">{parsed.description}</div>
                  </div>
                )}
                {wallets.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#EDF2F7]" data-testid="voice-wallet-picker">
                    <div className="eyebrow mb-2">Dompet Sumber</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWalletId("")}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                          walletId === "" ? "border-[#118EEA] bg-white text-[#118EEA]" : "border-transparent bg-white/50 text-[#5C677D]"
                        }`}
                      >
                        Tanpa
                      </button>
                      {wallets.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setWalletId(w.id)}
                          data-testid={`voice-wallet-${w.id}`}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                            walletId === w.id ? "border-[#118EEA] bg-white text-[#118EEA]" : "border-transparent bg-white/50 text-[#0F172A]"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: w.color }} />
                          <span className="truncate">{w.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleConfirm}
                  disabled={!parsed.amount || submitting}
                  data-testid="voice-confirm"
                  className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#118EEA] text-white font-semibold hover:bg-[#0E7BC9] disabled:opacity-50 active:scale-95 transition"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Simpan Transaksi
                </button>
              </div>
            )}

            <div className="mt-5 text-xs text-[#9AA5B8] leading-relaxed">
              Contoh: <em>"Catat pengeluaran 50 ribu untuk makan siang"</em> atau <em>"Pemasukan gaji 5 juta"</em>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
