import { useEffect, useState } from "react";
import api from "../lib/api";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AddTransactionDialog({ open, onClose, onSuccess, initial = null }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (initial) {
      setType(initial.type);
      setAmount(String(initial.amount));
      setCategory(initial.category);
      setDescription(initial.description || "");
      setDate(initial.date);
    } else {
      setType("expense");
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(new Date().toISOString().slice(0, 10));
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
      const payload = { type, amount: amt, category, description, date };
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

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#1E3F32]/40 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="add-transaction-dialog"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-[#E5E2DC] w-full max-w-md p-7 shadow-2xl"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="eyebrow">{initial ? "Edit" : "Baru"}</div>
            <h3 className="font-display text-2xl font-bold text-[#1E3F32] mt-1">
              {initial ? "Edit Transaksi" : "Tambah Transaksi"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F0EDE5] text-[#697A6E]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-[#F0EDE5] rounded-xl mb-5">
          <button
            type="button"
            onClick={() => { setType("expense"); setCategory(""); }}
            data-testid="type-expense-btn"
            className={`py-2.5 rounded-lg text-sm font-semibold transition ${type === "expense" ? "bg-white text-[#C86753] shadow-sm" : "text-[#697A6E]"}`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => { setType("income"); setCategory(""); }}
            data-testid="type-income-btn"
            className={`py-2.5 rounded-lg text-sm font-semibold transition ${type === "income" ? "bg-white text-[#5F8575] shadow-sm" : "text-[#697A6E]"}`}
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
              className="w-full h-12 px-4 rounded-xl bg-[#F7F5F0] border border-[#E5E2DC] focus:border-[#2C3D30] outline-none tabular text-lg font-semibold"
              required
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="tx-category-select"
              className="w-full h-12 px-4 rounded-xl bg-[#F7F5F0] border border-[#E5E2DC] focus:border-[#2C3D30] outline-none"
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
              className="w-full h-12 px-4 rounded-xl bg-[#F7F5F0] border border-[#E5E2DC] focus:border-[#2C3D30] outline-none"
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
              className="w-full h-12 px-4 rounded-xl bg-[#F7F5F0] border border-[#E5E2DC] focus:border-[#2C3D30] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            data-testid="tx-submit-button"
            className="w-full h-12 rounded-xl bg-[#2C3D30] text-white font-semibold hover:bg-[#3A5240] active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? "Simpan Perubahan" : "Tambah"}
          </button>
        </div>
      </form>
    </div>
  );
}
