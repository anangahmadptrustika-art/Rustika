import { useEffect, useState } from "react";
import api, { formatRupiah } from "../lib/api";
import { X, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function AddTransactionDialog({ open, onClose, onSuccess, initial = null }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [walletId, setWalletId] = useState("");
  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [wallets, setWallets] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
    api.get("/wallets").then((r) => setWallets(r.data)).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (initial) {
      setType(initial.type);
      setAmount(String(initial.amount));
      setCategory(initial.category);
      setDescription(initial.description || "");
      setDate(initial.date);
      setWalletId(initial.wallet_id || "");
    } else {
      setType("expense");
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(new Date().toISOString().slice(0, 10));
      setWalletId("");
    }
  }, [initial, open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Masukkan jumlah yang valid");
      return;
    }
    if (!category) {
      toast.error("Pilih kategori");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { type, amount: amt, category, description, date, wallet_id: walletId || null };
      if (initial?.id) {
        await api.put(`/transactions/${initial.id}`, payload);
        toast.success("Transaksi diperbarui");
      } else {
        await api.post("/transactions", payload);
        toast.success("Transaksi ditambahkan");
      }
      onSuccess?.();
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const cats = type === "income" ? categories.income : categories.expense;
  const selectedWallet = wallets.find((w) => w.id === walletId);

  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center bg-[#0F172A]/50 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="add-transaction-dialog"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-[#E5E9F0] w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="eyebrow">{initial ? "Edit" : "Baru"}</div>
            <h3 className="font-display text-2xl font-bold text-[#0F172A] mt-1">
              {initial ? "Edit Transaksi" : "Tambah Transaksi"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#EDF2F7] text-[#5C677D]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-[#EDF2F7] rounded-xl mb-5">
          <button
            type="button"
            onClick={() => { setType("expense"); setCategory(""); }}
            data-testid="type-expense-btn"
            className={`py-2.5 rounded-lg text-sm font-semibold transition ${type === "expense" ? "bg-white text-[#EE4B5C] shadow-sm" : "text-[#5C677D]"}`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => { setType("income"); setCategory(""); }}
            data-testid="type-income-btn"
            className={`py-2.5 rounded-lg text-sm font-semibold transition ${type === "income" ? "bg-white text-[#21BE7C] shadow-sm" : "text-[#5C677D]"}`}
          >
            Pemasukan
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="eyebrow block mb-2">Jumlah (Rp)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              data-testid="tx-amount-input"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F7FA] border border-[#E5E9F0] focus:border-[#118EEA] outline-none tabular text-lg font-semibold"
              required
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="tx-category-select"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F7FA] border border-[#E5E9F0] focus:border-[#118EEA] outline-none"
              required
            >
              <option value="">Pilih kategori</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="eyebrow block mb-2">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="tx-date-input"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F7FA] border border-[#E5E9F0] focus:border-[#118EEA] outline-none"
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">Catatan (Opsional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mis. Makan siang di kantor"
              data-testid="tx-description-input"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F7FA] border border-[#E5E9F0] focus:border-[#118EEA] outline-none"
            />
          </div>

          <div>
            <label className="eyebrow block mb-2 flex items-center gap-1.5">
              <Wallet className="w-3 h-3" /> Dompet Sumber {wallets.length > 0 ? "(Opsional)" : ""}
            </label>
            {wallets.length === 0 ? (
              <div className="px-4 py-3 rounded-xl bg-[#F5F7FA] border border-dashed border-[#E5E9F0] text-xs text-[#5C677D]">
                Belum ada dompet. Tambahkan di tab Dompet untuk auto-update saldo.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalletId("")}
                    data-testid="wallet-pick-none"
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition ${
                      walletId === ""
                        ? "border-[#118EEA] bg-[#118EEA]/10 text-[#118EEA]"
                        : "border-[#E5E9F0] text-[#5C677D] hover:border-[#118EEA]"
                    }`}
                  >
                    Tanpa dompet
                  </button>
                  {wallets.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWalletId(w.id)}
                      data-testid={`wallet-pick-${w.id}`}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                        walletId === w.id
                          ? "border-[#118EEA] bg-[#118EEA]/10 text-[#118EEA]"
                          : "border-[#E5E9F0] text-[#0F172A] hover:border-[#118EEA]"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: w.color }} />
                      <span className="truncate">{w.name}</span>
                    </button>
                  ))}
                </div>
                {selectedWallet && (
                  <div className="mt-2 text-[11px] text-[#5C677D]" data-testid="wallet-pick-balance">
                    Saldo {selectedWallet.name}: {formatRupiah(selectedWallet.balance)}
                    {type === "expense" && amount && parseFloat(amount) > selectedWallet.balance && (
                      <span className="text-[#EE4B5C] font-semibold ml-1">⚠ Saldo tidak cukup</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            data-testid="tx-submit-button"
            className="w-full h-12 rounded-xl bg-[#118EEA] text-white font-semibold hover:bg-[#0E7BC9] active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? "Simpan Perubahan" : "Tambah"}
          </button>
        </div>
      </form>
    </div>
  );
}
