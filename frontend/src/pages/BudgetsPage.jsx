import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api, { formatRupiah } from "../lib/api";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "../components/Sidebar";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetsPage() {
  const { refreshKey } = useOutletContext();
  const [budgets, setBudgets] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(currentMonth());
  const [openAdd, setOpenAdd] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const [b, s, c] = await Promise.all([
        api.get("/budgets", { params: { month } }),
        api.get("/stats/summary", { params: { month } }),
        api.get("/categories"),
      ]);
      setBudgets(b.data);
      setStats(s.data);
      setCategories(c.data.expense || []);
    } catch {}
  };

  useEffect(() => { load(); }, [month, refreshKey]);

  const submit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || !category) return;
    setSubmitting(true);
    try {
      await api.post("/budgets", { category, amount: amt, month });
      toast.success("Anggaran disimpan");
      setOpenAdd(false);
      setCategory("");
      setAmount("");
      load();
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Hapus anggaran ini?")) return;
    try { await api.delete(`/budgets/${id}`); load(); toast.success("Terhapus"); } catch { toast.error("Gagal"); }
  };

  const spentByCategory = (cat) => {
    const c = (stats?.by_category || []).find((x) => x.category === cat);
    return c?.amount || 0;
  };

  return (
    <div className="space-y-5">
      <TopBar
        subtitle="Kontrol"
        title="Anggaran"
        rightSlot={
          <button
            onClick={() => setOpenAdd(true)}
            data-testid="add-budget-btn"
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#2C3D30] text-white text-sm font-semibold hover:bg-[#3A5240] active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        }
      />

      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        data-testid="budget-month-picker"
        className="w-full h-11 px-4 rounded-xl bg-white border border-[#E5E2DC] focus:border-[#2C3D30] outline-none text-sm fade-up fade-up-1"
      />

      {budgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E2DC] p-12 text-center fade-up fade-up-1" data-testid="empty-budgets">
          <div className="font-display text-2xl text-[#1E3F32] font-semibold">Belum ada anggaran</div>
          <p className="text-[#697A6E] mt-2 max-w-md mx-auto">Buat anggaran per kategori untuk pantau pengeluaran setiap bulan.</p>
          <button
            onClick={() => setOpenAdd(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[#D99B58] text-white font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Buat anggaran pertama
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {budgets.map((b, i) => {
            const spent = spentByCategory(b.category);
            const pct = Math.min(100, Math.round((spent / b.amount) * 100));
            const over = spent > b.amount;
            return (
              <div key={b.id} className={`fade-up bg-white rounded-2xl border border-[#E5E2DC] p-6`} data-testid={`budget-card-${b.id}`} style={{ animationDelay: `${0.05 * i}s` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="eyebrow">{b.category}</div>
                    <div className="font-display text-2xl font-bold text-[#1E3F32] mt-1 tabular">
                      {formatRupiah(b.amount)}
                    </div>
                  </div>
                  <button onClick={() => onDelete(b.id)} className="p-2 rounded-lg hover:bg-[#C86753]/10 text-[#697A6E]" data-testid={`delete-budget-${b.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-4">
                  <div className="h-2.5 rounded-full bg-[#F0EDE5] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${over ? "bg-[#C86753]" : pct > 75 ? "bg-[#D99B58]" : "bg-[#5F8575]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className={`font-semibold ${over ? "text-[#C86753]" : "text-[#697A6E]"}`}>
                      Terpakai: {formatRupiah(spent)}
                    </span>
                    <span className="font-semibold text-[#697A6E] tabular">{pct}%</span>
                  </div>
                  {over && <div className="mt-2 text-xs text-[#C86753]">Melebihi anggaran {formatRupiah(spent - b.amount)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openAdd && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-[#1E3F32]/50 backdrop-blur-sm p-4" onClick={() => setOpenAdd(false)} data-testid="budget-dialog">
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-white rounded-3xl border border-[#E5E2DC] w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="eyebrow">Baru</div>
                <h3 className="font-display text-2xl font-bold text-[#1E3F32] mt-1">Tambah Anggaran</h3>
              </div>
              <button type="button" onClick={() => setOpenAdd(false)} className="p-1.5 rounded-lg hover:bg-[#F0EDE5] text-[#697A6E]"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="eyebrow block mb-2">Kategori</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} required data-testid="budget-category-select" className="w-full h-12 px-4 rounded-xl bg-[#F7F5F0] border border-[#E5E2DC] focus:border-[#2C3D30] outline-none">
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="eyebrow block mb-2">Jumlah (Rp)</label>
                <input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required data-testid="budget-amount-input" className="w-full h-12 px-4 rounded-xl bg-[#F7F5F0] border border-[#E5E2DC] focus:border-[#2C3D30] outline-none tabular text-lg font-semibold" />
              </div>
              <button type="submit" disabled={submitting} data-testid="budget-submit-button" className="w-full h-12 rounded-xl bg-[#2C3D30] text-white font-semibold hover:bg-[#3A5240] active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
