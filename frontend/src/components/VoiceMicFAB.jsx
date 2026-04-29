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
    }
    if (!open) {
      stop();
      reset();
      setParsed(null);
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
        <span className="relative grid place-items-center w-14 h-14 rounded-full bg-[#D99B58] text-white shadow-xl active:scale-95 transition-transform duration-200">
          <Mic className="w-6 h-6" strokeWidth={1.8} />
          <span className="absolute inset-0 rounded-full bg-[#D99B58]/40 mic-pulse-ring" />
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="absolute inset-0 z-50 grid place-items-center bg-[#1E3F32]/50 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
          data-testid="voice-modal"
        >
          <div
            className="bg-white rounded-3xl border border-[#E5E2DC] w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="eyebrow">Perintah Suara</div>
                <h3 className="font-display text-2xl font-bold text-[#1E3F32] mt-1">
                  {listening ? "Mendengarkan..." : parsed ? "Konfirmasi" : "Bicara sekarang"}
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#F0EDE5] text-[#697A6E]"
                data-testid="voice-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mic Animation Area */}
            <div className="relative grid place-items-center my-6 h-32">
              {listening && (
                <>
                  <span className="absolute w-24 h-24 rounded-full bg-[#C86753]/30 mic-pulse-ring" />
                  <span className="absolute w-24 h-24 rounded-full bg-[#C86753]/30 mic-pulse-ring-2" />
                </>
              )}
              <button
                onClick={listening ? stop : start}
                data-testid="voice-toggle"
                className={`relative w-24 h-24 rounded-full grid place-items-center transition-colors ${
                  listening
                    ? "bg-[#C86753] text-white"
                    : "bg-[#D99B58] text-white"
                }`}
              >
                {listening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
              </button>
            </div>

            {/* Transcript */}
            <div className="mb-4">
              <div className="eyebrow mb-2">Anda mengatakan</div>
              <div
                className="min-h-[60px] p-4 rounded-xl bg-[#F7F5F0] border border-[#E5E2DC] text-[#1E3F32] italic"
                data-testid="voice-transcript"
              >
                {transcript || (listening ? "..." : "Tekan mikrofon dan bicara")}
              </div>
            </div>

            {/* Parsed Result */}
            {parsing && (
              <div className="flex items-center gap-2 text-[#697A6E]">
                <Loader2 className="w-4 h-4 animate-spin" /> Mengurai perintah...
              </div>
            )}
            {parsed && !parsing && (
              <div className="space-y-3 fade-up" data-testid="voice-parsed">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0EDE5]">
                  <span className="eyebrow">Tipe</span>
                  <span className={`text-sm font-bold uppercase ${parsed.type === "income" ? "text-[#5F8575]" : "text-[#C86753]"}`}>
                    {parsed.type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0EDE5]">
                  <span className="eyebrow">Jumlah</span>
                  <span className="font-display text-xl font-bold text-[#1E3F32] tabular">
                    {parsed.amount ? formatRupiah(parsed.amount) : "Tidak dikenali"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F0EDE5]">
                  <span className="eyebrow">Kategori</span>
                  <span className="text-sm font-semibold text-[#1E3F32]">{parsed.category}</span>
                </div>
                {parsed.description && (
                  <div className="p-3 rounded-xl bg-[#F0EDE5]">
                    <div className="eyebrow mb-1">Catatan</div>
                    <div className="text-sm text-[#1E3F32]">{parsed.description}</div>
                  </div>
                )}
                <button
                  onClick={handleConfirm}
                  disabled={!parsed.amount || submitting}
                  data-testid="voice-confirm"
                  className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#2C3D30] text-white font-semibold hover:bg-[#3A5240] disabled:opacity-50 active:scale-95 transition"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Simpan Transaksi
                </button>
              </div>
            )}

            <div className="mt-5 text-xs text-[#8A9A86] leading-relaxed">
              Contoh: <em>"Catat pengeluaran 50 ribu untuk makan siang"</em> atau <em>"Pemasukan gaji 5 juta"</em>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
